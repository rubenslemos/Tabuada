const mongoose = require('mongoose')
const express = require('express')
const app = express()
const path = require('path')
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
const exphbs = require('express-handlebars')
const cors = require('cors')
const webAuth = require('./middlewares/authenticator')
require('dotenv').config()

const user = process.env.DB_USER
const pass = process.env.DB_PASS
const port = process.env.PORT || 3000
const dbName = process.env.DB_NAME || 'tabuada'
const mongoUriFromEnv = process.env.MONGODB_URI
let mongoConnectPromise = null

if (!mongoUriFromEnv && (!user || !pass)) {
  console.error('Erro: configure MONGODB_URI ou as variaveis DB_USER/DB_PASS.')
  console.error('Crie um arquivo .env baseado no .env.example')
  process.exit(1)
}

const hbs = exphbs.create({
  layoutsDir: path.join(__dirname, 'views/layouts'),
  partialsDir: path.join(__dirname, 'views/partials'),
  defaultLayout: 'main',
  extname: '.handlebars',
  helpers: {
    eq: (a, b) => a === b,
    or: (...args) => args.slice(0, -1).some((arg) => arg),
  },
  runtimeOptions: {
    allowProtoPropertiesByDefault: true,
    allowProtoMethodsByDefault: true,
  },
})

app.engine('handlebars', hbs.engine)
app.set('view engine', 'handlebars')
app.set('views', path.join(__dirname, 'views'))

const defaultAllowedOrigins = [
  'http://localhost:8081',
  'http://127.0.0.1:8081',
  'http://localhost:19006',
  'http://127.0.0.1:19006',
  'http://192.168.0.153:8081',
  'http://192.168.0.153:19006',
]
const envAllowedOrigins = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean)
const allowedOrigins =
  envAllowedOrigins.length > 0 ? envAllowedOrigins : defaultAllowedOrigins

app.use(
  cors({
    origin(origin, callback) {
      if (
        !origin ||
        allowedOrigins.includes('*') ||
        allowedOrigins.includes(origin)
      ) {
        return callback(null, true)
      }
      return callback(new Error('Not allowed by CORS'))
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
)
app.options(/.*/, cors())
app.use(express.static(__dirname + '/assets'))
app.use(cookieParser())
app.use(bodyParser.json())

app.get('/', (req, res) => {
  res.redirect('/login')
})

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok' })
})

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

app.get('/tabuada', webAuth, (req, res) => {
  res.render('tabuada', { title: 'Tabuada' })
})

app.get('/performance', webAuth, (req, res) => {
  res.render('performance', { title: 'Desempenho - Tabuada' })
})

app.get('/acessos', webAuth, (req, res) => {
  res.render('acessos', { title: 'Permissoes - Tabuada' })
})

app.get('/logout', (req, res) => {
  res.render('login', { title: 'Login - Tabuada' })
})

const tipsRouter = require('./routes/tips')
app.use('/tips', tipsRouter)

const userRoutes = require('./routes/createUser')
app.use('/auth/register', userRoutes)

const login = require('./routes/login')
app.use('/auth/login', login)

const round = require('./routes/round')
app.use('/round', round)

const acessos = require('./routes/permissoes')
app.use('/acessos', acessos)

if (!process.env.GROQ_API_KEY) {
  console.warn(
    'GROQ_API_KEY nao definida. As dicas usarao fallback do banco ou estatico.\n' +
      'Defina GROQ_API_KEY em seu ambiente ou no arquivo .env para habilitar a geracao por IA (Groq).'
  )
}

if (!process.env.GROQ_MODEL) {
  console.warn(
    'GROQ_MODEL nao definida. Usando modelo padrao "llama-3.3-70b-versatile".'
  )
  process.env.GROQ_MODEL = 'llama-3.3-70b-versatile'
}

const mongoUri =
  mongoUriFromEnv ||
  `mongodb+srv://${encodeURIComponent(user)}:${encodeURIComponent(pass)}` +
    `@tabuada.hz6j8rr.mongodb.net/${dbName}?retryWrites=true&w=majority&authSource=admin&appName=TabuadaMobile`

function connectMongo() {
  if (mongoose.connection.readyState === 1) return Promise.resolve()
  if (mongoConnectPromise) return mongoConnectPromise

  mongoConnectPromise = mongoose
    .connect(mongoUri, {
      serverApi: {
        version: '1',
        strict: true,
        deprecationErrors: true,
      },
    })
    .then(() => {
      console.log('Conectado ao MongoDB Atlas')
    })
    .catch((err) => {
      mongoConnectPromise = null
      throw err
    })

  return mongoConnectPromise
}

async function startServer() {
  try {
    await connectMongo()
    app.listen(port, () => {
      console.log(`Backend ativo na porta ${port}`)
    })
  } catch (err) {
    console.error('Erro ao conectar ao MongoDB:', err.message)
    console.error(
      'Verifique MONGODB_URI ou credenciais DB_USER/DB_PASS no arquivo .env'
    )
    process.exit(1)
  }
}

if (require.main === module) {
  startServer()
}

module.exports = { app, connectMongo }
