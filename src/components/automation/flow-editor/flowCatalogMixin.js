import axios from 'axios'
import { buildAutomationPalette } from 'src/util/automationNodeCatalog'
import { analyzeAutomationVariables } from 'src/util/automationVariableTypes'

// Каталог операций (GET /api/v1/automation/operations), группы палитры и производные справочники графа.
// Требует: props triggerTypes, data localFlow, selectedNodeId.
export default {
  data() {
    return {
      operationCatalog: [],
      operationCatalogError: '',
      paletteSearch: '',
      expandedPaletteGroups: [] // 'structure', 'messages', 'tasks'
    }
  },

  computed: {
    paletteGroups() {
      return buildAutomationPalette(this.operationCatalog)
    },

    visiblePaletteGroups() {
      const term = (this.paletteSearch || '').toLocaleLowerCase('ru').trim()
      return this.paletteGroups.map(group => ({
        ...group,
        items: group.items.filter(item => !term || (group.label + ' ' + item.label).toLocaleLowerCase('ru').includes(term))
      })).filter(group => group.items.length)
    },

    expressionVariables() {
      return analyzeAutomationVariables(this.localFlow, this.operationCatalog, this.selectedNodeId)
    },

    hasEventNode() {
      return this.localFlow.nodes.some(node => node.type === 'EVENT')
    },

    triggerTypeOptions() {
      return this.triggerTypes || []
    },

    eventLabels() {
      return Object.fromEntries(this.triggerTypeOptions.map(option => [option.value, option.label]))
    },

    nodeMap() {
      return new Map(this.localFlow.nodes.map(node => [node.id, node]))
    }
  },

  methods: {
    togglePaletteGroup(group) {
      this.expandedPaletteGroups = this.expandedPaletteGroups.includes(group.id)
        ? this.expandedPaletteGroups.filter(id => id !== group.id) : [...this.expandedPaletteGroups, group.id]
    },

    async loadOperationCatalog() {
      try { const {data} = await axios.get('/api/v1/automation/operations'); this.operationCatalog = data; this.operationCatalogError = '' } catch (error) { this.operationCatalogError = 'Не удалось загрузить каталог операций. Проверьте соединение и обновите редактор.' }
    }
  }
}
