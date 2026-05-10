const nodemailer = require('nodemailer')
const hbs = require('nodemailer-express-handlebars')
const path = require('path')
require('dotenv').config()

const transport = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: process.env.MAIL_PORT,
  auth: { 
    user: process.env.MAIL_USER, 
    pass: process.env.MAIL_PASS 
  },
})

// Configuração corrigida para Vercel
transport.use('compile', hbs({
  viewEngine: {
    extName: '.html',
    partialsDir: path.resolve(__dirname, '../resources/mail/'), // Ajuste o nível se necessário
    layoutsDir: path.resolve(__dirname, '../resources/mail/'),
    defaultLayout: false, // Defina como false se não tiver um layout específico para o e-mail
  },
  viewPath: path.resolve(__dirname, '../resources/mail/'), // Ajuste o nível se necessário
  extName: '.html',
}))
module.exports = transport