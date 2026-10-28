<template>
  <q-page
    v-if="this.canSendMessages"
    position="bottom"
    class="input-container"
    expand
  >
    <div
      style="width: 100%;"
    >
      <q-card
        v-if="this.canSendMessages && this.replyMessageId !== null"
        class="no-shadow"
        style="width: 100%;height: 50px;display: flex;flex-direction: row;border-radius: 0;border-top: 1px solid #0000001f"
      >
        <div ref="replyContainer" style="display: flex;width: 100%;max-height: 50px;align-items: center">
          <div
            style="height: 50px;width: 50px;display: flex;justify-content: center;align-items: center;margin-left: 5px;margin-right: 10px">
            <img
              v-if="this.getReplayed.fileUuid && this.getReplayed.fileType.startsWith('image/')"
              :src="`/files/images/${this.getReplayed.fileUuid}`"
              alt="reply-img"
              style="width: 40px;height: 40px;border-radius: 4px;object-fit: cover;"
            >
            <video
              v-else-if="this.getReplayed.fileUuid && this.getReplayed.fileType.startsWith('video/')"
              style="width: 40px;height: 40px;border-radius: 4px;object-fit: cover;"
            >
              <source
                :src="`/files/videos/${this.getReplayed.fileUuid}`"
                type="video/mp4"
              >
              Your browser does not support the video tag.
            </video>
            <q-icon
              v-else
              size="20px"
              name="reply"
            />
          </div>
          <div style="width: 100%">
            <div class="">
              В ответ на {{ this.getMessageSender }}
            </div>
            <div class="truncate">
              {{ this.getReplyMessage(this.getReplayed) }}
            </div>
          </div>
          <q-icon
            size="20px"
            style="height: 50px;width: 50px;cursor: pointer"
            name="close"
            @click="this.replyMessageId = null"
          />
        </div>
      </q-card>

      <q-card
        v-if="this.canSendMessages && this.editingMessage !== null"
        class="no-shadow edit-message-bar"
      >
        <div
          ref="editContainer"
          class="edit-message-bar__content"
        >
          <div class="edit-message-bar__icon">
            <q-icon
              size="20px"
              name="edit"
            />
          </div>
          <div class="edit-message-bar__text">
            <div>
              Редактирование сообщения
            </div>
            <div class="truncate">
              {{ this.editingMessage.text }}
            </div>
          </div>
          <q-btn
            class="edit-message-cancel-btn"
            flat
            round
            dense
            icon="close"
            aria-label="Отменить редактирование"
            @click="this.cancelEditMessage"
          >
            <q-tooltip v-if="!this.isMobile">
              Отменить редактирование
            </q-tooltip>
          </q-btn>
        </div>
      </q-card>

      <q-card
        v-if="this.canSendMessages"
        data-tour="chat-message-composer"
        class="input-item no-shadow"
        :class="{
          'input-item--comment': this.isComment,
          'input-item--editing': this.editingMessage !== null
        }"
        :style="composerStyle"
      >
        <q-linear-progress
          v-if="isUploadProgressVisible"
          :value="normalizedUploadProgress"
          color="primary"
          track-color="grey-3"
          size="4px"
          class="message-upload-progress"
          aria-label="Прогресс загрузки файла"
        />
        <q-btn
          v-if="this.scrollToBottomKey || this.pendingNewMessagesCount > 0 || this.hasTrimmedNewerMessages"
          class="shadow-1 chat-go-latest-btn"
          icon="keyboard_double_arrow_down"
          dense
          :label="this.getGoToLatestButtonLabel()"
          :style="this.replyMessageId !== null ? 'bottom: 210%;' : 'bottom: 100%;'"
          @click="this.$emit('goToLatestClick')"
        />
        <div
          v-if="this.attachedFiles.length > 0 ||
          this.typing.filter(t => t.username !== this.currentUser.username).length > 0 ||
          this.replyMessageId !== null ||
          this.editingMessage !== null ||
          this.taskWatchingNow.filter(user => user.id !== this.currentUser.id).length > 0"
          :style="(this.replyMessageId !== null || this.editingMessage !== null) ? 'bottom: 210%;' : 'bottom: 100%;'"
          class="action-clouds"
        >
          <div class="input-clouds-container">
            <div class="typing-users-cloud-row">
              <div
                class="typing-users-cloud"
                v-if="this.typing.filter(t => t.username !== this.currentUser.username).length > 0 ||
                this.taskWatchingNow.filter(user => user.id !== this.currentUser.id).length > 0
                "
              >
                <div
                  v-if="this.watchUsers.length > 0"
                  style="margin-right: 8px"
                >
                  <q-icon name="visibility"/>
                  {{ this.watchUsers.join(', ') }}
                </div>
                <div v-if="typingUsers.length > 0">
                  <q-icon name="border_color"/>
                  {{ typingUsers.join(', ') }} {{ typingUsers.length > 1 ? ' печатают...' : ' печатает...' }}
                </div>
              </div>
            </div>
            <div
              v-if="this.attachedFiles.length > 2"
              class="attach-file-card"
              style="cursor: pointer;"
              @click="this.showListPinedFiles = true"
            >
              Еще {{ this.attachedFiles.length - 2 }} файла...
            </div>
            <div
              v-for="(file, index) in this.attachedFiles"
              :key="index"
            >
              <div
                v-if="index <= 1"
                class="attach-file-card"
              >
                <div class="attach-file-format">
                  {{ file.name.split('.')[file.name.split('.').length - 1].toUpperCase() }}
                </div>
                <div class="truncate">{{ file.name.split('.')[0] }}</div>
                <q-space/>
                <q-btn
                  flat
                  round
                  style="color: gray"
                  dense
                  icon="delete"
                  @click="this.attachedFiles.splice(index, 1)"
                />
              </div>
            </div>
          </div>
        </div>
        <q-btn
          data-tour="chat-attach-file"
          style="margin-bottom: 6px"
          id="choose-file-btn"
          type="file"
          @click="showListPinedFiles = true"
          icon="sym_o_attach_file_add"
          class="no-padding"
          flat
        />
        <input
          type="file"
          id="fileInput"
          style="display: none"
        />
        <textarea
          data-tour="chat-message-input"
          ref="textInput"
          :value="this.inputField"
          :placeholder="this.renderShortcutPlaceholder"
          :style="textareaStyle"
          @keydown.tab.prevent="handleTabPressed"
          @keydown="this.handleKeyPressed"
          @input="this.textChanged"
          @paste="this.handlePaste"
        />

        <q-menu
          v-if="mentionsEnabled"
          ref="mentionSuggestionsMenu"
          v-model="mentionMenu"
          :target="mentionTargetEl"
          anchor="top left"
          self="bottom left"
          :offset="[0, 8]"
          fit
          no-parent-event
          auto-close="false"
          no-focus
          no-refocus
        >
          <q-list dense style="min-width: 260px; max-height: 220px; overflow: auto;">
            <q-item
              v-for="(u, i) in filteredMentionUsers"
              :key="u.id || u.uuid || (u.username + '_' + i)"
              clickable
              :active="i === mentionIndex"
              active-class="bg-grey-3"
              @click="selectMention(u)"
            >
              <q-item-section>
                <div class="text-body2">
                  {{ `${u.lastname || ''} ${u.firstname || ''}` }}
                </div>
                <div class="text-caption text-grey-7">
                  @{{ u.username || (u.email ? u.email.split('@')[0] : '') }}
                </div>
              </q-item-section>
            </q-item>

            <q-item v-if="filteredMentionUsers.length === 0">
              <q-item-section class="text-grey-6 text-caption">
                Нет совпадений
              </q-item-section>
            </q-item>
          </q-list>
        </q-menu>

        <q-menu
          ref="templateSuggestionsMenu"
          v-model="templateMenu"
          :target="templateTargetEl"
          anchor="top left"
          self="bottom left"
          :offset="[0, 8]"
          fit
          no-parent-event
          :auto-close="false"
          no-focus
          no-refocus
        >
          <q-list dense class="template-suggestions-list">
            <q-item
              v-for="(template, index) in filteredTemplateSuggestions"
              :key="template.id || template.shortcut || index"
              clickable
              :active="index === templateIndex"
              active-class="bg-grey-3"
              class="template-suggestion-item"
              @mousedown.prevent
              @click="selectTemplateSuggestion(template)"
            >
              <q-item-section side top>
                <q-badge
                  outline
                  color="primary"
                  class="template-suggestion-shortcut"
                >
                  :{{ template.shortcut }}
                </q-badge>
              </q-item-section>

              <q-item-section>
                <q-item-label lines="2" class="template-suggestion-text">
                  {{ template.text }}
                </q-item-label>
              </q-item-section>
            </q-item>

            <q-item v-if="filteredTemplateSuggestions.length === 0">
              <q-item-section class="text-grey-6 text-caption">
                Нет совпадений
              </q-item-section>
            </q-item>
          </q-list>
        </q-menu>

        <div>
          <q-btn
            v-if="this.inputField.length > 0 || this.attachedFiles.length > 0"
            icon="send"
            id="send-message-btn"
            @click="this.sendMessage"
            :loading="this.isSending"
            color="white"
            text-color="primary"
            dense
            push
            flat
            :ripple="false"
            style="margin-right: 5px; margin-bottom: 6px"
          >
            <q-tooltip
              v-if="!this.isMobile"
            >
              {{ this.sendShortcutText }}
            </q-tooltip>
          </q-btn>
        </div>
        <div
          v-if="this.comments"
        >
          <q-btn
            data-tour="chat-comment-mode"
            id="comment-mode-btn"
            style="margin-bottom: 6px"
            @click="this.switchToComment"
            dense
            flat
            icon="comment"
            :color="this.isComment ? 'primary' : 'grey'"
          >
            <q-tooltip
              v-if="!this.isMobile"
            >
              Режим комментария: Сообщение увидят только операторы
            </q-tooltip>
          </q-btn>
        </div>
        <div
          v-if="this.showHelperAction && !this.isMobile"
        >
          <q-btn
            data-tour="chat-helper-toggle"
            style="margin-bottom: 6px"
            @click="this.showHelper"
            dense
            flat
            icon="support"
            :color="this.isShowHelper ? 'primary' : 'grey'"
          >
            <q-tooltip>
              {{ this.isShowHelper ? 'Скрыть подсказки и базу знаний' : 'Подсказки и база знаний' }}
            </q-tooltip>
          </q-btn>
        </div>
      </q-card>
    </div>
  </q-page>
  <chat-attach-files-dialog
    v-model="this.showListPinedFiles"
    v-model:files="this.attachedFiles"
    v-model:file-upload-error="this.fileUploadError"
  />
