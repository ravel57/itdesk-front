import {
  findTemplateSearchContext,
  getMatchingTemplates,
  normalizeTemplateSearch
} from 'src/util/chatComposer/templateSuggestions'

// Подсказки шаблонов сообщений: меню после «:shortcut» или набранного фрагмента текста шаблона.
// Требует в компоненте: props templates, ref textInput, ref templateSuggestions (updateTemplatePosition),
// mentionsEnabled (composerMentionsMixin), autoResize (composerLayoutMixin), $emit('keyPressed').
export default {
  data: () => ({
    templateMenu: false,
    templateQuery: '',
    templateIndex: 0,
    templateTargetEl: null,
    templateMatchStart: null,
    templateMatchEnd: null
  }),

  computed: {
    filteredTemplateSuggestions () {
      return this.getMatchingTemplates(this.templateQuery)
    }
  },

  methods: {
    normalizeTemplateSearch (value) {
      return normalizeTemplateSearch(value)
    },

    getMatchingTemplates (value) {
      return getMatchingTemplates(this.templates, value)
    },

    closeTemplateMenu () {
      this.templateMenu = false
      this.templateQuery = ''
      this.templateIndex = 0
      this.templateMatchStart = null
      this.templateMatchEnd = null
    },

    getTemplateSearchContext (textarea) {
      return findTemplateSearchContext({
        value: textarea.value,
        caret: textarea.selectionStart ?? textarea.value.length,
        mentionsEnabled: this.mentionsEnabled,
        templates: this.templates
      })
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
            this.$refs.suggestionMenus?.updateTemplatePosition()
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
    }
  }
}
