const fs = require('fs')
const path = require('path')

const localesDir = path.join(
  __dirname,
  '..',
  'node_modules',
  '@react-native',
  'debugger-frontend',
  'dist',
  'third-party',
  'front_end',
  'core',
  'i18n',
  'locales'
)

const sourceLocale = path.join(localesDir, 'en-US.json')
const fallbackLocales = ['pt.json', 'pt-BR.json', 'pt-PT.json']

if (!fs.existsSync(sourceLocale)) {
  console.warn(
    '[patch-rn-debugger-locales] Locale base nao encontrado:',
    sourceLocale
  )
  process.exit(0)
}

for (const locale of fallbackLocales) {
  const target = path.join(localesDir, locale)
  fs.copyFileSync(sourceLocale, target)
}

console.log(
  '[patch-rn-debugger-locales] Fallbacks de locale criados:',
  fallbackLocales.join(', ')
)