</template>

<script>
import { useStore } from 'stores/store'
import {
  MESSAGE_FILE_MAX_SIZE_BYTES,
  getMessageFileSizeError
} from 'src/util/messageFileUpload'
import { getClientDisplayName } from 'src/util/clientName'
import { shortenLine } from 'src/util/chatMessageText'
import ChatAttachFilesDialog from 'components/chat/ChatAttachFilesDialog.vue'

// Панель ввода сообщения: ответ/редактирование, вложения (выбор, вставка, drag-n-drop), упоминания и шаблоны, отправка
export default {

  name: 'ChatMessageComposer',

  components: { ChatAttachFilesDialog },

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
    canSendMessages: { type: Boolean },
    chatStyle: { type: Object },
    scrollToBottomKey: { type: Boolean },
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
    portalMode: {
      default: false,
      type: Boolean
    },
    showHelperAction: {
      default: true,
      type: Boolean
    }
  },

  emits: [
    'isSending',
    'sendMessage',
    'editMessage',
    'keyPressed',
    'showHelper',
    'hideHelper',
    'scrollToBottom',
    'goToLatestClick'
  ],

  data: () => ({
    textareaHeight: 46,
    isComment: false,
    attachedFiles: [],
    fileUploadError: '',
    replyMessageId: null,
    replyFileUuid: null,
    replyFileType: null,

    showListPinedFiles: false,

    mentionMenu: false,
    mentionQuery: '',
    mentionIndex: 0,
    mentionTargetEl: null,

    templateMenu: false,
    templateQuery: '',
    templateIndex: 0,
    templateTargetEl: null,
    templateMatchStart: null,
    templateMatchEnd: null,

    editingMessage: null
  }),

  mounted () {
    this.mentionTargetEl = this.$refs.textInput
    this.templateTargetEl = this.$refs.textInput
  },

  methods: {
    // Фокус на поле ввода (бросает ошибку, если поля нет — как и прямое обращение к ref)
    focus () {
      this.$refs.textInput.focus()
    },

    // Прокрутка ленты вниз выполняется родителем
    scrollToBottom (timeout = 0) {
      this.$emit('scrollToBottom', timeout)
    },

    sendMessage () {
      if (!this.canSendMessages) {
        return
      }
      this.closeMentionMenu()
      this.closeTemplateMenu()
      const fileSizeError = getMessageFileSizeError(this.attachedFiles)
      if (fileSizeError) {
        this.fileUploadError = fileSizeError
        this.showListPinedFiles = true
        this.$q.notify({
          message: fileSizeError,
          type: 'negative'
        })
        return
      }
      const textarea = this.$refs.textInput
      if (this.editingMessage !== null) {
        const text = String(textarea.value || '').trim()
        if (!text) {
          this.$q.notify({
            message: 'Текст сообщения не может быть пустым',
            type: 'warning'
          })
          return
        }
        this.$emit('isSending', true)
        this.$emit('editMessage', {
          clientId: this.client.id,
          message: this.editingMessage,
          text
        })
        this.editingMessage = null
        textarea.value = ''
        this.$emit('keyPressed', '')
        this.autoResize()
        return
      }
      if (textarea.value || this.attachedFiles.length > 0) {
        this.$emit('isSending', true)
        const message = {
          id: null,
          text: textarea.value,
          date: new Date(),
          isSent: true,
          isComment: this.isComment,
          isRead: true,
          replyMessageId: this.replyMessageId,
          replyUuid: this.replyFileUuid,
          replyFileType: this.replyFileType,
          user: this.currentUser
        }
        this.$emit('sendMessage', {
          message,
          attachedFiles: this.attachedFiles,
          clientId: this.client.id
        })
        this.attachedFiles = []
        this.replyMessageId = null
        this.replyFileType = null
        this.replyFileUuid = null
      }
      this.$nextTick(() => {
        const textarea = this.$refs.textInput
        if (textarea) {
          textarea.style.height = '46px'
          textarea.style.overflowY = 'hidden'
        }
        this.textareaHeight = 46
        let chat = document.getElementById('chat-dialog')
        if (this.isDialog) {
          chat = document.getElementById('chat-dialog-pop-up')
        }
        if (chat) {
          chat.style.height = this.chatStyle.height
        }
      })
      this.scrollToBottom(500)
    },

    handleTabPressed (event) {
      if (this.templateMenu) {
        const template = this.filteredTemplateSuggestions[this.templateIndex]
        if (template) {
          event.preventDefault()
          this.selectTemplateSuggestion(template)
          return
        }
      }

      const textarea = this.$refs.textInput
      if (!textarea?.value) {
        return
      }

      const caret = textarea.selectionStart ?? textarea.value.length
      const before = textarea.value.slice(0, caret)
      const shortcutMatch = before.match(/(?:^|\s):([^\s:]*)$/)
      if (!shortcutMatch) {
        return
      }

      const shortcut = shortcutMatch[1].toLowerCase()
      const template = (Array.isArray(this.templates) ? this.templates : [])
        .find(item => String(item.shortcut || '').replace(/^:/, '').toLowerCase() === shortcut)

      if (template) {
        event.preventDefault()
        this.templateMatchStart = caret - shortcutMatch[0].trimStart().length
        this.templateMatchEnd = caret
        this.selectTemplateSuggestion(template)
      }
    },

    attachFile () {
      const fileInput = document.getElementById('fileInput')
      fileInput.click()
      fileInput.addEventListener('change', () => {
        this.attachedFiles = fileInput.files[0]
        this.$q.notify({
          message: `Загружен файл: ${fileInput.files[0].name}`,
          type: 'positive'
        })
      })
    },

    getReplyMessage (message) {
      if (message.text) {
        return this.shortenLine(message.text, 50)
      } else {
        if (message.fileType.startsWith('video/')) {
          return 'Видео'
        } else if (message.fileType.startsWith('image/')) {
          return 'Изображение'
        } else if (message.fileType.startsWith('audio/')) {
          return 'Аудио'
        } else {
          return 'Файл'
        }
      }
    },

    switchToComment () {
      this.isComment = !this.isComment

      if (!this.isComment) {
        this.closeMentionMenu()
        return
      }

      this.$nextTick(() => {
        this.updateMentionState()
      })
    },

    autoResize () {
      this.$nextTick(() => {
        let auxiliaryContainerHeight = 0
        let chat = document.getElementById('chat-dialog')
        if (this.isDialog) {
          chat = document.getElementById('chat-dialog-pop-up')
        }
        if (this.$refs.replyContainer) {
          auxiliaryContainerHeight += this.$refs.replyContainer.offsetHeight || 0
        }
        if (this.$refs.editContainer) {
          auxiliaryContainerHeight += this.$refs.editContainer.offsetHeight || 0
        }
        const textarea = this.$refs.textInput
        if (!textarea) {
          return
        }
        const maxHeight = this.getTextareaMaxHeight()
        textarea.style.height = 'auto'
        textarea.style.overflowY = 'hidden'
        const nextHeight = Math.max(46, Math.min(textarea.scrollHeight, maxHeight))
        const isScrollable = textarea.scrollHeight > maxHeight
        textarea.style.height = `${nextHeight}px`
        textarea.style.overflowY = isScrollable ? 'auto' : 'hidden'
        if (chat) {
          chat.style.height = this.chatStyle.height
          const textareaExtraHeight = Math.max(0, nextHeight - 46)
          const auxiliaryExtraHeight = auxiliaryContainerHeight > 0 ? auxiliaryContainerHeight + 1 : 0
          const totalExtraHeight = textareaExtraHeight + auxiliaryExtraHeight
          chat.style.height = totalExtraHeight > 0
            ? `calc(${this.chatStyle.height} - ${totalExtraHeight}px)`
            : this.chatStyle.height
        }
        this.textareaHeight = nextHeight
        if (this.editingMessage !== null) {
          requestAnimationFrame(() => this.scrollToBottom(0))
        }
      })
    },

    textChanged () {
      this.$emit('keyPressed', this.$refs.textInput.value)
      this.autoResize()
      this.updateMentionState()
      this.updateTemplateState()
    },

    normalizeTemplateSearch (value) {
      return String(value || '')
        .trim()
        .toLowerCase()
        .replace(/^:/, '')
    },

    getMatchingTemplates (value) {
      const query = this.normalizeTemplateSearch(value)
      const templates = Array.isArray(this.templates) ? this.templates : []

      if (!query) {
        return templates.slice(0, 8)
      }

      const score = template => {
        const text = String(template.text || '').toLowerCase()
        const shortcut = String(template.shortcut || '')
          .toLowerCase()
          .replace(/^:/, '')

        if (shortcut === query) return 0
        if (shortcut.startsWith(query)) return 1
        if (text.startsWith(query)) return 2
        if (shortcut.includes(query)) return 3
        if (text.includes(query)) return 4
        return 5
      }

      return templates
        .filter(template => {
          const text = String(template.text || '').toLowerCase()
          const shortcut = String(template.shortcut || '')
            .toLowerCase()
            .replace(/^:/, '')

          return text.includes(query) || shortcut.includes(query)
        })
        .sort((left, right) => score(left) - score(right))
        .slice(0, 8)
    },

    closeTemplateMenu () {
      this.templateMenu = false
      this.templateQuery = ''
      this.templateIndex = 0
      this.templateMatchStart = null
      this.templateMatchEnd = null
    },

    getTemplateSearchContext (textarea) {
      const caret = textarea.selectionStart ?? textarea.value.length
      const before = textarea.value.slice(0, caret)

      // Упоминания пользователей имеют приоритет над шаблонами в комментариях
      // и во встроенном чате заявки.
      if (this.mentionsEnabled && /(?:^|\s)@[^\s@]*$/.test(before)) {
        return null
      }

      const shortcutMatch = before.match(/(?:^|\s)(:([^\s:]*))$/)
      if (shortcutMatch) {
        const rawValue = shortcutMatch[1]
        return {
          query: shortcutMatch[2] || '',
          start: caret - rawValue.length,
          end: caret
        }
      }

      const lineStart = before.lastIndexOf('\n') + 1
      const currentLine = before.slice(lineStart)

      if (!currentLine.trim() || /\s$/.test(currentLine)) {
        return null
      }

      const tokens = [...currentLine.matchAll(/\S+/g)]
      if (tokens.length === 0) {
        return null
      }

      // Ищем сначала по длинному фрагменту, затем по последним словам.
      const maxTokenCount = Math.min(4, tokens.length)
      for (let count = maxTokenCount; count >= 1; count--) {
        const token = tokens[tokens.length - count]
        const relativeStart = token.index
        const rawQuery = currentLine.slice(relativeStart)
        const query = rawQuery.replace(/\s+/g, ' ').trim()

        if (query.length < 2) {
          continue
        }

        if (this.getMatchingTemplates(query).length > 0) {
          return {
            query,
            start: lineStart + relativeStart,
            end: caret
          }
        }
      }

      return null
    },

    updateTemplateState () {
      const textarea = this.$refs.textInput
      if (!textarea || !Array.isArray(this.templates) || this.templates.length === 0) {
        this.closeTemplateMenu()
        return
      }

      this.templateTargetEl = textarea
      const context = this.getTemplateSearchContext(textarea)

      if (!context) {
        this.closeTemplateMenu()
        return
      }

      this.templateQuery = context.query
      this.templateMatchStart = context.start
      this.templateMatchEnd = context.end
      this.templateIndex = 0

      this.$nextTick(() => {
        const shouldShowMenu = this.filteredTemplateSuggestions.length > 0
        this.templateMenu = shouldShowMenu

        if (shouldShowMenu) {
          // После фильтрации высота списка меняется. Пересчитываем позицию,
          // чтобы нижний край меню оставался возле поля ввода.
          this.$nextTick(() => {
            this.$refs.templateSuggestionsMenu?.updatePosition()
          })
        }
      })
    },

    selectTemplateSuggestion (template) {
      const textarea = this.$refs.textInput
      if (!textarea || !template) {
        return
      }

      const start = Number.isInteger(this.templateMatchStart)
        ? this.templateMatchStart
        : (textarea.selectionStart ?? textarea.value.length)
      const end = Number.isInteger(this.templateMatchEnd)
        ? this.templateMatchEnd
        : (textarea.selectionStart ?? textarea.value.length)
      const insertedText = String(template.text || '')
      const newText = textarea.value.slice(0, start) + insertedText + textarea.value.slice(end)
      const newCaret = start + insertedText.length

      textarea.value = newText
      this.$emit('keyPressed', newText)
      this.autoResize()
      this.closeTemplateMenu()

      this.$nextTick(() => {
        textarea.setSelectionRange(newCaret, newCaret)
        textarea.focus()
      })
    },

    getTypingWatchingUsers () {
      const watchingNow = this.taskWatchingNow.filter(user =>
        user.id !== this.currentUser.id &&
        !this.typing.some(t => t.username === user.username)
      )
      const typingNow = this.typing.filter(t => t.username !== this.currentUser.username)
      return {
        typing: typingNow.map(t => `${t.lastname} ${t.firstname}`),
        watching: watchingNow.map(user => `${user.lastname} ${user.firstname}`)
      }
    },

    closeMentionMenu () {
      this.mentionMenu = false
      this.mentionQuery = ''
      this.mentionIndex = 0
    },

    updateMentionState () {
      if (!this.mentionsEnabled) {
        this.closeMentionMenu()
        return
      }

      const textarea = this.$refs.textInput
      if (!textarea) {
        this.closeMentionMenu()
        return
      }

      // ВАЖНО: обновляем target каждый раз (на случай если компонент пересоздали)
      this.mentionTargetEl = textarea

      const caret = textarea.selectionStart ?? textarea.value.length
      const before = textarea.value.slice(0, caret)

      // Триггер: @ в начале или после пробела
      const match = before.match(/(?:^|\s)@([^\s@]*)$/)

      if (!match) {
        this.closeMentionMenu()
        return
      }

      this.mentionQuery = match[1] || ''

      // если просто "@" и юзер начал стирать — не держим меню открытым
      if (this.mentionQuery.length === 0 && textarea.value.endsWith('@') === false) {
        this.closeMentionMenu()
        return
      }

      this.mentionIndex = 0

      // После фильтрации количество пользователей и высота списка меняются.
      // Открываем меню и пересчитываем позицию относительно поля ввода.
      this.$nextTick(() => {
        this.mentionMenu = true

        this.$nextTick(() => {
          this.$refs.mentionSuggestionsMenu?.updatePosition()
        })
      })
    },

    selectMention (user) {
      if (!this.mentionsEnabled) {
        this.closeMentionMenu()
        return
      }

      const textarea = this.$refs.textInput
      if (!textarea) return

      const caret = textarea.selectionStart ?? textarea.value.length
      const before = textarea.value.slice(0, caret)
      const after = textarea.value.slice(caret)

      const atPos = before.lastIndexOf('@')
      if (atPos === -1) return

      const fullName = `${user.lastname || ''} ${user.firstname || ''}`.trim()
      const handle = fullName
        ? `[${fullName}]`
        : (user.username || (user.email ? user.email.split('@')[0] : null) || 'user')
      const inserted = `@${handle} `
      const newText = before.slice(0, atPos) + inserted + after

      textarea.value = newText
      this.$emit('keyPressed', newText)
      this.autoResize()

      this.closeMentionMenu()

      this.$nextTick(() => {
        const newCaret = atPos + inserted.length
        textarea.setSelectionRange(newCaret, newCaret)
        textarea.focus()
      })
    },

    isSendMessageShortcut (event) {
      const isEnter = event.key === 'Enter' || event.keyCode === 13
      if (!isEnter) {
        return false
      }

      if (this.isMacOs) {
        return event.metaKey && !event.ctrlKey
      }

      return event.ctrlKey && !event.metaKey
    },

    handleKeyPressed (event) {
      if (this.isSendMessageShortcut(event)) {
        event.preventDefault()
        this.sendMessage()
        return
      }

      if (this.mentionsEnabled && this.mentionMenu) {
        if (event.key === 'ArrowDown') {
          event.preventDefault()
          this.mentionIndex = Math.min(this.mentionIndex + 1, this.filteredMentionUsers.length - 1)
          return
        }
        if (event.key === 'ArrowUp') {
          event.preventDefault()
          this.mentionIndex = Math.max(this.mentionIndex - 1, 0)
          return
        }
        if (event.key === 'Enter') {
          const u = this.filteredMentionUsers[this.mentionIndex]
          if (u) {
            event.preventDefault()
            this.selectMention(u)
            return
          }
        }
        if (event.key === 'Escape') {
          event.preventDefault()
          this.mentionMenu = false
          return
        }
      }

      if (this.templateMenu) {
        if (event.key === 'ArrowDown') {
          event.preventDefault()
          this.templateIndex = Math.min(
            this.templateIndex + 1,
            this.filteredTemplateSuggestions.length - 1
          )
          return
        }
        if (event.key === 'ArrowUp') {
          event.preventDefault()
          this.templateIndex = Math.max(this.templateIndex - 1, 0)
          return
        }
        if (event.key === 'Enter') {
          const template = this.filteredTemplateSuggestions[this.templateIndex]
          if (template) {
            event.preventDefault()
            this.selectTemplateSuggestion(template)
            return
          }
        }
        if (event.key === 'Escape') {
          event.preventDefault()
          this.closeTemplateMenu()
        }
      }
    },

    handlePaste (event) {
      const files = this.getFilesFromClipboard(event)
      if (files.length === 0) {
        return
      }
      event.preventDefault()
      const allowedFiles = files.filter(file => Number(file?.size || 0) <= MESSAGE_FILE_MAX_SIZE_BYTES)
      const rejectedFiles = files.filter(file => Number(file?.size || 0) > MESSAGE_FILE_MAX_SIZE_BYTES)
      if (rejectedFiles.length > 0) {
        this.fileUploadError = getMessageFileSizeError(rejectedFiles)
        this.$q.notify({
          message: this.fileUploadError,
          type: 'negative'
        })
        this.showListPinedFiles = true
      }
      if (allowedFiles.length === 0) {
        return
      }
      this.attachedFiles = [
        ...this.attachedFiles,
        ...allowedFiles
      ]
      this.$q.notify({
        message: `Добавлено из буфера: ${allowedFiles.length}`,
        type: 'positive'
      })
      this.showListPinedFiles = true
    },

    // Вызывается родительским контейнером чата (его границы — реальная область окна чата)
    // при drop файлов через drag-n-drop, т.к. корневые узлы этого компонента — фрагменты
    // без общего оборачивающего блока на весь экран чата.
    addDroppedFiles (files) {
      if (!Array.isArray(files) || files.length === 0) {
        return
      }
      const allowedFiles = files.filter(file => Number(file?.size || 0) <= MESSAGE_FILE_MAX_SIZE_BYTES)
      const rejectedFiles = files.filter(file => Number(file?.size || 0) > MESSAGE_FILE_MAX_SIZE_BYTES)
      if (rejectedFiles.length > 0) {
        this.fileUploadError = getMessageFileSizeError(rejectedFiles)
        this.$q.notify({
          message: this.fileUploadError,
          type: 'negative'
        })
      }
      if (allowedFiles.length === 0) {
        return
      }
      this.attachedFiles = [
        ...this.attachedFiles,
        ...allowedFiles
      ]
    },

    getFilesFromClipboard (event) {
      const clipboardData = event.clipboardData
      if (!clipboardData) {
        return []
      }
      const files = []
      if (clipboardData.files && clipboardData.files.length > 0) {
        Array.from(clipboardData.files).forEach(file => {
          files.push(this.normalizePastedFile(file))
        })
      }
      if (clipboardData.items && clipboardData.items.length > 0) {
        Array.from(clipboardData.items).forEach(item => {
          if (item.kind !== 'file') {
            return
          }
          const file = item.getAsFile()
          if (!file) {
            return
          }
          const exists = files.some(existingFile =>
            existingFile.name === file.name &&
            existingFile.size === file.size &&
            existingFile.type === file.type
          )
          if (!exists) {
            files.push(this.normalizePastedFile(file))
          }
        })
      }
      return files
    },

    normalizePastedFile (file) {
      if (file.name && file.name.trim().length > 0) {
        return file
      }
      const extension = this.getFileExtensionByType(file.type)
      const fileName = `clipboard-${this.formatClipboardFileDate()}${extension}`
      return new File([file], fileName, {
        type: file.type,
        lastModified: file.lastModified || Date.now()
      })
    },

    getFileExtensionByType (type) {
      if (!type) {
        return ''
      }
      const map = {
        'image/png': '.png',
        'image/jpeg': '.jpg',
        'image/jpg': '.jpg',
        'image/gif': '.gif',
        'image/webp': '.webp',
        'application/pdf': '.pdf',
        'text/plain': '.txt'
      }
      return map[type] || ''
    },

    formatClipboardFileDate () {
      const date = new Date()
      const pad = value => String(value).padStart(2, '0')
      return [
        date.getFullYear(),
        pad(date.getMonth() + 1),
        pad(date.getDate())
      ].join('') + '-' + [
        pad(date.getHours()),
        pad(date.getMinutes()),
        pad(date.getSeconds())
      ].join('')
    },

    setReplyMessage (message) {
      this.replyMessageId = message.id
      this.replyFileUuid = message.fileUuid
      this.replyFileType = message.fileType
    },

    startEditMessage (message) {
      this.editingMessage = message
      this.replyMessageId = null
      this.replyFileUuid = null
      this.replyFileType = null
      this.attachedFiles = []
      this.$nextTick(() => {
        const textarea = this.$refs.textInput
        if (!textarea) {
          return
        }
        textarea.value = message.text || ''
        textarea.focus()
        textarea.setSelectionRange(textarea.value.length, textarea.value.length)
        this.$emit('keyPressed', textarea.value)
        this.autoResize()
        // После изменения размеров composer должен остаться у нижней границы
        // скролл-зоны, иначе выросший textarea выталкивает кнопки за viewport.
        requestAnimationFrame(() => {
          textarea.scrollTop = textarea.scrollHeight
          this.scrollToBottom(0)
        })
      })
    },

    cancelEditMessage () {
      this.editingMessage = null
      this.$nextTick(() => {
        const textarea = this.$refs.textInput
        if (!textarea) {
          return
        }
        textarea.value = ''
        this.$emit('keyPressed', '')
        this.autoResize()
      })
    },

    getTextareaMaxHeight () {
      // При редактировании длинного сообщения не даём composer'у
      // занимать большую часть экрана: текст прокручивается внутри textarea,
      // а кнопка отправки остаётся доступной.
      if (this.editingMessage !== null) {
        if (this.isMobile) {
          return 120
        }
        return this.isDialog ? 160 : 220
      }

      return this.isDialog ? 300 : 400
    },

    showHelper () {
      this.$emit(this.isShowHelper ? 'hideHelper' : 'showHelper')
    },

    getGoToLatestButtonLabel () {
      if (this.pendingNewMessagesCount > 0) {
        return this.pendingNewMessagesCount
      }
      return ''
    },

    shortenLine (string, offset = 25) {
      return shortenLine(string, offset)
    }
  },

  computed: {
    normalizedUploadProgress () {
      const value = Number(this.uploadProgress)
      if (!Number.isFinite(value)) {
        return 0
      }
      return Math.max(0, Math.min(1, value))
    },

    isUploadProgressVisible () {
      return this.isSending && this.uploadProgress !== null && this.uploadProgress !== undefined
    },

    typingUsers () {
      if (this.getTypingWatchingUsers()) {
        return this.getTypingWatchingUsers().typing
      } else {
        return []
      }
    },

    watchUsers () {
      if (this.getTypingWatchingUsers()) {
        return this.getTypingWatchingUsers().watching
      } else {
        return []
      }
    },

    renderShortcutPlaceholder () {
      if (this.portalMode) {
        return 'Текст сообщения'
      }
      return `${this.isComment ? 'Текст комментария' : 'Текст сообщения'} ${this.isMobile ? '' : this.mentionsEnabled ? '\nВведите @ для пинга' : '\nВведите :shortcut и нажмите tab чтобы выполнить авто-ввод'}`
    },

    isMacOs () {
      if (typeof navigator === 'undefined') {
        return false
      }

      return /Mac/.test(navigator.platform || '') || /Mac OS X/.test(navigator.userAgent || '')
    },

    sendShortcutText () {
      return this.isMacOs ? 'cmd+enter отправить' : 'ctrl+enter отправить'
    },

    composerStyle () {
      return {
        borderBottom: '1px solid #0000001f',
        borderTop: this.replyMessageId ? 'none' : '1px solid #0000001f',
        backgroundColor: this.isComment ? '#d1c4e9' : '#ffffff'
      }
    },

    textareaStyle () {
      const maxHeight = this.getTextareaMaxHeight()
      return {
        borderStyle: 'unset',
        margin: '0 8px',
        width: 'auto',
        flex: '1 1 auto',
        minWidth: '0',
        overflowX: 'hidden',
        overflowY: this.textareaHeight >= maxHeight ? 'auto' : 'hidden',
        resize: 'none',
        height: `${this.textareaHeight}px`,
        maxHeight: `${maxHeight}px`,
        transition: 'height 0.2s ease, background-color 0.2s ease',
        backgroundColor: this.isComment ? '#d1c4e9' : '#ffffff',
        color: '#242424'
      }
    },

    getReplayed () {
      return this.messages.find(m => m.id === this.replyMessageId)
    },

    getMessageSender () {
      if (this.getReplayed.user) {
        return this.getReplayed.user.lastname + ' ' + this.getReplayed.user.firstname
      } else {
        return getClientDisplayName(this.client)
      }
    },

    filteredTemplateSuggestions () {
      return this.getMatchingTemplates(this.templateQuery)
    },

    mentionsEnabled () {
      return !this.portalMode && (this.isComment || this.isDialog)
    },

    filteredMentionUsers () {
      if (!this.mentionsEnabled) {
        return []
      }

      const users = Array.isArray(this.store?.users) ? this.store.users : []
      const q = (this.mentionQuery || '').trim().toLowerCase()
      const toSearchString = (u) => (
        `${u.firstname || ''} ${u.lastname || ''} ${u.username || ''} ${u.email || ''}`
      ).toLowerCase()
      const filtered = q.length === 0
        ? users
        : users.filter(u => toSearchString(u).includes(q))
      return filtered
    }
  },

  watch: {
    inputField: {
      immediate: true,
      handler () {
        this.autoResize()
      }
    },

    replyMessageId () {
      this.autoResize()
    }
  },

  setup () {
    const store = useStore()

    return {
      store
    }
  }
}
</script>

