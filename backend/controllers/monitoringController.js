const { prisma } = require('../config/db');
const axios = require('axios');
const OpenAI = require('openai');
const Groq = require('groq-sdk');
const logger = require('../config/logger');
const { getSiteManagementLockReason } = require('../services/siteManagement');
const { checkPublicSiteAvailability, mergeSubscriptionPerformanceData, saveSiteAvailabilityCheck } = require('../services/publicSiteProbe');

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

const groq = process.env.GROQ_API_KEY
  ? new Groq({ apiKey: process.env.GROQ_API_KEY })
  : null;

function normalizePerformanceInsights(value) {
  const actionPlan = Array.isArray(value?.actionPlan)
    ? value.actionPlan.slice(0, 5).flatMap(item => {
        const task = typeof item?.task === 'string' ? item.task.trim().slice(0, 500) : '';
        if (!task) return [];
        const impact = typeof item.impact === 'string' ? item.impact.trim().slice(0, 80) : '';
        return [{ task, impact: impact || 'Review' }];
      })
    : [];
  return {
    summary: typeof value?.summary === 'string' ? value.summary.trim().slice(0, 1200) : '',
    actionPlan
  };
}

function getLighthouseRecommendations(lighthouse) {
  const auditRefs = Array.isArray(lighthouse?.categories?.performance?.auditRefs)
    ? lighthouse.categories.performance.auditRefs
    : [];
  return auditRefs
    .filter(reference => reference?.weight > 0)
    .map(reference => ({ reference, audit: lighthouse.audits?.[reference.id] }))
    .filter(({ audit }) => audit && audit.score != null && audit.score < 1 && audit.scoreDisplayMode !== 'notApplicable')
    .sort((left, right) => (right.reference.weight || 0) - (left.reference.weight || 0))
    .slice(0, 5)
    .map(({ reference, audit }) => ({
      task: `${audit.title || 'Review Lighthouse opportunity'}${audit.displayValue ? `: ${audit.displayValue}` : ''}`.slice(0, 500),
      impact: reference.weight >= 0.1 ? 'High potential' : 'Potential'
    }));
}

/**
 * Analyze a website's performance and provide AI-driven insights
 */
