const mongoose = require('mongoose')

const User = mongoose.model('User',{
  tipo: String,
  name: String,
  email:String,
  password:String
})

module.exports = User