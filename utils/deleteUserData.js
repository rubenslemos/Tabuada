const User = require('../models/User')
const Round = require('../models/Round')
const Contagem = require('../models/Contagem')
const InstitutionInvite = require('../models/InstitutionInvite')
const AccountDeletionRequest = require('../models/AccountDeletionRequest')

async function deleteUserData(userId, { email = null } = {}) {
  const rounds = await Round.find({ user: userId }).select(
    '_id contagemOperacoes'
  )
  const roundIds = rounds.map((round) => round._id)
  const contagemIds = rounds
    .map((round) => round.contagemOperacoes)
    .filter(Boolean)

  await Promise.all([
    roundIds.length ? Round.deleteMany({ _id: { $in: roundIds } }) : null,
    contagemIds.length
      ? Contagem.deleteMany({ _id: { $in: contagemIds } })
      : null,
    Contagem.deleteMany({ user: userId }),
    InstitutionInvite.deleteMany({ createdByUser: userId }),
    User.deleteOne({ _id: userId }),
    email
      ? AccountDeletionRequest.updateMany(
          { email: String(email).toLowerCase().trim(), status: 'pending' },
          { $set: { status: 'processed', processedAt: new Date() } }
        )
      : null,
  ])
}

module.exports = { deleteUserData }
