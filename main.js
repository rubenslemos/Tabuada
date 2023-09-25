const mongoose = require('mongoose')
const express = require('express')
const app = express()
const path = require("path")

require('dotenv').config()
const user = process.env.DB_USER
const pass = process.env.DB_PASS
const port = process.env.PORT
const host = process.env.HOST


app.use(express.static(__dirname + "/assets"))
app.get('/', (req, res) =>{
  res.sendFile(path.join(__dirname + "/assets/index.html"))
})

mongoose.connect(
  `mongodb+srv://${user}:${pass}@login.urmtwxs.mongodb.net/`
  ).then(()=>{
    app.listen(port, host)
    console.log('Conectado')
  }).catch((err)=> console.log(err))

const userRoutes = require('./routes/createUser')
app.use('/auth/register', userRoutes)

const login = require('./routes/login')
app.use('/auth/login', login)

const auth = require('./routes/authenticator')
app.use('/user', auth)
const round = require('./routes/round')
app.use('/round', round)