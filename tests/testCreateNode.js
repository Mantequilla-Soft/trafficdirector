require('dotenv').config();
const axios = require('axios');

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/api';
const API_SECRET = process.env.API_SECRET;

const testCreateNode = async () => {
  console.log('=================================================');
  console.log('🧪 Testing Create/Update Node Endpoint (POST /api/node)');
  console.log('=================================================\n');

  if (!API_SECRET) {
    console.error('❌ ERROR: API_SECRET not found in .env file');
    console.error('   Please add API_SECRET to your .env file\n');
    process.exit(1);
  }

  // Test data for a new node
  const newNode = {
    owner: 'testuser',
    name: 'test-server',
    ip: '192.168.1.100',
    url: 'test.3speak.tv',
    comments: 'Test node created via API',
    enabled: true
  };

  console.log('📋 Test Node Data:');
  console.log(JSON.stringify(newNode, null, 2));
  console.log('');

  // Test 1: Create node WITHOUT authentication (should fail)
  console.log('Test 1: Create node WITHOUT authentication');
  console.log('-------------------------------------------');
  try {
    await axios.post(`${API_BASE_URL}/node`, newNode);
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

  // Test 2: Create node WITH wrong authentication (should fail)
  console.log('Test 2: Create node WITH wrong API secret');
  console.log('-------------------------------------------');
  try {
    await axios.post(`${API_BASE_URL}/node`, newNode, {
      headers: { 'X-API-Secret': 'wrong-secret' }
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

  // Test 3: Create node WITH correct authentication (should succeed)
  console.log('Test 3: Create node WITH correct authentication');
  console.log('-------------------------------------------');
  try {
    const response = await axios.post(`${API_BASE_URL}/node`, newNode, {
      headers: { 'X-API-Secret': API_SECRET }
    });
    
    if (response.status === 201 || response.status === 200) {
      console.log('✅ PASSED: Node created/updated successfully');
      console.log(`   Status: ${response.status}`);
      console.log(`   Message: ${response.data.message}`);
      console.log(`   Owner: ${response.data.data.owner}`);
      console.log(`   ID: ${response.data.data._id}\n`);
    }
  } catch (error) {
    console.log('❌ FAILED: Could not create node');
    console.log(`   ${error.response?.data?.message || error.message}\n`);
  }

  // Test 4: Update the same node (upsert functionality)
  console.log('Test 4: Update existing node (upsert)');
  console.log('-------------------------------------------');
  try {
    const updatedNode = {
      ...newNode,
      comments: 'Updated test node via API',
      enabled: false
    };

    const response = await axios.post(`${API_BASE_URL}/node`, updatedNode, {
      headers: { 'X-API-Secret': API_SECRET }
    });
    
    if (response.status === 200) {
      console.log('✅ PASSED: Node updated successfully');
      console.log(`   Message: ${response.data.message}`);
      console.log(`   Comments: ${response.data.data.comments}`);
      console.log(`   Enabled: ${response.data.data.enabled}\n`);
    }
  } catch (error) {
    console.log('❌ FAILED: Could not update node');
    console.log(`   ${error.response?.data?.message || error.message}\n`);
  }

  // Test 5: Create node with missing required fields
  console.log('Test 5: Create node with missing required fields');
  console.log('-------------------------------------------');
  try {
    const invalidNode = { owner: 'testuser2' }; // Missing name, ip, url
    await axios.post(`${API_BASE_URL}/node`, invalidNode, {
      headers: { 'X-API-Secret': API_SECRET }
    });
    console.log('❌ FAILED: Request should have been rejected\n');
  } catch (error) {
    if (error.response && error.response.status === 400) {
      console.log('✅ PASSED: Invalid data rejected (400)');
      console.log(`   Message: ${error.response.data.message}\n`);
    } else {
      console.log('❌ FAILED: Unexpected error');
      console.log(`   ${error.message}\n`);
    }
  }

  console.log('=================================================');
  console.log('✅ All tests completed!');
  console.log('=================================================\n');
};

// Run the tests
testCreateNode();
