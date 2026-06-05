const router = require('express').Router()
const User = require('../models/User')
const auth = require('../middlewares/authenticator')
const { canManagePermissions } = require('../utils/access')

function normalizeAcessos(acessos = {}) {
  const normalized = {
    soma: false,
    menos: false,
    vezes: false,
    dividir: false,
    todas: false,
    ...acessos,
  }

  if (normalized.todas) {
    normalized.soma = true
    normalized.menos = true
    normalized.vezes = true
    normalized.dividir = true
  } else {
    normalized.todas = Boolean(
      normalized.soma &&
      normalized.menos &&
      normalized.vezes &&
      normalized.dividir
    )
  }

  return normalized
}

router.post('/', auth, async (req, res) => {
  const { alunoId, acessos } = req.body

  try {
    const aluno = await User.findById(alunoId)
    if (!aluno)
      return res.status(404).json({ message: 'Usuário não encontrado' })

    if (!canManagePermissions(req.user, aluno)) {
      return res
        .status(403)
        .json({ message: 'Sem permissão para alterar este usuário' })
    }

    aluno.permissoes = normalizeAcessos(acessos)
    await aluno.save()
    return res.status(200).json({ message: 'acessos concedidas com sucesso' })
  } catch (error) {
    return res
      .status(500)
      .json({ message: 'Erro ao conceder acessos', error: error.message })
  }
})

module.exports = router
