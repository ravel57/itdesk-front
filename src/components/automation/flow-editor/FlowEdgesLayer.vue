<template>
  <svg class="flow-edges" :width="width" :height="height">
    <defs>
      <marker id="flow-arrow-default" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto"
              markerUnits="strokeWidth">
        <path d="M0,0 L0,6 L9,3 z" fill="#8c94a3"/>
      </marker>
      <marker id="flow-arrow-true" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto"
              markerUnits="strokeWidth">
        <path d="M0,0 L0,6 L9,3 z" fill="#2e9b55"/>
      </marker>
      <marker id="flow-arrow-false" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto"
              markerUnits="strokeWidth">
        <path d="M0,0 L0,6 L9,3 z" fill="#d34b4b"/>
      </marker>
    </defs>

    <g v-for="edge in edges" :key="edge.id">
      <path
        class="flow-edge-hit"
        :d="edge.path"
        @click.stop="$emit('select-edge', edge.id)"
      />
      <template v-if="selectedEdgeId !== edge.id">
        <path
          class="flow-edge-line"
          :class="[
            `flow-edge-line--${edge.handle}`,
            { 'flow-edge-line--search-match': graphSearchEdgeIds.has(edge.id) }
          ]"
          :d="edge.path"
          :marker-end="`url(#flow-arrow-${edge.marker})`"
        />
        <text
          v-if="edge.label"
          class="flow-edge-label"
          :x="edge.labelX"
          :y="edge.labelY"
        >{{ edge.label }}
        </text>
      </template>
    </g>
  </svg>

  <!-- Выбранная связь рисуется отдельным слоем поверх узлов и остальных связей; клики проходят сквозь него -->
  <svg v-if="selectedEdge" class="flow-edges flow-edges--selected" :width="width" :height="height">
    <path
      class="flow-edge-line flow-edge-line--selected"
      :class="`flow-edge-line--${selectedEdge.handle}`"
      :d="selectedEdge.path"
      :marker-end="`url(#flow-arrow-${selectedEdge.marker})`"
    />
    <text
      v-if="selectedEdge.label"
      class="flow-edge-label"
      :x="selectedEdge.labelX"
      :y="selectedEdge.labelY"
    >{{ selectedEdge.label }}
    </text>
  </svg>
</template>

<script>
// SVG-слой связей графа (линии, стрелки, подписи, область клика).
export default {
  name: 'FlowEdgesLayer',

  props: {
    edges: {type: Array, default: () => []},
    width: {type: Number, required: true},
    height: {type: Number, required: true},
    selectedEdgeId: {type: [String, Number], default: null},
    graphSearchEdgeIds: {type: Set, default: () => new Set()}
  },

  emits: ['select-edge'],

  computed: {
    selectedEdge() {
      return this.edges.find(edge => edge.id === this.selectedEdgeId) || null
    }
  }
}
</script>

<style scoped>
.flow-edges {
  position: absolute;
  inset: 0;
  overflow: visible;
  z-index: 1;
}

.flow-edges--selected {
  z-index: 5;
  pointer-events: none;
}

.flow-edge-hit {
  fill: none;
  stroke: transparent;
  stroke-width: 16;
  pointer-events: stroke;
  cursor: pointer;
}

.flow-edge-line {
  fill: none;
  stroke: var(--app-text-muted, #8c94a3);
  stroke-width: 2.2;
  pointer-events: none;
}

.flow-edge-line--true {
  stroke: var(--app-success-text, #2e9b55);
}

.flow-edge-line--false {
  stroke: var(--app-danger-text, #d34b4b);
}

.flow-edge-line--selected {
  stroke-width: 4;
  filter: drop-shadow(0 0 3px rgba(82, 52, 255, .45));
}

.flow-edge-line--search-match {
  stroke: var(--app-warning-text, #c58a12);
  stroke-width: 4;
}

.flow-edge-label {
  fill: var(--app-text-muted, #616776);
  font-size: 11px;
  font-weight: 700;
  text-anchor: middle;
  paint-order: stroke;
  stroke: #f7f8fb;
  stroke-width: 5px;
  stroke-linejoin: round;
  pointer-events: none;
}
</style>
