const { app, connectMongo } = require('../server')

module.exports = async (req, res) => {
  try {
    await connectMongo()
    return app(req, res)
  } catch (err) {
    console.error('Erro ao inicializar backend na Vercel:', err.message)
    return res
      .status(500)
      .json({ error: 'Erro ao conectar no backend.', details: err.message })
  }
}
