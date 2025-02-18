const path = require("path");

const config = {
  development: {
    // Point to actual nginx error log
    logPath: "C:\\nginx-1.27.4\\logs\\error.log",
    errorThreshold: "Low",
    formatStyle: "Detailed",
    enableStats: true,
    summaryPath: path.join(__dirname, "..", "logs", "error-summary.json"),
  },
  test: {
    // Keep test config for running tests
    logPath: "C:\\nginx-1.27.4\\logs\\error.log",
    errorThreshold: "Low",
    formatStyle: "Detailed",
    enableStats: true,
    summaryPath: null,
  },
};

module.exports = config[process.env.NODE_ENV || "development"];
