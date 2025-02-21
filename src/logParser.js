const axios = require("axios");
const fs = require("fs").promises;
const path = require("path");

class LogParser {
  constructor(config) {
    if (!config) {
      throw new Error("LogParser requires a configuration object");
    }

    if (!config.logUrl) {
      throw new Error("Configuration missing required logUrl parameter");
    }

    this.config = config;

    // Log initialization
    console.log(
      `[${new Date().toISOString()}] LogParser initialized with URL: ${
        this.config.logUrl
      }`
    );

    this.lastCheckTime = null;
    this.stats = {
      totalChecks: 0,
      errorsFound: 0,
      startTime: new Date(),
      lastCheckTime: null,
      averageErrorsPerCheck: "0",
      errorTrends: {
        lastHour: 0,
        lastDay: 0,
      },
    };

    this.severityMap = {
      emerg: { level: 7, label: "EMERGENCY", icon: "🔴" },
      alert: { level: 6, label: "ALERT", icon: "🔴" },
      crit: { level: 5, label: "CRITICAL", icon: "🔴" },
      error: { level: 4, label: "ERROR", icon: "🔴" },
      warn: { level: 3, label: "WARN", icon: "🟡" },
      notice: { level: 2, label: "NOTICE", icon: "🟢" },
      info: { level: 1, label: "INFO", icon: "ℹ️" },
      debug: { level: 0, label: "DEBUG", icon: "🔍" },
    };
  }

  updateStats(errors) {
    this.stats.totalChecks++;
    this.stats.errorsFound += errors.length;
    this.stats.lastCheckTime = new Date();
    this.stats.averageErrorsPerCheck = (
      this.stats.errorsFound / this.stats.totalChecks
    ).toFixed(2);

    // Update trend statistics
    const trends = this.analyzeTrends(errors);
    this.stats.errorTrends = {
      lastHour: trends.lastHour,
      lastDay: trends.lastDay,
      trend: trends.trend,
      averagePerHour: trends.averagePerHour,
    };
  }

  getSeverityFromWord(word) {
    return (
      this.severityMap[word.toLowerCase()] || {
        level: 0,
        label: "UNKNOWN",
        icon: "❓",
      }
    );
  }

  parseLogLine(line) {
    const regex =
      /^(\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}:\d{2}) \[(\w+)\] (?:(\d+)#\d+: )?(.+)/;
    const match = line.match(regex);

    if (!match) return null;

    const [, timestamp, severityWord, processId, message] = match;
    const severity = this.getSeverityFromWord(severityWord);

    return {
      timestamp,
      severity: severity.level,
      severityLabel: severity.label,
      icon: severity.icon,
      message: message.trim(),
      processInfo: processId ? `Process ${processId}` : "",
      rawLine: line,
    };
  }

  filterRecentErrors(errors, hours = 24) {
    const now = new Date();
    const hoursAgo = new Date(now - hours * 60 * 60 * 1000);

    return errors.filter((error) => {
      const errorDate = new Date(error.timestamp.replace(/\//g, "-"));
      return errorDate > hoursAgo;
    });
  }

  filterBySeverity(errors, minSeverity = "error") {
    const severityLevels = {
      emergency: 7,
      alert: 6,
      critical: 5,
      error: 4,
      warning: 3,
      notice: 2,
      info: 1,
      debug: 0,
    };

    const threshold = severityLevels[minSeverity.toLowerCase()] || 4;
    return errors.filter((error) => error.severity >= threshold);
  }

  analyzeTrends(errors) {
    const now = new Date();
    const hourAgo = new Date(now - 60 * 60 * 1000);
    const dayAgo = new Date(now - 24 * 60 * 60 * 1000);

    const errorsLastHour = this.filterRecentErrors(errors, 1).length;
    const errorsLastDay = this.filterRecentErrors(errors, 24).length;

    return {
      lastHour: errorsLastHour,
      lastDay: errorsLastDay,
      trend: errorsLastHour > errorsLastDay / 24 ? "increasing" : "stable",
      averagePerHour: (errorsLastDay / 24).toFixed(2),
    };
  }

  analyzeUrlPatterns(errors) {
    const urlPattern = /request: "([^"]+)"/;
    const failedUrls = errors
      .filter((e) => e.message.includes("request:"))
      .map((e) => {
        const match = e.message.match(urlPattern);
        return match ? match[1] : null;
      })
      .filter((url) => url);

    return {
      uniqueUrls: [...new Set(failedUrls)],
      mostCommon: this.getMostFrequent(failedUrls),
    };
  }

