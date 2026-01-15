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
  ip: {
    type: String,
    required: true
  },
  url: {
    type: String,
    required: true
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
