const request = require('supertest')
const mongoose = require('mongoose')
const { createTestApp } = require('./test-setup')
const Organization = require('../models/Organization')
const InstitutionInvite = require('../models/InstitutionInvite')
const { hashInviteToken } = require('../utils/institutions')

jest.mock('../modules/mailer', () => ({
  sendMail: jest.fn().mockResolvedValue(true),
}))

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

async function registerWithInvite({ email, password, role = 'Aluno' }) {
  const inviteToken = await createInvite({ email, role })

  return request(app)
    .post('/auth/register')
    .send({
      inviteToken,
      name: uniqueId(`jest_${role.toLowerCase()}`),
      email,
      password,
      confirmPassword: password,
      turma: 'A1',
    })
}

beforeAll(async () => {
  process.env.SECRET = process.env.SECRET || 'testsecret'
  process.env.NODE_ENV = 'test'
  app = await createTestApp()

  const coordinatorEmail = `${uniqueId('coord_base')}@example.com`
  const requestInviteRes = await request(app)
    .post('/auth/register/request-organization')
    .send({
      organizationName: uniqueId('InstituicaoBase'),
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
      turma: 'A1',
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

test('full round flow: register -> login -> create round -> post contagem -> verify', async () => {
  const email = `${uniqueId('test')}@example.com`
  const password = 'P@ssw0rd1'

  const regRes = await registerWithInvite({
    email,
    password,
    role: 'Aluno',
  })
  expect(regRes.status).toBe(201)
  const userId = regRes.body.user._id || regRes.body.user.id

  const loginRes = await request(app)
    .post('/auth/login')
    .send({ email, password })
    .expect(200)

  const token = loginRes.body.token

  const roundRes = await request(app)
    .post('/round')
    .set('Authorization', `Bearer ${token}`)
    .send({
      acerto: 3,
      errou: 1,
      jogou: 4,
      userId,
      totalJogos: 4,
      totalAcertos: 3,
      totalErros: 1,
    })
    .expect(201)

  const roundId = roundRes.body.round._id

  const contagemRes = await request(app)
    .post('/round/resultado-operacoes')
    .set('Authorization', `Bearer ${token}`)
    .send({
      roundId,
      userId,
      contagemOperacoes: { faPlus: 2, faMinus: 1, faTimes: 0, faDivide: 0 },
    })
    .expect(200)

  expect(contagemRes.body).toHaveProperty('contagemOperacoes')

  const userRes = await request(app)
    .get(`/auth/login/${userId}`)
    .set('Authorization', `Bearer ${token}`)
    .expect(200)
  expect(userRes.body.user.totalJogos).toBeGreaterThanOrEqual(4)
})
