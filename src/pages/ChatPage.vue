<template>
  <div>
    <div
      v-if="this.isMobile"
      class="sticky-tabs"
    >
      <q-tabs
        v-model="tab"
        dense
        align="justify"
        class="bg-primary text-white"
        :breakpoint="0"
      >
        <q-tab name="tab1" icon="forum"/>
        <q-tab name="tab2" icon="database" v-if="this.isShowHelper || this.isMobile"/>
        <q-tab name="tab3" icon="info"/>
      </q-tabs>
    </div>
    <q-page
      style="min-height: auto"
    >
      <div
        ref="chatPageLayout"
        class="chat-page-layout"
        :class="{ 'chat-page-layout-mobile': this.isMobile }"
        :style="this.isMobile ? 'height: calc(100vh - 90px)' : desktopGridStyle"
      >
        <div
          data-tour="chat-dialog-column"
          v-if="!this.isMobile || this.tab === 'tab1'"
          id="chatColumn"
          class="chat-page-column no-shadow"
        >
          <chat-dialog
            :isMobile="this.isMobile"
            :messages="this.getClient.messages"
            :inputField="this.inputField"
            :templates="this.activeTemplates"
            :isSending="this.isSending"
            :clientId="this.getClient.id"
            :typing="this.getClient.typingUsers"
            :currentUser="this.store.currentUser"
            :linkedMessageId="this.linkedMessageId"
            :tasks="this.getClient.tasks"
            :task-watching-now="this.getClient.watchingUsers"
            :deleteClient="this.deleteClient"
            :isShowHelper="this.isShowHelper"
            :client="this.getClient"
            :isEnd="this.isEnd"
            @sendMessage="this.sendMessage"
            @keyPressed="this.keyPressed($event)"
            @updated="this.markMessagesRead"
            @isSending="this.isSending = true"
            @pastToInputField="pastToInputField"
            @linkToTask="this.linkToTask"
            @clearLinkedMessageId="this.clearLinkedMessageId"
            @deleteMessage="this.deleteMessage"
            @showHelper="this.showHelper"
            @getMessagePage="this.getMessagePage"
            @scrollToMessageAfterSearch="this.getMessageOnSearch($event)"
            @setAnswerRequired="setAnswerRequired"
            @findInKnowledgeBase="this.findInKnowledgeBase"
            @editMessage="this.editMessage"
            @openLinkedTask="this.openLinkedTask"
          />
        </div>
        <div
          v-if="!this.isMobile && isHelperVisible"
          class="chat-page-column-resizer"
          @mousedown="startColumnResize('chat-helper', $event)"
        />
        <div
          v-if="!this.isMobile && !isHelperVisible"
          class="chat-page-column-resizer"
          @mousedown="startColumnResize('chat-tasks', $event)"
        />
        <div
          data-tour="chat-helper-wrapper"
          class="chat-page-column no-shadow"
          v-if="(!this.isMobile || this.tab === 'tab2') && (this.isShowHelper || this.isMobile) && ['ADMIN', 'OPERATOR'].includes(this.store.currentUser?.authorities?.[0])"
        >
          <chat-helper
            :isMobile="this.isMobile"
            :templates="this.activeTemplates"
            :knowledgeBase="this.activeKnowledgeBase"
            :ai-query-from-message="this.helperAiQueryFromMessage"
            :ai-query-version="this.helperAiQueryVersion"
            @onTemplateClick="onTemplateClick"
            @hideHelper="this.hideHelper"
          />
        </div>

        <div
          v-if="!this.isMobile && isHelperVisible"
          class="chat-page-column-resizer"
          @mousedown="startColumnResize('helper-tasks', $event)"
        />

        <div
          data-tour="chat-tasks-wrapper"
          class="chat-page-column chat-page-tasks-column no-shadow"
          v-if="!this.isMobile || this.tab === 'tab3'"
        >
          <chat-tasks
            ref="chatTasks"
            :tasks="this.getClient.tasks"
            :isNotificationEnabled="isNotificationEnabled"
            :tags="this.activeTags"
            :users="this.activeUsers"
            :organizations="this.activeOrganizations"
            :client="this.getClient"
            :statuses="this.activeStatuses"
            :priorities="this.activePriorities"
            :is-mobile="this.isMobile"
            :request-status-change-reason="this.requestStatusChangeReasonIfNeeded"
            @newTask="this.newTask"
            @updateTask="this.updateTask"
            @scrollToElementById="this.getLinkedMessage($event)"
          />
        </div>
      </div>
    </q-page>

    <q-dialog
      v-model="this.statusReasonDialog"
      persistent
    >
      <q-card style="width: 520px; max-width: 95vw;">
        <q-toolbar class="justify-between">
          <div class="text-h6">
            {{ this.statusReasonDialogTitle }}
          </div>

          <q-btn
            flat
            round
            dense
            icon="close"
            @click="this.cancelStatusReasonDialog"
          />
        </q-toolbar>

        <q-card-section>
          <div class="text-body2 q-mb-md">
            {{ this.statusReasonDialogMessage }}
          </div>

          <q-input
            v-model="this.statusReasonText"
            type="textarea"
            autogrow
            autofocus
            label="Причина *"
            :error="this.statusReasonError"
            error-message="Обязательное поле"
            @keyup.ctrl.enter="this.confirmStatusReasonDialog"
          />
        </q-card-section>

        <q-card-actions align="right">
          <q-btn
            flat
            color="primary"
            label="Отмена"
            @click="this.cancelStatusReasonDialog"
          />

          <q-btn
            color="primary"
            label="Продолжить"
            @click="this.confirmStatusReasonDialog"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-btn
      v-if="!isChatOnboardingActive"
      class="chat-onboarding-launch-btn"
      round
      dense
      color="primary"
      icon="help_outline"
      @click="startChatOnboarding(true)"
    >
      <q-tooltip>Показать обучение по экрану чата</q-tooltip>
    </q-btn>

    <div
      v-if="isChatOnboardingActive"
      class="chat-onboarding-backdrop"
    />
    <div
      v-if="isChatOnboardingActive && chatOnboardingTargetRect"
      class="chat-onboarding-highlight"
      :style="chatOnboardingHighlightStyle"
    />
    <q-card
      v-if="isChatOnboardingActive && currentChatOnboardingStep"
      class="chat-onboarding-card no-shadow"
      :style="chatOnboardingCardStyle"
    >
      <div class="chat-onboarding-step-counter">
        Шаг {{ chatOnboardingStepIndex + 1 }} из {{ chatOnboardingSteps.length }}
      </div>
      <div class="text-subtitle1 chat-onboarding-title">
        {{ currentChatOnboardingStep.title }}
      </div>
      <div class="text-body2 chat-onboarding-text">
        {{ currentChatOnboardingStep.text }}
      </div>
      <div class="chat-onboarding-actions">
        <q-btn
          flat
          dense
          no-caps
          label="Пропустить"
          @click="finishChatOnboarding"
        />
        <q-space/>
        <q-btn
          flat
          dense
          no-caps
          label="Назад"
          :disable="chatOnboardingStepIndex === 0"
          @click="prevChatOnboardingStep"
        />
        <q-btn
          color="primary"
          dense
          no-caps
          :label="isLastChatOnboardingStep ? 'Готово' : 'Далее'"
          @click="nextChatOnboardingStep"
        />
      </div>
    </q-card>

  </div>
