export function registerFallbackMock(mock) {
  // ----------------------------
  // fallback
  // ----------------------------
  mock.onAny().reply((config) => {
    console.warn('[MOCK] No handler:', config.method?.toUpperCase(), config.url)
    return [404, {message: `No mock for ${config.method?.toUpperCase()} ${config.url}`}]
  })
}
