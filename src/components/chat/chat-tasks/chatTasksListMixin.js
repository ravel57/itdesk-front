import { applyActualLinkedMessageIds, filterTasksForList, sortTasksForDemo } from 'src/util/chatTasks/taskList'

// Итоговый список заявок для отображения (поиск, закрытые, демо-сортировка) и синхронизация
// привязанных к сообщениям заявок с родительским списком tasks.
// Требует в компоненте: props tasks/onboardingDemo, pagedTasks, pingedTasks, selectedTask, isDemoClient,
// search, isShowCompletedTasks, selectedSorting, ascendingSort, compareTasksBySla, this.$can.
export default {
  computed: {
    // Раздел заявок может быть закрыт менеджеру организации в настройках
    canViewTasks () {
      return Boolean(this.onboardingDemo) || this.$can('TASK_VIEW')
    },

    getActualTasks () {
      const sourceTasks = this.isDemoClient
        ? (this.tasks || [])
        : applyActualLinkedMessageIds(this.pagedTasks, this.tasks)
      const filteredTasks = filterTasksForList(sourceTasks, this.isShowCompletedTasks, this.search)
      if (this.isDemoClient && this.selectedSorting.slug) {
        sortTasksForDemo(filteredTasks, this.selectedSorting.slug, this.ascendingSort, this.compareTasksBySla)
      }
      return filteredTasks
    },
  },

  methods: {
    setTaskLinkedMessageId (taskId, linkedMessageId) {
      const normalizedTaskId = Number(taskId)
      if (!Number.isFinite(normalizedTaskId) || normalizedTaskId <= 0) {
        return
      }
      const normalizedLinkedMessageId = linkedMessageId === null || linkedMessageId === undefined
        ? null
        : Number(linkedMessageId)

      this.pagedTasks = (this.pagedTasks || []).map(task => {
        return Number(task?.id) === normalizedTaskId
          ? {
              ...task,
              linkedMessageId: normalizedLinkedMessageId
            }
          : task
      })

      this.pingedTasks = (this.pingedTasks || []).map(task => {
        return Number(task?.id) === normalizedTaskId
          ? {
              ...task,
              linkedMessageId: normalizedLinkedMessageId
            }
          : task
      })

      if (Number(this.selectedTask?.id) === normalizedTaskId) {
        this.selectedTask = {
          ...this.selectedTask,
          linkedMessageId: normalizedLinkedMessageId
        }
      }
    },

    syncLinkedMessageIdsFromParent (tasks = []) {
      if (!Array.isArray(tasks) || !Array.isArray(this.pagedTasks) || this.pagedTasks.length === 0) {
        return
      }

      const parentTaskById = new Map(
        tasks
          .filter(task => task?.id !== undefined && task?.id !== null)
          .map(task => [Number(task.id), task])
      )
      let changed = false
      const nextPagedTasks = this.pagedTasks.map(task => {
        const parentTask = parentTaskById.get(Number(task?.id))
        if (!parentTask) {
          return task
        }
        const currentLinkedMessageId = task?.linkedMessageId ?? null
        const actualLinkedMessageId = parentTask?.linkedMessageId ?? null
        const sameLinkedMessage = currentLinkedMessageId === null && actualLinkedMessageId === null
          ? true
          : Number(currentLinkedMessageId) === Number(actualLinkedMessageId)
        if (sameLinkedMessage) {
          return task
        }
        changed = true
        return {
          ...task,
          linkedMessageId: actualLinkedMessageId
        }
      })

      if (changed) {
        this.pagedTasks = nextPagedTasks
      }

      const selectedTaskId = Number(this.selectedTask?.id)
      if (selectedTaskId) {
        const parentTask = parentTaskById.get(selectedTaskId)
        if (parentTask) {
          const selectedLinkedMessageId = this.selectedTask?.linkedMessageId ?? null
          const actualLinkedMessageId = parentTask?.linkedMessageId ?? null
          const sameLinkedMessage = selectedLinkedMessageId === null && actualLinkedMessageId === null
            ? true
            : Number(selectedLinkedMessageId) === Number(actualLinkedMessageId)
          if (!sameLinkedMessage) {
            this.selectedTask = {
              ...this.selectedTask,
              linkedMessageId: actualLinkedMessageId
            }
          }
        }
      }
    },
  }
}
