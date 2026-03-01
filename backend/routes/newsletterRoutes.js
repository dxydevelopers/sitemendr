const express = require("express");
const router = express.Router();
const contactController = require("../controllers/contactController");

// POST /api/newsletter/subscribe
router.post("/subscribe", contactController.subscribeNewsletter);

module.exports = router;
