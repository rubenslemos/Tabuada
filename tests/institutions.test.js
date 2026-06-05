const {
  MIN_INVITE_TOKEN_LENGTH,
  generateInviteToken,
  getInviteTokenLengthForCount,
} = require('../utils/institutions')

test('generateInviteToken cria codigo numerico com o tamanho informado', () => {
  const token = generateInviteToken(7)
  expect(token).toMatch(/^\d{7}$/)
})

test('getInviteTokenLengthForCount começa com 5 digitos e sobe quando esgota', () => {
  expect(getInviteTokenLengthForCount(0)).toBe(MIN_INVITE_TOKEN_LENGTH)
  expect(getInviteTokenLengthForCount(99999)).toBe(5)
  expect(getInviteTokenLengthForCount(100000)).toBe(6)
  expect(getInviteTokenLengthForCount(999999)).toBe(6)
  expect(getInviteTokenLengthForCount(1000000)).toBe(7)
})
