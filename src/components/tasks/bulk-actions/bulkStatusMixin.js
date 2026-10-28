import {
  getStatusName,
  isClosedStatusName,
  isFrozenStatusName,
  isOpenStatusName,
  needStatusChangeReason
} from 'src/util/taskBulkActions/statuses'

// Статусы массового действия: целевой статус, причина смены статуса, проверка исполнителей при закрытии.
// Требует в компоненте: this.store, this.action, props statusChangeReason/requestStatusChangeReason,
// поля формы tasksStatus.
export default {
  methods: {
    getNormalizedStatusChangeReason (reason = this.statusChangeReason) {
      const normalizedReason = String(reason || '').trim()
      return normalizedReason.length > 0 ? normalizedReason : null
    },

    withStatusChangeReason (task, reason = this.statusChangeReason) {
      const normalizedReason = this.getNormalizedStatusChangeReason(reason)
      if (!normalizedReason) {
        return task
      }
      return {
        ...task,
        statusChangeReason: normalizedReason
      }
    },

    getStatusName (status) {
      return getStatusName(status)
    },

    isClosedStatusName (statusName) {
      return isClosedStatusName(statusName)
    },

    isFrozenStatusName (statusName) {
      return isFrozenStatusName(statusName)
    },

    isOpenStatusName (statusName) {
      return isOpenStatusName(statusName)
    },

    getSelectedStatus () {
      return this.store.statuses.find(status => status.name === this.tasksStatus)
    },

    getTargetStatusForCurrentAction () {
      switch (this.action) {
        case 'close':
          return this.getClosedStatus()
        case 'freeze':
          return this.getFrozenStatus() || {name: 'Заморожено'}
        case 'status':
          return this.getSelectedStatus()
        default:
          return null
      }
    },

    needStatusChangeReason (oldStatusName, newStatusName, task = null) {
      return needStatusChangeReason(oldStatusName, newStatusName, task)
    },

    async getStatusChangeReasonForBulkAction () {
      const existingReason = this.getNormalizedStatusChangeReason()
      if (existingReason) {
        return existingReason
      }

      if (!['close', 'open', 'freeze', 'status'].includes(this.action)) {
        return ''
      }

      if (typeof this.requestStatusChangeReason !== 'function') {
        return ''
      }

      if (this.action === 'open') {
        const affectedOpenTasks = this.store.checkedTasks.filter(task =>
          task?.completed === true ||
          task?.frozen === true ||
          this.isClosedStatusName(this.getStatusName(task?.status)) ||
          this.isFrozenStatusName(this.getStatusName(task?.status))
        )

        if (affectedOpenTasks.length === 0) {
          return ''
        }

        const openStatus = this.getOpenStatus(affectedOpenTasks[0]) || {name: 'Открыто'}
        return this.requestStatusChangeReason({
          action: this.action,
          newStatus: openStatus,
          newStatusName: this.getStatusName(openStatus),
          tasks: affectedOpenTasks
        })
      }

      if (this.action === 'freeze') {
        const frozenStatus = this.getFrozenStatus() || {name: 'Заморожено'}
        return this.requestStatusChangeReason({
          action: this.action,
          newStatus: frozenStatus,
          newStatusName: this.getStatusName(frozenStatus),
          tasks: this.store.checkedTasks
        })
      }

      const selectedStatus = this.getTargetStatusForCurrentAction()
      if (!selectedStatus) {
        this.$q.notify({
          message: this.action === 'status' ? 'Выберите статус' : 'Не найден целевой статус',
          type: 'negative'
        })
        return null
      }

      const newStatusName = this.getStatusName(selectedStatus)
      const affectedTasks = this.store.checkedTasks.filter(task => this.needStatusChangeReason(
        this.getStatusName(task?.status),
        newStatusName,
        task
      ))

      if (affectedTasks.length === 0) {
        return ''
      }

      return this.requestStatusChangeReason({
        action: this.action,
        newStatus: selectedStatus,
        newStatusName,
        tasks: affectedTasks
      })
    },

    getClosedStatus () {
      return this.store.statuses.find(status => this.isClosedStatusName(status.name))
    },

    getFrozenStatus () {
      return this.store.statuses.find(status => this.isFrozenStatusName(status.name))
    },

    getOpenStatus (task) {
      if (task?.previousStatus && this.isOpenStatusName(task.previousStatus.name)) {
        return task.previousStatus
      }
      return this.store.statuses.find(status => this.isOpenStatusName(status.name) && status.defaultSelection === true) ||
        this.store.statuses.find(status => this.isOpenStatusName(status.name))
    },

    isClosingBulkAction () {
      if (this.action === 'close') {
        return true
      }
      if (this.action === 'status') {
        return this.isClosedStatusName(this.tasksStatus)
      }
      return false
    },

    hasExecutorForClose (task) {
      return !!task?.executor && !!task.executor.id
    },

    getTasksWithoutExecutorForCloseAction () {
      if (!this.isClosingBulkAction()) {
        return []
      }
      return (this.store.checkedTasks || [])
        .filter(task => !this.hasExecutorForClose(task))
    },

    validateExecutorsForCloseAction () {
      const tasksWithoutExecutor = this.getTasksWithoutExecutorForCloseAction()
      if (tasksWithoutExecutor.length === 0) {
        return true
      }
      const taskNumbers = tasksWithoutExecutor
        .map(task => task?.id ? `№${task.id}` : null)
        .filter(Boolean)
        .join(', ')
      this.$q.notify({
        message: taskNumbers
          ? `Перед закрытием укажите исполнителя у заявок: ${taskNumbers}`
          : 'Перед закрытием заявок укажите исполнителя',
        type: 'negative'
      })
      return false
    }
  }
}
