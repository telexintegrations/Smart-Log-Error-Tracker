const NginxLogParser = require("./nginxParser");

async function testParser() {
  const parser = new NginxLogParser();
  const logPath = "C:\\nginx-1.27.4\\logs\\error.log";

  try {
    const summary = await parser.getErrorSummary(logPath, 4);
    console.log("Error Summary:", JSON.stringify(summary, null, 2));
  } catch (error) {
    console.error("Test failed:", error);
  }
}

testParser();
