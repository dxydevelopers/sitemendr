const { prisma } = require('../config/db');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const logger = require('../config/logger');
const { sendEmail } = require('../config/email');

// OpenAI client for AI processing
const OpenAI = require('openai');
const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

// Groq client for fallback AI processing
const Groq = require('groq-sdk');
const groq = process.env.GROQ_API_KEY
  ? new Groq({ apiKey: process.env.GROQ_API_KEY })
  : null;


const allowFallback = process.env.NODE_ENV !== 'production';

// Generate session ID
const generateSessionId = () => {
  return crypto.randomBytes(16).toString('hex');
};

// Generate session token
const generateSessionToken = (sessionId) => {
  return jwt.sign({ sessionId }, process.env.JWT_SECRET || 'assessment_secret', { expiresIn: '24h' });
};

// Validate session token
const validateSessionToken = (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'assessment_secret');
    return decoded.sessionId;
  } catch (error) {
    return null;
  }
};

// Helper to calculate completion percentage
const calculateCompletionPercentage = (responses) => {
  const requiredSteps = 8;
  let completedSteps = 0;

  if (responses.businessType) completedSteps++;
  if (responses.goals && responses.goals.length > 0) completedSteps++;
  if (responses.hasWebsite !== undefined) completedSteps++;
  if (responses.preferredStyle) completedSteps++;
  if (responses.requiredFeatures && responses.requiredFeatures.length > 0) completedSteps++;
  if (responses.budget) completedSteps++;
  if (responses.timeline) completedSteps++;
  if (responses.name && responses.email) completedSteps++;

  return Math.round((completedSteps / requiredSteps) * 100);
};

// Helper to calculate lead score
const calculateLeadScore = (leadData, responses) => {
  let score = 0;

  // Source scoring
  const sourceScores = {
    'assessment': 80,
    'contact_form': 60,
    'referral': 70,
    'paid_ad': 50,
    'social': 40,
    'newsletter': 30,
    'direct': 20
  };
  score += sourceScores[leadData.source] || 0;

  // Budget scoring
  const budgetScores = {
    'over_10000': 30,
    '5000_10000': 25,
    '3000_5000': 20,
    '1000_3000': 15,
    'under_1000': 10
  };
  if (responses.budget) {
    score += budgetScores[responses.budget] || 0;
  }

  // Timeline scoring (ASAP is highest priority)
  if (responses.timeline === 'asap') {
    score += 20;
  } else if (responses.timeline === '1_month') {
    score += 15;
  }

  // Company size scoring
  const sizeScores = {
    '100+': 15,
    '51-100': 12,
    '21-50': 10,
    '6-20': 8,
    '1-5': 5
  };
  if (responses.employeeCount) {
    score += sizeScores[responses.employeeCount] || 0;
  }

  // Cap at 100
  return Math.min(score, 100);
};

// Generate JWT token for user
const generateAuthToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET || 'secret', {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

// Advanced AI processing function using OpenAI with Groq fallback
const processAssessmentAI = async (responses) => {
  if (!openai) {
    logger.warn('OPENAI_API_KEY missing; skipping OpenAI processing', { errorCode: 'ASSESSMENT_OPENAI_MISSING' });
    if (groq) return await processAssessmentGroq(responses);
    if (!allowFallback) {
      throw new Error('AI processing unavailable');
    }
    return await processAssessmentFallback(responses);
  }
  try {
    if (!openai) {
        const missingError = new Error('OPENAI_MISSING');
        missingError.code = 'OPENAI_MISSING';
        throw missingError;
      }
      const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert web development consultant. Analyze user requirements and provide a detailed project assessment in JSON format. Always return valid JSON with these fields: recommendedPackage, confidence, recommendedFeatures (array), pricing (object with package, basePrice, estimatedTotal, currency, breakdown), timeline, mockupUrl, customizations (array), aiInsights (string), predictions (object), riskAssessment (array), competitorAnalysis (string), marketTrends (array), nextSteps (array). Packages available: ai_foundation (basic hosted), pro_enhancement (advanced hosted), enterprise (full-service hosted), self_hosted (one-time code delivery), maintenance (monthly care plan). If the user has a pre-selected package (selectedPackage), prioritize it in your analysis."
        },
        {
          role: "user",
          content: `Analyze these business requirements and provide a structured assessment: ${JSON.stringify(responses)}`
        }
      ],
      temperature: 0.7,
      max_tokens: 2048,
      response_format: { type: "json_object" }
    });

    const aiResult = JSON.parse(completion.choices[0].message.content);
    
    // Generate real AI mockup image in parallel
    const mockupUrl = await generateMockupAI(responses.businessType, aiResult.recommendedFeatures || [], responses.preferredStyle);
    
    // Validate and merge with fallback logic to ensure all required fields exist
    const fallbackResult = allowFallback ? await processAssessmentFallback(responses) : {};
    
    return {
      ...fallbackResult,
      ...aiResult,
      mockupUrl, // Replace the placeholder mockup with real AI generation
      aiGenerated: true,
      processingMethod: 'openai-gpt-4o'
    };
  } catch (error) {
    logger.error('OpenAI processing error, checking Groq fallback', {
      errorCode: 'ASSESSMENT_OPENAI_ERROR',
      error: error.message,
      stack: error.stack
    });
    
    // Check if it's a quota/rate limit error (429)
    const isQuotaError = error.status === 429 || 
                         error.code === 'insufficient_quota' || 
                         (error.message && error.message.toLowerCase().includes('quota')) ||
                         (error.message && error.message.toLowerCase().includes('limit exceeded'));

    if (isQuotaError) {
      logger.info('OpenAI quota exceeded or rate limited, switching to Groq', { errorCode: 'ASSESSMENT_SWITCHING_TO_GROQ' });
      try {
        return await processAssessmentGroq(responses);
      } catch (groqError) {
        logger.error('Groq fallback failed', {
          errorCode: 'ASSESSMENT_GROQ_ERROR',
          error: groqError.message,
          stack: groqError.stack
        });
      }
    }
    
    if (!allowFallback) {
      throw new Error('Assessment fallback disabled in production');
    }
    logger.info('Using rule-based fallback', { errorCode: 'ASSESSMENT_USING_FALLBACK' });
    return await processAssessmentFallback(responses);
  }
};

