import axios from 'axios'
import { onTaskMessage, onTaskUpdated } from 'src/util/ws'
import { normalizeTaskMessage, upsertTaskMessage } from 'src/util/taskDialog/taskMessages'

// Подписки на websocket-события заявки: новые сообщения (onTaskMessage) и обновление заявки
// (onTaskUpdated -> отложенная перезагрузка истории).
// subscribeToTaskEvents вызывается из mounted, unsubscribeFromTaskEvents — из beforeUnmount.
// Требует в компоненте: props task/client, this.store, taskRightTab, isTaskDialogOperator,
// localTaskMessages и loadTaskFiles (taskDialogMessagesMixin), getCurrentTaskId, loadTaskHistory.
export default {
  data: () => ({
    taskMessageUnsubscribe: null,
    taskUpdatedUnsubscribe: null,
    taskHistoryRefreshTimer: null
  }),

  methods: {
    subscribeToTaskEvents () {
      this.taskMessageUnsubscribe = onTaskMessage(this.onTaskMessage)
      this.taskUpdatedUnsubscribe = onTaskUpdated(this.onTaskUpdated)
    },

    unsubscribeFromTaskEvents () {
      if (this.taskMessageUnsubscribe) {
        this.taskMessageUnsubscribe()
        this.taskMessageUnsubscribe = null
      }
      if (this.taskUpdatedUnsubscribe) {
        this.taskUpdatedUnsubscribe()
        this.taskUpdatedUnsubscribe = null
      }
      if (this.taskHistoryRefreshTimer) {
        clearTimeout(this.taskHistoryRefreshTimer)
        this.taskHistoryRefreshTimer = null
      }
    },

    onTaskMessage (payload) {
      if (Number(payload.taskId) !== Number(this.task.id)) {
        return
      }
      const normalizedMessage = normalizeTaskMessage(payload.message)
      if (!normalizedMessage?.id) {
        return
      }
      this.localTaskMessages = upsertTaskMessage(this.localTaskMessages, normalizedMessage)
      if (payload.message?.fileUuid) {
        this.loadTaskFiles()
      }
      // mark-message-read на backend разрешён только поддержке, не OBSERVER.
      if (this.taskRightTab === 'messages' && this.isTaskDialogOperator) {
        axios.post(`/api/v1/client/${this.client.id}/task/${this.task.id}/mark-message-read`, {
          userId: this.store.currentUser.id
        })
      }
    },

    onTaskUpdated (payload) {
      const updatedTaskId = payload?.task?.id
      if (!updatedTaskId || Number(updatedTaskId) !== Number(this.getCurrentTaskId())) {
        return
      }
      if (this.taskRightTab !== 'history') {
        return
      }
      if (this.taskHistoryRefreshTimer) {
        clearTimeout(this.taskHistoryRefreshTimer)
      }
      // Событие истории сохраняется в той же транзакции, что и действие
      // автоматизации. Небольшая задержка не даёт запросу опередить commit.
      this.taskHistoryRefreshTimer = setTimeout(() => {
        this.taskHistoryRefreshTimer = null
        this.loadTaskHistory()
      }, 300)
    }
  }
}
