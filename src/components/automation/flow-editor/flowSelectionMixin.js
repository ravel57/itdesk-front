import { createEdge, createNode, deepClone, nextFlowId } from 'src/util/automationFlow'
import { operationConfig } from 'src/util/automationNodeCatalog'
import { defaultNodeConfig } from 'src/util/automationEditor/nodeDefaults'

// Выделение узлов/связей, создание/дублирование/удаление узлов, соединение портов
// и горячие клавиши редактора.
// Требует: data localFlow, operationCatalog; computed nodeMap; props triggerTypes/supportLines;
// методы commit, undo, redo (history), fitView (viewport), openGraphSearch (search).
export default {
  data() {
    return {
      selectedNodeId: null,
      selectedEdgeId: null,
      pendingConnection: null
    }
  },

  computed: {
    selectedNode() {
      return this.localFlow.nodes.find(node => node.id === this.selectedNodeId) || null
    }
  },

  methods: {
    addNode(item) {
      const type = typeof item === 'string' ? item : item.type
      const operation = item.operation && this.operationCatalog.find(o => o.id === item.operation)
      const viewport = this.$refs.viewport
      const x = viewport ? (viewport.scrollLeft + viewport.clientWidth / 2) / this.zoom + this.canvasLeft - 130 : 400
      const y = viewport ? (viewport.scrollTop + viewport.clientHeight / 2) / this.zoom + this.canvasTop - 80 : 250
      const config = operation ? operationConfig(operation) : defaultNodeConfig(type, {triggerTypes: this.triggerTypes, supportLines: this.supportLines})
      const node = createNode(type, x, y, config)
      if (operation) node.label = operation.label
      else if (item.label) node.label = item.label
      if (type === 'ACTION') node.config.manualScript = true
      this.localFlow.nodes.push(node)
      if (type === 'EVENT') this.localFlow.entryNodeId = node.id
      this.selectedNodeId = node.id
      this.selectedEdgeId = null
      this.commit()
    },

    duplicateNode(node) {
      if (!node || node.type === 'EVENT') return
      const copy = deepClone(node)
      copy.id = nextFlowId(node.type.toLowerCase())
      copy.label = `${node.label} — копия`
      copy.x += 50
      copy.y += 50
      if (Array.isArray(copy.config?.groups)) {
        copy.config.groups.forEach(group => {
          group.id = nextFlowId('group')
          ;(group.conditions || []).forEach(condition => {
            condition.id = nextFlowId('condition-item')
          })
        })
      }
      if (Array.isArray(copy.config?.actions)) {
        copy.config.actions.forEach(action => {
          action.id = nextFlowId('action-item')
        })
      }
      if (Array.isArray(copy.config?.cases)) {
        copy.config.cases.forEach(item => {
          item.id = nextFlowId('case')
        })
      }
      if (Array.isArray(copy.config?.branches)) {
        copy.config.branches.forEach(item => {
          item.id = nextFlowId('branch')
        })
      }
      this.localFlow.nodes.push(copy)
      this.selectedNodeId = copy.id
      this.commit()
    },

    deleteNode(nodeId) {
      const node = this.nodeMap.get(nodeId)
      if (!node || node.type === 'EVENT') return
      this.localFlow.nodes = this.localFlow.nodes.filter(item => item.id !== nodeId)
      this.localFlow.edges = this.localFlow.edges.filter(edge => edge.source !== nodeId && edge.target !== nodeId)
      this.selectedNodeId = null
      this.selectedEdgeId = null
      this.pendingConnection = null
      this.commit()
    },

    selectNode(nodeId) {
      this.selectedNodeId = nodeId
      this.selectedEdgeId = null
    },

    selectEdge(edgeId) {
      this.selectedEdgeId = edgeId
      this.selectedNodeId = null
    },

    clearSelection() {
      this.selectedNodeId = null
      this.selectedEdgeId = null
    },

    deleteSelection() {
      if (this.selectedNode) {
        this.deleteNode(this.selectedNode.id)
        return
      }
      if (this.selectedEdgeId) {
        this.localFlow.edges = this.localFlow.edges.filter(edge => edge.id !== this.selectedEdgeId)
        this.selectedEdgeId = null
        this.commit()
      }
    },

    beginConnection(source, handle) {
      this.pendingConnection = {source, handle}
      this.selectedNodeId = source
      this.selectedEdgeId = null
    },

    completeConnection(target) {
      if (!this.pendingConnection || this.pendingConnection.source === target) return
      const sourceNode = this.nodeMap.get(this.pendingConnection.source)
      const targetNode = this.nodeMap.get(target)
      if (!sourceNode || !targetNode || targetNode.type === 'EVENT') return

      this.localFlow.edges = this.localFlow.edges.filter(edge => !(
        edge.source === this.pendingConnection.source &&
        (edge.sourceHandle || 'next') === this.pendingConnection.handle
      ))
      this.localFlow.edges.push(createEdge(this.pendingConnection.source, target, this.pendingConnection.handle))
      this.pendingConnection = null
      this.selectedNodeId = target
      this.commit()
    },

    onEditorKeydown(event) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'f') {
        event.preventDefault()
        this.openGraphSearch()
        return
      }
      if (event.target.closest('.flow-graph-search')) return
      if (event.key === 'Escape') {
        this.pendingConnection = null
        return
      }
      if ((event.key === 'Delete' || event.key === 'Backspace') && !['INPUT', 'TEXTAREA'].includes(event.target?.tagName)) {
        event.preventDefault()
        this.deleteSelection()
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
        event.preventDefault()
        event.shiftKey ? this.redo() : this.undo()
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'y') {
        event.preventDefault()
        this.redo()
      }
    }
  }
}
