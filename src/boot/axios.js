import {boot} from 'quasar/wrappers'
import axios from 'axios'
import {appConfig} from 'src/config/appConfig'

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

export function getCsrfToken() {
  if (typeof document === 'undefined') {
    return ''
  }
  const prefix = 'XSRF-TOKEN='
  const item = document.cookie
    .split(';')
    .map(value => value.trim())
    .find(value => value.startsWith(prefix))
  if (!item) {
    return ''
  }
  try {
    return decodeURIComponent(item.substring(prefix.length))
  } catch (e) {
    return item.substring(prefix.length)
  }
}

function isUnsafeMethod(method) {
  return !['get', 'head', 'options', 'trace'].includes(String(method || 'get').toLowerCase())
}

function isSameOriginRequest(config) {
  if (typeof window === 'undefined') {
    return false
  }
  try {
    const base = config.baseURL || window.location.origin
    const target = new URL(config.url || '', new URL(base, window.location.origin))
    return target.origin === window.location.origin
  } catch (e) {
    return true
  }
}

function attachCsrfToken(config) {
  if (!isUnsafeMethod(config.method) || !isSameOriginRequest(config)) {
    return config
  }
  const token = getCsrfToken()
  if (!token) {
    return config
  }
  config.headers = config.headers || {}
  if (typeof config.headers.set === 'function') {
    config.headers.set('X-XSRF-TOKEN', token)
  } else {
    config.headers['X-XSRF-TOKEN'] = token
  }
  return config
}

const apiBaseUrl = normalizeApiBaseUrl(appConfig.apiBaseUrl)

axios.defaults.baseURL = apiBaseUrl
axios.defaults.withCredentials = true
axios.defaults.xsrfCookieName = 'XSRF-TOKEN'
axios.defaults.xsrfHeaderName = 'X-XSRF-TOKEN'

export const api = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true,
  xsrfCookieName: 'XSRF-TOKEN',
  xsrfHeaderName: 'X-XSRF-TOKEN'
})

export async function getStompCsrfHeaders() {
  const response = await api.get('/csrf')
  const csrf = response?.data

  if (!csrf?.headerName || !csrf?.token) {
    throw new Error('Backend returned an invalid CSRF token for STOMP')
  }

  return {
    [csrf.headerName]: csrf.token
  }
}

export default boot(({app}) => {
  app.config.globalProperties.$axios = axios
  app.config.globalProperties.$api = api
})

function handleUnauthorized(error) {
  if (error.response && error.response.status === 401) {
    localStorage.removeItem('currentSessionId')

    if (window.location.pathname !== '/login') {
      window.location.replace('/login')
    }
  }

  return Promise.reject(error)
}

axios.interceptors.request.use(attachCsrfToken)
api.interceptors.request.use(attachCsrfToken)

axios.interceptors.response.use(
  response => response,
  handleUnauthorized
)

api.interceptors.response.use(
  response => response,
  handleUnauthorized
)
