import { getChecklistSignature } from './checklist'
import { deadlineToDialogText, getUserName } from './taskFormat'
import { getServiceLabel } from './taskServices'

// Есть ли в диалоге несохранённые изменения относительно заявки.
// form — снимок полей диалога (см. getDialogFormSnapshot в taskDialogFormMixin).
export function hasUnsavedTaskChanges (form, task, isNewTask) {
  if (isNewTask) {
    return !!form.name
  }
  const dialogTaskDeadline = form.deadline ? form.deadline : ''
  const taskDeadline = deadlineToDialogText(task.deadline)
  return form.name !== task.name ||
    form.description !== task.description ||
    form.priority !== task.priority.name ||
    form.type !== (task.type?.type || '') ||
    form.service !== getServiceLabel(task.service) ||
    getChecklistSignature(form.checklist) !== getChecklistSignature(task.checklist) ||
    form.supportLine !== (task.supportLine?.name || '') ||
    form.executor !== getUserName(task.executor) ||
    JSON.stringify(form.tags) !== JSON.stringify(task.tags.map(tag => tag.name)) ||
    dialogTaskDeadline !== taskDeadline ||
    form.status !== task.status.name ||
    form.complete !== task.completed
}
