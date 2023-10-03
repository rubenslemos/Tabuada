const nodemailer = require('nodemailer')
const hbs = require('nodemailer-express-handlebars')
const path = require('path')
require('dotenv').config()
const user = process.env.MAIL_USER
const pass = process.env.MAIL_PASS
const host = process.env.MAIL_HOST
const port = process.env.MAIL_PORT

const transport = nodemailer.createTransport({
  host,
  port,
  auth: { user, pass },
})
transport.use('compile', hbs({
  viewEngine: 'handlebars',
  viewPath: path.resolve('./resources/mail/'),
  extName:'.html',
}))
module.exports = transport