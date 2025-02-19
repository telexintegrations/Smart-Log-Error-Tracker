const path = require("path");

const config = {
  development: {
    // Use URL instead of file path
    logUrl: "http://16.171.62.147/logs",
    errorThreshold: "Low",
    formatStyle: "Detailed",
    enableStats: true,
    summaryPath: path.join(__dirname, "..", "logs", "error-summary.json"),
  },
  test: {
    // Use URL for test environment too
    logUrl: "http://16.171.62.147/logs",
    errorThreshold: "Low",
    formatStyle: "Detailed",
    enableStats: true,
    summaryPath: null,
  },
};

module.exports = config[process.env.NODE_ENV || "development"];
