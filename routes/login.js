const router = require('express').Router()
const bcrypt = require('bcrypt')
const User = require('../models/User')
const jwt = require('jsonwebtoken')
const auth = require('../middlewares/authenticator')
const crypto = require('crypto')
const mailer = require('../modules/mailer')
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
  const user = await User.findOne({email: email.toLowerCase().trim()}).select('+password')
  if(!user){
    return res.status(404).json({Msg: 'Usuário não cadastrado'})
  }
  
  if(!await bcrypt.compare(password, user.password)  ){
    return res.status(422).json({Msg: 'Senha Inválida'})
  }

  res.send({
    user,
    token: generateToken({id:user.id}), 
  })
})
router.post ('/token', auth, (req, res) => {
  if (auth) {
    res.status(200).json({ message: 'Operação bem-sucedida' });
  } else {
    res.status(500).json({ error: 'Erro na operação' });
  }
})
router.post('/forgot_password', async (req, res)=>{
  const {email} = req.body
  try {
    
    const usuario = await User.findOne({email})
    if(!usuario) 
      return res.status(400).send({error:'Usuário não existe'})

    const token = crypto.randomBytes(20).toString('hex')

    const now = new Date()
    now.setHours(now.getHours()+1)

    await User.findByIdAndUpdate(usuario.id, {
      '$set':{
        passwordResetToken: token,
        passwordResetExpires: now,
      }
    })
    await mailer.sendMail({
      to: email,
      from:'rubenslemos@gmail.com',
      template:'auth/forgot_password',
      context: { token },
    }, (err)=> {
      if (err)
        return res.status(400).send({error: 'Não foi possível enviar o email de recuperação, tente novamente'})
      return res.status(200).json({ token })
    })
  } catch (error) {
    return res.status(400).send({error: 'Não foi possível recuperar sua senha, tente novamente'})
  }
})

router.post('/reset_password', async (req, res) => {
  const { email, token, password, confirmPass } = req.body

  try {
    const usuario = await User.findOne({email}).select('+ passwordResetToken passwordResetExpires password')
    if(!usuario) 
      return res.status(400).send({Msg:'Usuário não existe'})

    if(token !== usuario.passwordResetToken)
      return res.status(400).send({Msg:'Token Inválido'})
    if(!confirmPass)
      return res.status(422).json({Msg: 'Confirmação de senha requerida'})
    
    if(password !== confirmPass)
      return res.status(422).json({Msg: 'Confirmação de senha e Senha diferentes'})

    const now = new Date()
    if(now >= usuario.passwordResetExpires)
      return res.status(400).send({Msg:'Token Expirou, favor gerar um novo'})

    const regex = /^(?=.*[@!#$%^&*()/\\])(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])[@!#$%^&*()/\\a-zA-Z0-9]{8,20}$/
    if (!regex.test(password)){
      return res.status(422).json({Msg: 'Senha não segue as condições estabelecidas'})
    }
    let compararSenha = await bcrypt.compare(password, usuario.password)
    if(compararSenha){
      return res.status(422).json({Msg: 'Senha já usada anteriormente'})
    }
    usuario.password = password

    await usuario.save()
    res.send({Msg: 'Senha alterada'})
    
  } catch (error) {
    
    return res.status(400).send({Msg: 'Não foi possível recuperar sua senha, tente novamente'})
  }
})
router.get('/:id', async (req,res)=>{
  try{
    const user = await User.findById(req.params.id).populate('rounds')
    if(!user) return res.status(400).send({error: 'Usuario não encontrado'})
    res.status(201).send({user})
  } catch (error) {
    return res.status(400).send({error: 'Erro ao listar usuario'})
  }
})
module.exports = router