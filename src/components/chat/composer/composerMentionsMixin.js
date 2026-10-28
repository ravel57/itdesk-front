import { buildMentionText, filterMentionUsers, matchMentionTrigger } from 'src/util/chatComposer/mentions'

// Упоминания пользователей (@) в комментариях и во встроенном чате заявки.
// Требует в компоненте: this.store (users), props isComment/isDialog/portalMode, ref textInput,
// ref suggestionMenus (updateMentionPosition), autoResize (composerLayoutMixin), $emit('keyPressed').
export default {
  data: () => ({
    mentionMenu: false,
    mentionQuery: '',
    mentionIndex: 0,
    mentionTargetEl: null
  }),

  computed: {
    mentionsEnabled () {
      return !this.portalMode && (this.isComment || this.isDialog)
    },

    filteredMentionUsers () {
      if (!this.mentionsEnabled) {
        return []
      }

      const users = Array.isArray(this.store?.users) ? this.store.users : []
      return filterMentionUsers(users, this.mentionQuery)
    }
  },

  methods: {
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
      const match = matchMentionTrigger(before)

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
          this.$refs.suggestionMenus?.updateMentionPosition()
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

      const inserted = buildMentionText(user)
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
    }
  }
}
