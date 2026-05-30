import Constants from 'expo-constants'

const API_BASE_URL =
  (Constants?.expoConfig && Constants.expoConfig?.extra?.API_BASE_URL) ||
  (Constants?.manifest && Constants.manifest?.extra?.API_BASE_URL) ||
  'https://tabuada.duckdns.org'

export default API_BASE_URL
