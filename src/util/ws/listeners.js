const taskMessageListeners = new Set()

export function onTaskMessage(listener) {
  taskMessageListeners.add(listener)
  return () => {
    taskMessageListeners.delete(listener)
  }
}

export function notifyTaskMessageListeners(payload) {
  taskMessageListeners.forEach(listener => {
    listener(payload)
  })
}

const incidentUpdatedListeners = new Set()

// Инцидент изменился (в том числе автоматизацией): payload { incidentId }, данные перечитываются через API
export function onIncidentUpdated(listener) {
  incidentUpdatedListeners.add(listener)

  return () => {
    incidentUpdatedListeners.delete(listener)
  }
}

export function notifyIncidentUpdatedListeners(payload) {
  incidentUpdatedListeners.forEach(listener => {
    listener(payload)
  })
}

const taskUpdatedListeners = new Set()

const taskOpenedListeners = new Set()

export function onTaskOpened(listener) {
  taskOpenedListeners.add(listener)
  return () => taskOpenedListeners.delete(listener)
}

export function notifyTaskOpened(payload) {
  if (payload?.taskId) {
    taskOpenedListeners.forEach(listener => listener(payload))
  }
}

export function onTaskUpdated(listener) {
  taskUpdatedListeners.add(listener)

  return () => {
    taskUpdatedListeners.delete(listener)
  }
}

export function notifyTaskUpdatedListeners(payload) {
  taskUpdatedListeners.forEach(listener => {
    listener(payload)
  })
}

const clientMessageListeners = new Set()

export function onClientMessage(listener) {
  clientMessageListeners.add(listener)

  return () => {
    clientMessageListeners.delete(listener)
  }
}

export function notifyClientMessageListeners(payload) {
  clientMessageListeners.forEach(listener => {
    try {
      listener(payload)
    } catch (e) {
      console.error(e)
    }
  })
}
