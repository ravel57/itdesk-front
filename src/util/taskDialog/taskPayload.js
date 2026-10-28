import { normalizeChecklist } from './checklist'
import { dialogTextToDeadline, getUserName } from './taskFormat'

// Сборка payload'ов заявки для backend из полей диалога.
// form — снимок полей диалога (см. getDialogFormSnapshot в taskDialogFormMixin),
// store — pinia-хранилище (statuses, priorities, supportLines, users, tags).

export function resolveTagsByName (tagNames, storeTags) {
  const tags = []
  tagNames.forEach(tagName => tags.push(storeTags.find(tag => tag.name === tagName)))
  return tags
}

// Payload создания/обновления заявки из диалога
export function buildTaskPayload ({
  form,
  task,
  isNewTask,
  currentTaskId,
  taskCreatedAt,
  linkedMessageId,
  selectedType,
  selectedService,
  linkedMessages,
  tags,
  store
}) {
  const payload = {
    id: isNewTask ? null : currentTaskId,
    name: form.name,
    description: form.description,
    type: selectedType,
    service: selectedService,
    checklist: normalizeChecklist(form.checklist),
    status: store.statuses.find(status => status.name === form.status),
    priority: store.priorities.find(priority => priority.name === form.priority),
    supportLine: store.supportLines.find(line => line.name === form.supportLine) || null,
    executor: store.users.find(user => getUserName(user) === form.executor),
    tags,
    completed: false,
    createdAt: isNewTask ? new Date() : taskCreatedAt,
    deadline: dialogTextToDeadline(form.deadline),
    linkedMessageId,
    previousStatus: isNewTask ? store.statuses.find(status => status.name === form.status) : task.previousStatus,
    messages: isNewTask ? linkedMessages : task.messages
  }
  if (!isNewTask) {
    payload.sla = task.sla
  }
  return payload
}

// Payload заморозки/разморозки заявки
export function buildFreezePayload ({
  form,
  task,
  isNewTask,
  currentTaskId,
  taskCreatedAt,
  linkedMessageId,
  selectedType,
  selectedService,
  nextStatus,
  previousStatus,
  frozenUntil,
  freezeReason,
  tags,
  store
}) {
  const payload = {
    id: currentTaskId,
    name: form.name,
    description: form.description,
    status: nextStatus,
    priority: store.priorities.find(priority => priority.name === form.priority),
    supportLine: store.supportLines.find(line => line.name === form.supportLine) || null,
    executor: store.users.find(user => getUserName(user) === form.executor),
    tags,
    type: selectedType,
    service: selectedService,
    checklist: normalizeChecklist(form.checklist),
    completed: false,
    createdAt: isNewTask ? new Date() : taskCreatedAt,
    deadline: dialogTextToDeadline(form.deadline),
    linkedMessageId,
    frozen: !task.frozen,
    frozenFrom: task.frozen ? null : new Date(),
    frozenUntil,
    previousStatus: task.frozen ? null : previousStatus,
    statusChangeReason: task.frozen ? null : freezeReason.trim(),
  }
  if (!isNewTask) {
    payload.sla = task.sla
  }
  return payload
}

// Копия заявки для закрытия/возврата в работу: без client и sla (sla добавляется отдельно)
export function copyTaskForUpdate (sourceTask) {
  return Object.keys(sourceTask)
    .filter(objKey => objKey !== 'client' && objKey !== 'sla')
    .reduce((newObj, key) => {
      newObj[key] = sourceTask[key]
      return newObj
    }, {})
}

// Заявка после PATCH: исходная + отправленная + ответ backend, с запасными sla и lastActivity
export function mergeUpdatedTaskRuntimeFields (sourceTask, requestTask, responseTask) {
  const updatedTask = {
    ...(sourceTask || {}),
    ...(requestTask || {}),
    ...(responseTask || {})
  }

  if (!updatedTask.sla && sourceTask?.sla) {
    updatedTask.sla = sourceTask.sla
  }
  if (!updatedTask.lastActivity) {
    updatedTask.lastActivity = requestTask?.lastActivity || sourceTask?.lastActivity || new Date()
  }

  return updatedTask
}
