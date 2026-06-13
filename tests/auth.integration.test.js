const request = require('supertest')
const mongoose = require('mongoose')

jest.mock('../modules/mailer', () => ({
  sendMail: jest.fn().mockResolvedValue(true),
}))

const mailer = require('../modules/mailer')
const { createTestApp } = require('./test-setup')
const Organization = require('../models/Organization')
const InstitutionInvite = require('../models/InstitutionInvite')
const User = require('../models/User')
const Round = require('../models/Round')
const { hashInviteToken } = require('../utils/institutions')
const { decryptCpf } = require('../utils/cpfProtection')

let app
let cpfCounter = 0
let uniqueCounter = 0
let baseOrganizationId = null

function uniqueId(prefix = 'id') {
  uniqueCounter += 1
  return `${prefix}_${Date.now()}_${uniqueCounter}`
}

function buildValidCpf() {
  const seed = Date.now() + cpfCounter
  cpfCounter += 1
  const base = String(seed).replace(/\D/g, '').padStart(9, '1').slice(-9)

  const calcDigit = (digits, factor) => {
    let total = 0
    for (let i = 0; i < digits.length; i += 1) {
      total += Number(digits[i]) * (factor - i)
    }
    const remainder = (total * 10) % 11
    return remainder === 10 ? 0 : remainder
  }

  const first = calcDigit(base, 10)
  const second = calcDigit(`${base}${first}`, 11)
  return `${base}${first}${second}`
}

async function createInvite({ email, role }) {
  const inviteToken = uniqueId('INVITE')
  await InstitutionInvite.create({
    organization: baseOrganizationId,
    email,
    role,
    tokenHash: hashInviteToken(inviteToken),
    expiresAt: new Date(Date.now() + 60 * 60 * 1000),
  })
  return inviteToken
}

async function registerWithInvite({ email, password, role = 'Dependentes' }) {
  const inviteToken = await createInvite({ email, role })
  return request(app)
    .post('/auth/register')
    .send({
      inviteToken,
      name: uniqueId(`jest_${role.toLowerCase()}`),
      email,
      password,
      confirmPassword: password,
      turma: role === 'Dependentes' ? 'A1' : undefined,
      cpf: role === 'Pais' ? buildValidCpf() : undefined,
      vinculo: role === 'Pais' ? 'Responsavel' : 'Dependente',
    })
}

beforeAll(async () => {
  process.env.SECRET = process.env.SECRET || 'testsecret'
  process.env.NODE_ENV = 'test'
  process.env.ADMIN_EMAIL = 'admin@test.com'
  process.env.ADMIN_PASSWORD = 'Admin@123'
  process.env.ADMIN_NAME = 'Administrador Global'
  app = await createTestApp()

  const coordinatorEmail = `${uniqueId('coord_base')}@example.com`
  const requestInviteRes = await request(app)
    .post('/auth/register/request-organization')
    .send({
      organizationName: uniqueId('CasaBase'),
      document: buildValidCpf(),
      email: coordinatorEmail,
    })
    .expect(200)

  await request(app)
    .post('/auth/register')
    .send({
      inviteToken: requestInviteRes.body.inviteToken,
      name: uniqueId('coord_base_user'),
      email: coordinatorEmail,
      password: 'P@ssw0rd1',
      confirmPassword: 'P@ssw0rd1',
      cpf: buildValidCpf(),
      vinculo: 'Responsavel',
    })
    .expect(201)

  const organization = await Organization.findOne({
    contactEmail: coordinatorEmail,
  })
  baseOrganizationId = organization?._id || null
})

afterAll(async () => {
  if (app && app._mongod) await app._mongod.stop()
  await mongoose.disconnect()
})

test('login should fail with wrong password', async () => {
  const email = `${uniqueId('test_wrong')}@example.com`
  const password = 'P@ssw0rd1'

  const registerRes = await registerWithInvite({
    email,
    password,
    role: 'Dependentes',
  })
  expect(registerRes.status).toBe(201)

  const res = await request(app)
    .post('/auth/login')
    .send({ email, password: 'SenhaErrada123!' })
    .expect(422)

  expect(res.body).toHaveProperty('Msg', 'Senha Inválida')
})

