const dotenv = require('dotenv')
dotenv.config()

module.exports = ({ config }) => ({
  ...config,
  plugins: [
    'expo-font',
    'expo-status-bar',
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
      process.env.API_BASE_URL ||
      'http://192.168.0.153:' + (process.env.PORT || 8081),
  },
})
