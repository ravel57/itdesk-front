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

    <!-- Подсветка синтаксиса: раскрашенная копия текста поверх прозрачного текста поля. На ввод не влияет. -->
    <teleport v-if="overlayTarget" :to="overlayTarget">
      <div class="automation-highlight" :style="overlayStyle" aria-hidden="true">
        <div class="automation-highlight__text" :style="overlayTextStyle">
          <span v-for="(segment, index) in highlightedSegments" :key="index" :class="segment.cls">{{ segment.text }}</span>
          <span>&#8203;</span>
        </div>
      </div>
    </teleport>

    <!-- Подсказка параметров вызова, как в IDE: текущий аргумент жирным, неподходящие перегрузки бледнее -->
    <q-tooltip
      v-model="signatureVisible"
      no-parent-event
      anchor="top left"
      self="bottom left"
      :offset="[0, 6]"
      max-width="560px"
      transition-show="none"
      transition-hide="none"
      class="automation-signature-hint"
    >
      <div
        v-for="(signature, index) in signatureLines"
        :key="index"
        class="automation-signature-hint__line"
        :class="{ 'automation-signature-hint__line--inapplicable': !signature.applicable }"
      >
        <template v-if="signature.parameters.length">
          <template v-for="(parameter, parameterIndex) in signature.parameters" :key="parameterIndex">
            <span :class="{ 'automation-signature-hint__current': parameter.current }">{{ parameter.text }}</span>
            <span v-if="parameterIndex < signature.parameters.length - 1">, </span>
          </template>
        </template>
        <span v-else>&lt;без параметров&gt;</span>
      </div>
    </q-tooltip>

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
import { highlightSegments } from 'src/util/automationHighlight'

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
      validator: value => ['EXPRESSION', 'ACTION', 'TEMPLATE'].includes(String(value || '').toUpperCase())
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
      signatureHelp: null,
      signatureVisible: false,
      activeIndex: 0,
      replaceFrom: 0,
      replaceTo: 0,
      requestTimer: null,
      requestSequence: 0,
      focused: false,
      cache: new Map(),
      overlayTarget: null,
      overlayStyle: {},
      overlayTextStyle: {},
      resizeObserver: null
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

    signatureLines () {
      const help = this.signatureHelp
      if (!help || !Array.isArray(help.signatures)) return []
      const active = Number(help.activeParameter) || 0
      return help.signatures.map(signature => {
        const parameters = Array.isArray(signature.parameters) ? signature.parameters : []
        const applicable = parameters.length > active || (active === 0 && parameters.length === 0)
        return {
          applicable,
          parameters: parameters.map((parameter, index) => ({
            text: parameter.name ? `${parameter.type} ${parameter.name}` : parameter.type,
            current: applicable && index === active
          }))
        }
      })
    },

    highlightedSegments () {
      return highlightSegments(this.modelValue, this.suggestionMode)
    },

    variableTypes () {
      return Object.fromEntries(this.variables.filter(value => value && typeof value === 'object' && value.name)
        .map(({ name, ...schema }) => [name.replace(/^var\./, ''), schema]))
    },

    normalizedVariables () {
      return [...new Set((this.variables || [])
        .filter(Boolean)
        .map(value => String(typeof value === 'object' ? value.name : value).trim().replace(/^var\./, ''))
        .filter(Boolean))]
        .sort((left, right) => left.localeCompare(right))
    }
  },

  watch: {
    variables: {
      deep: true,
      handler () {
        this.cache.clear()
        if (this.focused) this.scheduleSuggestions(0)
      }
    },
    suggestionMode () {
      this.cache.clear()
      if (this.focused) this.scheduleSuggestions(0)
    },
    modelValue () {
      nextTick(() => this.syncOverlay())
    }
  },

  mounted () {
    this.attachOverlay()
  },

  beforeUnmount () {
    this.resizeObserver?.disconnect()
    this.nativeInput()?.removeEventListener('scroll', this.syncOverlayScroll)
    if (this.requestTimer) clearTimeout(this.requestTimer)
    this.requestSequence += 1
  },

  methods: {
    // Слой подсветки кладём внутрь контейнера q-field рядом с нативным полем и копируем его шрифт и отступы,
    // чтобы цветной текст точно ложился на настоящий.
    attachOverlay () {
      const input = this.nativeInput()
      const container = input?.parentElement
      if (!input || !container) return
      if (getComputedStyle(container).position === 'static') container.style.position = 'relative'
      this.overlayTarget = container
      input.addEventListener('scroll', this.syncOverlayScroll)
      if (typeof ResizeObserver !== 'undefined') {
        this.resizeObserver = new ResizeObserver(() => this.syncOverlay())
        this.resizeObserver.observe(input)
      }
      nextTick(() => this.syncOverlay())
    },

    syncOverlay () {
      const input = this.nativeInput()
      if (!input) return
      const style = getComputedStyle(input)
      const multiline = input.tagName === 'TEXTAREA'
      this.overlayStyle = {
        top: `${input.offsetTop}px`,
        left: `${input.offsetLeft}px`,
        width: `${input.clientWidth}px`,
        height: `${input.clientHeight}px`
      }
      this.overlayTextStyle = {
        font: style.font,
        letterSpacing: style.letterSpacing,
        lineHeight: style.lineHeight,
        padding: style.padding,
        boxSizing: 'border-box',
        whiteSpace: multiline ? 'pre-wrap' : 'pre',
        overflowWrap: multiline ? 'break-word' : 'normal',
        width: multiline ? '100%' : 'max-content',
        minWidth: '100%'
      }
      this.syncOverlayScroll()
    },

    syncOverlayScroll () {
      const input = this.nativeInput()
      const text = this.$el?.querySelector?.('.automation-highlight__text')
      if (!input || !text) return
      text.style.transform = `translate(${-input.scrollLeft}px, ${-input.scrollTop}px)`
    },

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
        if (!this.focused) {
          this.menuVisible = false
          this.signatureVisible = false
        }
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

      if (event.key === 'Enter' && this.nativeInput()?.tagName === 'TEXTAREA') {
        this.menuVisible = false
        return
      }

      if ((event.key === 'Enter' || event.key === 'Tab') && this.menuVisible && this.suggestions.length) {
        event.preventDefault()
        this.selectSuggestion(this.suggestions[this.activeIndex] || this.suggestions[0])
        return
      }

      if (event.key === 'Escape' && (this.menuVisible || this.signatureVisible)) {
        event.preventDefault()
        this.menuVisible = false
        this.signatureVisible = false
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
      // Plain template text (kind "Текст"): only {{ ... }} spans are expressions —
      // the rest is literal text, so outside a {{ }} there is nothing to suggest.
      if (mode === 'TEMPLATE') return null
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
        } else if ((value === ';' || value === '\n' || value === '\r') && depth === 0) {
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
        } else if (index >= cursor && (value === ';' || value === '\n' || value === '\r') && depth === 0) {
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
      if (!context) {
        this.requestSequence += 1
        this.loading = false
        this.suggestions = []
        this.menuVisible = false
        this.signatureVisible = false
        return
      }
      const payload = {
        text: context.text,
        cursor: context.cursor,
        mode: context.mode,
        variables: this.normalizedVariables,
        variableTypes: this.variableTypes,
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
        this.signatureVisible = false
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
      this.signatureHelp = data?.signatureHelp || null
      this.signatureVisible = this.focused && this.signatureLines.length > 0
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

/* Свой текст поля делаем прозрачным — его рисует слой подсветки; каретка остаётся видимой. */
.automation-expression-input :deep(.q-field__native) {
  color: transparent !important;
  caret-color: var(--aeh-caret);
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

.automation-signature-hint {
  padding: 6px 10px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 12px;
  line-height: 1.6;
  color: var(--q-dark, #1d1d1d);
  background: #fff;
  border: 1px solid rgba(0, 0, 0, 0.12);
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.12);
}

.body--dark .automation-signature-hint {
  color: #e6e6e6;
  background: #2b2d30;
  border-color: rgba(255, 255, 255, 0.12);
}

.automation-signature-hint__line {
  white-space: nowrap;
}

.automation-signature-hint__line--inapplicable {
  opacity: 0.45;
}

.automation-signature-hint__current {
  font-weight: 700;
}

.automation-expression-label {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-weight: 600;
}
</style>

<style>
:root {
  --aeh-caret: #1d1d1d;
  --aeh-variable: #1565c0;
  --aeh-getter: #00838f;
  --aeh-method: #7b1fa2;
  --aeh-operator: #d84315;
  --aeh-literal: #ef6c00;
  --aeh-string: #2e7d32;
  --aeh-number: #0277bd;
  --aeh-punct: #757575;
  --aeh-brace: #c2185b;
  --aeh-brace-bg: rgba(194, 24, 91, 0.1);
  --aeh-text: #1d1d1d;
}

.body--dark {
  --aeh-caret: #f1f1f1;
  --aeh-variable: #82b1ff;
  --aeh-getter: #4dd0e1;
  --aeh-method: #ce93d8;
  --aeh-operator: #ff8a65;
  --aeh-literal: #ffb74d;
  --aeh-string: #81c784;
  --aeh-number: #4fc3f7;
  --aeh-punct: #9e9e9e;
  --aeh-brace: #f48fb1;
  --aeh-brace-bg: rgba(244, 143, 177, 0.16);
  --aeh-text: #f1f1f1;
}

.automation-highlight {
  position: absolute;
  overflow: hidden;
  pointer-events: none;
  color: var(--aeh-text);
}

.automation-highlight__text {
  user-select: none;
}

.automation-highlight .aeh-variable { color: var(--aeh-variable); }
.automation-highlight .aeh-getter { color: var(--aeh-getter); }
.automation-highlight .aeh-method { color: var(--aeh-method); }
.automation-highlight .aeh-operator { color: var(--aeh-operator); font-weight: 600; }
.automation-highlight .aeh-literal { color: var(--aeh-literal); }
.automation-highlight .aeh-string { color: var(--aeh-string); }
.automation-highlight .aeh-number { color: var(--aeh-number); }
.automation-highlight .aeh-punct { color: var(--aeh-punct); }
.automation-highlight .aeh-brace {
  color: var(--aeh-brace);
  font-weight: 700;
  background: var(--aeh-brace-bg);
  border-radius: 3px;
}
</style>