// Advanced AI processing using Groq (llama-3.3-70b)
const processAssessmentGroq = async (responses) => {
  if (!groq) {
    throw new Error('GROQ_API_KEY missing');
  }
  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: "You are an expert web development consultant. Analyze user requirements and provide a detailed project assessment in JSON format. Always return valid JSON with these fields: recommendedPackage, confidence, recommendedFeatures (array), pricing (object with package, basePrice, estimatedTotal, currency, breakdown), timeline, mockupUrl, customizations (array), aiInsights (string), predictions (object), riskAssessment (array), competitorAnalysis (string), marketTrends (array), nextSteps (array). Packages available: ai_foundation (basic hosted), pro_enhancement (advanced hosted), enterprise (full-service hosted), self_hosted (one-time code delivery), maintenance (monthly care plan). If the user has a pre-selected package (selectedPackage), prioritize it in your analysis."
        },
        {
          role: "user",
          content: `Analyze these business requirements and provide a structured assessment: ${JSON.stringify(responses)}`
        }
      ],
      temperature: 0.7,
      max_tokens: 2048,
      response_format: { type: "json_object" }
    });

    const aiResult = JSON.parse(completion.choices[0].message.content);
    
    // Generate real AI mockup image
    const mockupUrl = await generateMockupAI(responses.businessType, aiResult.recommendedFeatures || [], responses.preferredStyle);
    
    const fallbackResult = allowFallback ? await processAssessmentFallback(responses) : {};
    
    return {
      ...fallbackResult,
      ...aiResult,
      mockupUrl,
      aiGenerated: true,
      processingMethod: 'groq-llama-3.3-70b'
    };
  } catch (error) {
    throw error;
  }
};

