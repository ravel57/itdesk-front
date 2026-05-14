import { boot } from 'quasar/wrappers'
import axios from 'axios'
import { appConfig } from 'src/config/appConfig'

function normalizeApiBaseUrl(value) {
  if (!value) {
    return ''
  }

  const url = String(value).trim()

  if (!url) {
    return ''
  }

  if (typeof window !== 'undefined') {
    const currentHost = window.location.host
    const isHttpsPage = window.location.protocol === 'https:'

    if (isHttpsPage && url === `http://${currentHost}`) {
      return ''
    }

    if (isHttpsPage && url.startsWith(`http://${currentHost}/`)) {
      return url.replace(`http://${currentHost}`, '')
    }
  }

  return url
}

const apiBaseUrl = normalizeApiBaseUrl(appConfig.apiBaseUrl)

axios.defaults.baseURL = apiBaseUrl
axios.defaults.withCredentials = true

export const api = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true
})

export default boot(({ app }) => {
  app.config.globalProperties.$axios = axios
  app.config.globalProperties.$api = api
})

function handleUnauthorized (error) {
  if (error.response && error.response.status === 401) {
    localStorage.removeItem('currentSessionId')

    if (window.location.pathname !== '/login') {
      window.location.replace('/login')
    }
  }

  return Promise.reject(error)
}

axios.interceptors.response.use(
  response => response,
  handleUnauthorized
)

api.interceptors.response.use(
  response => response,
  handleUnauthorized
)
