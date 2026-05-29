const request = require('supertest')
const mongoose = require('mongoose')

jest.mock('../modules/mailer', () => ({
  sendMail: jest.fn().mockResolvedValue(true),
}))

const mailer = require('../modules/mailer')
const { createTestApp } = require('./test-setup')

let app

beforeAll(async () => {
  process.env.SECRET = process.env.SECRET || 'testsecret'
  app = await createTestApp()
})

afterAll(async () => {
  if (app && app._mongod) await app._mongod.stop()
  await mongoose.disconnect()
})

test('login should fail with wrong password', async () => {
  const email = `test_wrong_${Date.now()}@example.com`
  const password = 'P@ssw0rd1'

  await request(app)
    .post('/auth/register')
    .send({
      tipo: 'Aluno',
      name: `jest_wrong_${Date.now()}`,
      email,
      password,
      confirmPassword: password,
      turma: 'A1',
    })
    .expect(201)

  const res = await request(app)
    .post('/auth/login')
    .send({ email, password: 'SenhaErrada123!' })
    .expect(422)

  expect(res.body).toHaveProperty('Msg', 'Senha Inválida')
})

test('register should fail when password confirmation does not match', async () => {
  const res = await request(app)
    .post('/auth/register')
    .send({
      tipo: 'Aluno',
      name: `jest_mismatch_${Date.now()}`,
      email: `test_mismatch_${Date.now()}@example.com`,
      password: 'P@ssw0rd1',
      confirmPassword: 'P@ssw0rd2',
      turma: 'A1',
    })
    .expect(422)

  expect(res.body).toHaveProperty('Msg', 'Senha e confirmação não coincidem')
})

test('forgot_password should send recovery token and call mailer', async () => {
  const email = `test_forgot_${Date.now()}@example.com`
  const password = 'P@ssw0rd1'

  await request(app)
    .post('/auth/register')
    .send({
      tipo: 'Aluno',
      name: `jest_forgot_${Date.now()}`,
      email,
      password,
      confirmPassword: password,
      turma: 'A1',
    })
    .expect(201)

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

test('forgot_password should still return token when mailer fails', async () => {
  const email = `test_forgot_fallback_${Date.now()}@example.com`
  const password = 'P@ssw0rd1'

  await request(app)
    .post('/auth/register')
    .send({
      tipo: 'Aluno',
      name: `jest_forgot_fallback_${Date.now()}`,
      email,
      password,
      confirmPassword: password,
      turma: 'A1',
    })
    .expect(201)

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
