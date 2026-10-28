export function safeParseJson(value, fallback) {
  try {
    return JSON.parse(value)
  } catch (ignoredError) {
    return fallback
  }
}
