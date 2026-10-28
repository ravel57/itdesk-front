import { deepClone, normalizeWorkflow } from 'src/util/automationFlow'

// История изменений (undo/redo) и фиксация изменений графа наружу (update:modelValue).
// Требует: data localFlow; метод expandCanvasForNode (viewport).
export default {
  data() {
    return {
      history: [],
      historyIndex: -1,
      syncingExternal: false
    }
  },

  computed: {
    canUndo() {
      return this.historyIndex > 0
    },

    canRedo() {
      return this.historyIndex >= 0 && this.historyIndex < this.history.length - 1
    }
  },

  methods: {
    commit(recordHistory = true) {
      this.localFlow = normalizeWorkflow(this.localFlow)
      this.localFlow.nodes.forEach(this.expandCanvasForNode)
      if (recordHistory) this.pushHistory()
      this.$emit('update:modelValue', deepClone(this.localFlow))
    },

    resetHistory() {
      this.localFlow.nodes.forEach(this.expandCanvasForNode)
      this.history = [JSON.stringify(this.localFlow)]
      this.historyIndex = 0
    },

    pushHistory() {
      const snapshot = JSON.stringify(this.localFlow)
      if (this.history[this.historyIndex] === snapshot) return
      this.history = this.history.slice(0, this.historyIndex + 1)
      this.history.push(snapshot)
      if (this.history.length > 80) this.history.shift()
      this.historyIndex = this.history.length - 1
    },

    undo() {
      if (!this.canUndo) return
      this.historyIndex -= 1
      this.localFlow = JSON.parse(this.history[this.historyIndex])
      this.localFlow.nodes.forEach(this.expandCanvasForNode)
      this.$emit('update:modelValue', deepClone(this.localFlow))
    },

    redo() {
      if (!this.canRedo) return
      this.historyIndex += 1
      this.localFlow = JSON.parse(this.history[this.historyIndex])
      this.localFlow.nodes.forEach(this.expandCanvasForNode)
      this.$emit('update:modelValue', deepClone(this.localFlow))
    }
  }
}
