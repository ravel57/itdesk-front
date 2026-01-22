export const appConfig = {
  mode: process.env.APP_MODE || (process.env.NODE_ENV === 'development' ? 'dev' : 'prod'),
  disableAuth: String(process.env.DISABLE_AUTH) === 'true',
  useMocks: String(process.env.USE_MOCKS) === 'true',
  apiBaseUrl: process.env.API_BASE_URL || ''
}
