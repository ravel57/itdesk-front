import { copyChecklist, normalizeChecklist } from 'src/util/taskDialog/checklist'
import { deadlineToDialogText, formatDeadlineInput, getUserName } from 'src/util/taskDialog/taskFormat'
import { getServiceLabel } from 'src/util/taskDialog/taskServices'
import { hasUnsavedTaskChanges } from 'src/util/taskDialog/taskDiff'

// Поля формы диалога заявки и их начальное заполнение (новая заявка / существующая),
// проверка несохранённых изменений, подстановка текста из сообщения «создать заявку из сообщения».
// Требует в компоненте: props task/isNewTask/client, this.store, this.router (setup),
// методы getDefaultTaskType, refreshFilteredUsers, loadSupportLineAssignableUsers (taskDialogDirectoriesMixin).
export default {
  data: () => ({
    dialogTaskId: '',
    dialogTaskName: '',
    dialogTaskDescription: '',
    dialogTaskPriority: '',
    dialogTaskSupportLine: '',
    dialogTaskService: '',
    dialogTaskExecutor: '',
    dialogTaskTags: [],
    dialogTaskStatus: '',
    dialogTaskDeadline: '',
    dialogTaskComplete: false,
    linkedMessageId: null,
    taskCreatedAt: '',

    taskId: null, // for update
    taskFieldsInitializing: false,

    dialogTaskType: ''
  }),

  computed: {
    getLinkedMessage () {
      const message = this.getNewTaskFromMessage()
      if (!message) {
        return []
      }
      return [
        {
          ...message,
          id: null,
          client: null
        }
      ]
    }
  },

  methods: {
    getCurrentTaskId () {
      return this.taskId || this.dialogTaskId || this.task?.id || null
    },

    // Снимок полей диалога для чистых функций из src/util/taskDialog
    getDialogFormSnapshot () {
      return {
        name: this.dialogTaskName,
        description: this.dialogTaskDescription,
        priority: this.dialogTaskPriority,
        type: this.dialogTaskType,
        service: this.dialogTaskService,
        checklist: this.dialogTaskChecklist,
        supportLine: this.dialogTaskSupportLine,
        executor: this.dialogTaskExecutor,
        tags: this.dialogTaskTags,
        deadline: this.dialogTaskDeadline,
        status: this.dialogTaskStatus,
        complete: this.dialogTaskComplete
      }
    },

    hasUnsavedTaskChanges () {
      return hasUnsavedTaskChanges(this.getDialogFormSnapshot(), this.task, this.isNewTask)
    },

    getTaskField () {
      this.taskFieldsInitializing = true
      if (this.isNewTask) {
        const messageText = this.getNewTaskFromMessageText()
        this.dialogTaskName = ''
        this.dialogTaskDescription = messageText
        this.dialogTaskPriority = this.store.priorities.find(priority => priority.defaultSelection === true)?.name || ''
        this.dialogTaskService = ''
        this.dialogTaskSupportLine = this.store.supportLines.find(line => line.defaultSelection === true && line.active !== false)?.name ||
          this.store.supportLines.find(line => line.active !== false)?.name || ''
        this.dialogTaskExecutor = ''
        this.dialogTaskTags = []
        this.dialogTaskDeadline = ''
        this.dialogTaskStatus = this.store.statuses.find(status => status.defaultSelection === true).name
        const defaultTaskType = this.getDefaultTaskType()
        this.dialogTaskType = defaultTaskType?.type || ''
        this.dialogTaskChecklist = defaultTaskType?.autoApplyChecklist !== false
          ? copyChecklist(normalizeChecklist(defaultTaskType.checklistTemplate))
          : []
        this.newChecklistItemText = ''
        this.$nextTick(() => {
          this.$refs.taskFields?.focusName?.()
        })
      } else {
        this.dialogTaskId = this.task.id
        this.dialogTaskName = this.task.name
        this.dialogTaskDescription = this.task.description
        this.dialogTaskPriority = this.task.priority?.name || ''
        this.dialogTaskService = getServiceLabel(this.task.service)
        this.dialogTaskSupportLine = this.task.supportLine?.name || ''
        this.dialogTaskExecutor = getUserName(this.task.executor)
        this.dialogTaskTags = this.task.tags.map(tag => tag.name)
        this.dialogTaskDeadline = deadlineToDialogText(this.task.deadline)
        this.taskId = this.task.id
        this.dialogTaskStatus = this.task.status.name
        this.taskCreatedAt = this.task.createdAt
        this.dialogTaskComplete = this.task.completed
        this.linkedMessageId = this.task.linkedMessageId
        this.dialogTaskType = this.task.type?.type || ''
        this.dialogTaskChecklist = normalizeChecklist(this.task.checklist)
        this.newChecklistItemText = ''
      }
      this.$nextTick(() => {
        this.refreshFilteredUsers()
        this.loadSupportLineAssignableUsers()
        this.taskFieldsInitializing = false
      })
    },

    // Маска ввода срока выполнения (@deadline-input из TaskFieldsPanel)
    formatDateTime () {
      this.dialogTaskDeadline = formatDeadlineInput(this.dialogTaskDeadline)
    },

    getNewTaskFromMessageId () {
      const queryParams = new URLSearchParams(window.location.search)
      const messageId = Number(queryParams.get('newTaskFromMessage'))
      return Number.isFinite(messageId) && messageId > 0 ? messageId : null
    },

    getNewTaskFromMessage () {
      const messageId = this.getNewTaskFromMessageId()
      if (!messageId) {
        return null
      }
      const clientId = Number(this.router.params.clientId)
      const client = this.store.clients.find(client => Number(client.id) === clientId) || this.client
      if (!client || !Array.isArray(client.messages)) {
        return null
      }
      return client.messages.find(message => Number(message.id) === messageId) || null
    },

    getNewTaskFromMessageText () {
      const message = this.getNewTaskFromMessage()
      return String(message?.text || '').trim()
    }
  }
}
