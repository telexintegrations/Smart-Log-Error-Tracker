require("dotenv").config({ path: "../.env" });
const path = require("path");
const fs = require("fs").promises; // Add this for async file operations

// Function to validate log path accessibility
async function validateLogPath(logPath) {
  try {
    await fs.access(logPath, fs.constants.R_OK);
    return true;
  } catch (error) {
    console.error(
      `[${new Date().toISOString()}] Error accessing log file at ${logPath}: ${
        error.message
      }`
    );
    return false;
  }
}

const config = {
  development: {
    logUrl: process.env.newData,
    logPath: process.env.newPath,
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
const env = "development";

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

// Add validation for logPath
if (!currentConfig.logPath) {
  console.error(
    `[${new Date().toISOString()}] Missing logPath in ${env} configuration`
  );
  process.exit(1);
}

// Function to read the log file
async function readLogFile() {
  try {
    return await fs.readFile(currentConfig.logPath, "utf8");
  } catch (error) {
    console.error(
      `[${new Date().toISOString()}] Error reading log file: ${error.message}`
    );
    return null;
  }
}

// Log the configuration being used
console.log(`[2025-02-20 22:20:31] Using ${env} configuration:`, {
  logUrl: currentConfig.logUrl,
  logPath: currentConfig.logPath,
  errorThreshold: currentConfig.errorThreshold,
  formatStyle: currentConfig.formatStyle,
});

module.exports = {
  ...currentConfig,
  readLogFile,
  validateLogPath,
};
