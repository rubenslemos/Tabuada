const ROLE_TYPES = {
  ADMIN: 'Administrador',
  PAIS: 'Pais',
  DEPENDENTES: 'Dependentes',
}

const LEGACY_TO_CANONICAL_ROLE = {
  Aluno: ROLE_TYPES.DEPENDENTES,
  Professor: ROLE_TYPES.PAIS,
  Coordenador: ROLE_TYPES.PAIS,
  Dependentes: ROLE_TYPES.DEPENDENTES,
  Pais: ROLE_TYPES.PAIS,
  Administrador: ROLE_TYPES.ADMIN,
}

const CANONICAL_ROLES = [
  ROLE_TYPES.DEPENDENTES,
  ROLE_TYPES.PAIS,
  ROLE_TYPES.ADMIN,
]

const RELATION_OPTIONS = {
  [ROLE_TYPES.PAIS]: ['Pai', 'Mae', 'Responsavel'],
  [ROLE_TYPES.DEPENDENTES]: ['Filho', 'Filha', 'Dependente'],
}

function getCanonicalTipo(tipo) {
  return LEGACY_TO_CANONICAL_ROLE[String(tipo || '').trim()] || tipo || ''
}

function getDisplayRole(tipo) {
  const canonical = getCanonicalTipo(tipo)
  return canonical || ''
}

function isGlobalAdminLike(user) {
  return (
    Boolean(user?.isGlobalAdmin) ||
    getCanonicalTipo(user?.tipo) === ROLE_TYPES.ADMIN
  )
}

function isPais(userOrTipo) {
  const tipo = typeof userOrTipo === 'string' ? userOrTipo : userOrTipo?.tipo
  return getCanonicalTipo(tipo) === ROLE_TYPES.PAIS
}

function isDependente(userOrTipo) {
  const tipo = typeof userOrTipo === 'string' ? userOrTipo : userOrTipo?.tipo
  return getCanonicalTipo(tipo) === ROLE_TYPES.DEPENDENTES
}

function getDefaultVinculoForTipo(tipo) {
  const canonical = getCanonicalTipo(tipo)
  if (canonical === ROLE_TYPES.PAIS) return 'Responsavel'
  if (canonical === ROLE_TYPES.DEPENDENTES) return 'Dependente'
  return ''
}

function sanitizeVinculo(tipo, vinculo) {
  const canonical = getCanonicalTipo(tipo)
  const allowed = RELATION_OPTIONS[canonical] || []
  const normalized = String(vinculo || '').trim()

  if (allowed.includes(normalized)) return normalized
  return getDefaultVinculoForTipo(canonical)
}

function getManageableInviteRoles(actor) {
  if (!actor) return []
  if (isGlobalAdminLike(actor)) return [ROLE_TYPES.PAIS, ROLE_TYPES.DEPENDENTES]
  if (isPais(actor)) return [ROLE_TYPES.PAIS, ROLE_TYPES.DEPENDENTES]
  return []
}

function getManageableTargetRoles(actor) {
  if (!actor) return []
  if (isGlobalAdminLike(actor)) return [ROLE_TYPES.PAIS, ROLE_TYPES.DEPENDENTES]
  if (isPais(actor)) return [ROLE_TYPES.DEPENDENTES]
  return []
}

module.exports = {
  CANONICAL_ROLES,
  LEGACY_TO_CANONICAL_ROLE,
  RELATION_OPTIONS,
  ROLE_TYPES,
  getCanonicalTipo,
  getDefaultVinculoForTipo,
  getDisplayRole,
  getManageableInviteRoles,
  getManageableTargetRoles,
  isDependente,
  isGlobalAdminLike,
  isPais,
  sanitizeVinculo,
}
