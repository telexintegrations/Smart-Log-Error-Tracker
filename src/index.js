const express = require("express");
const LogParser = require("./logParser");
const config = require("./config");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

function createApp() {
  const app = express();

  // Add CORS middleware
  app.use(
    cors({
      origin: "https://telex.im",
      methods: ["GET", "POST"],
      allowedHeaders: ["Content-Type"],
    })
  );

  app.use(express.json());

  // Debug middleware to log requests
  app.use((req, res, next) => {
    console.log(`[2025-02-20 22:25:37] ${req.method} ${req.path}`);
    console.log("Config:", config);
    next();
  });

  // Helper function to transform settings array to object
  function transformSettings(settingsArray) {
    if (!Array.isArray(settingsArray)) return {};

    return settingsArray.reduce((acc, setting) => {
      if (setting.label && setting.default) {
        acc[setting.label] = setting.default;
      }
      return acc;
    }, {});
  }

  // Initialize log parser with config validation
  if (!config || !config.logUrl) {
    console.error("[2025-02-20 22:25:37] Invalid configuration:", config);
    throw new Error("Configuration missing required logUrl");
  }

  const logParser = new LogParser(config);

  app.get("/integration.json", (req, res) => {
    const integrationData = {
      data: {
        date: {
          created_at: "2025-02-20 22:25:37",
          updated_at: "2025-02-20 22:25:37",
        },
        descriptions: {
          app_description:
            "Monitors server logs for errors and reports them to Telex channels with real-time error detection and severity classification",
          app_logo: "https://www.keycdn.com/img/blog/error-tracking.png",
          app_name: "Log Error Tracker",
          app_url: "https://smart-log-error-tracker-production.up.railway.app", // Updated to local development URL
          background_color: "#FF4444",
        },
        integration_category: "Monitoring & Logging",
        integration_type: "interval",
        is_active: true,
        output: [
          {
            label: "error_notifications",
            value: true,
          },
        ],
        key_features: [
          "Real-time log monitoring and error detection",
          "Error severity classification and filtering",
          "Configurable monitoring intervals",
          "Automated error reporting to Telex channels",
          "Multiple log file support with custom paths",
        ],
        settings: [
          {
            label: "logPath",
            type: "text",
            required: true,
            default: "/var/log/nginx/error.log",
          },
          {
            label: "errorThreshold",
            type: "text",
            required: true,
            default: "1",
          },
          {
            label: "interval",
            type: "text",
            required: true,
            default: "*/15 * * * *",
          },
        ],
        tick_url:
          "https://smart-log-error-tracker-production.up.railway.app/tick", // Updated to local development URL
        target_url:
          "https://smart-log-error-tracker-production.up.railway.app/webhook", // Updated to local development URL
      },
    };

    res.json(integrationData);
  });

  app.post("/webhook", (req, res) => {
    console.log("[2025-02-20 22:25:37] Received webhook call:", {
      body: req.body,
    });

    res.status(200).json({
      status: "received",
      message: "Webhook received successfully",
    });
  });

  app.post("/tick", async (req, res) => {
    let payload;
    try {
      // 1. Immediately return 202 Accepted
      res.status(202).json({ status: "accepted" });

      payload = req.body;

      // 2. Read and display test results from txt file
      const testResultsPath = path.join(
        __dirname,
        "..",
        "test",
        "test-results.txt"
      );
      console.log(
        `[2025-02-20 23:05:51] Reading test results from: ${testResultsPath}`
      );

      if (!fs.existsSync(testResultsPath)) {
        throw new Error(
          `Test results file not found at ${testResultsPath}. Please run manual.test.js first.`
        );
      }

      const testResults = await fs.promises.readFile(testResultsPath, "utf8");

      // Display the content in the terminal with a nice format
      console.log("\n========== TEST RESULTS START ==========");
      console.log(testResults);
      console.log("=========== TEST RESULTS END ===========\n");

      // 3. Send results to Telex
      await fetch(payload.return_url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "Log-Error-Tracker/1.0.0",
        },
        body: JSON.stringify({
          message: testResults,
          username: "Log Error Tracker",
          event_name: "Log Check",
          status: testResults.includes("Error") ? "error" : "info",
          timestamp: "2025-02-20 23:05:51",
          performed_by: "dax-side",
          metadata: {
            config: config,
            source: "test-results.txt",
          },
        }),
      });

      console.log(
        `[2025-02-20 23:05:51] Completed log check using test results`
      );
    } catch (error) {
      console.error("[2025-02-20 23:05:51] Error in tick endpoint:", error);

      if (payload?.return_url) {
        try {
          await fetch(payload.return_url, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "User-Agent": "Log-Error-Tracker/1.0.0",
            },
            body: JSON.stringify({
              message: `❌ Error checking logs: ${error.message}`,
              username: "Log Error Tracker",
              event_name: "Log Check Error",
              status: "error",
              timestamp: "2025-02-20 23:05:51",
              performed_by: "dax-side",
              metadata: {
                error: error.message,
                config: config,
              },
            }),
          });
        } catch (notifyError) {
          console.error(
            "[2025-02-20 23:05:51] Failed to notify Telex:",
            notifyError
          );
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
    console.log(
      `[2025-02-20 22:25:37] Log Error Tracker started on port ${port}`
    );
    console.log("Configuration:", config);
  });
}

module.exports = createApp;
