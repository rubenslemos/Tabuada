import Constants from 'expo-constants'

const extra =
  (Constants?.expoConfig && Constants.expoConfig?.extra) ||
  (Constants?.manifest && Constants.manifest?.extra) ||
  {}

const API_BASE_URL =
  extra.API_BASE_URL || 'https://tabuada-theta-nine.vercel.app'

const API_FALLBACK_BASE_URL =
  extra.API_FALLBACK_BASE_URL || 'http://192.168.0.153:3000'

const ENABLE_LOCAL_FALLBACK =
  extra.ENABLE_LOCAL_FALLBACK === true ||
  extra.ENABLE_LOCAL_FALLBACK === 'true' ||
  Boolean(globalThis && globalThis.__DEV__)

const API_BASE_URLS = ENABLE_LOCAL_FALLBACK
  ? Array.from(new Set([API_BASE_URL, API_FALLBACK_BASE_URL].filter(Boolean)))
  : [API_BASE_URL]

export default API_BASE_URL
export { API_FALLBACK_BASE_URL, API_BASE_URLS }
//committed by: Rubens lemos
