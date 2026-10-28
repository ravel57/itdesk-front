import { nodeSize } from 'src/util/automationEditor/nodeSizes'
import { nodeColor, nodeIcon, nodeSummary, nodeTypeLabel } from 'src/util/automationEditor/nodeVisuals'
import { edgeHandleLabel, edgeMarker, outputPorts } from 'src/util/automationEditor/nodePorts'

// Геометрия и отображение узлов/связей: размеры, стили, иконки, порты, точки подключения, пути связей.
// Требует: data localFlow, canvasLeft/canvasTop/canvasWidth/canvasHeight/zoom, operationCatalog, paletteGroups, eventLabels, nodeMap.
export default {
  computed: {
    renderedEdges() {
      return this.localFlow.edges.map(edge => {
        const source = this.nodeMap.get(edge.source)
        const target = this.nodeMap.get(edge.target)
        if (!source || !target) return null
        const start = this.outputPoint(source, edge.sourceHandle || 'next')
        const end = this.inputPoint(target)
        const distance = Math.max(80, Math.abs(end.x - start.x) * 0.45)
        const path = `M ${start.x} ${start.y} C ${start.x + distance} ${start.y}, ${end.x - distance} ${end.y}, ${end.x} ${end.y}`
        const handle = edge.sourceHandle || 'next'
        return {
          ...edge,
          handle,
          marker: edgeMarker(handle),
          label: edgeHandleLabel(source, handle),
          path,
          labelX: (start.x + end.x) / 2,
          labelY: (start.y + end.y) / 2 - 7
        }
      }).filter(Boolean)
    },

    surfaceStyle() {
      return {
        width: `${this.canvasWidth * this.zoom}px`,
        height: `${this.canvasHeight * this.zoom}px`
      }
    },

    zoomLayerStyle() {
      return {
        width: `${this.canvasWidth}px`,
        height: `${this.canvasHeight}px`,
        transform: `scale(${this.zoom})`,
        transformOrigin: '0 0'
      }
    }
  },

  methods: {
    nodeSize(node) {
      return nodeSize(node)
    },

    nodeStyle(node) {
      const size = this.nodeSize(node)
      return {
        left: `${node.x - this.canvasLeft}px`,
        top: `${node.y - this.canvasTop}px`,
        width: `${size.width}px`,
        height: `${size.height}px`
      }
    },

    nodeIcon(node) {
      return nodeIcon(node, this.operationCatalog)
    },

    nodeColor(node) {
      return nodeColor(node, this.operationCatalog, this.paletteGroups)
    },

    nodeTypeLabel(node) {
      return nodeTypeLabel(node, this.operationCatalog)
    },

    nodeSummary(node) {
      return nodeSummary(node, {operationCatalog: this.operationCatalog, eventLabels: this.eventLabels})
    },

    inputPoint(node) {
      const size = this.nodeSize(node)
      return {x: node.x - this.canvasLeft, y: node.y - this.canvasTop + size.height / 2}
    },

    outputPoint(node, handle) {
      const size = this.nodeSize(node)
      const port = this.outputPorts(node).find(item => item.handle === handle) || {yRatio: 0.5}
      return {x: node.x - this.canvasLeft + size.width, y: node.y - this.canvasTop + size.height * port.yRatio}
    },

    outputPorts(node) {
      return outputPorts(node)
    }
  }
}
