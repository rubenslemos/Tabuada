const dotenv = require('dotenv')
dotenv.config()

module.exports = ({ config }) => ({
  ...config,
  plugins: ['expo-font', 'expo-status-bar'],
  extra: {
    API_BASE_URL:
      process.env.API_BASE_URL ||
      'http://192.168.0.153:' + (process.env.PORT || 8081),
  },
})
