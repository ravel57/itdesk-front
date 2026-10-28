export function escapeCsvValue(value) {
  const stringValue = String(value ?? '')
  if (/[;"\r\n]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`
  }
  return stringValue
}

export function downloadBlob(data, filename, mimeType) {
  const blob = data instanceof Blob ? data : new Blob([data], {type: mimeType || 'application/octet-stream'})
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function copyTextFallback(text, onDone) {
  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.style.position = 'fixed'
  textarea.style.opacity = '0'
  document.body.appendChild(textarea)
  textarea.focus()
  textarea.select()
  document.execCommand('copy')
  textarea.remove()
  onDone()
}

export function copyText(text, onDone) {
  if (navigator?.clipboard?.writeText) {
    navigator.clipboard.writeText(text).then(onDone).catch(() => copyTextFallback(text, onDone))
    return
  }
  copyTextFallback(text, onDone)
}

// CSV (с BOM, разделитель «;») с логинами и паролями созданных учётных записей
export function buildCredentialsCsv(credentials) {
  const columns = ['username', 'password', 'lastname', 'firstname', 'organization']
  const lines = [columns.join(';')]
  credentials.forEach(row => {
    lines.push(columns.map(column => escapeCsvValue(row[column])).join(';'))
  })
  return `\uFEFF${lines.join('\r\n')}`
}
