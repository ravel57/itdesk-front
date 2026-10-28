// Текстовые хелперы списка заявок чата: склонение, названия статусов, подписи.

export function getDeclension (count) {
  const declensions = ['заявка', 'заявки', 'заявок']
  let form

  if (count % 10 === 1 && count % 100 !== 11) {
    form = declensions[0]
  } else if ([2, 3, 4].includes(count % 10) && ![12, 13, 14].includes(count % 100)) {
    form = declensions[1]
  } else {
    form = declensions[2]
  }

  return `${count} ${form}`
}

export function getStamp (date) {
  if (date) {
    return date.toLocaleTimeString('ru-RU', {
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  } else {
    return ''
  }
}

export function getStatusName (status) {
  if (!status) {
    return ''
  }
  return typeof status === 'string' ? status : status.name || ''
}

export function isClosedStatusName (statusName) {
  return ['закрыта', 'закрыто', 'закрыт'].includes(String(statusName || '').trim().toLowerCase())
}

export function getPingedTaskCaption (task) {
  const values = [
    task?.status?.name,
    task?.supportLine?.name
  ].map(value => String(value || '').trim()).filter(Boolean)
  return values.length > 0 ? values.join(' · ') : 'Открыть заявку'
}
