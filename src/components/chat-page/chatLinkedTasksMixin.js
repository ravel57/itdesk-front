import axios from 'axios'
import { uniqueTasksById, getLinkedTaskIdFromMessage } from 'src/util/chatPage/messages'

// Заявки открытого клиента и их привязка к сообщениям чата.
export default {
  data: () => ({
    currentClientTasks: []
  }),

  methods: {
    newTask(task) {
      this.upsertCurrentClientTask(task?.data || task)
    },

    updateTask(oldTask, newTask) {
      this.upsertCurrentClientTask(newTask?.data || newTask)
    },

    onClientTasksLoaded(tasks) {
      this.currentClientTasks = Array.isArray(tasks) ? tasks : []
      this.syncMessagesLinkedTaskIds()
    },

    upsertCurrentClientTask(task) {
      if (!task || !task.id) {
        return
      }
      const index = this.currentClientTasks.findIndex(item => Number(item.id) === Number(task.id))
      if (index === -1) {
        this.currentClientTasks = [task, ...this.currentClientTasks]
      } else {
        const nextTasks = [...this.currentClientTasks]
        nextTasks.splice(index, 1, {
          ...nextTasks[index],
          ...task
        })
        this.currentClientTasks = nextTasks
      }
      this.syncMessagesLinkedTaskIds()
    },

    linkToTask(message, oldTask) {
      const taskId = Number(oldTask?.id)
      const latestTask = this.currentClientTasks.find(item => Number(item?.id) === taskId) || oldTask
      const task = {
        id: latestTask.id,
        name: latestTask.name,
        description: latestTask.description,
        status: latestTask.status,
        priority: latestTask.priority,
        executor: latestTask.executor,
        tags: latestTask.tags,
        completed: latestTask.completed,
        createdAt: latestTask.createdAt,
        deadline: latestTask.deadline,
        linkedMessageId: latestTask.linkedMessageId,
        sla: latestTask.sla
      }
      const newLinkedMessageId = Number(message?.id)
      const previousLinkedMessageId = latestTask?.linkedMessageId ?? null
      const tasksPreviouslyLinkedToSelectedMessage = this.currentClientTasks.filter(item => {
        return Number(item?.id) !== taskId &&
          Number(item?.linkedMessageId) === newLinkedMessageId
      })

      axios.post(`/api/v1/client/${this.getClient.id}/link-message-to-task`, {message, task})
        .then(() => {
          tasksPreviouslyLinkedToSelectedMessage.forEach(previousTask => {
            this.upsertCurrentClientTask({
              ...previousTask,
              linkedMessageId: null
            })
            this.$refs.chatTasks?.setTaskLinkedMessageId(previousTask.id, null)
          })

          this.upsertCurrentClientTask({
            ...latestTask,
            linkedMessageId: newLinkedMessageId
          })
          this.$refs.chatTasks?.setTaskLinkedMessageId(taskId, newLinkedMessageId)

          const nextMessages = (this.getClient.messages || []).map(item => {
            const itemId = Number(item?.id)
            let linkedTaskId = item?.linkedTaskId ?? null

            if (previousLinkedMessageId !== null &&
                itemId === Number(previousLinkedMessageId) &&
                Number(linkedTaskId) === taskId) {
              linkedTaskId = null
            }
            if (itemId === newLinkedMessageId) {
              linkedTaskId = latestTask.id
            }

            return linkedTaskId === (item?.linkedTaskId ?? null)
              ? item
              : {
                  ...item,
                  linkedTaskId
                }
          })
          this.setClientMessages(nextMessages)
        })
        .catch(e => {
          this.$q.notify({
            message: e.message,
            type: 'negative'
          })
        })
    },

    findLinkedTaskByMessage(message) {
      const tasks = this.getCurrentChatTasksForLinkedSearch()
      const linkedTaskId = getLinkedTaskIdFromMessage(message)
      if (linkedTaskId) {
        const taskById = tasks.find(task => Number(task.id) === linkedTaskId)

        if (taskById) {
          return taskById
        }
      }
      if (message?.id) {
        const messageId = Number(message.id)
        const taskByMessageId = tasks.find(task => Number(task.linkedMessageId) === messageId)
        if (taskByMessageId) {
          return taskByMessageId
        }
      }
      return null
    },

    async openLinkedTask(message) {
      const task = await this.resolveLinkedTaskByMessage(message)
      if (!task) {
        this.$q.notify({
          message: 'Связанная заявка не найдена',
          type: 'negative'
        })
        return
      }
      if (this.isMobile) {
        this.tab = 'tab3'
      }
      this.$nextTick(() => {
        const chatTasks = this.$refs.chatTasks
        if (chatTasks?.openLinkedTask) {
          chatTasks.openLinkedTask(task)
          return
        }
        this.$q.notify({
          message: 'Не найден компонент заявок',
          type: 'negative'
        })
      })
    },

    getCurrentChatTasksForLinkedSearch() {
      // currentClientTasks is the live source used by ChatTasks. Put it last so
      // uniqueTasksById keeps the freshest task when getClient.tasks still has
      // the pre-relink linkedMessageId.
      return uniqueTasksById([
        ...(Array.isArray(this.getClient?.tasks) ? this.getClient.tasks : []),
        ...(Array.isArray(this.currentClientTasks) ? this.currentClientTasks : [])
      ])
    },

    syncMessagesLinkedTaskIds() {
      const messages = this.getClient?.messages
      const tasks = this.getCurrentChatTasksForLinkedSearch()
      if (!Array.isArray(messages)) {
        return
      }

      const linkedTaskByMessageId = new Map()
      tasks.forEach(task => {
        const messageId = Number(task?.linkedMessageId)
        if (Number.isFinite(messageId) && messageId > 0 && task?.id) {
          linkedTaskByMessageId.set(messageId, Number(task.id))
        }
      })

      let changed = false
      const nextMessages = messages.map(message => {
        if (!message?.id) {
          return message
        }
        const linkedTaskId = linkedTaskByMessageId.get(Number(message.id)) ?? null
        const currentLinkedTaskId = getLinkedTaskIdFromMessage(message)
        if (currentLinkedTaskId === linkedTaskId) {
          return message
        }
        changed = true
        return {
          ...message,
          linkedTaskId
        }
      })

      if (changed) {
        this.setClientMessages(nextMessages)
      }
    },

    async resolveLinkedTaskByMessage(message) {
      const localTask = this.findLinkedTaskByMessage(message)
      if (localTask) {
        return localTask
      }
      const linkedTaskId = getLinkedTaskIdFromMessage(message)
      if (!linkedTaskId) {
        return null
      }
      return this.loadLinkedTaskById(linkedTaskId, message)
    },

    async loadLinkedTaskById(taskId, message = null) {
      if (!taskId || !this.getClient?.id) {
        return null
      }
      try {
        const response = await axios.post('/api/v1/tasks-page', {
          page: 1,
          size: 10,
          includeCompleted: true,
          search: String(taskId),
          filterJoinOperator: 'AND',
          filterChain: [],
          requiredFilterChain: [],
          sortSlug: 'creating',
          ascendingSort: false,
          clientId: this.getClient.id
        })
        const tasks = Array.isArray(response.data?.tasks) ? response.data.tasks : []
        const task = tasks.find(item => Number(item?.id) === Number(taskId))
        if (!task) {
          return null
        }
        if (message?.id && !task.linkedMessageId) {
          task.linkedMessageId = message.id
        }
        this.upsertCurrentClientTask(task)
        const linkedMessage = this.getClient?.messages?.find(item => {
          return Number(item?.id) === Number(message?.id)
        })
        if (linkedMessage) {
          linkedMessage.linkedTaskId = task.id
        }
        return task
      } catch (e) {
        this.$q.notify({
          message: e.message || 'Не удалось загрузить связанную заявку',
          type: 'negative'
        })
        return null
      }
    },
  },
}
