const router = require('express').Router()
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
  const {tipo, name, email, password, confirmPassword} = req.body
  if(!tipo){
    return res.status(422).json({Msg: 'Tipo requerido'})
  }
  if(!name){
    return res.status(422).json({Msg: 'Nome requerido'})
  }else if(!email){
    return res.status(422).json({Msg: 'E-mail requerido'})
  }else if(!password){
    return res.status(422).json({Msg: 'Senha requerida'})
  }else if(!confirmPassword){
    return res.status(422).json({Msg: 'Confirmação de senha requerida'})
  }else if(password !== confirmPassword){
    return res.status(422).json({Msg: 'Confirmação de senha e Senha diferentes'})
  }else{
    const emailExists = await User.findOne({email: email.toLowerCase().trim()})
    if(emailExists){
      return res.status(422).json({Msg: 'E-mail já existe'})
    }
    const userExists = await User.findOne({name: name.toLowerCase().trim()})
    if(userExists){
      return res.status(422).json({Msg: 'Usuário já existe'})
    }
    const regex = /^(?=.*[@!#$%^&*()/\\])(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])[@!#$%^&*()/\\a-zA-Z0-9]{8,20}$/
    if (!regex.test(password)){
      return res.status(422).json({Msg: 'Senha não segue as condições estabelecidas'})
    }

    try {
      const user = await User.create({
        tipo,
        name: name.toLowerCase().trim(),
        email: email.toLowerCase().trim(),
        password      
      })
      await user.save()
      res.status(201).send({
        user,
        token: generateToken({id:user.id}), 
      })
    } catch (error) {
      console.log(error)
      res.status(500).json({msg: 'Erro no servidor, tente em alguns minutos'})
    }
  }
})

module.exports = router