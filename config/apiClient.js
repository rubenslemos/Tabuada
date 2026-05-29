import axios from 'axios'
import API_BASE_URL from './api'

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
})

export function setAuthToken(token) {
  if (token) {
    apiClient.defaults.headers.common.Authorization = `Bearer ${token}`
  } else {
    delete apiClient.defaults.headers.common.Authorization
  }
}

export default apiClient
