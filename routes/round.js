const router = require('express').Router()
const Round = require('../models/Round')

router.post('/', async (req, res) => {
try {
  const {jogou, acerto, errou } = req.body
  const round = new Round ({
    jogou,
    acerto,
    errou
  })
  await round.save()
  res.status(201).json({msg: 'Rodada criada com sucesso'})
} catch (error) {
    console.log(error)
    res.status(500).json({msg: 'Erro no servidor, tente em alguns minutos'})
  }
})
module.exports = router