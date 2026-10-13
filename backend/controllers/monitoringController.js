const { prisma } = require('../config/db');
const axios = require('axios');
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
 * Analyze a website's performance and provide AI-driven insights
 */
exports.analyzeSitePerformance = async (req, res) => {
  try {
    const { url, subscriptionId } = req.body;
    const userId = req.user.userId;

    if (!url) {
      return res.status(400).json({ success: false, message: 'URL is required' });
    }

    if (!subscriptionId) {
      return res.status(400).json({ success: false, message: 'Select one of your sites before running a scan.' });
    }

    let parsedUrl;
    try {
      parsedUrl = new URL(url);
    } catch {
      return res.status(400).json({ success: false, message: 'Enter a valid site URL.' });
    }
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return res.status(400).json({ success: false, message: 'Only public HTTP or HTTPS site URLs can be scanned.' });
    }

    const ownedSite = await prisma.subscription.findFirst({
        where: { id: subscriptionId, userId },
        select: {
          id: true,
          domain: true,
          customDomains: { select: { domain: true } },
          projectRequests: {
            where: { serviceType: 'build', status: 'completed' },
            select: { launchUrl: true }
          }
        }
      });
    if (!ownedSite) {
      return res.status(403).json({ success: false, message: 'This site is not available in your workspace.' });
    }

    const allowedHosts = new Set([
      ownedSite.domain,
      ...ownedSite.customDomains.map(domain => domain.domain),
      ...ownedSite.projectRequests.map(request => {
        try { return new URL(request.launchUrl).hostname; } catch { return null; }
      })
    ].filter(Boolean).map(host => String(host).toLowerCase().replace(/^www\./, '')));
    if (!allowedHosts.has(parsedUrl.hostname.toLowerCase().replace(/^www\./, ''))) {
      return res.status(403).json({ success: false, message: 'The scan URL must belong to the selected site.' });
    }

    if (!process.env.PAGESPEED_API_KEY) {
      return res.status(503).json({ success: false, message: 'Real performance scans are not configured yet.' });
    }

    logger.info(`Analyzing performance for: ${url}`);
    let performanceMetrics;
    try {
      const psiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&key=${process.env.PAGESPEED_API_KEY}&category=performance`;
      const response = await axios.get(psiUrl, { timeout: 30000 });
      const lighthouse = response.data.lighthouseResult;

      if (typeof lighthouse?.categories?.performance?.score !== 'number') {
        throw new Error('PageSpeed returned no performance score');
      }

      performanceMetrics = {
        score: Math.round(lighthouse.categories.performance.score * 100),
        vitals: {
          fcp: lighthouse.audits['first-contentful-paint']?.displayValue || null,
          lcp: lighthouse.audits['largest-contentful-paint']?.displayValue || null,
          cls: lighthouse.audits['cumulative-layout-shift']?.displayValue || null,
          tti: lighthouse.audits['interactive']?.displayValue || null
        },
        issues: lighthouse.audits['diagnostics']?.details?.items?.slice(0, 3).map(i => i.label) || []
      };
      logger.info('Successfully fetched real PageSpeed metrics');
    } catch (psiError) {
      logger.error('PageSpeed API call failed:', psiError.message);
      return res.status(502).json({ success: false, message: 'The performance provider could not return a real scan. Please try again later.' });
    }

    // Use AI to generate actionable insights based on these metrics, with Groq fallback
    let aiInsights = { summary: '', actionPlan: [] };

    try {
      const aiResponse = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are the Sitemendr Performance Auditor. Analyze the following website metrics within the Sitemendr infrastructure context and provide 3-5 high-impact, technical recommendations for improvement. Return valid JSON with a 'summary' string and an 'actionPlan' array of objects containing 'task' and 'impact' fields. Tone should be professional and technical."
          },
          {
            role: "user",
            content: `Website URL: ${url}\nMetrics: ${JSON.stringify(performanceMetrics)}`
          }
        ],
        response_format: { type: "json_object" }
      });

      aiInsights = JSON.parse(aiResponse.choices[0].message.content);
    } catch (openaiError) {
      logger.error('OpenAI performance analysis error, trying Groq:', openaiError.message);
      
      try {
        const groqResponse = await groq.chat.completions.create({
          model: "llama-3.3-70b-versatile",
          messages: [
            {
              role: "system",
              content: "You are a performance optimization expert. Analyze the following website metrics and provide 3-5 high-impact, technical recommendations for improvement. Return valid JSON with a 'summary' string and an 'actionPlan' array of objects containing 'task' and 'impact' fields."
            },
            {
              role: "user",
              content: `Website URL: ${url}\nMetrics: ${JSON.stringify(performanceMetrics)}`
            }
          ],
          response_format: { type: "json_object" }
        });

        aiInsights = JSON.parse(groqResponse.choices[0].message.content);
        logger.info('Successfully used Groq for performance analysis');
      } catch (groqError) {
        logger.error('Groq performance analysis also failed:', groqError.message);
      }
    }

    const timestamp = new Date().toISOString();
    try {
      await prisma.subscription.update({
        where: { id: subscriptionId },
        data: {
          performanceData: {
            provider: 'pagespeed',
            url: parsedUrl.toString(),
            metrics: performanceMetrics,
            insights: aiInsights,
            timestamp
          }
        }
      });
      logger.info(`Performance report for subscription ${subscriptionId} saved.`);
    } catch (dbError) {
      logger.error(`Failed to save performance report for subscription ${subscriptionId}:`, dbError);
      return res.status(500).json({ success: false, message: 'The real scan completed, but Sitemendr could not save its results. Please try again.' });
    }

    res.json({
      success: true,
      data: {
        url: parsedUrl.toString(),
        metrics: performanceMetrics,
        aiInsights,
        timestamp
      }
    });
  } catch (error) {
    logger.error('Performance analysis error:', error);
    res.status(500).json({ success: false, message: 'Failed to analyze performance' });
  }
};

/**
 * Check site uptime
 */
exports.checkSiteUptime = async (req, res) => {
  try {
    const { url } = req.query;

    if (!url) {
      return res.status(400).json({ success: false, message: 'URL is required' });
    }

    const start = Date.now();
    try {
      const response = await axios.get(url, { timeout: 10000 });
      const responseTime = Date.now() - start;

      res.json({
        success: true,
        data: {
          url,
          status: 'UP',
          statusCode: response.status,
          responseTime: `${responseTime}ms`,
          timestamp: new Date().toISOString()
        }
      });
    } catch (err) {
      res.json({
        success: true,
        data: {
          url,
          status: 'DOWN',
          error: err.message,
          timestamp: new Date().toISOString()
        }
      });
    }
  } catch (error) {
    logger.error('Uptime check error:', error);
    res.status(500).json({ success: false, message: 'Failed to check uptime' });
  }
};
