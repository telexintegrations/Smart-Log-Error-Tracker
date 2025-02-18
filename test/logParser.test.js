const LogParser = require("../src/logParser");
const path = require("path");
const fs = require("fs").promises;


describe("LogParser with Nginx logs", () => {
  const nginxLogPath = "C:\\nginx-1.27.4\\logs\\error.log";

  const testConfig = {
    logPath: nginxLogPath,
    errorThreshold: "Low",
    formatStyle: "Detailed",
    enableStats: true,
  };

  let parser;

  beforeEach(() => {
    parser = new LogParser(testConfig);
  });

  test("should parse nginx error log line correctly", () => {
    const line =
      "2025/02/18 19:05:31 [error] 14620#12040: *1 connect() failed (10061: No connection could be made because the target machine actively refused it)";
    const result = parser.parseLogLine(line);

    expect(result).toMatchObject({
      timestamp: "2025/02/18 19:05:31",
      severityLabel: "ERROR",
      icon: "🔴",
      processInfo: "Process 14620",
    });
  });

  test("should parse actual nginx log file", async () => {
    const result = await parser.parseLogFile();
    expect(result).toHaveProperty("message");
    expect(result.message).toContain("Nginx Log Analysis Report");
  });

  test("should handle different nginx error levels", () => {
    const testCases = [
      {
        line: "2025/02/18 19:05:31 [error] 14620#12040: test error",
        expectedLevel: "ERROR",
      },
      {
        line: "2025/02/18 19:05:31 [notice] 14620#12040: test notice",
        expectedLevel: "NOTICE",
      },
      {
        line: "2025/02/18 19:05:31 [warn] 14620#12040: test warning",
        expectedLevel: "WARN",
      },
    ];

    testCases.forEach(({ line, expectedLevel }) => {
      const result = parser.parseLogLine(line);
      expect(result.severityLabel).toBe(expectedLevel);
    });
  });
});
