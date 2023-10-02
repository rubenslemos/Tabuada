const router = require('express').Router()
const bcrypt = require('bcrypt')
const User = require('../models/User')
const jwt = require('jsonwebtoken')
require('dotenv').config()
const hash = process.env.SECRET

function generateToken(params = { }){
  return jwt.sign(params, hash, {
    expiresIn:86400,
  })
}
router.post('/', async (req,res)=>{
  const {email, password} = req.body
  if(!email){
    return res.status(422).json({Msg: 'E-mail requerido'})
  }
  if(!password){
    return res.status(422).json({Msg: 'Senha requerida'})
  }
  const user = await User.findOne({email: email.toLowerCase().trim()})
  if(!user){
    return res.status(404).json({Msg: 'Usuário não cadastrado'})
  }

  const checkPassword = await bcrypt.compare(password, user.password)
  console.log(checkPassword)
  if(!checkPassword){
    return res.status(422).json({Msg: 'Senha Inválida'})
  }

  res.send({
    user,
    token: generateToken({id:user.id}), 
  })
})

module.exports = router