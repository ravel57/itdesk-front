<template>
  <q-layout
    data-tour="chat-message-list"
    container
    :id="this.isDialog ? 'chat-dialog-pop-up' : 'chat-dialog'"
    ref="chatDialog"
    :style="chatStyle"
    class="no-shadow"
    @scroll="this.$emit('scroll')"
  >
    <q-page-container>
      <q-page
        style="padding-top: 8px;min-height: 0"
        :ref="this.isDialog ? 'chatPopUp' : 'chat'"
        :id="this.isDialog ? 'chatPopUp' : 'chat'"
      >
        <div class="q-pa-md row justify-center q-gutter-md">
          <div
            v-for="message in sortedMessages"
            :key="`${message.id}:${message.editedAt ? new Date(message.editedAt).getTime() : 0}`"
            class="chat-message-row"
            style="position: relative;width: 100%; margin-top: 0"
            @contextmenu.capture="this.guardMessageContextMenu"
            @click.right="this.canUseCustomContextMenu && this.invertContextMenu()"
            :class="{ 'chat-dialog--wheel-scrolling': isWheelScrollingMessages }"
            @wheel.passive="markMessagesWheelScrolling"
          >
            <q-chat-message
              :id="`${this.isDialog ? 'modal_message' : 'message'}_${message.id}`"
              :avatar="message.avatar"
              :name="this.getName(message)"
              :sent="message.isSent"
              text-color="black"
              :class="message.deleted ? 'strikethrough' : ''"
              style="white-space: pre-wrap;"
              :bg-color="message.isComment ? 'deep-purple-2' : message.isSent ? '#e0e0e0' : 'white'"
            >
              <template v-slot:stamp>
                <span
                  v-text="this.getStamp(message)"
                />
                <q-icon
                  v-if="!this.isDialog && message.linkedTaskId"
                  class="linked-task-icon"
                  name="link"
                  @click.stop="openLinkedTaskByMessage(message)"
                >
                  <q-tooltip>Открыть связанную заявку</q-tooltip>
                </q-icon>
              </template>
              <div
                v-if="message.replyMessageId"
                class="flex cursor-pointer"
                @click="this.$emit('scrollToMessage', message.replyMessageId)"
              >
                <div
                  v-if="!message.replyUuid && !message.replyFileType"
                  style="height: 40px;width: 40px;display: flex;align-items: center;justify-content: center;"
                >
                  <q-icon
                    size="25px"
                    name="reply"
                  />
                </div>
                <div
                  v-else-if="message.replyFileType && message.replyFileType.startsWith('application/')"
                  style="height: 40px; width: 40px; display: flex; align-items: center; justify-content: center;"
                >
                  <q-icon
                    size="25px"
                    name="description"
                  />
                </div>
                <div
                  v-else-if="message.replyUuid && message.replyFileType && message.replyFileType.startsWith('image/')"
                >
                  <img
                    :src="`/files/images/${message.replyUuid}`"
                    style="width: 40px;height: 40px;border-radius: 4px;object-fit: cover;"
                    alt=""
                  >
                </div>
                <div
                  v-else-if="message.replyUuid && message.replyFileType && message.replyFileType.startsWith('video/')"
                >
                  <video
                    style="width: 40px; height: 40px; border-radius: 4px; object-fit: cover;"
                  >
                    <source
                      :src="`/files/videos/${message.replyUuid}`"
                      type="video/mp4"
                    >
                    Your browser does not support the video tag.
                  </video>
                </div>
                <div style="margin-left: 10px;display: flex; flex-direction: column;justify-content: center">
                  <div class="">От: {{
                      message.user ? message.user.lastname + ' ' + message.user.firstname : this.getClientDisplayName(this.client)
                    }}
                  </div>
                  <div class="">
                    {{ getReplyPreviewText(message) }}
                  </div>
                </div>
              </div>
              <div>
                <img
                  v-if="message.fileUuid && message.fileType.startsWith('image/')"
                  :src="`/files/images/${message.fileUuid}`"
                  :style="getMediaMessageSize(message)"
                  style="cursor: pointer;border-radius: 4px"
                  @click="this.openPhoto(message)"
                  alt=""
                >
                <video
                  v-else-if="message.fileUuid && message.fileType.startsWith('video/')"
                  style="max-width: 400px;"
                  :style="getMediaMessageSize(message)"
                  controls
                >
                  <source
                    :src="`/files/videos/${message.fileUuid}`"
                    type="video/mp4"
                  >
                  Your browser does not support the video tag.
                </video>
                <audio
                  v-else-if="message.fileUuid && message.fileType.startsWith('audio/')"
                  style="min-width: 300px; width: 90%; max-width: 400px"
                  controls
                >
                  <source
                    :src="`/files/audios/${message.fileUuid}`"
                    type="audio/ogg"
                  >
                  Your browser does not support the video tag.
                </audio>
                <a
                  v-else-if="message.fileUuid"
                  :href="`/files/documents/${message.fileUuid}`"
                  target="_blank"
                >
                  <q-icon name="attach_file"/>
                  {{ message.fileName }}
                </a>
                <div
                  class="chat-message-text"
                  v-html="this.findLinks(message.text)"
                  style="max-width: 400px;"
                />
                <operator-hint-feedback
                  v-if="canRateHints && message.operatorHintId"
                  :hint="operatorHints[message.operatorHintId] || { id: message.operatorHintId, helpful: null }"
                  @rated="onHintRated"
                />
              </div>
            </q-chat-message>

            <div
              :data-tour="this.isOnboardingAnswerRequiredMessage(message) ? 'chat-answer-required' : undefined"
              v-if="this.canSetAnswerRequired(message) || this.isOnboardingAnswerRequiredMessage(message)"
              class="answer-required-actions"
              :class="{
                'answer-required-actions--selected': isSelectedAnswerRequiredMessage(message),
                'answer-required-actions--onboarding': isOnboardingAnswerRequiredMessage(message)
              }"
            >
              <q-btn
                dense
                flat
                size="12px"
                icon="priority_high"
                label="Требует ответа"
                :color="isAnswerRequired(message) ? 'primary' : 'grey'"
                @click="setAnswerRequired(message, true)"
              />

              <q-btn
                dense
                flat
                size="12px"
                icon="done"
                label="Не требует ответа"
                :color="isAnswerNotRequired(message) ? 'positive' : 'grey'"
                @click="setAnswerRequired(message, false)"
              />
            </div>

            <q-menu
              v-if="this.isShowCustomContextMenu && this.canUseCustomContextMenu"
              touch-position
              context-menu
            >
              <q-list dense style="min-width: 100px">
                <q-item
                  clickable
                  v-close-popup
                >
                  <q-item-section
                    @click="this.$emit('reply', message)"
                  >
                    Ответить
                  </q-item-section>
                </q-item>
                <q-item
                  v-if="canEditMessage(message)"
                  clickable
                  v-close-popup
                >
                  <q-item-section
                    @click="this.$emit('edit', message)"
                  >
                    Редактировать
                  </q-item-section>
                </q-item>
                <q-item
                  v-if="this.canDeleteMessages && !message.deleted"
                  clickable
                  v-close-popup
                >
                  <q-item-section
                    @click="this.$emit('requestDelete', message)"
                  >
                    Удалить
                  </q-item-section>
                </q-item>
                <q-item
                  v-if="message.text"
                  clickable
                  v-close-popup
                >
                  <q-item-section
                    @click="copyToClipboard(message.text)"
                  >
                    Скопировать текст
                  </q-item-section>
                </q-item>
                <q-item
                  v-if="message.text"
                  clickable
                >
                  <q-item-section
                    @click="pastToInputField(message.text)"
                    v-close-popup
                  >
                    Вставить в поле ввода
                  </q-item-section>
                </q-item>
                <q-item
                  v-if="this.showInternalActions"
                  clickable
                >
                  <q-item-section
                    @click="this.createNewTask(message)"
                    v-close-popup
                  >
                    Создать заявку из сообщения
                  </q-item-section>
                </q-item>
                <q-item
                  v-if="this.showInternalActions && message.text"
                  clickable
                  v-close-popup
                  @click="this.$emit('findInKnowledgeBase', message)"
                >
                  <q-item-section>
                    Найти в базе знаний
                  </q-item-section>
                </q-item>
                <q-item
                  v-if="this.showInternalActions && this.tasks.filter(t => !t.completed).length > 0"
                  clickable
                >
                  <q-item-section>
                    Привязать к заявке
                  </q-item-section>
                  <q-item-section side>
                    <q-icon name="keyboard_arrow_right"/>
                  </q-item-section>
                  <q-menu anchor="top end" self="top start">
                    <q-list>
                      <q-item
                        v-for="task in this.tasks.filter(t => !t.completed)"
                        :key="task.id"
                        dense
                        clickable
                        @click="this.linkToTask(message, task)"
                        v-close-popup
                      >
                        <q-item-section>
                          {{ task.name }}
                        </q-item-section>
                      </q-item>
                    </q-list>
                  </q-menu>
                </q-item>
              </q-list>
            </q-menu>
          </div>
        </div>
      </q-page>
    </q-page-container>
  </q-layout>
  <chat-photo-dialog
    v-model="this.isShowMaxSizePhoto"
    :photo="this.selectedPhoto"
    :is-mobile="this.isMobile"
  />