<style scoped>
.action-clouds {
  width: 100%;
  height: auto;
  min-height: 0;
  display: block;
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  color: white;
  font-size: 14px;
  z-index: 50;
  max-width: 100%;
  pointer-events: none;
}

.attach-file-card {
  display: flex;
  align-items: center;
  padding: 4px;
  border: solid 1px rgba(108, 108, 108, 0.2);
  border-radius: 4px;
  background-color: white;
  color: rgba(36, 36, 36, 1);
  margin-bottom: 4px;
  height: 44px;
  /* Родитель .action-clouds — pointer-events: none (чтобы не мешать кликам по чату
     в пустых местах оверлея), эта карточка — реально кликабельная, поэтому включаем обратно. */
  pointer-events: auto;
}

.attach-file-format {
  padding: 2px 8px 2px 8px;
  border-radius: 4px;
  background-color: rgba(255, 149, 0, 1);
  color: white;
  font-size: 12px;
  margin-right: 8px
}

.typing-users-cloud {
  display: flex;
  flex-wrap: nowrap;
  opacity: 0.5;
  background-color: rgba(255, 255, 255, 1);
  color: rgba(92, 53, 249, 1) !important;
  border-radius: 4px;
  margin-top: 5px;
  text-align: center;
  padding-left: 10px;
  padding-right: 10px;
  margin-bottom: 8px;
  width: max-content;
  max-width: calc(100% - 16px);
  pointer-events: none;
}

