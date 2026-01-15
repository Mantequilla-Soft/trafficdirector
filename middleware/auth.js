const authenticateRequest = (req, res, next) => {
  const apiSecret = req.headers['x-api-secret'] || req.headers['authorization']?.replace('Bearer ', '');
  
  if (!apiSecret) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required. Provide X-API-Secret header or Authorization Bearer token.'
    });
  }

  if (apiSecret !== process.env.API_SECRET) {
    return res.status(403).json({
      success: false,
      message: 'Invalid API secret'
    });
  }

  next();
};

// Admin authentication middleware - checks if user is logged in
const requireAdminAuth = (req, res, next) => {
  if (req.session && req.session.isAdmin) {
    return next();
  }
  res.redirect('/admin/login');
};

// Check if already logged in (for login page)
const redirectIfAuthenticated = (req, res, next) => {
  if (req.session && req.session.isAdmin) {
    return res.redirect('/admin/dashboard');
  }
  next();
};

module.exports = { authenticateRequest, requireAdminAuth, redirectIfAuthenticated };
