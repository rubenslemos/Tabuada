import Constants from 'expo-constants'

const API_BASE_URL =
  (Constants?.expoConfig && Constants.expoConfig?.extra?.API_BASE_URL) ||
  (Constants?.manifest && Constants.manifest?.extra?.API_BASE_URL) ||
  'http://192.168.0.153:3000'

export default API_BASE_URL
