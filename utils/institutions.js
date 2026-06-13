const crypto = require('crypto')
const { ROLE_TYPES, getCanonicalTipo } = require('./roles')

const MIN_INVITE_TOKEN_LENGTH = 5

function normalizeDocument(value = '') {
  return String(value).replace(/\D/g, '')
}

function isValidCPF(value = '') {
  const cpf = normalizeDocument(value)
  if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false

  let sum = 0
  for (let i = 0; i < 9; i += 1) {
    sum += Number(cpf[i]) * (10 - i)
  }
  let digit = (sum * 10) % 11
  if (digit === 10) digit = 0
  if (digit !== Number(cpf[9])) return false

  sum = 0
  for (let i = 0; i < 10; i += 1) {
    sum += Number(cpf[i]) * (11 - i)
  }
  digit = (sum * 10) % 11
  if (digit === 10) digit = 0
  return digit === Number(cpf[10])
}

function normalizeAcessos(acessos = {}) {
  const normalized = {
    soma: false,
    menos: false,
    vezes: false,
    dividir: false,
    todas: false,
    ...acessos,
  }

  if (normalized.todas) {
    normalized.soma = true
    normalized.menos = true
    normalized.vezes = true
    normalized.dividir = true
  } else {
    normalized.todas = Boolean(
      normalized.soma &&
      normalized.menos &&
      normalized.vezes &&
      normalized.dividir
    )
  }

  return normalized
}

function buildDefaultPermissoes(role) {
  const canonicalRole = getCanonicalTipo(role)

  if (canonicalRole === ROLE_TYPES.PAIS || canonicalRole === ROLE_TYPES.ADMIN) {
    return normalizeAcessos({
      soma: true,
      menos: true,
      vezes: true,
      dividir: true,
      todas: true,
    })
  }

  return normalizeAcessos({
    soma: true,
    menos: false,
    vezes: false,
    dividir: false,
    todas: false,
  })
}

function generateInviteToken(digits = MIN_INVITE_TOKEN_LENGTH) {
  return Array.from({ length: digits }, () => crypto.randomInt(0, 10)).join('')
}

function getInviteTokenLengthForCount(activeInviteCount = 0) {
  let digits = MIN_INVITE_TOKEN_LENGTH
  while (activeInviteCount >= 10 ** digits) {
    digits += 1
  }
  return digits
}

async function createUniqueInviteToken(InviteModel) {
  const activeInviteCount = await InviteModel.countDocuments({
    usedAt: null,
    expiresAt: { $gt: new Date() },
  })

  let digits = getInviteTokenLengthForCount(activeInviteCount)

  while (digits < 32) {
    const maxAttempts = Math.min(500, Math.max(50, digits * 100))

    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      const inviteToken = generateInviteToken(digits)
      const tokenHash = hashInviteToken(inviteToken)
      const existingInvite = await InviteModel.findOne({
        tokenHash,
        usedAt: null,
        expiresAt: { $gt: new Date() },
      }).lean()

      if (!existingInvite) {
        return { inviteToken, tokenHash, digits }
      }
    }

    digits += 1
  }

  throw new Error('Nao foi possivel gerar um codigo de convite unico')
}

function hashInviteToken(token) {
  const normalized = String(token).trim().replace(/\s+/g, '').toUpperCase()
  return crypto.createHash('sha256').update(normalized).digest('hex')
}

module.exports = {
  buildDefaultPermissoes,
  createUniqueInviteToken,
  generateInviteToken,
  getInviteTokenLengthForCount,
  hashInviteToken,
  isValidCPF,
  MIN_INVITE_TOKEN_LENGTH,
  normalizeAcessos,
  normalizeDocument,
}
