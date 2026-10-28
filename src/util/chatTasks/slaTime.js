import moment from 'moment'

// Чистые функции для работы с длительностями и значениями SLA.

export function getSlaDuration (duration) {
  if (!duration) {
    return moment.duration(0)
  }
  if (typeof duration.asMilliseconds === 'function') {
    return duration
  }
  if (typeof duration === 'number') {
    return moment.duration(duration, 'milliseconds')
  }
  return moment.duration(duration)
}

export function normalizeSlaSeconds (value) {
  if (value === null || value === undefined || value === '') {
    return null
  }

  const seconds = Number(value)
  return Number.isFinite(seconds) ? seconds : null
}

export function parseIsoDurationToMs (duration) {
  if (duration === null || duration === undefined || duration === '') {
    return 0
  }
  if (typeof duration === 'number') {
    return duration * 1000
  }
  if (typeof duration === 'object') {
    if (Number.isFinite(Number(duration.seconds))) {
      return Number(duration.seconds) * 1000 + Math.floor(Number(duration.nano || duration.nanos || 0) / 1000000)
    }
    if (Number.isFinite(Number(duration.millis))) {
      return Number(duration.millis)
    }
    if (Number.isFinite(Number(duration.milliseconds))) {
      return Number(duration.milliseconds)
    }
    if (Number.isFinite(Number(duration.value))) {
      const unit = String(duration.unit || '').toUpperCase()
      if (unit === 'DAYS') {
        return Number(duration.value) * 24 * 60 * 60 * 1000
      }
      if (unit === 'HOURS') {
        return Number(duration.value) * 60 * 60 * 1000
      }
      if (unit === 'MINUTES') {
        return Number(duration.value) * 60 * 1000
      }
      if (unit === 'SECONDS') {
        return Number(duration.value) * 1000
      }
      return Number(duration.value) * 1000
    }
    return 0
  }
  const normalizedDuration = String(duration).trim()
  if (!normalizedDuration) {
    return 0
  }
  if (/^\d+(\.\d+)?$/.test(normalizedDuration)) {
    return Number(normalizedDuration) * 1000
  }
  const match = normalizedDuration.match(/^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/)
  if (!match) {
    return 0
  }
  const days = Number(match[1] || 0)
  const hours = Number(match[2] || 0)
  const minutes = Number(match[3] || 0)
  const seconds = Number(match[4] || 0)
  return (((days * 24 + hours) * 3600) + (minutes * 60) + seconds) * 1000
}
