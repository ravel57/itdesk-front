import axios from 'axios'
import {getErrorMessage, normalizePluginSecrets} from 'src/util/settingsPlugins/pluginNormalizers'

// Секреты плагина в диалоге «Доступы и секреты»: список, ввод значения, сохранение и удаление.
// Значения секретов хранятся только в secretValues и не читаются обратно из backend.
// Требует в компоненте: this.securityPlugin, this.notifyPositive / notifyNegative (pluginsNotifyMixin).
export default {
  data: () => ({
    pluginSecrets: [],
    secretActions: {},
    secretValues: {},
    secretVisibility: {}
  }),

  computed: {
    hasAnySecretAction() {
      return Object.values(this.secretActions).some(Boolean)
    }
  },

  methods: {
    async refreshPluginSecrets() {
      const pluginKey = this.securityPlugin?.key
      if (!pluginKey) {
        return
      }

      const response = await axios.get(`/api/v1/plugins/${encodeURIComponent(pluginKey)}/secrets`)
      this.pluginSecrets = normalizePluginSecrets(response.data)

      const nextValues = {}
      this.pluginSecrets.forEach(secret => {
        nextValues[secret.name] = this.secretValues[secret.name] || ''
      })
      this.secretValues = nextValues
    },

    isSecretBusy(name) {
      return this.secretActions[name] === true
    },

    setSecretBusy(name, busy) {
      this.secretActions = {
        ...this.secretActions,
        [name]: busy
      }
    },

    hasSecretValue(name) {
      const value = this.secretValues[name]
      return typeof value === 'string' && value.trim().length > 0
    },

    isSecretVisible(name) {
      return this.secretVisibility[name] === true
    },

    toggleSecretVisibility(name) {
      this.secretVisibility = {
        ...this.secretVisibility,
        [name]: !this.secretVisibility[name]
      }
    },

    async savePluginSecret(secret) {
      const pluginKey = this.securityPlugin?.key
      const value = this.secretValues[secret.name]
      if (!pluginKey || typeof value !== 'string' || !value.trim()) {
        return
      }

      this.setSecretBusy(secret.name, true)
      try {
        await axios.put(
          `/api/v1/plugins/${encodeURIComponent(pluginKey)}/secrets/${encodeURIComponent(secret.name)}`,
          { value }
        )

        // Значение намеренно не сохраняем и не перечитываем после запроса.
        this.secretValues = {
          ...this.secretValues,
          [secret.name]: ''
        }
        this.secretVisibility = {
          ...this.secretVisibility,
          [secret.name]: false
        }

        await this.refreshPluginSecrets()
        this.notifyPositive(`Секрет ${secret.title || secret.name} сохранён`)
      } catch (e) {
        this.notifyNegative(getErrorMessage(e, 'Не удалось сохранить секрет'))
      } finally {
        this.setSecretBusy(secret.name, false)
      }
    },

    async deletePluginSecret(secret) {
      const pluginKey = this.securityPlugin?.key
      if (!pluginKey) {
        return
      }

      if (!window.confirm(`Удалить сохранённое значение секрета "${secret.title || secret.name}"?`)) {
        return
      }

      this.setSecretBusy(secret.name, true)
      try {
        await axios.delete(
          `/api/v1/plugins/${encodeURIComponent(pluginKey)}/secrets/${encodeURIComponent(secret.name)}`
        )
        this.secretValues = {
          ...this.secretValues,
          [secret.name]: ''
        }
        this.secretVisibility = {
          ...this.secretVisibility,
          [secret.name]: false
        }
        await this.refreshPluginSecrets()
        this.notifyPositive(`Значение секрета ${secret.title || secret.name} удалено`)
      } catch (e) {
        this.notifyNegative(getErrorMessage(e, 'Не удалось удалить секрет'))
      } finally {
        this.setSecretBusy(secret.name, false)
      }
    }
  }
}
