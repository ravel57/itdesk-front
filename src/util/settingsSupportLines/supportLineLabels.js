import {ASSIGNMENT_STRATEGY_OPTIONS, OLA_UNIT_OPTIONS} from './supportLineOptions'
import {userName} from './supportLineUsers'

// Подписи строки списка линий.

export function getResponsibleLabel(line) {
  return line?.responsible
    ? `Ответственный: ${userName(line.responsible)}`
    : 'Ответственный не назначен'
}

export function getAssignmentStrategyLabel(value) {
  return ASSIGNMENT_STRATEGY_OPTIONS.find(option => option.value === value)?.label || 'Распределение не настроено'
}

export function getOlaLabel(line) {
  if (!line?.olaEnabled) {
    return 'OLA отключён'
  }
  const unit = OLA_UNIT_OPTIONS.find(option => option.value === line.olaUnit)?.label || line.olaUnit
  return `OLA: ${line.olaValue || 0} ${String(unit || '').toLowerCase()}, предупреждение ${line.olaWarningPercent || 80}%`
}

export function getSupportLineErrorMessage(error) {
  return error?.response?.data?.message || error?.message || 'Ошибка сохранения'
}
