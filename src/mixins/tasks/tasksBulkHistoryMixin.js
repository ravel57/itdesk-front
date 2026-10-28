import axios from 'axios'
import {
  areBulkTasksEqual,
  cloneBulkTask,
  findBulkClientId,
  getBulkActionLabel,
  isBulkHistoryShortcutTargetIgnored,
  sanitizeBulkTaskForSave
} from 'src/util/tasks/taskBulk'

// История массовых действий на странице заявок (undo/redo): снимки «до/после», сохранение в историю,
// откат/повтор через PATCH и горячие клавиши Ctrl/Cmd+Z, Shift+Z, Y.
// Требует на странице: this.store, this.isObserverUser, this.isModalForBulkActions (tasksBulkActionsMixin),
// getStoreTaskById / getCheckedTaskById / replaceTaskInLists (сама страница).
export default {
  data: () => ({
    bulkActionHistory: [],
    bulkActionRedoHistory: [],
    pendingBulkActionHistory: null,
    bulkActionHistoryFinishTimer: null,
    isBulkHistoryProcessing: false,
    maxBulkActionHistorySize: 20,
  }),

  computed: {
    canUndoBulkAction() {
      return this.bulkActionHistory.length > 0 || this.hasPendingBulkActionHistoryChanges()
    },

    canRedoBulkAction() {
      return this.bulkActionRedoHistory.length > 0
    },

    bulkUndoTooltip() {
      const lastAction = this.bulkActionHistory[this.bulkActionHistory.length - 1]
      if (lastAction) {
        return `Отменить: ${getBulkActionLabel(lastAction.action)} (${lastAction.beforeTasks.length})`
      }

      if (this.hasPendingBulkActionHistoryChanges()) {
        const pendingAction = this.pendingBulkActionHistory?.action
        const count = this.pendingBulkActionHistory?.taskIds?.length || 0
        return `Отменить: ${getBulkActionLabel(pendingAction)} (${count})`
      }

      return 'Нет массовых действий для отмены'
    },

    bulkRedoTooltip() {
      const lastAction = this.bulkActionRedoHistory[this.bulkActionRedoHistory.length - 1]
      return lastAction
        ? `Повторить: ${getBulkActionLabel(lastAction.action)} (${lastAction.afterTasks.length})`
        : 'Нет массовых действий для повтора'
    }
  },

  watch: {
    'store.getTasks': {
      deep: true,
      handler(tasks) {
        if (!this.pendingBulkActionHistory) {
          return
        }

        this.trackPendingBulkHistoryFromTasks(tasks)
        this.scheduleFinishBulkActionHistory(1000)
      }
    },

    'store.checkedTasks': {
      deep: true,
      handler(tasks) {
        if (!this.pendingBulkActionHistory) {
          return
        }

        this.trackPendingBulkHistoryFromTasks(tasks)
      }
    }
  },

  methods: {
    beginBulkActionHistory(action) {
      if (this.bulkActionHistoryFinishTimer) {
        clearTimeout(this.bulkActionHistoryFinishTimer)
        this.bulkActionHistoryFinishTimer = null
      }

      const selectedTasks = this.store.checkedTasks
        .map(task => this.getStoreTaskById(task?.id) || task)
        .filter(task => task?.id)

      if (selectedTasks.length === 0) {
        this.pendingBulkActionHistory = null
        return
      }

      const clientIdsByTaskId = selectedTasks.reduce((acc, task) => {
        const clientId = this.getBulkTaskClientId(task)
        if (clientId) {
          acc[task.id] = clientId
        }
        return acc
      }, {})

      this.pendingBulkActionHistory = {
        action,
        createdAt: Date.now(),
        taskIds: selectedTasks.map(task => task.id),
        clientIdsByTaskId,
        beforeTasks: selectedTasks.map(task => cloneBulkTask(task)),
        afterTasks: []
      }
    },

    trackBulkActionHistoryAfterState(task) {
      const history = this.pendingBulkActionHistory
      if (!history || !task?.id || !history.taskIds.includes(task.id)) {
        return
      }

      const clientId = this.getBulkTaskClientId(task)
      if (clientId) {
        history.clientIdsByTaskId = {
          ...(history.clientIdsByTaskId || {}),
          [task.id]: clientId
        }
      }

      const afterTask = cloneBulkTask(task)
      const existingIndex = history.afterTasks.findIndex(item => item.id === task.id)
      if (existingIndex === -1) {
        history.afterTasks.push(afterTask)
      } else {
        history.afterTasks.splice(existingIndex, 1, afterTask)
      }
    },

    trackPendingBulkHistoryFromTasks(tasks) {
      const history = this.pendingBulkActionHistory
      if (!history || !Array.isArray(tasks)) {
        return
      }

      history.taskIds.forEach(taskId => {
        const task = tasks.find(item => item?.id === taskId)
        if (task?.id) {
          this.trackBulkActionHistoryAfterState(task)
        }
      })
    },

    getBulkHistoryAfterTask(taskId) {
      const history = this.pendingBulkActionHistory
      return history?.afterTasks.find(task => task.id === taskId) || this.getStoreTaskById(taskId) || this.getCheckedTaskById(taskId)
    },

    hasPendingBulkActionHistoryChanges() {
      const history = this.pendingBulkActionHistory
      if (!history) {
        return false
      }

      const beforeById = new Map(history.beforeTasks.map(task => [task.id, task]))
      return history.taskIds.some(taskId => {
        const beforeTask = beforeById.get(taskId)
        const afterTask = this.getBulkHistoryAfterTask(taskId)
        return beforeTask?.id && afterTask?.id && !areBulkTasksEqual(beforeTask, afterTask)
      })
    },

    scheduleFinishBulkActionHistory(delay = 0, force = false) {
      if (!this.pendingBulkActionHistory) {
        return
      }

      // Пока модалка массовых действий открыта, запросы ещё могут выполняться.
      // Не закрываем undo/redo-снимок после первого @updateTask: историю закрываем только после @close,
      // иначе undo получает неполный список.
      if (!force && this.isModalForBulkActions) {
        return
      }

      if (this.bulkActionHistoryFinishTimer) {
        clearTimeout(this.bulkActionHistoryFinishTimer)
      }

      this.bulkActionHistoryFinishTimer = setTimeout(() => {
        this.bulkActionHistoryFinishTimer = null
        this.finishBulkActionHistory(force)
      }, delay)
    },

    finishBulkActionHistory(force = false) {
      const history = this.pendingBulkActionHistory
      if (!history) {
        return
      }

      // Повторная проверка нужна: метод вызывается из таймера, модалку могли открыть заново после планирования
      if (!force && this.isModalForBulkActions) {
        return
      }

      // Если модалка закрылась раньше, чем пришли ответы по всем заявкам,
      // ждём остальные @updateTask, иначе в историю попадёт только первая заявка.
      if (!force && history.afterTasks.length < history.taskIds.length) {
        if (Date.now() - history.createdAt < 10000) {
          this.scheduleFinishBulkActionHistory(500)
          return
        }
      }

      const beforeById = new Map(history.beforeTasks.map(task => [task.id, task]))
      const afterTasks = history.taskIds
        .map(taskId => this.getBulkHistoryAfterTask(taskId))
        .filter(task => task?.id)
        .map(task => cloneBulkTask(task))
        .filter(task => !areBulkTasksEqual(beforeById.get(task.id), task))
      const afterIds = new Set(afterTasks.map(task => task.id))
      const beforeTasks = history.beforeTasks.filter(task => afterIds.has(task.id))

      if (beforeTasks.length === 0 || afterTasks.length === 0) {
        if (!force && Date.now() - history.createdAt < 3500) {
          this.scheduleFinishBulkActionHistory(500)
          return
        }

        this.pendingBulkActionHistory = null
        return
      }

      this.pendingBulkActionHistory = null

      this.bulkActionHistory.push({
        action: history.action,
        createdAt: history.createdAt,
        clientIdsByTaskId: history.clientIdsByTaskId || {},
        beforeTasks,
        afterTasks
      })

      if (this.bulkActionHistory.length > this.maxBulkActionHistorySize) {
        this.bulkActionHistory.shift()
      }

      this.bulkActionRedoHistory = []
      this.showBulkHistorySavedNotify(history.action, afterTasks.length)
    },

    showBulkHistorySavedNotify(action, count) {
      this.$q.notify({
        message: `Массовое действие сохранено в истории: ${getBulkActionLabel(action)} (${count})`,
        type: 'info',
        timeout: 5000,
        actions: [{
          label: 'Отменить',
          color: 'white',
          handler: () => this.undoBulkAction()
        }]
      })
    },

    getBulkTaskClientId(task, fallbackTask = null, clientIdsByTaskId = {}) {
      const taskId = task?.id || fallbackTask?.id
      if (taskId && clientIdsByTaskId?.[taskId]) {
        return clientIdsByTaskId[taskId]
      }

      return findBulkClientId([
        task,
        fallbackTask,
        taskId ? this.getStoreTaskById(taskId) : null,
        taskId ? this.getCheckedTaskById(taskId) : null
      ])
    },

    async saveBulkTaskSnapshot(task, fallbackTask = null, clientIdsByTaskId = {}) {
      const clientId = this.getBulkTaskClientId(task, fallbackTask, clientIdsByTaskId)
      if (!clientId) {
        throw new Error(`Не найден clientId для заявки ${task?.id || fallbackTask?.id || ''}`)
      }

      const response = await axios.patch(
        `/api/v1/client/${clientId}/task`,
        sanitizeBulkTaskForSave(task)
      )
      return response.data || task
    },

    async applyBulkHistorySnapshot(tasks, fallbackTasks = [], history = null) {
      const updatedTasks = []
      const fallbackById = new Map((fallbackTasks || []).map(task => [task.id, task]))
      const clientIdsByTaskId = history?.clientIdsByTaskId || {}

      for (const task of tasks) {
        const fallbackTask = fallbackById.get(task?.id) || null
        const savedTask = await this.saveBulkTaskSnapshot(task, fallbackTask, clientIdsByTaskId)
        const normalizedTask = savedTask?.id ? savedTask : task
        this.replaceTaskInLists(normalizedTask)
        updatedTasks.push(cloneBulkTask(normalizedTask))
      }
      return updatedTasks
    },

    async undoBulkAction() {
      if (this.isObserverUser) {
        return
      }
      if (this.pendingBulkActionHistory && this.hasPendingBulkActionHistoryChanges()) {
        if (this.bulkActionHistoryFinishTimer) {
          clearTimeout(this.bulkActionHistoryFinishTimer)
          this.bulkActionHistoryFinishTimer = null
        }
        this.finishBulkActionHistory(true)
      }

      if (!this.canUndoBulkAction || this.isBulkHistoryProcessing) {
        this.$q.notify({
          message: 'Нет массовых действий для отмены',
          type: 'warning'
        })
        return
      }

      const history = this.bulkActionHistory.pop()
      this.isBulkHistoryProcessing = true
      try {
        const restoredTasks = await this.applyBulkHistorySnapshot(history.beforeTasks, history.afterTasks, history)
        this.bulkActionRedoHistory.push({
          ...history,
          clientIdsByTaskId: history.clientIdsByTaskId || {},
          beforeTasks: restoredTasks,
          afterTasks: history.afterTasks
        })
        this.$q.notify({
          message: `Отменено: ${getBulkActionLabel(history.action)} (${restoredTasks.length})`,
          type: 'positive'
        })
      } catch (e) {
        this.bulkActionHistory.push(history)
        this.$q.notify({
          message: e.message || 'Не удалось отменить массовое действие',
          type: 'negative'
        })
      } finally {
        this.isBulkHistoryProcessing = false
      }
    },

    async redoBulkAction() {
      if (this.isObserverUser) {
        return
      }
      if (!this.canRedoBulkAction || this.isBulkHistoryProcessing) {
        return
      }

      const history = this.bulkActionRedoHistory.pop()
      this.isBulkHistoryProcessing = true
      try {
        const redoneTasks = await this.applyBulkHistorySnapshot(history.afterTasks, history.beforeTasks, history)
        this.bulkActionHistory.push({
          ...history,
          clientIdsByTaskId: history.clientIdsByTaskId || {},
          beforeTasks: history.beforeTasks,
          afterTasks: redoneTasks
        })
        this.$q.notify({
          message: `Повторено: ${getBulkActionLabel(history.action)} (${redoneTasks.length})`,
          type: 'positive'
        })
      } catch (e) {
        this.bulkActionRedoHistory.push(history)
        this.$q.notify({
          message: e.message || 'Не удалось повторить массовое действие',
          type: 'negative'
        })
      } finally {
        this.isBulkHistoryProcessing = false
      }
    },

    handleBulkHistoryShortcut(event) {
      if (this.isObserverUser) {
        return
      }
      if (!(event.ctrlKey || event.metaKey) || isBulkHistoryShortcutTargetIgnored(event.target)) {
        return
      }

      const key = event.key.toLowerCase()
      if (key === 'z' && event.shiftKey) {
        event.preventDefault()
        this.redoBulkAction()
        return
      }

      if (key === 'z') {
        event.preventDefault()
        this.undoBulkAction()
        return
      }

      if (key === 'y') {
        event.preventDefault()
        this.redoBulkAction()
      }
    },

    // Подписка на горячие клавиши undo/redo (вызывать из mounted / beforeUnmount страницы)
    addBulkHistoryShortcutListener() {
      window.addEventListener('keydown', this.handleBulkHistoryShortcut)
    },

    removeBulkHistoryShortcutListener() {
      window.removeEventListener('keydown', this.handleBulkHistoryShortcut)
    },

    clearBulkActionHistoryFinishTimer() {
      if (this.bulkActionHistoryFinishTimer) {
        clearTimeout(this.bulkActionHistoryFinishTimer)
      }
    }
  }
}
