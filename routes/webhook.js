// routes/webhook.js
const express = require("express");
const router = express.Router();

router.post("/webhook", (req, res) => {
  console.log("[2025-02-20 22:25:37] Received webhook call:", {
    body: req.body,
  });

  res.status(200).json({
    status: "received",
    message: "Webhook received successfully",
  });
});

module.exports = router;
