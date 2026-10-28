<template>
  <div
    class="flow-node"
    :class="[
      `flow-node--${node.type.toLowerCase()}`,
      { 'flow-node--selected': selected, 'flow-node--search-match': searchMatch }
    ]"
    :style="positionStyle"
    @click.stop="$emit('select', node.id)"
  >
    <button
      v-if="node.type !== 'EVENT'"
      type="button"
      class="flow-port flow-port--input"
      :class="{ 'flow-port--ready': pendingConnection && pendingConnection.source !== node.id }"
      :style="inputPortStyle(node)"
      @click.stop="$emit('complete-connection', node.id)"
    >
      <q-tooltip>Вход</q-tooltip>
    </button>

    <div class="flow-node-header" @mousedown.stop.prevent="$emit('start-drag', $event, node)">
      <q-icon :name="icon" :color="color" size="20px"/>
      <div class="flow-node-title ellipsis">{{ node.label || typeLabel }}</div>
      <q-btn flat round dense size="sm" icon="more_vert" @mousedown.stop @click.stop>
        <q-menu>
          <q-list dense style="min-width: 180px">
            <q-item clickable v-close-popup @click="$emit('duplicate', node)" :disable="node.type === 'EVENT'">
              <q-item-section avatar>
                <q-icon name="content_copy"/>
              </q-item-section>
              <q-item-section>Дублировать</q-item-section>
            </q-item>
            <q-item clickable v-close-popup @click="$emit('delete', node.id)" :disable="node.type === 'EVENT'">
              <q-item-section avatar>
                <q-icon name="delete" color="negative"/>
              </q-item-section>
              <q-item-section class="text-negative">Удалить</q-item-section>
            </q-item>
          </q-list>
        </q-menu>
      </q-btn>
    </div>

    <div class="flow-node-body">
      <div class="flow-node-kind">{{ typeLabel }}</div>
      <div class="flow-node-summary">{{ summary }}</div>
    </div>

    <template v-for="port in ports" :key="port.handle">
      <button
        type="button"
        class="flow-port flow-port--output"
        :class="[
          `flow-port--${port.handle}`,
          { 'flow-port--active': pendingConnection?.source === node.id && pendingConnection?.handle === port.handle }
        ]"
        :style="outputPortStyle(node, port)"
        @click.stop="$emit('begin-connection', node.id, port.handle)"
      >
        <q-tooltip>{{ port.tooltip }}</q-tooltip>
      </button>
      <div
        v-if="port.label"
        class="flow-port-label"
        :class="`flow-port-label--${port.handle}`"
        :style="outputLabelStyle(node, port)"
      >{{ port.label }}
      </div>
    </template>
  </div>
</template>

<script>
import { inputPortStyle, outputLabelStyle, outputPortStyle } from 'src/util/automationEditor/nodePorts'

// Карточка узла графа: заголовок с меню, краткое описание, входной и выходные порты.
export default {
  name: 'FlowNode',

  props: {
    node: {type: Object, required: true},
    selected: {type: Boolean, default: false},
    searchMatch: {type: Boolean, default: false},
    pendingConnection: {type: Object, default: null},
    positionStyle: {type: Object, default: () => ({})},
    icon: {type: String, default: ''},
    color: {type: String, default: ''},
    typeLabel: {type: String, default: ''},
    summary: {type: String, default: ''},
    ports: {type: Array, default: () => []}
  },

  emits: ['select', 'complete-connection', 'start-drag', 'duplicate', 'delete', 'begin-connection'],

  methods: {
    inputPortStyle(node) {
      return inputPortStyle(node)
    },

    outputPortStyle(node, port) {
      return outputPortStyle(node, port)
    },

    outputLabelStyle(node, port) {
      return outputLabelStyle(node, port)
    }
  }
}
</script>

