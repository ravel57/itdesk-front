export function getErrorMessage(error) {
  const data = error?.response?.data
  if (typeof data === 'string' && data.trim()) {
    return data
  }
  return data?.error || data?.message || error?.message || 'Не удалось выполнить операцию'
}
