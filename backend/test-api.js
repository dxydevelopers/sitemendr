/**
 * Comprehensive API Testing Script
 * Tests all backend endpoints including Admin routes
 * Reports results to api-test-results.json
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const BASE_URL = 'http://localhost:5000';
const RESULTS_FILE = path.join(__dirname, 'api-test-results.json');

// Test results storage
const testResults = {
  timestamp: new Date().toISOString(),
  summary: {
    total: 0,
    passed: 0,
    failed: 0,
    skipped: 0
  },
  endpoints: []
};

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// Helper function to log with colors
const log = (message, color = 'reset') => {
  console.log(`${colors[color]}${message}${colors.reset}`);
};

// Helper function to test an endpoint
const testEndpoint = async (method, endpoint, data = null, headers = {}, description = '') => {
  const url = `${BASE_URL}${endpoint}`;
  const result = {
    method,
    endpoint,
    description,
    url,
    status: 'pending',
    statusCode: null,
    responseTime: null,
    error: null,
    data: null
  };

  testResults.summary.total++;

  try {
    const startTime = Date.now();
    const response = await axios({
      method,
      url,
      data,
      headers,
      timeout: 30000,
      validateStatus: () => true // Don't throw on any status code
    });
    const endTime = Date.now();

    result.statusCode = response.status;
    result.responseTime = endTime - startTime;
    result.data = response.data;

    if (response.status >= 200 && response.status < 400) {
      result.status = 'passed';
      testResults.summary.passed++;
      log(`✓ ${method.toUpperCase()} ${endpoint} - ${response.status} (${result.responseTime}ms)`, 'green');
    } else {
      result.status = 'failed';
      testResults.summary.failed++;
      log(`✗ ${method.toUpperCase()} ${endpoint} - ${response.status} (${result.responseTime}ms)`, 'red');
      if (response.data && response.data.message) {
        log(`  Error: ${response.data.message}`, 'yellow');
      }
    }
  } catch (error) {
    result.status = 'failed';
    testResults.summary.failed++;
    result.error = error.message;
    
    if (error.code === 'ECONNREFUSED') {
      log(`✗ ${method.toUpperCase()} ${endpoint} - Server not running`, 'red');
      result.error = 'Server not running (ECONNREFUSED)';
    } else {
      log(`✗ ${method.toUpperCase()} ${endpoint} - ${error.message}`, 'red');
    }
  }

  testResults.endpoints.push(result);
  return result;
};

const testAuthEndpoint = async (method, endpoint, token, data = null, description = '') => {
  return testEndpoint(method, endpoint, data, { Authorization: `Bearer ${token}` }, description);
};

// Main test function
const runTests = async () => {
  log('\n========================================', 'cyan');
  log('   SITEMENDR API FULL INFRASTRUCTURE TEST', 'cyan');
  log('========================================\n', 'cyan');

  let authToken = null;
  let testUserEmail = `test${Date.now()}@example.com`;

  // 1. HEALTH CHECK
  log('\n--- HEALTH CHECK ---', 'blue');
  await testEndpoint('GET', '/api/health', null, {}, 'Health check endpoint');

  // 2. AUTHENTICATION (User Flow)
  log('\n--- AUTHENTICATION ---', 'blue');
  const registerRes = await testEndpoint('POST', '/api/auth/register', {
    name: 'Test Infrastructure User',
    email: testUserEmail,
    password: 'TestPassword123!'
  }, {}, 'Register test user');

  const loginRes = await testEndpoint('POST', '/api/auth/login', {
    email: testUserEmail,
    password: 'TestPassword123!'
  }, {}, 'Login test user');

  if (loginRes.data && loginRes.data.token) {
    authToken = loginRes.data.token;
    log('  → User Auth Token Obtained', 'green');
  } else {
    log('  → CRITICAL: Failed to obtain auth token', 'red');
    process.exit(1);
  }

  // 3. PROMOTE TO ADMIN (Via Prisma Bypass)
  log('\n--- ADMIN ELEVATION ---', 'blue');
  try {
    await prisma.user.update({
      where: { email: testUserEmail },
      data: { role: 'admin' }
    });
    log(`  → User ${testUserEmail} successfully elevated to ADMIN`, 'green');
  } catch (err) {
    log(`  → FAILED TO ELEVATE USER: ${err.message}`, 'red');
    process.exit(1);
  }

  // 4. ADMIN ENDPOINTS VERIFICATION
  log('\n--- ADMIN ENDPOINTS ---', 'blue');
  
  await testAuthEndpoint('GET', '/api/admin/dashboard/stats', authToken, null, 'Get Admin Stats');
  await testAuthEndpoint('GET', '/api/admin/users', authToken, null, 'Get All Users');
  await testAuthEndpoint('GET', '/api/admin/leads', authToken, null, 'Get All Leads');
  await testAuthEndpoint('GET', '/api/admin/subscriptions', authToken, null, 'Get All Subscriptions');
  await testAuthEndpoint('GET', '/api/admin/assessments', authToken, null, 'Get All Assessments');
  await testAuthEndpoint('GET', '/api/admin/support', authToken, null, 'Get All Tickets');
  await testAuthEndpoint('GET', '/api/admin/analytics', authToken, null, 'Get Dashboard Analytics');
  await testAuthEndpoint('GET', '/api/admin/system/health', authToken, null, 'Get System Health');
  await testAuthEndpoint('GET', '/api/admin/settings/enforcement', authToken, null, 'Get Enforcement Settings');
  await testAuthEndpoint('GET', '/api/admin/comments', authToken, null, 'Get All Comments');
  await testAuthEndpoint('GET', '/api/admin/bookings', authToken, null, 'Get Admin Bookings');
  await testAuthEndpoint('GET', '/api/admin/blog', authToken, null, 'Get Admin Blog Posts');

  // 5. CLIENT DASHBOARD (Admin can also access)
  log('\n--- CLIENT DASHBOARD ---', 'blue');
  await testAuthEndpoint('GET', '/api/client/stats', authToken, null, 'Get Client Stats');
  await testAuthEndpoint('GET', '/api/client/projects', authToken, null, 'Get Client Projects');
  await testAuthEndpoint('GET', '/api/client/activities', authToken, null, 'Get Client Activities');
  await testAuthEndpoint('GET', '/api/client/billing', authToken, null, 'Get Client Billing');
  await testAuthEndpoint('GET', '/api/client/domains', authToken, null, 'Get Client Domains');

  // 6. BLOG FUNCTIONALITY
  log('\n--- BLOG ENGINE ---', 'blue');
  await testEndpoint('GET', '/api/blog/posts', null, {}, 'Get Published Posts');
  await testEndpoint('GET', '/api/blog/meta', null, {}, 'Get Blog Metadata');

  // 7. PAYMENTS & SUBSCRIPTIONS
  log('\n--- BILLING ENGINE ---', 'blue');
  await testEndpoint('POST', '/api/payments/initialize', {
    amount: 5000,
    email: testUserEmail,
    serviceType: 'subscription',
    description: 'Infrastructure Test'
  }, {}, 'Initialize Payment (Paystack)');
  
  await testAuthEndpoint('GET', '/api/subscriptions/my-subscription', authToken, null, 'Get My Subscription');

  // 8. AUTOMATION TRIGGERS (Admin Only)
  log('\n--- AUTOMATION PROTOCOLS ---', 'blue');
  await testAuthEndpoint('POST', '/api/admin/automation/suspension-check', authToken, {}, 'Trigger Suspension Audit');
  await testAuthEndpoint('POST', '/api/admin/automation/dns-verify', authToken, {}, 'Trigger DNS Verification');

  // SUMMARY
  log('\n========================================', 'cyan');
  log('   VERIFICATION SUMMARY', 'cyan');
  log('========================================\n', 'cyan');
  
  log(`Total Tests: ${testResults.summary.total}`, 'cyan');
  log(`Passed: ${testResults.summary.passed}`, 'green');
  log(`Failed: ${testResults.summary.failed}`, 'red');
  
  const successRate = ((testResults.summary.passed / testResults.summary.total) * 100).toFixed(2);
  log(`Success Rate: ${successRate}%\n`, 'cyan');

  // Save results to file
  fs.writeFileSync(RESULTS_FILE, JSON.stringify(testResults, null, 2));
  log(`\nDetailed results saved to: ${RESULTS_FILE}`, 'blue');

  await prisma.$disconnect();
  process.exit(testResults.summary.failed > 0 ? 1 : 0);
};

runTests().catch(async (error) => {
  log(`\nFATAL INFRASTRUCTURE ERROR: ${error.message}`, 'red');
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});
