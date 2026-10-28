import { nextTick } from 'vue'
import { searchAutomationGraph } from 'src/util/automationGraphSearch'
import { GRAPH_SEARCH_CRITERIA } from 'src/util/automationEditor/editorConstants'

// Поиск по графу: состояние панели поиска, результаты и переход к найденному узлу/связи.
// Требует: data localFlow, selectedNodeId, selectedEdgeId, operationCatalog, canvasLeft/canvasTop/zoom;
// computed renderedEdges, nodeMap; ref viewport; методы focusNode (viewport), selectEdge (selection), outputPoint/inputPoint.
export default {
  data() {
    return {
      graphSearchVisible: false,
      graphSearchQuery: '',
      graphSearchCriterion: 'text',
      graphSearchCriteria: GRAPH_SEARCH_CRITERIA
    }
  },

  computed: {
    graphSearchResults() {
      return this.graphSearchVisible ? searchAutomationGraph({ ...this.localFlow, edges: this.renderedEdges }, this.graphSearchQuery, this.graphSearchCriterion, this.operationCatalog) : []
    },
    graphSearchIndex() {
      return this.graphSearchResults.findIndex(result => result.kind === 'node' ? result.id === this.selectedNodeId : result.id === this.selectedEdgeId)
    },
    graphSearchNodeIds() {
      return new Set(this.graphSearchResults.filter(result => result.kind === 'node').map(result => result.id))
    },
    graphSearchEdgeIds() {
      return new Set(this.graphSearchResults.filter(result => result.kind === 'edge').map(result => result.id))
    }
  },

  methods: {
    openGraphSearch() {
      this.graphSearchVisible = true
      nextTick(() => this.$refs.graphSearch?.focus())
    },
    navigateGraphSearch(direction) {
      const results = this.graphSearchResults
      if (!results.length) return
      const index = this.graphSearchIndex < 0 ? (direction > 0 ? 0 : results.length - 1)
        : (this.graphSearchIndex + direction + results.length) % results.length
      this.focusSearchResult(results[index])
    },
    focusSearchResult(result) {
      if (result.kind === 'node') {
        this.focusNode(result.id)
        return
      }
      const edge = this.localFlow.edges.find(edge => edge.id === result.id)
      const source = this.nodeMap.get(edge?.source)
      const target = this.nodeMap.get(edge?.target)
      const viewport = this.$refs.viewport
      if (!source || !target || !viewport) return
      this.selectEdge(edge.id)
      const start = this.outputPoint(source, edge.sourceHandle || 'next')
      const end = this.inputPoint(target)
      viewport.scrollLeft = Math.max(0, ((start.x + end.x) / 2 - this.canvasLeft) * this.zoom - viewport.clientWidth / 2)
      viewport.scrollTop = Math.max(0, ((start.y + end.y) / 2 - this.canvasTop) * this.zoom - viewport.clientHeight / 2)
    },
  }
}
