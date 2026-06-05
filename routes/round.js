const router = require('express').Router()
const Round = require('../models/Round')
const User = require('../models/User')
const Contagem = require('../models/Contagem')
const auth = require('../middlewares/authenticator')
const {
  canUseUserAsRoundTarget,
  canViewRound,
  idsMatch,
} = require('../utils/access')

router.post('/', auth, async (req, res) => {
  try {
    const {
      acerto,
      errou,
      jogou,
      userId,
      totalJogos,
      totalAcertos,
      totalErros,
    } = req.body
    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({ msg: 'Usuário não encontrado' })
    }
    if (!canUseUserAsRoundTarget(req.user, user)) {
      return res
        .status(403)
        .json({ msg: 'Sem permissão para registrar rodada para este usuário' })
    }
    if (isNaN(user.totalJogos)) user.totalJogos = 0
    if (isNaN(user.totalAcertos)) user.totalAcertos = 0
    if (isNaN(user.totalErros)) user.totalErros = 0
    user.totalJogos = totalJogos
    user.totalAcertos = totalAcertos
    user.totalErros = totalErros
    const round = await Round.create({ acerto, errou, jogou, user: userId })
    await round.save()
    user.rounds.push(round)
    await user.save()
    res.status(201).send({ round })
  } catch (error) {
    console.error(error)
    res.status(500).json({ msg: 'Erro no servidor, tente em alguns minutos' })
  }
})

router.get('/', auth, async (req, res) => {
  try {
    const query = req.user.isGlobalAdmin ? {} : { user: req.user._id }
    const round = await Round.find(query).populate('user')
    if (!round) {
      res.status(422).json({ error: 'Ainda não há rodadas salvas.' })
      return
    }
    res.status(200).json(round)
  } catch (error) {
    res.status(500).json({ error: error })
  }
})

router.delete('/:id', auth, async (req, res) => {
  const id = req.params.id

  const round = await Round.findOne({ _id: id }).populate('user')
  if (!round) {
    res.status(422).json({ message: 'Rodada não encontrada!' })
    return
  }

  if (!canViewRound(req.user, round.user)) {
    return res
      .status(403)
      .json({ message: 'Sem permissão para remover esta rodada' })
  }

  try {
    await Round.deleteOne({ _id: id })
    res.status(200).json({ message: 'Rodada apagada!' })
  } catch (error) {
    res.status(500).json({ error: error })
  }
})

router.post('/resultado-operacoes', auth, async (req, res) => {
  const { roundId, userId, contagemOperacoes } = req.body

  try {
    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({ msg: 'Usuário não encontrado' })
    }

    if (!canUseUserAsRoundTarget(req.user, user)) {
      return res.status(403).json({
        msg: 'Sem permissão para registrar contagem para este usuário',
      })
    }

    // Criar um novo objeto Contagem com as operações
    const operacoes = new Contagem({
      contagemOperacoes: {
        faPlus: contagemOperacoes.faPlus,
        faMinus: contagemOperacoes.faMinus,
        faTimes: contagemOperacoes.faTimes,
        faDivide: contagemOperacoes.faDivide,
      },
      user: userId,
      rounds: roundId,
    })

    // Salvar a nova contagem de operações no banco de dados
    await operacoes.save()

    // Associar a nova contagem de operações com o usuário
    user.contagemOperacoes.push(operacoes._id)
    await user.save()

    // Associar a nova contagem de operações com a rodada
    const round = await Round.findById(roundId)
    if (!round) {
      return res.status(404).json({ msg: 'Rodada não encontrada' })
    }
    if (!idsMatch(round.user, userId)) {
      return res
        .status(422)
        .json({ msg: 'Rodada não pertence ao usuário informado' })
    }
    round.contagemOperacoes = operacoes._id
    await round.save()

    res.status(200).send({ contagemOperacoes: operacoes })
  } catch (error) {
    console.error(error)
    res
      .status(500)
      .json({ msg: 'Erro no servidor, tente novamente mais tarde' })
  }
})

router.get('/resultado-operacoes', auth, async (req, res) => {
  try {
    const contagem = await Contagem.find(
      req.user.isGlobalAdmin ? {} : { user: req.user._id }
    ).populate('rounds user')
    if (!contagem || contagem.length === 0)
      return res.status(422).json({ Msg: 'ainda não há contagens salvas' })
    res.status(201).json(contagem)
  } catch (error) {
    res.status(500).json({ error: error })
  }
})

router.get('/:id', auth, async (req, res) => {
  try {
    const round = await Round.findById(req.params.id)
      .populate('contagemOperacoes')
      .populate('user')

    if (!round) return res.status(400).send({ error: 'Round não encontrado' })
    if (!canViewRound(req.user, round.user)) {
      return res.status(403).send({ error: 'Acesso negado a esta rodada' })
    }

    res.status(200).send({ round })
  } catch {
    return res.status(500).send({ error: 'Erro ao recuperar round' })
  }
})

module.exports = router