// Fallback function for when OpenAI fails
const processAssessmentFallback = async (responses) => {
  if (!allowFallback) {
    throw new Error('Assessment fallback disabled in production');
  }
  // Simulate AI processing delay (more realistic timing)
  await new Promise(resolve => setTimeout(resolve, 3000));

  // Advanced scoring algorithm (same as before)
  const scores = {
    ai_foundation: 0,
    pro_enhancement: 0,
    enterprise: 0,
    self_hosted: 0
  };

  const featureScores = {
    ecommerce: 0,
    payment_processing: 0,
    contact_form: 0,
    booking_system: 0,
    blog: 0,
    seo: 0,
    analytics: 0,
    social_media: 0,
    mobile_app: 0,
    ai_chatbot: 0
  };

  // Business type analysis (weighted scoring)
  const businessTypeWeights = {
    ecommerce: { ai_foundation: 20, pro_enhancement: 80, enterprise: 40, self_hosted: 60 },
    service: { ai_foundation: 60, pro_enhancement: 30, enterprise: 10, self_hosted: 20 },
    portfolio: { ai_foundation: 80, pro_enhancement: 15, enterprise: 5, self_hosted: 10 },
    blog: { ai_foundation: 70, pro_enhancement: 20, enterprise: 10, self_hosted: 30 },
    nonprofit: { ai_foundation: 90, pro_enhancement: 5, enterprise: 5, self_hosted: 5 }
  };

  if (responses.businessType && businessTypeWeights[responses.businessType]) {
    const weights = businessTypeWeights[responses.businessType];
    scores.ai_foundation += weights.ai_foundation;
    scores.pro_enhancement += weights.pro_enhancement;
    scores.enterprise += weights.enterprise;
  }

  // Budget analysis with predictive modeling
  const budgetWeights = {
    under_1000: { ai_foundation: 90, pro_enhancement: 5, enterprise: 5, self_hosted: 10 },
    '1000_5000': { ai_foundation: 70, pro_enhancement: 25, enterprise: 5, self_hosted: 80 },
    '5000_10000': { ai_foundation: 20, pro_enhancement: 70, enterprise: 10, self_hosted: 50 },
    'over_10000': { ai_foundation: 5, pro_enhancement: 30, enterprise: 65, self_hosted: 40 }
  };

  if (responses.budget && budgetWeights[responses.budget]) {
    const weights = budgetWeights[responses.budget];
    scores.ai_foundation += weights.ai_foundation;
    scores.pro_enhancement += weights.pro_enhancement;
    scores.enterprise += weights.enterprise;
    scores.self_hosted += weights.self_hosted;
  }

  // Timeline urgency analysis
  const timelineWeights = {
    asap: { ai_foundation: 80, pro_enhancement: 15, enterprise: 5, self_hosted: 10 },
    '1_month': { ai_foundation: 40, pro_enhancement: 45, enterprise: 15, self_hosted: 50 },
    '2_3_months': { ai_foundation: 20, pro_enhancement: 50, enterprise: 30, self_hosted: 70 },
    'no_rush': { ai_foundation: 10, pro_enhancement: 40, enterprise: 50, self_hosted: 80 }
  };

  if (responses.timeline && timelineWeights[responses.timeline]) {
    const weights = timelineWeights[responses.timeline];
    scores.ai_foundation += weights.ai_foundation;
    scores.pro_enhancement += weights.pro_enhancement;
    scores.enterprise += weights.enterprise;
    scores.self_hosted += weights.self_hosted;
  }

  // Feature analysis with correlation scoring
  if (responses.requiredFeatures && Array.isArray(responses.requiredFeatures)) {
    const featureCorrelations = {
      ecommerce: ['payment_processing', 'analytics'],
      payment_processing: ['ecommerce', 'analytics'],
      booking_system: ['contact_form', 'analytics'],
      blog: ['seo', 'social_media'],
      seo: ['blog', 'analytics'],
      analytics: ['seo', 'social_media'],
      social_media: ['blog', 'seo'],
      mobile_app: ['analytics', 'ai_chatbot']
    };

    responses.requiredFeatures.forEach(feature => {
      if (featureScores.hasOwnProperty(feature)) {
        featureScores[feature] += 50; // Base score for requested feature

        // Add correlation bonuses
        if (featureCorrelations[feature]) {
          featureCorrelations[feature].forEach(corrFeature => {
            if (featureScores.hasOwnProperty(corrFeature)) {
              featureScores[corrFeature] += 20; // Correlation bonus
            }
          });
        }
      }
    });
  }

  // Experience level analysis
  if (responses.experience === 'beginner') {
    scores.ai_foundation += 30;
    featureScores.seo += 15;
    featureScores.analytics += 15;
  } else if (responses.experience === 'experienced') {
    scores.pro_enhancement += 20;
    scores.enterprise += 10;
    scores.self_hosted += 60;
  }

  // Determine recommended package
  let recommendedPackage = responses.selectedPackage;
  
  // Advanced pricing with dynamic adjustments
  const basePricing = {
    ai_foundation: { basePrice: 299, estimatedTotal: 299 },
    pro_enhancement: { basePrice: 1299, estimatedTotal: 1299 },
    enterprise: { basePrice: 4999, estimatedTotal: 4999 },
    self_hosted: { basePrice: 1299, estimatedTotal: 1299 },
    maintenance: { basePrice: 99, estimatedTotal: 99 }
  };

  if (!recommendedPackage || !basePricing[recommendedPackage]) {
    const maxScore = Math.max(...Object.values(scores));
    recommendedPackage = Object.keys(scores).find(key => scores[key] === maxScore) || 'ai_foundation';
  }

  let pricing = { ...basePricing[recommendedPackage] };

  // Apply feature-based price adjustments
  const featurePriceMultipliers = {
    ecommerce: 1.3,
    payment_processing: 1.2,
    booking_system: 1.15,
    mobile_app: 2.0,
    ai_chatbot: 1.5,
    analytics: 1.1
  };

  // Determine recommended features based on scores
  const recommendedFeatures = Object.keys(featureScores).filter(f => featureScores[f] >= 20);

  let multiplier = 1.0;
  recommendedFeatures.forEach(feature => {
    if (featurePriceMultipliers[feature]) {
      multiplier *= featurePriceMultipliers[feature];
    }
  });

  pricing.estimatedTotal = Math.round(pricing.basePrice * multiplier);

  // Timeline optimization
  let timeline = '2_weeks';
  if (responses.timeline === 'asap' && recommendedPackage === 'ai_foundation') {
    timeline = '1_week';
  } else if (responses.timeline === '1_month' || recommendedPackage === 'enterprise') {
    timeline = '3_4_weeks';
  }

  // Generate predictive insights
  const predictions = {
    estimatedTrafficIncrease: '25-40%',
    conversionRateBoost: '15-20%',
    roiTimeline: recommendedPackage === 'ai_foundation' ? '3 months' : '6-9 months'
  };

  // Generate AI insights
  const insights = generateAIInsights(responses, recommendedPackage, recommendedFeatures);

  // Determine confidence
  const confidence = 0.85; // Base confidence for fallback

  // Generate a high-quality static mockup fallback using Unsplash
  const mockupUrl = `https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=1000&auto=format&fit=crop&text=${encodeURIComponent(responses.businessType || 'Digital Business')}`;

  return {
    recommendedPackage,
    confidence,
    recommendedFeatures,
    pricing: {
      package: recommendedPackage,
      ...pricing,
      currency: 'USD',
      breakdown: generatePriceBreakdown(recommendedFeatures, pricing.basePrice)
    },
    timeline,
    mockupUrl,
    customizations: generateCustomizations(recommendedPackage, responses),
    aiInsights: insights,
    predictions,
    riskAssessment: assessRisks(responses, recommendedPackage),
    competitorAnalysis: generateCompetitorAnalysis(responses.businessType),
    marketTrends: getMarketTrends(responses.businessType),
    nextSteps: generateNextSteps(recommendedPackage),
    aiGenerated: false, // Flag to indicate this was processed with fallback
    processingMethod: 'rule-based-fallback'
  };
};

