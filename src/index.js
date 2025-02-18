const express = require("express");
const cron = require("node-cron");
const LogParser = require("./logParser");
const config = require("./config");

function createApp() {
  const app = express();
  const port = process.env.PORT || 3000;
  const startTime = new Date();

  // Initialize log parser
  const logParser = new LogParser(config);

  // Add status endpoint
  app.get("/status", (req, res) => {
    const uptime = Math.floor((new Date() - startTime) / 1000); // in seconds
    res.json({
      status: "running",
      uptime: uptime,
      version: require("../package.json").version,
      lastCheck: logParser.getLastCheckTime() || "No checks yet",
      stats: logParser.getStats(),
    });
  });

  // Setup Telex webhook endpoint
  app.post("/webhook", express.json(), async (req, res) => {
    const result = await logParser.parseLogFile();
    res.json(result);
  });

  // Setup interval check (every 15 minutes)
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
