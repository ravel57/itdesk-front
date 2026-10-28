import { getClientName, getTaskTitle } from 'src/util/organizationHelpers'

// Строки списка организаций: поиск, сортировка, дата последней активности (чистые функции).

export function filterOrganizationRows (rows, searchRequest) {
  const query = String(searchRequest ?? '').trim().toLowerCase()
  if (!query) {
    return rows
  }

  return rows.filter(row => {
    return [
      row.name,
      row.contractLabel,
      row.slaAgreementLabel,
      ...row.employeesList.map(client => getClientName(client)),
      ...row.tasksList.map(task => getTaskTitle(task))
    ].join(' ').toLowerCase().includes(query)
  })
}

export function sortOrganizationRows (rows, sortType) {
  return [...rows].sort((a, b) => {
    if (sortType === 'OPEN_TASKS') {
      return b.openTasks - a.openTasks
    }
    if (sortType === 'OVERDUE_SLA') {
      return b.overdueTasks - a.overdueTasks
    }
    if (sortType === 'VISITS_USAGE') {
      return b.visits.percent - a.visits.percent
    }
    if (sortType === 'LAST_ACTIVITY') {
      return b.lastActivityTs - a.lastActivityTs
    }
    return a.name.localeCompare(b.name, 'ru')
  })
}

// Последняя активность по сотрудникам и заявкам организации (timestamp, 0 если данных нет).
export function getLastActivityTs (employees, tasks) {
  const dates = []

  employees.forEach(client => {
    if (client.lastMessage?.date) {
      dates.push(new Date(client.lastMessage.date).getTime())
    }
    if (client.updatedAt) {
      dates.push(new Date(client.updatedAt).getTime())
    }
  })

  tasks.forEach(task => {
    if (task.updatedAt) {
      dates.push(new Date(task.updatedAt).getTime())
    }
    if (task.createdAt) {
      dates.push(new Date(task.createdAt).getTime())
    }
  })

  const validDates = dates.filter(date => Number.isFinite(date))
  if (validDates.length === 0) {
    return 0
  }
  return Math.max(...validDates)
}
