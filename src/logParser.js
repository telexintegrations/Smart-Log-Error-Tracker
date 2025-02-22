// src/logParser.js
const logAnalysis = require("./logAnalysis");
const { fetchLogData } = require("./logFetcher");
const { formatForTelex } = require("./telexFormatter");
const { parseLogLine } = require("./lineParser");
const http = require("http");
const https = require("https");

class LogParser {
  constructor(config) {
    if (!config) {
      throw new Error("LogParser requires a configuration object");
    }
    if (!config.logUrl) {
      throw new Error("Configuration missing required logUrl parameter");
    }
    if (!config.logPath) {
      throw new Error("Configuration missing required logPath parameter");
    }
    this.config = config;

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
  }

  async fetchRemoteLogFile() {
    const logUrl = new URL(this.config.logPath, this.config.logUrl).href;

    return new Promise((resolve, reject) => {
      const request = (logUrl.startsWith("https") ? https : http).get(
        logUrl,
        (response) => {
          if (response.statusCode !== 200) {
            reject(
              new Error(`Failed to fetch logs: HTTP ${response.statusCode}`)
            );
            return;
          }

          let data = "";
          response.on("data", (chunk) => (data += chunk));
          response.on("end", () => resolve(data));
        }
      );

      request.on("error", (error) => {
        reject(new Error(`Failed to fetch remote logs: ${error.message}`));
      });

      request.end();
    });
  }

  async parseLogFile() {
    try {
      console.log(
        `[${new Date().toISOString()}] Fetching logs from: ${
          this.config.logUrl
        }${this.config.logPath}`
      );

      let logData;
      try {
        logData = await this.fetchRemoteLogFile();
      } catch (error) {
        console.log(
          `[${new Date().toISOString()}] Failed to fetch log file directly, falling back to URL fetch: ${
            this.config.logUrl
          }`
        );
        logData = await fetchLogData(this.config.logUrl);
      }

      console.log(
        `[${new Date().toISOString()}] Received ${
          logData.length
        } bytes of log data`
      );

      const lines = logData.split("\n").filter((line) => line.trim());
      const errors = lines
        .map((line) => parseLogLine(line))
        .filter((error) => error !== null);

      this.updateStats(errors);

      const result = formatForTelex(errors, this.config, logAnalysis);
      console.log(
        `[${new Date().toISOString()}] Analysis complete. Found ${
          errors.length
        } errors`
      );

      return result;
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Error parsing log file:`, {
        message: error.message,
        config: {
          logUrl: this.config.logUrl,
          logPath: this.config.logPath,
          errorThreshold: this.config.errorThreshold,
        },
        error: error.stack,
      });
      throw new Error(`Failed to parse logs: ${error.message}`);
    }
  }

  // Your existing methods remain unchanged
  updateStats(errors) {
    // ... existing updateStats code ...
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
}

module.exports = LogParser;
