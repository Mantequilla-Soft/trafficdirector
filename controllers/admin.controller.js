const HotNode = require('../models/Director.model');
const activityLogger = require('../utils/activityLogger');

// Show login page
exports.showLogin = (req, res) => {
  res.render('login', { error: null });
};

// Handle login
exports.login = (req, res) => {
  const { password } = req.body;
  
  if (password === process.env.ADMIN_PASSWORD) {
    req.session.isAdmin = true;
    // Save session before redirect to avoid race condition
    req.session.save((err) => {
      if (err) {
        console.error('Session save error:', err);
        return res.render('login', { error: 'Login error, please try again' });
      }
      activityLogger.logAdminAction('login', 'system');
      res.redirect('/admin/dashboard');
    });
  } else {
    res.render('login', { error: 'Invalid password' });
  }
};

// Handle logout
exports.logout = (req, res) => {
  activityLogger.logAdminAction('logout', 'system');
  req.session.destroy();
  res.redirect('/admin/login');
};

// Show dashboard
exports.showDashboard = async (req, res) => {
  try {
    const nodes = await HotNode.find({}).sort({ createdAt: -1 });
    res.render('dashboard', { nodes });
  } catch (error) {
    res.status(500).send('Error loading dashboard');
  }
};

// API: Create or update node
exports.apiCreateOrUpdateNode = async (req, res) => {
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

    // Log activity
    const action = node.isNew ? 'create' : 'update';
    activityLogger.logAdminAction(action, owner, { name, url });

    res.json({
      success: true,
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

// API: Update node
exports.apiUpdateNode = async (req, res) => {
  try {
    const { owner } = req.params;
    const updateData = req.body;

    console.log('\n=== API Update Node Request ===');
    console.log('URL Parameter - Owner:', owner);
    console.log('Request Body:', updateData);

    // Allow owner to be updated, but use the URL parameter to find the node
    console.log('Finding node with owner:', owner);
    const node = await HotNode.findOneAndUpdate(
      { owner },
      updateData,
      { new: true, runValidators: true }
    );

    if (!node) {
      console.log('❌ Node not found for owner:', owner);
      return res.status(404).json({
        success: false,
        message: 'Node not found'
      });
    }

    console.log('✅ Node updated successfully');
    console.log('Updated fields:', Object.keys(updateData));
    
    // Verify the update by fetching fresh from database
    const verifyNode = await HotNode.findOne({ _id: node._id });
    console.log('📋 Verification - Fresh from DB:');
    console.log('  Owner:', verifyNode.owner);
    console.log('  Name:', verifyNode.name);
    console.log('  IP:', verifyNode.ip);
    console.log('  URL:', verifyNode.url);
    console.log('  Enabled:', verifyNode.enabled);
    console.log('===========================\n');

    // Log activity
    activityLogger.logAdminAction('update', owner, { fields: Object.keys(updateData) });

    res.json({
      success: true,
      data: node
    });
  } catch (error) {
    console.error('❌ Error updating node:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// API: Delete node
exports.apiDeleteNode = async (req, res) => {
  try {
    const { owner } = req.params;

    const node = await HotNode.findOneAndDelete({ owner });

    if (!node) {
      return res.status(404).json({
        success: false,
        message: 'Node not found'
      });
    }

    // Log activity
    activityLogger.logAdminAction('delete', owner, { name: node.name });

    res.json({
      success: true,
      message: 'Node deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting node:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// API: Check node health manually
exports.apiCheckNodeHealth = async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({
        success: false,
        message: 'URL is required'
      });
    }

    const { checkNodeHealth } = require('../utils/healthCheck');
    const result = await checkNodeHealth({ url }, 5000);

    activityLogger.logAdminAction('health-check', url, {
      healthy: result.healthy,
      details: result.details || {},
      error: result.error || null
    });

    res.json({
      success: true,
      healthy: result.healthy,
      details: result.details,
      error: result.error,
      responseTime: result.responseTime
    });
  } catch (error) {
    console.error('Error checking node health:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
      healthy: false
    });
  }
};

module.exports = exports;
