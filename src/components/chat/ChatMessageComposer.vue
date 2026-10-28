<template>
  <q-page
    v-if="this.canSendMessages"
    position="bottom"
    class="input-container"
    expand
  >
    <div class="app-inline app-width-full"
    >
      <composer-reply-bar
        v-if="this.canSendMessages && this.replyMessageId !== null"
        ref="replyBar"
        :message="this.getReplayed"
        :sender="this.getMessageSender"
        :preview-text="this.getReplyMessage(this.getReplayed)"
        @close="this.replyMessageId = null"
      />

      <composer-edit-bar
        v-if="this.canSendMessages && this.editingMessage !== null"
        ref="editBar"
        :text="this.editingMessage.text"
        :is-mobile="this.isMobile"
        @cancel="this.cancelEditMessage"
      />

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
        <composer-action-clouds
          :attached-files="this.attachedFiles"
          :typing="this.typing"
          :task-watching-now="this.taskWatchingNow"
          :current-user="this.currentUser"
          :raised="this.replyMessageId !== null || this.editingMessage !== null"
          @show-files="this.showListPinedFiles = true"
          @remove-file="index => this.attachedFiles.splice(index, 1)"
        />
        <q-btn
          data-tour="chat-attach-file"
          id="choose-file-btn"
          type="file"
          @click="showListPinedFiles = true"
          icon="sym_o_attach_file_add"
          class="no-padding app-inline app-margin-bottom-6"
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

        <composer-suggestion-menus
          ref="suggestionMenus"
          v-model:mentionMenu="mentionMenu"
          v-model:templateMenu="templateMenu"
          :mentions-enabled="mentionsEnabled"
          :mention-target-el="mentionTargetEl"
          :mention-users="filteredMentionUsers"
          :mention-index="mentionIndex"
          :template-target-el="templateTargetEl"
          :template-suggestions="filteredTemplateSuggestions"
          :template-index="templateIndex"
          @select-mention="selectMention"
          @select-template="selectTemplateSuggestion"
        />

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
          <q-btn class="app-inline app-margin-bottom-6"
            data-tour="chat-comment-mode"
            id="comment-mode-btn"
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
          <q-btn class="app-inline app-margin-bottom-6"
            data-tour="chat-helper-toggle"
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
import { getMessageFileSizeError } from 'src/util/messageFileUpload'
import { getChatDialogElement } from 'src/util/chatComposer/textareaLayout'
import ChatAttachFilesDialog from 'components/chat/ChatAttachFilesDialog.vue'
import ComposerReplyBar from 'components/chat/composer/ComposerReplyBar.vue'
import ComposerEditBar from 'components/chat/composer/ComposerEditBar.vue'
import ComposerActionClouds from 'components/chat/composer/ComposerActionClouds.vue'
import ComposerSuggestionMenus from 'components/chat/composer/ComposerSuggestionMenus.vue'
import composerAttachmentsMixin from 'components/chat/composer/composerAttachmentsMixin'
import composerTemplatesMixin from 'components/chat/composer/composerTemplatesMixin'
import composerMentionsMixin from 'components/chat/composer/composerMentionsMixin'
import composerKeyboardMixin from 'components/chat/composer/composerKeyboardMixin'
import composerLayoutMixin from 'components/chat/composer/composerLayoutMixin'
import composerReplyEditMixin from 'components/chat/composer/composerReplyEditMixin'

// Панель ввода сообщения: ответ/редактирование, вложения (выбор, вставка, drag-n-drop), упоминания и шаблоны, отправка
export default {

  name: 'ChatMessageComposer',

  components: {
    ChatAttachFilesDialog,
    ComposerReplyBar,
    ComposerEditBar,
    ComposerActionClouds,
    ComposerSuggestionMenus
  },

  mixins: [
    composerAttachmentsMixin,
    composerTemplatesMixin,
    composerMentionsMixin,
    composerKeyboardMixin,
    composerLayoutMixin,
    composerReplyEditMixin
  ],

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
    isComment: false
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
        const chat = getChatDialogElement(this.isDialog)
        if (chat) {
          chat.style.height = this.chatStyle.height
        }
      })
      this.scrollToBottom(500)
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

    showHelper () {
      this.$emit(this.isShowHelper ? 'hideHelper' : 'showHelper')
    },

    getGoToLatestButtonLabel () {
      if (this.pendingNewMessagesCount > 0) {
        return this.pendingNewMessagesCount
      }
      return ''
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

.input-container {
  max-height: 400px;
  min-height: 0 !important;
  width: 100%;
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
  background-color: var(--app-surface, #ffffff);
  transition: background-color 0.2s ease;
}

.input-item--editing {
  flex-shrink: 0;
}

.input-item--comment {
  background-color: var(--app-accent-surface, #d1c4e9);
}

.message-upload-progress {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 80;
}

.chat-go-latest-btn {
  width: auto;
  min-width: 36px;
  height: 36px;
  position: absolute;
  z-index: 1;
  right: 5px;
  opacity: 0.92;
  background-color: var(--app-surface, white);
  border-radius: 4px;
  margin-bottom: 5px;
}
</style>