/**
 * AI Template Generation with Fallback
 */
const generateTemplateAI = async (subscriptionId, responses, results) => {
  try {
    const prompt = `
      You are an expert web developer. Generate a modern, professional, and responsive single-page HTML template for a business with these details:
      Business Type: ${responses.businessType}
      Goals: ${responses.goals?.join(', ')}
      Preferred Style: ${responses.preferredStyle}
      Required Features: ${responses.requiredFeatures?.join(', ')}
      Recommended Package: ${results.recommendedPackage}

      The output should be a JSON object with "html" and "css" fields. 
      The HTML should be a complete document including modern CDNs for fonts (Inter) and icons (Lucide/FontAwesome).
      The CSS should be professional, using the Sitemendr brand colors (AI Blue: #0066FF, Tech Purple: #7C3AED).
      Ensure the content is tailored to the business type and goals.
    `;

    let code;
    try {
      if (!openai) {
        const missingError = new Error('OPENAI_MISSING');
        missingError.code = 'OPENAI_MISSING';
        throw missingError;
      }
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: "You generate professional website code in JSON format." },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" }
      });
      code = JSON.parse(completion.choices[0].message.content);
    } catch (oaError) {
      logger.error('OpenAI template generation failed, trying Groq', {
        errorCode: 'TEMPLATE_GEN_OPENAI_ERROR',
        error: oaError.message
      });
      const shouldTryGroq = oaError.code === 'OPENAI_MISSING' || oaError.status === 429 || oaError.code === 'insufficient_quota';
      if (shouldTryGroq) {
        if (!groq) {
          throw oaError;
        }
        const groqCompletion = await groq.chat.completions.create({
          model: "llama-3.3-70b-versatile",
          messages: [
            { role: "system", content: "You generate professional website code in JSON format." },
            { role: "user", content: prompt }
          ],
          response_format: { type: "json_object" }
        });
        code = JSON.parse(groqCompletion.choices[0].message.content);
        code.processingMethod = 'groq';
      } else {
        throw oaError;
      }
    }

    // Save to database if possible
    if (!code) {
      throw new Error('No template code generated');
    }

    try {
      const savedTemplate = await prisma.template.upsert({
        where: { subscriptionId },
        update: {
          html: code.html,
          css: code.css,
          js: code.js,
          aiModel: code.aiModel || (code.processingMethod === 'groq' ? 'llama-3.3-70b' : 'gpt-4o')
        },
        create: {
          subscription: { connect: { id: subscriptionId } },
          html: code.html,
          css: code.css,
          js: code.js,
          aiModel: code.aiModel || (code.processingMethod === 'groq' ? 'llama-3.3-70b' : 'gpt-4o')
        }
      });
      
      logger.info('Template saved successfully', { templateId: savedTemplate.id, subscriptionId });
      
      // Update the AI Prototype Generation milestone to COMPLETED
      await prisma.milestone.updateMany({
        where: {
          subscriptionId,
          title: 'AI Prototype Generation'
        },
        data: {
          status: 'COMPLETED',
          progress: 100
        }
      });
      
    } catch (dbError) {
      logger.error('Failed to save template to DB', {
        errorCode: 'TEMPLATE_SAVE_DB_ERROR',
        error: dbError.message,
        subscriptionId
      });
      // Don't throw - template generation succeeded, DB save failed
      // The template is still returned to the user
    }

    return code;
  } catch (error) {
    logger.error('AI Template generation failed', {
      errorCode: 'TEMPLATE_GEN_CRITICAL_ERROR',
      error: error.message
    });
    return null;
  }
}

exports.generateTemplateAI = generateTemplateAI;

// Helper functions for advanced AI processing
const generateAIInsights = (responses, package, features) => {
  const insights = [];

  if (responses.businessType === 'ecommerce') {
    insights.push('Your e-commerce focus suggests high potential for conversion optimization through streamlined checkout processes.');
  }

  if (features.includes('seo')) {
    insights.push('SEO implementation will significantly boost your organic search visibility and long-term traffic growth.');
  }

  if (features.includes('analytics')) {
    insights.push('Advanced analytics will provide actionable insights for continuous website optimization.');
  }

  if (package === 'enterprise') {
    insights.push('Enterprise package selected due to complex requirements and scalability needs.');
  }

  return insights.join(' ');
};

