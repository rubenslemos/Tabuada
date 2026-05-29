const express = require('express')
const router = express.Router()
const Tip = require('../models/Tip')
require('dotenv').config()
// Polyfill de fetch para Node < 18
let fetchFn = global.fetch
if (!fetchFn) {
  fetchFn = (...args) =>
    import('node-fetch').then(({ default: f }) => f(...args))
}

const STATIC_FALLBACK = [
  'Todo número multiplicado por 5 termina em 0 ou 5.',
  'Multiplicar por 10: basta colocar um zero no final do número.',
  'Multiplicar por 9: a soma dos dígitos do resultado é 9.',
  '11 × N (1..9): repita o dígito.',
  '12 × N: 10×N + 2×N.',
]

function normalizeTip(text) {
  if (!text || typeof text !== 'string') return ''
  let t = text.trim().toLowerCase()
  t = t.replace(/\s+/g, ' ')
  t = t.replace(/[.,;:!?]+$/g, '')
  t = t.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  return t
}

async function saveTipIfNew(text, source = 'groq') {
  const normalizedText = normalizeTip(text)
  if (!normalizedText || normalizedText.length < 8) return null

  try {
    const existing = await Tip.findOne({ normalizedText }).lean()
    if (existing) return existing
    const doc = await Tip.create({ text, normalizedText, source })
    return doc
  } catch (err) {
    if (err.code === 11000) {
      const existing = await Tip.findOne({ normalizedText }).lean()
      return existing
    }
    throw err
  }
}

async function getRandomTipFromDB() {
  const count = await Tip.countDocuments()
  if (!count) return null
  const random = Math.floor(Math.random() * count)
  const tip = await Tip.findOne().skip(random).lean()
  return tip?.text || null
}

function resolveGroqModel() {
  const model = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile'
  return model
}

async function getGroqErrorDetail(resp) {
  try {
    const text = await resp.text()
    return text
  } catch {
    return `status=${resp.status}`
  }
}

async function getTipFromGroq(prompt) {
  const key = process.env.GROQ_API_KEY
  if (!key) throw new Error('GROQ_API_KEY ausente')

  const model = resolveGroqModel()

  const resp = await fetchFn(
    'https://api.groq.com/openai/v1/chat/completions',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'system',
            content:
              'Você é um assistente que gera dicas curtas e práticas de matemática.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 64,
        n: 1,
        stream: false,
      }),
    }
  )

  if (!resp.ok) {
    const detail = await getGroqErrorDetail(resp)
    throw new Error(`Groq error ${resp.status}: ${detail}`)
  }

  const data = await resp.json()
  const tip = data?.choices?.[0]?.message?.content?.trim()
  return tip
}

// POST /tips/ai - usa Groq; salva no DB (evita duplicatas); fallback: DB ou estático
router.post('/ai', async (req, res) => {
  const { topic = 'tabuada', language = 'pt-BR' } = req.body || {}
  const prompt = `
Gere uma dica curta e útil (${language}) para ajudar alguém a aprender ${topic}.
Responda em uma única frase, com um exemplo simples quando possível.
Não use formatação especial, apenas texto.
  `.trim()

  try {
    const tip = await getTipFromGroq(prompt)

    // Alimenta o banco com novas dicas da Groq
    if (tip && tip.length) {
      await saveTipIfNew(tip, 'groq')
    }

    // Finaliza com prioridade Groq -> DB -> estático
    const dbFallback = await getRandomTipFromDB()
    const finalTip =
      tip ||
      dbFallback ||
      STATIC_FALLBACK[Math.floor(Math.random() * STATIC_FALLBACK.length)]

    return res.json({
      tip: finalTip,
      source: tip ? 'groq' : dbFallback ? 'db' : 'static',
      model: resolveGroqModel(),
    })
  } catch (err) {
    console.error('Tip provider failed:', err.message)

    const dbTip = await getRandomTipFromDB()
    const finalTip =
      dbTip ||
      STATIC_FALLBACK[Math.floor(Math.random() * STATIC_FALLBACK.length)]

    return res.json({
      tip: finalTip,
      source: dbTip ? 'db' : 'static',
      error: err.message,
      model: resolveGroqModel(),
    })
  }
})

// GET /tips/random - retorna aleatória do DB; se vazio, usa fallback estático
router.get('/random', async (_req, res) => {
  try {
    const tip = await getRandomTipFromDB()
    const finalTip =
      tip || STATIC_FALLBACK[Math.floor(Math.random() * STATIC_FALLBACK.length)]
    res.json({ tip: finalTip, source: tip ? 'db' : 'static' })
  } catch (err) {
    console.error('Erro ao obter dica aleatória:', err.message)
    const finalTip =
      STATIC_FALLBACK[Math.floor(Math.random() * STATIC_FALLBACK.length)]
    res.json({ tip: finalTip, source: 'static' })
  }
})

// GET /tips/models - utilitário para checar modelos disponíveis no Groq
router.get('/models', async (_req, res) => {
  try {
    const key = process.env.GROQ_API_KEY
    if (!key) {
      return res.status(200).json({ models: [], warn: 'GROQ_API_KEY ausente' })
    }
    const resp = await fetchFn('https://api.groq.com/openai/v1/models', {
      headers: { Authorization: `Bearer ${key}` },
    })
    const data = await resp.json().catch(() => ({}))
    res.status(resp.ok ? 200 : 500).json(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
