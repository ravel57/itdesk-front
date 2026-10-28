<template>
  <div class="row items-center justify-between q-mt-md">
    <div class="text-subtitle2">Условие</div>
    <q-toggle
      v-model="selectedNode.config.manualExpression"
      dense
      label="Скрипт"
      @update:model-value="onConditionModeChanged(selectedNode)"
    />
  </div>

  <automation-expression-input
    v-if="selectedNode.config.manualExpression"
    v-model="selectedNode.config.expression"
    :variables="expressionVariables"
    outlined
    dense
    autogrow
    type="textarea"
    label="Выражение *"
    class="q-mt-sm"
    @change="commit"
  />

  <template v-else>
    <div v-if="!conditionGroups(selectedNode).length" class="flow-empty-card q-mt-sm">
      Без условий — результат всегда «ДА».
    </div>

    <template v-for="(group, groupIndex) in conditionGroups(selectedNode)" :key="group.id">
      <div v-if="groupIndex > 0" class="flow-logic-divider">ИЛИ</div>
      <div class="flow-condition-group q-mt-sm app-flow-condition-group">
        <div class="row items-center justify-between">
          <div class="text-caption text-grey-7">Все условия группы — И</div>
          <q-btn flat round dense size="sm" icon="delete_outline" color="negative"
                 @click="removeConditionGroup(selectedNode, groupIndex)"/>
        </div>

        <div v-for="(condition, conditionIndex) in group.conditions" :key="condition.id"
             class="flow-condition-item app-flow-condition-item">
          <q-select
            v-model="condition.field"
            outlined
            dense
            label="Поле *"
            :options="conditionFields"
            emit-value
            map-options
            @update:model-value="resetCondition(condition, selectedNode)"
          />
          <q-select
            v-model="condition.operator"
            outlined
            dense
            label="Оператор *"
            :options="conditionOperatorOptions(condition)"
            emit-value
            map-options
            @update:model-value="onConditionChanged(selectedNode)"
          />
          <q-select
            v-if="conditionValueOptions(condition).length"
            v-model="condition.value"
            outlined
            dense
            use-input
            label="Значение *"
            :options="conditionValueOptions(condition)"
            emit-value
            map-options
            @update:model-value="onConditionChanged(selectedNode)"
          />
          <q-input
            v-else-if="conditionNeedsValue(condition)"
            v-model="condition.value"
            outlined
            dense
            :type="conditionInputType(condition)"
            label="Значение *"
            @change="onConditionChanged(selectedNode)"
          />
          <div class="row justify-end">
            <q-btn
              unelevated
              color="negative"
              icon="delete"
              dense
              size="sm"
              label="Удалить условие"
              @click="removeCondition(selectedNode, groupIndex, conditionIndex)"
            />
          </div>
        </div>

        <q-btn
          flat
          dense
          icon="add"
          color="primary"
          label="Добавить условие И"
          @click="addCondition(selectedNode, groupIndex)"
        />
      </div>
    </template>

    <div class="row q-gutter-sm q-mt-md">
      <q-btn
        outline
        dense
        icon="add"
        color="primary"
        :label="conditionGroups(selectedNode).length ? 'Группа ИЛИ' : 'Добавить условие'"
        @click="addConditionGroup(selectedNode)"
      />
    </div>

    <q-input
      :model-value="selectedNode.config.expression"
      readonly
      outlined
      dense
      autogrow
      type="textarea"
      label="Сформированное выражение"
      class="q-mt-md"
    />
  </template>
</template>

<script>
import {nextFlowId} from 'src/util/automationFlow'
import { serviceLabelWithOrganizations } from 'src/util/serviceOrganizations'
import { CONDITION_FIELDS } from 'src/util/automationEditor/editorConstants'
import { compileCondition, conditionMeta, conditionOperatorOptions } from 'src/util/automationEditor/scriptCompile'
import { toOptions, userOptions } from 'src/util/automationEditor/entityOptions'
import AutomationExpressionInput from 'src/components/automation/AutomationExpressionInput.vue'

