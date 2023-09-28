const router = require('express').Router()
const bcrypt = require('bcrypt')
const User = require('../models/User')
const jwt = require('jsonwebtoken')

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
  try {
    const secret = process.env.SECRET
    const token = jwt.sign(
      {
        id: user._id
      },
      secret
    )
    return res.status(201).json({Msg: 'logado com sucesso', token})
  } catch (error) {
    console.log(error)
    res.status(500).json({msg: 'Erro no servidor, tente em alguns minutos'})
  }
})

module.exports = router