</template>

<script>
import axios from 'axios'
import { useResizeObserver } from '@vueuse/core'
import { onMounted, ref } from 'vue'
import { useStore } from 'stores/store'
import { getClientDisplayName } from 'src/util/clientName'
import { findLinks, getMessageId, getMessageSenderName, shortenLine } from 'src/util/chatMessageText'
import OperatorHintFeedback from 'components/chat/OperatorHintFeedback.vue'
import ChatPhotoDialog from 'components/chat/ChatPhotoDialog.vue'

// Лента сообщений чата: сообщения, контекстное меню, «требует ответа», оценка подсказок Jev, просмотр фото
export default {

  name: 'ChatMessageList',

  components: { OperatorHintFeedback, ChatPhotoDialog },

  props: {
    // Сообщения чата в порядке, пришедшем от родителя (по ним считаются группы «требует ответа» и подсказки)
    messages: { type: Array },
    // Сообщения для отрисовки (отсортированные)
    sortedMessages: { type: Array },
    chatStyle: { type: Object },
    // Поисковая строка: совпадения подсвечиваются в тексте сообщений
    search: { type: String },
    client: { type: Object },
    currentUser: { type: Object },
    tasks: { type: Array },
    isDialog: {
      default: false,
      type: Boolean
    },
    isMobile: { type: Boolean },
    portalMode: {
      default: false,
      type: Boolean
    },
    isObserverUser: { type: Boolean },
    canDeleteMessages: { type: Boolean },
    allowMessageMutations: {
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
    showInternalActions: {
      default: true,
      type: Boolean
    }
  },

  emits: [
    'scroll',
    'scrollToMessage',
    'reply',
    'edit',
    'requestDelete',
    'pastToInputField',
    'findInKnowledgeBase',
    'linkToTask',
    'openLinkedTask',
    'setAnswerRequired'
  ],

  data: () => ({
    // Оценки подсказок Jev по id подсказки; комментарий с подсказкой помечен operatorHintId
    operatorHints: {},
    operatorHintsTimer: null,
    isShowCustomContextMenu: true,
    rightClickCounter: 0,
    isShowMaxSizePhoto: false,
    selectedPhoto: '',
    isWheelScrollingMessages: false,
    wheelScrollingTimer: null
  }),

  methods: {
    // Элемент с содержимым ленты (q-page) — за его высотой следит родитель
    getContentEl () {
      return this.$refs[this.isDialog ? 'chatPopUp' : 'chat']?.$el
    },

    loadOperatorHints () {
      const clientId = this.client?.id
      if (!this.canRateHints || !clientId) {
        return
      }
      axios.get('/api/v1/operator-hints', { params: { clientId } })
        .then(({ data }) => {
          if (Number(this.client?.id) !== Number(clientId)) {
            return
          }
          this.operatorHints = Object.fromEntries((data || []).map(hint => [hint.id, hint]))
        })
        .catch(() => undefined)
    },

    onHintRated (hint) {
      this.operatorHints = { ...this.operatorHints, [hint.id]: hint }
    },

    getClientDisplayName (client) {
      return getClientDisplayName(client)
    },

    copyToClipboard (text) {
      navigator.clipboard.writeText(text)
    },

    pastToInputField (text) {
      this.$emit('pastToInputField', text)
    },

    getStamp (message) {
      const date = message?.date instanceof Date
        ? message.date
        : new Date(message?.date)
      if (Number.isNaN(date.getTime())) {
        return ''
      }
      const time = date.toLocaleTimeString('ru-RU', {
        timeZone: 'Europe/Moscow',
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
      return message.editedAt ? `${time} · изменено` : time
    },

    getName (message) {
      return getMessageSenderName(message)
    },

    getMessageId (message) {
      return getMessageId(message)
    },

    findLinks (message) {
      return findLinks(message, this.search)
    },

    linkToTask (message, task) {
      this.$emit('linkToTask', message, task)
    },

    openLinkedTaskByMessage (message) {
      this.$emit('openLinkedTask', message)
    },

    guardMessageContextMenu (event) {
      if (!this.canUseCustomContextMenu) {
        return
      }
      const target = event?.target
      const messageBubble = target instanceof Element
        ? target.closest('.q-message-text')
        : null

      if (messageBubble && event.currentTarget?.contains(messageBubble)) {
        return
      }

      // Stop the event before Quasar's row-level context-menu handler sees it,
      // but do not prevent the browser default. Outside the message bubble the
      // native browser context menu must remain available.
      event.stopPropagation()
      event.stopImmediatePropagation?.()
    },

    invertContextMenu () {
      if (!this.canUseCustomContextMenu) {
        return
      }
      if (this.rightClickCounter > 0) {
        this.isShowCustomContextMenu = false
        setTimeout(() => {
          this.isShowCustomContextMenu = true
          this.rightClickCounter = 0
        }, 500)
      }
      this.rightClickCounter++
    },

    createNewTask (message) {
      const queryParams = new URLSearchParams(window.location.search)
      queryParams.delete('task')
      queryParams.set('newTaskFromMessage', message.id)
      this.$router.push({
        path: this.$route.path,
        query: Object.fromEntries(queryParams.entries())
      })
    },

    openPhoto (photo) {
      this.isShowMaxSizePhoto = true
      this.selectedPhoto = photo
    },

    isIncomingMessage (message) {
      return message && !message.isSent && !message.isComment && !message.deleted
    },

    isOperatorMessage (message) {
      return message && message.isSent && !message.isComment && !message.deleted
    },

    getConversationMessages () {
      return this.messages.filter(message => message && !message.deleted && !message.isComment)
    },

    getLastMessageIndex (messages, predicate) {
      for (let index = messages.length - 1; index >= 0; index--) {
        if (predicate(messages[index])) {
          return index
        }
      }
      return -1
    },

    getMessageIndex (messages, message) {
      const messageId = this.getMessageId(message)
      return messages.findIndex(currentMessage => {
        const currentMessageId = this.getMessageId(currentMessage)
        if (messageId && currentMessageId) {
          return currentMessageId === messageId
        }
        return currentMessage === message
      })
    },

    getLastMessageIndexBefore (messages, beforeIndex, predicate) {
      for (let index = beforeIndex - 1; index >= 0; index--) {
        if (predicate(messages[index])) {
          return index
        }
      }
      return -1
    },

    getFirstMessageIndexAfter (messages, afterIndex, predicate) {
      for (let index = afterIndex + 1; index < messages.length; index++) {
        if (predicate(messages[index])) {
          return index
        }
      }
      return -1
    },

    getAnswerRequiredGroupRange (message) {
      const conversationMessages = this.getConversationMessages()
      const messageIndex = this.getMessageIndex(conversationMessages, message)
      if (messageIndex === -1 || !this.isIncomingMessage(conversationMessages[messageIndex])) {
        return null
      }

      const previousOperatorIndex = this.getLastMessageIndexBefore(
        conversationMessages,
        messageIndex,
        currentMessage => this.isOperatorMessage(currentMessage)
      )
      const nextOperatorIndex = this.getFirstMessageIndexAfter(
        conversationMessages,
        messageIndex,
        currentMessage => this.isOperatorMessage(currentMessage)
      )

      const startIndex = previousOperatorIndex + 1
      const endIndex = nextOperatorIndex === -1
        ? conversationMessages.length - 1
        : nextOperatorIndex - 1

      return {
        conversationMessages,
        startIndex,
        endIndex
      }
    },

    getAnswerRequiredGroupMessages (message) {
      const range = this.getAnswerRequiredGroupRange(message)
      if (!range) {
        return []
      }

      return range.conversationMessages
        .slice(range.startIndex, range.endIndex + 1)
        .filter(currentMessage => this.isIncomingMessage(currentMessage) && this.getMessageId(currentMessage))
    },

    isInAnswerRequiredRange (message) {
      const groupMessages = this.getAnswerRequiredGroupMessages(message)
      if (groupMessages.length === 0) {
        return false
      }

      const conversationMessages = this.getConversationMessages()
      const messageIndex = this.getMessageIndex(conversationMessages, message)
      const lastIncomingIndex = this.getLastMessageIndex(conversationMessages, currentMessage => this.isIncomingMessage(currentMessage))
      const lastOperatorIndex = this.getLastMessageIndex(conversationMessages, currentMessage => this.isOperatorMessage(currentMessage))

      if (messageIndex === -1 || lastIncomingIndex === -1 || lastOperatorIndex > lastIncomingIndex) {
        return false
      }

      return messageIndex > lastOperatorIndex && messageIndex <= lastIncomingIndex
    },

    isOnboardingAnswerRequiredMessage (message) {
      return this.onboardingDemo &&
        this.isIncomingMessage(message) &&
        message.answerRequired === 'ANSWER_REQUIRED'
    },

    canSetAnswerRequired (message) {
      return !this.isObserverUser &&
        this.showAnswerRequiredActions &&
        this.isIncomingMessage(message) &&
        !!this.getMessageId(message) &&
        this.isInAnswerRequiredRange(message)
    },

    hasAnswerRequiredValue (message) {
      return message && (
        message.answerRequired === 'ANSWER_REQUIRED' ||
        message.answerRequired === 'ANSWER_NOT_REQUIRED'
      )
    },

    getSelectedAnswerRequiredMessageIdInGroup (message) {
      const selectedMessage = [...this.getAnswerRequiredGroupMessages(message)]
        .reverse()
        .find(currentMessage => this.hasAnswerRequiredValue(currentMessage))
      return this.getMessageId(selectedMessage)
    },

    isSelectedAnswerRequiredMessage (message) {
      return this.getSelectedAnswerRequiredMessageIdInGroup(message) === this.getMessageId(message)
    },

    isAnswerRequired (message) {
      return this.isSelectedAnswerRequiredMessage(message) && message.answerRequired === 'ANSWER_REQUIRED'
    },

    isAnswerNotRequired (message) {
      return this.isSelectedAnswerRequiredMessage(message) && message.answerRequired === 'ANSWER_NOT_REQUIRED'
    },

    applyAnswerRequiredLocally (message, answerRequired) {
      const messageId = this.getMessageId(message)
      this.getAnswerRequiredGroupMessages(message).forEach(currentMessage => {
        const currentMessageId = this.getMessageId(currentMessage)
        currentMessage.answerRequired = currentMessageId === messageId
          ? answerRequired
          : 'NOT_SET'
      })
    },

    setAnswerRequired (message, value) {
      const messageId = this.getMessageId(message)
      if (!messageId) {
        this.$q.notify({
          message: 'Нельзя изменить признак ответа: сообщение ещё не сохранено',
          type: 'warning'
        })
        return
      }
      const answerRequired = value
        ? 'ANSWER_REQUIRED'
        : 'ANSWER_NOT_REQUIRED'
      const groupMessageIds = this.getAnswerRequiredGroupMessages(message)
        .map(currentMessage => this.getMessageId(currentMessage))
        .filter(currentMessageId => currentMessageId)
      const resetMessageIds = groupMessageIds
        .filter(currentMessageId => currentMessageId !== messageId)

      this.applyAnswerRequiredLocally(message, answerRequired)
      this.$emit('setAnswerRequired', {
        messageId,
        clientId: this.client.id,
        answerRequired,
        groupMessageIds,
        resetMessageIds
      })
    },

    canEditMessage (message) {
      if (!this.allowMessageMutations || !message || message.deleted || !message.text || message.isSent !== true) {
        return false
      }
      // Чат клиента: оператор редактирует только свои сообщения, ADMIN/MANAGER — любые исходящие.
      if (this.isDialog || this.isAdminOrManager) {
        return true
      }
      const currentUserId = this.currentUser?.id ?? this.store.currentUser?.id
      return currentUserId != null && Number(message.user?.id) === Number(currentUserId)
    },

    getReplyPreviewText (message) {
      const replyText = String(message?.replyMessageText || '').trim()
      if (replyText) {
        return shortenLine(replyText, 50)
      }
      const replyFileType = String(message?.replyFileType || '')
      if (replyFileType.startsWith('image/')) {
        return 'Изображение'
      }
      if (replyFileType.startsWith('video/')) {
        return 'Видео'
      }
      if (replyFileType.startsWith('application/')) {
        return 'Документ'
      }
      return 'Сообщение'
    },

    markMessagesWheelScrolling () {
      this.isWheelScrollingMessages = true
      if (this.wheelScrollingTimer) {
        clearTimeout(this.wheelScrollingTimer)
      }
      this.wheelScrollingTimer = setTimeout(() => {
        this.isWheelScrollingMessages = false
      }, 180)
    }
  },

  computed: {
    canRateHints () {
      return !this.portalMode && this.$can('CHAT_REPLY')
    },

    // Подсказки в ленте: оценки подгружаются, когда в чате есть подсказка, которой ещё нет в списке
    operatorHintIds () {
      return (this.messages || [])
        .map(message => message?.operatorHintId)
        .filter(Boolean)
        .join(',')
    },

    canUseCustomContextMenu () {
      return !this.isObserverUser
    },

    isAdminOrManager () {
      const authorities = Array.isArray(this.currentUser?.authorities)
        ? this.currentUser.authorities
        : (Array.isArray(this.store.currentUser?.authorities) ? this.store.currentUser.authorities : [])
      return authorities.some(role => ['ADMIN', 'MANAGER'].includes(role))
    }
  },

  watch: {
    operatorHintIds: {
      immediate: true,
      handler (ids) {
        if (!this.canRateHints || !ids) {
          return
        }
        if (ids.split(',').some(id => !this.operatorHints[id])) {
          clearTimeout(this.operatorHintsTimer)
          this.operatorHintsTimer = setTimeout(() => this.loadOperatorHints(), 500)
        }
      }
    },

    'client.id' (newId, oldId) {
      if (!newId || Number(newId) === Number(oldId)) {
        return
      }
      this.operatorHints = {}
    }
  },

  setup (props) {
    const store = useStore()
    const chatDialog = ref(null)
    const containerWidth = ref('')

    const getMediaMessageSize = (message) => {
      let fileHeight, fileWidth

      if (message.fileHeight && message.fileWidth) {
        fileHeight = message.fileHeight
        fileWidth = message.fileWidth
      } else {
        fileHeight = props.isMobile ? 200 : 400
        fileWidth = props.isMobile ? 200 : 400
      }

      const newMaxWidth = containerWidth.value * 60 / 100
      const newMaxHeight = newMaxWidth
      let newWidth = fileWidth
      let newHeight = fileHeight

      const aspectRatio = fileWidth / fileHeight

      if (fileWidth <= newMaxWidth && fileHeight <= newMaxHeight) {
        newWidth = fileWidth
        newHeight = fileHeight
      } else {
        if (newWidth / newMaxWidth > newHeight / newMaxHeight) {
          newWidth = newMaxWidth
          newHeight = newMaxWidth / aspectRatio
        } else {
          newHeight = newMaxHeight
          newWidth = newMaxHeight * aspectRatio
        }
      }

      return `min-width: 200px; max-width: ${newMaxWidth}px; height: ${newHeight}px; width: ${newWidth}px;object-fit: cover;`
    }

    onMounted(() => {
      useResizeObserver(chatDialog, (entries) => {
        const entry = entries[0]
        const { width } = entry.contentRect
        containerWidth.value = width
      })
    })

    return {
      store,
      chatDialog,
      getMediaMessageSize
    }
  },

  beforeUnmount () {
    clearTimeout(this.operatorHintsTimer)
  }
}
</script>

<style scoped>
.chat-message-text {
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  word-break: break-word;
}

:deep(.q-message-text-content) {
  white-space: pre-wrap;
}

.strikethrough {
  text-decoration: line-through;
  opacity: 0.6;
}

:deep(.chat-search-highlight) {
  padding: 1px 4px;
  margin: 0 1px;
  border: 1px solid rgba(147, 0, 245, 0.32);
  border-radius: 5px;
  background-color: rgba(174, 92, 255, 0.72);
  box-shadow: 0 1px 2px rgba(93, 64, 0, 0.16);
  color: #2f2a18;
  font-weight: 600;
  line-height: 1.35;
  box-decoration-break: clone;
  -webkit-box-decoration-break: clone;
}

.answer-required-actions {
  display: flex;
  justify-content: flex-start;
  gap: 8px;
  max-height: 0;
  margin: 0;
  overflow: hidden;
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  transition: opacity 0.15s ease, max-height 0.15s ease, margin 0.15s ease;
  position: relative;
  z-index: 10;
}

.chat-message-row:hover .answer-required-actions,
.answer-required-actions.answer-required-actions--selected,
.answer-required-actions.answer-required-actions--onboarding {
  max-height: 36px;
  margin: 6px 0 0 0;
  opacity: 1;
  visibility: visible;
  pointer-events: auto;
}

.chat-dialog--wheel-scrolling .chat-message-row:hover .answer-required-actions:not(.answer-required-actions--selected) {
  max-height: 0;
  margin: 0;
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
}

.linked-task-icon {
  margin-left: 8px;
  cursor: pointer;
  color: #5c35f9;
}

.linked-task-icon:hover {
  opacity: 0.75;
}

:deep(.q-message-text.chat-message--highlighted),
:deep(.q-message-text-content.chat-message--highlighted) {
  background-color: var(--q-primary) !important;
  color: white !important;
  transition: background-color 0.25s ease, color 0.25s ease;
}

:deep(.q-message-text.chat-message--highlighted *),
:deep(.q-message-text-content.chat-message--highlighted *) {
  color: white !important;
}

:deep(.q-message-text.chat-message--highlighted a),
:deep(.q-message-text-content.chat-message--highlighted a) {
  color: white !important;
  text-decoration-color: white;
}

.chat-message-row {
  content-visibility: auto;
  contain-intrinsic-size: 90px;
}
</style>
