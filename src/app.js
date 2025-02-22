// src/app.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const config = require("./config");
const LogParser = require("./logParser");

// Import middleware and route modules
const { logger } = require("../middleware/logger");
const integrationRoutes = require("../routes/integration");
const webhookRoutes = require("../routes/webhook");
const tickRoutes = require("../routes/tick");

function createApp() {
  const app = express();

  // Apply CORS and JSON parsing middleware
  app.use(
    cors({
      origin: "https://telex.im",
      methods: ["GET", "POST"],
      allowedHeaders: ["Content-Type"],
    })
  );
  app.use(express.json());

  // Debug middleware to log requests
  app.use(logger);

  // Validate config and initialize log parser
  if (!config || !config.logUrl) {
    console.error("[2025-02-20 22:25:37] Invalid configuration:", config);
    throw new Error("Configuration missing required logUrl");
  }
  const logParser = new LogParser(config);
  // Optionally attach logParser to app.locals for access in routes if needed
  app.locals.logParser = logParser;

  // Register routes from modular files
  app.use(integrationRoutes);
  app.use(webhookRoutes);
  app.use(tickRoutes);

  return app;
}

module.exports = createApp;