.reply-message-cloud {
  border-style: solid;
  border-width: 1px;
  background-color: white;
  color: black !important;
  display: flex;
  flex-direction: row;
  align-items: center;
  border-radius: 4px;
  margin-top: 5px;
  text-align: center;
  padding-left: 10px;
  padding-right: 10px;
  font-size: 16px;
}

textarea {
  border-style: unset;
  margin: 0 8px;
  width: 100%;
  resize: none;
  transition: height 0.2s ease;
}

textarea:focus {
  outline: none;
}

.template-suggestions-list {
  min-width: 320px;
  max-height: 280px;
  overflow-y: auto;
  border-radius: 8px;
}

.template-suggestion-item {
  min-height: 58px;
  padding: 8px 12px;
}

.template-suggestion-shortcut {
  max-width: 140px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: monospace;
  font-size: 12px;
}

.template-suggestion-text {
  white-space: normal;
  line-height: 1.35;
}

.input-container {
  max-height: 400px;
  min-height: 0 !important;
  width: 100%;
}

.edit-message-bar {
  width: 100%;
  height: 50px;
  min-height: 50px;
  display: flex;
  flex-direction: row;
  flex-shrink: 0;
  overflow: hidden;
  border-radius: 0;
  border-top: 1px solid #0000001f;
}

