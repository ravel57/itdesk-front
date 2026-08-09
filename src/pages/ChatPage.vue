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
        <q-tab name="tab2" icon="support" v-if="this.isShowHelper || this.isMobile"/>
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
            :upload-progress="this.uploadProgress"
            :clientId="this.getClient.id"
            :typing="this.getClient.typingUsers"
            :currentUser="this.store.currentUser"
            :read-only="this.isObserverUser"
            :linkedMessageId="this.linkedMessageId"
            :tasks="this.activeClientTasks"
            :onboarding-demo="this.isChatOnboardingActive"
            :task-watching-now="this.getClient.watchingUsers"
            :deleteClient="this.deleteClient"
            :isShowHelper="this.isShowHelper"
            :client="this.getClient"
            :isEnd="this.isEnd"
            :pending-new-messages-count="this.pendingNewMessagesCount"
            :has-trimmed-newer-messages="this.hasTrimmedNewerMessages"
            @goToLatestMessages="this.goToLatestMessages"
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
            @getNewerMessagePage="this.getNewerMessagePage"
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
          v-if="(!this.isMobile || this.tab === 'tab2') && (this.isShowHelper || this.isMobile) && ['ADMIN', 'MANAGER', 'OPERATOR'].includes(this.store.currentUser?.authorities?.[0])"
        >
          <chat-helper
            :isMobile="this.isMobile"
            :templates="this.activeTemplates"
            :knowledgeBase="this.activeKnowledgeBase"
            :ai-query-from-message="this.helperAiQueryFromMessage"
            :ai-query-version="this.helperAiQueryVersion"
            :onboarding-demo="this.isChatOnboardingActive"
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
            :tasks="this.activeClientTasks"
            :isNotificationEnabled="isNotificationEnabled"
            :tags="this.activeTags"
            :users="this.activeUsers"
            :organizations="this.activeOrganizations"
            :client="this.getClient"
            :statuses="this.activeStatuses"
            :priorities="this.activePriorities"
            :is-mobile="this.isMobile"
            :onboarding-demo="this.isChatOnboardingActive"
            :request-status-change-reason="this.requestStatusChangeReasonIfNeeded"
            @newTask="this.newTask"
            @updateTask="this.updateTask"
            @tasksLoaded="this.onClientTasksLoaded"
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
import {useStore} from 'stores/store'
import {useRoute} from 'vue-router'
import {markRead, typing, onClientMessage} from 'src/util/ws'
import axios from 'axios'
import { getUploadErrorMessage, getUploadProgress } from 'src/util/messageFileUpload'

