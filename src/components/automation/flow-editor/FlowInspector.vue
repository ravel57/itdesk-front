<template>
  <div
    class="flow-inspector-slot"
    :class="{ 'flow-inspector-slot--popped': poppedOut }"
    @click.self="$emit('update:poppedOut', false)"
  >
    <aside class="flow-inspector app-flow-inspector" :class="{ 'flow-inspector--popped': poppedOut }">
      <div class="flow-side-title row items-center justify-between no-wrap app-shared-flow-side-title">
        <span>Настройка узла</span>
        <q-btn
          flat
          round
          dense
          size="sm"
          :icon="poppedOut ? 'close_fullscreen' : 'open_in_full'"
          @click="$emit('update:poppedOut', !poppedOut)"
        >
          <q-tooltip>{{ poppedOut ? 'Свернуть в панель' : 'Открыть в отдельном окне' }}</q-tooltip>
        </q-btn>
      </div>

      <div v-if="!selectedNode" class="flow-inspector-empty">
        <q-icon name="touch_app" size="42px" color="grey-5"/>
        <div>Выберите узел на схеме</div>
      </div>

      <template v-else>
        <q-input
          v-model="selectedNode.label"
          dense
          outlined
          autogrow
          type="textarea"
          label="Название узла"
          @change="commit"
        />

        <q-select
          :key="selectedNode.id"
          v-model="selectedNode.config.section"
          :options="sectionOptions"
          outlined
          dense
          clearable
          use-input
          fill-input
          hide-selected
          input-debounce="0"
          label="Этап сценария"
          class="q-mt-sm"
          hint="Выберите этап или введите новый и нажмите Enter."
          @filter="filterSections"
          @new-value="createSection"
          @update:model-value="commit"
        >
          <template #no-option>
            <q-item>
              <q-item-section class="text-grey">Введите название и нажмите Enter, чтобы создать этап.</q-item-section>
            </q-item>
          </template>
        </q-select>
        <q-input v-model="selectedNode.config.description" outlined dense autogrow type="textarea" label="Пояснение для пользователя" class="q-mt-sm" @change="commit"/>
        <automation-operation-inspector
          v-if="['OPERATION', 'PARAMETERS', 'FOR_EACH', 'LOOP_END', 'LOOP_BREAK', 'SUBFLOW'].includes(selectedNode.type)"
          :test-context="testTrace.find(step => step.nodeId === selectedNode.id)" :entity-catalogs="{services,taskTypes,supportLines,priorities,statuses,users,tags}" :key="selectedNode.id" :triggers="triggers" :node="selectedNode" :nodes="localFlow.nodes" :catalog="operationCatalog" :error="operationCatalogError" :variables="expressionVariables" @update:label="selectedNode.label = $event" @update:config="selectedNode.config = $event" @change="commit"
        />
        <template v-else-if="selectedNode.type === 'CONDITION' && selectedNode.config.rule">
          <automation-rule-editor :model-value="selectedNode.config.rule" :variables="expressionVariables" @update:model-value="selectedNode.config.rule = $event; commit()"/>
        </template>
        <template v-else-if="selectedNode.type === 'EVENT'">
          <automation-event-select
            v-model="selectedNode.config.triggerType"
            outlined
            dense
            label="Событие *"
            :options="triggerTypeOptions"
            class="q-mt-md"
            @update:model-value="commit"
          />
          <q-banner rounded class="bg-blue-1 text-blue-9 q-mt-md">
            Сценарий запускается только этим событием. В одном графе может быть один стартовый узел.
          </q-banner>
        </template>

        <flow-condition-editor
          v-else-if="selectedNode.type === 'CONDITION'"
          :node="selectedNode"
          :expression-variables="expressionVariables"
          :task-types="taskTypes"
          :services="services"
          :priorities="priorities"
          :statuses="statuses"
          :support-lines="supportLines"
          :users="users"
          :tags="tags"
          :organizations="organizations"
          @change="commit"
        />

        <flow-action-editor
          v-else-if="selectedNode.type === 'ACTION'"
          :node="selectedNode"
          :expression-variables="expressionVariables"
          :support-lines="supportLines"
          :priorities="priorities"
          :statuses="statuses"
          :users="users"
          :tags="tags"
          @change="commit"
        />

        <template v-else-if="selectedNode.type === 'DELAY'">
          <div class="row q-col-gutter-sm q-mt-md">
            <div class="col-7">
              <q-input
                v-model.number="selectedNode.config.amount"
                outlined
                dense
                type="number"
                min="1"
                label="Длительность *"
                @change="commit"
              />
            </div>
            <div class="col-5">
              <q-select
                v-model="selectedNode.config.unit"
                outlined
                dense
                label="Единица"
                :options="delayUnits"
                emit-value
                map-options
                @update:model-value="commit"
              />
            </div>
          </div>
          <q-banner rounded class="bg-amber-1 text-amber-10 q-mt-md">
            Выполнение сохранится в базе и продолжится после перезапуска приложения. Максимальная задержка — 365 дней.
          </q-banner>
        </template>

        <automation-advanced-node-inspector
          v-else-if="advancedNodeTypes.includes(selectedNode.type)"
          :node="selectedNode"
          :flow="localFlow"
          :trigger-types="triggerTypes"
          :triggers="triggers"
          :task-types="taskTypes"
          :services="services"
          :priorities="priorities"
          :support-lines="supportLines"
          :users="users"
          :variables="expressionVariables"
          @change="commit"
        />

        <template v-else-if="selectedNode.type === 'NOTE'">
          <q-input
            v-model="selectedNode.config.text"
            outlined
            dense
            autogrow
            type="textarea"
            label="Комментарий к схеме"
            class="q-mt-md"
            @change="commit"
          />
        </template>

        <template v-else-if="selectedNode.type === 'END'">
          <q-input
            v-model="selectedNode.config.result"
            outlined
            dense
            autogrow
            type="textarea"
            label="Результат ветки"
            class="q-mt-md"
            @change="commit"
          />
          <q-banner rounded class="bg-green-1 text-green-9 q-mt-md">
            Конечный узел завершает текущую цепочку. Глобальная настройка сценария определяет, продолжать ли проверку
            следующих автоматизаций.
          </q-banner>
        </template>

        <q-separator class="q-my-lg"/>

        <div class="row justify-between">
          <q-btn outline dense icon="content_copy" label="Дублировать"
                 :disable="selectedNode.type === 'EVENT'" @click="$emit('duplicate-node', selectedNode)"/>
          <q-btn
            unelevated
            color="negative"
            icon="delete"
            dense
            label="Удалить"
            :disable="selectedNode.type === 'EVENT'"
            @click="$emit('delete-node', selectedNode.id)"
          />
        </div>
      </template>

      <q-separator class="q-my-lg"/>

      <div v-if="validation.errors.length" class="flow-validation-list">
        <div class="text-subtitle2 text-negative q-mb-xs">Ошибки</div>
        <div v-for="error in validation.errors" :key="error" class="text-caption text-negative">• {{ error }}</div>
      </div>
      <div v-if="validation.warnings.length" class="flow-validation-list q-mt-md">
        <div class="text-subtitle2 text-warning q-mb-xs">Предупреждения</div>
        <div v-for="warning in validation.warnings" :key="warning" class="text-caption text-warning">• {{
            warning
          }}
        </div>
      </div>
    </aside>
  </div>
