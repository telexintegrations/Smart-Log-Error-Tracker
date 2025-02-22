// routes/integration.js
// require("dotenv").config({ path: "../.env" });
const express = require("express");
const router = express.Router();

router.get("/integration.json", (req, res) => {
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
        app_url: "https://smart-log-error-tracker-production.up.railway.app",
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
          label: "logUrl",
          type: "text",
          required: true,
          default: process.env.newData,
        },
        {
          label: "logPath",
          type: "text",
          required: true,
          default: process.env.newPath,
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
        "https://smart-log-error-tracker-production.up.railway.app/tick",
      target_url:
        "https://smart-log-error-tracker-production.up.railway.app/webhook",
    },
  };

  res.json(integrationData);
});

module.exports = router;
