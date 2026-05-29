export const OPS_MAP = {
  soma: '+',
  menos: '-',
  vezes: 'X',
  dividir: '/',
  todas: null,
}

export function generateQuestion(forcedOp) {
  const allowed = ['+', '-', 'X', '/']
  let opSymbol = null
  let num1 = Math.floor(Math.random() * 10) + 1
  let num2 = Math.floor(Math.random() * 10) + 1
  let fixedDenominator = null

  if (forcedOp) {
    const m = forcedOp.match(/^(soma|menos|vezes|dividir|todas)(\d+)?$/)
    if (m) {
      const tipo = m[1]
      const suffix = m[2]
      opSymbol =
        OPS_MAP[tipo] || allowed[Math.floor(Math.random() * allowed.length)]

      if (suffix) {
        fixedDenominator = Math.max(1, parseInt(suffix, 10))
        num2 = fixedDenominator
      } else if (tipo === 'todas') {
        opSymbol = allowed[Math.floor(Math.random() * allowed.length)]
      }
    } else {
      opSymbol = allowed[Math.floor(Math.random() * allowed.length)]
    }
  }

  if (!opSymbol) opSymbol = allowed[Math.floor(Math.random() * allowed.length)]

  if (fixedDenominator) {
    num2 = fixedDenominator
    if (opSymbol === '/') {
      num1 = num2 * (Math.floor(Math.random() * 10) + 1)
    } else if (opSymbol === '-') {
      num1 = num2 + Math.floor(Math.random() * 10)
    } else {
      num1 = Math.floor(Math.random() * 10) + 1
    }
  }

  if (opSymbol === '-') {
    // Garante subtracao somente com resultado positivo.
    if (num1 < num2) {
      if (fixedDenominator) {
        num1 = num2 + Math.floor(Math.random() * 10)
      } else {
        ;[num1, num2] = [num2, num1]
      }
    }
  }

  if (opSymbol === '/') {
    // Garante divisao inteira (resto zero), ajustando os termos quando preciso.
    if (!fixedDenominator && num1 < num2) [num1, num2] = [num2, num1]
    if (num1 % num2 !== 0 || num1 < num2) {
      num1 = num2 * (Math.floor(Math.random() * 10) + 1)
    }
  }

  let result = num1 + num2
  if (opSymbol === '-') result = num1 - num2
  if (opSymbol === 'X') result = num1 * num2
  if (opSymbol === '/') result = num1 / num2

  return { num1, num2, opSymbol, result }
}
