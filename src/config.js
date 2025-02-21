const path = require("path");

const config = {
  development: {
    logUrl: "http://16.171.62.147/logs",
    logPath: "/var/log/nginx/error.log",
    errorThreshold: "Low",
    formatStyle: "Detailed",
    enableStats: true,
    summaryPath: path.join(__dirname, "..", "logs", "error-summary.json"),
  },
  test: {
    logUrl: "http://16.171.62.147/logs", // Updated to localhost
    logPath: "/var/log/nginx/error.log",
    errorThreshold: "Low",
    formatStyle: "Detailed",
    enableStats: true,
    summaryPath: null,
  },
  production: {
    logUrl: "http://16.171.62.147/logs", // Keep production as is
    logPath: "/var/log/nginx/error.log",
    errorThreshold: "Low",
    formatStyle: "Detailed",
    enableStats: true,
    summaryPath: null,
  },
};

// Get the current environment
const env = process.env.NODE_ENV || "development";

// Get the configuration for the current environment
const currentConfig = config[env];

// Validate the configuration
if (!currentConfig) {
  console.error(`[2025-02-20 22:20:31] Invalid environment: ${env}`);
  process.exit(1);
}

if (!currentConfig.logUrl) {
  console.error(`[2025-02-20 22:20:31] Missing logUrl in ${env} configuration`);
  process.exit(1);
}

// Log the configuration being used
console.log(`[2025-02-20 22:20:31] Using ${env} configuration:`, {
  logUrl: currentConfig.logUrl,
  logPath: currentConfig.logPath,
  errorThreshold: currentConfig.errorThreshold,
  formatStyle: currentConfig.formatStyle,
});

module.exports = currentConfig;
