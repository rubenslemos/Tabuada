const router = require('express').Router()
const Round = require('../models/Round')
const User = require('../models/User')
const Contagem = require('../models/Contagem')

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

router.post('/resultado-operacoes', async (req, res) => {
  const { roundId, userId, contagemOperacoes } = req.body;
  try {
      const user = await User.findById(userId);
      if (!user) {
          return res.status(404).json({ msg: 'Usuário não encontrado' });
      }
      let operacoes = await Contagem.findOne({ user: userId });
      if (!operacoes) {
        operacoes = new Contagem({
          contagemOperacoes: contagemOperacoes
        });
      }
      const round = await Round.findById(roundId);
      if (!round) {
          return res.status(404).json({ msg: 'Rodada não encontrada' });
      }
      operacoes.contagemOperacoes.faPlus += contagemOperacoes.faPlus;
      operacoes.contagemOperacoes.faMinus += contagemOperacoes.faMinus;
      operacoes.contagemOperacoes.faTimes += contagemOperacoes.faTimes;
      operacoes.contagemOperacoes.faDivide += contagemOperacoes.faDivide;
      operacoes.user = userId
      operacoes.rounds = round
      await operacoes.save();
      user.contagemOperacoes.push(operacoes);
      await user.save();

      round.contagemOperacoes = operacoes._id;
      await round.save();

      res.status(200).send({ operacoes });
  } catch (error) {
      console.error(error);
      res.status(500).json({ msg: 'Erro no servidor, tente novamente mais tarde' });
  }
});

router.get('/resultado-operacoes', async (req, res) =>{
  try {
    
    const contagem = await Contagem.find().populate('rounds user')
    if(!contagem || contagem.length === 0) return res.status(422).json({Msg: 'ainda não há contagens salvas'})
    res.status(201).json(contagem)

  } catch (error) {
    res.status(500).json({error: error})
  }
})

module.exports = router