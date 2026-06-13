#!/usr/bin/env node
require('dotenv').config()

const mongoose = require('mongoose')
const User = require('../models/User')
const { normalizeDocument } = require('../utils/institutions')
const {
  decryptCpf,
  encryptCpf,
  hashCpf,
  isCpfHash,
  isEncryptedCpf,
} = require('../utils/cpfProtection')

const shouldApply = process.argv.includes('--apply')

async function connect() {
  const user = process.env.DB_USER
  const pass = process.env.DB_PASS
  const dbName = process.env.DB_NAME || 'tabuada'
  const uri =
    process.env.DB_URL ||
    process.env.MONGO_URL ||
    process.env.MONGODB_URI ||
    (user && pass
      ? `mongodb+srv://${encodeURIComponent(user)}:${encodeURIComponent(pass)}` +
        `@tabuada.hz6j8rr.mongodb.net/${dbName}?retryWrites=true&w=majority&authSource=admin&appName=TabuadaMobile`
      : '')

  if (!uri) {
    throw new Error(
      'DB_URL/MONGO_URL/MONGODB_URI ou DB_USER/DB_PASS nao definido no ambiente'
    )
  }

  await mongoose.connect(uri)
}

async function migrateUsers() {
  const users = await User.find({})
  let changed = 0

  for (const user of users) {
    const decryptedCpf = decryptCpf(user.cpf || '')
    const nextEncryptedCpf = decryptedCpf ? encryptCpf(decryptedCpf) : ''
    const nextNormalizedCpf = decryptedCpf
      ? hashCpf(normalizeDocument(decryptedCpf))
      : ''

    const needsCpfUpdate =
      (user.cpf || '') !== nextEncryptedCpf ||
      (user.normalizedCpf || '') !== nextNormalizedCpf ||
      (!user.cpf ? false : !isEncryptedCpf(user.cpf)) ||
      (!user.normalizedCpf ? false : !isCpfHash(user.normalizedCpf))

    if (!needsCpfUpdate) continue
    changed += 1

    if (shouldApply) {
      user.cpf = nextEncryptedCpf
      user.normalizedCpf = nextNormalizedCpf
      await user.save()
    }
  }

  return { total: users.length, changed }
}

async function main() {
  await connect()
  const users = await migrateUsers()

  console.log('Migracao de protecao de CPF')
  console.log('Modo:', shouldApply ? 'APPLY' : 'DRY-RUN')
  console.log('Usuarios:', users)

  await mongoose.disconnect()
}

main().catch(async (error) => {
  console.error('Falha na migracao de CPF:', error.message)
  try {
    await mongoose.disconnect()
  } catch (disconnectError) {
    console.error('Falha ao desconectar:', disconnectError.message)
  }
  process.exit(1)
})
