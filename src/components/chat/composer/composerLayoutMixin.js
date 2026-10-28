import { getChatDialogElement, getTextareaMaxHeight } from 'src/util/chatComposer/textareaLayout'

// Размеры и оформление поля ввода: авто-высота textarea с подгонкой высоты окна чата, стили панели.
// Требует в компоненте: props chatStyle/isDialog/isMobile, isComment, replyMessageId, editingMessage,
// ref textInput, ref replyBar/editBar (getContainerHeight), scrollToBottom, updateMentionState, updateTemplateState.
export default {
  data: () => ({
    textareaHeight: 46
  }),

  computed: {
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
    }
  },

  methods: {
    autoResize () {
      this.$nextTick(() => {
        let auxiliaryContainerHeight = 0
        const chat = getChatDialogElement(this.isDialog)
        if (this.$refs.replyBar) {
          auxiliaryContainerHeight += this.$refs.replyBar.getContainerHeight()
        }
        if (this.$refs.editBar) {
          auxiliaryContainerHeight += this.$refs.editBar.getContainerHeight()
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

    getTextareaMaxHeight () {
      return getTextareaMaxHeight({
        editing: this.editingMessage !== null,
        isMobile: this.isMobile,
        isDialog: this.isDialog
      })
    }
  }
}
