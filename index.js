// index.js
const createApp = require("./src/app");
const config = require("./src/config");

if (require.main === module) {
  const app = createApp();
  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(
      `[2025-02-20 22:25:37] Log Error Tracker started on port ${port}`
    );
    console.log("Configuration:", config);
  });
}

module.exports = createApp;
