import { nextTick } from 'vue'

// Холст: зум, прокрутка, панорамирование, перетаскивание узлов, границы холста, подгонка и авто-раскладка,
// переход к узлу/этапу.
// Требует: data localFlow, selectedNodeId, selectedEdgeId; ref viewport; computed nodeMap;
// методы nodeSize (node-view), commit (history), clearSelection/selectNode (selection).
export default {
  data() {
    return {
      zoom: 0.9,
      // Canvas bounds can grow into negative graph coordinates without moving the nodes.
      canvasLeft: 0,
      canvasTop: 0,
      canvasWidth: 2200,
      canvasHeight: 1300,
      dragState: null,
      dragFrame: null,
      panState: null,
      panMoved: false
    }
  },

  computed: {
    graphSections() {
      // Default order is "first node to use this section" — not meaningful to a reader,
      // so a manual drag order (localFlow.sectionOrder) overrides it; anything new or not
      // yet dragged falls back to that natural first-appearance order, appended at the end.
      const present = [...new Set(this.localFlow.nodes.map(n => n.config?.section).filter(Boolean))]
      const presentSet = new Set(present)
      const ordered = (this.localFlow.sectionOrder || []).filter(section => presentSet.has(section))
      const orderedSet = new Set(ordered)
      return [...ordered, ...present.filter(section => !orderedSet.has(section))]
    },

    orderedSections: {
      get() { return this.graphSections },
      set(sections) {
        this.localFlow.sectionOrder = sections
        this.commit()
      }
    }
  },

  methods: {
    onCanvasMouseDown(event) {
      // Колёсико двигает холст и над узлами/связями; заодно подавляется браузерная автопрокрутка
      if (event.button !== 1 && event.target.closest('.flow-node, .flow-edge-hit')) return
      this.panMoved = false
      this.startPan(event)
    },
    onCanvasClick(event) {
      if (event.target.closest('.flow-node, .flow-edge-hit') || this.panMoved) return
      this.clearSelection()
    },

    focusNode(id) {
      const node = this.localFlow.nodes.find(n => n.id === id)
      if (!node || !this.$refs.viewport) return
      this.selectNode(id)
      this.$refs.viewport.scrollLeft = Math.max(0, (node.x - this.canvasLeft - 50) * this.zoom)
      this.$refs.viewport.scrollTop = Math.max(0, (node.y - this.canvasTop - 50) * this.zoom)
    },
    focusSection(section) {
      const nodes = this.localFlow.nodes.filter(n => n.config?.section === section)
      if (!nodes.length) return
      const viewport = this.$refs.viewport
      if (!viewport) return
      this.selectedNodeId = nodes[0].id
      viewport.scrollLeft = Math.max(0, (Math.min(...nodes.map(n => n.x)) - this.canvasLeft - 40) * this.zoom)
      viewport.scrollTop = Math.max(0, (Math.min(...nodes.map(n => n.y)) - this.canvasTop - 40) * this.zoom)
    },

    startNodeDrag(event, node) {
      if (event.button === 1) {
        // заголовок узла гасит всплытие mousedown, поэтому панорамирование колёсиком запускаем здесь
        this.panMoved = false
        this.startPan(event)
        return
      }
      if (event.button !== 0) return
      const viewport = this.$refs.viewport
      this.dragState = {
        nodeId: node.id,
        startMouseX: event.clientX,
        startMouseY: event.clientY,
        mouseX: event.clientX,
        mouseY: event.clientY,
        startScrollLeft: viewport.scrollLeft,
        startScrollTop: viewport.scrollTop,
        startX: node.x,
        startY: node.y,
        before: JSON.stringify(this.localFlow)
      }
      this.selectedNodeId = node.id
      this.selectedEdgeId = null
      this.dragFrame = requestAnimationFrame(this.scrollWhileDragging)
    },

    startPan(event) {
      if (event.button !== 1 && !event.shiftKey) return
      const viewport = this.$refs.viewport
      if (!viewport) return
      event.preventDefault()
      this.panState = {
        startMouseX: event.clientX,
        startMouseY: event.clientY,
        startScrollLeft: viewport.scrollLeft,
        startScrollTop: viewport.scrollTop
      }
    },

    onGlobalMouseMove(event) {
      if (this.dragState) {
        this.dragState.mouseX = event.clientX
        this.dragState.mouseY = event.clientY
        this.updateDraggedNode()
      }
      if (this.panState) {
        if (Math.abs(event.clientX - this.panState.startMouseX) + Math.abs(event.clientY - this.panState.startMouseY) > 3) this.panMoved = true
        const viewport = this.$refs.viewport
        if (!viewport) return
        viewport.scrollLeft = this.panState.startScrollLeft - (event.clientX - this.panState.startMouseX)
        viewport.scrollTop = this.panState.startScrollTop - (event.clientY - this.panState.startMouseY)
      }
    },

    updateDraggedNode() {
      const drag = this.dragState
      const viewport = this.$refs.viewport
      if (!drag || !viewport) return
      const node = this.nodeMap.get(drag.nodeId)
      if (!node) return
      node.x = drag.startX + (drag.mouseX - drag.startMouseX + viewport.scrollLeft - drag.startScrollLeft) / this.zoom
      node.y = drag.startY + (drag.mouseY - drag.startMouseY + viewport.scrollTop - drag.startScrollTop) / this.zoom
      this.expandCanvasForNode(node)
    },

    scrollWhileDragging(time) {
      const drag = this.dragState
      const viewport = this.$refs.viewport
      if (!drag || !viewport) return
      const rect = viewport.getBoundingClientRect()
      const edgeSpeed = (position, start, end) => {
        if (position < start + 60) return -Math.min(1, (start + 60 - position) / 60)
        if (position > end - 60) return Math.min(1, (position - end + 60) / 60)
        return 0
      }
      const elapsed = Math.min(32, drag.lastFrameTime ? time - drag.lastFrameTime : 16)
      drag.lastFrameTime = time
      viewport.scrollLeft += edgeSpeed(drag.mouseX, rect.left, rect.right) * elapsed * 0.7
      viewport.scrollTop += edgeSpeed(drag.mouseY, rect.top, rect.bottom) * elapsed * 0.7
      this.updateDraggedNode()
      this.dragFrame = requestAnimationFrame(this.scrollWhileDragging)
    },

    onGlobalMouseUp() {
      cancelAnimationFrame(this.dragFrame)
      this.dragFrame = null
      if (this.dragState) {
        const changed = this.dragState.before !== JSON.stringify(this.localFlow)
        this.dragState = null
        if (changed) this.commit()
      }
      this.panState = null
    },

    expandCanvasForNode(node) {
      const size = this.nodeSize(node)
      const shiftX = node.x < this.canvasLeft + 100 ? Math.ceil((this.canvasLeft + 500 - node.x) / 500) * 500 : 0
      const shiftY = node.y < this.canvasTop + 100 ? Math.ceil((this.canvasTop + 400 - node.y) / 400) * 400 : 0
      this.canvasLeft -= shiftX
      this.canvasTop -= shiftY
      this.canvasWidth = Math.max(this.canvasWidth + shiftX, Math.ceil(node.x - this.canvasLeft + size.width + 500))
      this.canvasHeight = Math.max(this.canvasHeight + shiftY, Math.ceil(node.y - this.canvasTop + size.height + 400))
      if (!shiftX && !shiftY) return
      const viewport = this.$refs.viewport
      const drag = this.dragState
      const offsetX = shiftX * this.zoom
      const offsetY = shiftY * this.zoom
      nextTick(() => {
        if (!viewport) return
        viewport.scrollLeft += offsetX
        viewport.scrollTop += offsetY
        if (drag && this.dragState === drag) {
          drag.startScrollLeft += offsetX
          drag.startScrollTop += offsetY
        }
      })
    },

    onWheel(event) {
      if (!event.ctrlKey) return
      event.preventDefault()
      this.changeZoom(event.deltaY > 0 ? -0.1 : 0.1)
    },

    changeZoom(delta) {
      const viewport = this.$refs.viewport
      const centerX = viewport ? (viewport.scrollLeft + viewport.clientWidth / 2) / this.zoom : 0
      const centerY = viewport ? (viewport.scrollTop + viewport.clientHeight / 2) / this.zoom : 0
      this.zoom = Math.min(1.6, Math.max(0.5, Math.round((this.zoom + delta) * 10) / 10))
      nextTick(() => {
        if (!viewport) return
        viewport.scrollLeft = centerX * this.zoom - viewport.clientWidth / 2
        viewport.scrollTop = centerY * this.zoom - viewport.clientHeight / 2
      })
    },

    fitView() {
      if (!this.localFlow.nodes.length || !this.$refs.viewport) return
      const bounds = this.localFlow.nodes.reduce((acc, node) => {
        const size = this.nodeSize(node)
        acc.minX = Math.min(acc.minX, node.x)
        acc.minY = Math.min(acc.minY, node.y)
        acc.maxX = Math.max(acc.maxX, node.x + size.width)
        acc.maxY = Math.max(acc.maxY, node.y + size.height)
        return acc
      }, {minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity})
      const viewport = this.$refs.viewport
      const graphWidth = bounds.maxX - bounds.minX + 140
      const graphHeight = bounds.maxY - bounds.minY + 140
      this.zoom = Math.min(1.2, Math.max(0.5, Math.min(viewport.clientWidth / graphWidth, viewport.clientHeight / graphHeight)))
      nextTick(() => {
        viewport.scrollLeft = Math.max(0, (bounds.minX - this.canvasLeft - 70) * this.zoom)
        viewport.scrollTop = Math.max(0, (bounds.minY - this.canvasTop - 70) * this.zoom)
      })
    },

    autoLayout() {
      if (!this.localFlow.nodes.length) return
      const adjacency = new Map()
      const incoming = new Map(this.localFlow.nodes.map(node => [node.id, 0]))
      this.localFlow.edges.forEach(edge => {
        if (!adjacency.has(edge.source)) adjacency.set(edge.source, [])
        adjacency.get(edge.source).push(edge.target)
        incoming.set(edge.target, (incoming.get(edge.target) || 0) + 1)
      })

      const entryId = this.localFlow.entryNodeId || this.localFlow.nodes.find(node => node.type === 'EVENT')?.id
      const levelById = new Map()
      const queue = entryId ? [entryId] : []
      if (entryId) levelById.set(entryId, 0)
      while (queue.length) {
        const current = queue.shift()
        const level = levelById.get(current) || 0
        for (const target of adjacency.get(current) || []) {
          const nextLevel = Math.max(levelById.get(target) ?? 0, level + 1)
          if (!levelById.has(target) || nextLevel > levelById.get(target)) {
            levelById.set(target, nextLevel)
            queue.push(target)
          }
        }
      }

      let fallbackLevel = Math.max(0, ...levelById.values()) + 1
      this.localFlow.nodes.forEach(node => {
        if (!levelById.has(node.id)) levelById.set(node.id, fallbackLevel++)
      })

      const levels = new Map()
      this.localFlow.nodes.forEach(node => {
        const level = levelById.get(node.id) || 0
        if (!levels.has(level)) levels.set(level, [])
        levels.get(level).push(node)
      })

      for (const [level, nodes] of [...levels.entries()].sort((a, b) => a[0] - b[0])) {
        nodes.sort((left, right) => {
          if (left.type === 'EVENT') return -1
          if (right.type === 'EVENT') return 1
          return Number(left.y || 0) - Number(right.y || 0)
        })
        nodes.forEach((node, index) => {
          node.x = 80 + level * 390
          node.y = 80 + index * 240
          this.expandCanvasForNode(node)
        })
      }

      this.commit()
      nextTick(() => this.fitView())
    }
  }
}
