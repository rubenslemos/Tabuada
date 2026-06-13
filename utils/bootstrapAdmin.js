const User = require('../models/User')
const { buildDefaultPermissoes } = require('./institutions')
const { ROLE_TYPES } = require('./roles')

let bootstrapPromise = null

async function ensureGlobalAdminUser() {
  if (bootstrapPromise) return bootstrapPromise

  bootstrapPromise = (async () => {
    const email = process.env.ADMIN_EMAIL?.toLowerCase().trim()
    const password = process.env.ADMIN_PASSWORD
    const name = process.env.ADMIN_NAME?.trim() || 'Administrador Global'

    if (!email) {
      return null
    }

    const existing = await User.findOne({ email }).select('+password')
    if (existing) {
      if (!existing.isGlobalAdmin) {
        existing.isGlobalAdmin = true
        existing.tipo = ROLE_TYPES.ADMIN
        existing.organization = null
        existing.organizationName = ''
        existing.turma = undefined
        existing.vinculo = ''
        existing.cpf = ''
        existing.normalizedCpf = ''
        existing.permissoes = buildDefaultPermissoes(ROLE_TYPES.PAIS)
        await existing.save()
      }
      return existing
    }

    if (!password) {
      return null
    }

    return User.create({
      tipo: ROLE_TYPES.ADMIN,
      isGlobalAdmin: true,
      name: name.toLowerCase(),
      email,
      password,
      permissoes: buildDefaultPermissoes(ROLE_TYPES.PAIS),
      organization: null,
      organizationName: '',
    })
  })()

  try {
    return await bootstrapPromise
  } finally {
    bootstrapPromise = null
  }
}

module.exports = { ensureGlobalAdminUser }
