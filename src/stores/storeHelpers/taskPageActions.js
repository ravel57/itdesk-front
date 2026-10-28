import axios from 'axios'
import moment from 'moment'

export const taskPageActions = {
  normalizeTaskPageTask(task) {
    if (!task) {
      return task
    }
    const normalizedTask = {...task}
    if (normalizedTask.createdAt) {
      normalizedTask.createdAt = new Date(normalizedTask.createdAt)
    }
    if (normalizedTask.deadline) {
      normalizedTask.deadline = new Date(normalizedTask.deadline)
    }
    if (normalizedTask.frozenFrom) {
      normalizedTask.frozenFrom = new Date(normalizedTask.frozenFrom)
    }
    if (normalizedTask.frozenUntil) {
      normalizedTask.frozenUntil = new Date(normalizedTask.frozenUntil)
    }
    if (normalizedTask.closedAt) {
      normalizedTask.closedAt = new Date(normalizedTask.closedAt)
    }
    if (normalizedTask.lastActivity) {
      normalizedTask.lastActivity = new Date(normalizedTask.lastActivity)
    }
    ;['enteredCurrentLineAt', 'olaStartedAt', 'olaDeadline', 'olaWarningAt', 'olaBreachedAt', 'firstResponseDeadline', 'firstResponseAt'].forEach(field => {
      if (normalizedTask[field]) {
        normalizedTask[field] = new Date(normalizedTask[field])
      }
    })
    if (normalizedTask.olaInfo && typeof normalizedTask.olaInfo === 'object') {
      normalizedTask.olaInfo = {...normalizedTask.olaInfo}
      ;['startedAt', 'deadline', 'warningAt', 'breachedAt'].forEach(field => {
        if (normalizedTask.olaInfo[field]) {
          normalizedTask.olaInfo[field] = new Date(normalizedTask.olaInfo[field])
        }
      })
    }
    if (normalizedTask.sla) {
      normalizedTask.sla = {...normalizedTask.sla}
      if (normalizedTask.sla.startDate) {
        normalizedTask.sla.startDate = moment(new Date(normalizedTask.sla.startDate), 'DD.MM.YYYY HH:mm')
      }
      if (normalizedTask.sla.duration !== undefined && normalizedTask.sla.duration !== null) {
        normalizedTask.sla.duration = moment.duration(normalizedTask.sla.duration * 1000)
      }
    }
    if (!Array.isArray(normalizedTask.messages)) {
      normalizedTask.messages = []
    }
    normalizedTask.messages = this.sortMessagesByDateAndId(
      normalizedTask.messages.map(message => ({
        ...message,
        date: message.date ? new Date(message.date) : message.date,
        editedAt: message.editedAt ? new Date(message.editedAt) : message.editedAt
      }))
    )
    return normalizedTask
  },

  mergeTaskPageTasks(currentTasks = [], newTasks = []) {
    const taskById = new Map()
    currentTasks.forEach(task => {
      if (task?.id !== undefined && task?.id !== null) {
        taskById.set(task.id, task)
      }
    })
    newTasks.forEach(task => {
      if (task?.id !== undefined && task?.id !== null) {
        taskById.set(task.id, task)
      }
    })
    return Array.from(taskById.values())
  },

  updateLoadedTaskPageTaskFromSocket(task) {
    if (!task?.id || !Array.isArray(this.taskPage?.tasks)) {
      return false
    }

    const index = this.taskPage.tasks.findIndex(item => {
      return Number(item?.id) === Number(task.id)
    })

    if (index === -1) {
      return false
    }

    const existingTask = this.taskPage.tasks[index]
    const normalizedTask = this.normalizeTaskPageTask({
      ...task,
      client: task.client?.id ? task.client : existingTask.client
    })

    this.taskPage.tasks.splice(index, 1, {
      ...existingTask,
      ...normalizedTask
    })

    return true
  },

  resetTaskPage() {
    this.taskPage = {
      tasks: [],
      page: 0,
      size: this.taskPage?.size || 10,
      totalElements: 0,
      totalPages: 0,
      isEnd: false
    }
  },

  fetchTasksPage(params = {}, append = false) {
    const request = {
      ...params,
      size: params.size || this.taskPage.size || 10
    }

    return axios.post('/api/v1/tasks-page', request)
      .then(response => {
        const tasks = Array.isArray(response.data?.tasks)
          ? response.data.tasks.map(task => this.normalizeTaskPageTask(task))
          : []

        const mergedTasks = append
          ? this.mergeTaskPageTasks(this.taskPage.tasks, tasks)
          : tasks

        this.taskPage = {
          tasks: mergedTasks,
          page: response.data?.page ?? request.page ?? 1,
          size: response.data?.size ?? request.size ?? this.taskPage.size,
          totalElements: response.data?.totalElements ?? tasks.length,
          totalPages: response.data?.totalPages ?? 0,
          isEnd: response.data?.isEnd ?? tasks.length === 0
        }

        return {
          ...this.taskPage,
          loadedTasks: tasks,
          responsePage: response.data?.page ?? request.page ?? 1,
          responseSize: response.data?.size ?? request.size ?? this.taskPage.size,
          responseTotalElements: response.data?.totalElements ?? tasks.length,
          responseTotalPages: response.data?.totalPages ?? 0,
          responseIsEnd: response.data?.isEnd ?? tasks.length === 0
        }
      })
  }
}
