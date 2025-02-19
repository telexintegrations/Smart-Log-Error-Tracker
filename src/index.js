const express = require("express");
const LogParser = require("./logParser");
const config = require("./config");

function createApp() {
  const app = express();
  app.use(express.json());
  
  // Initialize log parser
  const logParser = new LogParser(config);

  // Integration JSON endpoint - Following Telex format
  app.post("/integration.json", (req, res) => {
    const baseUrl = `http://${req.get('host')}`;
    res.json({
      "data": {
        "descriptions": {
          "app_name": "Log Error Tracker",
          "app_description": "Monitors server logs for errors and reports them to Telex channels",
          "app_logo": "https://www.keycdn.com/img/blog/error-tracking.png",
          "app_url": baseUrl,
          "background_color": "#FF4444"
        },
        "integration_type": "interval",
        "settings": [
          {
            "label": "logPath",
            "type": "text",
            "required": true,
            "default": "/var/log/nginx/error.log",
            "description": "Path to the log file to monitor"
          },
          {
            "label": "errorThreshold",
            "type": "number",
            "required": true,
            "default": "1",
            "description": "Minimum error severity level to report"
          },
          {
            "label": "interval",
            "type": "text",
            "required": true,
            "default": "*/15 * * * *",
            "description": "Check interval (crontab format)"
          }
        ],
        "tick_url": `${baseUrl}/tick`
      }
    });
  });

  // Tick endpoint for interval-based checks
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
