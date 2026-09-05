const express = require("express");
const router = express.Router();
const { prisma } = require('../config/db');
const logger = require('../config/logger');

// 📩 POST /api/request-managed-domain
router.post("/", async (req, res) => {
  const { email, domainInterest } = req.body;

  if (!email || !domainInterest) {
    return res.status(400).json({ message: "Missing email or domain name" });
  }

  try {
    // 1. Save to DB using Prisma - UPSERT to prevent duplicates for same email
    await prisma.managedDomainRequest.upsert({
      where: { email },
      update: {
        domainInterest,
        createdAt: new Date()
      },
      create: {
        email,
        domainInterest
      }
    });

    // NOTE: user confirmation and admin alert emails removed as part of
    // notification cleanup. If these need to send again later, wire them
    // via notify() and the registry.

    logger.info(`DOMAIN_REQUEST_SUCCESS: Request for ${domainInterest} by ${email}`);
    return res.status(200).json({ message: "Request recorded." });

  } catch (error) {
    logger.error("DOMAIN_REQUEST_FAILED", { error, email, domainInterest });
    return res.status(500).json({ message: "Server error while processing domain request." });
  }
});

module.exports = router;