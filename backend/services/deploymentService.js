const { prisma } = require('../config/db');
const isProduction = process.env.NODE_ENV === 'production';
const logger = require('../config/logger');
const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');
const crypto = require('crypto');

/**
 * Deploy an AI-generated template
 * In production, this would integrate with Vercel/Netlify APIs
 */
exports.deployTemplate = async (subscriptionId) => {
  try {
    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
      select: {
        id: true,
        siteName: true,
        domain: true,
        tier: true,
        template: true,
        user: { select: { id: true, name: true, email: true } }
      }
    });

    if (!subscription || !subscription.template) {
      throw new Error('Subscription or template not found');
    }

    const { template, siteName, domain, tier } = subscription;
    const deployId = Math.random().toString(36).substr(2, 9);
    const siteSlug = siteName ? siteName.toLowerCase().replace(/[^a-z0-9]/g, '-') : `site-${deployId}`;
    
    // 1. Prepare files
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${siteName || 'AI Generated Site'}</title>
          <style>${template.css || ''}</style>
      </head>
      <body>
          ${template.html}
          ${template.js ? `<script>${template.js}</script>` : ''}
      </body>
      </html>
    `;

    // 2. Select Deployment Provider based on Tier or Config
    let deploymentResult;
    const provider = process.env.DEPLOYMENT_PROVIDER || (tier === 'enterprise' ? 'vercel' : 'local');

    if (isProduction && provider === 'local') {
      throw new Error('Deployment provider not configured');
    }

    if (provider === 'vercel') {
      deploymentResult = await deployToVercel({
        name: siteSlug,
        files: [{ file: 'index.html', data: htmlContent }]
      });
    } else if (provider === 'netlify') {
      deploymentResult = await deployToNetlify({
        name: siteSlug,
        files: [{ file: 'index.html', data: htmlContent }]
      });
    } else {
      // Local simulated deployment
      const deployDir = path.join(__dirname, '../deployed_sites', deployId);
      await fs.mkdir(deployDir, { recursive: true });
      await fs.writeFile(path.join(deployDir, 'index.html'), htmlContent);
      deploymentResult = {
        success: true,
        url: domain ? `https://${domain}` : `https://${siteSlug}.sitemendr.app`,
        deployId
      };
    }

    if (!deploymentResult.success) {
      throw new Error(`Deployment provider error: ${deploymentResult.message}`);
    }

    // 3. Update subscription with deployment info
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status: 'active',
        domain: domain || (deploymentResult.url.replace('https://', '').replace('http://', '')),
        updatedAt: new Date()
      },
      select: { id: true }
    });

    // 4. Update template status
    await prisma.template.update({
      where: { id: template.id },
      data: {
        isPublished: true,
        publishedAt: new Date()
      }
    });

    logger.info('Deployment successful', { subscriptionId, url: deploymentResult.url });

    return deploymentResult;
  } catch (error) {
    logger.error('Deployment failed', { 
      subscriptionId, 
      error: error.message 
    });
    return {
      success: false,
      message: error.message
    };
  }
};

/**
 * Integration for Vercel
 */
async function deployToVercel(config) {
  try {
    const token = process.env.VERCEL_TOKEN;
    const teamId = process.env.VERCEL_TEAM_ID;
    
    if (!token || token === 'your_vercel_token') {
      const message = 'VERCEL_TOKEN not found or placeholder';
      if (isProduction) {
        logger.error(message);
        return { success: false, message };
      }
      logger.warn('VERCEL_TOKEN not found or placeholder, using simulated Vercel deployment');
      return {
        success: true,
        url: `https://${config.name}.vercel.app`,
        provider: 'vercel',
        simulated: true
      };
    }

    logger.info(`Starting real Vercel deployment for ${config.name}`);

    const response = await axios.post(
      `https://api.vercel.com/v13/deployments${teamId ? `?teamId=${teamId}` : ''}`,
      {
        name: config.name,
        project: config.name,
        files: config.files.map(f => ({
          file: f.file,
          data: Buffer.from(f.data).toString('base64'),
          encoding: 'base64'
        })),
        projectSettings: {
          framework: null,
          buildCommand: null,
          outputDirectory: null
        }
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return {
      success: true,
      url: `https://${response.data.url}`,
      provider: 'vercel',
      deployId: response.data.id
    };
  } catch (error) {
    logger.error('Vercel deployment failed', { 
      error: error.response?.data?.error || error.message 
    });
    return { success: false, message: error.message };
  }
}

/**
 * Integration for Netlify
 */
async function deployToNetlify(config) {
  try {
    const token = process.env.NETLIFY_TOKEN;
    const siteId = process.env.NETLIFY_SITE_ID;

    if (!token || token === 'your_netlify_token' || !siteId || siteId === 'your_netlify_site_id') {
      const message = 'NETLIFY_TOKEN or NETLIFY_SITE_ID not configured';
      if (isProduction) {
        logger.error(message);
        return { success: false, message };
      }
      logger.warn('NETLIFY_TOKEN not found or placeholder, using simulated Netlify deployment');
      return {
        success: true,
        url: `https://${config.name}.netlify.app`,
        provider: 'netlify',
        simulated: true
      };
    }

    logger.info(`Starting real Netlify deployment for ${config.name}`);

    const files = {};
    for (const file of config.files) {
      files[file.file] = crypto.createHash('sha1').update(file.data).digest('hex');
    }

    const response = await axios.post(
      `https://api.netlify.com/api/v1/sites/${siteId}/deploys`,
      {
        files
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    const deployId = response.data.id;
    const required = response.data.required || [];

    for (const filePath of required) {
      const file = config.files.find(f => f.file === filePath);
      if (!file) {
        logger.warn(`Netlify deploy requested missing file: ${filePath}`);
        continue;
      }

      await axios.put(
        `https://api.netlify.com/api/v1/deploys/${deployId}/files/${encodeURIComponent(filePath)}`,
        file.data,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/octet-stream'
          },
          maxBodyLength: Infinity
        }
      );
    }

    return {
      success: true,
      url: response.data.ssl_url || response.data.url || `https://${config.name}.netlify.app`,
      provider: 'netlify',
      deployId
    };
  } catch (error) {
    logger.error('Netlify deployment failed', {
      error: error.response?.data?.message || error.message
    });
    return { success: false, message: error.message };
  }
}