const generatePriceBreakdown = (features, basePrice) => {
  const breakdown = {
    basePackage: basePrice,
    features: {},
    total: basePrice
  };

  const featureCosts = {
    ecommerce: 300,
    payment_processing: 200,
    booking_system: 150,
    mobile_app: 1000,
    ai_chatbot: 400,
    analytics: 100
  };

  features.forEach(feature => {
    if (featureCosts[feature]) {
      breakdown.features[feature] = featureCosts[feature];
      breakdown.total += featureCosts[feature];
    }
  });

  return breakdown;
};

/**
 * Generate a real AI mockup image using DALL-E
 */
const generateMockupAI = async (businessType, features, preferredStyle) => {
  if (!openai) {
    if (process.env.NODE_ENV === 'production') {
      return null;
    }
    return `https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=1000&auto=format&fit=crop&text=${encodeURIComponent(businessType + ' Website')}`;
  }
  try {
    const prompt = `A professional, high-fidelity website mockup for a ${businessType} business. 
    Style: ${preferredStyle || 'modern and clean'}. 
    Features to highlight: ${features.join(', ')}. 
    The image should show a desktop browser view of a beautiful landing page with high-quality UI elements, 
    sleek typography, and professional imagery. Digital art, 4k resolution, UI/UX design showcase.`;

    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: prompt,
      n: 1,
      size: "1024x1024",
      quality: "hd",
    });

    return response.data[0].url;
  } catch (error) {
    logger.error('DALL-E Mockup generation failed', {
      errorCode: 'MOCKUP_GENERATION_AI_ERROR',
      error: error.message
    });
    // Fallback to a high-quality Unsplash image based on business type
    if (process.env.NODE_ENV === 'production') {
      return null;
    }
    return `https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=1000&auto=format&fit=crop&text=${encodeURIComponent(businessType + ' Website')}`;
  }
};


const generateCustomizations = (package, responses) => {
  const customizations = ['Brand colors', 'Logo integration', 'Content optimization'];

  if (package === 'pro_enhancement' || package === 'enterprise') {
    customizations.push('Custom animations', 'Advanced interactions');
  }

  if (responses.businessType === 'ecommerce') {
    customizations.push('Product catalog design', 'Shopping cart UX');
  }

  return customizations;
};

const assessRisks = (responses, package) => {
  const risks = [];

  if (responses.timeline === 'asap' && package !== 'ai_foundation') {
    risks.push('Tight timeline may require scope adjustments');
  }

  if (responses.budget === 'under_1000' && package === 'enterprise') {
    risks.push('Budget constraints may limit full feature implementation');
  }

  if (!responses.experience || responses.experience === 'beginner') {
    risks.push('Learning curve for content management system');
  }

  return risks.length > 0 ? risks : ['Low risk - well-matched solution'];
};

const generateCompetitorAnalysis = (businessType) => {
  const analyses = {
    ecommerce: 'Competitors using outdated designs; opportunity for modern, conversion-focused approach',
    service: 'Service businesses often lack lead capture; strong potential for booking system integration',
    portfolio: 'Creative portfolios need visual impact; opportunity to showcase work effectively',
    blog: 'Content sites need SEO and social sharing; comprehensive content strategy required'
  };

  return analyses[businessType] || 'Standard competitive landscape with opportunities for differentiation';
};

const getMarketTrends = (businessType) => {
  const trends = {
    ecommerce: ['Mobile-first design', 'AI personalization', 'Sustainable practices'],
    service: ['Online booking systems', 'Video consultations', 'Service marketplaces'],
    portfolio: ['Interactive storytelling', 'WebGL animations', 'Portfolio management tools'],
    blog: ['Voice search optimization', 'Video content', 'Newsletter automation']
  };

  return trends[businessType] || ['Mobile responsiveness', 'Fast loading times', 'SEO optimization'];
};

const generateNextSteps = (package) => {
  const baseSteps = [
    'Schedule discovery call',
    'Review detailed proposal',
    'Content planning and preparation'
  ];

  if (package === 'ai_foundation') {
    baseSteps.push('AI-powered design generation', '1-week delivery');
  } else if (package === 'pro_enhancement') {
    baseSteps.push('Wireframing and prototyping', 'Development sprints', 'Quality assurance');
  } else if (package === 'self_hosted') {
    baseSteps.push('Core development', 'Prepare codebase for delivery', 'Documentation and deployment guide', 'Final handover meeting');
  } else {
    baseSteps.push('Requirements gathering', 'Architecture planning', 'Phased development');
  }

  return baseSteps;
};

// Assessment routes
exports.startAssessment = async (req, res) => {
  try {
    const { source = 'direct', referrer } = req.body;

    const sessionId = generateSessionId();
    const sessionToken = generateSessionToken(sessionId);

    const assessment = await prisma.assessment.create({
      data: {
        sessionId,
        source: source === 'direct' ? 'direct' : source, // Basic validation for enum
        referrer,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        responses: {}
      }
    });

    res.status(201).json({
      success: true,
      assessmentId: assessment.id,
      sessionToken,
      expiresAt: assessment.expiresAt
    });
  } catch (error) {
    logger.error('Start assessment error', {
      errorCode: 'START_ASSESSMENT_ERROR',
      error: error.message
    });
    res.status(500).json({
      success: false,
      message: 'Failed to start assessment'
    });
  }
};

