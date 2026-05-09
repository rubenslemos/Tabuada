const crypto = require('crypto')
const mongoose = require('mongoose')
// Ajuste o caminho conforme onde seu arquivo User.js está salvo
const User = require('../models/User') 
// A string de conexão do seu MongoDB Atlas
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://Tabuada:12345@cluster0.5en0ryl.mongodb.net/Tabuada?retryWrites=true&w=majority&appName=Cluster0'
module.exports = async function handler(req, res) {
  // 1. Configurar CORS
  res.setHeader('Access-Control-Allow-Credentials', true)
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version')
  // 2. Tratamento de requisições OPTIONS (Preflight)
  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }
  // 3. Apenas POST é permitido
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' })
  }
  const { email } = req.body
  if (!email) {
    return res.status(400).json({ error: 'Email é obrigatório' })
  }
  try {
    // 4. Conectar ao MongoDB (se necessário)
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(MONGODB_URI)
    }
    // 5. Buscar usuário
    const usuario = await User.findOne({ email })
    
    if (!usuario) {
      return res.status(400).json({ error: 'Usuário não existe' })
    }
    // 6. Gerar token
    const token = crypto.randomBytes(20).toString('hex')
    const now = new Date()
    now.setHours(now.getHours() + 1)
    // 7. Salvar token no banco
    await User.findByIdAndUpdate(usuario.id, {
      '$set': {
        passwordResetToken: token,
        passwordResetExpires: now,
      }
    })
    console.log(`Token gerado para ${email}: ${token}`)
    
    return res.status(200).json({ 
      token,
      message: 'Token de recuperação gerado com sucesso' 
    })
  } catch (error) {
    console.error('Erro no forgot_password:', error)
    return res.status(500).json({ 
      error: 'Erro interno do servidor. Tente novamente.' 
    })
  }
}