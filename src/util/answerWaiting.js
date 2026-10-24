/**
 * Время «Требует ответа»: календарное или только рабочее (настройка «Учитывать рабочее время в «Требует ответа»»).
 * Алгоритм повторяет серверный (AnswerWaitingTimeService / OlaWorkingTimeService): окно рабочего дня
 * [начало, конец) в часовом поясе компании, только включённые дни недели. Настройки приходят с
 * GET /api/v1/settings/answer-waiting; workingTimeUsed уже учитывает и общий флаг рабочего времени.
 */

const MINUTE_MS = 60000
const DAY_MS = 86400000
const MAX_DAYS = 5000

export const DEFAULT_ANSWER_WAITING_SETTINGS = Object.freeze({
  workingTimeUsed: false,
  timezone: 'Europe/Moscow',
  workdayStart: '09:00',
  workdayEnd: '18:00',
  workingDays: [1, 2, 3, 4, 5]
})

const formatters = new Map()
const offsets = new Map()

function getFormatter (timezone) {
  let formatter = formatters.get(timezone)
  if (!formatter) {
    formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hourCycle: 'h23',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric'
    })
    formatters.set(timezone, formatter)
  }
  return formatter
}

/** Смещение часового пояса (мс) на момент instantMs; кэшируется по часам: смещение меняется только на границах перевода часов. */
function getZoneOffsetMs (instantMs, timezone) {
  const key = `${timezone}|${Math.floor(instantMs / 3600000)}`
  const cached = offsets.get(key)
  if (cached !== undefined) {
    return cached
  }
  const parts = {}
  getFormatter(timezone).formatToParts(new Date(instantMs)).forEach(part => {
    parts[part.type] = Number(part.value)
  })
  const localAsUtc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second)
  const offset = localAsUtc - Math.floor(instantMs / 1000) * 1000
  if (offsets.size > 2000) {
    offsets.clear()
  }
  offsets.set(key, offset)
  return offset
}

function parseMinutes (value, fallback) {
  const match = /^(\d{1,2}):(\d{2})/.exec(String(value || ''))
  if (!match) {
    return fallback
  }
  return Number(match[1]) * 60 + Number(match[2])
}

/** Длина рабочего дня в минутах (по умолчанию 9 часов). */
export function getWorkdayMinutes (settings) {
  const startMin = parseMinutes(settings?.workdayStart, 9 * 60)
  const endMin = parseMinutes(settings?.workdayEnd, 18 * 60)
  return endMin > startMin ? endMin - startMin : 9 * 60
}

export function normalizeAnswerWaitingSettings (raw) {
  const defaults = DEFAULT_ANSWER_WAITING_SETTINGS
  return {
    workingTimeUsed: raw?.workingTimeUsed === true,
    timezone: raw?.timezone || defaults.timezone,
    workdayStart: raw?.workdayStart || defaults.workdayStart,
    workdayEnd: raw?.workdayEnd || defaults.workdayEnd,
    workingDays: Array.isArray(raw?.workingDays) ? raw.workingDays.map(Number) : [...defaults.workingDays]
  }
}

/**
 * Миллисекунды ожидания между fromMs и toMs.
 * Календарное время, если рабочее не используется; иначе — сумма пересечений с рабочими окнами.
 */
export function getAnswerWaitingMs (fromMs, toMs, settings) {
  if (!Number.isFinite(fromMs) || !Number.isFinite(toMs) || toMs <= fromMs) {
    return 0
  }
  if (!settings?.workingTimeUsed) {
    return toMs - fromMs
  }
  const days = new Set(settings.workingDays)
  if (days.size === 0) {
    return 0
  }
  let offsetFrom
  let offsetTo
  try {
    offsetFrom = getZoneOffsetMs(fromMs, settings.timezone)
    offsetTo = getZoneOffsetMs(toMs, settings.timezone)
  } catch (e) {
    // Неизвестный часовой пояс — не прячем ожидание, считаем календарно
    return toMs - fromMs
  }
  // Дальше всё в «настенном» времени компании: миллисекунды, как если бы местное время было UTC
  const localFrom = fromMs + offsetFrom
  const localTo = toMs + offsetTo
  const startMin = parseMinutes(settings.workdayStart, 9 * 60)
  const endMin = parseMinutes(settings.workdayEnd, 18 * 60)
  if (endMin <= startMin) {
    return toMs - fromMs
  }
  let total = 0
  const firstDay = Math.floor(localFrom / DAY_MS)
  const lastDay = Math.floor(localTo / DAY_MS)
  for (let day = firstDay, i = 0; day <= lastDay && i < MAX_DAYS; day++, i++) {
    // 1970-01-01 — четверг; ISO: пн = 1 … вс = 7
    const isoWeekday = ((day + 3) % 7 + 7) % 7 + 1
    if (!days.has(isoWeekday)) {
      continue
    }
    const windowStart = day * DAY_MS + startMin * MINUTE_MS
    const windowEnd = day * DAY_MS + endMin * MINUTE_MS
    const segmentStart = Math.max(localFrom, windowStart)
    const segmentEnd = Math.min(localTo, windowEnd)
    if (segmentEnd > segmentStart) {
      total += segmentEnd - segmentStart
    }
  }
  return total
}
