
const axios = require('axios');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const BASE_URL = 'http://localhost:5000';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

const log = (message, color = 'reset') => {
  console.log(`${colors[color]}${message}${colors.reset}`);
};

const runAssessmentTest = async () => {
  log('\n========================================', 'cyan');
  log('   SITEMENDR ASSESSMENT FLOW TEST', 'cyan');
  log('========================================\n', 'cyan');

  try {
    // 1. Start Assessment
    log('1. Starting Assessment...', 'blue');
    const startRes = await axios.post(`${BASE_URL}/api/assessment/start`, {
      source: 'homepage'
    });
    
    if (!startRes.data.success || !startRes.data.assessmentId) {
      throw new Error('Failed to start assessment');
    }
    
    const assessmentId = startRes.data.assessmentId;
    const sessionToken = startRes.data.sessionToken;
    log(`   ✓ Assessment started. ID: ${assessmentId}`, 'green');

    // 2. Process Assessment
    log('\n2. Processing Assessment (AI Analysis)...', 'blue');
    const dummyResponses = {
      businessType: 'ecommerce',
      employeeCount: '2-10 employees',
      goals: ['Generate leads/inquiries', 'Sell products online'],
      targetAudience: ['Small business owners'],
      hasWebsite: 'no',
      preferredStyle: 'modern',
      requiredFeatures: ['ecommerce', 'payment_processing', 'seo'],
      budget: '3000_5000',
      timeline: '1_month',
      name: 'Test User',
      email: `test_assessment_${Date.now()}@sitemendr.com`,
      phone: '1234567890',
      company: 'Test E-commerce Co',
      website: ''
    };

    const processRes = await axios.post(
      `${BASE_URL}/api/assessment/${assessmentId}/process`, 
      { finalResponses: dummyResponses },
      { headers: { Authorization: `Bearer ${sessionToken}` } }
    );

    if (!processRes.data.success || !processRes.data.results) {
      throw new Error('Failed to process assessment');
    }

    log(`   ✓ Assessment processed. Recommended: ${processRes.data.results.recommendedPackage}`, 'green');
    log(`   ✓ Mockup URL: ${processRes.data.results.mockupUrl}`, 'green');

    // 3. Convert to Lead
    log('\n3. Converting to Lead (Account Provisioning)...', 'blue');
    const leadRes = await axios.post(
      `${BASE_URL}/api/assessment/${assessmentId}/lead`,
      {
        ...dummyResponses,
        consent: true,
        packageType: processRes.data.results.recommendedPackage
      },
      { headers: { Authorization: `Bearer ${sessionToken}` } }
    );

    if (!leadRes.data.success || !leadRes.data.token) {
      throw new Error('Failed to convert to lead');
    }

    const authToken = leadRes.data.token;
    const userId = leadRes.data.user.id;
    log(`   ✓ Converted to Lead. User ID: ${userId}`, 'green');
    log(`   ✓ Auth Token: ${authToken.substring(0, 15)}...`, 'green');

    // 4. Verify Dashboard Data (Wait a bit for background template generation)
    log('\n4. Verifying Dashboard Data (Waiting for background tasks)...', 'blue');
    await new Promise(resolve => setTimeout(resolve, 5000));

    const projectsRes = await axios.get(`${BASE_URL}/api/client/projects`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    if (projectsRes.data.success && projectsRes.data.projects.length > 0) {
      log(`   ✓ Dashboard verified. Found ${projectsRes.data.projects.length} project(s).`, 'green');
      const project = projectsRes.data.projects[0];
      log(`   ✓ Project Name: ${project.name}`, 'green');
      log(`   ✓ Project Status: ${project.status}`, 'green');
      
      // Check for milestones
      if (project.milestones && project.milestones.length > 0) {
        log(`   ✓ Found ${project.milestones.length} milestones.`, 'green');
        const completedCount = project.milestones.filter(m => m.status === 'COMPLETED').length;
        log(`   ✓ ${completedCount} milestones completed.`, 'green');
      } else {
        log('   ✗ No milestones found (should have been created).', 'red');
      }
      
      // Check for template
      if (project.template) {
        log('   ✓ AI Template found in dashboard.', 'green');
      } else {
        log('   ⚠ AI Template not yet found (might still be generating).', 'yellow');
      }
    } else {
      log('   ✗ No projects found in dashboard.', 'red');
      console.log('   Response:', JSON.stringify(projectsRes.data, null, 2));
    }

    log('\n========================================', 'cyan');
    log('   TEST COMPLETED SUCCESSFULLY', 'green');
    log('========================================\n', 'cyan');

  } catch (error) {
    log(`\n✗ TEST FAILED: ${error.message}`, 'red');
    if (error.response) {
      console.log('  Response status:', error.response.status);
      console.log('  Response data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error(error);
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
};

runAssessmentTest();
