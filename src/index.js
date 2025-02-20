const express = require("express");
const LogParser = require("./logParser");
const config = require("./config");
const cors = require('cors'); // Add this line

function createApp() {
  const app = express();
  
  // Add CORS middleware before other middleware
  app.use(cors({
    origin: 'https://telex.im',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type']
  }));
  
  app.use(express.json());
  
  // Initialize log parser
  const logParser = new LogParser(config);

  // Integration JSON endpoint following the documentation example
  app.get("/integration.json", (req, res) => {
    const integrationData = {
      "data": {
        "isActive": true,
        "date": {
          "created_at": "2025-02-20 18:11:26",
          "updated_at": "2025-02-20 18:11:26"
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

  // Tick endpoint - This is called periodically by Telex to check for new log errors
app.post("/tick", async (req, res) => {
  try {
    // 1. Immediately return 202 Accepted as required by Telex
    res.status(202).json({ "status": "accepted" });
    
    // 2. Get the configuration from the request body
    const payload = req.body;
    const settings = payload.settings || {};
    
    // 3. Extract settings with defaults
    const logPath = settings.logPath || "/var/log/nginx/error.log";
    const errorThreshold = parseInt(settings.errorThreshold || "1");
    // Note: interval is handled by Telex, we don't need to process it here
    
    // 4. Parse logs and get results
    const result = await logParser.parseLogFile(logPath);
    
    // 5. Prepare the message based on results
    let message, status;
    if (result.errors.length >= errorThreshold) {
      message = `⚠️ Found ${result.errors.length} error(s) in log:\n` + 
                result.errors.map(error => 
                  `- [${error.severity}] ${error.message}`
                ).join('\n');
      status = "error";
    } else {
      message = "✅ No critical errors found in logs";
      status = "success";
    }

    // 6. Send results back to Telex
    await fetch(payload.return_url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Log-Error-Tracker/1.0.0'
      },
      body: JSON.stringify({
        "message": message,
        "username": "Log Error Tracker",
        "event_name": "Log Check",
        "status": status,
        "timestamp": "2025-02-20 20:21:02", // Current UTC time
        "performed_by": "dax-side"
      })
    });

    console.log(`Completed log check at ${new Date().toISOString()}`);

  } catch (error) {
    console.error("Error in tick endpoint:", error);
    
    // Even if we encounter an error, try to notify Telex
    if (req.body && req.body.return_url) {
      try {
        await fetch(req.body.return_url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Log-Error-Tracker/1.0.0'
          },
          body: JSON.stringify({
            "message": `❌ Error checking logs: ${error.message}`,
            "username": "Log Error Tracker",
            "event_name": "Log Check Error",
            "status": "error",
            "timestamp": "2025-02-20 20:21:02",
            "performed_by": "dax-side"
          })
        });
      } catch (notifyError) {
        console.error("Failed to notify Telex of error:", notifyError);
      }
    }
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
