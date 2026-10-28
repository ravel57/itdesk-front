import {formatPeriodDate} from './analyticsFormat'

// Чистые функции периода: форматирование дат для input[type=date], границы запроса,
// диапазон по пресету и подпись периода.

export const PERIOD_PRESETS = ['today', '7', '30', 'custom']

export const PERIOD_OPTIONS = [
  {
    label: 'Сегодня',
    value: 'today'
  },
  {
    label: '7 дней',
    value: '7'
  },
  {
    label: '30 дней',
    value: '30'
  }
]

export const GROUP_BY_OPTIONS = [
  {
    label: 'По дням',
    value: 'DAY'
  },
  {
    label: 'По неделям',
    value: 'WEEK'
  }
]

export function formatDateInput(date) {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function toIsoParam(dateValue, endOfDay) {
  if (!dateValue) {
    return undefined
  }
  const time = endOfDay ? '23:59:59' : '00:00:00'
  return `${dateValue}T${time}`
}

// Диапазон дат (строки YYYY-MM-DD) для пресета 'today' / '7' / '30'.
export function getPresetRange(preset, now = new Date()) {
  const from = new Date(now)
  if (preset === 'today') {
    from.setDate(now.getDate())
  } else {
    from.setDate(now.getDate() - Number(preset) + 1)
  }
  return {
    fromDate: formatDateInput(from),
    toDate: formatDateInput(now)
  }
}

export function buildPeriodCaption(fromDate, toDate) {
  if (!fromDate || !toDate) {
    return 'Период не выбран'
  }
  return `${formatPeriodDate(fromDate)} — ${formatPeriodDate(toDate)}`
}
