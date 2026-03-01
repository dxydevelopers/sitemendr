const { prisma } = require('../config/db');
const OpenAI = require('openai');
const Groq = require('groq-sdk');
const logger = require('../config/logger');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

/**
 * AI-powered support chat / ticket creation
 */
exports.createTicket = async (req, res) => {
  try {
    const { subject, message, priority = 'medium' } = req.body;
    const userId = req.user.userId;

    if (!message) {
      return res.status(400).json({ success: false, message: 'Message is required' });
    }

    // Check user subscription for priority boost
    const subscription = await prisma.subscription.findFirst({
      where: { userId, status: 'active' },
      select: { tier: true }
    });

    let classification = {
      category: 'general',
      suggestedPriority: subscription?.tier === 'maintenance' || subscription?.tier === 'enterprise' ? 'high' : priority,
      autoResponse: 'Thank you for your message. Our team will review your request and get back to you shortly.'
    };

    // Try to use AI to classify the ticket, with Groq as fallback
    // We use a timeout to prevent blocking the response for too long
    const classifyTicket = async () => {
      try {
        const aiClassification = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content: "You are an AI support assistant for Sitemendr, a web development and AI agency. Classify the user's issue and provide an immediate helpful response or troubleshooting steps. Return valid JSON with 'category' (billing, technical, feature_request, general), 'suggestedPriority' (low, medium, high), and 'autoResponse' string."
            },
            {
              role: "user",
              content: `Subject: ${subject}\nMessage: ${message}`
            }
          ],
          response_format: { type: "json_object" }
        });

        return JSON.parse(aiClassification.choices[0].message.content);
      } catch (openaiError) {
        logger.error('OPENAI_CLASSIFICATION_ERROR:', openaiError);
        
        // Fallback to Groq if OpenAI fails
        try {
          const groqClassification = await groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [
              {
                role: "system",
                content: "You are an AI support assistant for Sitemendr, a web development and AI agency. Classify the user's issue and provide an immediate helpful response or troubleshooting steps. Return valid JSON with 'category' (billing, technical, feature_request, general), 'suggestedPriority' (low, medium, high), and 'autoResponse' string."
              },
              {
                role: "user",
                content: `Subject: ${subject}\nMessage: ${message}`
              }
            ],
            response_format: { type: "json_object" }
          });

          logger.info('GROQ_CLASSIFICATION_SUCCESS');
          return JSON.parse(groqClassification.choices[0].message.content);
        } catch (groqError) {
          logger.error('GROQ_CLASSIFICATION_ERROR:', groqError);
          throw groqError;
        }
      }
    };

    // Race the AI classification against a 5-second timeout
    try {
      const timeout = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('AI_TIMEOUT')), 5000)
      );
      
      const aiResult = await Promise.race([classifyTicket(), timeout]);
      classification = { ...classification, ...aiResult };
    } catch (raceError) {
      logger.warn('TICKET_CLASSIFICATION_SKIPPED_OR_TIMEOUT:', raceError.message);
      // Continue with default classification
    }

    // Create the ticket in database
    const ticket = await prisma.supportTicket.create({
      data: {
        userId,
        subject: subject || `Support Request: ${classification.category}`,
        message,
        status: 'open',
        priority: classification.suggestedPriority || priority,
        messages: {
          create: {
            senderId: userId,
            content: message,
            isAdmin: false
          }
        }
      },
      include: {
        messages: true
      }
    });

    res.status(201).json({
      success: true,
      data: {
        ticket,
        aiResponse: classification.autoResponse
      }
    });
  } catch (error) {
    logger.error('CREATE_TICKET_ERROR:', error);
    res.status(500).json({ success: false, message: 'Failed to create support ticket' });
  }
};

/**
 * Get user tickets
 */
exports.getUserTickets = async (req, res) => {
  try {
    const tickets = await prisma.supportTicket.findMany({
      where: { userId: req.user.userId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ success: true, data: tickets });
  } catch (error) {
    logger.error('GET_USER_TICKETS_ERROR:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve tickets' });
  }
};

