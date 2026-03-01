const { prisma } = require("../config/db");
const { sendEmail } = require("../config/email");
const logger = require("../config/logger");

// Handle contact form submission
exports.submitContactForm = async (req, res) => {
  try {
    const { name, phone, message, subject } = req.body;
    const email = req.body.email?.toLowerCase();

    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        message: "Please provide name, email, and message."
      });
    }

    // Create a new lead from the contact form or update if already exists
    const lead = await prisma.lead.upsert({
      where: { email },
      update: {
        name,
        phone: phone || undefined,
        notes: message,
        lastActivity: new Date(),
        sourceDetails: {
          subject: subject || "General Inquiry",
          submittedAt: new Date().toISOString(),
          repeated: true
        }
      },
      create: {
        name,
        email,
        phone: phone || null,
        source: "contact_form",
        notes: message,
        sourceDetails: {
          subject: subject || "General Inquiry",
          submittedAt: new Date().toISOString()
        },
        status: "new"
      }
    });

    // Notify admin of new lead
    try {
      await sendEmail({
        to: process.env.ADMIN_EMAIL || 'admin@sitemendr.com',
        subject: `New Lead: ${name} via Contact Form`,
        html: `
          <h2>New Contact Form Submission</h2>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Phone:</strong> ${phone || 'N/A'}</p>
          <p><strong>Subject:</strong> ${subject || 'General Inquiry'}</p>
          <p><strong>Message:</strong></p>
          <blockquote style="background: #f4f4f4; padding: 15px; border-left: 5px solid #0066ff;">
            ${message}
          </blockquote>
          <p><a href="${process.env.FRONTEND_URL}/admin/dashboard">View in Admin Dashboard</a></p>
        `
      });
    } catch (emailError) {
      logger.error("Failed to send admin lead notification email", {
        errorCode: 'CONTACT_FORM_EMAIL_ERROR',
        error: emailError.message
      });
    }

    res.status(201).json({
      success: true,
      message: "Thank you for contacting us! We will get back to you soon.",
      leadId: lead.id
    });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(200).json({
        success: true,
        message: "Thank you! We already have your information and will be in touch shortly."
      });
    }

    logger.error("Contact form submission error", {
      errorCode: 'CONTACT_FORM_SUBMISSION_ERROR',
      error: error.message
    });
    
    res.status(500).json({
      success: false,
      message: "An error occurred while submitting the form. Please try again later."
    });
  }
};

// Handle newsletter subscription
exports.subscribeNewsletter = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required." });
    }

    // Create or update lead with newsletter source
    await prisma.lead.upsert({
      where: { email: email.toLowerCase() },
      update: {
        lastActivity: new Date(),
        tags: { push: "newsletter" }
      },
      create: {
        email: email.toLowerCase(),
        name: email.split('@')[0],
        source: "newsletter",
        status: "new",
        tags: ["newsletter"]
      }
    });

    res.json({ success: true, message: "Subscribed successfully!" });
  } catch (error) {
    logger.error("Newsletter subscription error", {
      errorCode: 'NEWSLETTER_SUBSCRIPTION_ERROR',
      error: error.message
    });
    res.status(500).json({ success: false, message: "Failed to subscribe." });
  }
};
