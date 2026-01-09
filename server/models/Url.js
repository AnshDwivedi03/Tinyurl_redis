const mongoose = require('mongoose');

const urlSchema = new mongoose.Schema({
  originalUrl: { type: String, required: true },
  shortCode: { type: String, required: true, unique: true, index: true },
  clicks: { type: Number, default: 0 },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  lastVisited: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Url', urlSchema);