const express = require("express");
const LogParser = require("./logParser");
const config = require("./config");

function createApp() {
  const app = express();
  app.use(express.json());
  
  // Initialize log parser
  const logParser = new LogParser(config);

  // Integration JSON endpoint - Following Telex format
  // Change this from POST to GET
// Updated endpoint for integration.json
app.get("/integration.json", async (req, res) => {
  try {
    const integrationPath = path.join(__dirname, "..", "integration.json");
    const integrationData = await fs.readFile(integrationPath, "utf8");
    const data = JSON.parse(integrationData);
    
    // Update the base URL dynamically
    const baseUrl = `http://${req.get('host')}`;
    data.data.descriptions.app_url = baseUrl;
    data.data.tick_url = `${baseUrl}/tick`;
    
    res.json(data);
  } catch (error) {
    res.status(404).json({
      error: "Integration configuration not found",
      details: error.message,
    });
  }
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