// Export generateTemplateAI for use in other controllers
exports.generateTemplateAI = generateTemplateAI;

// Save questionnaire responses
exports.saveResponses = async (req, res) => {
  try {
    const { authorization } = req.headers;
    const sessionId = validateSessionToken(authorization?.replace('Bearer ', ''));

    if (!sessionId) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired session'
      });
    }

    const { step, responses } = req.body;

    const assessment = await prisma.assessment.findUnique({ where: { sessionId } });
    if (!assessment) {
      return res.status(404).json({
        success: false,
        message: 'Assessment not found'
      });
    }

    if (new Date() > assessment.expiresAt) {
      return res.status(410).json({
        success: false,
        message: 'Assessment has expired'
      });
    }

    // Update responses
    const updatedResponses = { ...assessment.responses, ...responses };
    const updatedAssessment = await prisma.assessment.update({
      where: { id: assessment.id },
      data: {
        responses: updatedResponses,
        updatedAt: new Date()
      }
    });

    const nextStep = step < 8 ? step + 1 : null;

    res.json({
      success: true,
      assessmentId: updatedAssessment.id,
      step,
      nextStep,
      progress: calculateCompletionPercentage(updatedResponses)
    });
  } catch (error) {
    logger.error('Save responses error', {
      errorCode: 'SAVE_RESPONSES_ERROR',
      error: error.message
    });
    res.status(500).json({
      success: false,
      message: 'Failed to save responses'
    });
  }
};

// Process assessment with AI
exports.processAssessment = async (req, res) => {
  try {
    const { authorization } = req.headers;
    const sessionId = validateSessionToken(authorization?.replace('Bearer ', ''));

    if (!sessionId) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired session'
      });
    }

    const { finalResponses } = req.body;

    // Check if database is available
    let assessment;
    try {
      assessment = await prisma.assessment.findUnique({ where: { sessionId } });
    } catch (dbError) {
      logger.error('Database connection error in processAssessment', {
        errorCode: 'PROCESS_ASSESSMENT_DB_CONN_ERROR',
        error: dbError.message
      });
      return res.status(503).json({
        success: false,
        message: 'Database temporarily unavailable. Please try again.',
        retryable: true
      });
    }

    if (!assessment) {
      return res.status(404).json({
        success: false,
        message: 'Assessment not found'
      });
    }

    // Update final responses
    const updatedResponses = { ...assessment.responses, ...finalResponses };
    try {
      await prisma.assessment.update({
        where: { id: assessment.id },
        data: {
          responses: updatedResponses,
          status: 'processing',
          processingStartedAt: new Date()
        }
      });
    } catch (dbError) {
      logger.error('Database update error in processAssessment', {
        errorCode: 'PROCESS_ASSESSMENT_DB_UPDATE_ERROR',
        error: dbError.message
      });
      return res.status(503).json({
        success: false,
        message: 'Database temporarily unavailable. Please try again.',
        retryable: true
      });
    }

    // Process with AI (synchronous - wait for results)
    const results = await processAssessmentAI(updatedResponses);
    
    try {
      await prisma.assessment.update({
        where: { id: assessment.id },
        data: {
          status: 'completed',
          results,
          processingCompletedAt: new Date()
        }
      });
    } catch (dbError) {
      logger.error('Database final update error in processAssessment', {
        errorCode: 'PROCESS_ASSESSMENT_DB_FINAL_ERROR',
        error: dbError.message
      });
      // Still return results even if final update fails
      logger.warn('Assessment processed but final save failed', { errorCode: 'ASSESSMENT_SAVE_FAILED' });
    }

    res.json({
      success: true,
      assessmentId: assessment.id,
      results,
      processedWithFallback: !results.aiGenerated // Flag to indicate if fallback was used
    });
  } catch (error) {
    logger.error('Process assessment error', {
      errorCode: 'PROCESS_ASSESSMENT_ERROR',
      error: error.message
    });
    res.status(500).json({
      success: false,
      message: 'Failed to process assessment. Please try again.',
      retryable: true
    });
  }
};

// Get assessment results
exports.getResults = async (req, res) => {
  try {
    const { authorization } = req.headers;
    const sessionId = validateSessionToken(authorization?.replace('Bearer ', ''));

    if (!sessionId) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired session'
      });
    }

    const assessment = await prisma.assessment.findUnique({ where: { sessionId } });
    if (!assessment) {
      return res.status(404).json({
        success: false,
        message: 'Assessment not found'
      });
    }

    if (assessment.status !== 'completed') {
      return res.status(202).json({
        success: false,
        message: 'Assessment still processing',
        status: assessment.status
      });
    }

    res.json({
      success: true,
      assessmentId: assessment.id,
      results: assessment.results,
      generatedAt: assessment.processingCompletedAt
    });
  } catch (error) {
    logger.error('Get results error', {
      errorCode: 'GET_ASSESSMENT_RESULTS_ERROR',
      error: error.message
    });
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve results'
    });
  }
};

