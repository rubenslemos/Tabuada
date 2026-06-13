const { ROLE_TYPES, getCanonicalTipo } = require('./roles')

const PROFILE_AVATARS = [
  '🧒',
  '👦',
  '👧',
  '👨',
  '👩',
  '🧑',
  '👦🏻',
  '👦🏽',
  '👦🏿',
  '👧🏻',
  '👧🏽',
  '👧🏿',
  '👨🏻',
  '👨🏽',
  '👨🏿',
  '👩🏻',
  '👩🏽',
  '👩🏿',
  '🧑🏻',
  '🧑🏽',
]

function getDefaultAvatar(tipo, vinculo = '') {
  const canonicalTipo = getCanonicalTipo(tipo)
  const normalizedVinculo = String(vinculo || '').trim()

  if (normalizedVinculo === 'Pai') return '👨'
  if (normalizedVinculo === 'Mae') return '👩'
  if (normalizedVinculo === 'Responsavel') return '🧑'
  if (normalizedVinculo === 'Filho') return '👦'
  if (normalizedVinculo === 'Filha') return '👧'
  if (normalizedVinculo === 'Dependente') return '🧒'

  if (canonicalTipo === ROLE_TYPES.PAIS) return '🧑'
  if (canonicalTipo === ROLE_TYPES.DEPENDENTES) return '🧒'
  return '🧒'
}

function sanitizeAvatar(avatar, tipo, vinculo) {
  const normalized = String(avatar || '').trim()
  if (PROFILE_AVATARS.includes(normalized)) return normalized
  return getDefaultAvatar(tipo, vinculo)
}

module.exports = {
  PROFILE_AVATARS,
  getDefaultAvatar,
  sanitizeAvatar,
}
