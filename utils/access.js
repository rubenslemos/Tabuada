function idsMatch(a, b) {
  if (!a || !b) return false
  return String(a) === String(b)
}

function sameOrganization(actor, target) {
  if (!actor || !target) return false
  return idsMatch(actor.organization, target.organization)
}

function canViewUser(actor, target) {
  if (!actor || !target) return false
  if (actor.isGlobalAdmin) return true
  if (idsMatch(actor._id || actor.id, target._id || target.id)) return true
  if (!sameOrganization(actor, target)) return false

  if (actor.tipo === 'Coordenador') return !target.isGlobalAdmin
  if (actor.tipo === 'Professor') {
    return target.tipo === 'Aluno' && actor.turma === target.turma
  }

  return false
}

function canManagePermissions(actor, target) {
  if (!actor || !target) return false
  if (actor.isGlobalAdmin) return true
  if (!sameOrganization(actor, target)) return false

  if (actor.tipo === 'Coordenador') return !target.isGlobalAdmin
  if (actor.tipo === 'Professor') {
    return target.tipo === 'Aluno' && actor.turma === target.turma
  }

  return false
}

function canUseUserAsRoundTarget(actor, target) {
  if (!actor || !target) return false
  if (actor.isGlobalAdmin) return true
  return idsMatch(actor._id || actor.id, target._id || target.id)
}

function canViewRound(actor, owner) {
  return canViewUser(actor, owner)
}

function canCreateInvite(actor, targetOrganizationId, role) {
  if (!actor) return false
  if (actor.isGlobalAdmin) return Boolean(targetOrganizationId) && Boolean(role)

  if (!idsMatch(actor.organization, targetOrganizationId)) return false

  if (actor.tipo === 'Coordenador') {
    return ['Aluno', 'Professor', 'Coordenador'].includes(role)
  }

  if (actor.tipo === 'Professor') {
    return role === 'Aluno'
  }

  return false
}

module.exports = {
  canCreateInvite,
  canManagePermissions,
  canUseUserAsRoundTarget,
  canViewRound,
  canViewUser,
  idsMatch,
  sameOrganization,
}