// Convert assessment to lead
exports.convertToLead = async (req, res) => {
  try {
    const { authorization } = req.headers;
    const sessionId = validateSessionToken(authorization?.replace('Bearer ', ''));

    if (!sessionId) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired session'
      });
    }

    const { name, phone, company, website, timeline, consent, packageType } = req.body;
    const email = req.body.email?.toLowerCase();

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    const assessment = await prisma.assessment.findUnique({ where: { sessionId } });
    if (!assessment) {
      return res.status(404).json({
        success: false,
        message: 'Assessment not found'
      });
    }

    // 1. Handle User Creation
    logger.info('Handling user creation for lead conversion', { email });
    let user = await prisma.user.findUnique({ where: { email } });
    let isNewUser = false;
    let needsCredentials = false;
    let tempPassword = '';
    
    if (!user) {
      logger.info('User not found, creating new user', { email });
      isNewUser = true;
      needsCredentials = true;
    } else if (user.lastLogin === null) {
      // User exists but has never logged in (likely created via failed payment attempt)
      // We'll reset their password and send new credentials to be safe
      needsCredentials = true;
      logger.info('Existing user with no login detected, re-sending credentials', { email });
    } else {
      logger.info('Existing active user detected', { email, lastLogin: user.lastLogin });
    }

    if (needsCredentials) {
      tempPassword = crypto.randomBytes(8).toString('hex');
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(tempPassword, salt);
      
      if (isNewUser) {
        logger.info('Creating new user record', { email });
        user = await prisma.user.create({
          data: {
            name,
            email,
            phone,
            password: hashedPassword,
            role: 'user'
          }
        });
      } else {
        logger.info('Updating existing user password', { email });
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            password: hashedPassword,
            name: name || user.name,
            phone: phone || user.phone
          }
        });
      }

      // Send welcome email with credentials
      logger.info('Attempting to send welcome email with credentials', { email, name, isNewUser });
      try {
        await sendEmail({
          to: email,
          subject: 'Welcome to Sitemendr - Your Technical Blueprint is Ready',
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
              <div style="text-align: center; margin-bottom: 20px;">
                <h1 style="color: #0066FF; margin: 0;">Sitemendr AI</h1>
                <p style="color: #666; font-size: 14px; margin-top: 5px;">Modern Digital Infrastructure</p>
              </div>
              <h2 style="color: #333;">Protocol Initiated.</h2>
              <p>Welcome to Sitemendr, <strong>${name}</strong>!</p>
              <p>Your technical assessment is complete and your secure dashboard access has been provisioned.</p>
              <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 25px 0; border: 1px solid #e9ecef;">
                <h3 style="margin-top: 0; font-size: 16px; color: #333;">Login Credentials</h3>
                <p style="margin: 8px 0; font-family: monospace;"><strong>Email:</strong> ${email}</p>
                <p style="margin: 8px 0; font-family: monospace;"><strong>Password:</strong> ${tempPassword}</p>
              </div>
              <p>Please log in to your dashboard to view your personalized architecture details, AI-generated template, and next steps.</p>
              <div style="text-align: center; margin: 35px 0;">
                <a href="${process.env.FRONTEND_URL}/login" style="background: #0066FF; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Access Your Dashboard</a>
              </div>
              <p style="color: #666; font-size: 12px; border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px;">
                For security reasons, we recommend changing your password after your first login.<br>
                If you did not request this, please ignore this email.
              </p>
              <p style="font-size: 14px;">Best regards,<br><strong>The Sitemendr AI Team</strong></p>
            </div>
          `
        });
        logger.info('Welcome email sent successfully', { to: email });
      } catch (emailError) {
        logger.error('Failed to send welcome email', {
          errorCode: 'WELCOME_EMAIL_ERROR',
          userId: user.id,
          error: emailError.message
        });
      }
    } else {
      // Send notification email to existing user who HAS logged in before
      logger.info('Attempting to send update email to existing active user', { email, name });
      try {
        const emailInfo = await sendEmail({
          to: email,
          subject: 'Protocol Updated - Your New Sitemendr Assessment is Ready',
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
              <div style="text-align: center; margin-bottom: 20px;">
                <h1 style="color: #0066FF; margin: 0;">Sitemendr AI</h1>
              </div>
              <h2 style="color: #333;">Lead Updated.</h2>
              <p>Hello <strong>${name}</strong>,</p>
              <p>We've updated your profile with your latest technical assessment results.</p>
              <p>Your new personalized architecture blueprint and AI-generated template are now available in your dashboard.</p>
              <div style="text-align: center; margin: 35px 0;">
                <a href="${process.env.FRONTEND_URL}/login" style="background: #0066FF; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">View Updated Dashboard</a>
              </div>
              <p>Best regards,<br><strong>The Sitemendr AI Team</strong></p>
            </div>
          `
        });
        logger.info('Update email sent successfully', { messageId: emailInfo.messageId, to: email });
      } catch (emailError) {
        logger.error('Failed to send update email to existing user', {
          errorCode: 'UPDATE_EMAIL_ERROR',
          userId: user.id,
          error: emailError.message
        });
      }
    }

    // 2. Handle Lead creation/update
    let lead = await prisma.lead.findUnique({ where: { email } });
    if (lead) {
      // Update existing lead
      lead = await prisma.lead.update({
        where: { email },
        data: {
          source: 'assessment',
          sourceDetails: {
            ...lead.sourceDetails,
            assessmentId: assessment.id
          },
          qualification: {
            ...lead.qualification,
            budget: assessment.responses.budget,
            timeline: timeline || assessment.responses.timeline,
            requirements: assessment.responses.requiredFeatures
          },
          ownerId: user.id,
          lastActivity: new Date()
        }
      });
    } else {
      // Create new lead
      const leadData = {
        source: 'assessment',
        sourceDetails: {
          assessmentId: assessment.id
        },
        name,
        email,
        phone,
        company: {
          name: company,
          website
        },
        qualification: {
          budget: assessment.responses.budget,
          timeline: timeline || assessment.responses.timeline,
          requirements: assessment.responses.requiredFeatures,
          score: 0
        },
        ownerId: user.id,
        consent: {
          marketing: consent,
          analytics: true,
          thirdParty: false
        }
      };

      leadData.qualification.score = calculateLeadScore(leadData, assessment.responses);

      lead = await prisma.lead.create({
        data: leadData
      });
    }

    // 3. Create initial Subscription (Protocol Provisioning)
    const finalPackage = packageType || assessment.results?.recommendedPackage || 'ai_foundation';
    const estimatedPrice = assessment.results?.pricing?.estimatedTotal || 299;
    
    const subscription = await prisma.subscription.create({
      data: {
        userId: user.id,
        siteName: company || `${name}'s Project`,
        tier: finalPackage,
        planType: 'monthly', // Default to monthly
        price: estimatedPrice,
        createdAt: new Date(),
        milestones: {
          create: [
            {
              title: 'Business Analysis',
              description: 'AI-driven analysis of business requirements and goals.',
              status: 'COMPLETED',
              progress: 100,
              order: 1
            },
            {
              title: 'AI Prototype Generation',
              description: 'Generating customized visual assets and technical structure.',
              status: 'IN_PROGRESS',
              progress: 25,
              order: 2
            },
            {
              title: 'Expert Review',
              description: 'Manual verification of AI-generated architecture by senior developers.',
              status: 'PENDING',
              progress: 0,
              order: 3
            },
            {
              title: 'Client Feedback Loop',
              description: 'Interactive session to refine design and functionality.',
              status: 'PENDING',
              progress: 0,
              order: 4
            },
            {
              title: 'Infrastructure Launch',
              description: 'Final deployment to global CDN with performance optimization.',
              status: 'PENDING',
              progress: 0,
              order: 5
            }
          ]
        }
      }
    });

    // 4. Trigger AI Template Generation in the background
    if (assessment.results) {
      generateTemplateAI(subscription.id, assessment.responses, assessment.results)
        .catch(err => logger.error('Background template generation failed', {
          errorCode: 'BACKGROUND_TEMPLATE_GEN_ERROR',
          error: err.message
        }));
    }

    // 5. Update assessment
    await prisma.assessment.update({
      where: { id: assessment.id },
      data: {
        convertedToLead: true,
        leadId: lead.id
      }
    });

    // 6. Generate auth token for immediate access
    const authToken = generateAuthToken(user.id);

    res.status(201).json({
      success: true,
      leadId: lead.id,
      isNewUser,
      token: authToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      message: isNewUser 
        ? 'Protocol initiated. Your secure terminal access has been provisioned.' 
        : 'Lead updated. New protocol added to your secure terminal.',
      nextSteps: [
        'Log in to your dashboard to view your technical blueprint',
        'Expect an email with your personalized architecture details',
        'Schedule a free consultation call'
      ]
    });
  } catch (error) {
    logger.error('Convert to lead error', {
      errorCode: 'CONVERT_TO_LEAD_ERROR',
      error: error.message
    });
    if (error.code === 'P2002') { // Prisma unique constraint violation
      return res.status(400).json({
        success: false,
        message: 'Email already exists in our system'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Failed to capture lead'
    });
  }
};

