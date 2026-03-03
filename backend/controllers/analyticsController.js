const { prisma } = require('../config/db');
const logger = require('../config/logger');

// Get comprehensive analytics dashboard data
exports.getDashboardAnalytics = async (req, res) => {
  try {
    const { period = '30d' } = req.query;

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();

    switch (period) {
      case '7d':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(endDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(endDate.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
      default:
        startDate.setDate(endDate.getDate() - 30);
    }

    // User analytics
    const userStats = await getUserAnalytics(startDate, endDate);

    // Assessment analytics
    const assessmentStats = await getAssessmentAnalytics(startDate, endDate);

    // Lead analytics
    const leadStats = await getLeadAnalytics(startDate, endDate);

    // Revenue analytics
    const revenueStats = await getRevenueAnalytics(startDate, endDate);

    // Content analytics
    const contentStats = await getContentAnalytics(startDate, endDate);

    // Traffic and engagement
    const trafficStats = await getTrafficAnalytics(startDate, endDate);

    // Predictive analytics
    const predictions = await getPredictiveAnalytics(startDate, endDate);

    res.json({
      success: true,
      period,
      dateRange: { start: startDate, end: endDate },
      analytics: {
        users: userStats,
        assessments: assessmentStats,
        leads: leadStats,
        revenue: revenueStats,
        content: contentStats,
        traffic: trafficStats,
        predictions
      }
    });
  } catch (error) {
    logger.error('DASHBOARD_ANALYTICS_ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate analytics'
    });
  }
};

// User analytics
const getUserAnalytics = async (startDate, endDate) => {
  try {
    const [
      totalUsers,
      newUsers,
      activeUsers,
      userGrowth,
      userRetention,
      userSegments
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { createdAt: { gte: startDate, lte: endDate } } }),
      prisma.user.count({ where: { lastLogin: { gte: startDate, lte: endDate } } }),
      // User growth over time
      prisma.$queryRaw`
        SELECT 
          TO_CHAR("createdAt", 'YYYY-MM-DD') as _id,
          COUNT(*)::int as count
        FROM "User"
        WHERE "createdAt" >= ${startDate} AND "createdAt" <= ${endDate}
        GROUP BY _id
        ORDER BY _id ASC
      `,
      // User retention (simplified)
      prisma.user.count({
        where: {
          createdAt: { lt: startDate },
          lastLogin: { gte: startDate, lte: endDate }
        }
      }),
      // User segments by role
      prisma.user.groupBy({
        by: ['role'],
        _count: {
          _all: true
        }
      })
    ]);

    return {
      total: totalUsers,
      new: newUsers,
      active: activeUsers,
      growth: userGrowth.map(row => ({ date: row._id, count: row.count })),
      retention: userRetention,
      segments: userSegments
    };
  } catch (error) {
    logger.error('GET_USER_ANALYTICS_ERROR:', error);
    return {
      total: 0,
      new: 0,
      active: 0,
      growth: [],
      retention: 0,
      segments: []
    };
  }
};

// Assessment analytics
const getAssessmentAnalytics = async (startDate, endDate) => {
  try {
    const [total, converted, trends] = await Promise.all([
      prisma.assessment.count({ where: { createdAt: { gte: startDate, lte: endDate } } }),
      prisma.assessment.count({ where: { convertedToLead: true, createdAt: { gte: startDate, lte: endDate } } }),
      prisma.$queryRaw`
        SELECT 
          TO_CHAR("createdAt", 'YYYY-MM-DD') as _id,
          COUNT(*)::int as count
        FROM "Assessment"
        WHERE "createdAt" >= ${startDate} AND "createdAt" <= ${endDate}
        GROUP BY _id
        ORDER BY _id ASC
      `
    ]);

    const conversionRate = total > 0 ? Math.round((converted / total) * 100) : 0;

    return {
      total,
      conversionRate,
      trends: trends.map(row => ({ date: row._id, count: row.count }))
    };
  } catch (error) {
    logger.error('GET_ASSESSMENT_ANALYTICS_ERROR:', error);
    return { total: 0, conversionRate: 0, trends: [] };
  }
};

// Lead analytics
const getLeadAnalytics = async (startDate, endDate) => {
  try {
    const [total, converted, trends] = await Promise.all([
      prisma.lead.count({ where: { createdAt: { gte: startDate, lte: endDate } } }),
      prisma.lead.count({ where: { converted: true, createdAt: { gte: startDate, lte: endDate } } }),
      prisma.$queryRaw`
        SELECT 
          TO_CHAR("createdAt", 'YYYY-MM-DD') as _id,
          COUNT(*)::int as count
        FROM "Lead"
        WHERE "createdAt" >= ${startDate} AND "createdAt" <= ${endDate}
        GROUP BY _id
        ORDER BY _id ASC
      `
    ]);

    const conversionRate = total > 0 ? Math.round((converted / total) * 100) : 0;

    return {
      total,
      conversionRate,
      trends: trends.map(row => ({ date: row._id, count: row.count }))
    };
  } catch (error) {
    logger.error('GET_LEAD_ANALYTICS_ERROR:', error);
    return { total: 0, conversionRate: 0, trends: [] };
  }
};

