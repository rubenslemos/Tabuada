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

test('acessos route should reject requests without token', async () => {
  const res = await request(app)
    .post('/acessos')
    .send({
      alunoId: new mongoose.Types.ObjectId().toString(),
      tipoUsuario: 'Pais',
      acessos: {
        soma: true,
        menos: true,
        vezes: true,
        dividir: true,
        todas: true,
      },
    })
    .expect(401)

  expect(res.body).toHaveProperty('error', 'Token não informado')
})
