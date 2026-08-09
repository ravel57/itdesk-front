export const MESSAGE_FILE_MAX_SIZE_BYTES = 10 * 1024 * 1024
export const MESSAGE_FILE_MAX_SIZE_LABEL = '10 МБ'

export function getMessageFileSizeError (files) {
  const list = Array.isArray(files) ? files : []
  const oversized = list.find(file => Number(file?.size || 0) > MESSAGE_FILE_MAX_SIZE_BYTES)
  if (!oversized) {
    return ''
  }
  const name = String(oversized.name || 'Файл').trim() || 'Файл'
  return `Файл «${name}» весит больше ${MESSAGE_FILE_MAX_SIZE_LABEL}`
}

export function getUploadProgress (progressEvent) {
  const rawProgress = progressEvent?.progress
  const directProgress = rawProgress === null || rawProgress === undefined ? Number.NaN : Number(rawProgress)
  if (Number.isFinite(directProgress)) {
    return Math.max(0, Math.min(1, directProgress))
  }

  const loaded = Number(progressEvent?.loaded)
  const total = Number(progressEvent?.total)
  if (!Number.isFinite(loaded) || !Number.isFinite(total) || total <= 0) {
    return 0
  }
  return Math.max(0, Math.min(1, loaded / total))
}

export function getUploadErrorMessage (error, fallback = 'Не удалось загрузить файл') {
  const data = error?.response?.data
  if (typeof data === 'string' && data.trim()) {
    return data.trim()
  }
  if (Array.isArray(data) && data.length > 0 && String(data[0] || '').trim()) {
    return String(data[0]).trim()
  }
  if (data && typeof data === 'object' && String(data.message || '').trim()) {
    return String(data.message).trim()
  }
  if (String(error?.message || '').trim()) {
    return String(error.message).trim()
  }
  return fallback
}
