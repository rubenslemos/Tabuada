const mongoose = require('mongoose')
const express = require('express')
const app = express()
const path = require("path")
const bodyParser = require('body-parser')
require('dotenv').config()
const user = process.env.DB_USER
const pass = process.env.DB_PASS
const port = process.env.PORT

app.use(express.static(__dirname + "/assets"))
app.use(bodyParser.json())
app.get('/', (req, res) =>{
  res.sendFile(path.join(__dirname + "/assets/index.html"))
})

mongoose.connect(
  `mongodb+srv://${user}:${pass}@tabuada.hz6j8rr.mongodb.net/`
  ).then(()=>{
    app.listen(port)
    console.log('Conectado')
  }).catch((err)=> console.log(err))

const userRoutes = require('./routes/createUser')
app.use('/auth/register', userRoutes)

const login = require('./routes/login')
app.use('/auth/login', login)

const round = require('./routes/round')
app.use('/round', round)

const acessos = require('./routes/permissoes')
app.use('/acessos', acessos)

// Teste GITHUBa