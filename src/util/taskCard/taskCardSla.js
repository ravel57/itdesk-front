// Чистые функции SLA для карточки заявки: разбор длительности, остаток, процент, форматирование.
// slaInfo — ответ /sla (deadline, remainingSeconds, paused, workdaySeconds, ...), nowTs — «текущее» время в мс.
import moment from 'moment/moment'

const ISO_DURATION_RE = /^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/

export function toFiniteNumber (value) {
  const number = Number(value)
  return Number.isFinite(number) ? number : null
}

export function toTimestamp (value) {
  if (!value) {
    return null
  }
  const timestamp = new Date(value).getTime()
  return Number.isFinite(timestamp) ? timestamp : null
}

export function normalizeSlaInfo (info) {
  return {
    ...info,
    paused: Boolean(info.paused),
    remainingSeconds: toFiniteNumber(info.remainingSeconds),
    pausedSeconds: toFiniteNumber(info.pausedSeconds) || 0,
    workdaySeconds: toFiniteNumber(info.workdaySeconds),
    slaWorkingDays: toFiniteNumber(info.slaWorkingDays)
  }
}

export function getSlaDuration (task) {
  const duration = task?.sla?.duration
  if (!duration) {
    return moment.duration(0)
  }
  if (typeof duration.asMilliseconds === 'function') {
    const ms = duration.asMilliseconds()
    if (Number.isFinite(ms) && ms > 0) {
      return duration
    }
    return moment.duration(0)
  }
  if (typeof duration === 'number') {
    return moment.duration(duration, 'seconds')
  }
  if (typeof duration === 'string') {
    const match = duration.match(ISO_DURATION_RE)
    if (match) {
      const days = Number(match[1] || 0)
      const hours = Number(match[2] || 0)
      const minutes = Number(match[3] || 0)
      const seconds = Number(match[4] || 0)
      return moment.duration({
        days,
        hours,
        minutes,
        seconds
      })
    }
  }
  return moment.duration(0)
}

export function getSlaDeadlineMoment (slaInfo, task) {
  if (slaInfo?.deadline) {
    return moment(slaInfo.deadline)
  }
  if (!task?.sla?.startDate || !task?.sla?.duration) {
    return moment.invalid()
  }
  return moment(task.sla.startDate).add(getSlaDuration(task))
}

export function getSlaTotalSeconds (task) {
  const duration = task?.sla?.duration
  if (!duration) {
    return 0
  }
  if (typeof duration.asSeconds === 'function') {
    const seconds = duration.asSeconds()
    return Number.isFinite(seconds) && seconds > 0 ? seconds : 0
  }
  if (typeof duration === 'number') {
    return duration > 0 ? duration : 0
  }

  if (typeof duration === 'string') {
    const parsed = Number(duration)
    if (Number.isFinite(parsed) && parsed > 0) {
      return parsed
    }
    const match = duration.match(ISO_DURATION_RE)
    if (match) {
      const days = Number(match[1] || 0)
      const hours = Number(match[2] || 0)
      const minutes = Number(match[3] || 0)
      const seconds = Number(match[4] || 0)
      return days * 86400 + hours * 3600 + minutes * 60 + seconds
    }
    return 0
  }
  if (typeof duration === 'object') {
    if (Number.isFinite(duration.seconds)) {
      return duration.seconds
    }
    if (Number.isFinite(duration._milliseconds)) {
      return Math.floor(duration._milliseconds / 1000)
    }
    if (Number.isFinite(duration.milliseconds)) {
      return Math.floor(duration.milliseconds / 1000)
    }
  }
  return 0
}

