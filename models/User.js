const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const {
  decryptCpf,
  encryptCpf,
  hashCpf,
  isCpfHash,
  isEncryptedCpf,
} = require('../utils/cpfProtection')

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
    enum: [
      'Administrador',
      'Pais',
      'Dependentes',
      'Aluno',
      'Professor',
      'Coordenador',
    ],
  },
  vinculo: {
    type: String,
    default: '',
    trim: true,
  },
  avatar: {
    type: String,
    default: '',
    trim: true,
  },
  cpf: {
    type: String,
    default: '',
    trim: true,
  },
  normalizedCpf: {
    type: String,
    default: '',
    trim: true,
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
    default: '',
    trim: true,
    uppercase: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
})
UserSchema.pre('save', async function () {
  if (this.isModified('cpf')) {
    this.cpf = this.cpf ? encryptCpf(this.cpf) : ''
  }

  if (this.isModified('normalizedCpf')) {
    this.normalizedCpf = this.normalizedCpf ? hashCpf(this.normalizedCpf) : ''
  }

  if (!this.isModified('password')) return

  const hash = await bcrypt.hash(this.password, 12)
  this.password = hash
})

UserSchema.methods.getCpfDecrypted = function getCpfDecrypted() {
  return decryptCpf(this.cpf)
}

UserSchema.statics.isCpfEncrypted = isEncryptedCpf
UserSchema.statics.isCpfHashed = isCpfHash
const User = mongoose.model('User', UserSchema)
module.exports = User
