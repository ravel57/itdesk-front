import { findTemplateByShortcut } from 'src/util/chatComposer/templateSuggestions'

// Клавиатура в поле ввода: отправка по ctrl/cmd+enter, навигация по меню упоминаний и шаблонов, tab-автоввод шаблона.
// Требует в компоненте: sendMessage, mentionsEnabled/mentionMenu/mentionIndex/filteredMentionUsers/selectMention,
// templateMenu/templateIndex/filteredTemplateSuggestions/selectTemplateSuggestion/closeTemplateMenu,
// templateMatchStart/templateMatchEnd, props templates/isMobile/portalMode, isComment, ref textInput.
export default {
  computed: {
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
    }
  },

  methods: {
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
      const template = findTemplateByShortcut(this.templates, shortcut)

      if (template) {
        event.preventDefault()
        this.templateMatchStart = caret - shortcutMatch[0].trimStart().length
        this.templateMatchEnd = caret
        this.selectTemplateSuggestion(template)
      }
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
    }
  }
}
