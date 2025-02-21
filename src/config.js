const path = require("path");
const readline = require("readline");
const https = require("https");
const http = require("http");

// Get current timestamp
function getCurrentTimestamp() {
  return "2025-02-21 10:29:46";
}

// Function to prompt for server URL
async function promptForServer() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const url = await new Promise((resolve) => {
    rl.question(
      "Please enter your server URL (e.g., http://example.com): ",
      (url) => {
        rl.close();
        // Remove trailing slash if present
        url = url.endsWith("/") ? url.slice(0, -1) : url;
        resolve(url.trim());
      }
    );
  });

  // Validate URL format
  try {
    new URL(url);
    return url;
  } catch (e) {
    throw new Error(`Invalid URL format: ${url}`);
  }
}

// Function to validate server URL
async function validateServer(url) {
  if (!url) return false;

  return new Promise((resolve) => {
    const client = url.startsWith("https") ? https : http;
    const testUrl = url.endsWith("/logs") ? url : `${url}/logs`;

    console.log(`[${getCurrentTimestamp()}] Validating server URL: ${testUrl}`);

    client
      .get(testUrl, (res) => {
        if (res.statusCode === 200) {
          resolve(true);
        } else {
          console.error(
            `[${getCurrentTimestamp()}] Server validation failed: ${
              res.statusCode
            }`
          );
          resolve(false);
        }
      })
      .on("error", (err) => {
        console.error(
          `[${getCurrentTimestamp()}] Server validation error:`,
          err.message
        );
        resolve(false);
      });
  });
}

// Base configuration
// In the base configuration, remove the default serverUrl
const config = {
  development: {
    serverUrl: null, // Remove default, force prompt
    logPath: "/var/log/nginx/error.log",
    errorThreshold: "Low",
    formatStyle: "Detailed",
    enableStats: true,
    summaryPath: path.join(__dirname, "..", "logs", "error-summary.json"),
    lastUpdated: getCurrentTimestamp(),
    updatedBy: "dax-side",
  },
  test: {
    serverUrl: null, // Remove default, force prompt
    logPath: "/var/log/nginx/error.log",
    errorThreshold: "Low",
    formatStyle: "Detailed",
    enableStats: true,
    summaryPath: null,
    lastUpdated: getCurrentTimestamp(),
    updatedBy: "dax-side",
  },
  production: {
    serverUrl: null, // Remove default, force prompt
    logPath: "/var/log/nginx/error.log",
    errorThreshold: "Low",
    formatStyle: "Detailed",
    enableStats: true,
    summaryPath: null,
    lastUpdated: getCurrentTimestamp(),
    updatedBy: "dax-side",
  },
};
// Get the current environment
const env = process.env.NODE_ENV || "development";

// Get the configuration for the current environment
const currentConfig = config[env];

// Main configuration initialization
async function initializeConfig() {
  // Validate the configuration
  if (!currentConfig) {
    console.error(`[${getCurrentTimestamp()}] Invalid environment: ${env}`);
    process.exit(1);
  }

  // Always prompt for server URL
  console.log(
    `[${getCurrentTimestamp()}] Please provide the server URL for log analysis.`
  );
  const serverUrl = await promptForServer();

  if (await validateServer(serverUrl)) {
    currentConfig.serverUrl = serverUrl;
    currentConfig.logUrl = `${serverUrl}/logs`;
    currentConfig.lastUpdated = getCurrentTimestamp();
    currentConfig.updatedBy = "dax-side";
    console.log(
      `[${getCurrentTimestamp()}] Server URL configured successfully:`,
      serverUrl
    );
  } else {
    throw new Error("Invalid server URL. Please provide a valid server URL.");
  }

  // Log the configuration being used
  console.log(`[${getCurrentTimestamp()}] Using ${env} configuration:`, {
    serverUrl: currentConfig.serverUrl,
    logUrl: currentConfig.logUrl,
    logPath: currentConfig.logPath,
    errorThreshold: currentConfig.errorThreshold,
    formatStyle: currentConfig.formatStyle,
    lastUpdated: currentConfig.lastUpdated,
    updatedBy: currentConfig.updatedBy,
  });

  return currentConfig;
}

module.exports = async () => {
  const initializedConfig = await initializeConfig();
  return initializedConfig;
};