test('register should fail when password confirmation does not match', async () => {
  const email = `${uniqueId('test_mismatch')}@example.com`
  const inviteToken = await createInvite({ email, role: 'Dependentes' })

  const res = await request(app)
    .post('/auth/register')
    .send({
      inviteToken,
      name: uniqueId('jest_mismatch'),
      email,
      password: 'P@ssw0rd1',
      confirmPassword: 'P@ssw0rd2',
      turma: 'A1',
    })
    .expect(422)

  expect(res.body).toHaveProperty('Msg', 'Senha e confirmação não coincidem')
})

test('register accepts invite token in lowercase', async () => {
  const email = `${uniqueId('test_lowercase')}@example.com`
  const inviteToken = await createInvite({ email, role: 'Dependentes' })

  const res = await request(app)
    .post('/auth/register')
    .send({
      inviteToken: inviteToken.toLowerCase(),
      name: uniqueId('jest_lowercase'),
      email,
      password: 'P@ssw0rd1',
      confirmPassword: 'P@ssw0rd1',
      turma: 'A1',
    })
    .expect(201)

  expect(res.body).toHaveProperty('user.email', email)
})

test('register allows pais without turma in family flow', async () => {
  const email = `${uniqueId('test_pais_sem_turma')}@example.com`
  const inviteToken = await createInvite({ email, role: 'Pais' })
  const plainCpf = buildValidCpf()

  const res = await request(app)
    .post('/auth/register')
    .send({
      inviteToken,
      name: uniqueId('jest_pais_sem_turma'),
      email,
      password: 'P@ssw0rd1',
      confirmPassword: 'P@ssw0rd1',
      cpf: plainCpf,
      vinculo: 'Responsavel',
    })
    .expect(201)

  const savedUser = await User.findOne({ email })
  expect(res.body).toHaveProperty('user.email', email)
  expect(res.body).toHaveProperty('user.turma', '')
  expect(savedUser.cpf).not.toBe(plainCpf)
  expect(savedUser.normalizedCpf).not.toBe(plainCpf)
  expect(decryptCpf(savedUser.cpf)).toBe(plainCpf)
})

test('forgot_password should send recovery token and call mailer', async () => {
  const email = `${uniqueId('test_forgot')}@example.com`
  const password = 'P@ssw0rd1'

  const registerRes = await registerWithInvite({
    email,
    password,
    role: 'Dependentes',
  })
  expect(registerRes.status).toBe(201)

  mailer.sendMail.mockClear()

  const res = await request(app)
    .post('/auth/login/forgot_password')
    .send({ email })
    .expect(200)

  expect(res.body).toHaveProperty('token')
  expect(res.body).toHaveProperty(
    'message',
    'Email de recuperação enviado com sucesso'
  )
  expect(mailer.sendMail).toHaveBeenCalledTimes(1)
})

test('auth token endpoint should reject requests without token', async () => {
  const tokenCheck = await request(app).post('/auth/login/token').expect(401)
  expect(tokenCheck.body).toHaveProperty('error', 'Token não informado')
})

test('pais pode gerar convite para outro perfil na mesma casa', async () => {
  const coordinatorEmail = `${uniqueId('coord_login')}@example.com`
  const coordinatorPassword = 'P@ssw0rd1'
  const coordinatorInviteToken = await createInvite({
    email: coordinatorEmail,
    role: 'Pais',
  })

  const coordinatorRegister = await request(app)
    .post('/auth/register')
    .send({
      inviteToken: coordinatorInviteToken,
      name: uniqueId('coord_login_user'),
      email: coordinatorEmail,
      password: coordinatorPassword,
      confirmPassword: coordinatorPassword,
      cpf: buildValidCpf(),
      vinculo: 'Responsavel',
    })
  expect(coordinatorRegister.status).toBe(201)

  const loginRes = await request(app)
    .post('/auth/login')
    .send({ email: coordinatorEmail, password: coordinatorPassword })
    .expect(200)

  const inviteRes = await request(app)
    .post('/auth/register/request-invite')
    .set('Authorization', `Bearer ${loginRes.body.token}`)
    .send({
      email: `${uniqueId('prof_target')}@example.com`,
      role: 'Pais',
    })
    .expect(200)

  expect(inviteRes.body).toHaveProperty(
    'message',
    'Convite enviado para o email informado. A entrega pode levar alguns minutos.'
  )
})

