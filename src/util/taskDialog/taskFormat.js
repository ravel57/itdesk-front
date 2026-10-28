import moment from 'moment/moment'

// Форматирование значений полей заявки: ФИО, срок выполнения.

export const DEADLINE_FORMAT = 'DD.MM.YYYY HH:mm'

export function getUserName (user) {
  if (user) {
    return user.lastname + ' ' + user.firstname
  } else {
    return ''
  }
}

// Маска ввода срока: оставляет цифры и расставляет разделители дд.мм.гггг чч:мм
export function formatDeadlineInput (value) {
  const rawValue = value.replace(/\D/g, '')
  let formattedValue = ''
  if (rawValue.length <= 2) {
    formattedValue = rawValue
  } else if (rawValue.length <= 4) {
    formattedValue = rawValue.slice(0, 2) + '.' + rawValue.slice(2)
  } else if (rawValue.length <= 6) {
    formattedValue = rawValue.slice(0, 2) + '.' + rawValue.slice(2, 4) + '.' + rawValue.slice(4)
  } else if (rawValue.length <= 8) {
    formattedValue = rawValue.slice(0, 2) + '.' + rawValue.slice(2, 4) + '.' + rawValue.slice(4, 8)
  } else if (rawValue.length <= 10) {
    formattedValue = rawValue.slice(0, 2) + '.' + rawValue.slice(2, 4) + '.' + rawValue.slice(4, 8) + ' ' + rawValue.slice(8)
  } else if (rawValue.length <= 12) {
    formattedValue = rawValue.slice(0, 2) + '.' + rawValue.slice(2, 4) + '.' + rawValue.slice(4, 8) + ' ' + rawValue.slice(8, 10) + ':' + rawValue.slice(10)
  } else {
    formattedValue = rawValue.slice(0, 2) + '.' + rawValue.slice(2, 4) + '.' + rawValue.slice(4, 8) + ' ' + rawValue.slice(8, 10) + ':' + rawValue.slice(10, 12)
  }
  return formattedValue
}

// Срок заявки с backend -> строка поля диалога (пустая строка, если срока нет)
export function deadlineToDialogText (deadline) {
  return deadline ? moment(deadline, DEADLINE_FORMAT).format(DEADLINE_FORMAT) : ''
}

// Строка поля диалога -> ISO-значение для backend (null, если срока нет)
export function dialogTextToDeadline (text) {
  return text ? moment(text, DEADLINE_FORMAT).format() : null
}
