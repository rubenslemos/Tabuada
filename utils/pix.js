function formatField(id, value) {
  const stringValue = String(value)
  return `${id}${String(stringValue.length).padStart(2, '0')}${stringValue}`
}

function crc16ccitt(payload) {
  let crc = 0xffff

  for (let i = 0; i < payload.length; i += 1) {
    crc ^= payload.charCodeAt(i) << 8

    for (let bit = 0; bit < 8; bit += 1) {
      if (crc & 0x8000) {
        crc = (crc << 1) ^ 0x1021
      } else {
        crc <<= 1
      }
      crc &= 0xffff
    }
  }

  return crc.toString(16).toUpperCase().padStart(4, '0')
}

function sanitizeMerchantName(name) {
  return (
    String(name || 'TABUADA')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toUpperCase()
      .replace(/[^A-Z0-9 ]/g, '')
      .trim()
      .slice(0, 25) || 'TABUADA'
  )
}

function sanitizeMerchantCity(city) {
  return (
    String(city || 'SAO PAULO')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toUpperCase()
      .replace(/[^A-Z0-9 ]/g, '')
      .trim()
      .slice(0, 15) || 'SAO PAULO'
  )
}

export function buildPixPayload({
  key,
  merchantName = 'Tabuada',
  merchantCity = 'Sao Paulo',
  description = 'Apoio ao app Tabuada',
} = {}) {
  const pixKey = String(key || '').trim()
  if (!pixKey) return ''

  const gui = formatField('00', 'br.gov.bcb.pix')
  const accountInfoFields = [gui, formatField('01', pixKey)]

  const normalizedDescription = String(description || '')
    .trim()
    .slice(0, 72)
  if (normalizedDescription) {
    accountInfoFields.push(formatField('02', normalizedDescription))
  }

  const merchantAccountInfo = formatField('26', accountInfoFields.join(''))
  const payloadWithoutCrc = [
    formatField('00', '01'),
    formatField('01', '12'),
    merchantAccountInfo,
    formatField('52', '0000'),
    formatField('53', '986'),
    formatField('58', 'BR'),
    formatField('59', sanitizeMerchantName(merchantName)),
    formatField('60', sanitizeMerchantCity(merchantCity)),
    formatField('62', formatField('05', 'TABUADAAPP')),
    '6304',
  ].join('')

  const crc = crc16ccitt(payloadWithoutCrc)
  return `${payloadWithoutCrc}${crc}`
}
