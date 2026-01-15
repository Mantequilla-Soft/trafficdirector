/**
 * Activity Logger with Socket.IO
 * Emits real-time activity logs to connected admin clients
 */

let io = null;

/**
 * Initialize the activity logger with Socket.IO instance
 * @param {SocketIO.Server} socketIO - Socket.IO server instance
 */
function initialize(socketIO) {
    io = socketIO;
    console.log('✅ Activity logger initialized with Socket.IO');
}

/**
 * Format timestamp for logs
 * @returns {string} Formatted time HH:MM:SS
 */
function getTimestamp() {
    const now = new Date();
    return now.toTimeString().split(' ')[0];
}

/**
 * Emit activity log to all connected admin clients
 * @param {string} type - Log type: 'request', 'admin', 'error', 'rate-limit'
 * @param {string} message - Log message
 * @param {object} data - Additional data
 */
function log(type, message, data = {}) {
    const logEntry = {
        timestamp: getTimestamp(),
        type,
        message,
        data,
        fullTimestamp: new Date().toISOString()
    };

    // Console log for server-side debugging
    const emoji = {
        'request': '🌐',
        'admin': '⚙️',
        'error': '⚠️',
        'rate-limit': '🚫',
        'health': '💚'
    }[type] || 'ℹ️';

    console.log(`${emoji} [${logEntry.timestamp}] ${message}`);

    // Emit to connected Socket.IO clients
    if (io) {
        io.to('admin-room').emit('activity-log', logEntry);
    }
}

/**
 * Log hot node request
 * @param {string} ip - Client IP address
 * @param {string} nodeName - Hot node name returned
 * @param {string} nodeOwner - Hot node owner
 */
function logHotNodeRequest(ip, nodeName, nodeOwner) {
    log('request', `GET /api/hotnode from ${ip} → returned "${nodeOwner}"`, {
        ip,
        nodeName,
        nodeOwner,
        endpoint: '/api/hotnode'
    });
}

/**
 * Log admin action
 * @param {string} action - Action performed (create, update, delete, toggle)
 * @param {string} nodeOwner - Hot node owner affected
 * @param {object} details - Additional details
 */
function logAdminAction(action, nodeOwner, details = {}) {
    const messages = {
        create: `Created new node "${nodeOwner}"`,
        update: `Updated node "${nodeOwner}"`,
        delete: `Deleted node "${nodeOwner}"`,
        enable: `Enabled node "${nodeOwner}"`,
        disable: `Disabled node "${nodeOwner}"`,
        login: `Admin logged in`,
        logout: `Admin logged out`
    };

    log('admin', messages[action] || `Admin action: ${action} on "${nodeOwner}"`, {
        action,
        nodeOwner,
        ...details
    });
}

/**
 * Log error
 * @param {string} message - Error message
 * @param {object} error - Error object
 */
function logError(message, error = {}) {
    log('error', message, {
        error: error.message || error,
        stack: error.stack
    });
}

/**
 * Log rate limit hit
 * @param {string} ip - Client IP address
 * @param {string} endpoint - Endpoint that was rate limited
 */
function logRateLimit(ip, endpoint) {
    log('rate-limit', `Rate limit hit for ${ip} on ${endpoint}`, {
        ip,
        endpoint
    });
}

/**
 * Log health check result
 * @param {number} total - Total nodes checked
 * @param {number} healthy - Number of healthy nodes
 */
function logHealthCheck(total, healthy) {
    log('health', `Health check: ${healthy}/${total} nodes healthy`, {
        total,
        healthy,
        unhealthy: total - healthy
    });
}

module.exports = {
    initialize,
    log,
    logHotNodeRequest,
    logAdminAction,
    logError,
    logRateLimit,
    logHealthCheck
};
