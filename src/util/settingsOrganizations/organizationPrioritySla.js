// SLA по приоритетам для формы организации (чистые функции).

// Значения формы по приоритетам: {priorityId: {value, unit}}; source — {priorityName: {value, unit}} с сервера.
export function buildDialogPrioritySla(priorities, source) {
  const result = {}

  priorities.forEach(priority => {
    const current = source[priority.name] || {}
    result[priority.id] = {
      value: current.value ?? 0,
      unit: current.unit || 'HOURS'
    }
  })

  return result
}

// Тела запросов POST /sla — по одному на каждый приоритет.
export function buildPrioritySlaPayloads(organization, priorities, dialogPrioritySla) {
  return priorities.map(priority => {
    const sla = dialogPrioritySla[priority.id] || {value: 0, unit: 'HOURS'}
    return {
      organization: {id: organization.id},
      priority: {id: priority.id},
      value: sla.value ?? 0,
      unit: sla.unit || 'HOURS'
    }
  })
}
