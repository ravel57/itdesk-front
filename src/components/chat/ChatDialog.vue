<template>
  <chat-message-search
    v-model="this.search"
    :client="this.client"
    :messages="this.sortedMessages"
    :is-dialog="this.isDialog"
    :is-mobile="this.isMobile"
    :portal-mode="this.portalMode"
    :show-files-action="this.showFilesAction"
    @scrollToMessage="this.scrollToMessageAfterSearch"
    @showFiles="this.showFiles"
  />
  <chat-message-list
    ref="messageList"
    :messages="this.messages"
    :sorted-messages="this.sortedMessages"
    :chat-style="this.chatStyle"
    :search="this.search"
    :client="this.client"
    :current-user="this.currentUser"
    :tasks="this.tasks"
    :is-dialog="this.isDialog"
    :is-mobile="this.isMobile"
    :portal-mode="this.portalMode"
    :is-observer-user="this.isObserverUser"
    :can-delete-messages="this.canDeleteMessages"
    :allow-message-mutations="this.allowMessageMutations"
    :show-answer-required-actions="this.showAnswerRequiredActions"
    :onboarding-demo="this.onboardingDemo"
    :show-internal-actions="this.showInternalActions"
    @scroll="this.getPortionMessages()"
    @scrollToMessage="this.scrollToMessageAfterSearch"
    @reply="this.setReplyMessage"
    @edit="this.startEditMessage"
    @requestDelete="this.requestDeleteMessage"
    @pastToInputField="this.$emit('pastToInputField', $event)"
    @findInKnowledgeBase="this.findInKnowledgeBase"
    @linkToTask="(message, task) => this.$emit('linkToTask', message, task)"
    @openLinkedTask="this.$emit('openLinkedTask', $event)"
    @setAnswerRequired="this.$emit('setAnswerRequired', $event)"
  />
  <chat-message-composer
    ref="composer"
    :messages="this.messages"
    :input-field="this.inputField"
    :templates="this.templates"
    :is-sending="this.isSending"
    :upload-progress="this.uploadProgress"
    :typing="this.typing"
    :current-user="this.currentUser"
    :task-watching-now="this.taskWatchingNow"
    :is-show-helper="this.isShowHelper"
    :is-mobile="this.isMobile"
    :is-dialog="this.isDialog"
    :client="this.client"
    :can-send-messages="this.canSendMessages"
    :chat-style="this.chatStyle"
    :scroll-to-bottom-key="this.scrollToBottomKey"
    :pending-new-messages-count="this.pendingNewMessagesCount"
    :has-trimmed-newer-messages="this.hasTrimmedNewerMessages"
    :comments="this.comments"
    :portal-mode="this.portalMode"
    :show-helper-action="this.showHelperAction"
    @isSending="this.$emit('isSending', $event)"
    @sendMessage="this.$emit('sendMessage', $event)"
    @editMessage="this.$emit('editMessage', $event)"
    @keyPressed="this.$emit('keyPressed', $event)"
    @showHelper="this.$emit('showHelper')"
    @hideHelper="this.$emit('hideHelper')"
    @scrollToBottom="this.scrollToBottom"
    @goToLatestClick="this.handleGoToLatestClick"
  />
  <chat-delete-message-dialog
    v-model="this.isDeleteMessageConfirmOpen"
    @hide="this.clearDeleteMessageConfirmation"
    @confirm="this.confirmDeleteMessage"
  />
  <chat-file-list-dialog
    v-model="this.isShowFileList"
    :files="this.fileList"
  />
</template>

<script>
import { useStore } from 'stores/store'
import axios from 'axios'
import { useRoute } from 'vue-router'
import { getMessageId } from 'src/util/chatMessageText'
import ChatMessageSearch from 'components/chat/ChatMessageSearch.vue'
import ChatMessageList from 'components/chat/ChatMessageList.vue'
import ChatMessageComposer from 'components/chat/ChatMessageComposer.vue'
import ChatDeleteMessageDialog from 'components/chat/ChatDeleteMessageDialog.vue'
import ChatFileListDialog from 'components/chat/ChatFileListDialog.vue'

