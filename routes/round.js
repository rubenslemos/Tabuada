const router = require('express').Router()
const Round = require('../models/Round')
const { JSDOM } = require('jsdom')
const fs = require('fs')
const index = '../tabuada/assets/index.html'
const {criarTabuada} = require('../assets/js/tabuada')
router.post('/', async (req, res) => {
let resultado
let acerto
let errou
let jogou
let round
try {
fs.readFile(index, 'utf-8', async (erro, dados) => {
  if (erro) {
    console.error(`Erro ao ler o arquivo HTML: ${erro}`);
    return;
    }
    const dom = new JSDOM(dados)
    const document = dom.window.document
    const checaResultado = criarTabuada(document)
    resultado = checaResultado()
    acerto = resultado.acerto
    errou = resultado.errou
    jogou = resultado.jogou
    round = new Round ({
      acerto,
      errou,
      jogou,
    })
    await round.save()
    res.status(201).json({msg: 'Rodada criada com sucesso'})
  })
} 
catch (error) {
    console.log(error)
    res.status(500).json({msg: 'Erro no servidor, tente em alguns minutos'})
  }
})
module.exports = router