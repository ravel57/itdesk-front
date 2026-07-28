<template>
  <div ref="root" :class="wrapperClass" :style="wrapperStyle">
    <q-input
      ref="input"
      v-bind="inputAttrs"
      :model-value="modelValue"
      @update:model-value="onUpdateModelValue"
      @focus="onFocus"
      @blur="onBlur"
      @click="onCaretChanged"
      @keyup="onCaretChanged"
      @keydown="onKeydown"
      @change="onChange"
    />

    <q-menu
      v-model="menuVisible"
      no-parent-event
      no-focus
      no-refocus
      fit
      anchor="bottom left"
      self="top left"
      :offset="[0, 4]"
      class="automation-expression-menu"
    >
      <q-list dense class="automation-expression-list">
        <q-item v-if="loading" dense>
          <q-item-section avatar>
            <q-spinner size="18px" color="primary"/>
          </q-item-section>
          <q-item-section>
            <q-item-label>Загрузка подсказок…</q-item-label>
          </q-item-section>
        </q-item>

        <q-item
          v-for="(suggestion, index) in suggestions"
          :key="`${suggestion.path}-${suggestion.insertText}`"
          clickable
          dense
          :active="index === activeIndex"
          active-class="bg-primary text-white"
          @mouseenter="activeIndex = index"
          @mousedown.prevent
          @click="selectSuggestion(suggestion)"
        >
          <q-item-section avatar class="automation-expression-icon-section">
            <q-icon
              :name="kindIcon(suggestion.kind)"
              :color="index === activeIndex ? 'white' : kindColor(suggestion.kind)"
              size="19px"
            />
          </q-item-section>

          <q-item-section>
            <q-item-label class="automation-expression-label">
              {{ suggestion.label }}
            </q-item-label>
            <q-item-label caption :class="{ 'text-white': index === activeIndex }">
              {{ suggestion.description }}
            </q-item-label>
          </q-item-section>

          <q-item-section side>
            <q-badge
              outline
              :color="index === activeIndex ? 'white' : 'grey-7'"
              :label="suggestion.type"
            />
          </q-item-section>
        </q-item>

        <q-item v-if="!loading && !suggestions.length" dense>
          <q-item-section>
            <q-item-label caption>Нет подходящих свойств или методов</q-item-label>
          </q-item-section>
        </q-item>
      </q-list>
    </q-menu>
  </div>
</template>

<script>
import axios from 'axios'
import { nextTick } from 'vue'

