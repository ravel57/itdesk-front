import {buildExport} from 'src/util/automationTransfer'

// Скачивает одну автоматизацию как JSON-файл.
export function downloadTriggerJson(row) {
  const blob = new Blob([JSON.stringify(buildExport([row]), null, 2)], {type: 'application/json'})
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  const slug = String(row.name || 'automation').trim().replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '').slice(0, 60)
  link.href = url
  link.download = `automation-${slug || row.id}.json`
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
