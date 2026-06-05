const crypto = require('crypto')

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

function isValidCNPJ(value = '') {
  const cnpj = normalizeDocument(value)
  if (cnpj.length !== 14 || /^(\d)\1+$/.test(cnpj)) return false

  const calcDigit = (base, weights) => {
    const sum = base
      .split('')
      .reduce((acc, digit, index) => acc + Number(digit) * weights[index], 0)
    const remainder = sum % 11
    return remainder < 2 ? 0 : 11 - remainder
  }

  const first = calcDigit(
    cnpj.slice(0, 12),
    [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
  )
  if (first !== Number(cnpj[12])) return false

  const second = calcDigit(
    cnpj.slice(0, 13),
    [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
  )
  return second === Number(cnpj[13])
}

function isValidCpfOrCnpj(value = '') {
  const normalized = normalizeDocument(value)
  return isValidCPF(normalized) || isValidCNPJ(normalized)
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
  if (role === 'Professor' || role === 'Coordenador') {
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

function generateInviteToken() {
  const raw = crypto.randomBytes(24).toString('hex')
  const grouped = raw.toUpperCase().match(/.{1,6}/g) || [raw.toUpperCase()]
  return grouped.join('-')
}

function hashInviteToken(token) {
  const normalized = String(token).trim().replace(/\s+/g, '').toUpperCase()
  return crypto.createHash('sha256').update(normalized).digest('hex')
}

module.exports = {
  buildDefaultPermissoes,
  generateInviteToken,
  hashInviteToken,
  isValidCpfOrCnpj,
  normalizeAcessos,
  normalizeDocument,
}
