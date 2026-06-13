#!/usr/bin/env node
require('dotenv').config()
const mongoose = require('mongoose')
const User = require('../models/User')
const Organization = require('../models/Organization')
const InstitutionInvite = require('../models/InstitutionInvite')
const { normalizeDocument } = require('../utils/institutions')
const {
  getCanonicalTipo,
  getDefaultVinculoForTipo,
  sanitizeVinculo,
  isPais,
} = require('../utils/roles')

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
    const nextTipo = user.isGlobalAdmin
      ? 'Administrador'
      : getCanonicalTipo(user.tipo)
    const nextVinculo = user.isGlobalAdmin
      ? ''
      : sanitizeVinculo(
          nextTipo,
          user.vinculo || getDefaultVinculoForTipo(nextTipo)
        )
    const nextNormalizedCpf = normalizeDocument(
      user.cpf || user.normalizedCpf || ''
    )
    const nextCpf = isPais(nextTipo) ? String(user.cpf || '').trim() : ''
    const nextTurma = user.isGlobalAdmin
      ? undefined
      : nextTipo === 'Pais'
        ? 'CASA'
        : String(user.turma || '').trim()

    const hasChanges =
      user.tipo !== nextTipo ||
      (user.vinculo || '') !== nextVinculo ||
      (user.normalizedCpf || '') !==
        (isPais(nextTipo) ? nextNormalizedCpf : '') ||
      (user.cpf || '') !== nextCpf ||
      (String(user.turma || '') || '') !== (String(nextTurma || '') || '')

    if (!hasChanges) continue
    changed += 1

    if (shouldApply) {
      user.tipo = nextTipo
      user.vinculo = nextVinculo
      user.normalizedCpf = isPais(nextTipo) ? nextNormalizedCpf : ''
      user.cpf = nextCpf
      if (typeof nextTurma === 'undefined') {
        user.turma = undefined
      } else {
        user.turma = nextTurma
      }
      await user.save()
    }
  }

  return { total: users.length, changed }
}

async function migrateOrganizations() {
  const organizations = await Organization.find({})
  let changed = 0

  for (const org of organizations) {
    const nextHouseLabel = String(org.houseLabel || org.name || '').trim()
    const nextNormalizedDocument = normalizeDocument(
      org.normalizedDocument || org.document || ''
    )
    const hasChanges =
      (org.houseLabel || '') !== nextHouseLabel ||
      (org.normalizedDocument || '') !== nextNormalizedDocument

    if (!hasChanges) continue
    changed += 1

    if (shouldApply) {
      org.houseLabel = nextHouseLabel
      org.normalizedDocument = nextNormalizedDocument
      await org.save()
    }
  }

  return { total: organizations.length, changed }
}

async function migrateInvites() {
  const invites = await InstitutionInvite.find({})
  let changed = 0

  for (const invite of invites) {
    const nextRole = getCanonicalTipo(invite.role)
    if (invite.role === nextRole) continue
    changed += 1
    if (shouldApply) {
      invite.role = nextRole
      await invite.save()
    }
  }

  return { total: invites.length, changed }
}

async function main() {
  await connect()
  const [users, organizations, invites] = await Promise.all([
    migrateUsers(),
    migrateOrganizations(),
    migrateInvites(),
  ])

  console.log('Migracao do modelo familiar')
  console.log('Modo:', shouldApply ? 'APPLY' : 'DRY-RUN')
  console.log('Usuarios:', users)
  console.log('Casas:', organizations)
  console.log('Convites:', invites)

  await mongoose.disconnect()
}

main().catch(async (error) => {
  console.error('Falha na migracao:', error.message)
  try {
    await mongoose.disconnect()
  } catch (disconnectError) {
    console.error('Falha ao desconectar na migracao:', disconnectError.message)
  }
  process.exit(1)
})