</template>

<script>
import ChatDialog from 'components/chat/ChatDialog.vue'
import ChatHelper from 'components/chat/ChatHelper.vue'
import ChatTasks from 'components/chat/ChatTasks.vue'
import { useStore } from 'stores/store'
import { useRoute } from 'vue-router'
import { markRead, typing } from 'src/util/ws'
import axios from 'axios'

export default {
  components: { ChatTasks, ChatHelper, ChatDialog },

  data: () => ({
    tab: 'tab1',
    inputField: '',
    isComment: false,
    isNotificationEnabled: true,
    isSending: false,
    linkedMessageId: null,
    routeMessageIdHandled: false,
    isShowHelper: true,
    isEnd: false,
    pageCounter: 0,
    messagesLoadedForCurrentChat: false,

    statusReasonDialog: false,
    statusReasonDialogTitle: '',
    statusReasonDialogMessage: '',
    statusReasonText: '',
    statusReasonError: false,
    statusReasonResolve: null,
    helperAiQueryFromMessage: '',
    helperAiQueryVersion: 0,

    chatOnboardingStorageKey: 'chat-page-onboarding-v1',
    isChatOnboardingActive: typeof localStorage !== 'undefined' && localStorage.getItem('chat-page-onboarding-v1') !== 'done',
    chatOnboardingStepIndex: 0,
    chatOnboardingTargetRect: null,
    chatOnboardingCardStyle: {},
    chatOnboardingMoveDirection: 1,
    chatOnboardingPreviousInputField: '',
    chatOnboardingPreviousIsShowHelper: true,
    chatOnboardingDemoClient: {
      id: -100500,
      firstname: 'Иван',
      lastname: 'Петров',
      username: 'ivan.petrov',
      messageFrom: 'TELEGRAM',
      sourceChannel: 'Telegram / Поддержка',
      moreInfo: 'VIP-клиент, договор № 42, нужен быстрый первый ответ',
      organization: {
        id: -100500,
        name: 'ООО Демо-Сервис'
      },
      typingUsers: [],
      watchingUsers: [],
      typingMessageText: {},
      messages: [
        {
          id: -100501,
          text: 'Добрый день! Не получается войти в личный кабинет, пишет ошибку авторизации.',
          date: new Date(Date.now() - 1000 * 60 * 35),
          isSent: false,
          isComment: false,
          isRead: false,
          deleted: false,
          answerRequired: 'ANSWER_NOT_REQUIRED'
        },
        {
          id: -100502,
          text: 'Здравствуйте! Проверю доступ и подскажу, что нужно сделать.',
          date: new Date(Date.now() - 1000 * 60 * 28),
          isSent: true,
          isComment: false,
          isRead: true,
          deleted: false,
          user: {
            id: -100501,
            firstname: 'Оператор',
            lastname: 'Поддержки',
            username: 'operator'
          }
        },
        {
          id: -100503,
          text: 'Сейчас еще появилась ошибка при восстановлении пароля. Нужно ответить клиенту.',
          date: new Date(Date.now() - 1000 * 60 * 9),
          isSent: false,
          isComment: false,
          isRead: false,
          deleted: false,
          answerRequired: 'ANSWER_REQUIRED'
        }
      ],
      tasks: [
        {
          id: -100501,
          name: 'Проверить доступ клиента',
          description: 'Клиент не может войти в личный кабинет. Нужно проверить учетную запись и отправить инструкцию.',
          status: { id: -100501, name: 'В работе', orderNumber: 2 },
          priority: { id: -100501, name: 'Высокий', critical: true, orderNumber: 3 },
          executor: { id: -100501, firstname: 'Оператор', lastname: 'Поддержки' },
          tags: [{ id: -100501, name: 'Доступ' }, { id: -100502, name: 'VIP' }],
          completed: false,
          frozen: false,
          createdAt: new Date(Date.now() - 1000 * 60 * 35),
          deadline: new Date(Date.now() + 1000 * 60 * 90),
          linkedMessageId: -100503,
          sla: {
            startDate: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
            duration: 'PT2H'
          }
        }
      ]
    },
    chatOnboardingDemoTemplates: [
      { id: -100501, shortcut: 'hello', text: 'Здравствуйте! Уже проверяю ваш вопрос и скоро вернусь с ответом.' },
      { id: -100502, shortcut: 'access', text: 'Попробуйте восстановить пароль по ссылке. Если ошибка повторится, пришлите скриншот.' }
    ],
    chatOnboardingDemoKnowledgeBase: [
      { id: -100501, title: 'Проблемы со входом в личный кабинет', text: 'Проверить статус пользователя, блокировку, актуальность email и историю попыток входа.', tags: [{ id: -100501, name: 'Доступ' }] },
      { id: -100502, title: 'Инструкция по восстановлению пароля', text: 'Попросить клиента открыть страницу восстановления пароля и проверить письмо во входящих и спаме.', tags: [{ id: -100502, name: 'Пароль' }] }
    ],
    chatOnboardingDemoTags: [
      { id: -100501, name: 'Доступ' },
      { id: -100502, name: 'VIP' },
      { id: -100503, name: 'Пароль' }
    ],
    chatOnboardingDemoUsers: [
      { id: -100501, firstname: 'Оператор', lastname: 'Поддержки', username: 'operator' }
    ],
    chatOnboardingDemoOrganizations: [
      { id: -100500, name: 'ООО Демо-Сервис' }
    ],
    chatOnboardingDemoStatuses: [
      { id: -100501, name: 'Новая', orderNumber: 1 },
      { id: -100502, name: 'В работе', orderNumber: 2 }
    ],
    chatOnboardingDemoPriorities: [
      { id: -100501, name: 'Обычный', critical: false, orderNumber: 1 },
      { id: -100502, name: 'Высокий', critical: true, orderNumber: 3 }
    ],

    chatColumnWidth: 0,
    helperColumnWidth: 0,
    tasksColumnWidth: 0,

    columnResizeStorageKey: 'chatPage.columnWidthRatios',
    columnWidthRatios: {
      chat: 0.56,
      helper: 0.22,
      tasks: 0.22
    },

    minChatColumnWidth: 420,
    minHelperColumnWidth: 260,
    minTasksColumnWidth: 452,

    resizingColumn: null,
    resizeStartX: 0,
    resizeStartLeftWidth: 0,
    resizeStartRightWidth: 0
  }),

  methods: {
    getRealClientByRoute() {
      const clientId = Number(this.router.params.clientId)
      return this.store.clients.find(client => client.id === clientId)
    },

    loadCurrentChatData() {
      const client = this.getRealClientByRoute()
      if (!client || this.messagesLoadedForCurrentChat) {
        return
      }
      this.getMessagePage()
      this.markMessagesRead()
      this.initCurrentChatDraft()
      this.messagesLoadedForCurrentChat = true
    },

    initCurrentChatDraft() {
      const client = this.getRealClientByRoute()
      const currentUserId = this.store.currentUser?.id
      const draft = client?.typingMessageText?.[currentUserId]
      if (draft) {
        this.inputField = draft
      }
    },

    startChatOnboarding(force = false) {
      if (!force && localStorage.getItem(this.chatOnboardingStorageKey) === 'done') {
        return
      }
      this.chatOnboardingPreviousInputField = this.inputField
      this.chatOnboardingPreviousIsShowHelper = this.isShowHelper
      this.isChatOnboardingActive = true
      this.chatOnboardingStepIndex = 0
      this.inputField = 'Здравствуйте! Уже проверяю ваш вопрос.'
      this.isShowHelper = true
      this.$nextTick(() => {
        this.goToChatOnboardingStep(0, 1)
      })
    },

    finishChatOnboarding() {
      localStorage.setItem(this.chatOnboardingStorageKey, 'done')
      this.isChatOnboardingActive = false
      this.chatOnboardingTargetRect = null
      this.chatOnboardingCardStyle = {}
      this.inputField = this.chatOnboardingPreviousInputField
      this.isShowHelper = this.chatOnboardingPreviousIsShowHelper
      this.$nextTick(() => {
        this.loadCurrentChatData()
        this.applyColumnWidthsFromRatios()
      })
    },

    nextChatOnboardingStep() {
      if (this.isLastChatOnboardingStep) {
        this.finishChatOnboarding()
        return
      }
      this.goToChatOnboardingStep(this.chatOnboardingStepIndex + 1, 1)
    },

    prevChatOnboardingStep() {
      if (this.chatOnboardingStepIndex === 0) {
        return
      }
      this.goToChatOnboardingStep(this.chatOnboardingStepIndex - 1, -1)
    },

    goToChatOnboardingStep(index, direction = 1) {
      this.chatOnboardingMoveDirection = direction
      this.chatOnboardingStepIndex = Math.max(0, Math.min(index, this.chatOnboardingSteps.length - 1))
      this.prepareCurrentChatOnboardingStep()
      this.$nextTick(() => {
        setTimeout(() => {
          this.updateChatOnboardingPosition(direction)
        }, 120)
      })
    },

    prepareCurrentChatOnboardingStep() {
      const step = this.currentChatOnboardingStep
      if (!step) {
        return
      }
      if (step.tab && this.isMobile) {
        this.tab = step.tab
      }
      if (step.requiresHelper) {
        this.isShowHelper = true
      }
      if (!this.isMobile) {
        this.$nextTick(() => {
          this.applyColumnWidthsFromRatios()
        })
      }
    },

    updateChatOnboardingPosition(direction = this.chatOnboardingMoveDirection, attempts = 0) {
      if (!this.isChatOnboardingActive || !this.currentChatOnboardingStep) {
        return
      }

      const target = document.querySelector(`[data-tour="${this.currentChatOnboardingStep.target}"]`)

      if (!target) {
        if (attempts < 4) {
          setTimeout(() => this.updateChatOnboardingPosition(direction, attempts + 1), 120)
          return
        }
        const nextIndex = this.chatOnboardingStepIndex + (direction >= 0 ? 1 : -1)
        if (nextIndex >= 0 && nextIndex < this.chatOnboardingSteps.length) {
          this.goToChatOnboardingStep(nextIndex, direction)
        } else {
          this.finishChatOnboarding()
        }
        return
      }

      const rect = target.getBoundingClientRect()
      const padding = 8
      const cardWidth = Math.min(360, window.innerWidth - 32)
      const cardHeight = 230
      let top = rect.bottom + 14
      let left = rect.left

      if (top + cardHeight > window.innerHeight - 16) {
        top = rect.top - cardHeight - 14
      }
      if (top < 16) {
        top = 16
      }
      if (left + cardWidth > window.innerWidth - 16) {
        left = window.innerWidth - cardWidth - 16
      }
      if (left < 16) {
        left = 16
      }

      this.chatOnboardingTargetRect = {
        top: rect.top - padding,
        left: rect.left - padding,
        width: rect.width + padding * 2,
        height: rect.height + padding * 2
      }
      this.chatOnboardingCardStyle = {
        top: `${top}px`,
        left: `${left}px`,
        width: `${cardWidth}px`
      }
    },

    onChatOnboardingWindowChange() {
      if (!this.isChatOnboardingActive) {
        return
      }
      this.$nextTick(() => {
        this.updateChatOnboardingPosition()
      })
    },

    onTemplateClick(text) {
      this.inputField += ' ' + text
    },

    sendMessage(event) {
      if (this.isChatOnboardingActive) {
        this.isSending = false
        this.inputField = ''
        return
      }
      if (event.attachedFiles && event.attachedFiles.length > 0) {
        const formData = new FormData()
        event.attachedFiles.forEach(file => {
          formData.append('files', file)
        })
        axios.post('/files/upload', formData, {headers: {'Content-Type': 'multipart/form-data'}})
          .then(response => {
            response.data.map((fileUuid, index) => ({
              ...event.message,
              text: event.message.text || '',
              fileUuid,
              fileName: event.attachedFiles[index].name,
              fileType: event.attachedFiles[index].type,
              isComment: event.message.isComment === true,
              isSent: true,
              isRead: true,
            })).forEach(message => {
              this.sendTextMessage(message)
            })
          })
          .catch(e =>
            this.$q.notify({
              message: e.message,
              type: 'negative',
              position: 'top-right',
              actions: [{
                icon: 'close', color: 'white', dense: true, handler: () => undefined
              }]
            }))
      } else {
        this.sendTextMessage(event.message)
      }
    },

    sendTextMessage(message) {
      if (this.isChatOnboardingActive) {
        this.isSending = false
        return
      }
      axios.post(`/api/v1/client/${this.getClient.id}/message`, message)
        .then((response) => {
          this.isSending = false
          const savedMessage = response.data
          if (savedMessage && savedMessage.id) {
            this.addOrUpdateClientMessage(savedMessage)
          }
          this.keyPressed('')
        })
        .catch(e =>
          this.$q.notify({
            message: e.message,
            type: 'negative',
            position: 'top-right',
            actions: [{
              icon: 'close', color: 'white', dense: true, handler: () => undefined
            }]
          }))
    },

    addOrUpdateClientMessage (message) {
      if (!this.getClient || !Array.isArray(this.getClient.messages)) {
        return
      }
      const normalizedMessage = this.normalizeReplyMessage(
        this.normalizeClientMessage(message)
      )
      const index = this.getClient.messages.findIndex(item =>
        Number(item.id) === Number(normalizedMessage.id)
      )
      if (index === -1) {
        this.getClient.messages.push(normalizedMessage)
      } else {
        this.getClient.messages.splice(index, 1, {
          ...this.getClient.messages[index],
          ...normalizedMessage
        })
      }
      this.getClient.messages = [...this.getClient.messages]
        .sort((a, b) => new Date(a.date) - new Date(b.date))
    },

    normalizeClientMessage (message) {
      if (!message) {
        return message
      }
      return {
        ...message,
        date: message.date instanceof Date
          ? message.date
          : new Date(message.date),
        editedAt: message.editedAt
          ? new Date(message.editedAt)
          : message.editedAt
      }
    },

    normalizeReplyMessage (message) {
      if (!message || !message.replyMessageId || message.replyMessageText) {
        return message
      }
      const repliedMessage = this.getClient.messages.find(item =>
        Number(item.id) === Number(message.replyMessageId)
      )
      return {
        ...message,
        replyMessageText: repliedMessage?.text || '',
        replyFileType: message.replyFileType || repliedMessage?.fileType || null,
        replyUuid: message.replyUuid || repliedMessage?.fileUuid || null
      }
    },

    keyPressed(text) {
      this.inputField = text
      if (this.isChatOnboardingActive) {
        return
      }
      typing(this.getClient, this.store.currentUser, text)
    },

    markMessagesRead() {
      if (this.isChatOnboardingActive) {
        return
      }
      if (this.getClient.id) {
        markRead(this.getClient)
      }
    },

    updateClient(newClient) {
      this.store.clients[this.store.clients.indexOf(this.getClient)] = newClient
    },

    newTask(task) {
      this.getClient.tasks.push(task.data)
    },

    updateTask(oldTask, newTask) {
      const updatedTask = newTask.data ? newTask.data : newTask
      const index = this.getClient.tasks.findIndex(task => task.id === updatedTask.id)
      if (index !== -1) {
        this.getClient.tasks[index] = updatedTask
      }
    },

    pastToInputField(text) {
      this.inputField = text
      typing(this.getClient, this.store.currentUser, text)
    },

    linkToTask(message, oldTask) {
      const task = {
        id: oldTask.id,
        name: oldTask.name,
        description: oldTask.description,
        status: oldTask.status,
        priority: oldTask.priority,
        executor: oldTask.executor,
        tags: oldTask.tags,
        completed: oldTask.completed,
        createdAt: oldTask.createdAt,
        deadline: oldTask.deadline,
        linkedMessageId: oldTask.linkedMessageId,
        sla: oldTask.sla
      }
      axios.post(`/api/v1/client/${this.getClient.id}/link-message-to-task`, {message, task})
        .then(() => {
          const previousMessage = this.getClient.messages.find(msg => Number(msg.id) === Number(oldTask.linkedMessageId))
          if (previousMessage) {
            previousMessage.linkedTaskId = null
          }

          const linkedMessage = this.getClient.messages.find(msg => Number(msg.id) === Number(message.id))
          if (linkedMessage) {
            linkedMessage.linkedTaskId = oldTask.id
          }

          const previousTask = this.getClient.tasks.find(task => Number(task.linkedMessageId) === Number(message.id))
          if (previousTask && Number(previousTask.id) !== Number(oldTask.id)) {
            previousTask.linkedMessageId = null
          }

          const linkedTask = this.getClient.tasks.find(task => Number(task.id) === Number(oldTask.id))
          if (linkedTask) {
            linkedTask.linkedMessageId = message.id
          }
        })
        .catch(e => {
          this.$q.notify({
            message: e.message,
            type: 'negative',
            position: 'top-right',
            actions: [{
              icon: 'close', color: 'white', dense: true, handler: () => undefined
            }]
          })
        })
    },

    getLinkedTaskIdFromMessage (message) {
      if (!message) {
        return null
      }

      const linkedTaskId = message.linkedTaskId

      if (linkedTaskId && typeof linkedTaskId === 'object') {
        const id = Number(linkedTaskId.id || linkedTaskId.taskId || linkedTaskId.value)
        return Number.isFinite(id) && id > 0 ? id : null
      }

      const id = Number(linkedTaskId)
      return Number.isFinite(id) && id > 0 ? id : null
    },

    findLinkedTaskByMessage (message) {
      const tasks = this.getClient?.tasks || []
      const linkedTaskId = this.getLinkedTaskIdFromMessage(message)

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

    openLinkedTask (message) {
      const task = this.findLinkedTaskByMessage(message)
      if (!task) {
        this.$q.notify({
          message: 'Связанная заявка не найдена в текущем чате',
          type: 'warning',
          position: 'top-right',
          actions: [{ icon: 'close', color: 'white', dense: true, handler: () => undefined }]
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
          type: 'warning',
          position: 'top-right',
          actions: [{ icon: 'close', color: 'white', dense: true, handler: () => undefined }]
        })
      })
    },

    clearLinkedMessageId() {
      this.linkedMessageId = null
    },

    deleteMessage(message) {
      axios.delete(`/api/v1/client/${this.getClient.id}/delete-message/${message.id}`)
        .catch(e => {
          this.$q.notify({
            message: e.message,
            type: 'negative',
            position: 'top-right',
            actions: [{
              icon: 'close', color: 'white', dense: true, handler: () => undefined
            }]
          })
        })
    },

    deleteClient() {
      this.store.clients = this.store.clients.filter(client => client.id !== this.getClient.id)
      this.$router.push('/')
    },

    showHelper() {
      this.isShowHelper = true
      localStorage.setItem('isShowHelper', 'true')
    },

    hideHelper() {
      this.isShowHelper = false
      this.tab = 'tab1'
      localStorage.setItem('isShowHelper', 'false')
      this.$nextTick(() => {
        this.applyColumnWidthsFromRatios()
      })
    },

    getMessagePage(pageCounter = 0) {
      if (this.isChatOnboardingActive) {
        return
      }
      this.pageCounter += pageCounter
      if (this.pageCounter <= 1) {
        this.getClient.messages = this.store.currentChatMessageData.messages
        this.isEnd = this.store.currentChatMessageData.isEnd
      } else {
        axios.get(`/api/v1/client/${this.getClient.id}/messages-page?page=${this.pageCounter}`)
          .then(response => {
            const messages = response.data.messages
            this.isEnd = response.data.isEnd
            messages.forEach(message => {
              message.date = new Date(message.date)
            })
            this.getClient.messages = messages.concat(this.getClient.messages)
          })
      }
    },

    getMessageOnSearch(messageId) {
      if (this.isChatOnboardingActive) {
        return
      }
      const id = Number(messageId)
      if (!id || !this.getClient.id) {
        return
      }
      axios.get(`/api/v1/client/${this.getClient.id}/linked-message?linkedMessageId=${id}`)
        .then(response => {
          const messages = response.data.messages || []
          this.pageCounter = response.data.page
          this.isEnd = response.data.isEnd
          messages.forEach(message => {
            message.date = new Date(message.date)
          })
          this.getClient.messages = messages
          this.$nextTick(() => {
            setTimeout(() => {
              this.linkedMessageId = id
            }, 100)
          })
        })
    },

    getLinkedMessage(task) {
      if (this.isChatOnboardingActive) {
        this.linkedMessageId = task.linkedMessageId
        return
      }
      const taskWithLinkedMessage = this.getClient.messages.filter(m => m.id === task.linkedMessageId)
      if (taskWithLinkedMessage.length > 0) {
        this.linkedMessageId = task.linkedMessageId
      } else {
        axios.get(`/api/v1/client/${this.getClient.id}/linked-message?linkedMessageId=${task.linkedMessageId}`)
          .then(response => {
            const messages = response.data.messages
            this.pageCounter = response.data.page
            this.isEnd = response.data.isEnd
            messages.forEach(message => {
              message.date = new Date(message.date)
            })
            this.getClient.messages = messages
            setTimeout(() => {
              this.linkedMessageId = task.linkedMessageId
            }, 100)
          })
      }
    },

    initColumnWidths() {
      if (this.isMobile || !this.$refs.chatPageLayout) {
        return
      }

      const savedRatios = localStorage.getItem(this.columnResizeStorageKey)

      if (savedRatios) {
        try {
          const parsedRatios = JSON.parse(savedRatios)

          if (
            Number(parsedRatios.chat) > 0 &&
            Number(parsedRatios.helper) > 0 &&
            Number(parsedRatios.tasks) > 0
          ) {
            this.columnWidthRatios = {
              chat: Number(parsedRatios.chat),
              helper: Number(parsedRatios.helper),
              tasks: Number(parsedRatios.tasks)
            }
          }
        } catch (e) {
          localStorage.removeItem(this.columnResizeStorageKey)
        }
      }

      this.applyColumnWidthsFromRatios()
    },

    startColumnResize(resizeType, event) {
      if (this.isMobile) {
        return
      }
      this.resizingColumn = resizeType
      this.resizeStartX = event.clientX
      if (resizeType === 'chat-helper') {
        this.resizeStartLeftWidth = this.chatColumnWidth
        this.resizeStartRightWidth = this.helperColumnWidth
      }
      if (resizeType === 'helper-tasks') {
        this.resizeStartLeftWidth = this.helperColumnWidth
        this.resizeStartRightWidth = this.tasksColumnWidth
      }
      if (resizeType === 'chat-tasks') {
        this.resizeStartLeftWidth = this.chatColumnWidth
        this.resizeStartRightWidth = this.tasksColumnWidth
      }
      document.body.style.userSelect = 'none'
      document.body.style.cursor = 'col-resize'
      window.addEventListener('mousemove', this.resizeColumns)
      window.addEventListener('mouseup', this.stopColumnResize)
    },

    resizeColumns(event) {
      if (!this.resizingColumn) {
        return
      }
      const delta = event.clientX - this.resizeStartX
      const minChatWidth = this.minChatColumnWidth
      const minHelperWidth = this.minHelperColumnWidth
      const minTasksWidth = this.minTasksColumnWidth
      if (this.resizingColumn === 'chat-helper') {
        const totalWidth = this.resizeStartLeftWidth + this.resizeStartRightWidth
        let nextChatWidth = this.resizeStartLeftWidth + delta
        let nextHelperWidth = this.resizeStartRightWidth - delta
        if (nextChatWidth < minChatWidth) {
          nextChatWidth = minChatWidth
          nextHelperWidth = totalWidth - nextChatWidth
        }
        if (nextHelperWidth < minHelperWidth) {
          nextHelperWidth = minHelperWidth
          nextChatWidth = totalWidth - nextHelperWidth
        }
        this.chatColumnWidth = nextChatWidth
        this.helperColumnWidth = nextHelperWidth
      }
      if (this.resizingColumn === 'helper-tasks') {
        const totalWidth = this.resizeStartLeftWidth + this.resizeStartRightWidth
        let nextHelperWidth = this.resizeStartLeftWidth + delta
        let nextTasksWidth = this.resizeStartRightWidth - delta
        if (nextHelperWidth < minHelperWidth) {
          nextHelperWidth = minHelperWidth
          nextTasksWidth = totalWidth - nextHelperWidth
        }
        if (nextTasksWidth < minTasksWidth) {
          nextTasksWidth = minTasksWidth
          nextHelperWidth = totalWidth - nextTasksWidth
        }
        this.helperColumnWidth = nextHelperWidth
        this.tasksColumnWidth = nextTasksWidth
      }
      if (this.resizingColumn === 'chat-tasks') {
        const totalWidth = this.resizeStartLeftWidth + this.resizeStartRightWidth
        let nextChatWidth = this.resizeStartLeftWidth + delta
        let nextTasksWidth = this.resizeStartRightWidth - delta
        if (nextChatWidth < minChatWidth) {
          nextChatWidth = minChatWidth
          nextTasksWidth = totalWidth - nextChatWidth
        }
        if (nextTasksWidth < minTasksWidth) {
          nextTasksWidth = minTasksWidth
          nextChatWidth = totalWidth - nextTasksWidth
        }
        this.chatColumnWidth = nextChatWidth
        this.tasksColumnWidth = nextTasksWidth
      }
    },

    stopColumnResize() {
      if (this.resizingColumn) {
        this.saveColumnWidths()
      }

      this.resizingColumn = null

      document.body.style.userSelect = ''
      document.body.style.cursor = ''

      window.removeEventListener('mousemove', this.resizeColumns)
      window.removeEventListener('mouseup', this.stopColumnResize)
    },

    saveColumnWidths() {
      if (this.isHelperVisible) {
        const totalWidth = this.chatColumnWidth + this.helperColumnWidth + this.tasksColumnWidth
        if (totalWidth <= 0) {
          return
        }
        this.columnWidthRatios = {
          chat: this.chatColumnWidth / totalWidth,
          helper: this.helperColumnWidth / totalWidth,
          tasks: this.tasksColumnWidth / totalWidth
        }
      } else {
        const totalWidth = this.chatColumnWidth + this.tasksColumnWidth
        if (totalWidth <= 0) {
          return
        }
        const helperRatio = this.columnWidthRatios.helper || 0.22
        const availableRatio = 1 - helperRatio
        this.columnWidthRatios = {
          chat: availableRatio * (this.chatColumnWidth / totalWidth),
          helper: helperRatio,
          tasks: availableRatio * (this.tasksColumnWidth / totalWidth)
        }
      }
      localStorage.setItem(
        this.columnResizeStorageKey,
        JSON.stringify(this.columnWidthRatios)
      )
    },

    applyColumnWidthsFromRatios() {
      if (this.isMobile || !this.$refs.chatPageLayout) {
        return
      }
      const layoutWidth = this.$refs.chatPageLayout.clientWidth
      const resizersWidth = this.isHelperVisible ? 16 : 8
      const availableWidth = layoutWidth - resizersWidth
      if (availableWidth <= 0) {
        return
      }
      if (this.isHelperVisible) {
        const widths = this.calculateColumnsByRatios(
          availableWidth,
          ['chat', 'helper', 'tasks'],
          {
            chat: this.minChatColumnWidth,
            helper: this.minHelperColumnWidth,
            tasks: this.minTasksColumnWidth
          }
        )
        this.chatColumnWidth = widths.chat
        this.helperColumnWidth = widths.helper
        this.tasksColumnWidth = widths.tasks
      } else {
        const widths = this.calculateColumnsByRatios(
          availableWidth,
          ['chat', 'tasks'],
          {
            chat: this.minChatColumnWidth,
            tasks: this.minTasksColumnWidth
          }
        )
        this.chatColumnWidth = widths.chat
        this.tasksColumnWidth = widths.tasks
      }
    },

    calculateColumnsByRatios(availableWidth, columns, minWidths) {
      const result = {}
      let remainingWidth = availableWidth
      let remainingColumns = [...columns]

      while (remainingColumns.length > 0) {
        const ratioSum = remainingColumns.reduce((sum, column) => {
          return sum + this.columnWidthRatios[column]
        }, 0)
        const tooSmallColumns = []
        remainingColumns.forEach(column => {
          const width = remainingWidth * (this.columnWidthRatios[column] / ratioSum)

          if (width < minWidths[column]) {
            result[column] = minWidths[column]
            tooSmallColumns.push(column)
          }
        })
        if (tooSmallColumns.length === 0) {
          remainingColumns.forEach(column => {
            result[column] = Math.round(
              remainingWidth * (this.columnWidthRatios[column] / ratioSum)
            )
          })
          break
        }
        tooSmallColumns.forEach(column => {
          remainingWidth -= minWidths[column]
        })
        remainingColumns = remainingColumns.filter(column => !tooSmallColumns.includes(column))
        if (remainingWidth <= 0) {
          remainingColumns.forEach(column => {
            result[column] = minWidths[column]
          })
          break
        }
      }
      return result
    },

    handleWindowResize() {
      if (this.resizingColumn) {
        return
      }
      this.applyColumnWidthsFromRatios()
    },

        setAnswerRequired ({ messageId, clientId, answerRequired, groupMessageIds = [], resetMessageIds = [] }) {
      const id = Number(messageId)
      const cid = Number(clientId)

      if (!Number.isFinite(id) || id <= 0) {
        this.$q.notify({
          message: 'Сообщение ещё не сохранено, невозможно изменить признак ответа',
          type: 'warning',
          position: 'top-right'
        })
        return
      }

      if (!Number.isFinite(cid) || cid <= 0) {
        this.$q.notify({
          message: 'Не найден клиент для изменения признака ответа',
          type: 'warning',
          position: 'top-right'
        })
        return
      }

      const applyLocalState = (client) => {
        if (!client || !Array.isArray(client.messages)) {
          return
        }

        const groupIds = new Set([
          ...groupMessageIds,
          ...resetMessageIds,
          id
        ].map(value => Number(value)))

        client.messages.forEach(message => {
          if (groupIds.has(Number(message.id))) {
            message.answerRequired = 'NOT_SET'
          }
        })

        const selectedMessage = client.messages.find(message => Number(message.id) === id)
        if (selectedMessage) {
          selectedMessage.answerRequired = answerRequired
        }

        client.firstUnansweredMessageDate = this.calculateFirstUnansweredMessageDate(client)
      }

      if (this.isChatOnboardingActive) {
        applyLocalState(this.chatOnboardingDemoClient)
        return
      }

      axios.patch(`/api/v1/client/${cid}/message/${id}/answer-required`, {
        answerRequired,
        groupMessageIds
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
        .then((response) => {
          const clientIndex = this.store.clients.findIndex(c => Number(c.id) === cid)
          if (clientIndex === -1) {
            return
          }

          const client = this.store.clients[clientIndex]

          applyLocalState(client)

          if (response.data && Object.prototype.hasOwnProperty.call(response.data, 'firstUnansweredMessageDate')) {
            client.firstUnansweredMessageDate = response.data.firstUnansweredMessageDate
          }

          this.store.clients.splice(clientIndex, 1, {
            ...client,
            messages: client.messages ? [...client.messages] : []
          })
          this.store.clients = [...this.store.clients]
        })
        .catch(e => {
          this.$q.notify({
            message: e.response?.data?.message || e.message,
            type: 'negative',
            position: 'top-right',
            actions: [{
              icon: 'close', color: 'white', dense: true, handler: () => undefined
            }]
          })
        })
    },

    calculateFirstUnansweredMessageDate(client) {
      const messages = [...(client.messages || [])]
        .filter(message => message?.date && message.deleted !== true)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      if (messages.length === 0) {
        return null
      }
      let lastOperatorAnswerMs = 0
      messages.forEach(message => {
        if (message.isSent === true && message.isComment !== true) {
          const dateMs = new Date(message.date).getTime()
          if (Number.isFinite(dateMs)) {
            lastOperatorAnswerMs = Math.max(lastOperatorAnswerMs, dateMs)
          }
        }
      })
      const unansweredIncomingMessages = messages.filter(message => {
        const dateMs = new Date(message.date).getTime()
        return message.isSent === false &&
          message.isComment !== true &&
          Number.isFinite(dateMs) &&
          dateMs > lastOperatorAnswerMs
      })
      if (unansweredIncomingMessages.length === 0) {
        return null
      }
      const lastMarkedMessage = [...unansweredIncomingMessages]
        .reverse()
        .find(message =>
          message.answerRequired === 'ANSWER_REQUIRED' ||
          message.answerRequired === 'ANSWER_NOT_REQUIRED'
        )
      if (!lastMarkedMessage || lastMarkedMessage.answerRequired !== 'ANSWER_REQUIRED') {
        return null
      }
      return lastMarkedMessage.date
    },

    getRouteMessageId() {
      const raw = this.router.query.messageId
      if (Array.isArray(raw)) {
        return Number(raw[0])
      }
      const id = Number(raw)
      return Number.isFinite(id) && id > 0 ? id : null
    },

    handleRouteMessageId() {
      const messageId = this.getRouteMessageId()
      if (!messageId || this.routeMessageIdHandled) {
        return
      }
      this.routeMessageIdHandled = true
      const alreadyLoaded = this.getClient.messages
        ?.some(message => Number(message.id) === Number(messageId))
      if (alreadyLoaded) {
        this.$nextTick(() => {
          setTimeout(() => {
            this.linkedMessageId = messageId
          }, 100)
        })
        return
      }
      this.getMessageOnSearch(messageId)
    },

    getStatusName (status) {
      if (!status) {
        return ''
      }
      return typeof status === 'string' ? status : status.name || ''
    },

    isClosedStatusName (statusName) {
      return ['закрыта', 'закрыто', 'закрыт'].includes(String(statusName || '').trim().toLowerCase())
    },

    isFrozenStatusName (statusName) {
      return ['заморожена', 'заморожено', 'заморожен'].includes(String(statusName || '').trim().toLowerCase())
    },

    isOpenStatusName (statusName) {
      return !!statusName && !this.isClosedStatusName(statusName) && !this.isFrozenStatusName(statusName)
    },

    needStatusChangeReason (oldStatusName, newStatusName) {
      const oldName = String(oldStatusName || '').trim()
      const newName = String(newStatusName || '').trim()
      if (!oldName || !newName || oldName.toLowerCase() === newName.toLowerCase()) {
        return false
      }
      if (this.isClosedStatusName(newName) || this.isFrozenStatusName(newName)) {
        return true
      }
      return this.isClosedStatusName(oldName) && this.isOpenStatusName(newName)
    },

    getStatusChangeReasonTitle (oldStatusName, newStatusName) {
      if (this.isClosedStatusName(newStatusName)) {
        return 'Причина закрытия заявки'
      }

      if (this.isFrozenStatusName(newStatusName)) {
        return 'Причина заморозки заявки'
      }

      if (this.isClosedStatusName(oldStatusName) && this.isOpenStatusName(newStatusName)) {
        return 'Причина возврата заявки в работу'
      }
      return 'Причина изменения статуса'
    },

    requestStatusChangeReasonIfNeeded (oldStatusName, newStatusName) {
      if (!this.needStatusChangeReason(oldStatusName, newStatusName)) {
        return Promise.resolve('')
      }
      this.statusReasonDialogTitle = this.getStatusChangeReasonTitle(oldStatusName, newStatusName)
      this.statusReasonDialogMessage = `Статус: «${oldStatusName}» → «${newStatusName}»`
      this.statusReasonText = ''
      this.statusReasonError = false
      this.statusReasonDialog = true
      return new Promise(resolve => {
        this.statusReasonResolve = resolve
      })
    },

    confirmStatusReasonDialog () {
      const reason = String(this.statusReasonText || '').trim()
      if (!reason) {
        this.statusReasonError = true
        return
      }
      this.statusReasonDialog = false
      if (this.statusReasonResolve) {
        this.statusReasonResolve(reason)
      }
      this.clearStatusReasonDialog()
    },

    cancelStatusReasonDialog () {
      this.statusReasonDialog = false
      if (this.statusReasonResolve) {
        this.statusReasonResolve(null)
      }
      this.clearStatusReasonDialog()
    },

    clearStatusReasonDialog () {
      this.statusReasonDialogTitle = ''
      this.statusReasonDialogMessage = ''
      this.statusReasonText = ''
      this.statusReasonError = false
      this.statusReasonResolve = null
    },

    findInKnowledgeBase (text) {
      const query = String(text || '').trim()
      if (!query) {
        return
      }
      this.helperAiQueryFromMessage = query
      this.helperAiQueryVersion += 1
      this.isShowHelper = true
      localStorage.setItem('isShowHelper', 'true')
      if (this.isMobile) {
        this.tab = 'tab2'
      }
      this.$nextTick(() => {
        this.applyColumnWidthsFromRatios()
      })
    },

    editMessage ({ message, text }) {
      if (!message || !message.id) {
        this.isSending = false
        return
      }
      axios.patch(`/api/v1/client/${this.getClient.id}/message/${message.id}`, {
        text
      })
        .then(response => {
          const updatedMessage = response.data
          updatedMessage.date = new Date(updatedMessage.date)
          if (updatedMessage.editedAt) {
            updatedMessage.editedAt = new Date(updatedMessage.editedAt)
          }
          const localMessage = this.getClient.messages.find(m => Number(m.id) === Number(updatedMessage.id))
          if (localMessage) {
            Object.assign(localMessage, updatedMessage)
          }
          this.keyPressed('')
        })
        .catch(e =>
          this.$q.notify({
            message: e.message,
            type: 'negative',
            position: 'top-right',
            actions: [{
              icon: 'close', color: 'white', dense: true, handler: () => undefined
            }]
          }))
        .finally(() => {
          this.isSending = false
        })
    },
  },

  computed: {
    getClient () {
      if (this.isChatOnboardingActive) {
        return this.chatOnboardingDemoClient
      }
      const clientId = Number(this.router.params.clientId)
      const client = this.store.clients.find(client => client.id === clientId)
      if (client) {
        return client
      } else {
        return {
          messages: [],
          tasks: [],
          typingMessageText: {},
          typingUsers: [],
          watchingUsers: [],
          id: clientId
        }
      }
    },

    activeTemplates () {
      return this.isChatOnboardingActive ? this.chatOnboardingDemoTemplates : this.store.templates
    },

    activeKnowledgeBase () {
      return this.isChatOnboardingActive ? this.chatOnboardingDemoKnowledgeBase : this.store.knowledgeBase
    },

    activeTags () {
      return this.isChatOnboardingActive ? this.chatOnboardingDemoTags : this.store.tags
    },

    activeUsers () {
      return this.isChatOnboardingActive ? this.chatOnboardingDemoUsers : this.store.users
    },

    activeOrganizations () {
      return this.isChatOnboardingActive ? this.chatOnboardingDemoOrganizations : this.store.organizations
    },

    activeStatuses () {
      return this.isChatOnboardingActive ? this.chatOnboardingDemoStatuses : this.store.statuses
    },

    activePriorities () {
      return this.isChatOnboardingActive ? this.chatOnboardingDemoPriorities : this.store.priorities
    },

    chatOnboardingSteps () {
      return [
        {
          target: 'chat-dialog-column',
          tab: 'tab1',
          title: 'Диалог с клиентом',
          text: 'Здесь идет основная переписка. Во время обучения показан тестовый чат; после завершения он заменится реальными данными.'
        },
        {
          target: 'chat-message-search',
          tab: 'tab1',
          title: 'Поиск по сообщениям',
          text: 'Используйте поиск, чтобы быстро найти старое сообщение, файл, номер заявки или фразу клиента.'
        },
        {
          target: 'chat-message-list',
          tab: 'tab1',
          title: 'История переписки',
          text: 'В центре отображаются входящие сообщения клиента, ответы оператора, комментарии и вложения.'
        },
        {
          target: 'chat-answer-required',
          tab: 'tab1',
          title: 'Нужно ли отвечать',
          text: 'Последнее входящее сообщение можно пометить как требующее ответа или не требующее ответа. От этого зависит очередь внимания и таймер ожидания.'
        },
        {
          target: 'chat-message-composer',
          tab: 'tab1',
          title: 'Поле ответа',
          text: 'Здесь оператор пишет ответ клиенту, прикладывает файлы и может использовать быстрые шаблоны.'
        },
        {
          target: 'chat-comment-mode',
          tab: 'tab1',
          title: 'Внутренний комментарий',
          text: 'Режим комментария нужен для заметок команды. Клиент такие сообщения не увидит.'
        },
        {
          target: 'chat-helper-column',
          tab: 'tab2',
          requiresHelper: true,
          title: 'Помощник оператора',
          text: 'В этой колонке собраны шаблоны ответов, база знаний и ИИ-поиск по материалам поддержки.'
        },
        {
          target: 'chat-helper-templates',
          tab: 'tab2',
          requiresHelper: true,
          title: 'Шаблоны ответов',
          text: 'Шаблоны ускоряют типовые ответы. Можно найти нужный текст и вставить его в сообщение.'
        },
        {
          target: 'chat-helper-kb',
          tab: 'tab2',
          requiresHelper: true,
          title: 'База знаний',
          text: 'База знаний помогает оператору быстро найти инструкцию, регламент или готовый порядок действий.'
        },
        {
          target: 'chat-client-card',
          tab: 'tab3',
          title: 'Карточка клиента',
          text: 'Справа отображаются имя клиента, организация, канал обращения и дополнительные сведения.'
        },
        {
          target: 'chat-create-task',
          tab: 'tab3',
          title: 'Создание заявки',
          text: 'Если переписку нужно превратить в контролируемую работу, создайте заявку с исполнителем, приоритетом, дедлайном и SLA.'
        },
        {
          target: 'chat-task-card',
          tab: 'tab3',
          title: 'Активная заявка',
          text: 'В заявке видны статус, приоритет, срок, SLA и привязка к сообщению. По клику открывается подробная карточка.'
        }
      ]
    },

    currentChatOnboardingStep () {
      return this.chatOnboardingSteps[this.chatOnboardingStepIndex]
    },

    isLastChatOnboardingStep () {
      return this.chatOnboardingStepIndex >= this.chatOnboardingSteps.length - 1
    },

    chatOnboardingHighlightStyle () {
      if (!this.chatOnboardingTargetRect) {
        return {}
      }
      return {
        top: `${this.chatOnboardingTargetRect.top}px`,
        left: `${this.chatOnboardingTargetRect.left}px`,
        width: `${this.chatOnboardingTargetRect.width}px`,
        height: `${this.chatOnboardingTargetRect.height}px`
      }
    },

    isMobile () {
      return this.$q.screen.width < 1023
    },

    isHelperVisible () {
      const role = this.store.currentUser?.authorities?.[0]
      return this.isShowHelper && ['ADMIN', 'OPERATOR'].includes(role)
    },

    desktopGridStyle () {
      if (this.isMobile) {
        return ''
      }
      const chatWidth = Math.max(this.chatColumnWidth, this.minChatColumnWidth)
      const helperWidth = Math.max(this.helperColumnWidth, this.minHelperColumnWidth)
      const tasksWidth = Math.max(this.tasksColumnWidth, this.minTasksColumnWidth)
      if (this.isHelperVisible) {
        return {
          height: '100vh',
          gridTemplateColumns: `minmax(${this.minChatColumnWidth}px, ${chatWidth}px) 8px minmax(${this.minHelperColumnWidth}px, ${helperWidth}px) 8px minmax(${this.minTasksColumnWidth}px, ${tasksWidth}px)`
        }
      }
      return {
        height: '100vh',
        gridTemplateColumns: `minmax(${this.minChatColumnWidth}px, ${chatWidth}px) 8px minmax(${this.minTasksColumnWidth}px, ${tasksWidth}px)`
      }
    },
  },

  watch: {
    isShowHelper () {
      this.$nextTick(() => {
        this.applyColumnWidthsFromRatios()
        requestAnimationFrame(() => {
          this.applyColumnWidthsFromRatios()
        })
      })
    },

    'router.query.messageId'() {
      this.routeMessageIdHandled = false
      this.handleRouteMessageId()
    },
  },

  mounted () {
    this.isShowHelper = this.isChatOnboardingActive || localStorage.getItem('isShowHelper') !== 'false'
    this.$nextTick(() => {
      this.initColumnWidths()
      window.addEventListener('resize', this.handleWindowResize)
      window.addEventListener('resize', this.onChatOnboardingWindowChange)
      window.addEventListener('scroll', this.onChatOnboardingWindowChange, true)
    })
    if (this.isMobile) {
      this.tab = this.isChatOnboardingActive ? 'tab1' : 'tab3'
    }
    if (this.isChatOnboardingActive) {
      this.startChatOnboarding()
      return
    }
    this.markMessagesRead()
    this.initCurrentChatDraft()
    this.$nextTick(() => {
      setTimeout(() => {
        this.handleRouteMessageId()
      }, 300)
    })
  },

  created () {
    if (!this.isChatOnboardingActive) {
      this.getMessagePage()
      this.messagesLoadedForCurrentChat = true
      this.initCurrentChatDraft()
    }
  },

  setup () {
    const store = useStore()
    const router = useRoute()
    return { store, router }
  },

  beforeUnmount () {
    this.stopColumnResize()
    window.removeEventListener('resize', this.handleWindowResize)
    window.removeEventListener('resize', this.onChatOnboardingWindowChange)
    window.removeEventListener('scroll', this.onChatOnboardingWindowChange, true)
  },
}
</script>

<style scoped>
.chat-page-layout {
  display: grid;
  width: 100%;
  overflow: hidden;
}

.chat-page-layout-mobile {
  display: block;
  overflow: auto;
}

.chat-page-column {
  min-width: 0;
  height: 100%;
  overflow: hidden;
}

.chat-page-column-resizer {
  width: 8px;
  height: 100%;
  cursor: col-resize;
  position: relative;
  z-index: 5;
}

.chat-page-column-resizer::before {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  left: 3px;
  width: 2px;
  background: #0000001f;
}

.chat-page-column-resizer:hover::before {
  background: var(--q-primary);
}

.chat-page-tasks-column {
  min-width: 452px;
}

.chat-onboarding-launch-btn {
  position: fixed;
  right: 20px;
  bottom: 20px;
  z-index: 3000;
}

.chat-onboarding-backdrop {
  position: fixed;
  inset: 0;
  z-index: 9000;
  background: rgba(0, 0, 0, 0.42);
}

.chat-onboarding-highlight {
  position: fixed;
  z-index: 9001;
  border: 2px solid var(--q-primary);
  border-radius: 10px;
  box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.42), 0 0 0 6px rgba(92, 53, 249, 0.16);
  pointer-events: none;
  transition: top 0.18s ease, left 0.18s ease, width 0.18s ease, height 0.18s ease;
}

.chat-onboarding-card {
  position: fixed;
  z-index: 9002;
  padding: 16px;
  border-radius: 12px;
  background: #fff;
  border: 1px solid rgba(0, 0, 0, 0.08);
}

.chat-onboarding-step-counter {
  color: #757575;
  font-size: 12px;
  margin-bottom: 6px;
}

.chat-onboarding-title {
  font-weight: 600;
  margin-bottom: 8px;
}

.chat-onboarding-text {
  color: #424242;
  line-height: 1.45;
}

.chat-onboarding-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 16px;
}
</style>
