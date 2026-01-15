const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { requireAdminAuth, redirectIfAuthenticated } = require('../middleware/auth');

// Login routes
router.get('/login', redirectIfAuthenticated, adminController.showLogin);
router.post('/login', adminController.login);
router.get('/logout', adminController.logout);

// Dashboard (protected)
router.get('/dashboard', requireAdminAuth, adminController.showDashboard);

// Redirect /admin to /admin/dashboard
router.get('/', (req, res) => {
  if (req.session && req.session.isAdmin) {
    res.redirect('/admin/dashboard');
  } else {
    res.redirect('/admin/login');
  }
});

// API routes (protected)
router.post('/api/node', requireAdminAuth, adminController.apiCreateOrUpdateNode);
router.put('/api/node/:owner', requireAdminAuth, adminController.apiUpdateNode);
router.delete('/api/node/:owner', requireAdminAuth, adminController.apiDeleteNode);
router.post('/api/check-health', requireAdminAuth, adminController.apiCheckNodeHealth);

module.exports = router;
