const LogParser = require("../src/logParser");
const config = require("../src/config");

async function testNginxLogParsing() {
  console.log("=== Nginx Log Parser Test ===");
  console.log("Time:", new Date().toISOString());
  console.log("User:", "dax-side");
  console.log("\nConfig:");
  console.log("- Log Path:", config.logPath);
  console.log("- Error Threshold:", config.errorThreshold);
  console.log("- Format Style:", config.formatStyle);

  const parser = new LogParser(config);

  try {
    console.log("\nReading nginx logs...");
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
  } catch (error) {
    console.error("\n❌ Test failed:");
    console.error("Error details:", error.message);
    console.error("Stack trace:", error.stack);
  }
}

// Run the test
testNginxLogParsing();
