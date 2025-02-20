const express = require("express");
const LogParser = require("./logParser");
const config = require("./config");


function createApp() {
  const app = express();
  app.use(express.json());
  
  // Initialize log parser
  const logParser = new LogParser(config);

  // Integration JSON endpoint - Direct JSON response
  app.get("/integration.json", (req, res) => {
    const integrationData = {
      "data": {
        "date": {
          "created_at": "2025-02-20 07:11:17",
          "updated_at": "2025-02-20 07:11:17"
        },
        "descriptions": {
          "app_name": "Log Error Tracker",
          "app_description": "Monitors server logs for errors and reports them to Telex channels with real-time error detection and severity classification",
          "app_logo": "https://www.keycdn.com/img/blog/error-tracking.png",
          "app_url": "https://smart-log-error-tracker-production.up.railway.app",
          "background_color": "#FF4444"
        },
        "integration_category": "Monitoring & Logging",
        "integration_type": "interval",
        "is_active": false,
        "output": [
          {
            "label": "error_notifications",
            "value": true
          },
          {
            "label": "status_updates",
            "value": true
          }
        ],
        "key_features": [
          "Real-time log monitoring and error detection",
          "Error severity classification and filtering",
          "Configurable monitoring intervals",
          "Automated error reporting to Telex channels",
          "Multiple log file support with custom paths"
        ],
        "permissions": {
          "monitoring_user": {
            "always_online": true,
            "display_name": "Log Monitor"
          }
        },
        "settings": [
          {
            "label": "interval",
            "type": "text",
            "required": true,
            "default": "*/15 * * * *"
          },
          {
            "label": "logPath",
            "type": "text",
            "required": true,
            "default": "/var/log/nginx/error.log"
          },
          {
            "label": "errorThreshold",
            "type": "number",
            "required": true,
            "default": "1"
          },
          {
            "label": "enableNotifications",
            "type": "checkbox",
            "required": true,
            "default": "Yes"
          },
          {
            "label": "errorSeverity",
            "type": "dropdown",
            "required": true,
            "default": "Low",
            "options": ["High", "Medium", "Low"]
          },
          {
            "label": "notifyRoles",
            "type": "multi-checkbox",
            "required": true,
            "default": "DevOps",
            "options": ["DevOps", "SysAdmin", "Developer", "Manager"]
          }
        ],
        "tick_url": "https://smart-log-error-tracker-production.up.railway.app/tick",
        "target_url": "https://smart-log-error-tracker-production.up.railway.app/webhook"
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

  // Tick endpoint
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
