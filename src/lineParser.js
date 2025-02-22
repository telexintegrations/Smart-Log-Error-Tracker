// src/lineParser.js
const { getSeverityFromWord } = require("./severity");

function parseLogLine(line) {
  const regex =
    /^(\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}:\d{2}) \[(\w+)\] (?:(\d+)#\d+: )?(.+)/;
  const match = line.match(regex);
  if (!match) return null;
  const [, timestamp, severityWord, processId, message] = match;
  const severity = getSeverityFromWord(severityWord);
  return {
    timestamp,
    severity: severity.level,
    severityLabel: severity.label,
    icon: severity.icon,
    message: message.trim(),
    processInfo: processId ? `Process ${processId}` : "",
    rawLine: line,
  };
}

module.exports = { parseLogLine };
