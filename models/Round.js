const mongoose = require('mongoose')

const Round = mongoose.model('Round',{
  jogou: Number,
  acerto: Number,
  errou: Number
})

module.exports = Round