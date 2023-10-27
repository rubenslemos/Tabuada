const mongoose = require('mongoose')
const bcrypt = require('bcrypt')

const PermissoesSchema = new mongoose.Schema({
  soma: {
      type: Boolean,
      default: false,
  },
  menos: {
      type: Boolean,
      default: false,
  },
  vezes: {
      type: Boolean,
      default: false,
  },
  dividir: {
      type: Boolean,
      default: false,
  },
  todas: {
    type: Boolean,
    default: false,
},
});

const UserSchema = new mongoose.Schema({
  tipo:{
    type: String,
    require: true,
  },
  name:{
    type: String,
    require: true,
  },
  email:{
    type: String,
    unique: true,
    require: true,
    lowerCase: true,
  },
  password:{
    type: String,
    require: true,
    select: false,
  },
  rounds:[{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Round',
  }],
  passwordResetToken:{
    type: String,
    select: false,
  },
  passwordResetExpires:{
    type: Date,
    select: false,
  },
  permissoes: {
    type: PermissoesSchema,
    default: {
        soma: false,
        menos: false,
        vezes: false,
        dividir: false,
        todas: false,
    },
  },
  contagemOperacoes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Contagem',
  }],
  totalJogos: {
    type: Number,
    require: true,
  }, 
  totalAcertos: {
    type: Number,
    require: true,
  }, 
  totalErros: {
    type: Number,
    require: true,
  },
  createdAt: {
    type:Date,
    default:Date.now,
  },
})
UserSchema.pre('save', async function (next){
  try {
    if (!this.isModified('password')) {
      return next();
    }
    
    const hash = await bcrypt.hash(this.password, 12);
    this.password = hash;
    next();
  } catch (error) {
    next(error);
  }
})
const User = mongoose.model('User', UserSchema)
module.exports = User