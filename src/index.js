const express = require("express");
const LogParser = require("./logParser");
const config = require("./config");
const path = require("path");  // Add this import
const fs = require("fs").promises;  // Add this import


function createApp() {
  const app = express();
  app.use(express.json());
  
  // Initialize log parser
  const logParser = new LogParser(config);

    // Integration JSON endpoint - Reading from file with proper path resolution
  app.get("/integration.json", async (req, res) => {
    try {
      // Try multiple possible paths for the integration.json file
      const possiblePaths = [
        path.join(__dirname, "integration.json"),          // /app/src/integration.json
        path.join(__dirname, "..", "integration.json"),    // /app/integration.json
        path.join(process.cwd(), "integration.json")       // Current working directory
      ];

      let integrationData = null;
      let loadedPath = null;

      // Try each path until we find the file
      for (const filePath of possiblePaths) {
        try {
          integrationData = await fs.readFile(filePath, "utf8");
          loadedPath = filePath;
          console.log("Successfully loaded integration.json from:", filePath);
          break;
        } catch (err) {
          console.log("Tried path:", filePath, "- Not found");
          continue;
        }
      }

      if (!integrationData) {
        throw new Error("integration.json not found in any expected location");
      }

      const data = JSON.parse(integrationData);
      
      // Update timestamps
      const now = "2025-02-19 23:24:50"; // Using the current UTC time you provided
      data.data.date = {
        created_at: now,
        updated_at: now
      };
      
      // Update the base URL dynamically
      const baseUrl = `http://${req.get('host')}`;
      data.data.descriptions.app_url = baseUrl;
      data.data.tick_url = `${baseUrl}/tick`;
      
      res.json(data);
    } catch (error) {
      console.error("Error reading integration.json:", error);
      res.status(404).json({
        error: "Integration configuration not found",
        details: error.message,
        searchedPaths: possiblePaths
      });
    }
  });

    // Add the webhook endpoint here
  app.post("/webhook", (req, res) => {
    console.log("Received webhook call:", {
      timestamp: new Date().toISOString(),
      body: req.body
    });

    // Acknowledge receipt of webhook
    res.status(200).json({
      status: "received",
      message: "Webhook received successfully"
    });
  });

  
  app.post("/tick", async (req, res) => {
    try {
      const payload = req.body;
      // Start processing in background
      res.status(202).json({ "status": "accepted" });
      
      // Parse logs and prepare response
      const result = await logParser.parseLogFile();
      
      // Send results back to Telex using the return_url
      const data = {
        "message": result.summary || "No new errors detected",
        "username": "Log Error Tracker",
        "event_name": "Log Check",
        "status": result.errors.length > 0 ? "error" : "success"
      };

      // Send results to Telex
      await fetch(payload.return_url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

    } catch (error) {
      console.error("Error in tick endpoint:", error);
    }
  });

  return app;
}

if (require.main === module) {
  const app = createApp();
  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`Log Error Tracker listening at http://16.171.58.193:${port}`);
  });
}

module.exports = createApp;
