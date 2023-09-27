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

router.get('/', async (req, res) => {
  try {
    
    const round = await Round.find()
    if(!round){
      res.status(422).json({error: 'Ainda não há rodadas salvas.'})
      return
    }
    res.status(200).json(round)

  } catch (error) {
    res.status(500).json({error: error})
  }
})

router.delete('/:id', async (req, res) => {
  const id = req.params.id
 
  const round = await Round.findOne({_id: id})
  if(!round) {
    res.status(422).json({message: 'Rodada não encontrada!'})
    return
  }

  try {
    await Round.deleteOne({_id: id})
    res.status(200).json({message: 'Rodada apagada!'})
  } catch (error) {
    res.status(500).json({error: error})
  }
})
module.exports = router