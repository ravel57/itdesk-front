import {useStore} from 'stores/store'
import {safeParseJson} from 'src/util/ws/json'
import {
  notifyIncidentUpdatedListeners,
  notifyTaskMessageListeners,
  notifyTaskUpdatedListeners
} from 'src/util/ws/listeners'
import {
  normalizeIncomingClientMessage,
  normalizeTaskFromSocket,
  sortMessagesByDateAndId
} from 'src/util/ws/normalizers'

export function incidentUpdatedCallback(message) {
  const payload = safeParseJson(message.body, null)
  if (!payload?.incidentId) {
    return
  }
  notifyIncidentUpdatedListeners(payload)
}

export function taskMessageCallback(message) {
  const payload = safeParseJson(message.body, null)
  if (!payload || !payload.taskId || !payload.message) {
    return
  }
  payload.message = normalizeIncomingClientMessage(payload.message)
  addMessageToTaskInClient(useStore().clients.find(c => Number(c.id) === Number(payload.clientId)), payload)
  addMessageToTaskInClient(
    Number(useStore().currentClient?.id) === Number(payload.clientId)
      ? useStore().currentClient
      : null,
    payload
  )
  notifyTaskMessageListeners(payload)
}

function addMessageToTaskInClient(client, payload) {
  if (!client || !Array.isArray(client.tasks)) {
    return
  }
  const task = client.tasks.find(t => Number(t.id) === Number(payload.taskId))
  if (!task) {
    return
  }
  if (!Array.isArray(task.messages)) {
    task.messages = []
  }
  const normalizedMessage = normalizeIncomingClientMessage(payload.message)
  const existingMessage = task.messages.find(m => Number(m.id) === Number(normalizedMessage.id))
  if (existingMessage) {
    Object.assign(existingMessage, normalizedMessage)
  } else {
    task.messages.push(normalizedMessage)
  }
  task.messages = sortMessagesByDateAndId(task.messages.map(normalizeIncomingClientMessage))
}

export function taskUpdatedCallback(message) {
  const payload = safeParseJson(message.body, null)

  if (!payload || !payload.task || !payload.task.id) {
    return
  }

  const store = useStore()

  const normalizedTask = store.normalizeTaskPageTask
    ? store.normalizeTaskPageTask(payload.task)
    : normalizeTaskFromSocket(payload.task)

  const normalizedPayload = {
    ...payload,
    task: normalizedTask
  }

  if (typeof store.updateLoadedTaskPageTaskFromSocket === 'function') {
    store.updateLoadedTaskPageTaskFromSocket(normalizedTask)
  }

  updateTaskInClient(
    store.clients.find(client => Number(client.id) === Number(payload.clientId)),
    normalizedTask
  )

  if (Number(store.currentClient?.id) === Number(payload.clientId)) {
    updateTaskInClient(store.currentClient, normalizedTask)
  }

  notifyTaskUpdatedListeners(normalizedPayload)
}

function updateTaskInClient(client, task) {
  if (!client || !Array.isArray(client.tasks) || !task?.id) {
    return
  }

  const index = client.tasks.findIndex(item => {
    return Number(item?.id) === Number(task.id)
  })

  if (index === -1) {
    // Новая заявка (например, созданная автоматизацией) — добавляем в список клиента
    client.tasks.push(normalizeTaskFromSocket({
      ...task,
      client: task.client || client
    }))
    return
  }

  const existingTask = client.tasks[index]

  client.tasks.splice(index, 1, {
    ...existingTask,
    ...normalizeTaskFromSocket({
      ...task,
      client: task.client || existingTask.client || client
    })
  })
}
