// src/severity.js
const severityMap = {
  emerg: { level: 7, label: "EMERGENCY", icon: "🔴" },
  alert: { level: 6, label: "ALERT", icon: "🔴" },
  crit: { level: 5, label: "CRITICAL", icon: "🔴" },
  error: { level: 4, label: "ERROR", icon: "🔴" },
  warn: { level: 3, label: "WARN", icon: "🟡" },
  notice: { level: 2, label: "NOTICE", icon: "🟢" },
  info: { level: 1, label: "INFO", icon: "ℹ️" },
  debug: { level: 0, label: "DEBUG", icon: "🔍" },
};

function getSeverityFromWord(word) {
  return (
    severityMap[word.toLowerCase()] || {
      level: 0,
      label: "UNKNOWN",
      icon: "❓",
    }
  );
}

module.exports = { severityMap, getSeverityFromWord };
