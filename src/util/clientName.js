// Имя клиента в UI: ФИО, а если его нет — телефон, затем почта, и только
// в крайнем случае обезличенный номер (вместо пустой строки).
export function getClientDisplayName(client) {
  const lastname = String(client?.lastname || '').trim()
  const firstname = String(client?.firstname || '').trim()
  const fullName = `${lastname} ${firstname}`.trim()
  if (fullName) {
    return fullName
  }

  const phoneNumber = String(client?.phoneNumber || '').trim()
  if (phoneNumber) {
    return phoneNumber
  }

  const email = String(client?.email || '').trim()
  if (email) {
    return email
  }

  return client?.id !== undefined && client?.id !== null ? `Клиент #${client.id}` : 'Клиент'
}

// Инициалы для аватара: буквы ФИО, иначе первые символы телефона/почты.
export function getClientAvatarAbbreviation(client) {
  const lastname = String(client?.lastname || '').trim()
  const firstname = String(client?.firstname || '').trim()
  if (lastname || firstname) {
    return `${lastname ? lastname[0].toUpperCase() : ''}${firstname ? firstname[0].toUpperCase() : ''}`
  }

  const fallback = String(client?.phoneNumber || client?.email || '').trim()
  return fallback.slice(0, 2).toUpperCase()
}
