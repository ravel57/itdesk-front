<template>
  <div class="flow-editor" tabindex="0" @keydown="onEditorKeydown">
    <flow-toolbar
      :palette-visible="paletteVisible"
      :can-undo="canUndo"
      :can-redo="canRedo"
      :zoom="zoom"
      :graph-search-visible="graphSearchVisible"
      :can-delete="Boolean(selectedNode || selectedEdgeId)"
      :validation="validation"
      :pending-connection="pendingConnection"
      @toggle-palette="paletteVisible = !paletteVisible"
      @undo="undo"
      @redo="redo"
      @change-zoom="changeZoom"
      @fit-view="fitView"
      @open-graph-search="openGraphSearch"
      @delete-selection="deleteSelection"
      @cancel-connection="pendingConnection = null"
    />

    <div class="flow-main" :class="{ 'flow-main--no-palette': !paletteVisible, 'flow-main--no-inspector': inspectorPoppedOut }">
      <flow-palette
        v-if="paletteVisible"
        v-model:search="paletteSearch"
        :expanded-palette-groups="expandedPaletteGroups"
        :visible-palette-groups="visiblePaletteGroups"
        :operation-catalog-error="operationCatalogError"
        :has-event-node="hasEventNode"
        @toggle-group="togglePaletteGroup"
        @add-node="addNode"
        @reload-catalog="loadOperationCatalog"
      />

      <section class="flow-workspace">
        <flow-graph-search
          v-if="graphSearchVisible"
          ref="graphSearch"
          v-model:graph-search-query="graphSearchQuery"
          v-model:graph-search-criterion="graphSearchCriterion"
          :graph-search-criteria="graphSearchCriteria"
          :graph-search-results="graphSearchResults"
          :graph-search-index="graphSearchIndex"
          @navigate="navigateGraphSearch"
          @focus-result="focusSearchResult"
          @close="graphSearchVisible = false"
        />
        <flow-section-navigation
          v-if="graphSections.length"
          v-model="orderedSections"
          @focus-section="focusSection"
        />
        <div
          ref="viewport"
          class="flow-viewport"
          :class="{ 'flow-viewport--connecting': pendingConnection }"
          @mousedown="onCanvasMouseDown"
          @click="onCanvasClick"
        >
          <div class="flow-surface" :style="surfaceStyle">
            <div class="flow-zoom-layer" :style="zoomLayerStyle">
              <flow-edges-layer
                :edges="renderedEdges"
                :width="canvasWidth"
                :height="canvasHeight"
                :selected-edge-id="selectedEdgeId"
                :graph-search-edge-ids="graphSearchEdgeIds"
                @select-edge="selectEdge"
              />

              <flow-node
                v-for="node in localFlow.nodes"
                :key="node.id"
                :node="node"
                :selected="selectedNodeId === node.id"
                :search-match="graphSearchNodeIds.has(node.id)"
                :pending-connection="pendingConnection"
                :position-style="nodeStyle(node)"
                :icon="nodeIcon(node)"
                :color="nodeColor(node)"
                :type-label="nodeTypeLabel(node)"
                :summary="nodeSummary(node)"
                :ports="outputPorts(node)"
                @select="selectNode"
                @complete-connection="completeConnection"
                @start-drag="startNodeDrag"
                @duplicate="duplicateNode"
                @delete="deleteNode"
                @begin-connection="beginConnection"
              />
            </div>
          </div>
        </div>

        <div class="flow-statusbar">
          <span>Узлов: {{ localFlow.nodes.length }}</span>
          <span>Связей: {{ localFlow.edges.length }}</span>
          <span v-if="pendingConnection" class="text-primary">
            Выберите вход следующего узла
          </span>
          <q-space/>
          <span>Колесо мыши — прокрутка, Ctrl + колесо — масштаб</span>
        </div>
      </section>

      <teleport :to="inspectorTeleportTarget" :disabled="!inspectorPoppedOut">
        <flow-inspector
          v-model:popped-out="inspectorPoppedOut"
          :node="selectedNode"
          :local-flow="localFlow"
          :graph-sections="graphSections"
          :validation="validation"
          :test-trace="testTrace"
          :expression-variables="expressionVariables"
          :operation-catalog="operationCatalog"
          :operation-catalog-error="operationCatalogError"
          :trigger-types="triggerTypes"
          :trigger-type-options="triggerTypeOptions"
          :triggers="triggers"
          :task-types="taskTypes"
          :services="services"
          :priorities="priorities"
          :statuses="statuses"
          :support-lines="supportLines"
          :users="users"
          :organizations="organizations"
          :tags="tags"
          @change="commit"
          @duplicate-node="duplicateNode"
          @delete-node="deleteNode"
        />
      </teleport>
    </div>
  </div>
</template>

<script>
import {nextTick} from 'vue'
import {normalizeWorkflow} from 'src/util/automationFlow'
import FlowToolbar from './flow-editor/FlowToolbar.vue'
import FlowPalette from './flow-editor/FlowPalette.vue'
import FlowGraphSearch from './flow-editor/FlowGraphSearch.vue'
import FlowSectionNavigation from './flow-editor/FlowSectionNavigation.vue'
import FlowEdgesLayer from './flow-editor/FlowEdgesLayer.vue'
import FlowNode from './flow-editor/FlowNode.vue'
import FlowInspector from './flow-editor/FlowInspector.vue'
import flowCatalogMixin from './flow-editor/flowCatalogMixin'
import flowNodeViewMixin from './flow-editor/flowNodeViewMixin'
import flowSelectionMixin from './flow-editor/flowSelectionMixin'
import flowViewportMixin from './flow-editor/flowViewportMixin'
import flowHistoryMixin from './flow-editor/flowHistoryMixin'
import flowValidationMixin from './flow-editor/flowValidationMixin'
import flowGraphSearchMixin from './flow-editor/flowGraphSearchMixin'

