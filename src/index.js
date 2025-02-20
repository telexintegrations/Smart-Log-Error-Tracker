const express = require("express");
const LogParser = require("./logParser");
const config = require("./config");

function createApp() {
  const app = express();
  app.use(express.json());
  
  // Initialize log parser
  const logParser = new LogParser(config);

  // Integration JSON endpoint following the documentation example
  app.get("/integration.json", (req, res) => {
    const integrationData = {
      "data": {
        "date": {
          "created_at": "2025-02-20 07:32:31",
          "updated_at": "2025-02-20 07:32:31"
        },
        "descriptions": {
          "app_name": "Log Error Tracker",
          "app_description": "Monitors server logs for errors and reports them to Telex channels with real-time error detection and severity classification",
          "app_url": "https://smart-log-error-tracker-production.up.railway.app",
          "app_logo": "https://www.keycdn.com/img/blog/error-tracking.png",
          "background_color": "#FF4444"
        },
        "integration_type": "interval",
        "integration_category": "Monitoring & Logging",
        "key_features": [
          "Real-time log monitoring and error detection",
          "Error severity classification and filtering",
          "Configurable monitoring intervals",
          "Automated error reporting to Telex channels",
          "Multiple log file support with custom paths"
        ],
        "settings": [
          {
            "label": "logPath",
            "type": "text",
            "required": true,
            "default": "/var/log/nginx/error.log"
          },
          {
            "label": "errorThreshold",
            "type": "text",
            "required": true,
            "default": "1"
          },
          {
            "label": "interval",
            "type": "text",
            "required": true,
            "default": "*/15 * * * *"
          }
        ],
        "tick_url": "https://smart-log-error-tracker-production.up.railway.app/tick",
        "target_url":"https://smart-log-error-tracker-production.up.railway.app/webhook"
      }
    };

    res.json(integrationData);
  });

  // Webhook endpoint
  app.post("/webhook", (req, res) => {
    console.log("Received webhook call:", {
      timestamp: new Date().toISOString(),
      body: req.body
    });

    res.status(200).json({
      status: "received",
      message: "Webhook received successfully"
    });
  });

  // Tick endpoint following the documentation example
  app.post("/tick", async (req, res) => {
    try {
      // Return 202 Accepted immediately as shown in the example
      res.status(202).json({ "status": "accepted" });
      
      // Get the payload from the request
      const payload = req.body;
      
      // Parse logs and prepare response
      const result = await logParser.parseLogFile();
      
      // Send results back to Telex using the return_url following the exact format from documentation
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