exports.analyzeSitePerformance = async (req, res) => {
  try {
    const { url, subscriptionId } = req.body;
    const strategy = req.body?.strategy || 'mobile';
    if (!['mobile', 'desktop'].includes(strategy)) {
      return res.status(400).json({ success: false, message: 'Choose a mobile or desktop scan.' });
    }
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
    if (parsedUrl.username || parsedUrl.password) {
      return res.status(400).json({ success: false, message: 'Remove sign-in details from the site URL before scanning.' });
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
    const managementLockReason = await getSiteManagementLockReason(userId, subscriptionId);
    if (managementLockReason) {
      return res.status(403).json({ success: false, message: managementLockReason });
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

    // Scans are for public pages. Query strings can contain one-time tokens
    // or private search values, so preserve the page path but omit query and
    // fragment data before sending the URL to Google or an AI provider.
    parsedUrl.search = '';
    parsedUrl.hash = '';
    const scanUrl = parsedUrl.toString();

    if (!process.env.PAGESPEED_API_KEY) {
      return res.status(503).json({ success: false, message: 'Real performance scans are not configured yet.' });
    }

    // Avoid writing query tokens or credentials from a client-provided URL to
    // application logs. Ownership has already been validated against this host.
    logger.info('Analyzing site performance', { subscriptionId, host: parsedUrl.hostname });
    let performanceMetrics;
    let scanConditions = {};
    try {
      const psiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(scanUrl)}&key=${process.env.PAGESPEED_API_KEY}&category=performance&strategy=${strategy}`;
      const response = await axios.get(psiUrl, { timeout: 30000 });
      const lighthouse = response.data.lighthouseResult;

      if (typeof lighthouse?.categories?.performance?.score !== 'number') {
        throw new Error('PageSpeed returned no performance score');
      }

      scanConditions = {
        strategy,
        formFactor: lighthouse.configSettings?.formFactor || strategy,
        lighthouseVersion: lighthouse.lighthouseVersion || null,
        fetchTime: lighthouse.fetchTime || null,
        environment: lighthouse.environment || null
      };

      const fieldInp = response.data.loadingExperience?.metrics?.INTERACTION_TO_NEXT_PAINT?.percentile
        ?? response.data.originLoadingExperience?.metrics?.INTERACTION_TO_NEXT_PAINT?.percentile;
      performanceMetrics = {
        score: Math.round(lighthouse.categories.performance.score * 100),
        vitals: {
          fcp: lighthouse.audits['first-contentful-paint']?.displayValue || null,
          lcp: lighthouse.audits['largest-contentful-paint']?.displayValue || null,
          cls: lighthouse.audits['cumulative-layout-shift']?.displayValue || null,
          inp: fieldInp != null && Number.isFinite(Number(fieldInp))
            ? `${Math.round(Number(fieldInp))} ms`
            : lighthouse.audits['interaction-to-next-paint']?.displayValue
              || lighthouse.audits['experimental-interaction-to-next-paint']?.displayValue
              || null,
          tbt: lighthouse.audits['total-blocking-time']?.displayValue || null
        },
        issues: lighthouse.audits['diagnostics']?.details?.items?.slice(0, 3).map(i => i.label) || []
      };
      performanceMetrics.recommendations = getLighthouseRecommendations(lighthouse);
      logger.info('Successfully fetched real PageSpeed metrics');
    } catch (psiError) {
      logger.error('PageSpeed API call failed', {
        status: psiError.response?.status || null,
        errorCode: psiError.code || null
      });
      return res.status(502).json({ success: false, message: 'The performance provider could not return a real scan. Please try again later.' });
    }

    // Use AI to generate actionable insights based on these metrics, with Groq fallback
    let aiInsights = { summary: '', actionPlan: [] };

    try {
      if (!openai) throw new Error('OPENAI_API_KEY is not configured');
      const aiResponse = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are the Sitemendr Performance Auditor. Analyze the following website metrics within the Sitemendr infrastructure context and provide 3-5 high-impact, technical recommendations for improvement. Return valid JSON with a 'summary' string and an 'actionPlan' array of objects containing 'task' and 'impact' fields. Tone should be professional and technical."
          },
          {
            role: "user",
            content: `Website URL: ${scanUrl}\nMetrics: ${JSON.stringify(performanceMetrics)}`
          }
        ],
        response_format: { type: "json_object" }
      });

      aiInsights = JSON.parse(aiResponse.choices[0].message.content);
    } catch (openaiError) {
      logger.error('OpenAI performance analysis error, trying Groq:', openaiError.message);
      
      try {
        if (!groq) throw new Error('GROQ_API_KEY is not configured');
        const groqResponse = await groq.chat.completions.create({
          model: "llama-3.3-70b-versatile",
          messages: [
            {
              role: "system",
              content: "You are a performance optimization expert. Analyze the following website metrics and provide 3-5 high-impact, technical recommendations for improvement. Return valid JSON with a 'summary' string and an 'actionPlan' array of objects containing 'task' and 'impact' fields."
            },
            {
              role: "user",
              content: `Website URL: ${scanUrl}\nMetrics: ${JSON.stringify(performanceMetrics)}`
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

    aiInsights = normalizePerformanceInsights(aiInsights);
    if (!aiInsights.actionPlan.length && performanceMetrics.recommendations.length) {
      aiInsights.actionPlan = performanceMetrics.recommendations;
      aiInsights.summary = aiInsights.summary || 'These opportunities were identified by Lighthouse. Review the suggested changes against your site goals.';
    }

    const timestamp = new Date().toISOString();
    let scan;
    try {
      const savedScan = await prisma.$transaction(async tx => {
        await mergeSubscriptionPerformanceData(tx, subscriptionId, {
          provider: 'pagespeed',
          strategy,
          url: scanUrl,
          metrics: performanceMetrics,
          insights: aiInsights,
          timestamp
        });
        return tx.performanceScan.create({
          data: {
            subscriptionId,
            provider: 'pagespeed',
            url: scanUrl,
            strategy,
            score: performanceMetrics.score,
            metrics: performanceMetrics,
            recommendations: Array.isArray(aiInsights.actionPlan) ? aiInsights.actionPlan : [],
            issues: performanceMetrics.issues,
            conditions: scanConditions,
            scannedAt: new Date(timestamp)
          }
        });
      });
      scan = savedScan;
      logger.info(`Performance report for subscription ${subscriptionId} saved.`);
    } catch (dbError) {
      logger.error(`Failed to save performance report for subscription ${subscriptionId}:`, dbError);
      const missingHistoryTable = dbError?.code === 'P2021'
        || dbError?.meta?.code === '42P01'
        || /PerformanceScan.*does not exist|relation .*PerformanceScan.* does not exist/i.test(String(dbError?.message || ''));
      if (!missingHistoryTable) {
        return res.status(500).json({ success: false, message: 'The real scan completed, but Sitemendr could not save its results. Please try again.' });
      }

      // Keep the existing latest-report feature usable until the additive
      // scan-history table is installed. This fallback writes only the
      // subscription's current report and never changes existing history.
      try {
        await mergeSubscriptionPerformanceData(prisma, subscriptionId, {
          provider: 'pagespeed',
          strategy,
          url: scanUrl,
          metrics: performanceMetrics,
          insights: aiInsights,
          timestamp
        });
      } catch (fallbackError) {
        logger.error(`Failed to save latest performance report for subscription ${subscriptionId}:`, fallbackError);
        return res.status(500).json({ success: false, message: 'The real scan completed, but Sitemendr could not save its results. Please try again.' });
      }

      logger.warn(`Performance scan history is unavailable for subscription ${subscriptionId}; saved latest report only.`);
      return res.json({
        success: true,
        data: { url: scanUrl, strategy, metrics: performanceMetrics, aiInsights, timestamp, scanId: null },
        historyAvailable: false,
        message: 'Scan complete. Saved the latest report; scan history will be available after storage setup.'
      });
    }

    res.json({
      success: true,
      data: {
        url: scanUrl,
        strategy,
        metrics: performanceMetrics,
        aiInsights,
        timestamp,
        scanId: scan.id
      },
      historyAvailable: true
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
    const subscriptionId = typeof req.query.subscriptionId === 'string' ? req.query.subscriptionId : '';
    if (!subscriptionId) return res.status(400).json({ success: false, message: 'Select one of your sites first.' });
    const site = await prisma.subscription.findFirst({
      where: { id: subscriptionId, userId: req.user.userId },
      select: { id: true, domain: true, customDomains: { select: { domain: true } }, projectRequests: {
        where: { serviceType: 'build', status: 'completed' }, select: { launchUrl: true }
      } }
    });
    if (!site) return res.status(404).json({ success: false, message: 'Site not found.' });
    const lockReason = await getSiteManagementLockReason(req.user.userId, subscriptionId);
    if (lockReason) return res.status(403).json({ success: false, message: lockReason });

    const hosts = [...(site.domain ? [site.domain] : []), ...site.customDomains.map(item => item.domain), ...site.projectRequests.map(item => {
      try { return new URL(item.launchUrl).hostname; } catch { return null; }
    })].filter(Boolean).map(host => String(host).toLowerCase().replace(/^www\./, ''));
    const host = hosts[0];
    if (!host) return res.status(409).json({ success: false, message: 'Add a domain to this site before checking uptime.' });

    const result = await checkPublicSiteAvailability(host);
    let saved = true;
    try {
      await saveSiteAvailabilityCheck(prisma, subscriptionId, result, 'manual');
    } catch (saveError) {
      saved = false;
      logger.error('UPTIME_RESULT_SAVE_FAILED', { subscriptionId, error: saveError.message });
    }
    res.json({
      success: true,
      data: { ...result, saved },
      ...(!saved ? { message: 'Availability was checked, but the latest result could not be saved.' } : {})
    });
  } catch (error) {
    if (['INVALID_SITE_URL', 'UNSAFE_SITE_URL', 'UNSAFE_SITE_ADDRESS'].includes(error?.code)) {
      return res.status(400).json({ success: false, message: error.message });
    }
    logger.error('Uptime check error:', error);
    res.status(500).json({ success: false, message: 'Failed to check uptime' });
  }
};