// Get assessment statistics (admin only)
exports.getStats = async (_req, res) => {
  try {
    const totalAssessments = await prisma.assessment.count();
    const completedAssessments = await prisma.assessment.count({ where: { status: 'completed' } });
    const conversionRate = totalAssessments > 0 ? (completedAssessments / totalAssessments * 100).toFixed(1) : 0;

    // Get business type distribution (Prisma doesn't support grouping by Json fields directly as easily as aggregate)
    // We'll fetch and process in JS for now or use raw query if needed
    const assessments = await prisma.assessment.findMany({
      select: { responses: true }
    });

    const businessTypeCounts = {};
    assessments.forEach(a => {
      const type = a.responses.businessType || 'other';
      businessTypeCounts[type] = (businessTypeCounts[type] || 0) + 1;
    });

    const popularBusinessTypes = Object.entries(businessTypeCounts)
      .map(([type, count]) => ({ _id: type, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    res.json({
      success: true,
      stats: {
        totalAssessments,
        completedAssessments,
        conversionRate: parseFloat(conversionRate),
        popularBusinessTypes,
        averageCompletionTime: 5 // Mock data
      }
    });
  } catch (error) {
    logger.error('Get stats error', {
      errorCode: 'GET_ASSESSMENT_STATS_ERROR',
      error: error.message
    });
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve statistics'
    });
  }
};








