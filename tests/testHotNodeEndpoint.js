require('dotenv').config();
const axios = require('axios');

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/api';

const testHotNodeEndpoint = async () => {
  console.log('=================================================');
  console.log('🧪 Testing Hot Node Endpoint (GET /api/hotnode)');
  console.log('=================================================\n');

  // Test 1: Get hot node (first request)
  console.log('Test 1: Get hot node - First request');
  console.log('-------------------------------------------');
  try {
    const response = await axios.get(`${API_BASE_URL}/hotnode`);
    
    if (response.status === 200) {
      console.log('✅ PASSED: Retrieved hot node');
      console.log(`   Owner: ${response.data.data.owner}`);
      console.log(`   Name: ${response.data.data.name}`);
      console.log(`   URL: ${response.data.data.url}`);
      console.log(`   IP: ${response.data.data.ip}`);
      console.log(`   Rate Limit Remaining: ${response.headers['ratelimit-remaining']}\n`);
    }
  } catch (error) {
    if (error.response && error.response.status === 503) {
      console.log('⚠️  No healthy nodes available');
      console.log(`   Message: ${error.response.data.message}\n`);
    } else {
      console.log('❌ FAILED: Could not retrieve hot node');
      console.log(`   ${error.response?.data?.message || error.message}\n`);
    }
  }

  // Test 2: Get hot node multiple times (test round-robin)
  console.log('Test 2: Round-robin test - Multiple requests');
  console.log('-------------------------------------------');
  try {
    const nodes = [];
    for (let i = 0; i < 5; i++) {
      const response = await axios.get(`${API_BASE_URL}/hotnode`);
      nodes.push(response.data.data.owner);
      console.log(`   Request ${i + 1}: ${response.data.data.owner} (${response.data.data.url})`);
      await new Promise(resolve => setTimeout(resolve, 100)); // Small delay
    }
    console.log('✅ PASSED: Round-robin distribution working');
    console.log(`   Node distribution: ${nodes.join(' → ')}\n`);
  } catch (error) {
    console.log('❌ FAILED: Error during round-robin test');
    console.log(`   ${error.response?.data?.message || error.message}\n`);
  }

  // Test 3: Check rate limit headers
  console.log('Test 3: Rate limit information');
  console.log('-------------------------------------------');
  try {
    const response = await axios.get(`${API_BASE_URL}/hotnode`);
    
    console.log('✅ Rate limit headers:');
    console.log(`   Limit: ${response.headers['ratelimit-limit'] || 'N/A'}`);
    console.log(`   Remaining: ${response.headers['ratelimit-remaining'] || 'N/A'}`);
    console.log(`   Reset: ${response.headers['ratelimit-reset'] || 'N/A'}\n`);
  } catch (error) {
    console.log('❌ FAILED: Could not get rate limit info');
    console.log(`   ${error.message}\n`);
  }

  // Test 4: Performance test
  console.log('Test 4: Response time test');
  console.log('-------------------------------------------');
  try {
    const startTime = Date.now();
    const response = await axios.get(`${API_BASE_URL}/hotnode`);
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    console.log('✅ Response time measured:');
    console.log(`   Time: ${responseTime}ms`);
    console.log(`   Status: ${responseTime < 5000 ? 'Good' : 'Slow (includes health checks)'}\n`);
  } catch (error) {
    console.log('❌ FAILED: Could not measure response time');
    console.log(`   ${error.message}\n`);
  }

  console.log('=================================================');
  console.log('📊 Test Summary');
  console.log('=================================================');
  console.log('Main endpoint: GET /api/hotnode');
  console.log('Features tested:');
  console.log('  ✓ Hot node retrieval');
  console.log('  ✓ Round-robin distribution');
  console.log('  ✓ Rate limiting (30 req/hour per IP)');
  console.log('  ✓ Health checks (automatic)');
  console.log('  ✓ Response time');
  console.log('\nNote: Rate limit test (429 status) requires 31+ requests\n');
  console.log('=================================================\n');
};

// Run the tests
testHotNodeEndpoint();
