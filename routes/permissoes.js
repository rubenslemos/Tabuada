const router = require('express').Router()
const User = require('../models/User')
const auth = require('../middlewares/authenticator')

router.post('/', auth, async (req, res) => {
  
  const { acessos } = req.body;
  
  if (req.user.tipo !== 'Aluno') {
    req.user.permissoes.soma = true
    req.user.permissoes.menos = true
    req.user.permissoes.vezes = true
    req.user.permissoes.dividir = true
    req.user.permissoes.todas = true
    return res.status(403).json({ message: 'Apenas usuários tipo Aluno podem receber permissões.' })
}
  const alunoId = req.user._id;

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