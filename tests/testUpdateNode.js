require('dotenv').config();
const axios = require('axios');

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/api';
const API_SECRET = process.env.API_SECRET;

const testUpdateNode = async () => {
  console.log('=================================================');
  console.log('🧪 Testing Update Node Endpoint (PUT /api/node/:owner)');
  console.log('=================================================\n');

  if (!API_SECRET) {
    console.error('❌ ERROR: API_SECRET not found in .env file');
    console.error('   Please add API_SECRET to your .env file\n');
    process.exit(1);
  }

  // First, create a node to update
  const testOwner = 'updatetestuser';
  const initialNode = {
    owner: testOwner,
    name: 'update-test-server',
    ip: '10.0.0.50',
    url: 'updatetest.3speak.tv',
    comments: 'Initial node for update testing',
    enabled: true
  };

  console.log('📋 Setup: Creating test node first...');
  try {
    const createResponse = await axios.post(`${API_BASE_URL}/node`, initialNode, {
      headers: { 'X-API-Secret': API_SECRET }
    });
    console.log(`✅ Test node created: ${createResponse.data.data._id}\n`);
  } catch (error) {
    console.log('⚠️  Could not create test node (may already exist)\n');
  }

  // Test 1: Update node WITHOUT authentication (should fail)
  console.log('Test 1: Update node WITHOUT authentication');
  console.log('-------------------------------------------');
  try {
    await axios.put(`${API_BASE_URL}/node/${testOwner}`, {
      comments: 'Unauthorized update attempt'
    });
    console.log('❌ FAILED: Request should have been rejected\n');
  } catch (error) {
    if (error.response && error.response.status === 401) {
      console.log('✅ PASSED: Authentication required (401)');
      console.log(`   Message: ${error.response.data.message}\n`);
    } else {
      console.log('❌ FAILED: Unexpected error');
      console.log(`   ${error.message}\n`);
    }
  }

  // Test 2: Update node WITH wrong authentication (should fail)
  console.log('Test 2: Update node WITH wrong API secret');
  console.log('-------------------------------------------');
  try {
    await axios.put(`${API_BASE_URL}/node/${testOwner}`, {
      comments: 'Wrong secret update attempt'
    }, {
      headers: { 'X-API-Secret': 'wrong-secret-key' }
    });
    console.log('❌ FAILED: Request should have been rejected\n');
  } catch (error) {
    if (error.response && error.response.status === 403) {
      console.log('✅ PASSED: Invalid API secret rejected (403)');
      console.log(`   Message: ${error.response.data.message}\n`);
    } else {
      console.log('❌ FAILED: Unexpected error');
      console.log(`   ${error.message}\n`);
    }
  }

  // Test 3: Update node WITH correct authentication (should succeed)
  console.log('Test 3: Update node WITH correct authentication');
  console.log('-------------------------------------------');
  try {
    const updateData = {
      name: 'updated-test-server',
      comments: 'Successfully updated via PUT endpoint',
      enabled: false
    };

    const response = await axios.put(`${API_BASE_URL}/node/${testOwner}`, updateData, {
      headers: { 'X-API-Secret': API_SECRET }
    });
    
    if (response.status === 200) {
      console.log('✅ PASSED: Node updated successfully');
      console.log(`   Message: ${response.data.message}`);
      console.log(`   Name: ${response.data.data.name}`);
      console.log(`   Comments: ${response.data.data.comments}`);
      console.log(`   Enabled: ${response.data.data.enabled}\n`);
    }
  } catch (error) {
    console.log('❌ FAILED: Could not update node');
    console.log(`   ${error.response?.data?.message || error.message}\n`);
  }

  // Test 4: Update non-existent node (should fail)
  console.log('Test 4: Update non-existent node');
  console.log('-------------------------------------------');
  try {
    const response = await axios.put(`${API_BASE_URL}/node/nonexistentowner`, {
      comments: 'This should fail'
    }, {
      headers: { 'X-API-Secret': API_SECRET }
    });
    console.log('❌ FAILED: Request should have returned 404\n');
  } catch (error) {
    if (error.response && error.response.status === 404) {
      console.log('✅ PASSED: Non-existent node rejected (404)');
      console.log(`   Message: ${error.response.data.message}\n`);
    } else {
      console.log('❌ FAILED: Unexpected error');
      console.log(`   ${error.message}\n`);
    }
  }

  // Test 5: Partial update (only some fields)
  console.log('Test 5: Partial update (only some fields)');
  console.log('-------------------------------------------');
  try {
    const response = await axios.put(`${API_BASE_URL}/node/${testOwner}`, {
      enabled: true // Only update enabled field
    }, {
      headers: { 'X-API-Secret': API_SECRET }
    });
    
    if (response.status === 200) {
      console.log('✅ PASSED: Partial update successful');
      console.log(`   Enabled: ${response.data.data.enabled}`);
      console.log(`   Other fields preserved\n`);
    }
  } catch (error) {
    console.log('❌ FAILED: Could not perform partial update');
    console.log(`   ${error.response?.data?.message || error.message}\n`);
  }

  console.log('=================================================');
  console.log('✅ All tests completed!');
  console.log('=================================================\n');
};

// Run the tests
testUpdateNode();
