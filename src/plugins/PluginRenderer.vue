<template>
  <div v-if="isVisible" class="plugin-renderer">
    <div
      v-if="schema.component === 'field'"
      class="plugin-field"
      :class="{ 'plugin-field-inline': isInlineField }"
    >
      <div class="plugin-field-label">
        <q-icon
          v-if="schema.props && schema.props.icon"
          :name="schema.props.icon"
          size="16px"
          class="plugin-field-icon"
        />

        <span>{{ schema.props.label }}</span>
      </div>

      <div
        v-if="schema.props.type === 'copyable-text'"
        class="plugin-field-value plugin-copyable"
        @click="copyToClipboard(resolvedValue)"
      >
        {{ resolvedValue }}
      </div>

      <div
        v-else
        class="plugin-field-value"
      >
        {{ resolvedValue }}
      </div>
    </div>

    <div
      v-else-if="schema.component === 'section'"
      class="plugin-section"
      :class="{ 'plugin-section-inline': schema.props?.layout === 'inline' }"
    >
      <div
        v-if="schema.props && schema.props.title"
        class="plugin-section-title"
      >
        {{ schema.props.title }}
      </div>

      <PluginRenderer
        v-for="(child, index) in schema.props.children || []"
        :key="index"
        :schema="child"
        :context="context"
      />
    </div>

    <q-btn
      v-else-if="schema.component === 'button'"
      class="plugin-button"
      :dense="schema.props.dense !== false"
      :flat="schema.props.flat === true"
      :round="schema.props.round === true"
      :outline="schema.props.outline === true"
      :no-caps="schema.props.noCaps !== false"
      :color="schema.props.color || 'primary'"
      :icon="schema.props.icon"
      :label="schema.props.round ? undefined : schema.props.label"
      @click="executeAction"
    >
      <q-tooltip v-if="schema.props.tooltip">
        {{ schema.props.tooltip }}
      </q-tooltip>
    </q-btn>

    <q-badge
      v-else-if="schema.component === 'badge'"
      class="plugin-badge"
      :color="schema.props.color || 'primary'"
    >
      {{ resolvedLabel }}
    </q-badge>

    <div
      v-else-if="schema.component === 'text'"
      class="plugin-text"
    >
      {{ resolvedValue }}
    </div>

    <div
      v-else-if="schema.component === 'remote-text'"
      class="plugin-remote-text"
    >
      {{ remoteText }}
    </div>

    <a
      v-else-if="schema.component === 'link'"
      class="plugin-link"
      :href="resolvedHref"
      target="_blank"
      rel="noopener noreferrer"
    >
      {{ resolvedLabel }}
    </a>

    <q-separator
      v-else-if="schema.component === 'divider'"
      class="plugin-divider"
    />
  </div>
</template>

<script>
import {evaluateVisible, resolveValue} from './pluginUtils'
import {pluginNativeBridge} from './pluginNativeBridge'

const remoteTextCache = new Map()
const DEFAULT_REMOTE_TEXT_TTL_MS = 5000