// Конструктор условия узла CONDITION: группы «ИЛИ» из условий «И» либо ручное выражение.
// Меняет node.config прямо в объекте графа редактора (как и остальные инспекторы узлов).
export default {
  name: 'FlowConditionEditor',

  components: {AutomationExpressionInput},

  props: {
    node: {type: Object, required: true},
    expressionVariables: {type: Array, default: () => []},
    taskTypes: {type: Array, default: () => []},
    services: {type: Array, default: () => []},
    priorities: {type: Array, default: () => []},
    statuses: {type: Array, default: () => []},
    supportLines: {type: Array, default: () => []},
    users: {type: Array, default: () => []},
    tags: {type: Array, default: () => []},
    organizations: {type: Array, default: () => []}
  },

  emits: ['change'],

  data() {
    return {
      conditionFields: CONDITION_FIELDS
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

    conditionGroups(node) {
      if (!Array.isArray(node.config.groups)) node.config.groups = []
      return node.config.groups
    },

    addConditionGroup(node) {
      this.conditionGroups(node).push({
        id: nextFlowId('group'),
        conditions: [{id: nextFlowId('condition-item'), field: 'task.type.id', operator: 'equals', value: null}]
      })
      this.onConditionChanged(node)
    },

    removeConditionGroup(node, groupIndex) {
      this.conditionGroups(node).splice(groupIndex, 1)
      this.onConditionChanged(node)
    },

    addCondition(node, groupIndex) {
      this.conditionGroups(node)[groupIndex].conditions.push({
        id: nextFlowId('condition-item'), field: 'task.type.id', operator: 'equals', value: null
      })
      this.onConditionChanged(node)
    },

    removeCondition(node, groupIndex, conditionIndex) {
      const group = this.conditionGroups(node)[groupIndex]
      group.conditions.splice(conditionIndex, 1)
      if (!group.conditions.length) this.conditionGroups(node).splice(groupIndex, 1)
      this.onConditionChanged(node)
    },

    resetCondition(condition, node) {
      condition.value = null
      const kind = this.conditionMeta(condition.field).kind
      condition.operator = kind === 'tag' ? 'has_tag' : kind === 'text' ? 'contains' : 'equals'
      if (kind === 'function-boolean' || kind === 'boolean') condition.value = true
      this.onConditionChanged(node)
    },

    conditionMeta(field) {
      return conditionMeta(field)
    },

    conditionOperatorOptions(condition) {
      return conditionOperatorOptions(condition)
    },

    conditionValueOptions(condition) {
      const meta = this.conditionMeta(condition.field)
      let options = []
      if (meta.source === 'taskTypes') options = toOptions(this.taskTypes, item => item.type || item.name)
      if (meta.source === 'services') options = toOptions(this.services, item => serviceLabelWithOrganizations(item, this.services))
      if (meta.source === 'priorities') options = toOptions(this.priorities, item => item.name)
      if (meta.source === 'statuses') options = toOptions(this.statuses, item => item.name)
      if (meta.source === 'supportLines') options = toOptions(this.supportLines, item => item.name)
      if (meta.source === 'users') options = userOptions(this.users)
      if (meta.source === 'organizations') options = toOptions(this.organizations, item => item.name)
      if (meta.source === 'tags') options = toOptions(this.tags, item => item.name, item => item.name)
      if (meta.kind === 'boolean' || meta.kind === 'function-boolean') {
        return [
          {label: 'Да', value: true},
          {label: 'Нет', value: false}
        ]
      }
      if (meta.kind === 'nullable-entity') return [{label: 'Не назначено', value: '__NULL__'}, ...options]
      return options
    },

    conditionNeedsValue(condition) {
      return !['is_null', 'not_null'].includes(condition.operator)
    },

    conditionInputType(condition) {
      return this.conditionMeta(condition.field).kind === 'number' ? 'number' : 'text'
    },

    onConditionModeChanged(node) {
      if (!node.config.manualExpression) {
        this.syncConditionExpression(node)
      }
      this.commit()
    },

    onConditionChanged(node) {
      this.syncConditionExpression(node)
      this.commit()
    },

    syncConditionExpression(node) {
      const groups = this.conditionGroups(node)
      if (!groups.length) {
        node.config.expression = 'true'
        return
      }
      const compiledGroups = groups.map(group => {
        const conditions = (group.conditions || []).map(condition => compileCondition(condition)).filter(Boolean)
        return conditions.length ? `(${conditions.join(' and ')})` : ''
      }).filter(Boolean)
      node.config.expression = compiledGroups.join(' or ')
    }
  }
}
</script>

<style scoped>
.flow-empty-card {
  padding: 13px;
  border: 1px dashed var(--app-border, #cfd3dc);
  border-radius: 7px;
  background: var(--app-surface, #fafbfc);
  color: var(--app-text-muted, #777e89);
  font-size: 12px;
}

.flow-logic-divider {
  margin: 12px 0 4px;
  text-align: center;
  color: var(--app-warning-text, #fb8c00);
  font-size: 11px;
  font-weight: 800;
}
</style>
