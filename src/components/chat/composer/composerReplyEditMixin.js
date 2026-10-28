import { getClientDisplayName } from 'src/util/clientName'
import { shortenLine } from 'src/util/chatMessageText'
import { getAttachmentKindLabel } from 'src/util/chatComposer/replyPreview'

// Ответ на сообщение и редактирование сообщения: состояние, подписи для панелей над полем ввода.
// Требует в компоненте: props messages/client, ref textInput, autoResize (composerLayoutMixin),
// scrollToBottom, attachedFiles (composerAttachmentsMixin), $emit('keyPressed').
export default {
  data: () => ({
    replyMessageId: null,
    replyFileUuid: null,
    replyFileType: null,

    editingMessage: null
  }),

  computed: {
    getReplayed () {
      return this.messages.find(m => m.id === this.replyMessageId)
    },

    getMessageSender () {
      if (this.getReplayed.user) {
        return this.getReplayed.user.lastname + ' ' + this.getReplayed.user.firstname
      } else {
        return getClientDisplayName(this.client)
      }
    }
  },

  methods: {
    getReplyMessage (message) {
      if (message.text) {
        return this.shortenLine(message.text, 50)
      } else {
        return getAttachmentKindLabel(message.fileType)
      }
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

    shortenLine (string, offset = 25) {
      return shortenLine(string, offset)
    }
  }
}