test('usuario pode atualizar nome vinculo e avatar pelo proprio perfil', async () => {
  const email = `${uniqueId('profile_update')}@example.com`
  const password = 'P@ssw0rd1'

  const registerRes = await registerWithInvite({
    email,
    password,
    role: 'Pais',
  })
  expect(registerRes.status).toBe(201)

  const loginRes = await request(app)
    .post('/auth/login')
    .send({ email, password })
    .expect(200)

  const token = loginRes.body.token

  const updateRes = await request(app)
    .patch('/auth/login/me')
    .set('Authorization', `Bearer ${token}`)
    .send({
      name: 'Pai Atualizado',
      vinculo: 'Pai',
      avatar: '👨',
    })
    .expect(200)

  expect(updateRes.body).toHaveProperty('user.name', 'pai atualizado')
  expect(updateRes.body).toHaveProperty('user.vinculo', 'Pai')
  expect(updateRes.body).toHaveProperty('user.avatar', '👨')
})

test('dependente nao pode gerar convite para pais', async () => {
  const professorEmail = `${uniqueId('prof_login')}@example.com`
  const professorPassword = 'P@ssw0rd1'
  const professorRegister = await registerWithInvite({
    email: professorEmail,
    password: professorPassword,
    role: 'Dependentes',
  })
  expect(professorRegister.status).toBe(201)

  const loginRes = await request(app)
    .post('/auth/login')
    .send({ email: professorEmail, password: professorPassword })
    .expect(200)

  const inviteRes = await request(app)
    .post('/auth/register/request-invite')
    .set('Authorization', `Bearer ${loginRes.body.token}`)
    .send({
      email: `${uniqueId('forbidden_prof')}@example.com`,
      role: 'Pais',
    })
    .expect(403)

  expect(inviteRes.body).toHaveProperty(
    'Msg',
    'Nao autorizado a gerar este convite'
  )
})

test('admin global cria instituicao e reenvia convite pendente', async () => {
  const adminLogin = await request(app)
    .post('/auth/login')
    .send({ email: 'admin@test.com', password: 'Admin@123' })
    .expect(200)

  const adminToken = adminLogin.body.token

  const createOrgRes = await request(app)
    .post('/admin/organizations')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      name: uniqueId('Org Admin'),
      document: buildValidCpf(),
      contactEmail: `${uniqueId('admin_org')}@example.com`,
    })
    .expect(201)

  const organizationId = createOrgRes.body.organization._id

  const inviteRes = await request(app)
    .post(`/admin/organizations/${organizationId}/invites`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      email: `${uniqueId('pending_invite')}@example.com`,
      role: 'Dependentes',
    })
    .expect(200)

  expect(inviteRes.body).toHaveProperty(
    'message',
    'Convite enviado para o email informado. A entrega pode levar alguns minutos.'
  )
  expect(inviteRes.body.inviteToken).toMatch(/^\d{5}$/)

  const invitesList = await request(app)
    .get(`/admin/organizations/${organizationId}/invites`)
    .set('Authorization', `Bearer ${adminToken}`)
    .expect(200)

  const inviteId = invitesList.body[0]?._id
  expect(inviteId).toBeTruthy()

  const resendRes = await request(app)
    .post(`/admin/invites/${inviteId}/resend`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({})
    .expect(200)

  expect(resendRes.body).toHaveProperty(
    'message',
    'Convite reenviado com sucesso. A entrega pode levar alguns minutos.'
  )
  expect(resendRes.body.inviteToken).toMatch(/^\d{5}$/)
})

test('admin global edita instituicao e filtra convites por status/perfil', async () => {
  const adminLogin = await request(app)
    .post('/auth/login')
    .send({ email: 'admin@test.com', password: 'Admin@123' })
    .expect(200)

  const adminToken = adminLogin.body.token

  const createOrgRes = await request(app)
    .post('/admin/organizations')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      name: uniqueId('Org Edit'),
      document: buildValidCpf(),
      contactEmail: `${uniqueId('edit_org')}@example.com`,
    })
    .expect(201)

  const organizationId = createOrgRes.body.organization._id

  const editRes = await request(app)
    .patch(`/admin/organizations/${organizationId}`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      name: uniqueId('Org Editada'),
      document: buildValidCpf(),
      contactEmail: `${uniqueId('edit_org_new')}@example.com`,
    })
    .expect(200)

  expect(editRes.body.organization).toHaveProperty('name')

  await request(app)
    .post(`/admin/organizations/${organizationId}/invites`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      email: `${uniqueId('invite_filter')}@example.com`,
      role: 'Pais',
    })
    .expect(200)

  const pendingFilter = await request(app)
    .get(
      `/admin/organizations/${organizationId}/invites?status=pending&role=Pais`
    )
    .set('Authorization', `Bearer ${adminToken}`)
    .expect(200)

  expect(Array.isArray(pendingFilter.body)).toBe(true)
  expect(pendingFilter.body[0]).toHaveProperty('role', 'Pais')
})

