require('dotenv').config();
const axios = require('axios');

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/api';

const testPublicEndpoints = async () => {
  console.log('=================================================');
  console.log('🧪 Testing Public Endpoints (No Authentication)');
  console.log('=================================================\n');

  // Test 1: Get all nodes
  console.log('Test 1: GET /api/nodes - Get all nodes');
  console.log('-------------------------------------------');
  try {
    const response = await axios.get(`${API_BASE_URL}/nodes`);
    
    if (response.status === 200) {
      console.log('✅ PASSED: Retrieved all nodes');
      console.log(`   Total nodes: ${response.data.count}`);
      console.log(`   Success: ${response.data.success}`);
      if (response.data.count > 0) {
        console.log(`   First node owner: ${response.data.data[0].owner}\n`);
      } else {
        console.log('   (No nodes in database)\n');
      }
    }
  } catch (error) {
    console.log('❌ FAILED: Could not retrieve nodes');
    console.log(`   ${error.response?.data?.message || error.message}\n`);
  }

  // Test 2: Get only enabled nodes
  console.log('Test 2: GET /api/nodes?enabled=true - Filter enabled nodes');
  console.log('-------------------------------------------');
  try {
    const response = await axios.get(`${API_BASE_URL}/nodes?enabled=true`);
    
    if (response.status === 200) {
      console.log('✅ PASSED: Retrieved enabled nodes');
      console.log(`   Enabled nodes: ${response.data.count}\n`);
    }
  } catch (error) {
    console.log('❌ FAILED: Could not retrieve enabled nodes');
    console.log(`   ${error.response?.data?.message || error.message}\n`);
  }

  // Test 3: Get node by owner (existing)
  console.log('Test 3: GET /api/node/:owner - Get specific node');
  console.log('-------------------------------------------');
  try {
    // First get all nodes to find an existing owner
    const allNodes = await axios.get(`${API_BASE_URL}/nodes`);
    
    if (allNodes.data.count > 0) {
      const existingOwner = allNodes.data.data[0].owner;
      const response = await axios.get(`${API_BASE_URL}/node/${existingOwner}`);
      
      if (response.status === 200) {
        console.log('✅ PASSED: Retrieved node by owner');
        console.log(`   Owner: ${response.data.data.owner}`);
        console.log(`   URL: ${response.data.data.url}`);
        console.log(`   Name: ${response.data.data.name}\n`);
      }
    } else {
      console.log('⚠️  SKIPPED: No nodes in database to test\n');
    }
  } catch (error) {
    console.log('❌ FAILED: Could not retrieve node by owner');
    console.log(`   ${error.response?.data?.message || error.message}\n`);
  }

  // Test 4: Get node by non-existent owner
  console.log('Test 4: GET /api/node/:owner - Non-existent owner');
  console.log('-------------------------------------------');
  try {
    await axios.get(`${API_BASE_URL}/node/nonexistentowner123456`);
    console.log('❌ FAILED: Should have returned 404\n');
  } catch (error) {
    if (error.response && error.response.status === 404) {
      console.log('✅ PASSED: Non-existent owner returns 404');
      console.log(`   Message: ${error.response.data.message}\n`);
    } else {
      console.log('❌ FAILED: Unexpected error');
      console.log(`   ${error.message}\n`);
    }
  }

  // Test 5: Health check endpoint
  console.log('Test 5: GET /health - Health check');
  console.log('-------------------------------------------');
  try {
    const response = await axios.get(`${API_BASE_URL.replace('/api', '')}/health`);
    
    if (response.status === 200) {
      console.log('✅ PASSED: Server is healthy');
      console.log(`   Status: ${response.data.status}`);
      console.log(`   Message: ${response.data.message}\n`);
    }
  } catch (error) {
    console.log('❌ FAILED: Health check failed');
    console.log(`   ${error.response?.data?.message || error.message}\n`);
  }

  console.log('=================================================');
  console.log('✅ All public endpoint tests completed!');
  console.log('=================================================\n');
};

// Run the tests
testPublicEndpoints();
