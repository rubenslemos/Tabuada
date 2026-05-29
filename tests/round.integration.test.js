const request = require('supertest')
const mongoose = require('mongoose')
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

test('full round flow: register -> login -> create round -> post contagem -> verify', async () => {
  const email = `test_${Date.now()}@example.com`
  const password = 'P@ssw0rd1'

  const regRes = await request(app)
    .post('/auth/register')
    .send({
      tipo: 'Aluno',
      name: `jest_user_${Date.now()}`,
      email,
      password,
      confirmPassword: password,
      turma: 'A1',
    })
    .expect(201)

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

  const userRes = await request(app).get(`/auth/login/${userId}`).expect(200)
  expect(userRes.body.user.totalJogos).toBeGreaterThanOrEqual(4)
})
