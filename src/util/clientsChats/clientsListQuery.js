// Чистые функции списка чатов: поиск по клиентам, счётчик пингов, заявки без исполнителя.

export function filterClientsBySearch (clients, searchQuery) {
  if (searchQuery === '') {
    return clients
  }
  const query = searchQuery.toLowerCase()
  return clients.filter(client => {
    const firstname = client.firstname || ''
    const lastname = client.lastname || ''
    const organization = client.organization?.name || ''
    const sourceChannel = client.sourceChannel || ''
    const phoneNumber = client.phoneNumber || ''
    const email = client.email || ''
    return `${firstname} ${lastname} ${organization} ${sourceChannel} ${phoneNumber} ${email}`
      .toLowerCase()
      .includes(query)
  })
}

// Количество пингов текущего пользователя по клиенту (без учёта демо-клиентов)
export function calcClientPingScore (client, userId) {
  if (!userId || !client) {
    return 0
  }
  let count = 0
  const clientPing = client.unreadPingMessages?.[userId]
  if (typeof clientPing === 'number') {
    count += clientPing
  } else if (clientPing) {
    count += 1
  }
  count += Number(client.taskPingCount || 0)
  return count
}

export function hasClientPingFor (client, userId) {
  if (!userId || !client) {
    return false
  }
  const hasClientPing = Boolean(client.unreadPingMessages?.[userId])
  return hasClientPing || client.hasTaskPing === true || Number(client.taskPingCount || 0) > 0
}

export function isTaskWithoutAssignee (task) {
  if (!task || task.completed) {
    return false
  }
  return !task.executor &&
    !task.executorId &&
    !task.assignee &&
    !task.assigneeId &&
    !task.assignedUser &&
    !task.assignedUserId &&
    !task.performer &&
    !task.performerId &&
    !task.responsible &&
    !task.responsibleId &&
    !task.user &&
    !task.userId &&
    !task.operator &&
    !task.operatorId
}
