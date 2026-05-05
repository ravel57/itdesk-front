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
        dense
        outline
        no-caps
        class="plugin-button"
        :icon="schema.props.icon"
        :label="schema.props.label"
        @click="executeAction"
    />

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
import { evaluateVisible, resolveValue } from './pluginUtils'
import { pluginNativeBridge } from './pluginNativeBridge'

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

  computed: {
    isVisible () {
      return evaluateVisible(this.schema.props?.visible, this.context)
    },

    resolvedValue () {
      return resolveValue(this.schema.props?.value, this.context)
    },

    resolvedLabel () {
      return resolveValue(this.schema.props?.label, this.context)
    },

    resolvedHref () {
      return resolveValue(this.schema.props?.href, this.context)
    },

    isInlineField () {
      return this.schema.component === 'field' && this.schema.props?.layout === 'inline'
    },
  },

  methods: {
    async copyToClipboard (value) {
      await navigator.clipboard.writeText(String(value))

      this.$q.notify({
        message: 'Скопировано',
        type: 'positive',
        position: 'top-right'
      })
    },

    async executeAction () {
      try {
        const response = await pluginNativeBridge.execute(this.schema.props.action, this.context)
        const results = response?.data?.results || []

        this.handlePluginResults(results)
      } catch (e) {
        this.$q.notify({
          message: 'Ошибка выполнения действия плагина',
          type: 'negative',
          position: 'top-right'
        })
      }
    },

    handlePluginResults (results) {
      results.forEach(result => {
        const commands = result?.commands || []

        commands.forEach(command => {
          this.handlePluginCommand(command)
        })
      })
    },

    handlePluginCommand (command) {
      if (command.type === 'SHOW_TOAST') {
        this.$q.notify({
          message: command.payload?.message || '',
          type: command.payload?.type || 'info',
          position: 'top-right'
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
    }
  }
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
</style>
