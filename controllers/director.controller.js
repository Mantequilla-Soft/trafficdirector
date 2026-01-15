const HotNode = require('../models/Director.model');
const axios = require('axios');
const { filterHealthyNodes } = require('../utils/healthCheck');
const activityLogger = require('../utils/activityLogger');

// Round-robin counter stored in memory
let roundRobinIndex = 0;

// Get next available hot node using round-robin with health checks
exports.getHotNode = async (req, res) => {
  try {
    const timestamp = new Date().toISOString();
    console.log('\n=================================================');
    console.log(`[${timestamp}] 🔵 Hot node request from IP: ${req.ip}`);
    console.log('=================================================');

    // Get all enabled nodes sorted by lastUsed (least recently used first)
    console.log('📋 Querying database for enabled nodes...');
    const enabledNodes = await HotNode.find({ enabled: true }).sort({ lastUsed: 1 });

    console.log(`   Found ${enabledNodes.length} enabled node(s) in database`);
    
    if (enabledNodes.length > 0) {
      console.log('   Enabled nodes:');
      enabledNodes.forEach((node, index) => {
        console.log(`   ${index + 1}. ${node.owner} (${node.url}) - Last used: ${node.lastUsed}`);
      });
    }

    if (enabledNodes.length === 0) {
      console.log('❌ No enabled nodes found in database');
      console.log('=================================================\n');
      return res.status(503).json({
        success: false,
        message: 'No hot nodes available at this time'
      });
    }

    // Health check all enabled nodes
    console.log('\n🏥 Performing health checks...');
    const healthyNodes = await filterHealthyNodes(enabledNodes);

    console.log(`   Result: ${healthyNodes.length} healthy node(s)`);
    
    if (healthyNodes.length > 0) {
      console.log('   Healthy nodes:');
      healthyNodes.forEach((node, index) => {
        console.log(`   ${index + 1}. ${node.owner} (${node.url})`);
      });
    }

    if (healthyNodes.length === 0) {
      console.log('❌ No healthy nodes available');
      console.log('=================================================\n');
      return res.status(503).json({
        success: false,
        message: 'All hot nodes are currently unavailable. Please try again later.'
      });
    }

    // Round-robin selection
    const selectedIndex = roundRobinIndex % healthyNodes.length;
    const selectedNode = healthyNodes[selectedIndex];
    roundRobinIndex = (roundRobinIndex + 1) % healthyNodes.length;

    console.log(`\n🎯 Round-robin selection:`);
    console.log(`   Index: ${selectedIndex} of ${healthyNodes.length - 1}`);
    console.log(`   Selected: ${selectedNode.owner} (${selectedNode.url})`);
    console.log(`   Next index will be: ${roundRobinIndex}`);

    // Update last used timestamp
    selectedNode.lastUsed = new Date();
    await selectedNode.save();
    console.log(`   Updated lastUsed timestamp for ${selectedNode.owner}`);

    // Log activity for real-time dashboard
    activityLogger.logHotNodeRequest(req.ip, selectedNode.name, selectedNode.owner);

    const responseData = {
      success: true,
      data: {
        name: selectedNode.name,
        url: selectedNode.url,
        ip: selectedNode.ip,
        owner: selectedNode.owner
      }
    };

    console.log('\n✅ Responding with hot node:');
    console.log(`   Owner: ${selectedNode.owner}`);
    console.log(`   Name: ${selectedNode.name}`);
    console.log(`   URL: ${selectedNode.url}`);
    console.log(`   IP: ${selectedNode.ip}`);
    console.log('=================================================\n');

    res.status(200).json(responseData);
  } catch (error) {
    console.error('\n❌ ERROR in getHotNode:');
    console.error('=================================================');
    console.error('Error details:', error);
    console.error('Stack:', error.stack);
    console.error('=================================================\n');
    
    activityLogger.logError('Error in getHotNode', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching hot node',
      error: error.message
    });
  }
};


// Get node by owner
exports.getNodeByOwner = async (req, res) => {
  try {
    const { owner } = req.params;

    const node = await HotNode.findOne({ owner, enabled: true });

    if (!node) {
      return res.status(404).json({
        success: false,
        message: 'Node not found for this owner'
      });
    }

    // Update last used timestamp
    node.lastUsed = new Date();
    await node.save();

    res.status(200).json({
      success: true,
      data: {
        url: node.url,
        owner: node.owner,
        name: node.name,
        ip: node.ip
      }
    });
  } catch (error) {
    console.error('Error fetching node:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Create new hot node entry
exports.createNode = async (req, res) => {
  try {
    const { owner, name, ip, url, comments, enabled } = req.body;

    if (!owner || !name || !ip || !url) {
      return res.status(400).json({
        success: false,
        message: 'Owner, name, ip, and url are required'
      });
    }

    const node = await HotNode.create({
      owner,
      name,
      ip,
      url,
      comments,
      enabled
    });

    res.status(201).json({
      success: true,
      data: node
    });
  } catch (error) {
    console.error('Error creating node:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Make external API call with axios (example)
exports.makeExternalCall = async (req, res) => {
  try {
    const { url, payload } = req.body;

    if (!url) {
      return res.status(400).json({
        success: false,
        message: 'URL is required'
      });
    }

    const response = await axios.post(url, payload);

    res.status(200).json({
      success: true,
      data: response.data
    });
  } catch (error) {
    console.error('Error making external call:', error);
    res.status(500).json({
      success: false,
      message: 'External API call failed',
      error: error.message
    });
  }
};

// Get all hot nodes
exports.getAllNodes = async (req, res) => {
  try {
    const { enabled } = req.query;
    const filter = enabled !== undefined ? { enabled: enabled === 'true' } : {};
    
    const nodes = await HotNode.find(filter).sort({ lastUsed: -1 });

    res.status(200).json({
      success: true,
      count: nodes.length,
      data: nodes
    });
  } catch (error) {
    console.error('Error fetching nodes:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Update hot node by owner (authenticated)
exports.updateNode = async (req, res) => {
  try {
    const { owner } = req.params;
    const updateData = req.body;

    // Don't allow updating the owner field through this endpoint
    delete updateData.owner;

    const node = await HotNode.findOneAndUpdate(
      { owner },
      { ...updateData, lastUsed: new Date() },
      { new: true, runValidators: true }
    );

    if (!node) {
      return res.status(404).json({
        success: false,
        message: 'Node not found for this owner'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Node updated successfully',
      data: node
    });
  } catch (error) {
    console.error('Error updating node:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Create or update hot node (upsert) - authenticated
exports.createOrUpdateNode = async (req, res) => {
  try {
    const { owner, name, ip, url, comments, enabled } = req.body;

    if (!owner || !name || !ip || !url) {
      return res.status(400).json({
        success: false,
        message: 'Owner, name, ip, and url are required'
      });
    }

    const node = await HotNode.findOneAndUpdate(
      { owner },
      {
        owner,
        name,
        ip,
        url,
        comments: comments || '',
        enabled: enabled !== undefined ? enabled : true,
        lastUsed: new Date()
      },
      { 
        new: true, 
        upsert: true, 
        runValidators: true,
        setDefaultsOnInsert: true 
      }
    );

    const isNew = !node.createdAt || (new Date() - node.createdAt) < 1000;

    res.status(isNew ? 201 : 200).json({
      success: true,
      message: isNew ? 'Node created successfully' : 'Node updated successfully',
      data: node
    });
  } catch (error) {
    console.error('Error creating/updating node:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};