test('admin global pode buscar instituicoes e convites com paginacao', async () => {
  const adminLogin = await request(app)
    .post('/auth/login')
    .send({ email: 'admin@test.com', password: 'Admin@123' })
    .expect(200)

  const adminToken = adminLogin.body.token

  const orgName = uniqueId('Busca Admin')
  const contactEmail = `${uniqueId('busca_admin')}@example.com`

  const createOrgRes = await request(app)
    .post('/admin/organizations')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      name: orgName,
      document: buildValidCpf(),
      contactEmail,
    })
    .expect(201)

  const organizationId = createOrgRes.body.organization._id

  await request(app)
    .post(`/admin/organizations/${organizationId}/invites`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      email: `${uniqueId('pagina_prof')}@example.com`,
      role: 'Pais',
    })
    .expect(200)

  const orgSearchRes = await request(app)
    .get(
      `/admin/organizations?search=${encodeURIComponent(orgName)}&page=1&pageSize=5`
    )
    .set('Authorization', `Bearer ${adminToken}`)
    .expect(200)

  expect(orgSearchRes.body).toHaveProperty('items')
  expect(orgSearchRes.body).toHaveProperty('pagination')
  expect(orgSearchRes.body.items[0]).toHaveProperty('name', orgName)

  const inviteSearchRes = await request(app)
    .get(
      `/admin/organizations/${organizationId}/invites?status=pending&role=Pais&search=pagina_prof&page=1&pageSize=5`
    )
    .set('Authorization', `Bearer ${adminToken}`)
    .expect(200)

  expect(inviteSearchRes.body).toHaveProperty('items')
  expect(inviteSearchRes.body).toHaveProperty('pagination')
  expect(inviteSearchRes.body.items[0]).toHaveProperty('role', 'Pais')
})

test('admin global pode ordenar instituicoes e ver resumo da instituicao', async () => {
  const adminLogin = await request(app)
    .post('/auth/login')
    .send({ email: 'admin@test.com', password: 'Admin@123' })
    .expect(200)

  const adminToken = adminLogin.body.token

  const createOrgRes = await request(app)
    .post('/admin/organizations')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      name: uniqueId('Resumo Escola'),
      document: buildValidCpf(),
      contactEmail: `${uniqueId('resumo_org')}@example.com`,
    })
    .expect(201)

  const organizationId = createOrgRes.body.organization._id

  const coordinatorInviteRes = await request(app)
    .post(`/admin/organizations/${organizationId}/invites`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      email: `${uniqueId('resumo_coord')}@example.com`,
      role: 'Pais',
    })
    .expect(200)

  const coordinatorInvite = await InstitutionInvite.findOne({
    organization: organizationId,
    role: 'Pais',
  })
  expect(coordinatorInvite).toBeTruthy()

  const coordinatorToken = coordinatorInviteRes.body.inviteToken
  const coordinatorEmail = coordinatorInvite.email

  await request(app)
    .post('/auth/register')
    .send({
      inviteToken: coordinatorToken,
      name: uniqueId('coord_resumo'),
      email: coordinatorEmail,
      password: 'P@ssw0rd1',
      confirmPassword: 'P@ssw0rd1',
      cpf: buildValidCpf(),
      vinculo: 'Responsavel',
    })
    .expect(201)

  const createdUser = await User.findOne({ email: coordinatorEmail })
  expect(createdUser).toBeTruthy()

  const round = await Round.create({
    jogou: 5,
    acerto: 4,
    errou: 1,
    user: createdUser._id,
  })
  createdUser.rounds.push(round._id)
  createdUser.totalJogos = 5
  createdUser.totalAcertos = 4
  createdUser.totalErros = 1
  await createdUser.save()

  const orderedOrgs = await request(app)
    .get('/admin/organizations?page=1&pageSize=5&sortBy=name&sortOrder=asc')
    .set('Authorization', `Bearer ${adminToken}`)
    .expect(200)

  expect(orderedOrgs.body).toHaveProperty('items')
  expect(orderedOrgs.body).toHaveProperty('pagination')

  const summaryRes = await request(app)
    .get(`/admin/organizations/${organizationId}/summary`)
    .set('Authorization', `Bearer ${adminToken}`)
    .expect(200)

  expect(summaryRes.body).toHaveProperty('metrics')
  expect(summaryRes.body.metrics).toHaveProperty('totalUsers', 1)
  expect(summaryRes.body.metrics).toHaveProperty('totalRounds', 1)
  expect(summaryRes.body.metrics).toHaveProperty('totalJogos', 5)
  expect(summaryRes.body.recentRounds[0]).toHaveProperty('jogou', 5)
})