export function getSlaTotalSecondsFromInfo (slaInfo, task, nowTs) {
  const remainingSeconds = toFiniteNumber(slaInfo?.remainingSeconds)
  if (remainingSeconds === null) {
    return 0
  }
  const slaWorkingDays = toFiniteNumber(slaInfo?.slaWorkingDays)
  const workdaySeconds = toFiniteNumber(slaInfo?.workdaySeconds)
  if (slaWorkingDays !== null && slaWorkingDays > 0 && workdaySeconds !== null && workdaySeconds > 0) {
    return Math.max(remainingSeconds, Math.round(slaWorkingDays * workdaySeconds))
  }
  const deadlineMs = toTimestamp(slaInfo?.deadline)
  const createdAtMs = toTimestamp(task?.createdAt)
  if (deadlineMs === null || createdAtMs === null) {
    return Math.max(remainingSeconds, 0)
  }
  const pausedSeconds = toFiniteNumber(slaInfo?.pausedSeconds) || 0
  const nowMs = slaInfo.paused
    ? deadlineMs - remainingSeconds * 1000
    : nowTs
  const elapsedSeconds = Math.max(0, Math.floor((nowMs - createdAtMs) / 1000))
  return Math.max(remainingSeconds, remainingSeconds + elapsedSeconds - pausedSeconds)
}

export function getSlaLeftSeconds (slaInfo, nowTs) {
  if (!slaInfo) {
    return null
  }
  const remainingSeconds = toFiniteNumber(slaInfo.remainingSeconds)
  if (slaInfo.paused) {
    return remainingSeconds
  }
  const deadlineMs = toTimestamp(slaInfo.deadline)
  if (deadlineMs !== null) {
    return Math.max(0, Math.floor((deadlineMs - nowTs) / 1000))
  }
  return remainingSeconds
}

export function getSlaWorkdaySeconds (slaInfo, task) {
  const workdaySecondsFromInfo = Number(slaInfo?.workdaySeconds)
  if (Number.isFinite(workdaySecondsFromInfo) && workdaySecondsFromInfo > 0) {
    return workdaySecondsFromInfo
  }
  const workdaySecondsFromTask = Number(task?.slaInfo?.workdaySeconds)
  if (Number.isFinite(workdaySecondsFromTask) && workdaySecondsFromTask > 0) {
    return workdaySecondsFromTask
  }
  return 24 * 60 * 60
}

// «2 д. 3 ч. 10 м.» / «5 ч. 20 м.» / «—», если остаток неизвестен
export function formatSlaTime (secondsLeft, workdaySeconds) {
  if (!Number.isFinite(secondsLeft)) {
    return '—'
  }
  if (secondsLeft <= 0) {
    return '0 ч. 0 м.'
  }
  if (workdaySeconds > 0 && secondsLeft >= workdaySeconds) {
    const days = Math.floor(secondsLeft / workdaySeconds)
    const restSeconds = secondsLeft % workdaySeconds
    const hours = Math.floor(restSeconds / 3600)
    const minutes = Math.floor((restSeconds % 3600) / 60)
    if (hours > 0 || minutes > 0) {
      return `${days} д. ${hours} ч. ${minutes} м.`
    }
    return `${days} д.`
  }
  const hours = Math.floor(secondsLeft / 3600)
  const minutes = Math.floor((secondsLeft % 3600) / 60)
  return `${hours} ч. ${minutes} м.`
}

// Доля оставшегося времени от всего SLA (0..1)
export function calcSlaPercent (leftSeconds, totalSecondsFromTask, totalSecondsGetterFromInfo) {
  if (!Number.isFinite(leftSeconds)) {
    return 0
  }
  let totalSeconds = totalSecondsFromTask
  if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) {
    totalSeconds = totalSecondsGetterFromInfo()
  }
  if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) {
    totalSeconds = Math.max(leftSeconds, 1)
  }
  return Math.max(0, Math.min(1, leftSeconds / totalSeconds))
}

// Демо-данные SLA для онбординга
export function buildDemoSlaInfo () {
  return {
    deadline: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    remainingSeconds: 2 * 60 * 60,
    pausedSeconds: 0,
    paused: false
  }
}