</template>

<script>
import AutomationOperationInspector from 'src/components/automation/AutomationOperationInspector.vue'
import AutomationRuleEditor from 'src/components/automation/AutomationRuleEditor.vue'
import AutomationAdvancedNodeInspector from 'src/components/automation/AutomationAdvancedNodeInspector.vue'
import AutomationEventSelect from 'src/components/automation/AutomationEventSelect.vue'
import FlowConditionEditor from './FlowConditionEditor.vue'
import FlowActionEditor from './FlowActionEditor.vue'
import { ADVANCED_NODE_TYPES } from 'src/util/automationEditor/nodeSizes'
import { DELAY_UNITS } from 'src/util/automationEditor/editorConstants'

// Правая панель «Настройка узла»: общие поля узла, настройки по типу узла и список ошибок/предупреждений графа.
// Меняет выбранный узел прямо в объекте графа редактора; об изменениях сообщает событием change
// (аргументы события пробрасываются в commit редактора как есть).
export default {
  name: 'FlowInspector',

  components: {
    AutomationAdvancedNodeInspector,
    AutomationEventSelect,
    AutomationOperationInspector,
    AutomationRuleEditor,
    FlowActionEditor,
    FlowConditionEditor
  },

  props: {
    node: {type: Object, default: null},
    localFlow: {type: Object, required: true},
    graphSections: {type: Array, default: () => []},
    validation: {type: Object, required: true},
    testTrace: {type: Array, default: () => []},
    poppedOut: {type: Boolean, default: false},
    expressionVariables: {type: Array, default: () => []},
    operationCatalog: {type: Array, default: () => []},
    operationCatalogError: {type: String, default: ''},
    triggerTypes: {type: Array, default: () => []},
    triggerTypeOptions: {type: Array, default: () => []},
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

  emits: ['change', 'update:poppedOut', 'duplicate-node', 'delete-node'],

  data() {
    return {
      sectionSearch: '',
      delayUnits: DELAY_UNITS
    }
  },

  computed: {
    selectedNode() {
      return this.node
    },

    sectionOptions() {
      const search = this.sectionSearch.trim().toLocaleLowerCase()
      return this.graphSections.filter(section => section.toLocaleLowerCase().includes(search))
    },

    advancedNodeTypes() {
      return ADVANCED_NODE_TYPES
    }
  },

  methods: {
    commit(...args) {
      this.$emit('change', ...args)
    },

    filterSections(value, update) {
      update(() => { this.sectionSearch = value })
    },
    createSection(value, done) {
      const section = value.trim()
      if (section) {
        done(section, 'add-unique')
      } else {
        done()
      }
    }
  }
}
</script>

<style scoped>
.flow-inspector-slot {
  display: contents;
}

.flow-inspector-slot--popped {
  display: flex;
  align-items: center;
  justify-content: center;
  position: fixed;
  inset: 0;
  background: rgba(15, 18, 25, 0.45);
  /* Matches Quasar's own dialog/menu z-index tier so popups opened from inside
     (q-select menus, tooltips) stack above this by DOM order, not a higher value. */
  z-index: 6000;
  /* The host q-dialog wrapper has pointer-events:none (it delegates to its own
     backdrop/card); re-enable it here since we're now teleported inside that wrapper. */
  pointer-events: auto;
}

.flow-inspector--popped {
  width: min(640px, 92vw);
  max-height: 86vh;
  border-left: none;
  border-radius: 10px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.35);
}

.flow-inspector-empty {
  min-height: 240px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: var(--app-text-muted, #999faa);
}

.flow-validation-list {
  padding: 10px;
  border-radius: 7px;
  background: var(--app-surface, #fafafa);
}
</style>