.edit-message-bar__content {
  display: flex;
  width: 100%;
  height: 50px;
  min-width: 0;
  align-items: center;
}

.edit-message-bar__icon {
  height: 50px;
  width: 50px;
  flex: 0 0 50px;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-left: 5px;
  margin-right: 10px;
}

.edit-message-bar__text {
  flex: 1 1 auto;
  min-width: 0;
  overflow: hidden;
}

.edit-message-cancel-btn {
  flex: 0 0 42px;
  width: 42px;
  height: 42px;
  margin-right: 4px;
}

.input-item {
  position: relative;
  display: flex;
  width: 100%;
  min-width: 0;
  flex-direction: row;
  flex-wrap: nowrap;
  align-items: end;
  border-radius: 0;
  background-color: #ffffff;
  transition: background-color 0.2s ease;
}

.input-item--editing {
  flex-shrink: 0;
}

.input-item--comment {
  background-color: #d1c4e9;
}

.message-upload-progress {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 80;
}

.input-clouds-container {
  padding: 0 4px;
  position: absolute;
  width: 100%;
  display: flex;
  flex-direction: column;
  flex-wrap: nowrap;
  bottom: 0;
}

.truncate {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.typing-users-cloud-row {
  width: 100%;
  display: flex;
  justify-content: center;
  padding-right: 0;
  pointer-events: none;
}

.chat-go-latest-btn {
  width: auto;
  min-width: 36px;
  height: 36px;
  position: absolute;
  z-index: 1;
  right: 5px;
  opacity: 0.92;
  background-color: white;
  border-radius: 4px;
  margin-bottom: 5px;
}
</style>