export default {
  name: 'AutomationExpressionInput',
  inheritAttrs: false,

  props: {
    modelValue: {
      type: [String, Number],
      default: ''
    },
    variables: {
      type: Array,
      default: () => []
    },
    suggestionMode: {
      type: String,
      default: 'EXPRESSION',
      validator: value => ['EXPRESSION', 'ACTION'].includes(String(value || '').toUpperCase())
    },
    suggestionLimit: {
      type: Number,
      default: 50
    }
  },

  emits: ['update:modelValue', 'change', 'focus', 'blur'],

  data () {
    return {
      loading: false,
      menuVisible: false,
      suggestions: [],
      activeIndex: 0,
      replaceFrom: 0,
      replaceTo: 0,
      requestTimer: null,
      requestSequence: 0,
      focused: false,
      cache: new Map()
    }
  },

  computed: {
    wrapperClass () {
      return ['automation-expression-input', this.$attrs.class]
    },

    wrapperStyle () {
      return this.$attrs.style
    },

    inputAttrs () {
      const attrs = { ...this.$attrs }
      delete attrs.class
      delete attrs.style
      delete attrs.onChange
      delete attrs.onFocus
      delete attrs.onBlur
      delete attrs.onKeydown
      delete attrs.onKeyup
      delete attrs.onClick
      return attrs
    },

    normalizedVariables () {
      return [...new Set((this.variables || [])
        .filter(Boolean)
        .map(value => String(value).trim().replace(/^var\./, ''))
        .filter(Boolean))]
        .sort((left, right) => left.localeCompare(right))
    }
  },

  watch: {
    suggestionMode () {
      this.cache.clear()
      if (this.focused) this.scheduleSuggestions(0)
    }
  },

  beforeUnmount () {
    if (this.requestTimer) clearTimeout(this.requestTimer)
    this.requestSequence += 1
  },

  methods: {
    nativeInput () {
      return this.$refs.input?.$el?.querySelector('textarea, input') || null
    },

    cursorPosition () {
      const input = this.nativeInput()
      const value = String(this.modelValue ?? '')
      return Number.isInteger(input?.selectionStart) ? input.selectionStart : value.length
    },

    onUpdateModelValue (value) {
      this.$emit('update:modelValue', value)
      nextTick(() => this.scheduleSuggestions())
    },

    onChange (value) {
      this.$emit('change', value)
    },

    onFocus (event) {
      if (this.focused) return

      this.focused = true
      this.$emit('focus', event)
      this.scheduleSuggestions(0)
    },

    onBlur (event) {
      this.focused = false
      this.$emit('blur', event)

      if (this.requestTimer) {
        clearTimeout(this.requestTimer)
        this.requestTimer = null
      }

      // Отменяем применение ответа от запроса, который был отправлен до потери фокуса.
      this.requestSequence += 1
      this.loading = false

      window.setTimeout(() => {
        if (!this.focused) this.menuVisible = false
      }, 100)
    },

    onCaretChanged () {
      if (this.focused) this.scheduleSuggestions()
    },

    onKeydown (event) {
      if (event.key === 'ArrowDown') {
        if (!this.menuVisible) {
          this.scheduleSuggestions(0)
          return
        }
        event.preventDefault()
        if (this.suggestions.length) {
          this.activeIndex = (this.activeIndex + 1) % this.suggestions.length
        }
        return
      }

      if (event.key === 'ArrowUp' && this.menuVisible) {
        event.preventDefault()
        if (this.suggestions.length) {
          this.activeIndex = (this.activeIndex - 1 + this.suggestions.length) % this.suggestions.length
        }
        return
      }

      if ((event.key === 'Enter' || event.key === 'Tab') && this.menuVisible && this.suggestions.length) {
        event.preventDefault()
        this.selectSuggestion(this.suggestions[this.activeIndex] || this.suggestions[0])
        return
      }

      if (event.key === 'Escape' && this.menuVisible) {
        event.preventDefault()
        this.menuVisible = false
      }
    },

    scheduleSuggestions (delay = 120) {
      if (this.requestTimer) clearTimeout(this.requestTimer)
      this.requestTimer = window.setTimeout(() => this.loadSuggestions(), delay)
    },

    suggestionContext (text, cursor) {
      const template = this.templateExpressionContext(text, cursor)
      if (template) return template

      const mode = String(this.suggestionMode || 'EXPRESSION').toUpperCase()
      if (mode === 'ACTION') {
        const bounds = this.actionStatementBounds(text, cursor)
        return {
          text: text.slice(bounds.start, bounds.end),
          cursor: cursor - bounds.start,
          offset: bounds.start,
          mode: 'ACTION'
        }
      }

      return { text, cursor, offset: 0, mode: 'EXPRESSION' }
    },

    templateExpressionContext (text, cursor) {
      const beforeCursor = text.slice(0, cursor)
      const open = beforeCursor.lastIndexOf('{{')
      if (open < 0) return null

      const closeBeforeCursor = beforeCursor.lastIndexOf('}}')
      if (closeBeforeCursor > open) return null

      const expressionStart = open + 2
      if (cursor < expressionStart) return null

      const close = text.indexOf('}}', cursor)
      const expressionEnd = close >= 0 ? close : text.length

      return {
        text: text.slice(expressionStart, expressionEnd),
        cursor: cursor - expressionStart,
        offset: expressionStart,
        mode: 'EXPRESSION'
      }
    },

    actionStatementBounds (text, cursor) {
      let start = 0
      let depth = 0
      let quote = ''
      let escaped = false

      for (let index = 0; index < cursor; index++) {
        const value = text[index]
        if (quote) {
          if (escaped) {
            escaped = false
          } else if (value === '\\') {
            escaped = true
          } else if (value === quote) {
            quote = ''
          }
          continue
        }

        if (value === '\'' || value === '"') {
          quote = value
        } else if (value === '(') {
          depth += 1
        } else if (value === ')') {
          depth = Math.max(0, depth - 1)
        } else if ((value === ';' || value === '\n') && depth === 0) {
          start = index + 1
        }
      }

      let end = text.length
      depth = 0
      quote = ''
      escaped = false

      for (let index = start; index < text.length; index++) {
        const value = text[index]
        if (quote) {
          if (escaped) {
            escaped = false
          } else if (value === '\\') {
            escaped = true
          } else if (value === quote) {
            quote = ''
          }
          continue
        }

        if (value === '\'' || value === '"') {
          quote = value
        } else if (value === '(') {
          depth += 1
        } else if (value === ')') {
          depth = Math.max(0, depth - 1)
        } else if (index >= cursor && (value === ';' || value === '\n') && depth === 0) {
          end = index
          break
        }
      }

      return { start, end }
    },

    async loadSuggestions () {
      if (!this.focused) return

      const fullText = String(this.modelValue ?? '')
      const fullCursor = this.cursorPosition()
      const context = this.suggestionContext(fullText, fullCursor)
      const payload = {
        text: context.text,
        cursor: context.cursor,
        mode: context.mode,
        variables: this.normalizedVariables,
        limit: this.suggestionLimit
      }
      const cacheKey = JSON.stringify(payload)
      const cached = this.cache.get(cacheKey)
      if (cached) {
        this.applyResponse(cached, context)
        return
      }

      const sequence = ++this.requestSequence
      this.loading = true
      this.menuVisible = true

      try {
        const response = await axios.post('/api/v1/automation/expression/suggestions', payload)
        if (sequence !== this.requestSequence) return
        const data = response?.data || {}
        this.cache.set(cacheKey, data)
        if (this.cache.size > 200) {
          this.cache.delete(this.cache.keys().next().value)
        }
        this.applyResponse(data, context)
      } catch (error) {
        if (sequence !== this.requestSequence) return
        this.suggestions = []
        this.menuVisible = false
        console.warn('Unable to load automation expression suggestions', error)
      } finally {
        if (sequence === this.requestSequence) this.loading = false
      }
    },

    applyResponse (data, context = { offset: 0, cursor: this.cursorPosition() }) {
      const offset = Number.isInteger(context?.offset) ? context.offset : 0
      const localCursor = Number.isInteger(context?.cursor) ? context.cursor : this.cursorPosition()
      const localFrom = Number.isInteger(data?.replaceFrom) ? data.replaceFrom : localCursor
      const localTo = Number.isInteger(data?.replaceTo) ? data.replaceTo : localCursor

      this.replaceFrom = offset + localFrom
      this.replaceTo = offset + localTo
      this.suggestions = Array.isArray(data?.suggestions) ? data.suggestions : []
      this.activeIndex = 0
      this.menuVisible = this.focused && (this.loading || this.suggestions.length > 0)
    },

    selectSuggestion (suggestion) {
      if (!suggestion) return

      const current = String(this.modelValue ?? '')
      const start = Math.max(0, Math.min(this.replaceFrom, current.length))
      const end = Math.max(start, Math.min(this.replaceTo, current.length))
      const insertText = String(suggestion.insertText || '')
      const appendDot = suggestion.appendDot === true ||
        (suggestion.appendDot === undefined && suggestion.hasChildren && !suggestion.callable)
      const suffix = appendDot && !insertText.endsWith('.') ? '.' : ''
      const inserted = `${insertText}${suffix}`
      const value = `${current.slice(0, start)}${inserted}${current.slice(end)}`
      const caretOffset = Number.isInteger(suggestion.caretOffset) ? suggestion.caretOffset : 0
      const caret = Math.max(start, start + inserted.length + caretOffset)

      this.$emit('update:modelValue', value)
      this.$emit('change', value)
      this.menuVisible = false
      this.focused = true

      nextTick(() => {
        const input = this.nativeInput()
        input?.focus()
        input?.setSelectionRange?.(caret, caret)
        if (appendDot) this.scheduleSuggestions(0)
      })
    },

    kindIcon (kind) {
      return {
        OBJECT: 'data_object',
        COLLECTION: 'format_list_bulleted',
        MAP: 'account_tree',
        STRING: 'text_fields',
        NUMBER: 'numbers',
        BOOLEAN: 'toggle_on',
        DATE_TIME: 'schedule',
        ENUM: 'list_alt',
        FUNCTION: 'functions',
        METHOD: 'functions',
        ACTION_API: 'api',
        ACTION_METHOD: 'play_circle',
        VARIABLE: 'data_object',
        VARIABLES: 'inventory_2'
      }[kind] || 'circle'
    },

    kindColor (kind) {
      return {
        OBJECT: 'indigo-7',
        COLLECTION: 'deep-purple-6',
        MAP: 'purple-7',
        STRING: 'teal-7',
        NUMBER: 'blue-7',
        BOOLEAN: 'orange-8',
        DATE_TIME: 'cyan-8',
        ENUM: 'brown-7',
        FUNCTION: 'pink-7',
        METHOD: 'deep-purple-7',
        ACTION_API: 'green-8',
        ACTION_METHOD: 'green-7',
        VARIABLE: 'blue-grey-7',
        VARIABLES: 'blue-grey-8'
      }[kind] || 'grey-7'
    }
  }
}
</script>

<style scoped>
.automation-expression-input {
  position: relative;
  width: 100%;
}
</style>

<style>
.automation-expression-menu {
  max-height: 330px;
  overflow-y: auto;
  min-width: 320px;
  max-width: min(520px, calc(100vw - 32px));
}

.automation-expression-list {
  min-width: 320px;
}

.automation-expression-icon-section {
  min-width: 34px !important;
  padding-right: 4px !important;
}

.automation-expression-label {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-weight: 600;
}
</style>
