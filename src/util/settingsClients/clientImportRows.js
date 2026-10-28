import {EMAIL_REGEX} from 'src/util/settingsClients/clientImportConstants'
import {normalizeSearch} from 'src/util/settingsClients/clientSearch'

// Строки предпросмотра, пришедшие с сервера, + служебные поля для отслеживания правок
export function mapPreviewRows(rows) {
  return rows.map(row => ({
    ...row,
    selected: Boolean(row.selected),
    originalUsername: row.username || '',
    originalStatus: row.status || '',
    originalMessage: row.message || ''
  }))
}

// Состояние (статус и сообщение) строки предпросмотра
export function getImportRowState(row, organizationOptions) {
  const username = String(row?.username || '').trim()
  const firstname = String(row?.firstname || '').trim()
  const lastname = String(row?.lastname || '').trim()
  const organization = String(row?.organization || '').trim()
  const errors = []
  if (!username) {
    errors.push('не указан логин')
  } else if (!EMAIL_REGEX.test(username)) {
    errors.push('логин должен быть в формате name@domain.zone')
  }
  if (!firstname) errors.push('не указано имя')
  if (!lastname) errors.push('не указана фамилия')
  if (!organization) errors.push('не указана организация')

  if (errors.length) {
    return {
      level: 'error', label: 'Ошибка', message: errors.join('; '),
      color: 'red-1', textColor: 'negative', icon: 'error'
    }
  }

  if (row.originalStatus === 'WARNING' && username === row.originalUsername) {
    return {
      level: 'warning', label: 'Проверить', message: row.originalMessage || 'Строка требует внимания',
      color: 'amber-2', textColor: 'brown-9', icon: 'warning'
    }
  }

  const orgExists = organizationOptions.some(item => normalizeSearch(item.name) === normalizeSearch(organization))
  if (!orgExists) {
    return {
      level: 'error', label: 'Ошибка', message: 'Организация не найдена. Выберите организацию из списка.',
      color: 'red-1', textColor: 'negative', icon: 'error'
    }
  }

  return {
    level: 'ready', label: 'Готово', message: 'Строка готова к импорту',
    color: 'green-1', textColor: 'positive', icon: 'check_circle'
  }
}

// Тело запроса на импорт: очищенные строки
export function buildImportPayloadRows(importRows) {
  return importRows.map(row => ({
    rowNumber: row.rowNumber,
    selected: Boolean(row.selected),
    username: String(row.username || '').trim(),
    firstname: String(row.firstname || '').trim(),
    lastname: String(row.lastname || '').trim(),
    email: String(row.email || '').trim(),
    phoneNumber: String(row.phoneNumber || '').trim(),
    organization: String(row.organization || '').trim(),
    moreInfo: String(row.moreInfo || '').trim()
  }))
}
