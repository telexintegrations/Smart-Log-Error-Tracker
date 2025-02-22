// logAnalysis.js
// This module contains functions to analyze log errors

function filterRecentErrors(errors, hours = 24) {
  const now = new Date();
  const hoursAgo = new Date(now - hours * 60 * 60 * 1000);
  return errors.filter((error) => {
    const errorDate = new Date(error.timestamp.replace(/\//g, "-"));
    return errorDate > hoursAgo;
  });
}

function filterBySeverity(errors, minSeverity = "error") {
  const severityLevels = {
    emergency: 7,
    alert: 6,
    critical: 5,
    error: 4,
    warning: 3,
    notice: 2,
    info: 1,
    debug: 0,
  };

  const threshold = severityLevels[minSeverity.toLowerCase()] || 4;
  return errors.filter((error) => error.severity >= threshold);
}

function analyzeTrends(errors) {
  const now = new Date();
  const hourAgo = new Date(now - 60 * 60 * 1000);
  const dayAgo = new Date(now - 24 * 60 * 60 * 1000);

  const errorsLastHour = filterRecentErrors(errors, 1).length;
  const errorsLastDay = filterRecentErrors(errors, 24).length;

  return {
    lastHour: errorsLastHour,
    lastDay: errorsLastDay,
    trend: errorsLastHour > errorsLastDay / 24 ? "increasing" : "stable",
    averagePerHour: (errorsLastDay / 24).toFixed(2),
  };
}

function getMostFrequent(arr) {
  return [
    ...arr.reduce(
      (map, item) => map.set(item, (map.get(item) || 0) + 1),
      new Map()
    ),
  ]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([url, count]) => ({ url, count }));
}

function analyzeUrlPatterns(errors) {
  const urlPattern = /request: "([^"]+)"/;
  const failedUrls = errors
    .filter((e) => e.message.includes("request:"))
    .map((e) => {
      const match = e.message.match(urlPattern);
      return match ? match[1] : null;
    })
    .filter((url) => url);

  return {
    uniqueUrls: [...new Set(failedUrls)],
    mostCommon: getMostFrequent(failedUrls),
  };
}

function analyzeUpstreamStatus(errors) {
  const upstreamErrors = errors.filter((e) => e.message.includes("upstream"));
  const services = new Map();

  upstreamErrors.forEach((error) => {
    const match = error.message.match(/upstream: "([^"]+)"/);
    if (match) {
      try {
        const url = new URL(match[1]);
        const host = url.host;
        if (!services.has(host)) {
          services.set(host, {
            failures: 0,
            lastError: null,
            urls: new Set(),
          });
        }
        const service = services.get(host);
        service.failures++;
        service.lastError = error.timestamp;
        service.urls.add(url.pathname);
      } catch (e) {
        // Invalid URL, skip
      }
    }
  });

  return {
    total: upstreamErrors.length,
    services: Array.from(services.entries()).map(([host, data]) => ({
      host,
      failures: data.failures,
      lastError: data.lastError,
      affectedPaths: Array.from(data.urls),
    })),
  };
}

function categorizeErrors(errors) {
  return {
    connection: errors.filter((e) => {
      const msg = e.message.toLowerCase();
      return (
        msg.includes("connect() failed") ||
        msg.includes("connection refused") ||
        msg.includes("upstream") ||
        msg.includes("proxy")
      );
    }),
    filesystem: errors.filter((e) => {
      const msg = e.message.toLowerCase();
      return (
        msg.includes("createfile()") ||
        msg.includes("file not found") ||
        msg.includes("cannot find the path")
      );
    }),
    process: errors.filter((e) => {
      const msg = e.message.toLowerCase();
      return (
        msg.includes("signal process") ||
        msg.includes("pid") ||
        msg.includes("worker process")
      );
    }),
    other: errors.filter((e) => {
      const msg = e.message.toLowerCase();
      return (
        !msg.includes("connect() failed") &&
        !msg.includes("createfile()") &&
        !msg.includes("signal process")
      );
    }),
  };
}

module.exports = {
  filterRecentErrors,
  filterBySeverity,
  analyzeTrends,
  getMostFrequent,
  analyzeUrlPatterns,
  analyzeUpstreamStatus,
  categorizeErrors,
};
