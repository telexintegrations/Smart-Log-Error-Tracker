const fs = require("fs").promises;
const path = require("path");

class NginxLogParser {
  constructor() {
    this.errorLevels = {
      emerg: {
        level: 0,
        icon: "🔴",
        description: "Emergency - System unusable",
      },
      alert: {
        level: 1,
        icon: "🔴",
        description: "Alert - Action must be taken immediately",
      },
      crit: {
        level: 2,
        icon: "🔴",
        description: "Critical - Critical conditions",
      },
      error: { level: 3, icon: "🔴", description: "Error - Error conditions" },
      warn: {
        level: 4,
        icon: "🟡",
        description: "Warning - Warning conditions",
      },
      notice: {
        level: 5,
        icon: "🟢",
        description: "Notice - Normal but significant condition",
      },
      info: { level: 6, icon: "ℹ️", description: "Info - Informational" },
      debug: {
        level: 7,
        icon: "🔍",
        description: "Debug - Debug-level messages",
      },
    };
  }

  async parseErrorLog(logPath, threshold = 4) {
    try {
      // Ensure Windows path handling
      const normalizedPath = path.normalize(logPath);
      const content = await fs.readFile(normalizedPath, "utf8");
      const lines = content.split("\n").filter((line) => line.trim());

      const errors = lines
        .map((line) => {
          // Windows nginx log format:
          // 2025/02/18 19:05:31 [error] 14620#12040: *1 connect() failed...
          const match = line.match(
            /^(\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}:\d{2}) \[(\w+)\] (?:(\d+)#\d+: )?(.+)/
          );

          if (!match) return null;

          const [, timestamp, level, process, message] = match;
          const errorInfo =
            this.errorLevels[level] || this.errorLevels["error"];

          // Skip if error level is above threshold
          if (errorInfo.level > threshold) return null;

          return {
            timestamp: new Date(timestamp.replace("/", "-")).toISOString(),
            level,
            icon: errorInfo.icon,
            severity: errorInfo.level,
            description: errorInfo.description,
            process: process || "",
            message: message.trim(),
            raw: line,
          };
        })
        .filter((error) => error);

      return errors;
    } catch (error) {
      console.error("Error parsing nginx log:", error);
      throw error;
    }
  }

  // Add method to get summary of errors
  async getErrorSummary(logPath, threshold = 4) {
    const errors = await this.parseErrorLog(logPath, threshold);

    const summary = {
      total: errors.length,
      byLevel: {},
      latestErrors: errors.slice(-5).reverse(), // Last 5 errors
      timeRange: {
        start: errors[0]?.timestamp,
        end: errors[errors.length - 1]?.timestamp,
      },
    };

    // Group by error level
    errors.forEach((error) => {
      if (!summary.byLevel[error.level]) {
        summary.byLevel[error.level] = {
          count: 0,
          icon: error.icon,
          description: error.description,
        };
      }
      summary.byLevel[error.level].count++;
    });

    return summary;
  }
}

module.exports = NginxLogParser;
