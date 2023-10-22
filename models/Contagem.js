const mongoose = require('mongoose')

const ContagemSchema = new mongoose.Schema({contagemOperacoes: {
  faPlus: {
    type: Number,
    default: 0
  },
  faMinus: {
    type: Number,
    default: 0
  },
  faTimes: {
    type: Number,
    default: 0
  },
  faDivide: {
    type: Number,
    default: 0
  },
  user:{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  rounds:{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Round',
  },
  createdAt: {
    type:Date,
    default:Date.now,
  },
}
})

const Contagem = mongoose.model('Contagem', ContagemSchema)

module.exports = Contagem