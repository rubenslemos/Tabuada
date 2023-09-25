const mongoose = require('mongoose')

const Round = mongoose.model('Round',{
  acerto: Number,
  errou: Number,
  jogou: Number
})

module.exports = Round