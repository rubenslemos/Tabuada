const jwt = require('jsonwebtoken')
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
  jwt.verify(token, hash, (err, decoded)=>{
    if(err)
      return res.status(401).send({error: 'Token inválido'})
    req.userId = decoded.id
    return next()
  })
}