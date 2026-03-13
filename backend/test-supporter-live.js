const axios = require('axios');

const BASE_URL = 'https://api.sitemendr.moonderiv.com';

async function testSupporterAPI() {
  console.log('Testing Supporter Tiers Endpoint...');
  try {
    const tiersRes = await axios.get(`${BASE_URL}/api/supporters/tiers`);
    console.log('Tiers Response Status:', tiersRes.status);
    console.log('Tiers Response Data:', JSON.stringify(tiersRes.data, null, 2));
  } catch (error) {
    console.error('Tiers Request Failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('Message:', error.message);
    }
  }

  console.log('\nTesting Payment Initialization for Supporter...');
  try {
    const paymentData = {
      email: 'test-supporter@example.com',
      serviceType: 'supporter',
      metadata: {
        tierId: '0926e7c7-08ab-4b61-84a6-44d5aefef68b' // Starter Supporter ID from my local check
      }
    };
    
    console.log('Sending Payment Data:', JSON.stringify(paymentData, null, 2));
    
    const paymentRes = await axios.post(`${BASE_URL}/api/payments/initialize`, paymentData);
    console.log('Payment Response Status:', paymentRes.status);
    console.log('Payment Response Data:', JSON.stringify(paymentRes.data, null, 2));
  } catch (error) {
    console.error('Payment Initialization Failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('Message:', error.message);
    }
  }
}

testSupporterAPI();
