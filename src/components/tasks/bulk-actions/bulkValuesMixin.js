import {
  getDeadlineKey,
  getDeadlineValue,
  getEntityKey,
  getExecutorKey,
  getExecutorValue,
  getPriorityKey,
  getPriorityValue,
  getSameSelectedTaskValue,
  getStatusKey,
  getStatusValue,
  getSupportLineKey,
  getSupportLineValue,
  getTagKey,
  getTagsKey,
  getTagsValue,
  isMixedBulkValue
} from 'src/util/taskBulkActions/selectionValues'

// Начальные значения полей формы: у всех выбранных заявок одинаково — подставляем, иначе «Смешанные …»;
// проверка обязательности значения перед применением.
// Требует в компоненте: this.store, this.action, поля формы tasks*, методы статусов/типов/исполнителей.
export default {
  methods: {
    getEntityKey (entity, nameGetter) {
      return getEntityKey(entity, nameGetter)
    },

    getSupportLineKey (task) {
      return getSupportLineKey(task)
    },

    getSupportLineValue (task) {
      return getSupportLineValue(task)
    },

    getExecutorKey (task) {
      return getExecutorKey(task)
    },

    getExecutorValue (task) {
      return getExecutorValue(task)
    },

    getPriorityKey (task) {
      return getPriorityKey(task)
    },

    getPriorityValue (task) {
      return getPriorityValue(task)
    },

    getStatusKey (task) {
      return getStatusKey(task)
    },

    getStatusValue (task) {
      return getStatusValue(task)
    },

    getDeadlineKey (task) {
      return getDeadlineKey(task)
    },

    getDeadlineValue (task) {
      return getDeadlineValue(task)
    },

    getTagKey (tag) {
      return getTagKey(tag)
    },

    getTagsKey (task) {
      return getTagsKey(task)
    },

    getTagsValue (task) {
      return getTagsValue(task)
    },

    getSameSelectedTaskValue (keyGetter, valueGetter, mixedValue) {
      return getSameSelectedTaskValue(this.store.checkedTasks, keyGetter, valueGetter, mixedValue)
    },

    isMixedBulkValue (value) {
      return isMixedBulkValue(value)
    },

    initBulkActionValues () {
      const tasks = Array.isArray(this.store.checkedTasks) ? this.store.checkedTasks : []
      const firstTask = tasks[0]

      if (!firstTask) {
        this.tasksSupportLineId = null
        this.tasksExecutor = ''
        this.tasksPriority = ''
        this.tasksType = null
        this.tasksServiceId = null
        this.tasksStatus = ''
        this.tasksTags = []
        this.tasksDeadline = ''
        return
      }

      this.tasksSupportLineId = this.getSameSelectedTaskValue(
        task => this.getSupportLineKey(task),
        task => this.getSupportLineValue(task),
        null
      )

      this.tasksExecutor = this.getSameSelectedTaskValue(
        task => this.getExecutorKey(task),
        task => this.getExecutorValue(task),
        'Смешанные исполнители'
      )

      this.tasksPriority = this.getSameSelectedTaskValue(
        task => this.getPriorityKey(task),
        task => this.getPriorityValue(task),
        'Смешанные приоритеты'
      )

      this.tasksType = this.getSameSelectedTaskValue(
        task => this.getTaskTypeKey(task?.type),
        task => this.normalizeTaskTypeOption(task?.type),
        this.getMixedTaskTypeOption()
      )

      this.tasksServiceId = this.getSameSelectedTaskValue(
        task => task?.service?.id == null ? 'none' : String(task.service.id),
        task => task?.service?.id || null,
        null
      )

      this.tasksStatus = this.getSameSelectedTaskValue(
        task => this.getStatusKey(task),
        task => this.getStatusValue(task),
        'Смешанные статусы'
      )

      this.tasksTags = this.getSameSelectedTaskValue(
        task => this.getTagsKey(task),
        task => this.getTagsValue(task),
        ['Смешанные теги']
      )

      this.tasksDeadline = this.getSameSelectedTaskValue(
        task => this.getDeadlineKey(task),
        task => this.getDeadlineValue(task),
        'Смешанные дедлайны'
      )
    },

    hasRequiredActionValue () {
      if (['close', 'open'].includes(this.action)) {
        return true
      }
      if (this.action === 'supportLine') {
        return this.tasksSupportLineId != null
      }
      if (this.action === 'type') {
        return this.isValidTaskTypeSelection(this.tasksType)
      }
      if (this.action === 'service') {
        return this.tasksServiceId != null
      }
      if (this.action === 'freeze') {
        return String(this.tasksFreezeUntil || '').length > 0
      }
      if (this.action === 'status') {
        if (!String(this.tasksStatus || '').length || this.isMixedBulkValue(this.tasksStatus)) {
          return false
        }
        if (this.isFrozenStatusName(this.tasksStatus)) {
          return String(this.taskFreezeUntil || this.tasksFreezeUntil || '').length > 0
        }
        return true
      }
      if (this.action === 'executor') {
        return this.isValidExecutorSelection(this.tasksExecutor)
      }
      if (this.action === 'priority') {
        return String(this.tasksPriority || '').length > 0 && !this.isMixedBulkValue(this.tasksPriority)
      }
      if (this.action === 'tags') {
        return Array.isArray(this.tasksTags) && this.tasksTags.length > 0 && !this.isMixedBulkValue(this.tasksTags)
      }
      if (this.action === 'deadline') {
        return String(this.tasksDeadline || '').length > 0 && !this.isMixedBulkValue(this.tasksDeadline)
      }
      return false
    }
  }
}