export default {
  name: 'PluginRenderer',

  props: {
    schema: {
      type: Object,
      required: true
    },
    context: {
      type: Object,
      required: true
    }
  },

  data: () => ({
    remoteText: '',
    remoteLoading: false,
    remoteTextIntervalId: null
  }),

  computed: {
    isVisible() {
      return evaluateVisible(this.schema.props?.visible, this.context)
    },

    resolvedValue() {
      return resolveValue(this.schema.props?.value, this.context)
    },

    resolvedLabel() {
      return resolveValue(this.schema.props?.label, this.context)
    },

    resolvedHref() {
      return resolveValue(this.schema.props?.href, this.context)
    },

    isInlineField() {
      return this.schema.component === 'field' && this.schema.props?.layout === 'inline'
    },
  },

  methods: {
    async copyToClipboard(value) {
      await navigator.clipboard.writeText(String(value))

      this.$q.notify({
        message: 'Скопировано',
        type: 'positive',
        position: 'top-right',
        actions: [{icon: 'close', color: 'white', dense: true, handler: () => undefined}]
      })
    },

    async executeAction() {
      try {
        const action = this.schema.props?.action
        if (!action) {
          return
        }
        if (action.type === 'open-url') {
          const url = this.resolveActionUrl(action)
          if (url) {
            window.location.href = url
          }
          return
        }
        const response = await pluginNativeBridge.execute(action, this.context)
        const results = response?.data?.results || []
        this.handlePluginResults(results)
      } catch (e) {
        this.$q.notify({
          message: 'Ошибка выполнения действия плагина',
          type: 'negative',
          position: 'top-right',
          actions: [{icon: 'close', color: 'white', dense: true, handler: () => undefined}]
        })
      }
    },

    handlePluginResults(results) {
      results.forEach(result => {
        const commands = result?.commands || []

        commands.forEach(command => {
          this.handlePluginCommand(command)
        })
      })
    },

    handlePluginCommand(command) {
      if (command.type === 'SHOW_TOAST') {
        this.$q.notify({
          message: command.payload?.message || '',
          type: command.payload?.type || 'info',
          position: 'top-right',
          actions: [{icon: 'close', color: 'white', dense: true, handler: () => undefined}]
        })
      }

      if (command.type === 'OPEN_URL') {
        const url = command.payload?.url

        if (url) {
          window.open(url, '_blank')
        }
      }

      if (command.type === 'REFRESH_PAGE') {
        window.location.reload()
      }
    },

    resolveActionUrl(action) {
      if (!action?.url) {
        return null
      }
      if (typeof action.url === 'string') {
        return action.url
      }
      if (action.url.template) {
        return this.resolveTemplate(action.url.template)
      }
      return null
    },

    resolveTemplate(template) {
      if (!template) {
        return ''
      }
      return template.replace(/\$\{([^}]+)}/g, (_, path) => {
        const value = this.getByPathForTemplate(path.trim())
        return value !== null && value !== undefined ? encodeURIComponent(String(value)) : ''
      })
    },

    getByPathForTemplate(path) {
      return path.split('.').reduce((current, part) => {
        if (current === null || current === undefined) {
          return undefined
        }
        return current[part]
      }, this.context)
    },

    getRemoteTextCacheKey () {
      const hook = this.schema.props?.hook || ''
      const entityType = this.context?.entityType || ''
      const entityId = this.context?.entity?.id || ''

      return `${this.schema.pluginKey}:${this.schema.key}:${hook}:${entityType}:${entityId}`
    },

    async loadRemoteText () {
      if (this.schema.component !== 'remote-text') {
        return
      }

      if (!this.isVisible) {
        return
      }

      const hook = this.schema.props?.hook

      if (!hook) {
        return
      }

      const cacheKey = this.getRemoteTextCacheKey()
      const cached = remoteTextCache.get(cacheKey)
      const now = Date.now()
      const ttl = this.getRemoteTextCacheTtlMs()

      if (cached && cached.text !== undefined && now - cached.time < ttl) {
        this.remoteText = cached.text
        return
      }
      if (cached && cached.pending) {
        try {
          const text = await cached.pending

          if (text !== undefined && text !== null) {
            this.remoteText = text
          }
        } catch (e) {
          if (!this.remoteText) {
            this.remoteText = this.schema.props?.errorText || ''
          }
        }

        return
      }

      const hasOldText = this.remoteText !== null &&
        this.remoteText !== undefined &&
        this.remoteText !== ''

      if (!hasOldText && cached?.text) {
        this.remoteText = cached.text
      }

      if (!hasOldText && !cached?.text) {
        this.remoteText = this.schema.props?.loadingText || ''
      }

      this.remoteLoading = true
      const pending = pluginNativeBridge.execute({
        type: 'hook',
        name: hook,
        payload: {}
      }, this.context)
        .then(response => {
          const results = response?.data?.results || []
          const firstResult = results[0]
          const text = firstResult?.text || ''
          remoteTextCache.set(cacheKey, {
            text,
            time: Date.now(),
            pending: null
          })
          return text
        })
        .catch(() => {
          const fallbackText = cached?.text || this.remoteText || this.schema.props?.errorText || ''

          remoteTextCache.set(cacheKey, {
            text: fallbackText,
            time: Date.now(),
            pending: null
          })

          return fallbackText
        })
      remoteTextCache.set(cacheKey, {
        text: cached?.text || this.remoteText,
        time: cached?.time || 0,
        pending
      })
      try {
        const text = await pending

        if (text !== undefined && text !== null) {
          this.remoteText = text
        }
      } finally {
        this.remoteLoading = false
      }
    },

    getRemoteTextCacheTtlMs () {
      const ttl = Number(this.schema.props?.cacheTtlMs)

      if (Number.isFinite(ttl) && ttl >= 0) {
        return ttl
      }

      return DEFAULT_REMOTE_TEXT_TTL_MS
    },

    getRemoteTextRefreshIntervalMs () {
      const interval = Number(this.schema.props?.refreshIntervalMs)

      if (Number.isFinite(interval) && interval > 0) {
        return interval
      }

      return 0
    },

    startRemoteTextInterval () {
      if (this.schema.component !== 'remote-text') {
        return
      }

      const interval = this.getRemoteTextRefreshIntervalMs()

      if (interval <= 0) {
        return
      }

      this.stopRemoteTextInterval()

      this.remoteTextIntervalId = window.setInterval(() => {
        this.loadRemoteText()
      }, interval)
    },

    stopRemoteTextInterval () {
      if (this.remoteTextIntervalId) {
        window.clearInterval(this.remoteTextIntervalId)
        this.remoteTextIntervalId = null
      }
    },

    restartRemoteTextInterval () {
      this.stopRemoteTextInterval()
      this.startRemoteTextInterval()
    },
  },

  watch: {
    context: {
      deep: true,
      handler() {
        this.loadRemoteText()
        this.restartRemoteTextInterval()
      }
    }
  },

  mounted() {
    this.loadRemoteText()
    this.startRemoteTextInterval()
  },

  beforeUnmount() {
    this.stopRemoteTextInterval()
  },
}
</script>

