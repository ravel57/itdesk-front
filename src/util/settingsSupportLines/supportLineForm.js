import {isTeamUser, sanitizeLineUserIds} from './supportLineUsers'

// Форма линии поддержки: пустое значение, преобразование линии в форму и формы в payload.

export function createEmptyLineForm() {
  return {
    id: null,
    name: '',
    description: '',
    level: 1,
    active: true,
    defaultSelection: false,
    responsibleUserId: null,
    memberIds: [],
    observerIds: [],
    assignmentStrategy: 'KEEP_UNASSIGNED',
    visibilityMode: 'INHERIT',
    allowSelfAssignment: true,
    notifyOnNewTask: true,
    capacityPerMember: 0,
    olaEnabled: false,
    olaValue: 4,
    olaUnit: 'HOURS',
    olaWarningPercent: 80,
    olaUseWorkingTime: true,
    orderNumber: 0
  }
}

export function buildLineForm(line) {
  const responsibleUserId = isTeamUser(line.responsible) ? line.responsible.id : null
  const memberIds = sanitizeLineUserIds(line.members)
  const occupiedIds = new Set(memberIds.map(id => Number(id)))
  if (responsibleUserId != null) occupiedIds.add(Number(responsibleUserId))
  const observerIds = sanitizeLineUserIds(line.observers)
    .filter(id => !occupiedIds.has(Number(id)))

  return {
    ...createEmptyLineForm(),
    id: line.id,
    name: line.name || '',
    description: line.description || '',
    level: Number(line.level || 1),
    active: line.active !== false,
    defaultSelection: line.defaultSelection === true,
    responsibleUserId,
    memberIds,
    observerIds,
    assignmentStrategy: line.assignmentStrategy || 'KEEP_UNASSIGNED',
    visibilityMode: line.visibilityMode || 'INHERIT',
    allowSelfAssignment: line.allowSelfAssignment !== false,
    notifyOnNewTask: line.notifyOnNewTask !== false,
    capacityPerMember: Number(line.capacityPerMember || 0),
    olaEnabled: line.olaEnabled === true,
    olaValue: Number(line.olaValue || 4),
    olaUnit: line.olaUnit || 'HOURS',
    olaWarningPercent: Number(line.olaWarningPercent || 80),
    olaUseWorkingTime: line.olaUseWorkingTime !== false,
    orderNumber: line.orderNumber || 0
  }
}

export function buildLinePayload(form) {
  const memberIds = new Set(form.memberIds || [])
  if (form.responsibleUserId) {
    memberIds.add(form.responsibleUserId)
  }
  const observerIds = (form.observerIds || []).filter(id => !memberIds.has(id))

  return {
    id: form.id,
    name: form.name.trim(),
    description: form.description,
    level: Number(form.level || 1),
    active: form.active,
    defaultSelection: form.defaultSelection,
    orderNumber: form.orderNumber,
    responsible: form.responsibleUserId ? {id: form.responsibleUserId} : null,
    members: Array.from(memberIds).map(id => ({id})),
    observers: observerIds.map(id => ({id})),
    assignmentStrategy: form.assignmentStrategy,
    visibilityMode: form.visibilityMode,
    allowSelfAssignment: form.allowSelfAssignment,
    notifyOnNewTask: form.notifyOnNewTask,
    capacityPerMember: Math.max(0, Number(form.capacityPerMember || 0)),
    olaEnabled: form.olaEnabled,
    olaValue: form.olaEnabled ? Math.max(0, Number(form.olaValue || 0)) : null,
    olaUnit: form.olaUnit,
    olaWarningPercent: Math.min(100, Math.max(1, Number(form.olaWarningPercent || 80))),
    olaUseWorkingTime: form.olaUseWorkingTime
  }
}

// Ответственный автоматически входит в участников, наблюдатели не пересекаются с участниками
export function syncTeamSelections(form) {
  const memberIds = new Set((form.memberIds || []).map(id => Number(id)))
  if (form.responsibleUserId != null) {
    memberIds.add(Number(form.responsibleUserId))
  }
  form.observerIds = (form.observerIds || [])
    .filter(id => !memberIds.has(Number(id)))
}