test('admin global pode filtrar instituicoes por status e usuarios por tipo', async () => {
  const adminLogin = await request(app)
    .post('/auth/login')
    .send({ email: 'admin@test.com', password: 'Admin@123' })
    .expect(200)

  const adminToken = adminLogin.body.token

  const createOrgRes = await request(app)
    .post('/admin/organizations')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      name: uniqueId('Filtro Status'),
      document: buildValidCpf(),
      contactEmail: `${uniqueId('filtro_status')}@example.com`,
    })
    .expect(201)

  const organizationId = createOrgRes.body.organization._id

  await request(app)
    .patch(`/admin/organizations/${organizationId}/status`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ status: 'disabled' })
    .expect(200)

  const disabledOrgs = await request(app)
    .get('/admin/organizations?page=1&pageSize=5&status=disabled')
    .set('Authorization', `Bearer ${adminToken}`)
    .expect(200)

  expect(disabledOrgs.body).toHaveProperty('items')
  expect(
    disabledOrgs.body.items.some(
      (item) => String(item._id) === String(organizationId)
    )
  ).toBe(true)

  const inviteEmail = `${uniqueId('filtro_prof')}@example.com`
  const professorInviteRes = await request(app)
    .post(`/admin/organizations/${organizationId}/invites`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      email: inviteEmail,
      role: 'Pais',
    })
    .expect(404)

  expect(professorInviteRes.body).toHaveProperty(
    'Msg',
    'Casa nao encontrada ou inativa'
  )

  await request(app)
    .patch(`/admin/organizations/${organizationId}/status`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ status: 'active' })
    .expect(200)

  const inviteRes = await request(app)
    .post(`/admin/organizations/${organizationId}/invites`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      email: inviteEmail,
      role: 'Pais',
    })
    .expect(200)

  await request(app)
    .post('/auth/register')
    .send({
      inviteToken: inviteRes.body.inviteToken,
      name: uniqueId('prof_filtro'),
      email: inviteEmail,
      password: 'P@ssw0rd1',
      confirmPassword: 'P@ssw0rd1',
      cpf: buildValidCpf(),
      vinculo: 'Responsavel',
    })
    .expect(201)

  const usersByType = await request(app)
    .get(`/admin/organizations/${organizationId}/users?tipo=Pais`)
    .set('Authorization', `Bearer ${adminToken}`)
    .expect(200)

  expect(Array.isArray(usersByType.body)).toBe(true)
  expect(usersByType.body[0]).toHaveProperty('tipo', 'Pais')
})

test('forgot_password should still return token when mailer fails', async () => {
  const email = `${uniqueId('test_forgot_fallback')}@example.com`
  const password = 'P@ssw0rd1'

  const registerRes = await registerWithInvite({
    email,
    password,
    role: 'Dependentes',
  })
  expect(registerRes.status).toBe(201)

  mailer.sendMail.mockClear()
  mailer.sendMail.mockRejectedValueOnce(new Error('mailer down'))

  const res = await request(app)
    .post('/auth/login/forgot_password')
    .send({ email })
    .expect(200)

  expect(res.body).toHaveProperty('token')
  expect(res.body).toHaveProperty(
    'message',
    'Token gerado com sucesso. Não foi possível enviar o e-mail, prossiga com o token.'
  )
})
