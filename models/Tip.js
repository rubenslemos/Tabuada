const mongoose = require('mongoose')

const TipSchema = new mongoose.Schema(
  {
    text: { type: String, required: true },
    normalizedText: { type: String, required: true, unique: true, index: true },
    source: { type: String, enum: ['groq', 'manual', 'static'], default: 'groq' },
  },
  { timestamps: true }
)

TipSchema.index({ normalizedText: 1 }, { unique: true })

module.exports = mongoose.model('Tip', TipSchema)