const rateLimit = require('express-rate-limit');
const activityLogger = require('../utils/activityLogger');

// Rate limiter for hot node requests: 30 requests per IP per hour
const hotNodeLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 30, // Limit each IP to 30 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP. Maximum 30 video uploads per hour allowed.'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  // Skip rate limiting for whitelisted IPs (optional)
  skip: (req) => {
    const whitelistedIPs = process.env.RATE_LIMIT_WHITELIST?.split(',') || [];
    return whitelistedIPs.includes(req.ip);
  },
  // Log rate limit hits
  handler: (req, res) => {
    activityLogger.logRateLimit(req.ip, req.path);
    res.status(429).json({
      success: false,
      message: 'Too many requests from this IP. Maximum 30 video uploads per hour allowed.'
    });
  }
});

module.exports = {
  hotNodeLimiter
};
