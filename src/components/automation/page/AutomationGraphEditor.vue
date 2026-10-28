<template>
  <div class="automation-graph">
    <div class="automation-node automation-node-event">
      <div class="automation-node-title">Событие</div>
      <automation-event-select
        :model-value="this.selectedTriggerType"
        label="Когда выполнять *"
        :options="this.store.triggerTypeOptions"
        @update:model-value="this.$emit('update:selectedTriggerType', $event)"
      />
    </div>

    <q-icon name="east" size="26px" class="automation-arrow"/>

    <div class="automation-node automation-node-condition">
      <div class="automation-node-title row items-center justify-between no-wrap">
        <span>Условия</span>
        <q-btn
          v-if="this.graphConditionGroups.length === 0"
          flat
          dense
          color="primary"
          icon="add"
          label="Добавить"
          @click="this.$emit('add-condition-group')"
        />
      </div>

      <div v-if="this.graphConditionGroups.length === 0" class="automation-empty-state">
        Без условий — сценарий выполняется для всех заявок этого события.
      </div>

      <template v-for="(group, groupIndex) in this.graphConditionGroups" :key="group.id">
        <div v-if="groupIndex > 0" class="automation-logic-divider">
          <span>ИЛИ</span>
        </div>

        <div class="automation-condition-group">
          <div class="automation-group-header">
            <span>Все условия группы (И)</span>
            <q-btn
              flat
              round
              dense
              color="negative"
              icon="delete_outline"
              @click="this.$emit('remove-condition-group', groupIndex)"
            />
          </div>

          <div
            v-for="(condition, conditionIndex) in group.conditions"
            :key="condition.id"
            class="automation-condition-row"
          >
            <q-select
              v-model="condition.field"
              label="Поле *"
              :options="this.graphConditionFields"
              emit-value
              map-options
              class="condition-field"
              @update:model-value="this.$emit('reset-condition', condition)"
            />

            <q-select
              v-model="condition.operator"
              label="Оператор *"
              :options="this.conditionOperatorOptions(condition)"
              emit-value
              map-options
              class="condition-operator"
              @update:model-value="condition.value = null"
            />

            <q-select
              v-if="this.conditionValueOptions(condition).length"
              v-model="condition.value"
              label="Значение *"
              :options="this.conditionValueOptions(condition)"
              emit-value
              map-options
              use-input
              class="condition-value"
            />
            <q-input
              v-else
              v-model="condition.value"
              label="Значение *"
              class="condition-value"
              autogrow
              type="textarea"
            />

            <q-btn
              flat
              round
              dense
              color="negative"
              icon="close"
              @click="this.$emit('remove-condition', groupIndex, conditionIndex)"
            />
          </div>

          <q-btn
            flat
            dense
            color="primary"
            icon="add"
            label="Условие И"
            @click="this.$emit('add-condition', groupIndex)"
          />
        </div>
      </template>

      <q-btn
        v-if="this.graphConditionGroups.length > 0"
        outline
        dense
        color="primary"
        icon="call_split"
        label="Добавить группу ИЛИ"
        class="q-mt-md"
        @click="this.$emit('add-condition-group')"
      />
    </div>

    <div class="automation-branch-connector">
      <q-icon name="call_split" size="30px"/>
    </div>

    <div class="automation-branches">
      <div class="automation-node automation-node-action automation-branch-yes">
        <div class="automation-branch-label text-positive">ДА</div>
        <div class="automation-node-title row items-center justify-between no-wrap">
          <span>Условие выполнено</span>
          <q-btn
            flat
            dense
            color="primary"
            icon="add"
            label="Добавить действие"
            @click="this.$emit('add-action', 'yes')"
          />
        </div>

        <div
          v-for="(action, actionIndex) in this.graphActions"
          :key="action.id"
          class="automation-action-row"
        >
          <q-select
            v-model="action.type"
            label="Что сделать *"
            :options="this.graphActionTypes"
            emit-value
            map-options
            class="action-type"
            @update:model-value="action.value = null"
          />

          <q-select
            v-if="this.actionNeedsValue(action)"
            v-model="action.value"
            label="Значение *"
            :options="this.actionValueOptions(action)"
            emit-value
            map-options
            use-input
            class="action-value"
          />

          <q-btn
            flat
            round
            dense
            color="negative"
            icon="close"
            :disable="this.graphActions.length === 1"
            @click="this.$emit('remove-action', 'yes', actionIndex)"
          />
        </div>
      </div>

      <div class="automation-node automation-node-action automation-branch-no">
        <div class="automation-branch-label text-negative">НЕТ</div>
        <div class="automation-node-title row items-center justify-between no-wrap">
          <span>Условие не выполнено</span>
          <q-toggle
            :model-value="this.elseBranchEnabled"
            color="primary"
            label="Выполнять ветку"
            @update:model-value="this.$emit('update:elseBranchEnabled', $event); this.$emit('else-branch-toggle', $event)"
          />
        </div>

        <div v-if="!this.elseBranchEnabled" class="automation-empty-state">
          Ничего не выполнять и перейти к следующему сценарию.
        </div>

        <template v-else>
          <div
            v-for="(action, actionIndex) in this.graphElseActions"
            :key="action.id"
            class="automation-action-row"
          >
            <q-select
              v-model="action.type"
              label="Что сделать *"
              :options="this.graphActionTypes"
              emit-value
              map-options
              class="action-type"
              @update:model-value="action.value = null"
            />

            <q-select
              v-if="this.actionNeedsValue(action)"
              v-model="action.value"
              label="Значение *"
              :options="this.actionValueOptions(action)"
              emit-value
              map-options
              use-input
              class="action-value"
            />

            <q-btn
              flat
              round
              dense
              color="negative"
              icon="close"
              :disable="this.graphElseActions.length === 1"
              @click="this.$emit('remove-action', 'no', actionIndex)"
            />
          </div>

          <q-btn
            flat
            dense
            color="primary"
            icon="add"
            label="Добавить действие"
            @click="this.$emit('add-action', 'no')"
          />
        </template>
      </div>
    </div>
  </div>
