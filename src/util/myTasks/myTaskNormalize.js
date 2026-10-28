import moment from 'moment'

// Приведение заявки, пришедшей с сервера, к виду, который ждут TaskCard и TaskDialog:
// даты → Date, sla.startDate → moment, sla.duration → moment.duration, messages всегда массив.
export function normalizeMyTask (task) {
  if (!task) {
    return task
  }

  const normalizedTask = { ...task }

  if (normalizedTask.createdAt) {
    normalizedTask.createdAt = new Date(normalizedTask.createdAt)
  }
  if (normalizedTask.deadline) {
    normalizedTask.deadline = new Date(normalizedTask.deadline)
  }
  if (normalizedTask.frozenFrom) {
    normalizedTask.frozenFrom = new Date(normalizedTask.frozenFrom)
  }
  if (normalizedTask.frozenUntil) {
    normalizedTask.frozenUntil = new Date(normalizedTask.frozenUntil)
  }
  if (normalizedTask.closedAt) {
    normalizedTask.closedAt = new Date(normalizedTask.closedAt)
  }
  if (normalizedTask.lastActivity) {
    normalizedTask.lastActivity = new Date(normalizedTask.lastActivity)
  }

  if (normalizedTask.sla) {
    normalizedTask.sla = { ...normalizedTask.sla }

    if (normalizedTask.sla.startDate) {
      normalizedTask.sla.startDate = moment(new Date(normalizedTask.sla.startDate), 'DD.MM.YYYY HH:mm')
    }

    if (normalizedTask.sla.duration !== undefined && normalizedTask.sla.duration !== null) {
      normalizedTask.sla.duration = moment.duration(normalizedTask.sla.duration * 1000)
    }
  }

  if (!Array.isArray(normalizedTask.messages)) {
    normalizedTask.messages = []
  }

  normalizedTask.messages = normalizedTask.messages.map(message => ({
    ...message,
    date: message.date ? new Date(message.date) : message.date
  }))

  return normalizedTask
}
