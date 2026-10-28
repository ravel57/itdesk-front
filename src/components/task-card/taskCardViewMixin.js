import { taskCardConfig } from 'src/util/taskCardConfig'
import {
  getChecklistCompletedCount,
  getChecklistItems,
  getChecklistProgress,
  getChecklistTotalCount,
  getCloseReason,
  getLastTaskHistoryEvent,
  getLastTaskHistoryTime,
  getName,
  getServiceLabel,
  getShortCloseReason,
  getStamp,
  getTaskPriorityId,
  getTaskTypeName,
  isCloseReasonVisible,
  isHaveInTaskPing,
  shortenLine
} from 'src/util/taskCard/taskCardFormat'

// Отображение карточки: форматтеры полей, подсветка поля по группировке/сортировке, css-классы строк.
// Требует в компоненте: props task/selectedGroupType/selectedSorting/taskNameShort, this.store.
export default {
  methods: {
    isFieldHighlighted (...slugs) {
      const groupSlug = this.selectedGroupType?.slug
      const sortSlug = this.selectedSorting?.slug
      return slugs.includes(groupSlug) || slugs.includes(sortSlug)
    },

    fieldHighlightClass (...slugs) {
      return {
        'task-card-field-highlighted': this.isFieldHighlighted(...slugs)
      }
    },

    getServiceLabel (service) {
      return getServiceLabel(service)
    },

    getStamp (date) {
      return getStamp(date)
    },

    getName (executor) {
      return getName(executor)
    },

    shortenLine (string) {
      return shortenLine(string, this.taskNameShort)
    },

    isHaveInTaskPing (task) {
      return isHaveInTaskPing(task, this.store.currentUser?.id)
    },

    getCloseReason (task) {
      return getCloseReason(task)
    },

    getShortCloseReason (task) {
      return getShortCloseReason(task)
    },

    isCloseReasonVisible (task) {
      return isCloseReasonVisible(task)
    },

    getTaskTypeName (task) {
      return getTaskTypeName(task)
    },

    getChecklistItems (task) {
      return getChecklistItems(task)
    },

    getChecklistTotalCount (task) {
      return getChecklistTotalCount(task)
    },

    getChecklistCompletedCount (task) {
      return getChecklistCompletedCount(task)
    },

    getChecklistProgress (task) {
      return getChecklistProgress(task)
    },

    getLastTaskHistoryTime (task) {
      return getLastTaskHistoryTime(task)
    },

    getLastTaskHistoryEvent (task) {
      return getLastTaskHistoryEvent(task)
    },

    getTaskPriorityId (task) {
      return getTaskPriorityId(task)
    }
  },

  computed: {
    visibleCardFields () {
      return taskCardConfig.value.filter(field => field.enabled)
    },

    taskStatusClass () {
      if (this.task.completed) {
        return 'status-completed'
      } else if (this.task.frozen) {
        return 'status-frozen'
      } else {
        return 'status-active'
      }
    },

    descriptionClass () {
      return {
        'text-body2': true,
        'text-grey': this.task.completed,
        truncate: true
      }
    },

    tagsClass () {
      return {
        'text-body2': true,
        'text-grey': this.task.completed,
        truncate: true,
        'task-card-field-highlighted': this.isFieldHighlighted('tag')
      }
    },

    serviceClass () {
      return {
        'text-body2': true,
        'text-grey': this.task.completed,
        'task-card-field-highlighted': this.isFieldHighlighted('service')
      }
    },

    supportLineClass () {
      return {
        'text-body2': true,
        'text-grey': this.task.completed,
        'task-card-field-highlighted': this.isFieldHighlighted('supportLine', 'supportLineLevel')
      }
    },

    priorityClass () {
      return {
        'text-body2': true,
        'text-grey': this.task.completed,
        'task-card-field-highlighted': this.isFieldHighlighted('priority')
      }
    },

    executorClass () {
      return {
        'text-body2': true,
        'text-grey': this.task.completed,
        executor: true,
        'task-card-field-highlighted': this.isFieldHighlighted('executor')
      }
    },

    createdAtClass () {
      return {
        'text-body2': true,
        'text-grey': this.task.completed,
        'task-card-field-highlighted': this.isFieldHighlighted('createdAt', 'creating')
      }
    },

    deadlineClass () {
      return {
        'text-body2': true,
        'text-grey': this.task.completed,
        'task-card-field-highlighted': this.isFieldHighlighted('deadline')
      }
    },

    lastActivityClass () {
      return {
        'text-body2': true,
        'text-grey': this.task.completed,
        'task-card-field-highlighted': this.isFieldHighlighted('lastActivity')
      }
    },

    closeReasonClass () {
      return {
        'text-body2': true,
        'text-grey': this.task.completed,
        'task-close-reason': true
      }
    },

    deadlineStyle () {
      return {
        color: this.task.deadline && this.task.deadline < Date.now() ? 'red' : undefined
      }
    },

    typeClass () {
      return {
        'text-body2': true,
        'text-grey': this.task.completed,
        truncate: true,
        'task-card-field-highlighted': this.isFieldHighlighted('type')
      }
    },

    checklistClass () {
      return {
        'text-body2': true,
        'text-grey': this.task.completed
      }
    }
  }
}
