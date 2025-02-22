// src/telexFormatter.js
function formatForTelex(errors, config, logAnalysis) {
  if (errors.length === 0) {
    return {
      message: `[${new Date().toISOString()}] No new errors found in nginx logs.\nMonitored URL: ${
        config.logUrl
      }`,
      type: "info",
    };
  }

  const recentErrors = logAnalysis.filterRecentErrors(errors, 24);
  const trends = logAnalysis.analyzeTrends(errors);
  const errorCategories = logAnalysis.categorizeErrors(recentErrors);
  const urlAnalysis = logAnalysis.analyzeUrlPatterns(recentErrors);
  const upstreamStatus = logAnalysis.analyzeUpstreamStatus(recentErrors);

  const summary = {
    emergency: recentErrors.filter((e) => e.severityLabel === "EMERGENCY")
      .length,
    error: recentErrors.filter((e) => e.severityLabel === "ERROR").length,
    warning: recentErrors.filter((e) => e.severityLabel === "WARN").length,
    notice: recentErrors.filter((e) => e.severityLabel === "NOTICE").length,
  };

  const formatDetailed = (error) =>
    `${error.icon} [${error.severityLabel}] ${error.timestamp} - ${error.processInfo} ${error.message}`;

  const mostRecentErrors = [
    ...errorCategories.connection.slice(-2),
    ...errorCategories.filesystem.slice(-1),
    ...errorCategories.other.slice(-1),
  ];

  const trendIndicator =
    trends.trend === "increasing"
      ? "⚠️ Error rate increasing!"
      : "✅ Error rate stable";
  const errorRate = `Average errors per hour: ${trends.averagePerHour}`;

  const messageArray = [
    "🔍 Nginx Log Analysis Report:",
    `Time: ${new Date().toISOString()}`,
    "",
    "Error Trends:",
    trendIndicator,
    `Last Hour: ${trends.lastHour} errors`,
    `Last 24 Hours: ${trends.lastDay} errors`,
    errorRate,
    "",
    `Found ${recentErrors.length} errors in last 24 hours (${errors.length} total):`,
    `🔴 Emergency/Critical: ${summary.emergency}`,
    `🔴 Error: ${summary.error}`,
    `🟡 Warning: ${summary.warning}`,
    `🟢 Notice: ${summary.notice}`,
    "",
    "Error Categories:",
    `- Connection Issues: ${errorCategories.connection.length}`,
    `- Filesystem Issues: ${errorCategories.filesystem.length}`,
    `- Process Signals: ${errorCategories.process.length}`,
    `- Other Issues: ${errorCategories.other.length}`,
  ];

  if (urlAnalysis.uniqueUrls.length > 0) {
    messageArray.push(
      "",
      "Failed URLs:",
      ...urlAnalysis.mostCommon.map(
        ({ url, count }) => `- ${url} (${count} times)`
      )
    );
  }

  if (upstreamStatus.services.length > 0) {
    messageArray.push(
      "",
      "Upstream Service Issues:",
      ...upstreamStatus.services.map(
        (service) =>
          `- ${service.host}: ${service.failures} failures, last error at ${service.lastError}`
      )
    );
  }

  messageArray.push(
    "",
    "Most Recent Errors:",
    ...mostRecentErrors.map(formatDetailed),
    "",
    "Note: Showing most recent errors from each category."
  );

  return {
    message: messageArray.join("\n"),
    type: errorCategories.connection.length > 0 ? "error" : "info",
  };
}

module.exports = { formatForTelex };
