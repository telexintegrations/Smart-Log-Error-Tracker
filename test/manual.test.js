const LogParser = require("../src/logParser");

async function testNginxLogParsing() {
  console.log("=== Nginx Log Parser Test ===");
  console.log("Time:", "2025-02-19 11:27:42");
  console.log("User:", "dax-side");

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

    // Output results
    console.log("\n=== Test Results ===");
    console.log(JSON.stringify({
      timestamp: "2025-02-19 11:27:42",
      user: "dax-side",
      server: config.logUrl,
      environment: config.environment,
      result: result
    }, null, 2));

    // Exit with success
    process.exit(0);

  } catch (error) {
    console.error("\n❌ Test failed:");
    console.error("Error connecting to server:", error.message);
    
    // Write error details
    const fs = require('fs').promises;
    await fs.writeFile(
      'test-results.json',
      JSON.stringify({
        timestamp: "2025-02-19 11:27:42",
        user: "dax-side",
        server: config.logUrl,
        error: {
          message: error.message,
          stack: error.stack
        }
      }, null, 2)
    );

    // Exit with error
    process.exit(1);
  }
}

// Run the test
testNginxLogParsing();
