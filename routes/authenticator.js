const router = require('express').Router()
const User = require('../models/User')
const jwt = require('jsonwebtoken')

router.get('/:id', checkToken, async (req, res) => {
  const id = req.params.id
  const user = await User.findById(id, '-password')
  if(!user){
    return res.status(404).json({Msg: 'Usuário não cadastrado'})
  }
  return res.status(200).json({Nome: user.name, Email: user.email})
})
function checkToken (req, res, next) {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]
  if (!token) {
    return res.status(401).json({msg: 'acesso negado'})
  }
  try {

    const secret = process.env.SECRET
    jwt.verify (token, secret)

    next()

  } catch (error) {
    console.log(error)
    res.status(400).json({msg: 'Token Inválido'})
  }
}
module.exports = router