/**
 * Get ticket details
 */
exports.getTicketDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const ticket = await prisma.supportTicket.findUnique({
      where: { id },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!ticket || ticket.userId !== userId) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    res.json({ success: true, data: ticket });
  } catch (error) {
    logger.error('GET_TICKET_DETAILS_ERROR:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve ticket details' });
  }
};

/**
 * Add message to ticket
 */
exports.addMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const userId = req.user.userId;

    if (!content) {
      return res.status(400).json({ success: false, message: 'Content is required' });
    }

    // Verify ownership
    const ticket = await prisma.supportTicket.findUnique({
      where: { id }
    });

    if (!ticket || ticket.userId !== userId) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const newMessage = await prisma.supportMessage.create({
      data: {
        ticketId: id,
        senderId: userId,
        content,
        isAdmin: false
      }
    });

    // Reopen ticket if it was resolved
    if (ticket.status === 'resolved') {
      await prisma.supportTicket.update({
        where: { id },
        data: { status: 'open' }
      });
    }

    res.status(201).json({ success: true, data: newMessage });
  } catch (error) {
    logger.error('ADD_SUPPORT_MESSAGE_ERROR:', error);
    res.status(500).json({ success: false, message: 'Failed to send message' });
  }
};

/**
 * AI Support Bot Chat
 */
exports.chatWithSupport = async (req, res) => {
  try {
    const { message, history = [] } = req.body;

    if (!message) {
      return res.status(400).json({ success: false, message: 'Message is required' });
    }

    const messages = [
      {
        role: "system",
        content: "You are the Sitemendr AI Assistant. You help clients with website building, technical repairs, and maintenance questions. Be professional, concise, and helpful. If you cannot solve an issue, suggest creating a support ticket."
      },
      ...history.map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.text
      })),
      { role: "user", content: message }
    ];

    let aiMessage;
    let usedProvider = 'openai';
    const hasOpenAI = !!process.env.OPENAI_API_KEY;
    const hasGroq = !!process.env.GROQ_API_KEY;
    let openaiError;

    // Try OpenAI first (if configured)
    if (hasOpenAI) {
      try {
        const completion = await openai.chat.completions.create({
          model: "gpt-4o",
          messages,
          temperature: 0.7,
          max_tokens: 500
        });
        aiMessage = completion.choices[0].message.content;
      } catch (err) {
        openaiError = err;
        logger.error('SUPPORT_CHAT_OPENAI_ERROR:', err);
      }
    } else {
      logger.warn('OpenAI key missing - skipping OpenAI support chat');
    }

    // Fallback to Groq if OpenAI failed or is not configured
    if (!aiMessage && hasGroq) {
      try {
        const groqCompletion = await groq.chat.completions.create({
          model: "llama-3.3-70b-versatile",
          messages,
          temperature: 0.7,
          max_tokens: 500
        });
        aiMessage = groqCompletion.choices[0].message.content;
        usedProvider = 'groq';
      } catch (groqError) {
        logger.error('SUPPORT_CHAT_GROQ_ERROR:', groqError);
      }
    } else if (!aiMessage && !hasGroq) {
      logger.warn('Groq key missing - skipping Groq support chat');
    }

    // Final fallback to keep the UI functional
    if (!aiMessage) {
      if (openaiError && (openaiError.status === 429 || openaiError.code === 'insufficient_quota')) {
        logger.warn('Support chat quota exceeded - returning fallback response');
      }
      aiMessage = 'Our AI assistant is temporarily unavailable. Please create a support ticket and our team will help you.';
      usedProvider = 'fallback';
    }

    res.json({
      success: true,
      message: aiMessage,
      provider: usedProvider
    });
  } catch (error) {
    logger.error('SUPPORT_CHAT_ERROR:', error);
    res.status(500).json({ success: false, message: 'AI Assistant is temporarily unavailable' });
  }
};
