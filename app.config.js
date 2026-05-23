const dotenv = require('dotenv');
dotenv.config();

module.exports = ({ config }) => ({
  ...config,
  extra: {
    API_BASE_URL: process.env.API_BASE_URL || 'http://192.168.0.153:' + (process.env.PORT || 3000)
  },
});
