const axios = require('axios');
const activityLogger = require('./activityLogger');

/**
 * Health check utility for hot nodes
 * Verifies if a node is reachable and healthy
 * Expected response format from hot node:
 * {
 *   "enabled": true,
 *   "timestamp": "2026-01-14T10:30:00Z",
 *   "disk_usage_percent": 45,
 *   "bandwidth_24h": { "in_mb": 1250, "out_mb": 8900 },
 *   "pins": { "total": 450, "pending_migration": 35, "overdue": 0 }
 * }
 */

const checkNodeHealth = async (node, timeout = 5000) => {
  try {
    // Use the explicit health endpoint stored in the database
    const healthUrl = node.healthEndpoint;
    
    const response = await axios.get(healthUrl, {
      timeout: timeout,
      validateStatus: (status) => status === 200
    });

    // Check if node is enabled and healthy
    const data = response.data || {};
    const overduePins = data.pins?.overdue || 0;
    const isHealthy = data.enabled === true && 
                     data.disk_usage_percent < 90 && 
                     overduePins < 150; // Allow some overdue pins (less than 150)

    // Build health failure reasons if not healthy
    const failureReasons = [];
    if (data.enabled !== true) failureReasons.push('disabled');
    if (data.disk_usage_percent >= 90) failureReasons.push(`high disk usage (${data.disk_usage_percent}%)`);
    if (overduePins >= 150) failureReasons.push(`too many overdue pins (${overduePins})`);

    return {
      healthy: isHealthy,
      node: node,
      responseTime: response.headers['x-response-time'] || 'N/A',
      error: !isHealthy && failureReasons.length > 0 ? failureReasons.join(', ') : undefined,
      errorType: !isHealthy && failureReasons.length > 0 ? 'health_criteria_failed' : undefined,
      details: {
        enabled: data.enabled,
        diskUsage: data.disk_usage_percent,
        overdue: data.pins?.overdue || 0
      }
    };
  } catch (error) {
    const errorType = error.code === 'ECONNABORTED' ? 'timeout' : 
                     error.code === 'ECONNREFUSED' ? 'connection_refused' :
                     error.code === 'ENOTFOUND' ? 'dns_error' : 'unknown';
    
    return {
      healthy: false,
      node: node,
      error: error.message,
      errorType: errorType
    };
  }
};

/**
 * Check multiple nodes and return only healthy ones
 */
const filterHealthyNodes = async (nodes) => {
  if (nodes.length === 0) {
    return [];
  }

  console.log(`🔍 Health checking ${nodes.length} hot nodes...`);
  
  const healthChecks = nodes.map(node => checkNodeHealth(node));
  const results = await Promise.all(healthChecks);
  
  const healthyNodes = [];
  const unhealthyNodes = [];

  results.forEach(result => {
    if (result.healthy) {
      healthyNodes.push(result.node);
    } else {
      unhealthyNodes.push(result);
      console.log(`❌ Node unhealthy: ${result.node.name || result.node.uploadEndpoint} - ${result.errorType || 'failed'}: ${result.error}`);
    }
  });

  // Log health check results
  activityLogger.logHealthCheck(nodes.length, healthyNodes.length);
  
  console.log(`✅ ${healthyNodes.length}/${nodes.length} hot nodes healthy`);
  
  if (unhealthyNodes.length > 0) {
    console.log(`⚠️  ${unhealthyNodes.length} node(s) unhealthy`);
  }

  return healthyNodes;
};

module.exports = {
  checkNodeHealth,
  filterHealthyNodes
};
