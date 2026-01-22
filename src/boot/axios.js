import { boot } from 'quasar/wrappers'
import axios from 'axios'
import { appConfig } from 'src/config/appConfig'

axios.defaults.baseURL = appConfig.apiBaseUrl
axios.defaults.withCredentials = true

export const api = axios.create({
  baseURL: appConfig.apiBaseUrl,
  withCredentials: true
})

export default boot(({ app }) => {
  app.config.globalProperties.$axios = axios
  app.config.globalProperties.$api = api
})
