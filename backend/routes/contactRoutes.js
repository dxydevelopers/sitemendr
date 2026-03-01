const express = require("express");
const router = express.Router();
const contactController = require("../controllers/contactController");

// POST /api/contact
router.post("/", contactController.submitContactForm);

// POST /api/contact/newsletter
router.post("/newsletter", contactController.subscribeNewsletter);

module.exports = router;