// Revenue analytics
const getRevenueAnalytics = async (startDate, endDate) => {
  try {
    const [aggregate, trends] = await Promise.all([
      prisma.payment.aggregate({
        where: { status: 'success', createdAt: { gte: startDate, lte: endDate } },
        _sum: { amount: true },
        _count: { _all: true }
      }),
      prisma.$queryRaw`
        SELECT 
          TO_CHAR("createdAt", 'YYYY-MM-DD') as _id,
          SUM("amount")::float as amount,
          COUNT(*)::int as count
        FROM "Payment"
        WHERE status = 'success' AND "createdAt" >= ${startDate} AND "createdAt" <= ${endDate}
        GROUP BY _id
        ORDER BY _id ASC
      `
    ]);

    const total = aggregate._sum.amount || 0;
    const count = aggregate._count._all || 0;
    const averageOrderValue = count > 0 ? Math.round((total / count) * 100) / 100 : 0;

    return {
      total,
      averageOrderValue,
      trends: trends.map(row => ({ date: row._id, amount: Number(row.amount || 0) }))
    };
  } catch (error) {
    logger.error('GET_REVENUE_ANALYTICS_ERROR:', error);
    return { total: 0, averageOrderValue: 0, trends: [] };
  }
};

// Content analytics
const getContentAnalytics = async () => {
  try {
    const [totalPosts, publishedPosts, draftPosts, viewAgg] = await Promise.all([
      prisma.blogPost.count(),
      prisma.blogPost.count({ where: { status: 'published' } }),
      prisma.blogPost.count({ where: { status: 'draft' } }),
      prisma.blogPost.aggregate({ _sum: { views: true } })
    ]);

    return {
      totalPosts,
      published: publishedPosts,
      drafts: draftPosts,
      totalViews: viewAgg._sum.views || 0
    };
  } catch (error) {
    logger.error('GET_CONTENT_ANALYTICS_ERROR:', error);
    return { totalPosts: 0, published: 0, drafts: 0, totalViews: 0 };
  }
};

// Traffic analytics
const getTrafficAnalytics = async () => {
  try {
    const [viewAgg, topBlogPosts] = await Promise.all([
      prisma.blogPost.aggregate({ _sum: { views: true } }),
      prisma.blogPost.findMany({
        orderBy: { views: 'desc' },
        take: 5,
        select: { slug: true, views: true }
      })
    ]);

    const totalViews = viewAgg._sum.views || 0;

    return {
      pageViews: totalViews,
      uniqueVisitors: null,
      bounceRate: null,
      avgSessionDuration: null,
      topPages: topBlogPosts.map(p => ({
        path: `/blog/${p.slug}`,
        views: p.views,
        bounceRate: null
      })),
      trafficSources: [],
      deviceTypes: []
    };
  } catch (error) {
    logger.error('GET_TRAFFIC_ANALYTICS_ERROR:', error);
    return {
      pageViews: 0,
      uniqueVisitors: 0,
      bounceRate: 0,
      avgSessionDuration: 0,
      topPages: [],
      trafficSources: [],
      deviceTypes: []
    };
  }
};

// Predictive analytics
const getPredictiveAnalytics = async (startDate, endDate) => {
  // Simple predictive analytics based on historical data
  const [
    userGrowthTrend,
    revenueTrend,
    leadConversionTrend
  ] = await Promise.all([
    // User growth trend
    prisma.$queryRaw`
      SELECT 
        TO_CHAR("createdAt", 'YYYY-MM-DD') as _id,
        COUNT(*)::int as count
      FROM "User"
      WHERE "createdAt" >= ${startDate} AND "createdAt" <= ${endDate}
      GROUP BY _id
      ORDER BY _id ASC
      LIMIT 30
    `,
    // Revenue trend
    prisma.$queryRaw`
      SELECT 
        TO_CHAR("createdAt", 'YYYY-MM-DD') as _id,
        SUM("amount") as revenue
      FROM "Payment"
      WHERE status = 'success' AND "createdAt" >= ${startDate} AND "createdAt" <= ${endDate}
      GROUP BY _id
      ORDER BY _id ASC
      LIMIT 30
    `,
    // Lead conversion trend
    prisma.$queryRaw`
      SELECT 
        TO_CHAR("createdAt", 'YYYY-MM-DD') as _id,
        COUNT(*)::int as total,
        COUNT(*) FILTER (WHERE status = 'converted')::int as converted
      FROM "Lead"
      WHERE "createdAt" >= ${startDate} AND "createdAt" <= ${endDate}
      GROUP BY _id
      ORDER BY _id ASC
      LIMIT 30
    `
  ]);

  // Simple linear regression for predictions
  const predictNextValue = (data, days = 7) => {
    if (data.length < 2) return 0;

    const n = data.length;
    const sumX = (n * (n - 1)) / 2;
    const sumY = data.reduce((sum, val) => sum + val, 0);
    const sumXY = data.reduce((sum, val, idx) => sum + (val * idx), 0);
    const sumXX = (n * (n - 1) * (2 * n - 1)) / 6;

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    return Math.max(0, Math.round(intercept + slope * (n + days - 1)));
  };

  const userValues = userGrowthTrend.map(d => d.count);
  const revenueValues = revenueTrend.map(d => d.revenue / 100); // Convert subunits (cents/kobo) to main currency units
  const conversionValues = leadConversionTrend.map(d =>
    d.total > 0 ? (d.converted / d.total) * 100 : 0
  );

  return {
    nextWeekUsers: predictNextValue(userValues, 7),
    nextWeekRevenue: predictNextValue(revenueValues, 7),
    nextWeekConversionRate: predictNextValue(conversionValues, 7),
    growthRate: {
      users: userValues.length > 1 ?
        ((userValues[userValues.length - 1] - userValues[0]) / userValues[0] * 100).toFixed(1) : 0,
      revenue: revenueValues.length > 1 ?
        ((revenueValues[revenueValues.length - 1] - revenueValues[0]) / revenueValues[0] * 100).toFixed(1) : 0
    },
    recommendations: generateRecommendations(userGrowthTrend, revenueTrend, leadConversionTrend)
  };
};

