<template>
  <q-page class="client-portal-page">
    <div class="client-portal-chat-shell">
      <div v-if="initialLoading" class="client-portal-state">
        <q-spinner color="primary" size="42px"/>
        <div class="text-grey-7 q-mt-md">Загружаем переписку…</div>
      </div>

      <div v-else-if="loadError" class="client-portal-state q-pa-lg">
        <q-icon name="error_outline" size="52px" color="negative"/>
        <div class="text-subtitle1 q-mt-md">Не удалось загрузить чат</div>
        <div class="text-body2 text-grey-7 q-mt-xs text-center">
          {{ loadError }}
        </div>
        <q-btn
          class="q-mt-lg"
          color="primary"
          label="Повторить"
          :loading="initialLoading"
          @click="initialize"
        />
      </div>

      <template v-else>
        <div
          v-if="activeIncidents.length"
          class="client-portal-incidents q-pa-sm"
        >
          <q-card
            v-for="incident in activeIncidents"
            :key="incident.id"
            flat
            bordered
            class="client-portal-incident-card"
          >
            <q-card-section class="row items-start q-col-gutter-sm">
              <div class="col">
                <div class="row items-center q-gutter-sm">
                  <q-chip dense :color="incidentSeverityColor(incident.severity)" text-color="white">
                    {{ incident.severity }}
                  </q-chip>
                  <strong>{{ incident.incidentNumber }} — {{ incident.title }}</strong>
                </div>
                <div class="text-body2 q-mt-xs">
                  {{
                    incident.publicDescription || incident.impactSummary || 'Поддержка работает над восстановлением сервиса.'
                  }}
                </div>
                <div v-if="incident.lastUpdate?.text" class="text-caption text-grey-8 q-mt-xs">
                  Последнее обновление: {{ incident.lastUpdate.text }}
                </div>
                <div class="text-caption text-grey-7 q-mt-xs">
                  Статус: {{ incidentStatusLabel(incident.status) }}
                  <span v-if="incident.nextUpdateAt"> · Следующее обновление: {{
                      formatDate(incident.nextUpdateAt)
                    }}</span>
                </div>
              </div>
              <div
                v-if="incident.recoveryConfirmationAvailable && ['RESTORED', 'MONITORING'].includes(incident.status)"
                class="col-12 col-sm-auto"
              >
                <q-btn
                  :color="incident.recoveryConfirmed ? 'positive' : 'primary'"
                  :outline="incident.recoveryConfirmed"
                  :icon="incident.recoveryConfirmed ? 'check_circle' : 'done_all'"
                  :label="incident.recoveryConfirmed ? 'Восстановление подтверждено' : 'Подтвердить восстановление'"
                  :loading="incidentConfirmingId === incident.id"
                  :disable="incident.recoveryConfirmed"
                  @click="confirmIncidentRecovery(incident)"
                />
              </div>
            </q-card-section>
          </q-card>
        </div>

        <chat-dialog
          :messages="messages"
          :input-field="inputField"
          :templates="[]"
          :is-sending="isSending"
          :upload-progress="uploadProgress"
          :typing="[]"
          :current-user="currentUser"
          :linked-message-id="null"
          :tasks="[]"
          :task-watching-now="[]"
          :is-show-helper="false"
          :is-mobile="isMobile"
          :client="client"
          :is-end="isEnd"
          :pending-new-messages-count="0"
          :has-trimmed-newer-messages="false"
          :comments="false"
          :show-answer-required-actions="false"
          :client-files="clientFiles"
          :portal-mode="true"
          :allow-message-mutations="false"
          :show-internal-actions="false"
          :show-helper-action="false"
          :show-files-action="true"
          :chat-height="chatHeight"
          @sendMessage="sendMessage"
          @keyPressed="inputField = $event"
          @isSending="isSending = true"
          @pastToInputField="pasteToInputField"
          @getMessagePage="loadOlder"
          @goToLatestMessages="refreshLatest"
        />
      </template>

      <q-inner-loading :showing="loadingOlder">
        <q-spinner color="primary" size="36px"/>
      </q-inner-loading>
    </div>
  </q-page>
