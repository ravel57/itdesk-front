import moment from 'moment/moment'
import { isClosedStatusName } from './taskStatus'
import { DEADLINE_FORMAT } from './taskFormat'

// Валидаторы диалога заявки. Возвращают результат, уведомления показывает вызывающий код.

export function hasRequiredTaskFields ({ name, type, priority, status }) {
  return !(!name || !type || !priority || !status)
}

export function hasTaskExecutor (executor) {
  return !!executor && !!executor.id
}

// Для закрытия заявки обязателен исполнитель
export function isExecutorRequirementSatisfied (executor, statusName, completed) {
  const closing = Boolean(completed) || isClosedStatusName(statusName)
  if (!closing) {
    return true
  }
  return hasTaskExecutor(executor)
}

// Проверка полей диалога заморозки: срок (формат, будущее) и причина.
// Успех: { frozenUntil }, ошибка: { error } с текстом для уведомления.
export function validateFreezeForm (untilText, reason) {
  if (!untilText) {
    return { error: 'Не заполнена дата заморозки' }
  }
  const parsedFrozenUntil = moment(untilText, DEADLINE_FORMAT, true)
  if (!parsedFrozenUntil.isValid()) {
    return { error: 'Некорректная дата заморозки. Используйте формат дд.мм.гггг чч:мм' }
  }
  if (parsedFrozenUntil.isSameOrBefore(moment())) {
    return { error: 'Дата заморозки должна быть в будущем' }
  }
  if (!reason || !reason.trim()) {
    return { error: 'Не заполнена причина заморозки' }
  }
  return { frozenUntil: parsedFrozenUntil.format() }
}
