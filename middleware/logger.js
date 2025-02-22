// middleware/logger.js
function logger(req, res, next) {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  // Log config (imported here so changes to config are reflected)
  console.log("Config:", require("../src/config"));
  next();
}

module.exports = { logger };