<style scoped>
.flow-node--operation { border-top-color: #1976d2; }
.flow-node--parameters { border-top-color: #455a64; }
.flow-node--for_each, .flow-node--loop_end, .flow-node--loop_break { border-top-color: #00897b; }

.flow-node--search-match {
  outline: 3px solid #f4b740;
  outline-offset: 3px;
}

.flow-node {
  --flow-node-border-top: 4px;
  box-sizing: border-box;
  position: absolute;
  z-index: 2;
  border: 1px solid #cfd3dc;
  border-top: var(--flow-node-border-top) solid #8c94a3;
  border-radius: 9px;
  background: #ffffff;
  box-shadow: 0 5px 16px rgba(32, 37, 48, .09);
  transition: border-color .15s, box-shadow .15s;
}

.flow-node:hover {
  box-shadow: 0 8px 22px rgba(32, 37, 48, .14);
}

.flow-node.flow-node--selected {
  z-index: 3;
  border-color: var(--q-primary);
  outline: 3px solid var(--q-primary);
  outline-offset: 3px;
  box-shadow: 0 0 0 9px rgba(93, 61, 255, .16), 0 12px 30px rgba(32, 37, 48, .22);
}

.flow-node--selected .flow-node-header {
  background: #eee9ff;
}

.flow-node--event {
  border-top-color: #673ab7;
}

.flow-node--condition {
  border-top-color: #fb8c00;
}

.flow-node--switch {
  border-top-color: #ef6c00;
}

.flow-node--wait_until,
.flow-node--wait_event,
.flow-node--wait_task {
  border-top-color: #5e35b1;
}

.flow-node--approval {
  border-top-color: #6a1b9a;
}

.flow-node--subflow {
  border-top-color: #3949ab;
}

.flow-node--fork,
.flow-node--join {
  border-top-color: #d81b60;
}

.flow-node--http_request {
  border-top-color: #3f51b5;
}

.flow-node--set_variable,
.flow-node--expression,
.flow-node--counter {
  border-top-color: #546e7a;
}

.flow-node--error_handler,
.flow-node--retry {
  border-top-color: #d32f2f;
}

.flow-node--escalate {
  border-top-color: #f4511e;
}

.flow-node--create_task {
  border-top-color: #00897b;
}

.flow-node--notify {
  border-top-color: #0097a7;
}

.flow-node--business_hours {
  border-top-color: #ff8f00;
}

.flow-node--throttle,
.flow-node--deduplicate {
  border-top-color: #6d4c41;
}

.flow-node--action {
  border-top-color: #2e9b55;
}

.flow-node--delay {
  border-top-color: #1976d2;
}

.flow-node--note {
  border-top-color: #757575;
  background: #fffdf2;
}

.flow-node--end {
  border-top-color: #546e7a;
}

.flow-node-header {
  height: 42px;
  padding: 0 8px 0 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  border-bottom: 1px solid #eceef2;
  cursor: grab;
  user-select: none;
}

.flow-node-header:active {
  cursor: grabbing;
}

.flow-node-title {
  flex: 1;
  min-width: 0;
  font-size: 13px;
  font-weight: 700;
  color: #282d36;
}

.flow-node-body {
  padding: 14px;
}

.flow-node-kind {
  margin-bottom: 7px;
  color: #8a909c;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .05em;
}

.flow-node-summary {
  color: #4a505c;
  font-size: 12px;
  line-height: 1.45;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 4;
  overflow: hidden;
  word-break: break-word;
}

.flow-port {
  box-sizing: border-box;
  position: absolute;
  width: 14px;
  height: 14px;
  padding: 0;
  border: 2px solid #ffffff;
  border-radius: 50%;
  background: #8c94a3;
  box-shadow: 0 0 0 1px #8c94a3;
  cursor: crosshair;
  z-index: 4;
}

.flow-port--input {
  left: -1px;
  transform: translate(-50%, -50%);
}

.flow-port--output {
  right: -1px;
  transform: translate(50%, -50%);
}

.flow-port--true {
  background: #2e9b55;
  box-shadow: 0 0 0 1px #2e9b55;
}

.flow-port--false {
  background: #d34b4b;
  box-shadow: 0 0 0 1px #d34b4b;
}

.flow-port--active,
.flow-port--ready {
  transform: scale(1.35);
  box-shadow: 0 0 0 4px rgba(93, 61, 255, .18);
}

.flow-port-label {
  position: absolute;
  right: 12px;
  z-index: 3;
  font-size: 10px;
  font-weight: 800;
  pointer-events: none;
}

.flow-port-label--true {
  color: #2e9b55;
}

.flow-port-label--false {
  color: #d34b4b;
}
</style>
