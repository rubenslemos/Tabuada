const { spawn } = require('child_process')
const path = require('path')
const { execFileSync } = require('child_process')

const args = process.argv.slice(2)
const env = { ...process.env }

delete env.GSETTINGS_SCHEMA_DIR

env.EXPO_NO_TELEMETRY = env.EXPO_NO_TELEMETRY || '1'
env.RN_DEVTOOLS_GSETTINGS_SCHEMA_DIR = path.join(
  __dirname,
  '..',
  '.cache',
  'devtools-gsettings-schemas'
)
env.RN_DEVTOOLS_OZONE_PLATFORM = 'x11'
env.RN_DEVTOOLS_ELECTRON_DISABLE_GPU = '1'
env.RN_DEVTOOLS_LIBGL_ALWAYS_SOFTWARE = '1'
env.RN_DEVTOOLS_GDK_BACKEND = 'x11'
env.RN_DEVTOOLS_FORCE_XWAYLAND = '1'

try {
  execFileSync(
    'node',
    [path.join(__dirname, 'prepare-devtools-gtk-schema.js')],
    {
      stdio: 'ignore',
    }
  )
} catch (error) {
  console.warn(
    '[run-expo-clean-env] Nao foi possivel preparar schemas do DevTools:',
    error.message
  )
}

const expoBin = path.join(
  __dirname,
  '..',
  'node_modules',
  '.bin',
  process.platform === 'win32' ? 'expo.cmd' : 'expo'
)

const child = spawn(expoBin, args, {
  stdio: 'inherit',
  env,
})

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal)
    return
  }
  process.exit(code ?? 0)
})

child.on('error', (error) => {
  console.error('[run-expo-clean-env] Falha ao iniciar Expo:', error.message)
  process.exit(1)
})