</template>

<script>
import axios from 'axios'
import { getUploadProgress } from 'src/util/messageFileUpload'
import ChatDialog from 'components/chat/ChatDialog.vue'
import {useStore} from 'stores/store'
import {
  connectClientPortalSocket,
  disconnectClientPortalSocket
} from 'src/util/clientPortalWs'

export default {
  name: 'ClientPortalPage',
  components: {ChatDialog},
  emits: ['profile-loaded'],

  data: () => ({
    profile: null,
    messages: [],
    page: 1,
    isEnd: true,
    inputField: '',
    initialLoading: true,
    loadingLatest: false,
    loadingOlder: false,
    isSending: false,
    uploadProgress: null,
    loadError: '',
    socketConnected: false,
    historyLoaded: false,
    activeIncidents: [],
    incidentsLoading: false,
    incidentConfirmingId: null,
    incidentsRefreshTimer: null,
  }),

  computed: {
    isMobile() {
      return this.$q.screen.lt.md
    },

    chatHeight() {
      return this.activeIncidents.length
        ? 'calc(100vh - 350px)'
        : 'calc(100vh - 170px)'
    },

    currentUser() {
      if (this.store.currentUser) {
        return this.store.currentUser
      }
      return {
        id: this.profile?.userId,
        username: this.profile?.username || '',
        firstname: this.profile?.firstname || '',
        lastname: this.profile?.lastname || '',
        authorities: ['CLIENT']
      }
    },

    client() {
      return {
        id: this.profile?.clientId,
        firstname: this.profile?.firstname || '',
        lastname: this.profile?.lastname || '',
        username: this.profile?.username || '',
        organization: this.profile?.organizationId
          ? {
            id: this.profile.organizationId,
            name: this.profile.organizationName
          }
          : null
      }
    },

    clientFiles() {
      return this.messages
        .filter(message => Boolean(message?.fileUuid))
        .map(message => ({
          uuid: message.fileUuid,
          name: message.fileName || message.fileUuid,
          type: message.fileType || '',
          date: message.date
        }))
    }
  },

  async mounted() {
    document.title = 'ULDESK : Клиентский портал'
    await this.initialize()
    this.incidentsRefreshTimer = window.setInterval(() => this.loadActiveIncidents(false), 30000)
  },

  beforeUnmount() {
    disconnectClientPortalSocket()
    if (this.incidentsRefreshTimer) {
      window.clearInterval(this.incidentsRefreshTimer)
      this.incidentsRefreshTimer = null
    }
  },

  methods: {
    async initialize() {
      this.initialLoading = true
      this.loadError = ''
      this.historyLoaded = false
      disconnectClientPortalSocket()

      try {
        await this.loadProfile()
        await this.loadActiveIncidents(false)

        // Сначала получаем полную начальную порцию по HTTP. Сокет подключается
        // только после этого и используется исключительно для добавления или
        // обновления отдельных сообщений. Он никогда не заменяет историю.
        await this.loadInitialMessages()
        this.connectPortalSocket()
      } catch (error) {
        disconnectClientPortalSocket()
        this.socketConnected = false
        this.loadError = this.getErrorMessage(error, 'Не удалось загрузить клиентский портал')
      } finally {
        this.initialLoading = false
      }
    },

    connectPortalSocket() {
      connectClientPortalSocket({
        onMessage: payload => {
          if (!this.historyLoaded || !payload) {
            return
          }

          const socketMessages = Array.isArray(payload) ? payload : [payload]
          this.mergeMessages(socketMessages)
        },
        onMessageDeleted: messageId => {
          if (!this.historyLoaded || messageId === null || messageId === undefined) {
            return
          }
          this.removeMessage(messageId)
        },
        onConnected: () => {
          this.socketConnected = true
        },
        onDisconnected: () => {
          this.socketConnected = false
        },
        onError: error => {
          console.error('Ошибка сокета клиентского портала', error)
        }
      })
    },

    async loadActiveIncidents(showError = true) {
      if (this.incidentsLoading || document.hidden) {
        return
      }
      this.incidentsLoading = true
      try {
        const response = await axios.get('/api/v1/client/incidents/active')
        this.activeIncidents = Array.isArray(response.data) ? response.data : []
      } catch (error) {
        if (showError) {
          this.notifyError(error, 'Не удалось загрузить активные инциденты')
        } else {
          console.error('Не удалось обновить активные инциденты', error)
        }
      } finally {
        this.incidentsLoading = false
      }
    },

    async confirmIncidentRecovery(incident) {
      if (!incident?.id || this.incidentConfirmingId) {
        return
      }
      this.incidentConfirmingId = incident.id
      try {
        const response = await axios.patch(
          `/api/v1/client/incident/${encodeURIComponent(incident.id)}/recovery-confirmation`,
          {confirmed: true}
        )
        const updated = response.data
        const index = this.activeIncidents.findIndex(item => Number(item.id) === Number(incident.id))
        if (index >= 0) {
          this.activeIncidents.splice(index, 1, updated)
        }
        this.$q.notify({
          type: 'positive',
          message: 'Спасибо, восстановление подтверждено',
          position: 'top-right',
          actions: [{
            icon: 'close',
            color: 'white',
            dense: true,
            handler: () => undefined
          }]
        })
      } catch (error) {
        this.notifyError(error, 'Не удалось подтвердить восстановление')
      } finally {
        this.incidentConfirmingId = null
      }
    },

    incidentSeverityColor(severity) {
      return {P1: 'negative', P2: 'deep-orange', P3: 'warning', P4: 'grey-7'}[severity] || 'grey-7'
    },

    incidentStatusLabel(status) {
      return {
        DRAFT: 'Черновик', VERIFYING: 'Проверка', DECLARED: 'Объявлен',
        DIAGNOSIS: 'Диагностика', MITIGATION: 'Устранение', MONITORING: 'Наблюдение',
        RESTORED: 'Восстановлен', CLOSED: 'Закрыт', CANCELLED: 'Отменён'
      }[status] || status || '—'
    },

    formatDate(value) {
      if (!value) {
        return '—'
      }
      const date = new Date(value)
      return Number.isNaN(date.getTime())
        ? '—'
        : date.toLocaleString('ru-RU', {day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'})
    },

    async loadProfile() {
      const response = await axios.get('/api/v1/portal/profile')
      this.profile = response.data
      this.$emit('profile-loaded', response.data)
    },

    async loadInitialMessages() {
      const response = await axios.get('/api/v1/portal/messages', {
        params: {page: 1}
      })
      const pageData = this.extractMessagePage(response.data)

      // Единственное место, где начальная история заменяет пустой локальный
      // список. После historyLoaded сокет и повторные запросы только объединяют
      // сообщения и не могут очистить уже показанную переписку.
      this.messages = this.normalizeMessages(pageData.messages)
      this.page = 1
      this.isEnd = pageData.isEnd
      this.historyLoaded = true
    },

    async refreshLatest() {
      if (this.loadingLatest || this.isSending || this.initialLoading || document.hidden) {
        return
      }
      this.loadingLatest = true
      try {
        const response = await axios.get('/api/v1/portal/messages', {
          params: {page: 1}
        })
        const pageData = this.extractMessagePage(response.data)
        this.mergeMessages(pageData.messages)
        this.isEnd = pageData.isEnd
      } catch (error) {
        console.error('Не удалось обновить сообщения клиентского портала', error)
      } finally {
        this.loadingLatest = false
      }
    },

    async loadOlder() {
      if (this.loadingOlder || this.isEnd) {
        return
      }
      this.loadingOlder = true
      try {
        const nextPage = this.page + 1
        const response = await axios.get(`/api/v1/portal/messages?page=${nextPage}`)
        const pageData = this.extractMessagePage(response.data)
        this.mergeMessages(pageData.messages)
        this.page = nextPage
        this.isEnd = pageData.isEnd
      } catch (error) {
        this.notifyError(error, 'Не удалось загрузить предыдущие сообщения')
      } finally {
        this.loadingOlder = false
      }
    },

    async sendMessage(event) {
      const message = event?.message || {}
      const attachedFiles = Array.isArray(event?.attachedFiles) ? event.attachedFiles : []
      this.isSending = true

      try {
        const requests = await this.buildMessageRequests(message, attachedFiles)
        for (const request of requests) {
          const response = await axios.post('/api/v1/portal/messages', request)
          this.mergeMessages([response.data])
        }
        this.inputField = ''
      } catch (error) {
        this.notifyError(error, 'Не удалось отправить сообщение')
      } finally {
        this.uploadProgress = null
        this.isSending = false
      }
    },

    async buildMessageRequests(message, attachedFiles) {
      const text = String(message?.text || '')
      const replyMessageId = message?.replyMessageId || null

      if (attachedFiles.length === 0) {
        return [{text, replyMessageId}]
      }

      const formData = new FormData()
      attachedFiles.forEach(file => formData.append('files', file))
      this.uploadProgress = 0
      const uploadResponse = await axios.post('/files/upload', formData, {
        headers: {'Content-Type': 'multipart/form-data'},
        onUploadProgress: progressEvent => {
          this.uploadProgress = getUploadProgress(progressEvent)
        }
      })
      this.uploadProgress = 1
      const fileUuids = Array.isArray(uploadResponse.data) ? uploadResponse.data : []

      if (fileUuids.length !== attachedFiles.length) {
        throw new Error('Сервер вернул некорректный результат загрузки файлов')
      }

      return fileUuids.map((fileUuid, index) => ({
        text: index === 0 ? text : '',
        fileUuid,
        fileName: attachedFiles[index]?.name || '',
        fileType: attachedFiles[index]?.type || '',
        replyMessageId
      }))
    },

    pasteToInputField(text) {
      const value = String(text || '').trim()
      if (!value) {
        return
      }
      this.inputField = this.inputField
        ? `${this.inputField}\n${value}`
        : value
    },

    extractMessagePage(payload) {
      if (Array.isArray(payload)) {
        return {messages: payload, isEnd: true}
      }

      const messages = Array.isArray(payload?.messages)
        ? payload.messages
        : (Array.isArray(payload?.content) ? payload.content : [])

      return {
        messages,
        isEnd: payload?.isEnd !== false
      }
    },

    normalizeMessages(messages) {
      if (!Array.isArray(messages)) {
        return []
      }
      const normalized = messages
        .filter(Boolean)
        .map(message => this.toChatMessage(message))
        .sort(this.compareMessages)

      return this.enrichReplyMessages(normalized)
    },

    toChatMessage(message) {
      const fromClient = message.fromClient === true || (
        message.fromClient === undefined && message.isSent === true
      )
      const senderName = String(
        message.senderName ||
        (fromClient ? this.profile?.clientName : 'Поддержка') ||
        ''
      ).trim()

      return {
        ...message,
        fromClient,
        senderName,
        date: this.toDate(message.date),
        editedAt: this.toDate(message.editedAt),
        isSent: fromClient,
        isRead: true,
        isComment: false,
        deleted: false,
        fileName: message.fileName || '',
        fileType: message.fileType || '',
        user: fromClient
          ? this.currentUser
          : {
            id: null,
            username: senderName,
            firstname: senderName || 'Поддержка',
            lastname: ''
          }
      }
    },

    enrichReplyMessages(messages) {
      const byId = new Map(messages.map(message => [Number(message.id), message]))
      return messages.map(message => {
        if (!message.replyMessageId) {
          return message
        }
        const repliedMessage = byId.get(Number(message.replyMessageId))
        if (!repliedMessage) {
          return message
        }
        return {
          ...message,
          replyMessageText: repliedMessage.text || '',
          replyFileType: repliedMessage.fileType || null,
          replyUuid: repliedMessage.fileUuid || null
        }
      })
    },

    mergeMessages(incoming) {
      const normalizedIncoming = this.normalizeMessages(incoming)
      if (normalizedIncoming.length === 0) {
        return
      }

      // Не пересобираем список только по id: старые/мигрированные сообщения
      // иногда могут прийти без id. Такое пересобирание и было способно удалить
      // всю HTTP-историю при первом событии сокета.
      const merged = [...this.messages]
      normalizedIncoming.forEach(message => {
        const index = this.findMessageIndex(merged, message)
        if (index >= 0) {
          merged.splice(index, 1, {...merged[index], ...message})
        } else {
          merged.push(message)
        }
      })

      this.messages = this.enrichReplyMessages(merged.sort(this.compareMessages))
    },

    removeMessage(messageId) {
      const normalizedId = String(messageId)
      const remaining = this.messages.filter(message => (
        message?.id === undefined ||
        message?.id === null ||
        String(message.id) !== normalizedId
      ))

      if (remaining.length === this.messages.length) {
        return
      }

      this.messages = this.enrichReplyMessages(remaining)
    },

    findMessageIndex(messages, candidate) {
      if (candidate?.id !== undefined && candidate?.id !== null) {
        const candidateId = String(candidate.id)
        return messages.findIndex(message => (
          message?.id !== undefined &&
          message?.id !== null &&
          String(message.id) === candidateId
        ))
      }

      const candidateKey = this.getMessageFallbackKey(candidate)
      return messages.findIndex(message => (
        (message?.id === undefined || message?.id === null) &&
        this.getMessageFallbackKey(message) === candidateKey
      ))
    },

    getMessageFallbackKey(message) {
      return [
        this.getMessageTime(message),
        message?.fromClient === true ? 'client' : 'support',
        String(message?.text || ''),
        String(message?.fileUuid || ''),
        String(message?.replyMessageId || '')
      ].join('|')
    },

    compareMessages(left, right) {
      const dateDiff = this.getMessageTime(left) - this.getMessageTime(right)
      if (dateDiff !== 0) {
        return dateDiff
      }
      return Number(left?.id || 0) - Number(right?.id || 0)
    },

    getMessageTime(message) {
      const date = message?.date instanceof Date
        ? message.date
        : new Date(message?.date || 0)
      const time = date.getTime()
      return Number.isFinite(time) ? time : 0
    },

    toDate(value) {
      if (!value) {
        return null
      }
      const date = value instanceof Date ? value : new Date(value)
      return Number.isNaN(date.getTime()) ? null : date
    },

    getErrorMessage(error, fallback) {
      return error?.response?.data?.message || error?.message || fallback
    },

    notifyError(error, fallback) {
      this.$q.notify({
        type: 'negative',
        message: this.getErrorMessage(error, fallback),
        position: 'top-right',
        actions: [{
          icon: 'close',
          color: 'white',
          dense: true,
          handler: () => undefined
        }]
      })
    }
  },

  setup() {
    const store = useStore()
    return {store}
  }
}
</script>

<style scoped>
.client-portal-page {
  min-height: calc(100vh - 64px);
  height: calc(100vh - 64px);
  overflow: hidden;
  background: #f0f0f0;
}

.client-portal-chat-shell {
  position: relative;
  width: 100%;
  max-width: 1180px;
  height: 100%;
  margin: 0 auto;
  overflow: hidden;
  background: white;
  border-right: 1px solid rgba(0, 0, 0, 0.08);
  border-left: 1px solid rgba(0, 0, 0, 0.08);
}

.client-portal-incidents {
  max-height: 180px;
  overflow-y: auto;
  background: #f7f7f9;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}

.client-portal-incident-card + .client-portal-incident-card {
  margin-top: 8px;
}

.client-portal-state {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

@media (max-width: 1023px) {
  .client-portal-chat-shell {
    border-right: 0;
    border-left: 0;
  }
}
</style>
