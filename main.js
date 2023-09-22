require('dotenv').config()
const mongoose = require('mongoose')
const user = process.env.DB_USER
const pass = process.env.DB_PASS
mongoose.connect(
  `mongodb+srv://${user}:${pass}@login.urmtwxs.mongodb.net/`
  ).then(()=>{
    app.listen(3000)
    console.log('Conectado')
  }).catch((err)=> console.log(err))

const express = require('express')
const app = express()
app.use(express.json())

app.get('/', (req, res) =>{
  res.status(200).json({msg:'Tabuada ganhando novo corpo'})
})

const userRoutes = require('./routes/createUser')
app.use('/auth/register', userRoutes)

const login = require('./routes/login')
app.use('/auth/login', login)

const auth = require('./routes/authenticator')
app.use('/user', auth)


