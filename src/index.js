const express = require("express");
const cron = require("node-cron");
const LogParser = require("./logParser");
const config = require("./config");
const fs = require("fs").promises;
const path = require("path");

function createApp() {
  const app = express();
  const port = process.env.PORT || 3000;
  const startTime = new Date();

  // Initialize log parser
  const logParser = new LogParser(config);

  // Your existing endpoints
  app.get("/status", (req, res) => {
    const uptime = Math.floor((new Date() - startTime) / 1000);
    res.json({
      status: "running",
      uptime: uptime,
      version: require("../package.json").version,
      lastCheck: logParser.getLastCheckTime() || "No checks yet",
      stats: logParser.getStats(),
    });
  });
  // Updated endpoint for integration data from root directory
  app.get("/integration", async (req, res) => {
    try {
      const integrationPath = path.join(__dirname, "..", "integration.json");
      const integrationData = await fs.readFile(integrationPath, "utf8");
      res.json(JSON.parse(integrationData)); // Using send instead of json to preserve the exact format
    } catch (error) {
      res.status(404).json({
        error: "Integration data not found",
        details: error.message,
      });
    }
  });

  // New endpoint to get test results
  app.get("/test-results", async (req, res) => {
    try {
      const testResultsPath = path.join(
        __dirname,
        "..",
        "test",
        "test-results.json"
      );
      const testResults = await fs.readFile(testResultsPath, "utf8");
      res.json(JSON.parse(testResults));
    } catch (error) {
      res.status(404).json({
        error: "Test results not found. Please run manual.test.js first.",
        details: error.message,
      });
    }
  });

  // Your existing webhook endpoint
  app.post("/webhook", express.json(), async (req, res) => {
    const result = await logParser.parseLogFile();
    res.json(result);
  });

  // Your existing cron job
  if (process.env.NODE_ENV !== "test") {
    cron.schedule("*/15 * * * *", async () => {
      try {
        const result = await logParser.parseLogFile();
        console.log("Scheduled check completed:", result);
      } catch (error) {
        console.error("Error in scheduled check:", error);
      }
    });
  }

  return app;
}

// Only start the server if this file is run directly
if (require.main === module) {
  const app = createApp();
  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`Log Error Tracker listening at http://localhost:${port}`);
  });
}

module.exports = createApp;
