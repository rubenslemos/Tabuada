const router = require('express').Router()
const auth = require('../middlewares/authenticator')
const User = require('../models/User')
const Organization = require('../models/Organization')
const InstitutionInvite = require('../models/InstitutionInvite')
const Round = require('../models/Round')
const mailer = require('../modules/mailer')
const { canCreateInvite } = require('../utils/access')
const {
  createUniqueInviteToken,
  isValidCpfOrCnpj,
  MIN_INVITE_TOKEN_LENGTH,
  normalizeDocument,
} = require('../utils/institutions')

function isGlobalAdmin(req, res, next) {
  if (!req.user?.isGlobalAdmin) {
    return res
      .status(403)
      .json({ Msg: 'Acesso restrito ao administrador global' })
  }
  return next()
}

function isTestEnv() {
  return process.env.NODE_ENV === 'test' || Boolean(process.env.JEST_WORKER_ID)
}

function parsePositiveInt(value, fallback) {
  const parsed = Number.parseInt(value, 10)
  if (Number.isNaN(parsed) || parsed <= 0) {
    return fallback
  }
  return parsed
}

function escapeRegex(value = '') {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function buildOrganizationSort(sortBy = 'createdAt', sortOrder = 'desc') {
  const order = sortOrder === 'asc' ? 1 : -1

  if (sortBy === 'name') {
    return { name: order, createdAt: -1 }
  }

  if (sortBy === 'status') {
    return { status: order, createdAt: -1 }
  }

  return { createdAt: order }
}

function buildInviteSort(sortBy = 'createdAt', sortOrder = 'desc') {
  const order = sortOrder === 'asc' ? 1 : -1

  if (sortBy === 'email') {
    return { email: order, createdAt: -1 }
  }

  if (sortBy === 'role') {
    return { role: order, createdAt: -1 }
  }

  if (sortBy === 'expiresAt') {
    return { expiresAt: order, createdAt: -1 }
  }

  return { createdAt: order }
}

function getMailFrom() {
  return process.env.MAIL_FROM || 'Tabuada <nao-responda@tabuada.app>'
}

function buildInviteEmailHtml({ inviteToken, organizationName, role }) {
  return `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #203124;">
      <h2>Convite para a instituicao ${organizationName}</h2>
      <p>Seu perfil liberado para cadastro e: <strong>${role}</strong>.</p>
      <p>Use o codigo abaixo no app para continuar seu cadastro:</p>
      <p style="font-size: 20px; font-weight: bold; letter-spacing: 1px;">${inviteToken}</p>
      <p>Esse codigo comeca com ${MIN_INVITE_TOKEN_LENGTH} numeros e aumenta automaticamente se um dia essa quantidade nao for mais suficiente.</p>
      <p>Esse convite fica valido por <strong>7 dias</strong> a partir do envio.</p>
      <p>Se voce nao solicitou esse acesso, ignore esta mensagem.</p>
    </div>
  `
}

async function sendInviteEmail({ email, inviteToken, organizationName, role }) {
  return mailer.sendMail({
    to: email,
    from: getMailFrom(),
    subject: `Convite da instituicao ${organizationName}`,
    html: buildInviteEmailHtml({ inviteToken, organizationName, role }),
  })
}

router.get('/organizations', auth, isGlobalAdmin, async (_req, res) => {
  try {
    const {
      search = '',
      page,
      pageSize,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      status = 'all',
    } = _req.query
    const wantsPagination =
      Object.prototype.hasOwnProperty.call(_req.query, 'search') ||
      Object.prototype.hasOwnProperty.call(_req.query, 'page') ||
      Object.prototype.hasOwnProperty.call(_req.query, 'pageSize')
    const filters = {}
    const normalizedSearch = String(search).trim()

    if (normalizedSearch) {
      const regex = new RegExp(escapeRegex(normalizedSearch), 'i')
      filters.$or = [
        { name: regex },
        { document: regex },
        { contactEmail: regex },
      ]
    }

    if (['active', 'disabled', 'pending'].includes(status)) {
      filters.status = status
    }

    const currentPage = parsePositiveInt(page, 1)
    const perPage = parsePositiveInt(pageSize, 6)
    const skip = (currentPage - 1) * perPage

    const organizations = await Organization.find(filters)
      .sort(buildOrganizationSort(sortBy, sortOrder))
      .skip(wantsPagination ? skip : 0)
      .limit(wantsPagination ? perPage : 0)
      .lean()
    const orgIds = organizations.map((org) => org._id)

    const [usersAgg, invitesAgg] = await Promise.all([
      User.aggregate([
        { $match: { organization: { $in: orgIds } } },
        { $group: { _id: '$organization', count: { $sum: 1 } } },
      ]),
      InstitutionInvite.aggregate([
        {
          $match: {
            organization: { $in: orgIds },
            usedAt: null,
            expiresAt: { $gt: new Date() },
          },
        },
        { $group: { _id: '$organization', count: { $sum: 1 } } },
      ]),
    ])

    const usersByOrg = Object.fromEntries(
      usersAgg.map((item) => [String(item._id), item.count])
    )
    const invitesByOrg = Object.fromEntries(
      invitesAgg.map((item) => [String(item._id), item.count])
    )

    const items = organizations.map((org) => ({
      ...org,
      userCount: usersByOrg[String(org._id)] || 0,
      pendingInvites: invitesByOrg[String(org._id)] || 0,
    }))

    if (!wantsPagination) {
      return res.status(200).json(items)
    }

    const totalItems = await Organization.countDocuments(filters)

    return res.status(200).json({
      items,
      pagination: {
        page: currentPage,
        pageSize: perPage,
        totalItems,
        totalPages: Math.max(1, Math.ceil(totalItems / perPage)),
      },
    })
  } catch (error) {
    console.error('Erro ao listar instituicoes:', error)
    return res
      .status(500)
      .json({ Msg: 'Nao foi possivel listar as instituicoes' })
  }
})

router.get(
  '/organizations/:organizationId/users',
  auth,
  isGlobalAdmin,
  async (req, res) => {
    try {
      const { tipo = 'Todos' } = req.query
      const filters = { organization: req.params.organizationId }

      if (['Aluno', 'Professor', 'Coordenador'].includes(tipo)) {
        filters.tipo = tipo
      }

      const users = await User.find(filters).sort({ tipo: 1, name: 1 }).lean()

      return res.status(200).json(users)
    } catch (error) {
      console.error('Erro ao listar usuarios da instituicao:', error)
      return res
        .status(500)
        .json({ Msg: 'Nao foi possivel listar os usuarios da instituicao' })
    }
  }
)

router.get(
  '/organizations/:organizationId/summary',
  auth,
  isGlobalAdmin,
  async (req, res) => {
    try {
      const organizationId = req.params.organizationId
      const organization = await Organization.findById(organizationId).lean()

      if (!organization) {
        return res.status(404).json({ Msg: 'Instituicao nao encontrada' })
      }

      const now = new Date()
      const [usersAgg, totalInvites, pendingInvites, recentRounds] =
        await Promise.all([
          User.aggregate([
            {
              $match: {
                organization: organization._id,
                isGlobalAdmin: { $ne: true },
              },
            },
            {
              $group: {
                _id: null,
                totalUsers: { $sum: 1 },
                totalAlunos: {
                  $sum: { $cond: [{ $eq: ['$tipo', 'Aluno'] }, 1, 0] },
                },
                totalProfessores: {
                  $sum: { $cond: [{ $eq: ['$tipo', 'Professor'] }, 1, 0] },
                },
                totalCoordenadores: {
                  $sum: { $cond: [{ $eq: ['$tipo', 'Coordenador'] }, 1, 0] },
                },
                totalJogos: { $sum: '$totalJogos' },
                totalAcertos: { $sum: '$totalAcertos' },
                totalErros: { $sum: '$totalErros' },
                totalRounds: {
                  $sum: {
                    $size: {
                      $ifNull: ['$rounds', []],
                    },
                  },
                },
              },
            },
          ]),
          InstitutionInvite.countDocuments({
            organization: organization._id,
          }),
          InstitutionInvite.countDocuments({
            organization: organization._id,
            usedAt: null,
            expiresAt: { $gt: now },
          }),
          Round.aggregate([
            {
              $lookup: {
                from: 'users',
                localField: 'user',
                foreignField: '_id',
                as: 'userDoc',
              },
            },
            { $unwind: '$userDoc' },
            {
              $match: {
                'userDoc.organization': organization._id,
              },
            },
            { $sort: { createdAt: -1 } },
            { $limit: 5 },
            {
              $project: {
                _id: 1,
                createdAt: 1,
                jogou: 1,
                acerto: 1,
                errou: 1,
                user: {
                  _id: '$userDoc._id',
                  name: '$userDoc.name',
                  tipo: '$userDoc.tipo',
                },
              },
            },
          ]),
        ])

      const summary = usersAgg[0] || {
        totalUsers: 0,
        totalAlunos: 0,
        totalProfessores: 0,
        totalCoordenadores: 0,
        totalJogos: 0,
        totalAcertos: 0,
        totalErros: 0,
        totalRounds: 0,
      }

      return res.status(200).json({
        organization: {
          _id: organization._id,
          name: organization.name,
          status: organization.status,
        },
        metrics: {
          totalUsers: summary.totalUsers || 0,
          totalAlunos: summary.totalAlunos || 0,
          totalProfessores: summary.totalProfessores || 0,
          totalCoordenadores: summary.totalCoordenadores || 0,
          totalInvites,
          pendingInvites,
          totalRounds: summary.totalRounds || 0,
          totalJogos: summary.totalJogos || 0,
          totalAcertos: summary.totalAcertos || 0,
          totalErros: summary.totalErros || 0,
        },
        recentRounds: recentRounds.map((round) => ({
          _id: round._id,
          createdAt: round.createdAt,
          jogou: round.jogou || 0,
          acerto: round.acerto || 0,
          errou: round.errou || 0,
          user: round.user,
        })),
      })
    } catch (error) {
      console.error('Erro ao carregar resumo da instituicao:', error)
      return res
        .status(500)
        .json({ Msg: 'Nao foi possivel carregar o resumo da instituicao' })
    }
  }
)

router.get(
  '/organizations/:organizationId/invites',
  auth,
  isGlobalAdmin,
  async (req, res) => {
    try {
      const {
        status = 'pending',
        role,
        search = '',
        page,
        pageSize,
        sortBy = 'createdAt',
        sortOrder = 'desc',
      } = req.query
      const wantsPagination =
        Object.prototype.hasOwnProperty.call(req.query, 'search') ||
        Object.prototype.hasOwnProperty.call(req.query, 'page') ||
        Object.prototype.hasOwnProperty.call(req.query, 'pageSize')
      const filters = {
        organization: req.params.organizationId,
      }
      const normalizedSearch = String(search).trim()

      if (role && ['Aluno', 'Professor', 'Coordenador'].includes(role)) {
        filters.role = role
      }

      if (normalizedSearch) {
        filters.email = new RegExp(escapeRegex(normalizedSearch), 'i')
      }

      if (status === 'pending') {
        filters.usedAt = null
        filters.expiresAt = { $gt: new Date() }
      } else if (status === 'used') {
        filters.usedAt = { $ne: null }
      } else if (status === 'expired') {
        filters.usedAt = null
        filters.expiresAt = { $lte: new Date() }
      }

      const currentPage = parsePositiveInt(page, 1)
      const perPage = parsePositiveInt(pageSize, 6)
      const skip = (currentPage - 1) * perPage

      const invites = await InstitutionInvite.find(filters)
        .sort(buildInviteSort(sortBy, sortOrder))
        .skip(wantsPagination ? skip : 0)
        .limit(wantsPagination ? perPage : 0)
        .lean()

      if (!wantsPagination) {
        return res.status(200).json(invites)
      }

      const totalItems = await InstitutionInvite.countDocuments(filters)

      return res.status(200).json({
        items: invites,
        pagination: {
          page: currentPage,
          pageSize: perPage,
          totalItems,
          totalPages: Math.max(1, Math.ceil(totalItems / perPage)),
        },
      })
    } catch (error) {
      console.error('Erro ao listar convites da instituicao:', error)
      return res
        .status(500)
        .json({ Msg: 'Nao foi possivel listar os convites da instituicao' })
    }
  }
)

router.patch(
  '/organizations/:organizationId',
  auth,
  isGlobalAdmin,
  async (req, res) => {
    const { name, document, contactEmail } = req.body

    if (!name || !document || !contactEmail) {
      return res
        .status(422)
        .json({ Msg: 'Nome, CPF/CNPJ e email sao obrigatorios' })
    }

    const normalizedDocument = normalizeDocument(document)
    if (!isValidCpfOrCnpj(normalizedDocument)) {
      return res.status(422).json({ Msg: 'CPF ou CNPJ invalido' })
    }

    try {
      const duplicate = await Organization.findOne({
        normalizedDocument,
        _id: { $ne: req.params.organizationId },
      })

      if (duplicate) {
        return res
          .status(422)
          .json({ Msg: 'Ja existe uma instituicao com esse documento' })
      }

      const organization = await Organization.findByIdAndUpdate(
        req.params.organizationId,
        {
          name: String(name).trim(),
          document: String(document).trim(),
          normalizedDocument,
          contactEmail: String(contactEmail).toLowerCase().trim(),
        },
        { returnDocument: 'after' }
      )

      if (!organization) {
        return res.status(404).json({ Msg: 'Instituicao nao encontrada' })
      }

      return res.status(200).json({ organization })
    } catch (error) {
      console.error('Erro ao editar instituicao no admin:', error)
      return res
        .status(500)
        .json({ Msg: 'Nao foi possivel editar a instituicao' })
    }
  }
)

router.post('/organizations', auth, isGlobalAdmin, async (req, res) => {
  const { name, document, contactEmail } = req.body

  if (!name || !document || !contactEmail) {
    return res
      .status(422)
      .json({ Msg: 'Nome, CPF/CNPJ e email sao obrigatorios' })
  }

  const normalizedDocument = normalizeDocument(document)
  if (!isValidCpfOrCnpj(normalizedDocument)) {
    return res.status(422).json({ Msg: 'CPF ou CNPJ invalido' })
  }

  try {
    const exists = await Organization.findOne({ normalizedDocument })
    if (exists) {
      return res
        .status(422)
        .json({ Msg: 'Ja existe uma instituicao com esse documento' })
    }

    const organization = await Organization.create({
      name: String(name).trim(),
      document: String(document).trim(),
      normalizedDocument,
      contactEmail: String(contactEmail).toLowerCase().trim(),
      status: 'active',
    })

    return res.status(201).json({ organization })
  } catch (error) {
    console.error('Erro ao criar instituicao no admin:', error)
    return res.status(500).json({ Msg: 'Nao foi possivel criar a instituicao' })
  }
})

router.patch(
  '/organizations/:organizationId/status',
  auth,
  isGlobalAdmin,
  async (req, res) => {
    const { status } = req.body
    if (!['active', 'disabled', 'pending'].includes(status)) {
      return res.status(422).json({ Msg: 'Status invalido' })
    }

    try {
      const organization = await Organization.findByIdAndUpdate(
        req.params.organizationId,
        { status },
        { returnDocument: 'after' }
      )

      if (!organization) {
        return res.status(404).json({ Msg: 'Instituicao nao encontrada' })
      }

      return res.status(200).json({ organization })
    } catch (error) {
      console.error('Erro ao atualizar status da instituicao:', error)
      return res
        .status(500)
        .json({ Msg: 'Nao foi possivel atualizar a instituicao' })
    }
  }
)

router.post(
  '/organizations/:organizationId/invites',
  auth,
  isGlobalAdmin,
  async (req, res) => {
    const { email, role } = req.body
    const organizationId = req.params.organizationId

    if (!canCreateInvite(req.user, organizationId, role)) {
      return res
        .status(403)
        .json({ Msg: 'Nao autorizado a gerar este convite' })
    }

    if (!email || !role) {
      return res.status(422).json({ Msg: 'Email e perfil sao obrigatorios' })
    }

    try {
      const normalizedEmail = String(email).toLowerCase().trim()
      const [organization, existingUser, existingInvite] = await Promise.all([
        Organization.findById(organizationId),
        User.findOne({ email: normalizedEmail }),
        InstitutionInvite.findOne({
          organization: organizationId,
          email: normalizedEmail,
          usedAt: null,
          expiresAt: { $gt: new Date() },
        }),
      ])

      if (!organization || organization.status !== 'active') {
        return res
          .status(404)
          .json({ Msg: 'Instituicao nao encontrada ou inativa' })
      }

      if (existingUser || existingInvite) {
        return res.status(422).json({
          Msg: 'Esse email ja possui cadastro ou convite em andamento',
        })
      }

      const { inviteToken, tokenHash } =
        await createUniqueInviteToken(InstitutionInvite)
      await InstitutionInvite.create({
        organization: organization._id,
        email: normalizedEmail,
        role,
        tokenHash,
        createdByUser: req.user._id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      })

      let emailSent = true
      try {
        await sendInviteEmail({
          email: normalizedEmail,
          inviteToken,
          organizationName: organization.name,
          role,
        })
      } catch (emailError) {
        emailSent = false
        console.error('Erro ao enviar convite pelo admin:', emailError)
      }

      return res.status(200).json({
        message: emailSent
          ? 'Convite enviado para o email informado.'
          : 'Convite gerado com sucesso. Nao foi possivel enviar o e-mail neste momento.',
        ...(isTestEnv() ? { inviteToken } : {}),
      })
    } catch (error) {
      console.error('Erro ao gerar convite no admin:', error)
      return res.status(500).json({ Msg: 'Nao foi possivel gerar o convite' })
    }
  }
)

router.post(
  '/invites/:inviteId/resend',
  auth,
  isGlobalAdmin,
  async (req, res) => {
    try {
      const invite = await InstitutionInvite.findById(
        req.params.inviteId
      ).populate('organization')

      if (!invite || invite.usedAt) {
        return res
          .status(404)
          .json({ Msg: 'Convite nao encontrado ou ja utilizado' })
      }

      if (!invite.organization || invite.organization.status !== 'active') {
        return res
          .status(404)
          .json({ Msg: 'Instituicao nao encontrada ou inativa' })
      }

      const { inviteToken, tokenHash } =
        await createUniqueInviteToken(InstitutionInvite)
      invite.tokenHash = tokenHash
      invite.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      invite.createdByUser = req.user._id
      await invite.save()

      let emailSent = true
      try {
        await sendInviteEmail({
          email: invite.email,
          inviteToken,
          organizationName: invite.organization.name,
          role: invite.role,
        })
      } catch (emailError) {
        emailSent = false
        console.error('Erro ao reenviar convite pelo admin:', emailError)
      }

      return res.status(200).json({
        message: emailSent
          ? 'Convite reenviado com sucesso.'
          : 'Convite atualizado com sucesso. Nao foi possivel enviar o e-mail neste momento.',
        ...(isTestEnv() ? { inviteToken } : {}),
      })
    } catch (error) {
      console.error('Erro ao reenviar convite:', error)
      return res
        .status(500)
        .json({ Msg: 'Nao foi possivel reenviar o convite' })
    }
  }
)

module.exports = router
