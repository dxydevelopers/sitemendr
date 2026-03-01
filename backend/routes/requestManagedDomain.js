const express = require("express");
const router = express.Router();
const { sendEmail } = require('../config/email');
const { prisma } = require('../config/db');
const logger = require('../config/logger');

// 📩 POST /api/request-managed-domain
router.post("/", async (req, res) => {
  const { email, domainInterest } = req.body;

  if (!email || !domainInterest) {
    return res.status(400).json({ message: "Missing email or domain name" });
  }

  try {
    // 1. Save to DB using Prisma
    await prisma.managedDomainRequest.create({
      data: {
        email,
        domainInterest
      }
    });

    // 2. Email the user
    await sendEmail({
      from: `"Sitemendr Domains" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `We received your domain interest: ${domainInterest}`,
      html: `
        <h2>Hi there 👋</h2>
        <p>We’ve received your interest in <strong>${domainInterest}</strong>.</p>
        <p>Our team will handle the purchase and setup for you.</p>
        <p>You’ll receive a subscription invoice shortly to finalize the domain.</p>
        <br/>
        <p>Thanks for choosing Sitemendr!</p>
      `
    });

    // 3. Notify the Admin
    await sendEmail({
      from: `"Sitemendr Domains" <${process.env.EMAIL_USER}>`,
      to: process.env.ADMIN_EMAIL,
      subject: `📬 New Managed Domain Request: ${domainInterest}`,
      html: `
        <h2>New Domain Purchase Request</h2>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Requested Domain:</strong> ${domainInterest}</p>
        <p>Check the admin panel for follow-up.</p>
      `
    });

    logger.info(`DOMAIN_REQUEST_SUCCESS: Request for ${domainInterest} by ${email}`);
    return res.status(200).json({ message: "Request recorded and emails sent." });

  } catch (error) {
    logger.error("DOMAIN_REQUEST_FAILED", { error, email, domainInterest });
    return res.status(500).json({ message: "Server error while processing domain request." });
  }
});

module.exports = router;
