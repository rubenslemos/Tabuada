const mongoose = require('mongoose')
const express = require('express')
const app = express()
const path = require("path")
const bodyParser = require('body-parser')
const exphbs = require('express-handlebars')
require('dotenv').config()
const user = process.env.DB_USER
const pass = process.env.DB_PASS
const port = process.env.PORT || 3000

// Verificar se as variáveis de ambiente estão definidas
if (!user || !pass) {
  console.error('Erro: Variáveis de ambiente DB_USER e DB_PASS são obrigatórias')
  console.error('Crie um arquivo .env baseado no .env.example')
  process.exit(1)
}

// Configurar express-handlebars
const hbs = exphbs.create({
  layoutsDir: path.join(__dirname, 'views/layouts'),
  defaultLayout: 'main',
  extname: '.handlebars',
  helpers: {
    eq: (a, b) => a === b,
    or: (...args) => args.slice(0, -1).some(arg => arg)
  }
})

app.engine('handlebars', hbs.engine)
app.set('view engine', 'handlebars')
app.set('views', path.join(__dirname, 'views'))

// Rotas de páginas (antes dos middlewares estáticos)
app.get('/', (req, res) => {
  // Sempre redirecionar para login diretamente
  res.redirect('/login')
})

app.use(express.static(__dirname + "/assets"))
app.use(bodyParser.json())

app.get('/login', (req, res) => {
  res.render('login', { title: 'Login - Tabuada' })
})

app.get('/register', (req, res) => {
  res.render('register', { title: 'Cadastro - Tabuada' })
})

app.get('/forgot-password', (req, res) => {
  res.render('forgot-password', { title: 'Recuperar Senha - Tabuada' })
})

app.get('/reset-password', (req, res) => {
  res.render('reset-password', { title: 'Alterar Senha - Tabuada' })
})

app.get('/tabuada', (req, res) => {
  res.render('tabuada', { title: 'Tabuada' })
})

app.get('/performance', (req, res) => {
  res.render('performance', { title: 'Desempenho - Tabuada' })
})

app.get('/acessos', (req, res) => {
  res.render('acessos', { title: 'Permissões - Tabuada' })
})

app.get('/logout', (req, res) => {
  // O logout será feito no frontend limpando o localStorage
  res.render('login', { title: 'Login - Tabuada' })
})

mongoose.connect(
  `mongodb+srv://${user}:${pass}@tabuada.hz6j8rr.mongodb.net`,
  {
    serverApi: {
      version: '1',
      strict: true,
      deprecationErrors: true,
    }
  }
).then(()=>{
  app.listen(port)
  console.log('Conectado ao MongoDB Atlas')
}).catch((err) => {
  console.error('Erro ao conectar ao MongoDB:', err.message)
  console.error('Verifique suas credenciais (DB_USER e DB_PASS) no arquivo .env')
  process.exit(1)
})

const userRoutes = require('./routes/createUser')
app.use('/auth/register', userRoutes)

const login = require('./routes/login')
app.use('/auth/login', login)

const round = require('./routes/round')
app.use('/round', round)

const acessos = require('./routes/permissoes')
app.use('/acessos', acessos)