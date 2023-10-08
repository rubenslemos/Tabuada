const mongoose = require('mongoose')

const RoundSchema = new mongoose.Schema({
  jogou:{
    type: Number,
    require: true,
  },  
  acerto:{
    type: Number,
    require: true,
  },
  errou:{
    type: Number,
    require: true,
  },
  user:{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    require: true,
  },
  createdAt: {
    type:Date,
    default:Date.now,
  },
})

const Round = mongoose.model('Round', RoundSchema)

module.exports = Round