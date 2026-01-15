const express = require('express');
const router = express.Router();
const directorController = require('../controllers/director.controller');
const { authenticateRequest } = require('../middleware/auth');
const { hotNodeLimiter } = require('../middleware/rateLimiter');

// Main hot node endpoint - round-robin with health checks and rate limiting
router.get('/hotnode', hotNodeLimiter, directorController.getHotNode);

// Public routes - no authentication required
// Get node by owner
router.get('/node/:owner', directorController.getNodeByOwner);

// Get all nodes
router.get('/nodes', directorController.getAllNodes);

// Protected routes - authentication required
// Create or update hot node (upsert)
router.post('/node', authenticateRequest, directorController.createOrUpdateNode);

// Update existing hot node by owner
router.put('/node/:owner', authenticateRequest, directorController.updateNode);

// Make external API call with axios
router.post('/external-call', directorController.makeExternalCall);

module.exports = router;
