const LogParser = require("../src/logParser");
const config = require("../src/config");
const fs = require("fs").promises;
const path = require("path");

async function testNginxLogParsing() {
  const timestamp = "2025-02-20 23:01:06";
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

    // Create the test output as text
    const testOutput = [
      "=== Nginx Log Analysis Results ===",
      `Time: ${timestamp}`,
      `User: ${user}`,
      "",
      "Analysis Results:",
      result.message,
      "",
      "=== End of Report ===",
    ].join("\n");

    // Save to txt file
    const testDir = path.join(__dirname);
    await fs.mkdir(testDir, { recursive: true });
    const resultPath = path.join(testDir, "test-results.txt");
    await fs.writeFile(resultPath, testOutput);

    console.log("\nTest results have been saved to:", resultPath);
  } catch (error) {
    console.error("\n❌ Test failed:");
    const errorOutput = [
      "=== Nginx Log Analysis Error ===",
      `Time: ${timestamp}`,
      `User: ${user}`,
      "",
      "Error Details:",
      error.message,
      "",
      "=== End of Error Report ===",
    ].join("\n");

    // Save error to txt file
    const testDir = path.join(__dirname);
    await fs.mkdir(testDir, { recursive: true });
    const resultPath = path.join(testDir, "test-results.txt");
    await fs.writeFile(resultPath, errorOutput);

    console.error("\n✗ Error details saved to:", resultPath);
  }
}

// Run the test
testNginxLogParsing();
