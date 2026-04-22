const router = require('express').Router()
const User = require('../models/User')
const jwt = require('jsonwebtoken')
const auth = require('../middlewares/authenticator');
require('dotenv').config()
const hash = process.env.SECRET

function generateToken(params = { }){
  return jwt.sign(params, hash, {
    expiresIn:86400,
  })
}
router.post('/', async (req,res)=>{
  const {tipo, name, email, password, confirmPassword, turma} = req.body
  if (!tipo || !name || !email || !password || !confirmPassword || !turma) {
    return res.status(422).json({ Msg: 'Todos os campos são obrigatórios' });
  }

  if (password !== confirmPassword) {
    return res.status(422).json({ Msg: 'Senha e confirmação não coincidem' });
  }

  // Validação de senha (regex ajustado)
  const regex = /^(?=.*[A-Z])(?=.*[!@#$%^&*])(?=.*[0-9]).{8,20}$/;
  if (!regex.test(password)) {
    return res.status(422).json({ 
      Msg: 'Senha deve ter 8-20 caracteres, incluindo maiúsculas, números e símbolos (!@#$%^&*)' 
    });
  }


  try {
  const emailExists = await User.findOne({email: email.toLowerCase().trim()})
    if(emailExists){
      return res.status(422).json({Msg: 'E-mail já existe'})
    }
  const userExists = await User.findOne({name: name.toLowerCase().trim()})
    if(userExists){
      return res.status(422).json({Msg: 'Usuário já existe'})
    }
      let permissoes = {};
      if (tipo === 'Professor') {
          permissoes = {
              soma: true,
              menos: true,
              vezes: true,
              dividir: true,
              todas: true,
          };
      } else if (tipo === 'Coordenador') {
          permissoes = {
              soma: true,
              menos: true,
              vezes: true,
              dividir: true,
              todas: true,
          };
      } else if (tipo === 'Aluno') {
        permissoes = {
            soma: true,
            menos: false,
            vezes: false,
            dividir: false,
            todas: false,
        };
    }
      const user = await User.create({
        tipo,
        name: name.toLowerCase().trim(),
        email: email.toLowerCase().trim(),
        password,
        permissoes,
        turma: turma.toUpperCase().trim()      
      })
      await user.save()
es.status(201).json({
    Msg: 'Cadastrado com sucesso',
    user,
    token: generateToken({id: user.id}),
  });
    } catch (error) {
      console.error('Erro ao criar usuário:', error);
      res.status(500).json({msg: 'Erro no servidor, tente em alguns minutos'})
    }
  })
router.get('/', auth, async (req, res) => {
  try {
    const loggedInUser = req.user; // Obtém o usuário logado

    if (loggedInUser.tipo === 'Professor') {
      // Se o usuário é um professor, buscar apenas os alunos da mesma turma
      const alunosDaMesmaTurma = await User.find({
        tipo: 'Aluno',
        turma: loggedInUser.turma
      }).populate('rounds');

      if (!alunosDaMesmaTurma.length) {
        return res.status(422).json({ error: 'Não há alunos cadastrados nessa turma.' });
      }

      return res.status(200).json(alunosDaMesmaTurma);
    } else if (loggedInUser.tipo === 'Coordenador') {
      const allAlunos = await User.find({ tipo: { $ne: 'Coordenador' } }).populate('rounds');

      if (!allAlunos.length) {
        return res.status(422).json({ error: 'Não há alunos cadastrados.' });
      }

      return res.status(200).json(allAlunos);
    } else {
      const allAlunos = await User.find({ tipo: 'Aluno' }).populate('rounds');

      if (!allAlunos.length) {
        return res.status(422).json({ error: 'Não há alunos cadastrados.' });
      }

      return res.status(200).json(allAlunos);
    }
  } catch (error) {
    console.error('Erro ao listar alunos:', error);
    res.status(500).json({ error: 'Erro ao listar alunos' });
  }
})
module.exports = router