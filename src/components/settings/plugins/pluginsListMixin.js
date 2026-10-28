import axios from 'axios'
import {getErrorMessage, normalizePlugins} from 'src/util/settingsPlugins/pluginNormalizers'

// Список установленных плагинов и действия над ними: загрузка, перезагрузка, включение, отключение, удаление.
// Требует на странице: this.notifyPositive / notifyNegative (pluginsNotifyMixin).
export default {
  data: () => ({
    plugins: [],
    loading: false,
    reloading: false
  }),

  methods: {
    async loadPlugins() {
      this.loading = true

      try {
        const response = await axios.get('/api/v1/plugins')
        this.plugins = normalizePlugins(response.data)
      } catch (e) {
        this.notifyNegative('Не удалось загрузить список плагинов')
      } finally {
        this.loading = false
      }
    },

    async reloadPlugins() {
      this.reloading = true

      try {
        await axios.post('/api/v1/plugins/reload')
        this.notifyPositive('Плагины перезагружены')
        await this.loadPlugins()
      } catch (e) {
        this.notifyNegative('Не удалось перезагрузить плагины')
      } finally {
        this.reloading = false
      }
    },

    async reloadSinglePlugin(plugin) {
      try {
        await axios.post(`/api/v1/plugins/${encodeURIComponent(plugin.key)}/reload`)
        this.notifyPositive(`Плагин ${plugin.name || plugin.key} перезагружен`)
        await this.loadPlugins()
      } catch (e) {
        this.notifyNegative('Не удалось перезагрузить плагин')
      }
    },

    async enablePlugin(plugin) {
      try {
        await axios.post(`/api/v1/plugins/${encodeURIComponent(plugin.key)}/enable`)
        this.notifyPositive(`Плагин ${plugin.name || plugin.key} включен`)
        await this.loadPlugins()
      } catch (e) {
        this.notifyNegative('Не удалось включить плагин')
      }
    },

    async disablePlugin(plugin) {
      try {
        await axios.post(`/api/v1/plugins/${encodeURIComponent(plugin.key)}/disable`)
        this.notifyPositive(`Плагин ${plugin.name || plugin.key} отключен`)
        await this.loadPlugins()
      } catch (e) {
        this.notifyNegative('Не удалось отключить плагин')
      }
    },

    confirmDeletePlugin(plugin) {
      const pluginName = plugin.name || plugin.key
      if (!window.confirm(`Удалить плагин "${pluginName}"?`)) {
        return
      }
      this.deletePlugin(plugin)
    },

    async deletePlugin(plugin) {
      try {
        await axios.delete(`/api/v1/plugins/${encodeURIComponent(plugin.key)}`)
        this.notifyPositive(`Плагин ${plugin.name || plugin.key} удален`)
        await this.loadPlugins()
      } catch (e) {
        this.notifyNegative(getErrorMessage(e, 'Не удалось удалить плагин'))
      }
    }
  }
}
