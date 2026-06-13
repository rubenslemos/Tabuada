const {
  getCanonicalTipo,
  getManageableInviteRoles,
  getManageableTargetRoles,
  isDependente,
  isGlobalAdminLike,
  isPais,
} = require('./roles')

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
  if (isGlobalAdminLike(actor)) return true
  if (idsMatch(actor._id || actor.id, target._id || target.id)) return true
  if (!sameOrganization(actor, target)) return false

  if (isPais(actor)) return !isGlobalAdminLike(target)

  return false
}

function canManagePermissions(actor, target) {
  if (!actor || !target) return false
  if (isGlobalAdminLike(actor)) return true
  if (!sameOrganization(actor, target)) return false

  const manageableRoles = getManageableTargetRoles(actor)
  return manageableRoles.includes(getCanonicalTipo(target.tipo))
}

function canUseUserAsRoundTarget(actor, target) {
  if (!actor || !target) return false
  if (isGlobalAdminLike(actor)) return true
  return idsMatch(actor._id || actor.id, target._id || target.id)
}

function canViewRound(actor, owner) {
  return canViewUser(actor, owner)
}

function canCreateInvite(actor, targetOrganizationId, role) {
  if (!actor) return false
  const canonicalRole = getCanonicalTipo(role)
  if (!canonicalRole) return false

  if (isGlobalAdminLike(actor)) {
    return (
      Boolean(targetOrganizationId) &&
      getManageableInviteRoles(actor).includes(canonicalRole)
    )
  }

  if (!idsMatch(actor.organization, targetOrganizationId)) return false

  return getManageableInviteRoles(actor).includes(canonicalRole)
}

module.exports = {
  canCreateInvite,
  canManagePermissions,
  canUseUserAsRoundTarget,
  canViewRound,
  canViewUser,
  idsMatch,
  isDependente,
  isPais,
  sameOrganization,
}
