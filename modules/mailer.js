const nodemailer = require('nodemailer')
const hbs = require('nodemailer-express-handlebars')
const path = require('path')
require('dotenv').config()

const transport = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: process.env.MAIL_PORT,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
})

transport.use(
  'compile',
  hbs({
    viewEngine: {
      extName: '.html',
      partialsDir: path.resolve(__dirname, '../resources/mail/'),
      layoutsDir: path.resolve(__dirname, '../resources/mail/'),
      defaultLayout: false,
    },
    viewPath: path.resolve(__dirname, '../resources/mail/'),
    extName: '.html',
  })
)

module.exports = transport