</template>

<script>
import {useStore} from 'stores/store'
import AutomationEventSelect from 'components/automation/AutomationEventSelect.vue'
import {
  GRAPH_ACTION_TYPES,
  GRAPH_CONDITION_FIELDS,
  actionNeedsValue,
  actionValueOptions,
  conditionOperatorOptions,
  conditionValueOptions,
  toOptions
} from 'src/util/automationPage/graphFields'

// Простой («графовый») редактор правила: событие -> условия (группы И/ИЛИ) -> ветки ДА/НЕТ с действиями.
// Модель (группы условий и действия) принадлежит родителю (automationGraphMixin) и правится по месту;
// добавление/удаление элементов и сброс условия делегируются родителю событиями.
export default {
  name: 'AutomationGraphEditor',

  components: {
    AutomationEventSelect
  },

  props: {
    selectedTriggerType: {type: String, default: ''},
    graphConditionGroups: {type: Array, required: true},
    graphActions: {type: Array, required: true},
    graphElseActions: {type: Array, required: true},
    elseBranchEnabled: {type: Boolean, default: false},
    supportLines: {type: Array, default: () => []}
  },

  emits: [
    'update:selectedTriggerType',
    'update:elseBranchEnabled',
    'else-branch-toggle',
    'add-condition-group',
    'remove-condition-group',
    'reset-condition',
    'add-condition',
    'remove-condition',
    'add-action',
    'remove-action'
  ],

  computed: {
    graphConditionFields() {
      return GRAPH_CONDITION_FIELDS
    },

    graphActionTypes() {
      return GRAPH_ACTION_TYPES
    },

    supportLineOptions() {
      return toOptions(this.supportLines, item => item.name)
    },

    userOptions() {
      return (this.store.users || [])
        .filter(user => user && user.id !== undefined && user.id !== null)
        .map(user => ({
          label: `${user.lastname || ''} ${user.firstname || ''}`.trim() || user.username || `Пользователь ${user.id}`,
          value: user.id
        }))
    }
  },

  methods: {
    conditionOperatorOptions(condition) {
      return conditionOperatorOptions(condition)
    },

    conditionValueOptions(condition) {
      return conditionValueOptions(condition, this)
    },

    actionNeedsValue(action) {
      return actionNeedsValue(action)
    },

    actionValueOptions(action) {
      return actionValueOptions(action, this)
    }
  },

  setup() {
    const store = useStore()
    return {store}
  }
}
</script>

<style scoped>
.automation-graph {
  display: flex;
  align-items: flex-start;
  gap: 24px;
  padding: 28px;
  overflow-x: auto;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background: #fafafa;
}

.automation-node {
  flex: 0 0 auto;
  min-height: 190px;
  padding: 22px;
  border: 1px solid #d7d7d7;
  border-top: 4px solid var(--q-primary);
  border-radius: 8px;
  background: white;
}

.automation-node-event {
  width: 260px;
}

.automation-node-condition {
  width: 520px;
  border-top-color: #fb8c00;
}

.automation-node-action {
  width: 430px;
  border-top-color: #43a047;
}

.automation-node-title {
  margin-bottom: 18px;
  font-weight: 600;
  font-size: 15px;
}

.automation-arrow {
  align-self: center;
  flex: 0 0 auto;
  color: #9e9e9e;
}

.automation-branch-connector {
  align-self: center;
  color: #9e9e9e;
  flex: 0 0 auto;
}

.automation-branches {
  display: grid;
  grid-template-columns: repeat(2, minmax(430px, 1fr));
  align-items: start;
  gap: 22px;
}

.automation-branch-label {
  margin-bottom: 8px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: .08em;
}

.automation-branch-yes {
  border-top-color: #43a047;
}

.automation-branch-no {
  border-top-color: #e53935;
}

.automation-empty-state {
  padding: 18px;
  border: 1px dashed #bdbdbd;
  border-radius: 6px;
  color: #757575;
  background: #fafafa;
}

.automation-condition-group {
  padding: 14px;
  border: 1px solid #e0e0e0;
  border-radius: 7px;
  background: #fffaf3;
}

.automation-group-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
  color: #616161;
  font-size: 13px;
  font-weight: 500;
}

.automation-condition-row {
  display: grid;
  grid-template-columns: minmax(145px, 1.3fr) minmax(120px, .9fr) minmax(150px, 1.4fr) 34px;
  align-items: end;
  gap: 10px;
  margin-bottom: 12px;
}

.automation-action-row {
  display: grid;
  grid-template-columns: minmax(180px, 1fr) minmax(150px, 1fr) 34px;
  align-items: end;
  gap: 10px;
  padding: 12px;
  margin-bottom: 12px;
  border: 1px solid #e0e0e0;
  border-radius: 7px;
  background: #f7fbf7;
}

.automation-logic-divider {
  position: relative;
  margin: 14px 0;
  text-align: center;
  color: #fb8c00;
  font-size: 12px;
  font-weight: 700;
}

.automation-logic-divider::before,
.automation-logic-divider::after {
  content: '';
  position: absolute;
  top: 50%;
  width: calc(50% - 30px);
  height: 1px;
  background: #ffe0b2;
}

.automation-logic-divider::before {
  left: 0;
}

.automation-logic-divider::after {
  right: 0;
}

@media (max-width: 900px) {
  .automation-graph {
    gap: 18px;
    padding: 20px;
  }
}
</style>
