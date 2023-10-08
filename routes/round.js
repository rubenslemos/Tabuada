const router = require('express').Router()
const Round = require('../models/Round')
const User = require('../models/User')
router.post('/', async (req, res) => {
try {
  const {acerto, errou, jogou, userId} = req.body
  const user = await User.findById(userId)
  if (!user) {
    return res.status(404).json({ msg: 'Usuário não encontrado' });
  }
  const round = await Round.create({ acerto, errou, jogou, user: userId})
  await round.save()
  user.rounds.push(round)
  await user.save()
  res.status(201).send({round})
} catch (error) {
    console.log(error)
    res.status(500).json({msg: 'Erro no servidor, tente em alguns minutos'})
  }
})

router.get('/', async (req, res) => {
  try {
    
    const round = await Round.find().populate('user')
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
 
  const round = await Round.findOne({_id: id}).populate('user')
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