// src/logFetcher.js
const axios = require("axios");

async function fetchLogData(logUrl) {
  const response = await axios.get(logUrl, {
    timeout: 5000,
    headers: {
      "User-Agent": "Log-Error-Tracker/1.0.0",
      Accept: "text/plain",
    },
    validateStatus: (status) => status === 200,
    retry: 3,
    retryDelay: 1000,
  });

  if (!response.data) {
    throw new Error("No log data received from server");
  }
  return response.data;
}

module.exports = { fetchLogData };
