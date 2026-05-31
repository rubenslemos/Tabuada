import axios from 'axios'
import API_BASE_URL, { API_BASE_URLS } from './api'

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
})

let currentBaseUrlIndex = 0

apiClient.interceptors.request.use((config) => {
  if (!Number.isInteger(config.__baseUrlIndex)) {
    config.__baseUrlIndex = currentBaseUrlIndex
  }

  const chosenBaseUrl =
    API_BASE_URLS[config.__baseUrlIndex] || API_BASE_URLS[0] || API_BASE_URL
  config.baseURL = chosenBaseUrl
  return config
})

apiClient.interceptors.response.use(
  (response) => {
    if (Number.isInteger(response?.config?.__baseUrlIndex)) {
      currentBaseUrlIndex = response.config.__baseUrlIndex
    }
    return response
  },
  async (error) => {
    const config = error?.config
    if (!config) {
      return Promise.reject(error)
    }

    const isTimeout = error.code === 'ECONNABORTED'
    const isNetworkError = !error.response
    const nextIndex = (config.__baseUrlIndex || 0) + 1

    if (
      (isTimeout || isNetworkError) &&
      !config.__retryWithFallback &&
      nextIndex < API_BASE_URLS.length
    ) {
      config.__retryWithFallback = true
      config.__baseUrlIndex = nextIndex
      currentBaseUrlIndex = nextIndex
      return apiClient.request(config)
    }

    return Promise.reject(error)
  }
)

export function setAuthToken(token) {
  if (token) {
    apiClient.defaults.headers.common.Authorization = `Bearer ${token}`
  } else {
    delete apiClient.defaults.headers.common.Authorization
  }
}

export default apiClient
