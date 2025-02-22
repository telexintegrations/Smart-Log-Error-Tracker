// routes/tick.js
const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");

// POST /tick endpoint
router.post("/tick", async (req, res) => {
  let payload;
  try {
    // Immediately return 202 Accepted
    res.status(202).json({ status: "accepted" });
    payload = req.body;

    // Read test results from file
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

    // Display test results in the terminal
    console.log("\n========== TEST RESULTS START ==========");
    console.log(testResults);
    console.log("=========== TEST RESULTS END ===========\n");

    // Send results to Telex
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
          config: require("../src/config"),
          source: "test-results.txt",
        },
      }),
    });

    console.log(`[2025-02-20 23:05:51] Completed log check using test results`);
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
              config: require("../config"),
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

module.exports = router;
