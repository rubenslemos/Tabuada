const router = require('express').Router()
const User = require('../models/User')
const Organization = require('../models/Organization')
const InstitutionInvite = require('../models/InstitutionInvite')
const jwt = require('jsonwebtoken')
const auth = require('../middlewares/authenticator')
const mailer = require('../modules/mailer')
const {
  buildDefaultPermissoes,
  createUniqueInviteToken,
  hashInviteToken,
  isValidCpfOrCnpj,
  MIN_INVITE_TOKEN_LENGTH,
  normalizeDocument,
} = require('../utils/institutions')
const { canCreateInvite } = require('../utils/access')
require('dotenv').config()

const hash = process.env.SECRET

function generateToken(params = {}) {
  return jwt.sign(params, hash, {
    expiresIn: 86400,
  })
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

function isTestEnv() {
  return process.env.NODE_ENV === 'test' || Boolean(process.env.JEST_WORKER_ID)
}

async function sendInviteEmail({ email, inviteToken, organizationName, role }) {
  return mailer.sendMail({
    to: email,
    from: getMailFrom(),
    subject: `Convite da instituicao ${organizationName}`,
    html: buildInviteEmailHtml({ inviteToken, organizationName, role }),
  })
}

async function createInviteForOrganization({
  organization,
  email,
  role,
  createdByUser = null,
}) {
  const { inviteToken, tokenHash } =
    await createUniqueInviteToken(InstitutionInvite)

  await InstitutionInvite.create({
    organization: organization._id,
    email,
    role,
    tokenHash,
    createdByUser,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  })

  return inviteToken
}

function genericInviteError(res) {
  return res.status(400).json({
    Msg: 'Convite invalido, expirado ou nao autorizado.',
  })
}

router.post('/request-organization', async (req, res) => {
  const { organizationName, document, email } = req.body

  if (!organizationName || !document || !email) {
    return res.status(422).json({
      Msg: 'Nome da instituicao, CPF/CNPJ e email sao obrigatorios',
    })
  }

  const normalizedEmail = email.toLowerCase().trim()
  const normalizedDocument = normalizeDocument(document)

  if (!isValidCpfOrCnpj(normalizedDocument)) {
    return res.status(422).json({ Msg: 'CPF ou CNPJ invalido' })
  }

  try {
    const [emailExists, orgExists, pendingInvite] = await Promise.all([
      User.findOne({ email: normalizedEmail }),
      Organization.findOne({ normalizedDocument }),
      InstitutionInvite.findOne({
        email: normalizedEmail,
        usedAt: null,
        expiresAt: { $gt: new Date() },
      }),
    ])

    if (emailExists || pendingInvite) {
      return res.status(422).json({
        Msg: 'Esse email ja possui cadastro ou convite em andamento',
      })
    }

    if (orgExists) {
      return res.status(422).json({
        Msg: 'Nao foi possivel processar essa instituicao com os dados informados',
      })
    }

    const organization = await Organization.create({
      name: organizationName.trim(),
      document: String(document).trim(),
      normalizedDocument,
      contactEmail: normalizedEmail,
      status: 'active',
    })

    const inviteToken = await createInviteForOrganization({
      organization,
      email: normalizedEmail,
      role: 'Coordenador',
    })

    try {
      await sendInviteEmail({
        email: normalizedEmail,
        inviteToken,
        organizationName: organization.name,
        role: 'Coordenador',
      })

      return res.status(200).json({
        message: 'Convite enviado para o email informado.',
        ...(isTestEnv() ? { inviteToken } : {}),
      })
    } catch (emailError) {
      console.error('Erro ao enviar convite da instituicao:', emailError)
      return res.status(200).json({
        message:
          'Convite gerado com sucesso. Nao foi possivel enviar o e-mail neste momento.',
        ...(isTestEnv() ? { inviteToken } : {}),
      })
    }
  } catch (error) {
    console.error('Erro ao criar instituicao:', error)
    return res.status(500).json({
      Msg: 'Erro no servidor, tente novamente em instantes',
      ...(isTestEnv() ? { details: error.message } : {}),
    })
  }
})

router.post('/request-invite', auth, async (req, res) => {
  const { organizationId, email, role } = req.body

  if (!email || !role) {
    return res.status(422).json({ Msg: 'Email e perfil sao obrigatorios' })
  }

  const targetOrganizationId = organizationId || req.user.organization
  if (!canCreateInvite(req.user, targetOrganizationId, role)) {
    return res.status(403).json({ Msg: 'Nao autorizado a gerar este convite' })
  }

  try {
    const normalizedEmail = String(email).toLowerCase().trim()
    const [organization, existingUser, existingInvite] = await Promise.all([
      Organization.findById(targetOrganizationId),
      User.findOne({ email: normalizedEmail }),
      InstitutionInvite.findOne({
        organization: targetOrganizationId,
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
      return res
        .status(422)
        .json({ Msg: 'Esse email ja possui cadastro ou convite em andamento' })
    }

    const inviteToken = await createInviteForOrganization({
      organization,
      email: normalizedEmail,
      role,
      createdByUser: req.user._id,
    })

    try {
      await sendInviteEmail({
        email: normalizedEmail,
        inviteToken,
        organizationName: organization.name,
        role,
      })
    } catch (emailError) {
      console.error('Erro ao enviar convite adicional:', emailError)
    }

    return res.status(200).json({
      message: 'Convite enviado para o email informado.',
      ...(isTestEnv() ? { inviteToken } : {}),
    })
  } catch (error) {
    console.error('Erro ao gerar convite:', error)
    return res
      .status(500)
      .json({ Msg: 'Erro no servidor, tente novamente em instantes' })
  }
})

router.post('/validate-invite', async (req, res) => {
  const { inviteToken } = req.body
  if (!inviteToken) {
    return genericInviteError(res)
  }

  try {
    const tokenHash = hashInviteToken(inviteToken)
    const invite = await InstitutionInvite.findOne({ tokenHash }).populate(
      'organization'
    )

    if (!invite || invite.usedAt || invite.expiresAt <= new Date()) {
      return genericInviteError(res)
    }

    if (!invite.organization || invite.organization.status !== 'active') {
      return genericInviteError(res)
    }

    return res.status(200).json({
      invite: {
        role: invite.role,
        email: invite.email,
        organizationId: invite.organization._id,
        organizationName: invite.organization.name,
        inviteToken,
      },
    })
  } catch (error) {
    console.error('Erro ao validar convite:', error)
    return genericInviteError(res)
  }
})

router.post('/', async (req, res) => {
  const { inviteToken, name, email, password, confirmPassword, turma } =
    req.body
  if (!inviteToken || !name || !email || !password || !confirmPassword) {
    return res.status(422).json({ Msg: 'Todos os campos sao obrigatorios' })
  }

  if (password !== confirmPassword) {
    return res.status(422).json({ Msg: 'Senha e confirmação não coincidem' })
  }

  const regex = /^(?=.*[A-Z])(?=.*[!@#$%^&*])(?=.*[0-9]).{8,20}$/
  if (!regex.test(password)) {
    return res.status(422).json({
      Msg: 'Senha deve ter 8-20 caracteres, incluindo maiúsculas, números e símbolos (!@#$%^&*)',
    })
  }

  try {
    const normalizedEmail = email.toLowerCase().trim()
    const tokenHash = hashInviteToken(inviteToken)
    const invite = await InstitutionInvite.findOne({ tokenHash }).populate(
      'organization'
    )

    if (!invite || invite.usedAt || invite.expiresAt <= new Date()) {
      return genericInviteError(res)
    }

    if (!invite.organization || invite.organization.status !== 'active') {
      return genericInviteError(res)
    }

    if (invite.email !== normalizedEmail) {
      return genericInviteError(res)
    }

    const emailExists = await User.findOne({ email: normalizedEmail })
    if (emailExists) {
      return res.status(422).json({ Msg: 'E-mail já existe' })
    }

    const userExists = await User.findOne({
      name: name.toLowerCase().trim(),
      organization: invite.organization._id,
    })
    if (userExists) {
      return res.status(422).json({ Msg: 'Usuário já existe' })
    }

    const effectiveTurma =
      turma && String(turma).trim()
        ? String(turma).toUpperCase().trim()
        : invite.role === 'Coordenador'
          ? 'GERAL'
          : ''

    if (!effectiveTurma) {
      return res.status(422).json({ Msg: 'Turma é obrigatória' })
    }

    const user = await User.create({
      tipo: invite.role,
      name: name.toLowerCase().trim(),
      email: normalizedEmail,
      password,
      permissoes: buildDefaultPermissoes(invite.role),
      turma: effectiveTurma,
      organization: invite.organization._id,
      organizationName: invite.organization.name,
    })

    invite.usedAt = new Date()
    invite.usedByUser = user._id
    await invite.save()

    if (!invite.organization.createdByUser && invite.role === 'Coordenador') {
      invite.organization.createdByUser = user._id
      await invite.organization.save()
    }

    return res.status(201).json({
      Msg: 'Cadastrado com sucesso',
      user,
      token: generateToken({ id: user.id }),
    })
  } catch (error) {
    console.error('Erro ao criar usuário:', error)
    return res.status(500).json({
      msg: 'Erro no servidor, tente em alguns minutos',
      ...(isTestEnv() ? { details: error.message } : {}),
    })
  }
})

router.get('/', auth, async (req, res) => {
  try {
    const loggedInUser = req.user
    const baseQuery = loggedInUser.isGlobalAdmin
      ? {}
      : { organization: loggedInUser.organization }

    if (loggedInUser.isGlobalAdmin) {
      const allUsers = await User.find(baseQuery)
        .populate('rounds')
        .populate('organization')
      return res.status(200).json(allUsers)
    }

    if (loggedInUser.tipo === 'Professor') {
      const alunosDaMesmaTurma = await User.find({
        ...baseQuery,
        tipo: 'Aluno',
        turma: loggedInUser.turma,
      }).populate('rounds')

      if (!alunosDaMesmaTurma.length) {
        return res
          .status(422)
          .json({ error: 'Não há alunos cadastrados nessa turma.' })
      }

      return res.status(200).json(alunosDaMesmaTurma)
    }

    if (loggedInUser.tipo === 'Coordenador') {
      const allUsers = await User.find({
        ...baseQuery,
        isGlobalAdmin: false,
      }).populate('rounds')

      if (!allUsers.length) {
        return res.status(422).json({ error: 'Não há usuários cadastrados.' })
      }

      return res.status(200).json(allUsers)
    }

    const allAlunos = await User.find({
      ...baseQuery,
      tipo: 'Aluno',
    }).populate('rounds')

    if (!allAlunos.length) {
      return res.status(422).json({ error: 'Não há alunos cadastrados.' })
    }

    return res.status(200).json(allAlunos)
  } catch (error) {
    console.error('Erro ao listar alunos:', error)
    return res.status(500).json({ error: 'Erro ao listar alunos' })
  }
})

router.get('/organization/me', auth, async (req, res) => {
  try {
    if (req.user.isGlobalAdmin) {
      return res.status(200).json({ organization: null, isGlobalAdmin: true })
    }

    const organization = await Organization.findById(req.user.organization)
    if (!organization) {
      return res.status(404).json({ Msg: 'Instituicao nao encontrada' })
    }

    return res.status(200).json({ organization, isGlobalAdmin: false })
  } catch (error) {
    console.error('Erro ao carregar instituicao:', error)
    return res.status(500).json({ Msg: 'Erro ao carregar instituicao' })
  }
})

module.exports = router
