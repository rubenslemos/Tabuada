require('dotenv').config()
const mongoose = require('mongoose')
const { ensureGlobalAdminUser } = require('../utils/bootstrapAdmin')

async function main() {
  const mongoUri = process.env.MONGODB_URI
  const user = process.env.DB_USER
  const pass = process.env.DB_PASS
  const dbName = process.env.DB_NAME || 'tabuada'

  const fallbackUri =
    `mongodb+srv://${encodeURIComponent(user)}:${encodeURIComponent(pass)}` +
    `@tabuada.hz6j8rr.mongodb.net/${dbName}?retryWrites=true&w=majority&authSource=admin&appName=TabuadaMobile`

  const uri = mongoUri || fallbackUri
  if (!uri || uri.includes('undefined')) {
    throw new Error(
      'Configure MONGODB_URI ou DB_USER/DB_PASS antes de executar o bootstrap.'
    )
  }

  await mongoose.connect(uri)
  const admin = await ensureGlobalAdminUser()

  if (!admin) {
    throw new Error(
      'Defina ADMIN_EMAIL para promover um usuario existente, ou ADMIN_EMAIL e ADMIN_PASSWORD para criar um novo administrador global.'
    )
  }

  console.log('Administrador global pronto:', {
    id: String(admin._id),
    email: admin.email,
    name: admin.name,
    isGlobalAdmin: admin.isGlobalAdmin,
  })

  await mongoose.disconnect()
}

main().catch(async (error) => {
  console.error('Falha no bootstrap do administrador:', error.message)
  try {
    await mongoose.disconnect()
  } catch (disconnectError) {
    console.error('Falha ao desconectar do MongoDB:', disconnectError.message)
  }
  process.exit(1)
})
