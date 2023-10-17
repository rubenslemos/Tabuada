const router = require('express').Router()
const User = require('../models/User')
const auth = require('../middlewares/authenticator')

router.post('/', auth, async (req, res) => {
  
  const { alunoId, acessos } = req.body;

  try {
    const aluno = await User.findById(alunoId);
    if (!aluno) return res.status(404).json({ message: 'Usuário não encontrado' });
    aluno.permissoes = acessos;
    await aluno.save();
    return res.status(200).json({ message: 'acessos concedidas com sucesso' });
  } catch (error) {
      return res.status(500).json({ message: 'Erro ao conceder acessos', error: error.message });
  }
});

module.exports = router