const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

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
})

const UserSchema = new mongoose.Schema({
  tipo: {
    type: String,
    required: true,
  },
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    default: null,
  },
  organizationName: {
    type: String,
    default: '',
    trim: true,
  },
  isGlobalAdmin: {
    type: Boolean,
    default: false,
  },
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    unique: true,
    required: true,
    lowerCase: true,
  },
  password: {
    type: String,
    required: true,
    select: false,
  },
  rounds: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Round',
    },
  ],
  passwordResetToken: {
    type: String,
    select: false,
  },
  passwordResetExpires: {
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
  contagemOperacoes: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Contagem',
    },
  ],
  totalJogos: {
    type: Number,
    required: true,
    default: 0,
  },
  totalAcertos: {
    type: Number,
    required: true,
    default: 0,
  },
  totalErros: {
    type: Number,
    required: true,
    default: 0,
  },
  turma: {
    type: String,
    required: function () {
      return !this.isGlobalAdmin
    },
    trim: true,
    uppercase: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
})
UserSchema.pre('save', async function () {
  if (!this.isModified('password')) return

  const hash = await bcrypt.hash(this.password, 12)
  this.password = hash
})
const User = mongoose.model('User', UserSchema)
module.exports = User
