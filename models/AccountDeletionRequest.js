const mongoose = require('mongoose')

const AccountDeletionRequestSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
  },
  name: {
    type: String,
    default: '',
    trim: true,
  },
  reason: {
    type: String,
    default: '',
    trim: true,
    maxlength: 500,
  },
  source: {
    type: String,
    enum: ['web', 'app'],
    default: 'web',
  },
  status: {
    type: String,
    enum: ['pending', 'processed', 'rejected'],
    default: 'pending',
  },
  requestedAt: {
    type: Date,
    default: Date.now,
  },
  processedAt: {
    type: Date,
    default: null,
  },
})

module.exports = mongoose.model(
  'AccountDeletionRequest',
  AccountDeletionRequestSchema
)