// Визуальный редактор графа автоматизации. Публичный API: v-model (modelValue), событие validation-change
// и метод focusNode(id) (вызывается снаружи через ref).
// Состояние и логика разнесены по миксинам (./flow-editor/*Mixin.js), разметка — по компонентам
// (./flow-editor/Flow*.vue), чистые функции и справочники — в src/util/automationEditor.
export default {
  name: 'AutomationFlowEditor',

  components: {
    FlowToolbar,
    FlowPalette,
    FlowGraphSearch,
    FlowSectionNavigation,
    FlowEdgesLayer,
    FlowNode,
    FlowInspector
  },

  mixins: [
    flowCatalogMixin,
    flowNodeViewMixin,
    flowSelectionMixin,
    flowViewportMixin,
    flowHistoryMixin,
    flowValidationMixin,
    flowGraphSearchMixin
  ],

  props: {
    modelValue: {type: Object, required: true},
    testTrace: {type: Array, default: () => []},
    // [{ value, label, group }] — события с названиями из GET /api/v1/trigger-types/options
    triggerTypes: {type: Array, default: () => []},
    triggers: {type: Array, default: () => []},
    taskTypes: {type: Array, default: () => []},
    services: {type: Array, default: () => []},
    priorities: {type: Array, default: () => []},
    statuses: {type: Array, default: () => []},
    supportLines: {type: Array, default: () => []},
    users: {type: Array, default: () => []},
    organizations: {type: Array, default: () => []},
    tags: {type: Array, default: () => []}
  },

  emits: ['update:modelValue', 'validation-change'],

  data() {
    return {
      localFlow: normalizeWorkflow(this.modelValue),
      paletteVisible: true,
      inspectorPoppedOut: false,
      // Teleporting to 'body' would escape the host q-dialog's focus trap, which fights
      // focus back inside the dialog and makes popped-out fields unclickable. Teleporting
      // inside the dialog's own DOM keeps the trap happy.
      inspectorTeleportTarget: 'body'
    }
  },

  watch: {
    modelValue: {
      deep: true,
      handler(value) {
        const incoming = JSON.stringify(normalizeWorkflow(value))
        const current = JSON.stringify(this.localFlow)
        if (incoming !== current) {
          this.syncingExternal = true
          this.localFlow = normalizeWorkflow(value)
          this.resetHistory()
          this.syncingExternal = false
        }
      }
    }
  },

  mounted() {
    this.resetHistory()
    this.loadOperationCatalog()
    this.$refs.viewport?.addEventListener('wheel', this.onWheel, {passive: false})
    window.addEventListener('mousemove', this.onGlobalMouseMove)
    window.addEventListener('mouseup', this.onGlobalMouseUp)
    nextTick(() => this.fitView())
    this.inspectorTeleportTarget = this.$el.closest('.q-dialog') || 'body'
  },

  beforeUnmount() {
    cancelAnimationFrame(this.dragFrame)
    this.$refs.viewport?.removeEventListener('wheel', this.onWheel)
    window.removeEventListener('mousemove', this.onGlobalMouseMove)
    window.removeEventListener('mouseup', this.onGlobalMouseUp)
  },
}
</script>

<style scoped>
.flow-editor {
  min-height: 490px;
  border: 1px solid var(--app-border, #d9dce3);
  border-radius: 10px;
  overflow: hidden;
  background: var(--app-surface, #f7f8fb);
  outline: none;
}

.flow-main {
  display: grid;
  grid-template-columns: 245px minmax(500px, 1fr) 360px;
  grid-template-rows: minmax(0, 1fr);
  height: calc(100vh - 235px);
  min-height: 440px;
}

.flow-main--no-palette {
  grid-template-columns: minmax(500px, 1fr) 360px;
}

.flow-main--no-inspector {
  grid-template-columns: 245px minmax(500px, 1fr);
}

.flow-main--no-palette.flow-main--no-inspector {
  grid-template-columns: minmax(500px, 1fr);
}

.flow-workspace {
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  background: var(--app-surface-muted, #eef0f5);
}

.flow-viewport {
  flex: 1;
  min-height: 0;
  overscroll-behavior: contain;
  overflow: auto;
  position: relative;
  background-color: var(--app-surface, #f7f8fb);
  background-image: linear-gradient(#e4e7ed 1px, transparent 1px),
  linear-gradient(90deg, #e4e7ed 1px, transparent 1px),
  linear-gradient(#eef0f4 1px, transparent 1px),
  linear-gradient(90deg, #eef0f4 1px, transparent 1px);
  background-size: 100px 100px, 100px 100px, 20px 20px, 20px 20px;
  cursor: default;
}

.flow-viewport--connecting {
  cursor: crosshair;
}

.flow-surface {
  position: relative;
  overflow: hidden;
}

.flow-zoom-layer {
  position: absolute;
  left: 0;
  top: 0;
}

.flow-statusbar {
  min-height: 30px;
  padding: 5px 10px;
  display: flex;
  align-items: center;
  gap: 18px;
  border-top: 1px solid var(--app-border, #dfe2e8);
  background: var(--app-surface, #ffffff);
  color: var(--app-text-muted, #7a808c);
  font-size: 11px;
}

@media (max-width: 1250px) {
  .flow-main {
    grid-template-columns: 220px minmax(460px, 1fr) 320px;
  }
}

@media (max-width: 900px) {
  .flow-main {
    grid-template-columns: 1fr;
    grid-template-rows: auto;
    height: auto;
  }

  .flow-workspace {
    min-height: 600px;
  }
}
</style>
