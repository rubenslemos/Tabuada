const mongoose = require('mongoose')

const OrganizationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  document: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  normalizedDocument: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  contactEmail: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
  },
  status: {
    type: String,
    enum: ['pending', 'active', 'disabled'],
    default: 'active',
  },
  createdByUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

module.exports = mongoose.model('Organization', OrganizationSchema)
