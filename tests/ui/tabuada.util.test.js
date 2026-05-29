import { generateQuestion } from '../../utils/tabuada'

describe('generateQuestion rules', () => {
  it('subtracao deve gerar apenas resultado positivo ou zero', () => {
    for (let i = 0; i < 200; i += 1) {
      const q = generateQuestion('menos')
      expect(q.opSymbol).toBe('-')
      expect(q.num1).toBeGreaterThanOrEqual(q.num2)
      expect(q.result).toBeGreaterThanOrEqual(0)
    }
  })

  it('divisao deve ser exata (resto zero)', () => {
    for (let i = 0; i < 200; i += 1) {
      const q = generateQuestion('dividir')
      expect(q.opSymbol).toBe('/')
      expect(q.num1 % q.num2).toBe(0)
      expect(Number.isInteger(q.result)).toBe(true)
    }
  })

  it('deve fixar o denominador quando operacao vem com sufixo', () => {
    const ops = ['soma4', 'menos4', 'vezes4', 'dividir4', 'todas4']
    for (let i = 0; i < 200; i += 1) {
      const op = ops[i % ops.length]
      const q = generateQuestion(op)
      expect(q.num2).toBe(4)
    }
  })
})
