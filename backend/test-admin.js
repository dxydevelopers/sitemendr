
const axios = require('axios');
const BASE_URL = 'http://localhost:5000';

async function testAdmin() {
  try {
    console.log('Logging in as admin...');
    const loginRes = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'admin@sitemendr.com',
      password: 'admin123'
    });

    if (!loginRes.data.success) {
      console.error('Admin login failed');
      return;
    }

    const token = loginRes.data.token;
    console.log('Admin token obtained');

    const headers = { Authorization: `Bearer ${token}` };

    console.log('Testing /api/admin/dashboard/stats...');
    const statsRes = await axios.get(`${BASE_URL}/api/admin/dashboard/stats`, { headers });
    console.log('Stats status:', statsRes.status);
    console.log('Stats data:', JSON.stringify(statsRes.data, null, 2));

    console.log('Testing /api/admin/users...');
    const usersRes = await axios.get(`${BASE_URL}/api/admin/users`, { headers });
    console.log('Users count:', usersRes.data.data.length);

    console.log('Admin tests completed successfully');
  } catch (error) {
    console.error('Admin test failed:', error.response ? error.response.data : error.message);
  }
}

testAdmin();
