const crypto = require('crypto')

const CPF_ENCRYPTION_PREFIX = 'cpf:v1'
const CPF_HASH_PREFIX = 'cpfhash:v1'

function getCpfSecret() {
  const secret = process.env.CPF_ENCRYPTION_SECRET || process.env.SECRET || ''

  if (!secret) {
    throw new Error(
      'CPF_ENCRYPTION_SECRET ou SECRET precisa estar definido para proteger CPF'
    )
  }

  return secret
}

function buildEncryptionKey() {
  return crypto.createHash('sha256').update(getCpfSecret()).digest()
}

function buildHashKey() {
  return crypto
    .createHash('sha256')
    .update(`${getCpfSecret()}:cpf-hash`)
    .digest()
}

function isEncryptedCpf(value = '') {
  return String(value || '').startsWith(`${CPF_ENCRYPTION_PREFIX}:`)
}

function isCpfHash(value = '') {
  return String(value || '').startsWith(`${CPF_HASH_PREFIX}:`)
}

function encryptCpf(value = '') {
  const plain = String(value || '').trim()
  if (!plain) return ''
  if (isEncryptedCpf(plain)) return plain

  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv('aes-256-gcm', buildEncryptionKey(), iv)
  const encrypted = Buffer.concat([
    cipher.update(plain, 'utf8'),
    cipher.final(),
  ])
  const tag = cipher.getAuthTag()

  return [
    CPF_ENCRYPTION_PREFIX,
    iv.toString('base64url'),
    tag.toString('base64url'),
    encrypted.toString('base64url'),
  ].join(':')
}

function decryptCpf(value = '') {
  const input = String(value || '').trim()
  if (!input) return ''
  if (!isEncryptedCpf(input)) return input

  const [, , ivPart, tagPart, payloadPart] = input.split(':')
  if (!ivPart || !tagPart || !payloadPart) {
    throw new Error('CPF cifrado em formato invalido')
  }

  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    buildEncryptionKey(),
    Buffer.from(ivPart, 'base64url')
  )
  decipher.setAuthTag(Buffer.from(tagPart, 'base64url'))

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(payloadPart, 'base64url')),
    decipher.final(),
  ])

  return decrypted.toString('utf8')
}

function hashCpf(value = '') {
  const plain = String(value || '').trim()
  if (!plain) return ''
  if (isCpfHash(plain)) return plain

  const hash = crypto
    .createHmac('sha256', buildHashKey())
    .update(plain)
    .digest('base64url')

  return `${CPF_HASH_PREFIX}:${hash}`
}

module.exports = {
  decryptCpf,
  encryptCpf,
  hashCpf,
  isCpfHash,
  isEncryptedCpf,
}
