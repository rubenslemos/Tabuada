import Constants from 'expo-constants'

const extra =
  (Constants?.expoConfig && Constants.expoConfig?.extra) ||
  (Constants?.manifest && Constants.manifest?.extra) ||
  {}

const API_BASE_URL = extra.API_BASE_URL || 'http://tabuada.duckdns.org:3000'

const API_FALLBACK_BASE_URL =
  extra.API_FALLBACK_BASE_URL || 'http://192.168.0.153:3000'

const API_BASE_URLS = Array.from(
  new Set([API_BASE_URL, API_FALLBACK_BASE_URL].filter(Boolean))
)

export default API_BASE_URL
export { API_FALLBACK_BASE_URL, API_BASE_URLS }
