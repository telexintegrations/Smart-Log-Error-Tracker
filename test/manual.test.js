const LogParser = require("../src/logParser");
const config = require("../src/config");
const fs = require("fs").promises;

async function testNginxLogParsing() {
  console.log("=== Nginx Log Parser Test ===");
  console.log("Time:", new Date().toISOString());
  console.log("User:", "dax-side");
  console.log("\nConfig:");
  console.log("- Log URL:", config.logUrl);
  console.log("- Error Threshold:", config.errorThreshold);
  console.log("- Format Style:", config.formatStyle);

  const parser = new LogParser(config);

  try {
    console.log("\nFetching nginx logs...");
    const result = await parser.parseLogFile();

    console.log("\n=== Analysis Results ===");
    console.log(result.message);

    console.log("\n=== Parser Stats ===");
    const stats = parser.getStats();
    console.log("Total Checks:", stats.totalChecks);
    console.log("Total Errors Found:", stats.errorsFound);
    console.log("Average Errors/Check:", stats.averageErrorsPerCheck);
    console.log("Last Check:", stats.lastCheckTime.toISOString());
    console.log("Uptime (seconds):", stats.uptime);

    // Store all results in a JSON structure
    testResults = {
      config: {
        logPath: "/var/log/nginx/error.log", // Updated path
        errorThreshold: config.errorThreshold,
        formatStyle: config.formatStyle,
      },
      analysisResults: {
        message: result.message,
        type: result.type,
      },
      parserStats: {
        totalChecks: stats.totalChecks,
        totalErrorsFound: stats.errorsFound,
        averageErrorsPerCheck: stats.averageErrorsPerCheck,
        lastCheckTime: stats.lastCheckTime,
        uptime: stats.uptime,
      },
    };

    // Save results to JSON file
    await fs.writeFile(
      "test-results.json",
      JSON.stringify(testResults, null, 2)
    );

    console.log("\nTest results have been saved to test-results.json");
  } catch (error) {
    console.error("\n❌ Test failed:");
    console.error("Error details:", error.message);
    console.error("Stack trace:", error.stack);

    // Store error in JSON
    testResults.error = {
      message: error.message,
      stack: error.stack,
    };

    await fs.writeFile(
      "test-results.json",
      JSON.stringify(testResults, null, 2)
    );
  }
}

// Run the test
testNginxLogParsing();
