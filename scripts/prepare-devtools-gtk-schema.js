const fs = require('fs')
const path = require('path')
const { execFileSync } = require('child_process')

const sourceDir = '/usr/share/glib-2.0/schemas'
const targetDir = path.join(
  __dirname,
  '..',
  '.cache',
  'devtools-gsettings-schemas'
)
const requiredFiles = [
  'gschema.dtd',
  'org.gnome.desktop.enums.xml',
  'org.gnome.desktop.interface.gschema.xml',
]

if (!fs.existsSync(sourceDir)) {
  console.warn(
    '[prepare-devtools-gtk-schema] Diretorio de schemas nao encontrado:',
    sourceDir
  )
  process.exit(0)
}

fs.rmSync(targetDir, { recursive: true, force: true })
fs.mkdirSync(targetDir, { recursive: true })

for (const file of requiredFiles) {
  const src = path.join(sourceDir, file)
  const dest = path.join(targetDir, file)
  if (!fs.existsSync(src)) {
    console.warn('[prepare-devtools-gtk-schema] Arquivo nao encontrado:', src)
    process.exit(0)
  }
  fs.copyFileSync(src, dest)
}

const targetSchemaFile = path.join(
  targetDir,
  'org.gnome.desktop.interface.gschema.xml'
)

let schemaXml = fs.readFileSync(targetSchemaFile, 'utf8')

if (!schemaXml.includes('font-antialiasing')) {
  const insertion = `    <key name="font-antialiasing" enum="org.gnome.desktop.GDesktopFontAntialiasingMode">\n      <default>'grayscale'</default>\n      <summary>Font antialiasing</summary>\n      <description>Controls how fonts are antialiased for applications that still expect this legacy key.</description>\n    </key>\n`

  schemaXml = schemaXml.replace(
    '    <key name="font-name" type="s">',
    `${insertion}    <key name="font-name" type="s">`
  )

  fs.writeFileSync(targetSchemaFile, schemaXml)
}

execFileSync('glib-compile-schemas', [targetDir], { stdio: 'inherit' })
console.log(
  '[prepare-devtools-gtk-schema] Schemas minimos preparados em',
  targetDir
)