export default {

  name: 'ChatDialog',

  components: {
    ChatMessageSearch,
    ChatMessageList,
    ChatMessageComposer,
    ChatDeleteMessageDialog,
    ChatFileListDialog
  },

  props: {
    messages: { type: Array },
    inputField: { type: String },
    templates: { type: Array },
    isSending: { type: Boolean },
    uploadProgress: {
      type: Number,
      default: null
    },
    typing: {
      default: () => [],
      type: Array
    },
    currentUser: { type: Object },
    linkedMessageId: { type: Number },
    highlightLinkedMessage: {
      default: true,
      type: Boolean
    },
    tasks: { type: Array },
    taskWatchingNow: {
      default: () => [],
      type: Array
    },
    isShowHelper: { type: Boolean },
    isMobile: { type: Boolean },
    isDialog: {
      default: false,
      type: Boolean
    },
    client: { type: Object },
    isEnd: { type: Boolean },
    pendingNewMessagesCount: {
      type: Number,
      default: 0
    },
    hasTrimmedNewerMessages: {
      type: Boolean,
      default: false
    },
    comments: {
      default: true,
      type: Boolean
    },
    showAnswerRequiredActions: {
      default: true,
      type: Boolean
    },
    onboardingDemo: {
      default: false,
      type: Boolean
    },
    portalMode: {
      default: false,
      type: Boolean
    },
    allowMessageMutations: {
      default: true,
      type: Boolean
    },
    readOnly: {
      default: false,
      type: Boolean
    },
    showInternalActions: {
      default: true,
      type: Boolean
    },
    showFilesAction: {
      default: true,
      type: Boolean
    },
    showHelperAction: {
      default: true,
      type: Boolean
    },
    chatHeight: {
      default: null,
      type: String
    },
    clientFiles: {
      type: Array,
      default: () => []
    },
  },

  data: () => ({
    text: '',
    search: '',
    requestPending: false,
    scrollToBottomKey: false,
    routeMessageIdToScroll: null,

    chatWindowWidth: 500,

    isShowFileList: false,
    fileList: [],
    isDeleteMessageConfirmOpen: false,
    deleteMessageCandidate: null,

    lastKnownLastMessageId: null,
    lastKnownMessagesLength: 0,
    highlightMessageTimers: {},
    portionMessagesTimer: null,
    markReadEmitTimer: null,
    stickToBottom: false,
    stickToBottomTimer: null,
    contentResizeObserver: null,
  }),

  mounted () {
    try {
      this.observeContentResize()
      if (this.getRouteMessageId()) {
        this.scrollToRouteMessage()
      } else {
        this.startStickToBottom()
      }
      this.$refs.composer.focus()
      this.$nextTick(() => {
        this.$refs.composer.autoResize()
        this.scheduleMessagesUpdatedEmit()
      })
    } catch (ignoredError) {
    }
  },

  methods: {
    scrollToBottom (timeout = 0) {
      setTimeout(() => {
        let scrollArea = document.querySelector('#chat-dialog > div > div')
        if (this.isDialog) {
          scrollArea = document.querySelector('#chat-dialog-pop-up > div > div')
        }
        scrollArea.scrollTo(0, scrollArea.scrollHeight)
      }, timeout)
    },

    // При открытии чата сообщения приходят позже монтирования (кэш, сервер), а картинки и превью
    // догружаются ещё позже и меняют высоту. Поэтому несколько секунд держим прокрутку внизу
    // при любом изменении высоты содержимого, пока пользователь сам не начнёт листать.
    startStickToBottom (duration = 4000) {
      if (this.getRouteMessageId() || this.routeMessageIdToScroll || this.linkedMessageId) {
        return
      }
      this.stickToBottom = true
      clearTimeout(this.stickToBottomTimer)
      this.stickToBottomTimer = setTimeout(() => {
        this.stickToBottom = false
      }, duration)
      this.$nextTick(() => this.scrollToBottomNow())
    },

    stopStickToBottom () {
      this.stickToBottom = false
      clearTimeout(this.stickToBottomTimer)
      this.stickToBottomTimer = null
    },

    scrollToBottomNow () {
      const scrollZone = this.getScrollZone()
      if (scrollZone) {
        scrollZone.scrollTop = scrollZone.scrollHeight
      }
    },

    observeContentResize () {
      const content = this.$refs.messageList?.getContentEl()
      if (!content || typeof ResizeObserver === 'undefined') {
        return
      }
      this.contentResizeObserver = new ResizeObserver(() => {
        if (this.stickToBottom) {
          this.scrollToBottomNow()
        }
      })
      this.contentResizeObserver.observe(content)
      const scrollZone = this.getScrollZone()
      if (scrollZone) {
        // Колесо, касание и перетаскивание полосы прокрутки — пользователь листает сам
        scrollZone.addEventListener('wheel', this.stopStickToBottom, { passive: true })
        scrollZone.addEventListener('touchstart', this.stopStickToBottom, { passive: true })
        scrollZone.addEventListener('mousedown', this.stopStickToBottom)
      }
    },

    smoothScrollToBottom () {
      let scrollArea = document.querySelector('#chat-dialog > div > div')
      if (this.isDialog) {
        scrollArea = document.querySelector('#chat-dialog-pop-up > div > div')
      }
      scrollArea.scrollTo({
        top: scrollArea.scrollHeight,
        left: 0,
        behavior: 'smooth'
      })
    },

    scrollToElementById (id, options = {}) {
      const root = document.getElementById(id)
      if (!root) {
        return false
      }
      const messageBubble =
        root.querySelector('.q-message-text-content') ||
        root.querySelector('.q-message-text') ||
        root
      messageBubble.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      })

      if (options.highlight !== false) {
        this.highlightMessageElement(messageBubble, id)
      } else {
        this.clearMessageHighlight(messageBubble, id)
        this.$emit('clearLinkedMessageId')
      }
      return true
    },

    clearMessageHighlight (element, id) {
      if (!element) {
        return
      }
      const key = String(id)
      if (this.highlightMessageTimers[key]) {
        clearTimeout(this.highlightMessageTimers[key])
        delete this.highlightMessageTimers[key]
      }
      element.classList.remove('chat-message--highlighted')
      element.style.removeProperty('background-color')
    },

    highlightMessageElement (element, id) {
      if (!element) {
        return
      }
      const key = String(id)
      if (this.highlightMessageTimers[key]) {
        clearTimeout(this.highlightMessageTimers[key])
        delete this.highlightMessageTimers[key]
      }
      element.classList.remove('chat-message--highlighted')
      void element.offsetWidth
      element.classList.add('chat-message--highlighted')
      this.highlightMessageTimers[key] = setTimeout(() => {
        element.classList.remove('chat-message--highlighted')
        element.style.removeProperty('background-color')
        delete this.highlightMessageTimers[key]
        this.$emit('clearLinkedMessageId')
      }, 2500)
    },

    scrollToMessageAfterSearch (messageId) {
      const id = Number(messageId)
      if (!id) {
        return
      }
      this.routeMessageIdToScroll = id
      if (this.messages.some(m => Number(m.id) === id)) {
        this.$nextTick(() => {
          const scrolled = this.goToMessage(id)
          if (scrolled && Number(this.routeMessageIdToScroll) === id) {
            this.routeMessageIdToScroll = null
          }
        })
        return
      }
      this.$emit('scrollToMessageAfterSearch', id)
      setTimeout(() => {
        const scrolled = this.goToMessage(id)
        if (scrolled && Number(this.routeMessageIdToScroll) === id) {
          this.routeMessageIdToScroll = null
        }
      }, 500)
    },

    requestDeleteMessage (message) {
      if (!this.canDeleteMessages || !message || message.deleted) {
        return
      }
      this.deleteMessageCandidate = message
      this.isDeleteMessageConfirmOpen = true
    },

    confirmDeleteMessage () {
      const message = this.deleteMessageCandidate
      if (!message) {
        this.clearDeleteMessageConfirmation()
        return
      }
      this.isDeleteMessageConfirmOpen = false
      this.deleteMessageCandidate = null
      this.$emit('deleteMessage', message)
    },

    clearDeleteMessageConfirmation () {
      this.isDeleteMessageConfirmOpen = false
      this.deleteMessageCandidate = null
    },

    deleteMessage (message) {
      this.$emit('deleteMessage', message)
    },

    goToMessage (messageId, options = {}) {
      this.stopStickToBottom()
      const id = this.isDialog ? `modal_message_${messageId}` : `message_${messageId}`
      return this.scrollToElementById(id, options)
    },

    getPortionMessages () {
      if (this.portionMessagesTimer) {
        return
      }
      this.portionMessagesTimer = setTimeout(() => {
        this.portionMessagesTimer = null
        this.handlePortionMessages()
      }, 80)
    },

    handlePortionMessages () {
      const scrollZone = this.getScrollZone()
      if (!scrollZone) {
        return
      }
      const distanceToBottom = scrollZone.scrollHeight - scrollZone.clientHeight - scrollZone.scrollTop
      this.scrollToBottomKey = distanceToBottom >= 600
      const denominator = scrollZone.scrollHeight - scrollZone.clientHeight
      if (denominator <= 0 || this.requestPending) {
        return
      }
      const scrollPercent = (scrollZone.scrollTop / denominator) * 100
      if (distanceToBottom <= 120 && !this.hasTrimmedNewerMessages) {
        this.scheduleMessagesUpdatedEmit()
      }
      if (scrollPercent <= 3) {
        this.loadOlderMessagesWithAnchor(scrollZone)
        return
      }
      if (distanceToBottom <= 80 && this.hasTrimmedNewerMessages) {
        this.loadNewerMessagesWithAnchor(scrollZone)
      }
    },

    loadOlderMessagesWithAnchor (scrollZone) {
      if (this.isEnd || this.requestPending) {
        return
      }
      this.requestPending = true
      const previousScrollHeight = scrollZone.scrollHeight
      const previousScrollTop = scrollZone.scrollTop
      this.$emit('getMessagePage', 1)
      setTimeout(() => {
        this.requestPending = false
        const newScrollHeight = scrollZone.scrollHeight
        const addedHeight = newScrollHeight - previousScrollHeight
        scrollZone.scrollTop = previousScrollTop + addedHeight
      }, 260)
    },

    loadNewerMessagesWithAnchor (scrollZone) {
      if (this.requestPending) {
        return
      }
      this.requestPending = true
      const previousScrollTop = scrollZone.scrollTop
      this.$emit('getNewerMessagePage')
      setTimeout(() => {
        this.requestPending = false
        // Не прыгаем сразу в самый низ.
        // Оставляем пользователя на старой позиции, чтобы он мог продолжить листать вниз.
        scrollZone.scrollTop = previousScrollTop
      }, 260)
    },

    handleGoToLatestClick () {
      if (this.pendingNewMessagesCount > 0 || this.hasTrimmedNewerMessages) {
        this.$emit('goToLatestMessages')
        return
      }
      this.smoothScrollToBottom()
    },

    scheduleMessagesUpdatedEmit () {
      if (this.markReadEmitTimer) {
        clearTimeout(this.markReadEmitTimer)
      }
      this.markReadEmitTimer = setTimeout(() => {
        this.markReadEmitTimer = null
        const scrollZone = this.getScrollZone()
        if (!this.isNearBottom(scrollZone, 220)) {
          return
        }
        if (this.hasTrimmedNewerMessages) {
          return
        }
        this.$emit('updated')
      }, 250)
    },

    showFiles () {
      this.isShowFileList = true
      if (this.isDialog || this.portalMode) {
        this.fileList = this.normalizeFileList(this.clientFiles)
        return
      }
      axios.get(`/api/v1/client-files/${this.client.id}`)
        .then(response => {
          this.fileList = this.normalizeFileList(response.data)
        })
        .catch(() => {
          this.fileList = []
        })
    },

    normalizeFileList (files) {
      return Array.isArray(files)
        ? files.filter(file => file && file.uuid)
        : []
    },

    isLastMessage (message) {
      const visibleMessages = this.messages.filter(m => !m.deleted)
      return visibleMessages.length > 0 && visibleMessages[visibleMessages.length - 1].id === message.id
    },

    getMessageId (message) {
      return getMessageId(message)
    },

    getRouteMessageId () {
      const rawMessageId = this.$route?.query?.messageId
      if (Array.isArray(rawMessageId)) {
        return Number(rawMessageId[0])
      }
      const messageId = Number(rawMessageId)
      return Number.isFinite(messageId) && messageId > 0 ? messageId : null
    },

    scrollToRouteMessage () {
      const messageId = this.getRouteMessageId()
      if (!messageId) {
        return
      }
      this.scrollToMessageAfterSearch(messageId)
    },

    findInKnowledgeBase (message) {
      const text = String(message?.text || '').trim()
      if (!text) {
        return
      }
      this.$emit('findInKnowledgeBase', text)
    },

    getScrollZone () {
      const chat = document.getElementById(this.isDialog ? 'chat-dialog-pop-up' : 'chat-dialog')
      return chat?.children?.[0]?.children?.[0] || null
    },

    isNearBottom (scrollZone, threshold = 160) {
      if (!scrollZone) {
        return false
      }
      return scrollZone.scrollHeight - scrollZone.clientHeight - scrollZone.scrollTop <= threshold
    },

    getMessageSortTime (message) {
      const rawDate = message?.date
      const time = rawDate instanceof Date
        ? rawDate.getTime()
        : new Date(rawDate || 0).getTime()
      return Number.isFinite(time) ? time : 0
    },

    sortMessagesByDateAndId (messages) {
      if (!Array.isArray(messages)) {
        return []
      }
      return [...messages].sort((a, b) => {
        const dateDiff = this.getMessageSortTime(a) - this.getMessageSortTime(b)
        if (dateDiff !== 0) {
          return dateDiff
        }
        return Number(a?.id || 0) - Number(b?.id || 0)
      })
    },

    // Ответ и редактирование сообщения выполняет панель ввода
    setReplyMessage (message) {
      this.$refs.composer.setReplyMessage(message)
    },

    startEditMessage (message) {
      this.$refs.composer.startEditMessage(message)
    },

    // Вызывается родительским контейнером чата (его границы — реальная область окна чата)
    // при drop файлов через drag-n-drop, т.к. корневые узлы этого компонента — фрагменты
    // без общего оборачивающего блока на весь экран чата.
    addDroppedFiles (files) {
      this.$refs.composer.addDroppedFiles(files)
    },
  },

  computed: {
    isObserverUser () {
      if (this.readOnly) {
        return true
      }
      const authorities = Array.isArray(this.currentUser?.authorities)
        ? this.currentUser.authorities
        : (Array.isArray(this.store.currentUser?.authorities) ? this.store.currentUser.authorities : [])
      return authorities.includes('OBSERVER')
    },

    canSendMessages () {
      if (this.isObserverUser || this.readOnly) {
        return false
      }
      const authorities = Array.isArray(this.currentUser?.authorities)
        ? this.currentUser.authorities
        : (Array.isArray(this.store.currentUser?.authorities) ? this.store.currentUser.authorities : [])
      return authorities.some(role => ['ADMIN', 'MANAGER', 'SENIOR_OPERATOR', 'OPERATOR', 'CLIENT'].includes(role))
    },

    // Удаление сообщений на backend разрешено только ADMIN/MANAGER.
    canDeleteMessages () {
      return this.allowMessageMutations && !this.isObserverUser && this.$can('CHAT_MESSAGE_DELETE')
    },

    chatStyle () {
      let height = this.chatHeight
      if (!height) {
        if (this.isDialog) {
          height = this.canSendMessages ? 'calc(100% - 93px)' : 'calc(100% - 47px)'
        } else if (this.isMobile) {
          height = this.canSendMessages ? 'calc(100vh - 181px)' : 'calc(100vh - 135px)'
        } else {
          height = this.canSendMessages ? 'calc(100vh - 95px)' : 'calc(100vh - 49px)'
        }
      }
      return {
        height,
        'border-radius': '0',
        'min-height': '0',
        'background-color': '#F0F0F0'
      }
    },

    sortedMessages () {
      // Менеджер организации не видит удалённые сообщения и внутренние комментарии поддержки
      const messages = this.isObserverUser
        ? (this.messages || []).filter(message => message?.deleted !== true && message?.isComment !== true)
        : this.messages
      return this.sortMessagesByDateAndId(messages)
    }
  },

  watch: {
    clientFiles: {
      deep: true,
      handler (value) {
        if ((!this.isDialog && !this.portalMode) || !this.isShowFileList) {
          return
        }
        this.fileList = this.normalizeFileList(value)
      }
    },

    'client.id' (newId, oldId) {
      if (!newId || Number(newId) === Number(oldId)) {
        return
      }
      // Другой клиент в том же компоненте: следующий список сообщений считаем первой загрузкой
      this.lastKnownLastMessageId = null
      this.lastKnownMessagesLength = 0
      this.startStickToBottom()
    },

    linkedMessageId () {
      if (!this.linkedMessageId) {
        return
      }
      // Переход к прикреплённому сообщению всегда начинает пользователь (кнопка «Привязано», поиск, уведомление),
      // поэтому сообщение подсвечиваем; linkedMessageId сбрасывается после подсветки
      this.$nextTick(() => {
        this.goToMessage(this.linkedMessageId, {highlight: this.highlightLinkedMessage})
      })
    },

    messages: {
      immediate: true,
      handler (newVal) {
        try {
          if (this.routeMessageIdToScroll) {
            const messageId = this.routeMessageIdToScroll
            if (this.messages.some(m => Number(m.id) === Number(messageId))) {
              this.$nextTick(() => {
                const scrolled = this.goToMessage(messageId)
                if (scrolled) {
                  this.routeMessageIdToScroll = null
                }
              })
            }
            return
          }
          const messages = this.sortMessagesByDateAndId(newVal)
          this.scheduleMessagesUpdatedEmit()
          const lastMessage = messages[messages.length - 1]
          const currentLastMessageId = this.getMessageId(lastMessage)
          const previousLastMessageId = this.lastKnownLastMessageId
          const previousMessagesLength = this.lastKnownMessagesLength
          this.lastKnownLastMessageId = currentLastMessageId
          this.lastKnownMessagesLength = messages.length
          if (!previousLastMessageId) {
            // Первая загрузка сообщений чата
            if (currentLastMessageId) {
              this.startStickToBottom()
            }
            return
          }
          const messageWasAddedToBottom =
            currentLastMessageId &&
            currentLastMessageId !== previousLastMessageId &&
            messages.length >= previousMessagesLength
          if (!messageWasAddedToBottom) {
            return
          }
          const scrollZone = this.getScrollZone()
          const shouldScrollToBottom = this.isNearBottom(scrollZone)
          if (shouldScrollToBottom) {
            this.$nextTick(() => {
              this.scrollToBottom(0)
            })
          }
        } catch (ignoreError) {
        }
      },
      deep: true
    },

    '$route.query.messageId' () {
      this.scrollToRouteMessage()
    },
  },

  setup () {
    const store = useStore()
    const router = useRoute()

    return {
      store,
      router
    }
  },

  beforeUnmount () {
    this.stopStickToBottom()
    this.contentResizeObserver?.disconnect()
    const scrollZone = this.getScrollZone()
    if (scrollZone) {
      scrollZone.removeEventListener('wheel', this.stopStickToBottom)
      scrollZone.removeEventListener('touchstart', this.stopStickToBottom)
      scrollZone.removeEventListener('mousedown', this.stopStickToBottom)
    }
    Object.values(this.highlightMessageTimers || {}).forEach(timer => clearTimeout(timer))
    this.highlightMessageTimers = {}
    if (this.portionMessagesTimer) {
      clearTimeout(this.portionMessagesTimer)
      this.portionMessagesTimer = null
    }
    if (this.markReadEmitTimer) {
      clearTimeout(this.markReadEmitTimer)
      this.markReadEmitTimer = null
    }
  },
}
</script>
