const jwt = require('jsonwebtoken')
const User = require('../models/User')
require('dotenv').config()

const hash = process.env.SECRET
module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization

  if(!authHeader)
    return res.status(401).send({error: 'Token não informado'})

  const parts = authHeader.split(' ')
   if(!parts.length === 2)
    return res.status(401).send({error: 'Token inválido'})

  const [scheme, token] = parts

  if(!/^Bearer$/i.test(scheme)){
    return res.status(401).send({error: 'Token desformatado'})
  }
  jwt.verify(token, hash, async(err, decoded)=>{
    if(err)
      return res.status(401).send({error: 'Token inválido'})
    req.userId = decoded.id
    try {
      const user = await User.findById(decoded.id); 
      if (!user) { 
        return res.status(404).send({ error: 'Usuário não encontrado' }); 
      }
      req.user = user; 
      return next();
    } catch (error) {
      return res.status(500).send({ error: 'Erro no servidor' });
    }
  })
}