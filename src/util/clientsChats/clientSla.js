// Чистые функции SLA заявок для строки клиента в списке чатов.
// slaInfo заявки и текущее время nowTs передаются аргументами — доступа к компоненту нет.
import moment from 'moment'

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
    if (Number.isFinite(duration._milliseconds)) {
      return duration._milliseconds
    }
    if (Number.isFinite(duration.milliseconds)) {
      return duration.milliseconds
    }
  }
  if (typeof duration === 'string') {
    const parsed = Number(duration)
    if (Number.isFinite(parsed) && parsed > 0) {
      return parsed * 1000
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

export function getTaskSlaTags (task) {
  const tags = task?.tags || task?.labels || []
  if (!Array.isArray(tags)) {
    return []
  }
  return tags
    .map(tag => {
      if (typeof tag === 'string') {
        return tag
      }
      return tag?.name || tag?.title || tag?.label || tag?.value || ''
    })
    .filter(Boolean)
}

export function isTaskSlaExpiredByFlags (task) {
  if (!task) {
    return false
  }
  if (task.slaExpired === true || task.slaOverdue === true || task.slaViolated === true || task.deadlineOverdue === true) {
    return true
  }
  return getTaskSlaTags(task).some(tag => {
    const normalized = tag.toLowerCase()
    return normalized.includes('sla наруш') ||
      normalized.includes('sla просроч') ||
      normalized.includes('просроч') ||
      normalized.includes('overdue')
  })
}

export function getSlaTotalMs (task, info) {
  const durations = [
    task?.sla?.duration,
    task?.slaDuration,
    task?.sla?.totalDuration,
    task?.slaTotalDuration,
    info?.duration,
    info?.totalDuration,
    info?.slaDuration,
    info?.durationSeconds,
    info?.totalSeconds,
    info?.totalDurationSeconds,
    info?.slaDurationSeconds
  ]
  for (const duration of durations) {
    const ms = parseIsoDurationToMs(duration)
    if (Number.isFinite(ms) && ms > 0) {
      return ms
    }
  }
  return 0
}

export function getSlaLeftMsApprox (task, info, nowTs) {
  if (!task) {
    return null
  }

  if (info) {
    const remainingSeconds = Number(info.remainingSeconds)
    const deadlineMs = info.deadline ? new Date(info.deadline).getTime() : NaN

    if (Number.isFinite(remainingSeconds) && remainingSeconds <= 0) {
      return 0
    }

    if (info.paused === true && Number.isFinite(remainingSeconds)) {
      return Math.max(0, remainingSeconds * 1000)
    }

    if (Number.isFinite(deadlineMs)) {
      return Math.max(0, deadlineMs - nowTs)
    }

    if (Number.isFinite(remainingSeconds)) {
      return Math.max(0, remainingSeconds * 1000)
    }
  }

  if (isTaskSlaExpiredByFlags(task)) {
    return 0
  }

  const startDate = task?.sla?.startDate || task?.slaStartDate
  const duration = task?.sla?.duration || task?.slaDuration
  if (!startDate || !duration) {
    return null
  }

  const startMs = new Date(startDate).getTime()
  const durationMs = parseIsoDurationToMs(duration)
  if (!Number.isFinite(startMs) || durationMs <= 0) {
    return null
  }
  const deadlineMs = startMs + durationMs
  return Math.max(0, deadlineMs - nowTs)
}

export function toSlaDuration (duration) {
  if (!duration) {
    return moment.duration(0)
  }
  if (typeof duration.asMilliseconds === 'function') {
    return duration
  }
  if (typeof duration === 'number') {
    return moment.duration(duration, 'seconds')
  }
  if (typeof duration === 'object') {
    if (Number.isFinite(duration.seconds)) {
      return moment.duration(duration.seconds, 'seconds')
    }
    if (Number.isFinite(duration._milliseconds)) {
      return moment.duration(duration._milliseconds, 'milliseconds')
    }
  }
  return moment.duration(duration)
}

export function getSlaEndDate (task) {
  if (!task?.sla?.startDate || !task?.sla?.duration) {
    return null
  }
  return moment(task.sla.startDate).add(toSlaDuration(task.sla.duration))
}
