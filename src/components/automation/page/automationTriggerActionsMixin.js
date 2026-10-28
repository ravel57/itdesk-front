import axios from 'axios'
import {triggerPayload, uniqueName} from 'src/util/automationTransfer'
import {placeAfter} from 'src/util/automationPage/automationTree'
import {downloadTriggerJson} from 'src/util/automationPage/exportFile'

// Действия над строками дерева: включение/выключение, клонирование, экспорт.
// Требует в компоненте: this.store, this.tree, this.rebuildTree(), this.saveLayout() (automationTreeMixin).
export default {
  data: () => ({
    togglingTriggerIds: []
  }),

  methods: {
    triggerTypeLabel(trigger) {
      return this.store.triggerTypeLabels[trigger.triggerType] || trigger.triggerType
    },

    // Копия встаёт сразу под оригиналом (в той же папке) и выключена, чтобы не сработать вместе с ним.
    async cloneTrigger(row) {
      try {
        const name = uniqueName(row.name, this.store.triggers.map(item => item.name))
        const response = await axios.post('/api/v1/trigger', triggerPayload(row, {name, automationRuleStatus: 'DISABLED'}))
        const clone = {...response.data, folderId: row.folderId ?? null}
        this.store.triggers.push(clone)
        this.rebuildTree()
        const removeFromRoot = () => {
          const index = this.tree.findIndex(item => item.type === 'trigger' && item.id === clone.id)
          return index >= 0 ? this.tree.splice(index, 1)[0] : null
        }
        const node = removeFromRoot() || {key: `trigger-${clone.id}`, type: 'trigger', id: clone.id}
        placeAfter(this.tree, row.id, node)
        await this.saveLayout()
        this.$q.notify({type: 'positive', message: `Создана копия «${name}» — она выключена`})
      } catch (e) {
        this.$q.notify({type: 'negative', message: e.response?.data?.message || e.message || 'Не удалось клонировать автоматизацию'})
      }
    },

    exportTrigger(row) {
      downloadTriggerJson(row)
    },

    async toggleTrigger(trigger, enabled) {
      if (this.togglingTriggerIds.includes(trigger.id)) return

      this.togglingTriggerIds.push(trigger.id)
      const payload = {
        ...trigger,
        automationRuleStatus: enabled ? 'ENABLED' : 'DISABLED'
      }

      try {
        const response = await axios.patch('/api/v1/trigger', payload)
        const index = this.store.triggers.findIndex(item => item.id === response.data.id)
        if (index >= 0) {
          this.store.triggers.splice(index, 1, response.data)
        }
      } catch (e) {
        this.$q.notify({
          message: e.response?.data?.message || e.message,
          type: 'negative'
        })
      } finally {
        this.togglingTriggerIds = this.togglingTriggerIds.filter(id => id !== trigger.id)
      }
    }
  }
}
