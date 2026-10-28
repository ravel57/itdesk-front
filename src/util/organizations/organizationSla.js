// Чистые SLA-расчёты и форматирование длительностей для страницы организаций.
// Функции, зависящие от состояния страницы (загруженные SLA-инфо, nowTs), см.
// src/components/organization/organizationSlaMixin.js

export function hasTaskSlaSource (task) {
  if (!task) {
    return false
  }

  return !!(
    task.sla?.id ||
    task.sla?.startDate ||
    task.sla?.duration ||
    task.slaStartDate ||
    task.slaDuration ||
    task.slaInfo ||
    task.slaStatus ||
    task.slaExpired === true ||
    task.slaOverdue === true ||
    task.slaViolated === true
  )
}

export function isSlaInfoActive (info) {
  if (!info || info.active === false || info.enabled === false || info.hasSla === false || info.exists === false) {
    return false
  }

  const remainingSeconds = Number(info.remainingSeconds)
  const deadlineMs = info.deadline ? new Date(info.deadline).getTime() : NaN

  return Number.isFinite(remainingSeconds) ||
    Number.isFinite(deadlineMs) ||
    info.overdue === true ||
    info.slaOverdue === true ||
    info.slaExpired === true ||
    info.slaViolated === true
}

export function getSlaLeftMsFromInfo (info, nowTs) {
  if (!isSlaInfoActive(info)) {
    return null
  }

  const remainingSeconds = Number(info.remainingSeconds)
  const deadlineMs = info.deadline ? new Date(info.deadline).getTime() : NaN

  if (Number.isFinite(remainingSeconds)) {
    return Math.max(0, remainingSeconds * 1000)
  }
  if (Number.isFinite(deadlineMs)) {
    return Math.max(0, deadlineMs - nowTs)
  }

  return null
}

export function isSlaInfoOverdue (info, nowTs) {
  if (!isSlaInfoActive(info)) {
    return false
  }

  if (info.overdue === true || info.slaOverdue === true || info.slaExpired === true || info.slaViolated === true) {
    return true
  }

  const leftMs = getSlaLeftMsFromInfo(info, nowTs)
  return leftMs !== null && leftMs <= 0
}

// Длительность SLA как разница между дедлайном из info и созданием заявки (0, если посчитать нельзя).
export function getSlaSpanMsFromDeadline (info, task) {
  const deadlineMs = info?.deadline ? new Date(info.deadline).getTime() : NaN
  const createdAtMs = task?.createdAt ? new Date(task.createdAt).getTime() : NaN
  if (Number.isFinite(deadlineMs) && Number.isFinite(createdAtMs) && deadlineMs > createdAtMs) {
    return deadlineMs - createdAtMs
  }
  return 0
}

export function parseIsoDurationToMs (duration) {
  if (!duration) {
    return 0
  }
  if (typeof duration.asMilliseconds === 'function') {
    const ms = duration.asMilliseconds()
    return Number.isFinite(ms) && ms > 0 ? ms : 0
  }
  if (typeof duration === 'number') {
    return duration * 1000
  }
  if (typeof duration === 'object') {
    if (Number.isFinite(duration.seconds)) {
      return duration.seconds * 1000
    }
    if (Number.isFinite(duration.milliseconds)) {
      return duration.milliseconds
    }
    if (Number.isFinite(duration._milliseconds)) {
      return duration._milliseconds
    }
  }
  if (typeof duration === 'string') {
    const asNumber = Number(duration)
    if (Number.isFinite(asNumber) && asNumber > 0) {
      return asNumber * 1000
    }
    const match = duration.match(/^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/)
    if (match) {
      const days = Number(match[1] || 0)
      const hours = Number(match[2] || 0)
      const minutes = Number(match[3] || 0)
      const seconds = Number(match[4] || 0)
      return (((days * 24 + hours) * 60 + minutes) * 60 + seconds) * 1000
    }
  }
  return 0
}

export function formatDurationMs (ms) {
  if (!Number.isFinite(ms) || ms < 0) {
    return '—'
  }
  const totalMinutes = Math.ceil(ms / 60000)
  if (totalMinutes < 60) {
    return `${totalMinutes} мин`
  }
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  if (hours < 24) {
    return minutes > 0 ? `${hours} ч ${minutes} мин` : `${hours} ч`
  }
  const days = Math.floor(hours / 24)
  const restHours = hours % 24
  return restHours > 0 ? `${days} д ${restHours} ч` : `${days} д`
}

export function formatMinutes (minutes) {
  return formatDurationMs(minutes * 60000)
}
