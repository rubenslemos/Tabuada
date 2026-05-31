const dotenv = require('dotenv')
dotenv.config()

const buildProfile = process.env.EAS_BUILD_PROFILE || 'local'
const allowHttpOnAndroid =
  buildProfile === 'preview' || buildProfile === 'development'

module.exports = ({ config }) => ({
  ...config,
  plugins: [
    'expo-font',
    'expo-status-bar',
    [
      'expo-build-properties',
      {
        android: {
          // Preview/development APK can call local HTTP APIs on LAN.
          usesCleartextTraffic: allowHttpOnAndroid,
        },
      },
    ],
    [
      'expo-splash-screen',
      {
        image: './assets/splash-icon.png',
        resizeMode: 'contain',
        backgroundColor: '#ffffff',
      },
    ],
  ],
  extra: {
    ...(config.extra || {}),
    eas: {
      ...((config.extra && config.extra.eas) || {}),
      projectId: 'fe60bdec-dc9f-409a-8806-9d1ca979d5a5',
    },
    API_BASE_URL:
      process.env.API_BASE_URL || 'https://tabuada-theta-nine.vercel.app',
    API_FALLBACK_BASE_URL:
      process.env.API_FALLBACK_BASE_URL || 'http://192.168.0.153:3000',
    ENABLE_LOCAL_FALLBACK: process.env.ENABLE_LOCAL_FALLBACK || 'false',
  },
})
//committed by: Rubens Lemos
