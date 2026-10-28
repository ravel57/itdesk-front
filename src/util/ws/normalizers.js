import moment from 'moment/moment'

export function normalizeMessagesRevision(value) {
  if (value === null || value === undefined) {
    return ''
  }
  return String(value).trim()
}

export function getLastMessageSignature(message) {
  if (!message) {
    return ''
  }
  return [
    message.id ?? '',
    message.date ?? '',
    message.editedAt ?? '',
    message.deleted ?? false,
    message.text ?? '',
    message.fileUuid ?? ''
  ].join('|')
}

export function normalizeClientFromSocket(client, existingClient = null) {
  const normalizedClient = {
    // Socket payloads are not equivalent: the clients list contains calculated
    // display fields, while mark-read and message events can contain a raw Client.
    // Keep already loaded fields when a partial payload does not include them.
    ...(existingClient || {}),
    ...(client || {}),
    lastname: client?.lastname === null
      ? ''
      : (client?.lastname ?? existingClient?.lastname ?? ''),
    sourceChannel: resolveClientSourceChannel(client, existingClient),
    messages: normalizeClientMessages(client, existingClient),
    tasks: Array.isArray(client?.tasks)
      ? client.tasks.map(task => normalizeTaskFromSocket(task))
      : (Array.isArray(existingClient?.tasks) ? existingClient.tasks : [])
  }

  if (Array.isArray(normalizedClient.user)) {
    normalizedClient.user = normalizedClient.user.map(user => ({
      ...user,
      lastname: user?.lastname === null ? '' : user?.lastname
    }))
  }

  normalizedClient.tasks.forEach(task => {
    task.client = normalizedClient
  })

  return normalizedClient
}

function resolveClientSourceChannel(client, existingClient = null) {
  const directValue = normalizeNonBlankString(client?.sourceChannel)
  if (directValue) {
    return directValue
  }

  const derivedValue = deriveClientSourceChannel(client)
  if (derivedValue) {
    return derivedValue
  }

  const existingValue = normalizeNonBlankString(existingClient?.sourceChannel)
  if (existingValue) {
    return existingValue
  }

  return deriveClientSourceChannel(existingClient)
}

function deriveClientSourceChannel(client) {
  if (!client) {
    return null
  }

  const messageFrom = String(client.messageFrom || '').toUpperCase()

  if (messageFrom === 'TELEGRAM') {
    return normalizeNonBlankString(client.tgBot?.name)
  }
  if (messageFrom === 'WHATSAPP') {
    return normalizeNonBlankString(client.whatsappAccount?.name)
  }
  if (messageFrom === 'EMAIL') {
    return normalizeNonBlankString(client.emailAccountSender?.name)
  }
  if (messageFrom === 'PORTAL') {
    return 'Личный кабинет'
  }

  return null
}

function normalizeNonBlankString(value) {
  const normalized = String(value ?? '').trim()
  return normalized || null
}

function normalizeClientMessages(client, existingClient = null) {
  // Ответ /app/clients/refresh содержит данные для списка чатов, а не полную
  // историю. На сервере поле messages при этом может сериализоваться как [],
  // и раньше этот пустой массив затирал уже загруженную страницу переписки.
  // Загруженная локальная история является приоритетной; socket-события
  // добавляются в нее отдельно через clientMessageCallback.
  if (Array.isArray(existingClient?.messages) && existingClient.messages.length > 0) {
    return sortMessagesByDateAndId(
      existingClient.messages.map(normalizeIncomingClientMessage)
    )
  }
  if (Array.isArray(client?.messages)) {
    return sortMessagesByDateAndId(
      client.messages.map(normalizeIncomingClientMessage)
    )
  }
  if (Array.isArray(existingClient?.messages)) {
    return []
  }
  return []
}

export function normalizeTaskFromSocket(task) {
  const normalizedTask = {
    ...task,
    createdAt: task?.createdAt ? new Date(task.createdAt) : task?.createdAt,
    deadline: task?.deadline ? new Date(task.deadline) : task?.deadline,
    lastActivity: task?.lastActivity ? new Date(task.lastActivity) : task?.lastActivity,
    closedAt: task?.closedAt ? new Date(task.closedAt) : task?.closedAt,
    frozenFrom: task?.frozenFrom ? new Date(task.frozenFrom) : task?.frozenFrom,
    frozenUntil: task?.frozenUntil ? new Date(task.frozenUntil) : task?.frozenUntil,
    messages: Array.isArray(task?.messages)
      ? sortMessagesByDateAndId(task.messages.map(normalizeIncomingClientMessage))
      : []
  }
  if (normalizedTask.sla) {
    normalizedTask.sla = {
      ...normalizedTask.sla,
      startDate: normalizedTask.sla.startDate
        ? moment(new Date(normalizedTask.sla.startDate), 'DD.MM.YYYY HH:mm')
        : normalizedTask.sla.startDate,
      duration: normalizeSlaDuration(normalizedTask.sla.duration)
    }
  }
  return normalizedTask
}

function normalizeSlaDuration(duration) {
  if (!duration) {
    return moment.duration(0)
  }
  if (typeof duration === 'number') {
    return moment.duration(duration, 'seconds')
  }
  if (typeof duration === 'string') {
    const parsed = Number(duration)
    if (Number.isFinite(parsed)) {
      return moment.duration(parsed, 'seconds')
    }
    return moment.duration(duration)
  }
  if (typeof duration === 'object') {
    if (Number.isFinite(duration.seconds)) {
      return moment.duration(duration.seconds, 'seconds')
    }
    if (Number.isFinite(duration._milliseconds)) {
      return moment.duration(duration._milliseconds, 'milliseconds')
    }
  }
  return moment.duration(0)
}

export function normalizeIncomingClientMessage(message) {
  if (!message) {
    return message
  }
  return {
    ...message,
    date: message.date instanceof Date
      ? message.date
      : new Date(message.date || Date.now()),
    editedAt: message.editedAt
      ? new Date(message.editedAt)
      : message.editedAt
  }
}

export function sortMessagesByDateAndId(messages) {
  if (!Array.isArray(messages)) {
    return []
  }

  return [...messages].sort((a, b) => {
    const dateDiff = getMessageTime(a) - getMessageTime(b)

    if (dateDiff !== 0) {
      return dateDiff
    }

    return Number(a?.id || 0) - Number(b?.id || 0)
  })
}

function getMessageTime(message) {
  const rawDate = message?.date
  const time = rawDate instanceof Date
    ? rawDate.getTime()
    : new Date(rawDate || 0).getTime()

  return Number.isFinite(time) ? time : 0
}
