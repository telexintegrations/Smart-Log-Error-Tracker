const LogParser = require("../src/logParser");
const config = require("../src/config");
const fs = require("fs").promises;

async function testNginxLogParsing() {
  let exitCode = 0;
  console.log("=== Nginx Log Parser Test ===");
  console.log("Time:", new Date().toISOString());
  console.log("User:", process.env.GITHUB_ACTOR || "dax-side");

  const parser = new LogParser(config);

  try {
    // Test basic log parsing
    console.log("\nTest 1: Basic Log Parsing");
    const result = await parser.parseLogFile();
    if (!result || !result.analysis) {
      throw new Error("Failed to parse logs");
    }

    // Test error categorization
    console.log("\nTest 2: Error Categorization");
    if (!result.analysis.severity || 
        !Object.keys(result.analysis.severity).length) {
      throw new Error("Failed to categorize errors");
    }

    // Test statistics generation
    console.log("\nTest 3: Statistics Generation");
    if (!parser.stats || !parser.stats.totalChecks) {
      throw new Error("Failed to generate statistics");
    }

    const testResults = {
      timestamp: new Date().toISOString(),
      user: process.env.GITHUB_ACTOR || "dax-side",
      success: true,
      results: result,
      stats: parser.stats
    };

    await fs.writeFile(
      "test-results.json",
      JSON.stringify(testResults, null, 2)
    );

    console.log("\n✅ All tests passed!");

  } catch (error) {
    console.error("\n❌ Test failed:");
    console.error("Error details:", error.message);
    exitCode = 1;
    
    const testResults = {
      timestamp: new Date().toISOString(),
      user: process.env.GITHUB_ACTOR || "dax-side",
      success: false,
      error: {
        message: error.message,
        stack: error.stack
      }
    };

    await fs.writeFile(
      "test-results.json",
      JSON.stringify(testResults, null, 2)
    );
  }

  // Ensure clean exit
  process.exit(exitCode);
}

testNginxLogParsing();
