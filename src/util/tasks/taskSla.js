// Чистые функции SLA/OLA для страницы заявок: расчёт остатка, процента, форматирование.
// Состояние (slaInfo по заявке, текущее время nowTs) передаётся аргументами — доступа к компоненту нет.

const ISO_DURATION_RE = /^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/

export function getTaskSla (task) {
  const originalSla = task?.originalSla
  if (originalSla && typeof originalSla === 'object') {
    return originalSla
  }
  const sla = task?.sla
  if (sla && typeof sla === 'object') {
    return sla
  }
  return null
}

export function getSlaWorkdaySeconds (slaInfo) {
  const workdaySeconds = Number(slaInfo?.workdaySeconds)
  if (Number.isFinite(workdaySeconds) && workdaySeconds > 0) {
    return workdaySeconds
  }
  return 24 * 60 * 60
}

// Оставшееся время SLA в секундах (null, если данных нет)
export function getSlaLeftSeconds (slaInfo, nowTs) {
  if (!slaInfo) {
    return null
  }
  if (slaInfo.paused) {
    const remainingSeconds = Number(slaInfo.remainingSeconds)
    return Number.isFinite(remainingSeconds)
      ? Math.max(0, remainingSeconds)
      : null
  }
  const remainingSeconds = Number(slaInfo.remainingSeconds)
  if (Number.isFinite(remainingSeconds) && remainingSeconds > 0) {
    return Math.max(0, remainingSeconds)
  }
  if (slaInfo.deadline) {
    const deadlineMs = new Date(slaInfo.deadline).getTime()

    if (Number.isFinite(deadlineMs)) {
      return Math.max(0, Math.floor((deadlineMs - nowTs) / 1000))
    }
  }
  return Number.isFinite(remainingSeconds)
    ? Math.max(0, remainingSeconds)
    : null
}

// Форматирует остаток SLA: «N д. H ч. M м.» (дни считаются по рабочему дню из slaInfo)
export function formatSlaTime (secondsLeft, workdaySeconds) {
  if (secondsLeft === null) {
    return ''
  }
  if (secondsLeft <= 0) {
    return '0 ч. 0 м.'
  }
  if (workdaySeconds > 0 && secondsLeft >= workdaySeconds) {
    const days = Math.floor(secondsLeft / workdaySeconds)
    const restSeconds = secondsLeft % workdaySeconds
    const hours = Math.floor(restSeconds / 3600)
    const minutes = Math.floor((restSeconds % 3600) / 60)
    return `${days} д. ${hours} ч. ${minutes} м.`
  }
  const hours = Math.floor(secondsLeft / 3600)
  const minutes = Math.floor((secondsLeft % 3600) / 60)
  return `${hours} ч. ${minutes} м.`
}

export function getSlaTotalSecondsFromInfo (task, slaInfo, nowTs) {
  if (!slaInfo?.deadline) {
    return 0
  }
  const deadlineMs = new Date(slaInfo.deadline).getTime()
  const createdAtMs = new Date(task.createdAt).getTime()
  if (!Number.isFinite(deadlineMs) || !Number.isFinite(createdAtMs)) {
    return 0
  }
  const remainingSeconds = Number(slaInfo.remainingSeconds)
  const pausedSeconds = Number(slaInfo.pausedSeconds || 0)
  if (!Number.isFinite(remainingSeconds)) {
    return 0
  }
  const nowMs = slaInfo.paused
    ? deadlineMs - remainingSeconds * 1000
    : nowTs
  const elapsedSeconds = Math.max(0, Math.floor((nowMs - createdAtMs) / 1000))

  return Math.max(remainingSeconds, remainingSeconds + elapsedSeconds - pausedSeconds)
}

export function getSlaTotalSeconds (task) {
  const duration = getTaskSla(task)?.duration
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
    if (Number.isFinite(duration.seconds) && duration.seconds > 0) {
      return duration.seconds
    }
    if (Number.isFinite(duration._milliseconds) && duration._milliseconds > 0) {
      return Math.floor(duration._milliseconds / 1000)
    }
    if (Number.isFinite(duration.milliseconds) && duration.milliseconds > 0) {
      return Math.floor(duration.milliseconds / 1000)
    }
  }
  return 0
}

// Доля оставшегося времени SLA (0..1)
export function getSlaPercent (task, slaInfo, nowTs) {
  const leftSeconds = getSlaLeftSeconds(slaInfo, nowTs)
  if (leftSeconds === null) {
    return 0
  }

  let totalSeconds = getSlaTotalSeconds(task)
  if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) {
    totalSeconds = getSlaTotalSecondsFromInfo(task, slaInfo, nowTs)
  }
  if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) {
    return 0
  }
  return Math.max(0, Math.min(1, leftSeconds / totalSeconds))
}

export function isSlaVisibleInTable (task, slaInfo) {
  return !task?.completed &&
    !task?.frozen &&
    !!getTaskSla(task) &&
    !!slaInfo
}

// ---- OLA ----

export function getTaskOlaInfo (task) {
  return task?.olaInfo && typeof task.olaInfo === 'object' ? task.olaInfo : {}
}

export function getOlaSecondsLeft (task) {
  const info = getTaskOlaInfo(task)
  const explicit = info.secondsLeft ?? task?.olaSecondsLeft
  if (explicit !== null && explicit !== undefined && Number.isFinite(Number(explicit))) {
    return Number(explicit)
  }
  const deadline = info.deadline || task?.olaDeadline
  if (!deadline) return null
  return Math.round((new Date(deadline).getTime() - Date.now()) / 1000)
}

export function formatCompactDuration (seconds) {
  if (seconds === null || seconds === undefined || !Number.isFinite(Number(seconds))) return ''
  const absolute = Math.abs(Math.round(Number(seconds)))
  const days = Math.floor(absolute / 86400)
  const hours = Math.floor((absolute % 86400) / 3600)
  const minutes = Math.floor((absolute % 3600) / 60)
  const parts = []
  if (days) parts.push(`${days} д.`)
  if (hours || days) parts.push(`${hours} ч.`)
  parts.push(`${minutes} м.`)
  return `${Number(seconds) < 0 ? '−' : ''}${parts.join(' ')}`
}

export function getOlaPercent (task) {
  const info = getTaskOlaInfo(task)
  const explicit = Number(info.percent ?? task?.olaPercent)
  if (Number.isFinite(explicit)) {
    const normalized = explicit <= 1 ? explicit * 100 : explicit
    return Math.max(0, Math.min(100, normalized))
  }
  const total = Number(info.durationSeconds ?? task?.olaDurationSeconds)
  const remaining = getOlaSecondsLeft(task)
  if (!Number.isFinite(total) || total <= 0 || remaining === null) return null
  return Math.max(0, Math.min(100, remaining / total * 100))
}

export function getOlaTableValue (task) {
  const seconds = getOlaSecondsLeft(task)
  return seconds === null ? '' : formatCompactDuration(seconds)
}
