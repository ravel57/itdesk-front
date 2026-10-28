import { MESSAGE_FILE_MAX_SIZE_BYTES } from 'src/util/messageFileUpload'

// Файлы из буфера обмена (вставка в поле ввода) и разбор файлов по допустимому размеру

const EXTENSION_BY_TYPE = {
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/gif': '.gif',
  'image/webp': '.webp',
  'application/pdf': '.pdf',
  'text/plain': '.txt'
}

export function getFileExtensionByType (type) {
  if (!type) {
    return ''
  }
  return EXTENSION_BY_TYPE[type] || ''
}

export function formatClipboardFileDate () {
  const date = new Date()
  const pad = value => String(value).padStart(2, '0')
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate())
  ].join('') + '-' + [
    pad(date.getHours()),
    pad(date.getMinutes()),
    pad(date.getSeconds())
  ].join('')
}

// Файлу без имени (скриншот из буфера) даём имя clipboard-<дата>.<расширение>
export function normalizePastedFile (file) {
  if (file.name && file.name.trim().length > 0) {
    return file
  }
  const extension = getFileExtensionByType(file.type)
  const fileName = `clipboard-${formatClipboardFileDate()}${extension}`
  return new File([file], fileName, {
    type: file.type,
    lastModified: file.lastModified || Date.now()
  })
}

export function getFilesFromClipboard (event) {
  const clipboardData = event.clipboardData
  if (!clipboardData) {
    return []
  }
  const files = []
  if (clipboardData.files && clipboardData.files.length > 0) {
    Array.from(clipboardData.files).forEach(file => {
      files.push(normalizePastedFile(file))
    })
  }
  if (clipboardData.items && clipboardData.items.length > 0) {
    Array.from(clipboardData.items).forEach(item => {
      if (item.kind !== 'file') {
        return
      }
      const file = item.getAsFile()
      if (!file) {
        return
      }
      const exists = files.some(existingFile =>
        existingFile.name === file.name &&
        existingFile.size === file.size &&
        existingFile.type === file.type
      )
      if (!exists) {
        files.push(normalizePastedFile(file))
      }
    })
  }
  return files
}

// Делит файлы на подходящие по размеру и превышающие лимит вложения
export function splitFilesBySize (files) {
  return {
    allowedFiles: files.filter(file => Number(file?.size || 0) <= MESSAGE_FILE_MAX_SIZE_BYTES),
    rejectedFiles: files.filter(file => Number(file?.size || 0) > MESSAGE_FILE_MAX_SIZE_BYTES)
  }
}
