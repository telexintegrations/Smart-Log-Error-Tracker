const LogParser = require("../src/logParser");
const config = require("../src/config");
const fs = require("fs").promises;
const path = require("path");

async function testNginxLogParsing() {
  const timestamp = "2025-02-19 12:00:45";
  const user = "dax-side";

  console.log("=== Nginx Log Parser Test ===");
  console.log("Time:", timestamp);
  console.log("User:", user);
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
    const testResults = {
      timestamp,
      user,
      config: {
        logPath: "/var/log/nginx/error.log",
        errorThreshold: config.errorThreshold,
        formatStyle: config.formatStyle,
      },
      analysisResults: result,
      parserStats: {
        totalChecks: stats.totalChecks,
        totalErrorsFound: stats.errorsFound,
        averageErrorsPerCheck: stats.averageErrorsPerCheck,
        lastCheckTime: stats.lastCheckTime,
        uptime: stats.uptime,
      }
    };

    // Create test directory if it doesn't exist
    const testDir = path.join(process.cwd(), 'test');
    await fs.mkdir(testDir, { recursive: true });

    // Save results to JSON file in test folder
    const resultPath = path.join(testDir, 'test-results.json');
    await fs.writeFile(
      resultPath,
      JSON.stringify(testResults, null, 2)
    );

    console.log("\nTest results have been saved to:", resultPath);
  } catch (error) {
    console.error("\n❌ Test failed:");
    console.error("Error details:", error.message);
    console.error("Stack trace:", error.stack);

    // Store error in JSON
    const testResults = {
      timestamp,
      user,
      error: {
        message: error.message,
        stack: error.stack,
      }
    };

    // Create test directory if it doesn't exist
    const testDir = path.join(process.cwd(), 'test');
    await fs.mkdir(testDir, { recursive: true });

    // Save error results to JSON file in test folder
    const resultPath = path.join(testDir, 'test-results.json');
    await fs.writeFile(
      resultPath,
      JSON.stringify(testResults, null, 2)
    );

    console.error("\n✗ Error details saved to:", resultPath);
  }
}

// Run the test
testNginxLogParsing();
