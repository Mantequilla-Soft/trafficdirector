const mongoose = require('mongoose');

const hotNodeSchema = new mongoose.Schema({
  owner: {
    type: String,
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true
  },
  uploadEndpoint: {
    type: String,
    required: true,
    // Example: https://hotipfs-1.3speak.tv/api/v0/add
    validate: {
      validator: function(v) {
        return /^https?:\/\/.+/.test(v);
      },
      message: 'uploadEndpoint must be a valid URL'
    }
  },
  healthEndpoint: {
    type: String,
    required: true,
    // Example: https://hotipfs-1.3speak.tv/health
    validate: {
      validator: function(v) {
        return /^https?:\/\/.+/.test(v);
      },
      message: 'healthEndpoint must be a valid URL'
    }
  },
  comments: {
    type: String,
    default: ''
  },
  lastUsed: {
    type: Date,
    default: Date.now
  },
  enabled: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('HotNode', hotNodeSchema, '3speak-hot-nodes');