// Generate AI-powered recommendations
const generateRecommendations = (userTrend, revenueTrend, conversionTrend) => {
  const recommendations = [];

  // User growth analysis
  if (userTrend.length > 7) {
    const recentUsers = userTrend.slice(-7).reduce((sum, d) => sum + d.count, 0);
    const previousUsers = userTrend.slice(-14, -7).reduce((sum, d) => sum + d.count, 0);

    if (recentUsers < previousUsers * 0.8) {
      recommendations.push({
        type: 'warning',
        category: 'user_acquisition',
        message: 'User acquisition is declining. Consider increasing marketing spend or improving SEO.',
        priority: 'high'
      });
    }
  }

  // Revenue analysis
  if (revenueTrend.length > 7) {
    const recentRevenue = revenueTrend.slice(-7).reduce((sum, d) => sum + d.revenue, 0);
    const previousRevenue = revenueTrend.slice(-14, -7).reduce((sum, d) => sum + d.revenue, 0);

    if (recentRevenue > previousRevenue * 1.2) {
      recommendations.push({
        type: 'success',
        category: 'revenue',
        message: 'Revenue is growing strongly. Consider scaling successful marketing channels.',
        priority: 'medium'
      });
    }
  }

  // Conversion analysis
  if (conversionTrend.length > 7) {
    const recentConversion = conversionTrend.map(d => d.total > 0 ? (d.converted / d.total) * 100 : 0).slice(-7);
    const avgConversion = recentConversion.reduce((sum, d) => sum + d, 0) / recentConversion.length;

    if (avgConversion < 10) {
      recommendations.push({
        type: 'warning',
        category: 'conversion',
        message: 'Lead conversion rate is below optimal. Review lead qualification process.',
        priority: 'high'
      });
    }
  }

  // Default recommendations
  if (recommendations.length === 0) {
    recommendations.push({
      type: 'info',
      category: 'general',
      message: 'Continue current strategies. Monitor key metrics regularly.',
      priority: 'low'
    });
  }

  return recommendations;
};

// Export analytics data
exports.exportAnalytics = async (req, res) => {
  try {
    const { type, format = 'json', period = '30d' } = req.query;

    // Get analytics data - manual call since we can't easily call exports.getDashboardAnalytics without req/res
    const endDate = new Date();
    const startDate = new Date();
    switch (period) {
      case '7d': startDate.setDate(endDate.getDate() - 7); break;
      case '30d': startDate.setDate(endDate.getDate() - 30); break;
      case '90d': startDate.setDate(endDate.getDate() - 90); break;
      case '1y': startDate.setFullYear(endDate.getFullYear() - 1); break;
      default: startDate.setDate(endDate.getDate() - 30);
    }

    const analytics = {
      users: await getUserAnalytics(startDate, endDate),
      revenue: await getRevenueAnalytics(startDate, endDate)
    };

    if (format === 'csv') {
      // Convert to CSV format
      const csvData = convertToCSV({ analytics }, type);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=${type}_analytics_${period}.csv`);
      res.send(csvData);
    } else {
      res.json({ success: true, analytics });
    }
  } catch (error) {
    logger.error('EXPORT_ANALYTICS_ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export analytics'
    });
  }
};

// Helper function to convert data to CSV
const convertToCSV = (data, type) => {
  let csv = '';

  switch (type) {
    case 'users':
      csv = 'Date,New Users,Active Users\n';
      data.analytics.users.growth.forEach(row => {
        csv += `${row.date || row._id},${row.count},0\n`;
      });
      break;
    case 'revenue':
      csv = 'Date,Revenue,Orders\n';
      data.analytics.revenue.trends.forEach(row => {
        csv += `${row.date || row._id},${row.amount || row.revenue / 100},0\n`;
      });
      break;
    default:
      csv = 'Metric,Value\n';
      csv += `Total Users,${data.analytics.users.total}\n`;
      csv += `Total Revenue,${data.analytics.revenue.total}\n`;
  }

  return csv;
};