export default {
  components: {ChatTasks, ChatHelper, ChatDialog},

  data: () => ({
    tab: 'tab1',
    inputField: '',
    isComment: false,
    isNotificationEnabled: true,
    isSending: false,
    uploadProgress: null,
    linkedMessageId: null,
    routeMessageIdHandled: false,
    isShowHelper: true,
    isEnd: false,
    pageCounter: 0,
    messagesLoadedForCurrentChat: false,
    maxRenderedMessages: 400,
    pendingNewMessagesCount: 0,
    hasTrimmedNewerMessages: false,
    oldestLoadedMessagePage: 1,
    newestLoadedMessagePage: 1,
    currentClientTasks: [],
    clientMessageUnsubscribe: null,
    socketMessageRefreshTimer: null,
    socketMessageRefreshLoadedWindow: false,

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
          __onboardingDemo: true,
          name: 'Проверить доступ клиента',
          description: 'Клиент не может войти в личный кабинет. Нужно проверить учетную запись и отправить инструкцию.',
          status: {id: -100501, name: 'В работе', orderNumber: 2},
          priority: {id: -100501, name: 'Высокий', critical: true, orderNumber: 3},
          executor: {id: -100501, firstname: 'Оператор', lastname: 'Поддержки'},
          tags: [{id: -100501, name: 'Доступ'}, {id: -100502, name: 'VIP'}],
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
      {id: -100501, shortcut: 'hello', text: 'Здравствуйте! Уже проверяю ваш вопрос и скоро вернусь с ответом.'},
      {
        id: -100502,
        shortcut: 'access',
        text: 'Попробуйте восстановить пароль по ссылке. Если ошибка повторится, пришлите скриншот.'
      }
    ],
    chatOnboardingDemoKnowledgeBase: [
      {
        id: -100501,
        title: 'Проблемы со входом в личный кабинет',
        text: 'Проверить статус пользователя, блокировку, актуальность email и историю попыток входа.',
        tags: [{id: -100501, name: 'Доступ'}]
      },
      {
        id: -100502,
        title: 'Инструкция по восстановлению пароля',
        text: 'Попросить клиента открыть страницу восстановления пароля и проверить письмо во входящих и спаме.',
        tags: [{id: -100502, name: 'Пароль'}]
      }
    ],
    chatOnboardingDemoTags: [
      {id: -100501, name: 'Доступ'},
      {id: -100502, name: 'VIP'},
      {id: -100503, name: 'Пароль'}
    ],
    chatOnboardingDemoUsers: [
      {id: -100501, firstname: 'Оператор', lastname: 'Поддержки', username: 'operator'}
    ],
    chatOnboardingDemoOrganizations: [
      {id: -100500, name: 'ООО Демо-Сервис'}
    ],
    chatOnboardingDemoStatuses: [
      {id: -100501, name: 'Новая', orderNumber: 1},
      {id: -100502, name: 'В работе', orderNumber: 2}
    ],
    chatOnboardingDemoPriorities: [
      {id: -100501, name: 'Обычный', critical: false, orderNumber: 1},
      {id: -100502, name: 'Высокий', critical: true, orderNumber: 3}
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
      const clientId = Number(this.$route.params.clientId)
      return this.store.clients.find(client => Number(client?.id) === clientId)
    },

    syncCachedMessagesToRealClient() {
      const clientId = Number(this.$route.params.clientId)
      const cached = this.store.currentChatMessageData
      if (
        Number(cached?.clientId) !== clientId ||
        !Array.isArray(cached?.messages)
      ) {
        return false
      }

      const client = this.getRealClientByRoute()
      if (!client) {
        return false
      }

      client.messages = this.sortMessagesByDate(
        this.uniqueMessagesById(this.normalizeClientMessages(cached.messages))
      )
      this.store.currentClient = client
      this.isEnd = Boolean(cached.isEnd)
      return true
    },

    loadCurrentChatData() {
      const client = this.getRealClientByRoute()
      if (!client || this.messagesLoadedForCurrentChat) {
        return
      }

      this.syncCachedMessagesToRealClient()
      this.markMessagesRead()
      this.initCurrentChatDraft()
      this.messagesLoadedForCurrentChat = true

      // Переход к сообщению должен загружать сразу нужную страницу.
      // Иначе параллельный getMessagePage() может позже вернуть последнюю
      // страницу и затереть результат linked-message.
      if (this.getNavigationMessageId(client.id)) {
        this.$nextTick(() => this.handleRouteMessageId())
        return
      }

      this.getMessagePage()
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

      target.scrollIntoView({
        block: 'center',
        inline: 'nearest',
        behavior: 'auto'
      })

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
        this.uploadProgress = 0
        axios.post('/files/upload', formData, {
          headers: {'Content-Type': 'multipart/form-data'},
          onUploadProgress: progressEvent => {
            this.uploadProgress = getUploadProgress(progressEvent)
          }
        })
          .then(response => {
            this.uploadProgress = 1
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
          .catch(e => {
            this.isSending = false
            this.$q.notify({
              message: getUploadErrorMessage(e),
              type: 'negative',
              position: 'top-right',
              actions: [{
                icon: 'close', color: 'white', dense: true, handler: () => undefined
              }]
            })
          })
          .finally(() => {
            this.uploadProgress = null
          })
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

    addOrUpdateClientMessage(message) {
      if (!this.getClient) {
        return
      }
      if (!Array.isArray(this.getClient.messages)) {
        this.getClient.messages = []
      }
      const normalizedMessage = this.normalizeReplyMessage(
        this.normalizeClientMessage(message)
      )
      if (!normalizedMessage?.id) {
        return
      }
      const hasLocalMessage = this.getClient.messages.some(item => {
        return Number(item.id) === Number(normalizedMessage.id)
      })
      if (hasLocalMessage) {
        // Обновляем все локальные экземпляры одного message.id и обязательно
        // присваиваем новый массив. Это важно после пагинации/WebSocket, когда
        // в памяти могли временно остаться две ссылки на одно сообщение.
        const nextMessages = this.getClient.messages.map(item => {
          return Number(item.id) === Number(normalizedMessage.id)
            ? {
                ...item,
                ...normalizedMessage
              }
            : item
        })
        this.setClientMessages(nextMessages)
        return
      }
      const isOutgoingMessage = Boolean(normalizedMessage.isSent)
      const isIncomingClientMessage = !normalizedMessage.isSent && !normalizedMessage.isComment
      const shouldAppendToDom =
        isOutgoingMessage ||
        (
          !this.hasTrimmedNewerMessages &&
          this.isCurrentChatNearBottom()
        )
      if (!shouldAppendToDom) {
        if (isIncomingClientMessage) {
          this.pendingNewMessagesCount += 1
        }
        return
      }
      this.setClientMessages(
        this.trimMessagesForBottom([
          ...this.getClient.messages,
          normalizedMessage
        ])
      )
      if (isIncomingClientMessage) {
        this.$nextTick(() => {
          this.scrollCurrentChatToBottom()
          this.markMessagesRead()
        })
        return
      }
      this.$nextTick(() => {
        this.scrollCurrentChatToBottom()
      })
    },

    onClientMessageFromSocket(payload) {
      // Глобальная observer-инвалидация намеренно не содержит clientId, чтобы
      // не раскрывать идентификаторы клиентов других организаций. Обновляем
      // только уже открытый чат; REST endpoint повторно проверит доступ.
      if (payload?.refreshRequired && !payload?.client?.id) {
        this.scheduleSocketMessageRefresh(Boolean(payload.refreshLoadedWindow))
        return
      }
      if (!payload?.client?.id) {
        return
      }
      if (Number(payload.client.id) !== Number(this.getClient?.id)) {
        return
      }
      if (payload.refreshRequired) {
        this.scheduleSocketMessageRefresh(Boolean(payload.refreshLoadedWindow))
        return
      }
      if (!payload.message) {
        return
      }
      if (payload.eventType === 'edited') {
        this.applyEditedClientMessageFromSocket(payload.message)
        return
      }
      this.addOrUpdateClientMessage(payload.message)
    },

    applyEditedClientMessageFromSocket(message) {
      const normalizedMessage = this.normalizeReplyMessage(
        this.normalizeClientMessage(message)
      )
      if (!normalizedMessage?.id) {
        return
      }

      const cachedMessages = Number(this.store.currentChatMessageData?.clientId) === Number(this.getClient?.id)
        ? (this.store.currentChatMessageData?.messages || [])
        : []
      const sourceMessages = this.uniqueMessagesById([
        ...(this.getClient?.messages || []),
        ...cachedMessages
      ])
      const hasMessage = sourceMessages.some(item =>
        Number(item?.id) === Number(normalizedMessage.id)
      )

      if (!hasMessage) {
        // Событие редактирования пришло по сокету, но локальная история могла
        // ещё не успеть привязаться к объекту клиента. Дозагружаем актуальную
        // страницу вместо потери edit-события.
        this.scheduleSocketMessageRefresh()
        return
      }

      this.setClientMessages(sourceMessages.map(item =>
        Number(item?.id) === Number(normalizedMessage.id)
          ? {
              ...item,
              ...normalizedMessage
            }
          : item
      ))
    },

    scheduleSocketMessageRefresh(refreshLoadedWindow = false) {
      this.socketMessageRefreshLoadedWindow =
        this.socketMessageRefreshLoadedWindow || Boolean(refreshLoadedWindow)
      clearTimeout(this.socketMessageRefreshTimer)
      this.socketMessageRefreshTimer = setTimeout(() => {
        this.socketMessageRefreshTimer = null
        const shouldRefreshLoadedWindow = this.socketMessageRefreshLoadedWindow
        this.socketMessageRefreshLoadedWindow = false
        if (shouldRefreshLoadedWindow) {
          this.refreshLoadedMessagesFromSocket()
          return
        }
        this.refreshLatestMessagesFromSocket()
      }, 120)
    },

    refreshLoadedMessagesFromSocket() {
      const clientId = Number(this.getClient?.id)
      if (!clientId) {
        return
      }

      // Редактируемое сообщение уже видно пользователю, значит оно находится
      // в одной из загруженных страниц. Перечитываем именно текущее окно, а не
      // только page=1: иначе edit старого видимого сообщения останется stale.
      const newestPage = Math.max(1, Number(this.newestLoadedMessagePage || 1))
      const oldestPage = Math.max(newestPage, Number(this.oldestLoadedMessagePage || newestPage))
      const requests = []
      for (let page = newestPage; page <= oldestPage; page += 1) {
        requests.push(axios.get(`/api/v1/client/${clientId}/messages-page?page=${page}`))
      }

      Promise.all(requests)
        .then(responses => {
          if (Number(this.getClient?.id) !== clientId) {
            return
          }
          const loadedMessages = responses.flatMap(response =>
            this.normalizeClientMessages(response.data?.messages || [])
          )
          // Это полная socket-синхронизация уже загруженного окна для OBSERVER.
          // Не смешиваем свежий ответ с локальным массивом: иначе сообщение,
          // удалённое на сервере и отсутствующее в response, останется в DOM.
          this.setClientMessages(loadedMessages)
        })
        .catch(e => {
          this.$q.notify({
            message: e.message || 'Не удалось обновить сообщения',
            type: 'negative',
            position: 'top-right',
            actions: [{
              icon: 'close', color: 'white', dense: true, handler: () => undefined
            }]
          })
        })
    },

    refreshLatestMessagesFromSocket() {
      const clientId = Number(this.getClient?.id)
      if (!clientId) {
        return
      }
      axios.get(`/api/v1/client/${clientId}/messages-page?page=1`)
        .then(response => {
          if (Number(this.getClient?.id) !== clientId) {
            return
          }
          const loadedMessages = this.normalizeClientMessages(response.data?.messages || [])
          const mergedMessages = this.uniqueMessagesById([
            ...(this.getClient.messages || []),
            ...loadedMessages
          ])
          this.setClientMessages(this.trimMessagesForBottom(mergedMessages))
          this.pendingNewMessagesCount = 0
          this.hasTrimmedNewerMessages = false
          this.$nextTick(() => this.scrollCurrentChatToBottom())
        })
        .catch(() => undefined)
    },

    normalizeClientMessage(message) {
      if (!message) {
        return message
      }
      return {
        ...message,
        date: this.normalizeDateValue(message.date) || new Date(),
        editedAt: this.normalizeDateValue(message.editedAt)
      }
    },

    normalizeReplyMessage(message) {
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

    markMessagesRead(force = false) {
      // OBSERVER is a read-only role: opening/scrolling a chat must not
      // acknowledge support messages or change unread state.
      if (this.isObserverUser) {
        return
      }
      if (this.isChatOnboardingActive) {
        return
      }
      if (!this.getClient?.id) {
        return
      }
      if (!force && !this.canMarkCurrentChatRead()) {
        return
      }
      markRead(this.getClient)
      this.pendingNewMessagesCount = 0
      const client = this.store.clients.find(item => Number(item.id) === Number(this.getClient.id))
      if (client) {
        client.unreadMessagesCount = 0
      }
      if (this.getClient) {
        this.getClient.unreadMessagesCount = 0
      }
    },

    canMarkCurrentChatRead() {
      if (this.hasTrimmedNewerMessages) {
        return false
      }
      if (Number(this.newestLoadedMessagePage || 1) > 1) {
        return false
      }
      return this.isCurrentChatNearBottom(220)
    },

    updateClient(newClient) {
      this.store.clients[this.store.clients.indexOf(this.getClient)] = newClient
    },

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

    pastToInputField(text) {
      this.inputField = text
      typing(this.getClient, this.store.currentUser, text)
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
            type: 'negative',
            position: 'top-right',
            actions: [{
              icon: 'close', color: 'white', dense: true, handler: () => undefined
            }]
          })
        })
    },

    getLinkedTaskIdFromMessage(message) {
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

    findLinkedTaskByMessage(message) {
      const tasks = this.getCurrentChatTasksForLinkedSearch()
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

    async openLinkedTask(message) {
      const task = await this.resolveLinkedTaskByMessage(message)
      if (!task) {
        this.$q.notify({
          message: 'Связанная заявка не найдена',
          type: 'negative',
          position: 'top-right',
          actions: [{icon: 'close', color: 'white', dense: true, handler: () => undefined}]
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
          type: 'negative',
          position: 'top-right',
          actions: [{icon: 'close', color: 'white', dense: true, handler: () => undefined}]
        })
      })
    },

    getCurrentChatTasksForLinkedSearch() {
      // currentClientTasks is the live source used by ChatTasks. Put it last so
      // uniqueTasksById keeps the freshest task when getClient.tasks still has
      // the pre-relink linkedMessageId.
      return this.uniqueTasksById([
        ...(Array.isArray(this.getClient?.tasks) ? this.getClient.tasks : []),
        ...(Array.isArray(this.currentClientTasks) ? this.currentClientTasks : [])
      ])
    },

    uniqueTasksById(tasks) {
      const map = new Map()
      ;(tasks || []).forEach(task => {
        if (!task?.id) {
          return
        }
        map.set(Number(task.id), task)
      })
      return [...map.values()]
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
        const currentLinkedTaskId = this.getLinkedTaskIdFromMessage(message)
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
      const linkedTaskId = this.getLinkedTaskIdFromMessage(message)
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
          type: 'negative',
          position: 'top-right',
          actions: [{icon: 'close', color: 'white', dense: true, handler: () => undefined}]
        })
        return null
      }
    },

    clearLinkedMessageId() {
      this.linkedMessageId = null
    },

    deleteMessage(message) {
      const messageId = Number(message?.id)
      const clientId = Number(this.getClient?.id)
      if (!messageId || !clientId) {
        return
      }

      axios.delete(`/api/v1/client/${clientId}/delete-message/${messageId}`)
        .then(() => {
          // Не ждём повторной загрузки истории или сокета: удалённое сообщение
          // должно зачеркнуться в текущем чате сразу после успешного ответа API.
          this.markMessageDeleted(messageId)
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

    markMessageDeleted(messageId) {
      const id = Number(messageId)
      if (!id || !Array.isArray(this.getClient?.messages)) {
        return
      }

      let changed = false
      const nextMessages = this.getClient.messages.map(item => {
        if (Number(item?.id) !== id || item?.deleted === true) {
          return item
        }
        changed = true
        return {
          ...item,
          deleted: true
        }
      })

      if (changed) {
        this.setClientMessages(nextMessages)
      }
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
      if (this.isChatOnboardingActive || !this.getClient?.id) {
        return
      }
      if (pageCounter > 0) {
        this.loadOlderMessagePage()
        return
      }
      this.pageCounter = 1
      this.oldestLoadedMessagePage = 1
      this.newestLoadedMessagePage = 1
      const cached = this.store.currentChatMessageData
      const currentClientId = Number(this.$route.params.clientId)
      if (
        Number(cached?.clientId) === currentClientId &&
        Array.isArray(cached?.messages)
      ) {
        const messages = this.normalizeClientMessages(cached.messages)
        this.setClientMessages(this.trimMessagesForBottom(messages))
        this.isEnd = Boolean(cached.isEnd)
        this.pendingNewMessagesCount = 0
        this.hasTrimmedNewerMessages = false
        return
      }
      this.loadMessagePageFromServer(1, 'replace-bottom')
    },

    loadMessagePageFromServer(page, mode = 'top', scrollToBottomAfterLoad = false) {
      if (!this.getClient?.id) {
        return
      }

      axios.get(`/api/v1/client/${this.getClient.id}/messages-page?page=${page}`)
        .then(response => {
          const loadedMessages = this.normalizeClientMessages(response.data?.messages || [])
          if (mode === 'replace-bottom') {
            this.setClientMessages(this.trimMessagesForBottom(loadedMessages))
            this.pageCounter = 1
            this.oldestLoadedMessagePage = 1
            this.newestLoadedMessagePage = 1
            this.isEnd = Boolean(response.data?.isEnd)
            this.pendingNewMessagesCount = 0
            this.hasTrimmedNewerMessages = false
            if (scrollToBottomAfterLoad) {
              this.$nextTick(() => {
                setTimeout(() => this.scrollCurrentChatToBottom(), 50)
              })
            }

            return
          }
          if (mode === 'top') {
            const currentMessages = Array.isArray(this.getClient.messages)
              ? this.getClient.messages
              : []
            const mergedMessages = this.uniqueMessagesById([
              ...loadedMessages,
              ...currentMessages
            ])
            const trimmedMessages = this.trimMessagesForTop(mergedMessages)
            this.setClientMessages(trimmedMessages)
            this.oldestLoadedMessagePage = Math.max(this.oldestLoadedMessagePage, page)
            this.recalculateMessageWindowPagesFromOldest()
            this.pageCounter = this.oldestLoadedMessagePage
            this.isEnd = Boolean(response.data?.isEnd)
            this.hasTrimmedNewerMessages = this.newestLoadedMessagePage > 1

            return
          }
          if (mode === 'bottom') {
            const currentMessages = Array.isArray(this.getClient.messages)
              ? this.getClient.messages
              : []
            const mergedMessages = this.uniqueMessagesById([
              ...currentMessages,
              ...loadedMessages
            ])
            const trimmedMessages = this.trimMessagesForBottom(mergedMessages)
            this.setClientMessages(trimmedMessages)
            this.newestLoadedMessagePage = Math.min(this.newestLoadedMessagePage, page)
            this.recalculateMessageWindowPagesFromNewest()
            this.pageCounter = this.oldestLoadedMessagePage
            this.hasTrimmedNewerMessages = this.newestLoadedMessagePage > 1
            // Если при движении вниз старые сообщения сверху отрезались,
            // значит сверху снова можно догружать историю.
            if (this.oldestLoadedMessagePage > 1) {
              this.isEnd = false
            }
          }
        })
        .catch(e => {
          this.$q.notify({
            message: e.message || 'Не удалось загрузить сообщения',
            type: 'negative',
            position: 'top-right',
            actions: [{
              icon: 'close',
              color: 'white',
              dense: true,
              handler: () => undefined
            }]
          })
        })
    },

    loadOlderMessagePage() {
      if (this.isEnd) {
        return
      }
      const nextPage = Math.max(1, Number(this.oldestLoadedMessagePage || 1)) + 1
      this.loadMessagePageFromServer(nextPage, 'top')
    },

    getNewerMessagePage() {
      if (this.newestLoadedMessagePage <= 1) {
        this.hasTrimmedNewerMessages = false
        return
      }
      const nextPage = this.newestLoadedMessagePage - 1
      this.loadMessagePageFromServer(nextPage, 'bottom')
    },

    getRenderedMessagePageCount() {
      const messagesCount = Array.isArray(this.getClient?.messages)
        ? this.getClient.messages.length
        : 0
      return Math.max(1, Math.ceil(messagesCount / 100))
    },

    recalculateMessageWindowPagesFromOldest() {
      const pageCount = this.getRenderedMessagePageCount()
      this.newestLoadedMessagePage = Math.max(
        1,
        this.oldestLoadedMessagePage - pageCount + 1
      )
    },

    recalculateMessageWindowPagesFromNewest() {
      const pageCount = this.getRenderedMessagePageCount()
      this.oldestLoadedMessagePage = this.newestLoadedMessagePage + pageCount - 1
    },

    goToLatestMessages() {
      if (this.isChatOnboardingActive || !this.getClient?.id) {
        return
      }
      this.pageCounter = 1
      this.oldestLoadedMessagePage = 1
      this.newestLoadedMessagePage = 1
      this.pendingNewMessagesCount = 0
      this.hasTrimmedNewerMessages = false
      this.loadMessagePageFromServer(1, 'replace-bottom', true)
    },

    scrollCurrentChatToBottom() {
      const chat = document.getElementById('chat-dialog')
      const scrollZone = chat?.children?.[0]?.children?.[0]
      if (!scrollZone) {
        return
      }
      scrollZone.scrollTo(0, scrollZone.scrollHeight)
    },

    getCurrentChatScrollZone() {
      const chat = document.getElementById('chat-dialog')
      return chat?.children?.[0]?.children?.[0] || null
    },

    isCurrentChatNearBottom(threshold = 180) {
      const scrollZone = this.getCurrentChatScrollZone()
      if (!scrollZone) {
        return true
      }
      return scrollZone.scrollHeight - scrollZone.clientHeight - scrollZone.scrollTop <= threshold
    },

    setClientMessages(messages) {
      const clientId = Number(this.$route.params.clientId)
      const nextMessages = this.sortMessagesByDate(
        this.uniqueMessagesById(messages || [])
      )
      const realClient = this.getRealClientByRoute()
      const targetClient = realClient || this.getClient

      if (targetClient) {
        targetClient.messages = nextMessages
      }
      if (realClient) {
        this.store.currentClient = realClient
      }

      // Храним историю отдельно от списка клиентов. Это защищает чат от
      // гонки: messages-page успевает ответить раньше /api/v1/clients, после
      // чего новый объект клиента больше не может затереть переписку пустым [].
      const cachedIsEnd = Number(this.store.currentChatMessageData?.clientId) === clientId
        ? this.store.currentChatMessageData?.isEnd
        : this.isEnd
      this.store.currentChatMessageData = {
        clientId,
        messages: nextMessages,
        isEnd: Boolean(cachedIsEnd)
      }
    },

    trimMessagesForBottom(messages) {
      const normalizedMessages = this.sortMessagesByDate(this.uniqueMessagesById(messages))
      if (normalizedMessages.length <= this.maxRenderedMessages) {
        return normalizedMessages
      }
      return normalizedMessages.slice(-this.maxRenderedMessages)
    },

    trimMessagesForTop(messages) {
      const normalizedMessages = this.sortMessagesByDate(this.uniqueMessagesById(messages))
      if (normalizedMessages.length <= this.maxRenderedMessages) {
        return normalizedMessages
      }
      this.hasTrimmedNewerMessages = true
      return normalizedMessages.slice(0, this.maxRenderedMessages)
    },

    uniqueMessagesById(messages) {
      const map = new Map()
      ;(messages || []).forEach(message => {
        if (!message) {
          return
        }
        if (message.id === undefined || message.id === null) {
          map.set(Symbol('message-without-id'), message)
          return
        }
        map.set(Number(message.id), message)
      })
      return [...map.values()]
    },

    sortMessagesByDate(messages) {
      return [...(messages || [])].sort((left, right) => {
        const leftTime = new Date(left?.date || 0).getTime()
        const rightTime = new Date(right?.date || 0).getTime()
        if (leftTime === rightTime) {
          return Number(left?.id || 0) - Number(right?.id || 0)
        }
        return leftTime - rightTime
      })
    },

    normalizeClientMessages(messages) {
      return Array.isArray(messages)
        ? messages.map(message => this.normalizeReplyMessage(this.normalizeClientMessage(message)))
        : []
    },

    normalizeDateValue(value) {
      if (!value) {
        return value
      }
      if (value instanceof Date) {
        return Number.isNaN(value.getTime()) ? null : value
      }
      if (typeof value === 'number') {
        const millis = value < 100000000000 ? value * 1000 : value
        const date = new Date(millis)
        return Number.isNaN(date.getTime()) ? null : date
      }
      if (typeof value === 'string') {
        const trimmed = value.trim()
        if (!trimmed) {
          return null
        }
        const numericValue = Number(trimmed)
        if (Number.isFinite(numericValue)) {
          const millis = numericValue < 100000000000 ? numericValue * 1000 : numericValue
          const date = new Date(millis)
          return Number.isNaN(date.getTime()) ? null : date
        }
        const date = new Date(trimmed)
        return Number.isNaN(date.getTime()) ? null : date
      }
      if (Array.isArray(value)) {
        const [
          year,
          month,
          day,
          hour = 0,
          minute = 0,
          second = 0,
          nano = 0
        ] = value
        const date = new Date(
          Number(year),
          Number(month) - 1,
          Number(day),
          Number(hour),
          Number(minute),
          Number(second),
          Math.floor(Number(nano) / 1000000)
        )
        return Number.isNaN(date.getTime()) ? null : date
      }
      return null
    },

    getMessageOnSearch(messageId) {
      if (this.isChatOnboardingActive) {
        return Promise.resolve(false)
      }
      const id = Number(messageId)
      const clientId = Number(this.$route.params.clientId)
      if (!id || !clientId || Number(this.getClient.id) !== clientId) {
        return Promise.resolve(false)
      }
      return axios.get(`/api/v1/client/${clientId}/linked-message?linkedMessageId=${id}`)
        .then(response => {
          // Пока запрос выполнялся, пользователь мог открыть другой чат.
          // Не применяем страницу сообщений к уже сменившемуся clientId.
          if (Number(this.$route.params.clientId) !== clientId) {
            return false
          }
          const messages = this.normalizeClientMessages(response.data.messages || [])
          const page = Math.max(1, Number(response.data?.page || 1))
          this.pageCounter = page
          this.oldestLoadedMessagePage = page
          this.newestLoadedMessagePage = page
          this.isEnd = Boolean(response.data?.isEnd)
          this.pendingNewMessagesCount = 0
          this.hasTrimmedNewerMessages = page > 1
          this.setClientMessages(messages)
          this.linkedMessageId = null
          this.$nextTick(() => {
            setTimeout(() => {
              if (Number(this.$route.params.clientId) === clientId) {
                this.linkedMessageId = id
              }
            }, 100)
          })
          return true
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
            const messages = this.normalizeClientMessages(response.data.messages || [])
            const page = Math.max(1, Number(response.data?.page || 1))
            this.pageCounter = page
            this.oldestLoadedMessagePage = page
            this.newestLoadedMessagePage = page
            this.isEnd = Boolean(response.data?.isEnd)
            this.pendingNewMessagesCount = 0
            this.hasTrimmedNewerMessages = page > 1
            this.setClientMessages(messages)
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

    setAnswerRequired({messageId, clientId, answerRequired, groupMessageIds = [], resetMessageIds = []}) {
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

      const groupIds = new Set([
        ...groupMessageIds,
        ...resetMessageIds,
        id
      ].map(value => Number(value)))

      const applyLocalState = (client, responseData = null) => {
        if (!client || !Array.isArray(client.messages)) {
          return
        }

        // Создаём новый массив и новые объекты сообщений. Так состояние кнопок
        // становится единственным источником истины и не зависит от мутации
        // props внутри ChatDialog.
        const nextMessages = client.messages.map(message => {
          const currentMessageId = Number(message?.id)
          if (!groupIds.has(currentMessageId)) {
            return message
          }
          return {
            ...message,
            answerRequired: currentMessageId === id
              ? answerRequired
              : 'NOT_SET'
          }
        })

        client.messages = nextMessages
        client.firstUnansweredMessageDate = this.calculateFirstUnansweredMessageDate(client)
        client.firstUnansweredMessageId = this.calculateFirstUnansweredMessageId(client)

        if (responseData && Object.prototype.hasOwnProperty.call(responseData, 'firstUnansweredMessageDate')) {
          client.firstUnansweredMessageDate = responseData.firstUnansweredMessageDate
        }
        if (responseData && Object.prototype.hasOwnProperty.call(responseData, 'firstUnansweredMessageId')) {
          client.firstUnansweredMessageId = responseData.firstUnansweredMessageId
        }

        // ВАЖНО: fetchData/getMessagePage берут историю из этого кэша.
        // Если его не обновить, следующий refresh клиентов возвращает значения
        // answerRequired, которые были при первоначальной загрузке страницы.
        if (Number(this.store.currentChatMessageData?.clientId) === cid) {
          this.store.currentChatMessageData = {
            ...this.store.currentChatMessageData,
            clientId: cid,
            messages: nextMessages.map(message => ({...message}))
          }
        }

        if (Number(this.store.currentClient?.id) === cid) {
          this.store.currentClient = client
        }

        const clientIndex = this.store.clients.findIndex(item => Number(item?.id) === cid)
        if (clientIndex !== -1) {
          this.store.clients.splice(clientIndex, 1, client)
        }
      }

      if (this.isChatOnboardingActive) {
        applyLocalState(this.chatOnboardingDemoClient)
        return
      }

      // ChatDialog уже меняет состояние оптимистично перед emit, но здесь мы
      // сразу синхронизируем также store.currentChatMessageData. Благодаря этому
      // socket refresh и повторный fetchData не могут вернуть старый выбор.
      const currentClient = this.store.clients.find(client => Number(client?.id) === cid)
      applyLocalState(currentClient)

      axios.patch(`/api/v1/client/${cid}/message/${id}/answer-required`, {
        answerRequired,
        groupMessageIds
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
        .then((response) => {
          // За время запроса объект клиента мог быть заменён обновлением списка,
          // поэтому всегда берём актуальный объект из store повторно.
          const actualClient = this.store.clients.find(client => Number(client?.id) === cid)
          applyLocalState(actualClient, response.data)
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

    calculateFirstUnansweredMessage(client) {
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
      return lastMarkedMessage
    },

    calculateFirstUnansweredMessageDate(client) {
      return this.calculateFirstUnansweredMessage(client)?.date || null
    },

    calculateFirstUnansweredMessageId(client) {
      const messageId = Number(this.calculateFirstUnansweredMessage(client)?.id)
      return Number.isFinite(messageId) && messageId > 0 ? messageId : null
    },

    getRouteMessageId() {
      const raw = this.$route.query.messageId
      if (Array.isArray(raw)) {
        return Number(raw[0])
      }
      const id = Number(raw)
      return Number.isFinite(id) && id > 0 ? id : null
    },

    getChatNavigationStorageKey(clientId) {
      return `chat-navigation-message:${Number(clientId)}`
    },

    getStoredNavigationMessageId(clientId) {
      if (typeof sessionStorage === 'undefined') {
        return null
      }

      const id = Number(clientId)
      if (!Number.isFinite(id) || id <= 0) {
        return null
      }

      const key = this.getChatNavigationStorageKey(id)
      const raw = sessionStorage.getItem(key)
      if (!raw) {
        return null
      }

      try {
        const value = JSON.parse(raw)
        const messageId = Number(value?.messageId)
        const createdAt = Number(value?.createdAt)
        const isExpired = !Number.isFinite(createdAt) || Date.now() - createdAt > 5 * 60 * 1000
        const isWrongClient = Number(value?.clientId) !== id
        if (!Number.isFinite(messageId) || messageId <= 0 || isExpired || isWrongClient) {
          sessionStorage.removeItem(key)
          return null
        }
        return messageId
      } catch (ignoreError) {
        sessionStorage.removeItem(key)
        return null
      }
    },

    getNavigationMessageId(clientId = Number(this.$route.params.clientId)) {
      return this.getRouteMessageId() || this.getStoredNavigationMessageId(clientId)
    },

    consumeNavigationMessageId(clientId, messageId) {
      if (typeof sessionStorage !== 'undefined') {
        const key = this.getChatNavigationStorageKey(clientId)
        const storedMessageId = this.getStoredNavigationMessageId(clientId)
        if (Number(storedMessageId) === Number(messageId)) {
          sessionStorage.removeItem(key)
        }
      }

      if (Number(this.getRouteMessageId()) !== Number(messageId)) {
        return
      }

      const query = {...this.$route.query}
      delete query.messageId
      this.$router.replace({
        path: this.$route.path,
        query,
        hash: this.$route.hash
      }).catch(() => undefined)
    },

    activateNavigationMessage(clientId, messageId, routeKey) {
      this.linkedMessageId = null
      this.$nextTick(() => {
        setTimeout(() => {
          if (Number(this.$route.params.clientId) !== Number(clientId)) {
            return
          }
          this.linkedMessageId = Number(messageId)
          this.routeMessageIdHandled = routeKey
          this.consumeNavigationMessageId(clientId, messageId)
        }, 100)
      })
    },

    handleRouteMessageId() {
      const clientId = Number(this.$route.params.clientId)
      const messageId = this.getNavigationMessageId(clientId)
      if (!messageId || !clientId) {
        this.routeMessageIdHandled = null
        return
      }

      if (Number(this.getClient.id) !== clientId) {
        return
      }

      const routeKey = `${clientId}:${messageId}`
      if (this.routeMessageIdHandled === routeKey) {
        return
      }

      const alreadyLoaded = this.getClient.messages
        ?.some(message => Number(message.id) === Number(messageId))
      if (alreadyLoaded) {
        this.activateNavigationMessage(clientId, messageId, routeKey)
        return
      }

      this.getMessageOnSearch(messageId)
        .then(loaded => {
          if (!loaded || Number(this.$route.params.clientId) !== clientId) {
            return
          }
          this.routeMessageIdHandled = routeKey
          this.consumeNavigationMessageId(clientId, messageId)
        })
        .catch(() => {
          if (this.routeMessageIdHandled === routeKey) {
            this.routeMessageIdHandled = null
          }
        })
    },

    getStatusName(status) {
      if (!status) {
        return ''
      }
      return typeof status === 'string' ? status : status.name || ''
    },

    isClosedStatusName(statusName) {
      return ['закрыта', 'закрыто', 'закрыт'].includes(String(statusName || '').trim().toLowerCase())
    },

    isFrozenStatusName(statusName) {
      return ['заморожена', 'заморожено', 'заморожен'].includes(String(statusName || '').trim().toLowerCase())
    },

    isOpenStatusName(statusName) {
      return !!statusName && !this.isClosedStatusName(statusName) && !this.isFrozenStatusName(statusName)
    },

    needStatusChangeReason(oldStatusName, newStatusName) {
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

    getStatusChangeReasonTitle(oldStatusName, newStatusName) {
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

    requestStatusChangeReasonIfNeeded(oldStatusName, newStatusName) {
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

    confirmStatusReasonDialog() {
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

    cancelStatusReasonDialog() {
      this.statusReasonDialog = false
      if (this.statusReasonResolve) {
        this.statusReasonResolve(null)
      }
      this.clearStatusReasonDialog()
    },

    clearStatusReasonDialog() {
      this.statusReasonDialogTitle = ''
      this.statusReasonDialogMessage = ''
      this.statusReasonText = ''
      this.statusReasonError = false
      this.statusReasonResolve = null
    },

    findInKnowledgeBase(text) {
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

    editMessage({message, text}) {
      if (!message || !message.id) {
        this.isSending = false
        return
      }
      axios.patch(`/api/v1/client/${this.getClient.id}/message/${message.id}`, {
        text
      })
        .then(response => {
          // Не мутируем найденный объект по месту: заменяем сообщение через
          // общий reactive-путь, который также синхронизирует chat cache.
          this.addOrUpdateClientMessage(response.data)
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
    getClient() {
      if (this.isChatOnboardingActive) {
        return this.chatOnboardingDemoClient
      }
      const clientId = Number(this.$route.params.clientId)
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

    activeTemplates() {
      return this.isChatOnboardingActive ? this.chatOnboardingDemoTemplates : this.store.templates
    },

    activeKnowledgeBase() {
      return this.isChatOnboardingActive ? this.chatOnboardingDemoKnowledgeBase : this.store.knowledgeBase
    },

    activeTags() {
      return this.isChatOnboardingActive ? this.chatOnboardingDemoTags : this.store.tags
    },

    activeUsers() {
      return this.isChatOnboardingActive ? this.chatOnboardingDemoUsers : this.store.users
    },

    activeOrganizations() {
      return this.isChatOnboardingActive ? this.chatOnboardingDemoOrganizations : this.store.organizations
    },

    activeStatuses() {
      return this.isChatOnboardingActive ? this.chatOnboardingDemoStatuses : this.store.statuses
    },

    activePriorities() {
      return this.isChatOnboardingActive ? this.chatOnboardingDemoPriorities : this.store.priorities
    },

    activeClientTasks() {
      return this.isChatOnboardingActive
        ? (this.chatOnboardingDemoClient.tasks || [])
        : this.currentClientTasks
    },

    chatOnboardingSteps() {
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
          text: 'В нижней части диалога собраны инструменты отправки сообщения. Следующие подсказки отдельно покажут ввод текста и вложения.'
        },
        {
          target: 'chat-message-input',
          tab: 'tab1',
          title: 'Текст сообщения',
          text: 'Здесь набирается ответ клиенту. В поле также работают упоминания и быстрые шаблоны по сокращениям.'
        },
        {
          target: 'chat-attach-file',
          tab: 'tab1',
          title: 'Вложения',
          text: 'Кнопка со скрепкой добавляет к ответу файлы. Перед отправкой вложения отображаются над полем сообщения.'
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
          text: 'Шаблоны ускоряют типовые ответы. Нажатие на шаблон вставляет готовый текст в сообщение.'
        },
        {
          target: 'chat-helper-template-search',
          tab: 'tab2',
          requiresHelper: true,
          title: 'Поиск по шаблонам',
          text: 'Ищите шаблон по тексту или его короткому сокращению, чтобы не прокручивать весь список.'
        },
        {
          target: 'chat-helper-kb',
          tab: 'tab2',
          requiresHelper: true,
          title: 'База знаний',
          text: 'База знаний помогает оператору быстро найти инструкцию, регламент или готовый порядок действий.'
        },
        {
          target: 'chat-helper-kb-search',
          tab: 'tab2',
          requiresHelper: true,
          title: 'Поиск по базе знаний',
          text: 'Поле ищет материалы по названию статьи.'
        },
        {
          target: 'chat-helper-kb-tags',
          tab: 'tab2',
          requiresHelper: true,
          title: 'Фильтр по тегам',
          text: 'Теги сужают базу знаний до материалов по нужной теме, продукту или типу проблемы.'
        },
        {
          target: 'chat-helper-ai-query',
          tab: 'tab2',
          requiresHelper: true,
          title: 'Запрос к ИИ',
          text: 'Сформулируйте вопрос по проблеме клиента. ИИ использует доступные материалы поддержки и показывает ответ прямо в Хелпере.'
        },
        {
          target: 'chat-client-card',
          tab: 'tab3',
          title: 'Карточка клиента',
          text: 'В верхней части колонки собрана информация о клиенте. Следующие подсказки отдельно разберут каждое поле.'
        },
        {
          target: 'chat-client-name',
          tab: 'tab3',
          title: 'Имя клиента',
          text: 'Имя помогает быстро убедиться, что открыт нужный диалог.'
        },
        {
          target: 'chat-client-organization',
          tab: 'tab3',
          title: 'Организация',
          text: 'Организация задает корпоративный контекст клиента и связана с договорами, сервисами и SLA.'
        },
        {
          target: 'chat-client-extra',
          tab: 'tab3',
          title: 'Дополнительные сведения',
          text: 'Здесь хранятся короткие заметки о клиенте, которые важно видеть оператору во время общения.'
        },
        {
          target: 'chat-client-channel',
          tab: 'tab3',
          title: 'Канал обращения',
          text: 'Поле показывает, откуда пришел диалог: Telegram, WhatsApp, Email или другой подключенный канал.'
        },
        {
          target: 'chat-client-edit',
          tab: 'tab3',
          title: 'Редактирование клиента',
          text: 'Нажмите на карандаш рядом с именем, чтобы изменить имя, организацию и дополнительные сведения о клиенте.'
        },
        {
          target: 'chat-task-toolbar',
          tab: 'tab3',
          title: 'Заявки клиента',
          text: 'Ниже карточки клиента находятся связанные заявки и инструменты работы с их списком.'
        },
        {
          target: 'chat-tasks-completed',
          tab: 'tab3',
          title: 'Закрытые и замороженные',
          text: 'Переключатель добавляет в список уже закрытые и замороженные заявки этого клиента.'
        },
        {
          target: 'chat-task-search',
          tab: 'tab3',
          title: 'Поиск по заявкам клиента',
          text: 'Поле позволяет быстро найти нужную заявку внутри истории конкретного клиента.'
        },
        {
          target: 'chat-task-sort',
          tab: 'tab3',
          title: 'Сортировка заявок',
          text: 'Сортировка меняет порядок связанных заявок по выбранному признаку.'
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

    currentChatOnboardingStep() {
      return this.chatOnboardingSteps[this.chatOnboardingStepIndex]
    },

    isLastChatOnboardingStep() {
      return this.chatOnboardingStepIndex >= this.chatOnboardingSteps.length - 1
    },

    chatOnboardingHighlightStyle() {
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

    isObserverUser() {
      return Array.isArray(this.store.currentUser?.authorities) &&
        this.store.currentUser.authorities.includes('OBSERVER')
    },

    isMobile() {
      return this.$q.screen.width < 1023
    },

    isHelperVisible() {
      const role = this.store.currentUser?.authorities?.[0]
      return this.isShowHelper && ['ADMIN', 'OPERATOR'].includes(role)
    },

    desktopGridStyle() {
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
    isShowHelper() {
      this.$nextTick(() => {
        this.applyColumnWidthsFromRatios()
        requestAnimationFrame(() => {
          this.applyColumnWidthsFromRatios()
        })
      })
    },

    '$route.query.messageId'(newValue, oldValue) {
      if (!newValue && oldValue) {
        return
      }
      this.routeMessageIdHandled = null
      this.$nextTick(() => this.handleRouteMessageId())
    },

    '$route.params.clientId'() {
      this.routeMessageIdHandled = null
      this.linkedMessageId = null
      this.currentClientTasks = []
      this.messagesLoadedForCurrentChat = false
      this.pageCounter = 0
      this.pendingNewMessagesCount = 0
      this.hasTrimmedNewerMessages = false
      this.$nextTick(() => {
        this.loadCurrentChatData()
        this.handleRouteMessageId()
      })
    },

    'store.clients': {
      handler() {
        // /api/v1/clients обычно приходит уже после messages-page при F5.
        // В этот момент переносим кэш в появившийся реальный объект клиента.
        this.syncCachedMessagesToRealClient()
        this.$nextTick(() => this.handleRouteMessageId())
      }
    },
  },

  mounted() {
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
    this.clientMessageUnsubscribe = onClientMessage(this.onClientMessageFromSocket)
    this.$nextTick(() => {
      setTimeout(() => {
        this.markMessagesRead()
      }, 350)
    })
    this.initCurrentChatDraft()
    this.$nextTick(() => {
      setTimeout(() => {
        this.handleRouteMessageId()
      }, 300)
    })
  },

  created() {
    if (!this.isChatOnboardingActive) {
      this.loadCurrentChatData()
    }
  },

  setup() {
    const store = useStore()
    const router = useRoute()
    return {store, router}
  },

  beforeUnmount() {
    this.stopColumnResize()
    clearTimeout(this.socketMessageRefreshTimer)
    this.socketMessageRefreshTimer = null
    this.socketMessageRefreshLoadedWindow = false
    if (this.clientMessageUnsubscribe) {
      this.clientMessageUnsubscribe()
      this.clientMessageUnsubscribe = null
    }
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
