const mongoose = require('mongoose')
const express = require('express')
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')

const MONGO_BINARY_VERSION = process.env.MONGO_BINARY_VERSION || '6.0.6'

async function createTestApp() {
  let mongod
  const mongoUrl = process.env.MONGO_URL

  if (mongoUrl) {
    await mongoose.connect(mongoUrl)
  } else {
    const { MongoMemoryServer } = require('mongodb-memory-server')
    mongod = await MongoMemoryServer.create({
      binary: { version: MONGO_BINARY_VERSION },
    })
    await mongoose.connect(mongod.getUri())
  }

  const app = express()
  app.use(bodyParser.json())
  app.use(cookieParser())

  const createUser = require('../routes/createUser')
  const login = require('../routes/login')
  const round = require('../routes/round')
  const acessos = require('../routes/permissoes')

  app.use('/auth/register', createUser)
  app.use('/auth/login', login)
  app.use('/round', round)
  app.use('/acessos', acessos)

  app._mongod = mongod
  return app
}

module.exports = { createTestApp }