<style scoped>
.plugin-renderer {
  margin-top: 6px;
}

.plugin-field {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-top: 6px;
}

.plugin-field-label {
  display: flex;
  align-items: center;
  font-size: 12px;
  opacity: 0.7;
}

.plugin-field-icon {
  margin-right: 6px;
}

.plugin-field-value {
  font-size: 14px;
  word-break: break-word;
}

.plugin-copyable {
  cursor: pointer;
  text-decoration: underline;
  text-underline-offset: 2px;
}

.plugin-section {
  margin-top: 8px;
}

.plugin-section-title {
  font-weight: 600;
  margin-bottom: 4px;
}

.plugin-button {
  margin-top: 6px;
}

.plugin-badge {
  margin-top: 4px;
}

.plugin-text {
  margin-top: 4px;
}

.plugin-link {
  display: inline-block;
  margin-top: 4px;
}

.plugin-divider {
  margin-top: 8px;
  margin-bottom: 8px;
}

.plugin-field {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-top: 6px;
}

.plugin-field-inline {
  flex-direction: row;
  align-items: baseline;
  gap: 6px;
  white-space: nowrap;
}

.plugin-field-inline .plugin-field-label {
  font-size: 14px;
  opacity: 0.7;
}

.plugin-field-inline .plugin-field-value {
  font-size: 14px;
}

.plugin-field-inline .plugin-copyable {
  text-decoration: underline;
  text-underline-offset: 2px;
}

.plugin-text {
  margin-top: 2px;
  font-size: 12px;
  opacity: 0.65;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.plugin-remote-text {
  margin-top: 0;
  font-size: 13px;
  color: var(--q-primary);
  white-space: nowrap;
}

.plugin-section-inline {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 0;
}

.plugin-section-inline :deep(.plugin-renderer) {
  margin-top: 0;
}

.plugin-section-inline .plugin-text,
.plugin-section-inline .plugin-remote-text {
  margin-top: 0;
  white-space: nowrap;
}
</style>
