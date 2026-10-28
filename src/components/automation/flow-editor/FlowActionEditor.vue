<template>
  <div class="row items-center justify-between q-mt-md">
    <div class="text-subtitle2">Последовательность действий</div>
    <q-toggle
      v-model="selectedNode.config.manualScript"
      dense
      label="Скрипт"
      @update:model-value="onActionModeChanged(selectedNode)"
    />
  </div>

  <automation-expression-input
    v-if="selectedNode.config.manualScript"
    v-model="selectedNode.config.actionScript"
    :variables="expressionVariables"
    suggestion-mode="ACTION"
    outlined
    dense
    type="textarea"
    rows="6"
    label="Сценарий действий *"
    hint="Разделяйте команды новой строкой или ;. Подсказку можно вставить клавишей Tab."
    class="q-mt-sm"
    @change="commit"
  />

  <template v-else>
    <div v-for="(action, actionIndex) in nodeActions(selectedNode)" :key="action.id"
         class="flow-action-item q-mt-sm app-flow-action-item">
      <q-select
        v-model="action.type"
        outlined
        dense
        label="Действие *"
        :options="actionTypes"
        emit-value
        map-options
        @update:model-value="resetAction(action, selectedNode)"
      />

      <q-select
        v-if="actionValueOptions(action).length"
        v-model="action.value"
        outlined
        dense
        use-input
        label="Значение *"
        :options="actionValueOptions(action)"
        emit-value
        map-options
        @update:model-value="onActionsChanged(selectedNode)"
      />
      <automation-expression-input
        v-else-if="actionNeedsValue(action) && actionInputType(action) !== 'number'"
        v-model="action.value"
        :variables="expressionVariables"
        outlined
        dense
        autogrow
        type="textarea"
        :label="actionValueLabel(action)"
        hint="В шаблонах {{ ... }} доступны поля, свойства и методы движка"
        @change="onActionsChanged(selectedNode)"
      />
      <q-input
        v-else-if="actionNeedsValue(action)"
        v-model="action.value"
        outlined
        dense
        :type="actionInputType(action)"
        :label="actionValueLabel(action)"
        @change="onActionsChanged(selectedNode)"
      />

      <div class="row justify-between items-center">
        <div class="row q-gutter-xs">
          <q-btn flat round dense size="sm" icon="arrow_upward" :disable="actionIndex === 0"
                 @click="moveAction(selectedNode, actionIndex, -1)"/>
          <q-btn flat round dense size="sm" icon="arrow_downward"
                 :disable="actionIndex === nodeActions(selectedNode).length - 1"
                 @click="moveAction(selectedNode, actionIndex, 1)"/>
        </div>
        <q-btn
          unelevated
          color="negative"
          icon="delete"
          dense
          size="sm"
          label="Удалить"
          @click="removeAction(selectedNode, actionIndex)"
        />
      </div>
    </div>

    <q-btn
      outline
      dense
      icon="add"
      color="primary"
      label="Добавить действие"
      class="q-mt-md"
      @click="addAction(selectedNode)"
    />

    <q-input
      :model-value="selectedNode.config.actionScript"
      readonly
      outlined
      dense
      autogrow
      type="textarea"
      label="Сформированный сценарий"
      class="q-mt-md"
    />
  </template>

  <q-toggle
    v-model="selectedNode.config.continueOnError"
    label="Продолжить цепочку при ошибке этого узла"
    color="warning"
    class="q-mt-md"
    @update:model-value="commit"
  />
</template>

<script>
import {nextFlowId} from 'src/util/automationFlow'
import { ACTION_TYPES } from 'src/util/automationEditor/editorConstants'
import { actionNeedsValue, compileAction } from 'src/util/automationEditor/scriptCompile'
import { toOptions, userOptions } from 'src/util/automationEditor/entityOptions'
import AutomationExpressionInput from 'src/components/automation/AutomationExpressionInput.vue'

// Конструктор последовательности действий узла ACTION либо ручной скрипт.
// Меняет node.config прямо в объекте графа редактора (как и остальные инспекторы узлов).
export default {
  name: 'FlowActionEditor',

  components: {AutomationExpressionInput},

  props: {
    node: {type: Object, required: true},
    expressionVariables: {type: Array, default: () => []},
    supportLines: {type: Array, default: () => []},
    priorities: {type: Array, default: () => []},
    statuses: {type: Array, default: () => []},
    users: {type: Array, default: () => []},
    tags: {type: Array, default: () => []}
  },

  emits: ['change'],

  data() {
    return {
      actionTypes: ACTION_TYPES
    }
  },

  computed: {
    selectedNode() {
      return this.node
    }
  },

  methods: {
    commit(...args) {
      this.$emit('change', ...args)
    },

    nodeActions(node) {
      if (!Array.isArray(node.config.actions)) node.config.actions = []
      return node.config.actions
    },

    addAction(node) {
      this.nodeActions(node).push({id: nextFlowId('action-item'), type: 'ASSIGN_LINE', value: null})
      this.onActionsChanged(node)
    },

    removeAction(node, index) {
      this.nodeActions(node).splice(index, 1)
      this.onActionsChanged(node)
    },

    moveAction(node, index, direction) {
      const actions = this.nodeActions(node)
      const target = index + direction
      if (target < 0 || target >= actions.length) return
      const [item] = actions.splice(index, 1)
      actions.splice(target, 0, item)
      this.onActionsChanged(node)
    },

    resetAction(action, node) {
      action.value = null
      this.onActionsChanged(node)
    },

    onActionModeChanged(node) {
      if (!node.config.manualScript) this.syncActionScript(node)
      this.commit()
    },

    onActionsChanged(node) {
      this.syncActionScript(node)
      this.commit()
    },

    syncActionScript(node) {
      node.config.actionScript = this.nodeActions(node).map(action => compileAction(action)).filter(Boolean).join('; ')
    },

    actionNeedsValue(action) {
      return actionNeedsValue(action)
    },

    actionValueOptions(action) {
      if (['ASSIGN_LINE', 'ASSIGN_LEAST_LOADED'].includes(action.type)) return toOptions(this.supportLines, item => item.name)
      if (action.type === 'ASSIGN_USER') return userOptions(this.users)
      if (action.type === 'SET_PRIORITY') return toOptions(this.priorities, item => item.name, item => item.name)
      if (action.type === 'SET_STATUS') return toOptions(this.statuses, item => item.name, item => item.name)
      if (['ADD_TAG', 'REMOVE_TAG'].includes(action.type)) return toOptions(this.tags, item => item.name, item => item.name)
      return []
    },

    actionInputType(action) {
      return action.type === 'SET_DEADLINE_MINUTES' ? 'number' : 'text'
    },

    actionValueLabel(action) {
      if (action.type === 'SET_DEADLINE_MINUTES') return 'Минуты *'
      if (action.type === 'SEND_MESSAGE') return 'Текст сообщения *'
      if (action.type === 'SET_NAME') return 'Новое название *'
      if (action.type === 'SET_DESCRIPTION') return 'Новое описание *'
      return 'Значение *'
    }
  }
}
</script>