  getMostFrequent(arr) {
    return [
      ...arr.reduce(
        (map, item) => map.set(item, (map.get(item) || 0) + 1),
        new Map()
      ),
    ]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([url, count]) => ({ url, count }));
  }

  analyzeUpstreamStatus(errors) {
    const upstreamErrors = errors.filter((e) => e.message.includes("upstream"));
    const services = new Map();

    upstreamErrors.forEach((error) => {
      const match = error.message.match(/upstream: "([^"]+)"/);
      if (match) {
        try {
          const url = new URL(match[1]);
          const host = url.host;
          if (!services.has(host)) {
            services.set(host, {
              failures: 0,
              lastError: null,
              urls: new Set(),
            });
          }
          const service = services.get(host);
          service.failures++;
          service.lastError = error.timestamp;
          service.urls.add(url.pathname);
        } catch (e) {
          // Invalid URL, skip
        }
      }
    });

    return {
      total: upstreamErrors.length,
      services: Array.from(services.entries()).map(([host, data]) => ({
        host,
        failures: data.failures,
        lastError: data.lastError,
        affectedPaths: Array.from(data.urls),
      })),
    };
  }

  categorizeErrors(errors) {
    return {
      connection: errors.filter((e) => {
        const msg = e.message.toLowerCase();
        return (
          msg.includes("connect() failed") ||
          msg.includes("connection refused") ||
          msg.includes("upstream") ||
          msg.includes("proxy")
        );
      }),
      filesystem: errors.filter((e) => {
        const msg = e.message.toLowerCase();
        return (
          msg.includes("createfile()") ||
          msg.includes("file not found") ||
          msg.includes("cannot find the path")
        );
      }),
      process: errors.filter((e) => {
        const msg = e.message.toLowerCase();
        return (
          msg.includes("signal process") ||
          msg.includes("pid") ||
          msg.includes("worker process")
        );
      }),
      other: errors.filter((e) => {
        const msg = e.message.toLowerCase();
        return (
          !msg.includes("connect() failed") &&
          !msg.includes("createfile()") &&
          !msg.includes("signal process")
        );
      }),
    };
  }

  async parseLogFile() {
    try {
      if (!this.config.logUrl) {
        throw new Error("LogUrl is not configured");
      }

      console.log(
        `[2025-02-20 21:26:49] Fetching logs from: ${this.config.logUrl}`
      );

      const response = await axios.get(this.config.logUrl, {
        timeout: 5000,
        headers: {
          "User-Agent": "Log-Error-Tracker/1.0.0",
          Accept: "text/plain",
        },
        validateStatus: (status) => status === 200,
        retry: 3,
        retryDelay: 1000,
      });

      if (!response.data) {
        throw new Error("No log data received from server");
      }

      const logData = response.data;
      console.log(
        `[2025-02-20 21:26:49] Received ${logData.length} bytes of log data`
      );

      const lines = logData.split("\n").filter((line) => line.trim());
      const errors = lines
        .map((line) => this.parseLogLine(line))
        .filter((error) => error !== null);

      this.updateStats(errors);

      const result = this.formatForTelex(errors);
      console.log(
        `[2025-02-20 21:26:49] Analysis complete. Found ${errors.length} errors`
      );

      return result;
    } catch (error) {
      console.error(`[2025-02-20 21:26:49] Error parsing log file:`, {
        message: error.message,
        config: {
          logUrl: this.config.logUrl,
          errorThreshold: this.config.errorThreshold,
        },
        error: error.stack,
      });

      throw new Error(`Failed to parse logs: ${error.message}`);
    }
  }

  getStats() {
    return {
      ...this.stats,
      uptime: Math.floor((new Date() - this.stats.startTime) / 1000),
    };
  }

  getLastCheckTime() {
    return this.stats.lastCheckTime;
  }

  formatForTelex(errors) {
    if (errors.length === 0) {
      return {
        message: `[2025-02-20 21:26:49] No new errors found in nginx logs.\nMonitored URL: ${this.config.logUrl}`,
        type: "info",
      };
    }
    const recentErrors = this.filterRecentErrors(errors, 24);
    const trends = this.analyzeTrends(errors);
    const errorCategories = this.categorizeErrors(recentErrors);
    const urlAnalysis = this.analyzeUrlPatterns(recentErrors);
    const upstreamStatus = this.analyzeUpstreamStatus(recentErrors);

    const summary = {
      emergency: recentErrors.filter((e) => e.severityLabel === "EMERGENCY")
        .length,
      error: recentErrors.filter((e) => e.severityLabel === "ERROR").length,
      warning: recentErrors.filter((e) => e.severityLabel === "WARN").length,
      notice: recentErrors.filter((e) => e.severityLabel === "NOTICE").length,
    };

    const formatDetailed = (error) =>
      `${error.icon} [${error.severityLabel}] ${error.timestamp} - ${error.processInfo} ${error.message}`;

    const mostRecentErrors = [
      ...errorCategories.connection.slice(-2),
      ...errorCategories.filesystem.slice(-1),
      ...errorCategories.other.slice(-1),
    ];

    const trendIndicator =
      trends.trend === "increasing"
        ? "⚠️ Error rate increasing!"
        : "✅ Error rate stable";
    const errorRate = `Average errors per hour: ${trends.averagePerHour}`;

    const messageArray = [
      "🔍 Nginx Log Analysis Report:",
      `Time: ${new Date().toISOString()}`,
      "",
      "Error Trends:",
      trendIndicator,
      `Last Hour: ${trends.lastHour} errors`,
      `Last 24 Hours: ${trends.lastDay} errors`,
      errorRate,
      "",
      `Found ${recentErrors.length} errors in last 24 hours (${errors.length} total):`,
      `🔴 Emergency/Critical: ${summary.emergency}`,
      `🔴 Error: ${summary.error}`,
      `🟡 Warning: ${summary.warning}`,
      `🟢 Notice: ${summary.notice}`,
      "",
      "Error Categories:",
      `- Connection Issues: ${errorCategories.connection.length}`,
      `- Filesystem Issues: ${errorCategories.filesystem.length}`,
      `- Process Signals: ${errorCategories.process.length}`,
      `- Other Issues: ${errorCategories.other.length}`,
    ];

    if (urlAnalysis.uniqueUrls.length > 0) {
      messageArray.push(
        "",
        "Failed URLs:",
        ...urlAnalysis.mostCommon.map(
          ({ url, count }) => `- ${url} (${count} times)`
        )
      );
    }

    if (upstreamStatus.services.length > 0) {
      messageArray.push(
        "",
        "Upstream Service Issues:",
        ...upstreamStatus.services.map(
          (service) =>
            `- ${service.host}: ${service.failures} failures, last error at ${service.lastError}`
        )
      );
    }

    messageArray.push(
      "",
      "Most Recent Errors:",
      ...mostRecentErrors.map(formatDetailed),
      "",
      "Note: Showing most recent errors from each category."
    );

    return {
      message: messageArray.join("\n"),
      type: errorCategories.connection.length > 0 ? "error" : "info",
    };
  }
}

module.exports = LogParser;
