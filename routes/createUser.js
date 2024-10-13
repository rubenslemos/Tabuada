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
  if(!tipo){
    return res.status(422).json({Msg: 'Tipo requerido'})
  }
  if(!name){
    return res.status(422).json({Msg: 'Nome requerido'})
  }else if(!email){
    return res.status(422).json({Msg: 'E-mail requerido'})
  }else if(!password){
    return res.status(422).json({Msg: 'Senha requerida'})
  }else if(!confirmPassword){
    return res.status(422).json({Msg: 'Confirmação de senha requerida'})
  }else if(password !== confirmPassword){
    return res.status(422).json({Msg: 'Confirmação de senha e Senha diferentes'})
  }else if (!turma) {
    return res.status(422).json({ Msg: 'Turma requerida' });
  }else{
    const emailExists = await User.findOne({email: email.toLowerCase().trim()})
    if(emailExists){
      return res.status(422).json({Msg: 'E-mail já existe'})
    }
    const userExists = await User.findOne({name: name.toLowerCase().trim()})
    if(userExists){
      return res.status(422).json({Msg: 'Usuário já existe'})
    }
    const regex = /^(?=.*[@!#$%^&*()/\\])(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])[@!#$%^&*()/\\a-zA-Z0-9]{8,20}$/
    if (!regex.test(password)){
      return res.status(422).json({Msg: 'Senha não segue as condições estabelecidas'})
    }

    try {
      let permissoes = {};
      if (tipo === 'Professor') {
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
      res.status(201).json({Msg: 'Cadastrado com sucesso'})
      res.status(201).send({
        user,
        token: generateToken({id:user.id}), 
      })
    } catch (error) {
        res.status(500).json({msg: 'Erro no servidor, tente em alguns minutos'})
    }
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
    } else {
      // Se não for professor, pode decidir o que retornar
      // Por exemplo, retornar todos os alunos
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