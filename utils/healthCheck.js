const axios = require('axios');
const activityLogger = require('./activityLogger');

/**
 * Health check utility for hot nodes
 * Verifies if a node is reachable and healthy
 */

const checkNodeHealth = async (node, timeout = 5000) => {
  try {
    const healthUrl = `http://${node.url}/health`;
    
    const response = await axios.get(healthUrl, {
      timeout: timeout,
      validateStatus: (status) => status === 200
    });

    return {
      healthy: true,
      node: node,
      responseTime: response.headers['x-response-time'] || 'N/A'
    };
  } catch (error) {
    // If health endpoint doesn't exist, try a simple HEAD request to the root
    try {
      await axios.head(`http://${node.url}`, { timeout: timeout });
      return {
        healthy: true,
        node: node,
        responseTime: 'N/A'
      };
    } catch (headError) {
      return {
        healthy: false,
        node: node,
        error: error.message
      };
    }
  }
};

/**
 * Check multiple nodes and return only healthy ones
 * TEMPORARY: Simulating all nodes as healthy for testing round-robin
 */
const filterHealthyNodes = async (nodes) => {
  // TODO: Enable actual health checks when nodes have health endpoints
  // For now, simulate all enabled nodes as healthy for testing
  console.log('   [SIMULATION MODE] All enabled nodes marked as healthy');
  
  // Log simulated health check
  activityLogger.logHealthCheck(nodes.length, nodes.length);
  
  return nodes;
  
  /* Uncomment below for actual health checking:
  const healthChecks = nodes.map(node => checkNodeHealth(node));
  const results = await Promise.all(healthChecks);
  
  const healthyNodes = results
    .filter(result => result.healthy)
    .map(result => result.node);

  // Log actual health check results
  activityLogger.logHealthCheck(nodes.length, healthyNodes.length);

  return healthyNodes;
  */
};

module.exports = {
  checkNodeHealth,
  filterHealthyNodes
};
