const LogParser = require("../src/logParser");
const fs = require('fs').promises;
const path = require('path');

async function testNginxLogParsing() {
  const timestamp = "2025-02-19 11:36:53";
  const user = "dax-side";

  console.log("=== Nginx Log Parser Test ===");
  console.log("Time:", timestamp);
  console.log("User:", user);

  // Configuration for development server
  const config = {
    logUrl: "http://16.171.58.193/logs",
    environment: "development"
  };

  const parser = new LogParser(config);

  try {
    console.log("\nConnecting to development server...");
    console.log("Server URL:", config.logUrl);
    
    // Test live log parsing
    console.log("\nParsing live logs...");
    const result = await parser.parseLogFile();
    
    console.log("✓ Successfully connected to server");
    console.log("✓ Parsed live log data");

    // Prepare test results
    const testResults = {
      timestamp,
      user,
      server: config.logUrl,
      environment: config.environment,
      status: "success",
      result: result
    };

    // Save results to test/test-results.json
    const resultPath = path.join(__dirname, 'test-results.json');
    await fs.writeFile(
      resultPath,
      JSON.stringify(testResults, null, 2)
    );

    console.log("\n✓ Results saved to:", resultPath);
    console.log("\n=== Test Results ===");
    console.log(JSON.stringify(testResults, null, 2));

    // Exit with success
    process.exit(0);

  } catch (error) {
    console.error("\n❌ Test failed:");
    console.error("Error connecting to server:", error.message);
    
    // Save error details to test/test-results.json
    const resultPath = path.join(__dirname, 'test-results.json');
    await fs.writeFile(
      resultPath,
      JSON.stringify({
        timestamp,
        user,
        server: config.logUrl,
        status: "error",
        error: {
          message: error.message,
          stack: error.stack
        }
      }, null, 2)
    );

    console.error("\n✗ Error details saved to:", resultPath);
    // Exit with error
    process.exit(1);
  }
}

// Run the test
testNginxLogParsing();
