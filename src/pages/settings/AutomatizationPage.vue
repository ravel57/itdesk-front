<template>
  <div class="q-pa-md">
    <div class="settings-content-header">
      <div class="settings-content-heading">
        <div class="settings-content-title">Автоматизации</div>
        <div class="settings-content-description">
          Создавайте сценарии, которые автоматически реагируют на события и выполняют действия.
        </div>
      </div>
      <div class="settings-content-actions">
        <q-btn
          unelevated
          no-caps
          color="primary"
          icon="add"
          label="Добавить триггер"
          @click="this.newTrigger"
        />
      </div>
    </div>
    <q-list
      bordered
      class="rounded-borders settings-row-list"
      separator
      style="margin-top: 8px"
    >
      <q-item header class="text-bold">
        Название
      </q-item>
      <draggable
        :list="this.store.triggers"
        item-key="id"
        class="list-group"
        ghost-class="ghost"
        handle=".settings-drag-handle"
        @start="dragging = true"
        @end="dragging = false"
      >
        <template #item="{ element }">
          <q-item
            class="list-group-item"
            :class="{ 'not-draggable': true }"
          >
            <q-item-section side class="settings-drag-handle cursor-grab">
              <q-icon name="drag_indicator" color="grey-6"/>
            </q-item-section>
            <q-item-section top class="justify-center">
              <q-item-label class="row items-center q-gutter-sm">
                <span>{{ element.name }}</span>
                <q-badge
                  :color="element.automationRuleStatus === 'DISABLED' ? 'grey-6' : 'positive'"
                  :label="element.automationRuleStatus === 'DISABLED' ? 'Выключено' : 'Активно'"
                />
                <q-badge
                  v-if="element.stopProcessing"
                  outline
                  color="primary"
                  label="Остановить после совпадения"
                />
              </q-item-label>
              <q-item-label caption>
                {{ element.triggerType }} · срабатываний: {{ Number(element.matchCount || 0).toLocaleString('ru-RU') }}
                <span v-if="element.lastMatchedAt"> · последнее: {{ formatDateTime(element.lastMatchedAt) }}</span>
              </q-item-label>
            </q-item-section>
            <q-item-section top side>
              <div class="row items-center no-wrap">
                <q-toggle
                  :model-value="element.automationRuleStatus !== 'DISABLED'"
                  :disable="this.togglingTriggerIds.includes(element.id)"
                  color="primary"
                  @update:model-value="toggleTrigger(element, $event)"
                />
                <q-btn
                  color="primary"
                  dense
                  flat
                  icon="edit"
                  @click="editTrigger(element)"
                />
              </div>
            </q-item-section>
          </q-item>
        </template>
      </draggable>
    </q-list>
  </div>
  <q-dialog
    v-model="this.dialogVisible"
    persistent
    backdrop-filter="blur(4px)"
  >
    <q-card class="dialog-width automation-dialog">
      <q-toolbar class="justify-between">
        <div class="text-h6" v-text="this.isNewTrigger ? 'Новый триггер' : 'Изменить триггер'"/>
        <q-btn flat round dense icon="close" v-close-popup/>
      </q-toolbar>
      <q-card-section class="automation-editor-section">
        <q-input
          v-model="this.dialogTriggerName"
          label="Название *"
          :rules="[val => (val && val.length > 0) || 'Обязательное поле']"
          ref="dialogTriggerName"
        />
        <q-input
          v-model="this.dialogTriggerDescription"
          label="Описание"
        />

        <div class="automation-rule-options row items-center q-col-gutter-lg">
          <div class="col-auto">
            <q-toggle
              v-model="this.dialogTriggerEnabled"
              color="primary"
              label="Сценарий активен"
            />
          </div>
          <div class="col-auto">
            <q-toggle
              v-model="this.dialogStopProcessing"
              color="primary"
              label="Не проверять следующие сценарии после выполнения ветки"
            />
          </div>
        </div>

        <!--        <q-btn-toggle-->
        <!--          v-model="this.editorMode"-->
        <!--          class="automation-mode-toggle"-->
        <!--          no-caps-->
        <!--          dense-->
        <!--          toggle-color="primary"-->
        <!--          :options="[-->
        <!--            { label: 'Правило', value: 'graph', icon: 'schema' },-->
        <!--            { label: 'Цепочка', value: 'workflow', icon: 'account_tree' },-->
        <!--            // { label: 'Скрипт', value: 'script', icon: 'code' }-->
        <!--          ]"-->
        <!--        />-->

        <div v-if="this.editorMode === 'workflow'" class="automation-workflow-wrapper">
          <automation-flow-editor
            v-model="this.workflow"
            :trigger-types="this.store.triggerTypes"
            :triggers="this.store.triggers"
            :task-types="this.store.taskTypes"
            :services="this.store.services"
            :priorities="this.store.priorities"
            :statuses="this.store.statuses"
            :support-lines="this.supportLines"
            :users="this.store.users"
            :organizations="this.store.organizations"
            :tags="this.store.tags"
            @validation-change="this.workflowValidation = $event"
          />

          <q-banner
            v-if="this.workflowValidation.errors.length || this.workflowValidation.warnings.length"
            rounded
            class="automation-workflow-validation"
            :class="this.workflowValidation.errors.length ? 'automation-workflow-validation-error' : 'automation-workflow-validation-warning'"
          >
            <div v-for="error in this.workflowValidation.errors" :key="`error-${error}`">
              <q-icon name="error" class="q-mr-xs"/>
              {{ error }}
            </div>
            <div v-for="warning in this.workflowValidation.warnings" :key="`warning-${warning}`">
              <q-icon name="warning" class="q-mr-xs"/>
              {{ warning }}
            </div>
          </q-banner>
        </div>

        <div v-else-if="this.editorMode === 'graph'" class="automation-graph">
          <div class="automation-node automation-node-event">
            <div class="automation-node-title">Событие</div>
            <q-select
              v-model="this.selectedTriggerType"
              label="Когда выполнять *"
              :options="this.store.triggerTypes"
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
                no-caps
                color="primary"
                icon="add"
                label="Добавить"
                @click="this.addConditionGroup"
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
                    @click="this.removeConditionGroup(groupIndex)"
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
                    @update:model-value="this.resetCondition(condition)"
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
                  />

                  <q-btn
                    flat
                    round
                    dense
                    color="negative"
                    icon="close"
                    @click="this.removeCondition(groupIndex, conditionIndex)"
                  />
                </div>

                <q-btn
                  flat
                  dense
                  no-caps
                  color="primary"
                  icon="add"
                  label="Условие И"
                  @click="this.addCondition(groupIndex)"
                />
              </div>
            </template>

            <q-btn
              v-if="this.graphConditionGroups.length > 0"
              outline
              dense
              no-caps
              color="primary"
              icon="call_split"
              label="Добавить группу ИЛИ"
              class="q-mt-md"
              @click="this.addConditionGroup"
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
                  no-caps
                  color="primary"
                  icon="add"
                  label="Добавить действие"
                  @click="this.addAction('yes')"
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
                  @click="this.removeAction('yes', actionIndex)"
                />
              </div>
            </div>

            <div class="automation-node automation-node-action automation-branch-no">
              <div class="automation-branch-label text-negative">НЕТ</div>
              <div class="automation-node-title row items-center justify-between no-wrap">
                <span>Условие не выполнено</span>
                <q-toggle
                  v-model="this.elseBranchEnabled"
                  color="primary"
                  label="Выполнять ветку"
                  @update:model-value="this.onElseBranchToggle"
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
                    @click="this.removeAction('no', actionIndex)"
                  />
                </div>

                <q-btn
                  flat
                  dense
                  no-caps
                  color="primary"
                  icon="add"
                  label="Добавить действие"
                  @click="this.addAction('no')"
                />
              </template>
            </div>
          </div>
        </div>

        <q-banner v-if="this.editorMode === 'graph'" rounded class="automation-preview">
          <div><b>Условие:</b> {{ this.graphExpression || 'Заполните условия' }}</div>
          <div><b>Ветка ДА:</b> {{ this.graphAction || 'Добавьте действие' }}</div>
          <div><b>Ветка НЕТ:</b> {{ this.graphElseAction || 'Перейти к следующему сценарию' }}</div>
        </q-banner>

        <q-expansion-item
          v-if="this.editorMode !== 'script'"
          icon="science"
          label="Проверить маршрут на существующей заявке"
          class="automation-test-panel"
          header-class="text-primary"
        >
          <div class="automation-test-content">
            <div class="row items-end q-col-gutter-md">
              <div class="col-12 col-md-4">
                <q-input
                  v-model.number="this.testTaskId"
                  type="number"
                  label="ID заявки"
                  min="1"
                />
              </div>
              <div class="col-auto">
                <q-btn
                  color="primary"
                  outline
                  icon="play_arrow"
                  label="Проверить"
                  :loading="this.testLoading"
                  @click="this.runRoutingTest"
                />
              </div>
            </div>

            <q-banner
              v-if="this.testResult"
              rounded
              :class="this.testResult.valid === false
                ? 'automation-test-result automation-test-error'
                : this.isWorkflowTestResult(this.testResult)
                  ? (this.testResult.executed || this.testResult.scheduled
                      ? 'automation-test-result automation-test-match'
                      : 'automation-test-result automation-test-miss')
                  : this.testResult.matched
                    ? 'automation-test-result automation-test-match'
                    : 'automation-test-result automation-test-miss'"
            >
              <div class="text-weight-medium">
                <template v-if="this.testResult.valid === false">Ошибка проверки</template>
                <template v-else-if="this.isWorkflowTestResult(this.testResult)">
                  {{ this.workflowTestResultTitle(this.testResult) }}
                </template>
                <template v-else-if="this.testResult.branch === 'YES'">Будет выполнена ветка ДА</template>
                <template v-else-if="this.testResult.branch === 'NO'">Будет выполнена ветка НЕТ</template>
                <template v-else>Действия выполняться не будут</template>
              </div>
              <div v-if="this.testResult.taskName" class="text-caption">
                №{{ this.testResult.taskId }} · {{ this.testResult.taskName }}
              </div>
              <div v-if="this.testResult.error" class="text-caption">{{ this.testResult.error }}</div>
              <div v-if="this.testResult.selectedAction" class="text-caption q-mt-xs">
                Будут выполнены: {{ this.testResult.selectedAction }}
              </div>
              <div
                v-if="this.isWorkflowTestResult(this.testResult) && this.testResult.trace?.length"
                class="automation-test-trace q-mt-sm"
              >
                <div
                  v-for="(step, index) in this.testResult.trace"
                  :key="`${step.nodeId || 'step'}-${index}`"
                  class="automation-test-trace-step"
                >
                  <span class="text-weight-medium">{{ step.label || step.nodeType || step.nodeId }}</span>
                  <span> — {{ this.workflowTraceStatusLabel(step.status) }}</span>
                  <span v-if="step.detail">: {{ step.detail }}</span>
                </div>
              </div>
            </q-banner>
          </div>
        </q-expansion-item>

        <div v-if="this.editorMode === 'script'">
          <q-select
            id="task-executor"
            v-model="this.selectedTriggerType"
            label="Событие *"
            :options="this.store.triggerTypes"
          />
          <automation-expression-input
            v-model="this.dialogTriggerExpression"
            :variables="this.expressionVariables"
            label="Выражение условия *"
            :rules="[val => (val && val.length > 0) || 'Обязательное поле']"
          />
          <automation-expression-input
            v-model="this.dialogTriggerAction"
            :variables="this.expressionVariables"
            label="Действия ветки ДА *"
            :rules="[val => (val && val.length > 0) || 'Обязательное поле']"
          />
          <automation-expression-input
            v-model="this.dialogTriggerElseAction"
            :variables="this.expressionVariables"
            label="Действия ветки НЕТ (необязательно)"
          />
        </div>
      </q-card-section>
      <q-card-actions align="right" class="automation-dialog-actions">
        <q-btn
          v-if="!this.isNewTrigger"
          unelevated
          no-caps
          color="negative"
          icon="delete"
          label="Удалить"
          @click="this.dialogDeleteTrigger"
        />
        <q-btn
          color="white"
          label="Отмена"
          text-color="primary"
          @click="this.dialogClose"
        />
        <q-btn
          color="primary"
          label="Сохранить"
          :loading="this.saving"
          @click="this.dialogSaveNewOrUpdateTrigger"/>
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script>
import draggable from 'vuedraggable'
import axios from 'axios'
import AutomationFlowEditor from 'components/automation/AutomationFlowEditor.vue'
import AutomationExpressionInput from 'components/automation/AutomationExpressionInput.vue'
import {useStore} from 'stores/store'
import {watch} from 'vue'
import {
  createDefaultWorkflow,
  getWorkflowTriggerType,
  legacyRuleToWorkflow,
  parseWorkflowDefinition
} from 'src/util/automationFlow'

export default {
  name: 'AutomatizationPage',

  components: {
    draggable,
    AutomationFlowEditor,
    AutomationExpressionInput
  },

  data: () => ({
    isNewTigger: true,
    dialogVisible: false,
    dialogTriggerName: '',
    dialogTriggerDescription: '',
    dialogTriggerExpression: '',
    dialogTriggerAction: '',
    dialogTriggerElseAction: '',
    selectedTriggerType: '',
    showTooltipSetDefault: false,
    isNewTrigger: false,
    triggerId: null, // for update
    dragging: true,
    editorMode: 'graph',
    supportLines: [],
    graphConditionGroups: [],
    graphActions: [],
    graphElseActions: [],
    elseBranchEnabled: false,
    graphSequence: 1,
    dialogTriggerEnabled: true,
    dialogStopProcessing: false,
    testTaskId: null,
    testLoading: false,
    testResult: null,
    workflow: createDefaultWorkflow('TASK_CREATED'),
    workflowValidation: {errors: [], warnings: []},
    saving: false,
    togglingTriggerIds: [],
  }),

  computed: {
    expressionVariables() {
      const variables = new Set()
      for (const node of this.workflow?.nodes || []) {
        const config = node?.config || {}
        if (['SET_VARIABLE', 'EXPRESSION', 'COUNTER'].includes(node?.type) && config.name) {
          variables.add(String(config.name).replace(/^var\./, '').trim())
        }
        if (['HTTP_REQUEST', 'CREATE_TASK', 'DEDUPLICATE'].includes(node?.type) && config.resultVariable) {
          variables.add(String(config.resultVariable).replace(/^var\./, '').trim())
        }
      }
      return [...variables].filter(Boolean).sort((left, right) => left.localeCompare(right))
    },

    graphConditionFields() {
      return [
        {label: 'Тип заявки', value: 'task.type.id', kind: 'entity', source: 'taskTypes'},
        {label: 'Приоритет', value: 'task.priority.id', kind: 'entity', source: 'priorities'},
        {label: 'Статус', value: 'task.status.id', kind: 'entity', source: 'statuses'},
        {label: 'Текущая линия', value: 'task.supportLine.id', kind: 'entity-nullable', source: 'supportLines'},
        {label: 'Исполнитель', value: 'task.executor.id', kind: 'entity-nullable', source: 'users'},
        {label: 'Тег заявки', value: 'task.tags', kind: 'tag', source: 'tags'},
        {label: 'Название заявки', value: 'task.name', kind: 'text'},
        {label: 'Описание заявки', value: 'task.description', kind: 'text'},
        {label: 'Заявка закрыта', value: 'task.completed', kind: 'boolean'},
        {label: 'Заявка приостановлена', value: 'task.frozen', kind: 'boolean'},
        {
          label: 'Организация клиента',
          value: 'client.organization.id',
          kind: 'entity-nullable',
          source: 'organizations'
        },
        {label: 'Канал обращения', value: 'client.sourceChannel', kind: 'text'}
      ]
    },

    graphActionTypes() {
      return [
        {label: 'Назначить линию поддержки', value: 'ASSIGN_LINE'},
        {label: 'Назначить наименее загруженного участника линии', value: 'ASSIGN_LEAST_LOADED'},
        {label: 'Назначить исполнителя', value: 'ASSIGN_USER'},
        {label: 'Очистить исполнителя', value: 'CLEAR_ASSIGNEE'},
        {label: 'Изменить приоритет', value: 'SET_PRIORITY'},
        {label: 'Изменить статус', value: 'SET_STATUS'},
        {label: 'Добавить тег', value: 'ADD_TAG'},
        {label: 'Удалить тег', value: 'REMOVE_TAG'},
        {label: 'Установить «Требует ответа»', value: 'SET_ANSWER_REQUIRED'}
      ]
    },

    supportLineOptions() {
      return this.toOptions(this.supportLines, item => item.name)
    },

    userOptions() {
      return (this.store.users || [])
        .filter(user => user && user.id !== undefined && user.id !== null)
        .map(user => ({
          label: `${user.lastname || ''} ${user.firstname || ''}`.trim() || user.username || `Пользователь ${user.id}`,
          value: user.id
        }))
    },

    graphExpression() {
      if (this.graphConditionGroups.length === 0) {
        return 'true'
      }

      const groups = []
      for (const group of this.graphConditionGroups) {
        if (!group.conditions.length) {
          return ''
        }
        const conditions = group.conditions.map(condition => this.buildConditionExpression(condition))
        if (conditions.some(value => !value)) {
          return ''
        }
        groups.push(`(${conditions.join(' and ')})`)
      }
      return groups.join(' or ')
    },

    graphAction() {
      const actions = this.graphActions.map(action => this.buildActionExpression(action))
      if (!actions.length || actions.some(value => !value)) {
        return ''
      }
      return actions.join('; ')
    },

    graphElseAction() {
      if (!this.elseBranchEnabled) {
        return ''
      }
      const actions = this.graphElseActions.map(action => this.buildActionExpression(action))
      if (!actions.length || actions.some(value => !value)) {
        return ''
      }
      return actions.join('; ')
    }
  },

  methods: {
    nextGraphId() {
      const id = this.graphSequence
      this.graphSequence += 1
      return id
    },

    toOptions(items, labelGetter, valueGetter = item => item.id) {
      return (items || [])
        .filter(item => item && item.id !== undefined && item.id !== null && item.active !== false)
        .map(item => ({label: labelGetter(item), value: valueGetter(item)}))
    },

    newCondition() {
      return {
        id: this.nextGraphId(),
        field: 'task.type.id',
        operator: 'equals',
        value: null
      }
    },

    newAction() {
      return {
        id: this.nextGraphId(),
        type: 'ASSIGN_LINE',
        value: this.supportLines.find(line => line.defaultSelection)?.id || null
      }
    },

    addConditionGroup() {
      this.graphConditionGroups.push({
        id: this.nextGraphId(),
        conditions: [this.newCondition()]
      })
    },

    removeConditionGroup(groupIndex) {
      this.graphConditionGroups.splice(groupIndex, 1)
    },

    addCondition(groupIndex) {
      this.graphConditionGroups[groupIndex].conditions.push(this.newCondition())
    },

    removeCondition(groupIndex, conditionIndex) {
      const group = this.graphConditionGroups[groupIndex]
      group.conditions.splice(conditionIndex, 1)
      if (group.conditions.length === 0) {
        this.removeConditionGroup(groupIndex)
      }
    },

    branchActions(branch) {
      return branch === 'no' ? this.graphElseActions : this.graphActions
    },

    addAction(branch = 'yes') {
      this.branchActions(branch).push(this.newAction())
    },

    removeAction(branch, actionIndex) {
      const actions = this.branchActions(branch)
      if (actions.length > 1) {
        actions.splice(actionIndex, 1)
      }
    },

    onElseBranchToggle(enabled) {
      if (enabled && this.graphElseActions.length === 0) {
        this.graphElseActions = [this.newAction()]
      }
    },

    conditionFieldMeta(field) {
      return this.graphConditionFields.find(item => item.value === field) || {kind: 'text'}
    },

    resetCondition(condition) {
      condition.operator = 'equals'
      condition.value = null
      const meta = this.conditionFieldMeta(condition.field)
      if (meta.kind === 'tag') {
        condition.operator = 'has_tag'
      } else if (meta.kind === 'text') {
        condition.operator = 'contains'
      }
    },

    conditionOperatorOptions(condition) {
      const kind = this.conditionFieldMeta(condition.field).kind
      if (kind === 'tag') {
        return [
          {label: 'содержит тег', value: 'has_tag'},
          {label: 'не содержит тег', value: 'no_tag'}
        ]
      }
      if (kind === 'text') {
        return [
          {label: 'содержит', value: 'contains'},
          {label: 'не содержит', value: 'not_contains'},
          {label: 'равно', value: 'equals'},
          {label: 'не равно', value: 'not_equals'}
        ]
      }
      return [
        {label: 'равно', value: 'equals'},
        {label: 'не равно', value: 'not_equals'}
      ]
    },

    conditionValueOptions(condition) {
      const meta = this.conditionFieldMeta(condition.field)
      let options = []
      switch (meta.source) {
        case 'taskTypes':
          options = this.toOptions(this.store.taskTypes, item => item.type || item.name)
          break
        case 'priorities':
          options = this.toOptions(this.store.priorities, item => item.name)
          break
        case 'statuses':
          options = this.toOptions(this.store.statuses, item => item.name)
          break
        case 'supportLines':
          options = this.supportLineOptions
          break
        case 'users':
          options = this.userOptions
          break
        case 'organizations':
          options = this.toOptions(this.store.organizations, item => item.name)
          break
        case 'tags':
          options = this.toOptions(this.store.tags, item => item.name, item => item.name)
          break
        default:
          options = []
      }
      if (meta.kind === 'boolean') {
        return [
          {label: 'Да', value: true},
          {label: 'Нет', value: false}
        ]
      }
      if (meta.kind === 'entity-nullable') {
        return [{label: 'Не назначено', value: '__NULL__'}, ...options]
      }
      return options
    },

    actionNeedsValue(action) {
      return !['CLEAR_ASSIGNEE', 'SET_ANSWER_REQUIRED'].includes(action.type)
    },

    actionValueOptions(action) {
      switch (action.type) {
        case 'ASSIGN_LINE':
        case 'ASSIGN_LEAST_LOADED':
          return this.supportLineOptions
        case 'ASSIGN_USER':
          return this.userOptions
        case 'SET_PRIORITY':
          return this.toOptions(this.store.priorities, item => item.name, item => item.name)
        case 'SET_STATUS':
          return this.toOptions(this.store.statuses, item => item.name, item => item.name)
        case 'ADD_TAG':
        case 'REMOVE_TAG':
          return this.toOptions(this.store.tags, item => item.name, item => item.name)
        default:
          return []
      }
    },

    escapeScriptString(value) {
      return String(value ?? '')
        .replaceAll('\\', '\\\\')
        .replaceAll("'", "\\'")
    },

    buildConditionExpression(condition) {
      if (!condition || !condition.field || condition.value === null || condition.value === undefined || condition.value === '') {
        return ''
      }
      const meta = this.conditionFieldMeta(condition.field)
      const quotedValue = `'${this.escapeScriptString(condition.value)}'`

      if (condition.value === '__NULL__') {
        return condition.operator === 'not_equals'
          ? `notNull(${condition.field})`
          : `isNull(${condition.field})`
      }
      if (meta.kind === 'tag') {
        const expression = `${condition.field}.hasTag(${quotedValue})`
        return condition.operator === 'no_tag' ? `!${expression}` : expression
      }
      if (meta.kind === 'text') {
        if (condition.operator === 'contains' || condition.operator === 'not_contains') {
          const expression = `${condition.field}.contains(${quotedValue})`
          return condition.operator === 'not_contains' ? `!${expression}` : expression
        }
        const expression = `${condition.field} = ${quotedValue}`
        return condition.operator === 'not_equals' ? `!(${expression})` : expression
      }

      const value = meta.kind === 'boolean' || typeof condition.value === 'number'
        ? String(condition.value)
        : quotedValue
      const expression = `${condition.field} = ${value}`
      return condition.operator === 'not_equals' ? `!(${expression})` : expression
    },

    buildActionExpression(action) {
      if (!action || !action.type) {
        return ''
      }
      if (action.type !== 'CLEAR_ASSIGNEE' && (action.value === null || action.value === undefined || action.value === '')) {
        return ''
      }
      const value = this.escapeScriptString(action.value)
      switch (action.type) {
        case 'ASSIGN_LINE':
          return `task.assignToGroup(${action.value})`
        case 'ASSIGN_LEAST_LOADED':
          return `task.assignToLeastLoadedMember(${action.value})`
        case 'ASSIGN_USER':
          return `task.assignToUser(${action.value})`
        case 'CLEAR_ASSIGNEE':
          return 'task.clearAssignee()'
        case 'SET_PRIORITY':
          return `task.setPriority('${value}')`
        case 'SET_STATUS':
          return `task.setStatus('${value}')`
        case 'ADD_TAG':
          return `task.addTag('${value}')`
        case 'REMOVE_TAG':
          return `task.removeTag('${value}')`
        case 'SET_ANSWER_REQUIRED':
          return 'client.setAnswerRequired()'
        default:
          return ''
      }
    },

    resetGraph() {
      this.graphSequence = 1
      this.graphConditionGroups = []
      this.graphActions = [this.newAction()]
      this.graphElseActions = []
      this.elseBranchEnabled = false
    },

    splitTopLevel(value, separator) {
      const result = []
      let start = 0
      let depth = 0
      let quote = null
      const marker = separator === ';' ? ';' : ` ${separator} `
      for (let index = 0; index < value.length; index++) {
        const char = value[index]
        if (quote) {
          if (char === quote && value[index - 1] !== '\\') quote = null
          continue
        }
        if (char === "'" || char === '"') {
          quote = char
          continue
        }
        if (char === '(') depth += 1
        if (char === ')') depth -= 1
        if (depth === 0 && value.startsWith(marker, index)) {
          result.push(value.slice(start, index).trim())
          start = index + marker.length
          index = start - 1
        }
      }
      result.push(value.slice(start).trim())
      return result.filter(Boolean)
    },

    stripOuterBrackets(value) {
      const trimmed = String(value || '').trim()
      return trimmed.startsWith('(') && trimmed.endsWith(')')
        ? trimmed.slice(1, -1).trim()
        : trimmed
    },

    parseGraphCondition(rawCondition) {
      let source = String(rawCondition || '').trim()
      let negative = false
      if (source.startsWith('!(') && source.endsWith(')')) {
        negative = true
        source = source.slice(2, -1).trim()
      } else if (source.startsWith('!')) {
        negative = true
        source = source.slice(1).trim()
      }

      let match = source.match(/^(isNull|notNull)\(([a-zA-Z0-9_.]+)\)$/)
      if (match) {
        return {
          id: this.nextGraphId(),
          field: match[2],
          operator: match[1] === 'notNull' ? 'not_equals' : 'equals',
          value: '__NULL__'
        }
      }

      match = source.match(/^task\.tags\.hasTag\('((?:\\'|[^'])*)'\)$/)
      if (match) {
        return {
          id: this.nextGraphId(),
          field: 'task.tags',
          operator: negative ? 'no_tag' : 'has_tag',
          value: match[1].replaceAll("\\'", "'")
        }
      }

      match = source.match(/^([a-zA-Z0-9_.]+)\.contains\('((?:\\'|[^'])*)'\)$/)
      if (match) {
        return {
          id: this.nextGraphId(),
          field: match[1],
          operator: negative ? 'not_contains' : 'contains',
          value: match[2].replaceAll("\\'", "'")
        }
      }

      match = source.match(/^([a-zA-Z0-9_.]+)\s*=\s*(.+)$/)
      if (!match || !this.graphConditionFields.some(item => item.value === match[1])) {
        return null
      }
      let value = match[2].trim()
      if ((value.startsWith("'") && value.endsWith("'")) || (value.startsWith('"') && value.endsWith('"'))) {
        value = value.slice(1, -1).replaceAll("\\'", "'")
      } else if (value === 'true' || value === 'false') {
        value = value === 'true'
      } else if (/^-?\d+(\.\d+)?$/.test(value)) {
        value = Number(value)
      }
      return {
        id: this.nextGraphId(),
        field: match[1],
        operator: negative ? 'not_equals' : 'equals',
        value
      }
    },

    parseGraphAction(rawAction) {
      const source = String(rawAction || '').trim()
      let match = source.match(/^task\.assignToGroup\((\d+)\)$/)
      if (match) return {id: this.nextGraphId(), type: 'ASSIGN_LINE', value: Number(match[1])}
      match = source.match(/^task\.assignToLeastLoadedMember\((\d+)\)$/)
      if (match) return {id: this.nextGraphId(), type: 'ASSIGN_LEAST_LOADED', value: Number(match[1])}
      match = source.match(/^task\.assignToUser\((\d+)\)$/)
      if (match) return {id: this.nextGraphId(), type: 'ASSIGN_USER', value: Number(match[1])}
      if (source === 'task.clearAssignee()') return {id: this.nextGraphId(), type: 'CLEAR_ASSIGNEE', value: null}
      match = source.match(/^task\.setPriority\('((?:\\'|[^'])*)'\)$/)
      if (match) return {id: this.nextGraphId(), type: 'SET_PRIORITY', value: match[1].replaceAll("\\'", "'")}
      match = source.match(/^task\.setStatus\('((?:\\'|[^'])*)'\)$/)
      if (match) return {id: this.nextGraphId(), type: 'SET_STATUS', value: match[1].replaceAll("\\'", "'")}
      match = source.match(/^task\.addTag\('((?:\\'|[^'])*)'\)$/)
      if (match) return {id: this.nextGraphId(), type: 'ADD_TAG', value: match[1].replaceAll("\\'", "'")}
      match = source.match(/^task\.removeTag\('((?:\\'|[^'])*)'\)$/)
      if (match) return {id: this.nextGraphId(), type: 'REMOVE_TAG', value: match[1].replaceAll("\\'", "'")}
      if (source === 'client.setAnswerRequired()') return {id: this.nextGraphId(), type: 'SET_ANSWER_REQUIRED', value: null}
      return null
    },

    readGraph(expression, action, elseAction) {
      this.resetGraph()
      const normalizedExpression = String(expression || '').trim()
      const normalizedAction = String(action || '').trim()
      const normalizedElseAction = String(elseAction || '').trim()

      if (normalizedExpression && normalizedExpression !== 'true') {
        const parsedGroups = []
        for (const rawGroup of this.splitTopLevel(normalizedExpression, 'or')) {
          const conditions = []
          for (const rawCondition of this.splitTopLevel(this.stripOuterBrackets(rawGroup), 'and')) {
            const parsed = this.parseGraphCondition(rawCondition)
            if (!parsed) return false
            conditions.push(parsed)
          }
          parsedGroups.push({id: this.nextGraphId(), conditions})
        }
        this.graphConditionGroups = parsedGroups
      }

      const parsedActions = []
      for (const rawAction of this.splitTopLevel(normalizedAction, ';')) {
        const parsed = this.parseGraphAction(rawAction)
        if (!parsed) return false
        parsedActions.push(parsed)
      }
      if (!parsedActions.length) return false
      this.graphActions = parsedActions

      if (normalizedElseAction) {
        const parsedElseActions = []
        for (const rawAction of this.splitTopLevel(normalizedElseAction, ';')) {
          const parsed = this.parseGraphAction(rawAction)
          if (!parsed) return false
          parsedElseActions.push(parsed)
        }
        if (!parsedElseActions.length) return false
        this.graphElseActions = parsedElseActions
        this.elseBranchEnabled = true
      }
      return true
    },

    editTrigger(row) {
      this.isNewTigger = false
      this.isNewTrigger = false
      this.dialogVisible = true
      this.dialogTriggerName = row.name
      this.dialogTriggerDescription = row.description
      this.dialogTriggerExpression = row.expression
      this.dialogTriggerAction = row.action
      this.dialogTriggerElseAction = row.elseAction || ''
      this.selectedTriggerType = row.triggerType
      this.triggerId = row.id
      this.dialogTriggerEnabled = row.automationRuleStatus !== 'DISABLED'
      this.dialogStopProcessing = Boolean(row.stopProcessing)
      this.testTaskId = null
      this.testResult = null
      const parsedWorkflow = parseWorkflowDefinition(row.workflowDefinition, row.triggerType)
      if (parsedWorkflow) {
        this.workflow = parsedWorkflow
        this.workflowValidation = {errors: [], warnings: []}
        this.editorMode = 'workflow'
      } else {
        this.workflow = legacyRuleToWorkflow(row)
        this.editorMode = this.readGraph(row.expression, row.action, row.elseAction) ? 'graph' : 'script'
      }
    },

    newTrigger() {
      this.dialogVisible = true
      this.isNewTrigger = true
      this.dialogTriggerName = ''
      this.dialogTriggerDescription = ''
      this.dialogTriggerExpression = ''
      this.dialogTriggerAction = ''
      this.dialogTriggerElseAction = ''
      this.selectedTriggerType = ''
      this.dialogTriggerEnabled = true
      this.dialogStopProcessing = false
      this.testTaskId = null
      this.testResult = null
      this.workflow = createDefaultWorkflow('TASK_CREATED')
      this.workflowValidation = {errors: [], warnings: []}
      this.editorMode = 'workflow'
      this.resetGraph()
      setTimeout(() => this.$refs.dialogTriggerName.focus(), 250)
    },

    dialogClose() {
      this.dialogVisible = false
    },

    async dialogSaveNewOrUpdateTrigger() {
      let workflowDefinition = null
      let workflowVersion = 1

      if (this.editorMode === 'workflow') {
        if (this.workflowValidation.errors?.length) {
          this.$q.notify({
            message: this.workflowValidation.errors[0],
            type: 'negative',
            position: 'top-right',
            actions: [{
              icon: 'close',
              color: 'white',
              dense: true,
              handler: () => undefined
            }]
          })
          return
        }

        workflowDefinition = JSON.stringify(this.workflow)
        workflowVersion = Number(this.workflow.version || 1)
        this.selectedTriggerType = getWorkflowTriggerType(this.workflow, 'TASK_CREATED')
        this.dialogTriggerExpression = 'true'
        this.dialogTriggerAction = 'workflow.run()'
        this.dialogTriggerElseAction = ''
      } else if (this.editorMode === 'graph') {
        this.dialogTriggerExpression = this.graphExpression
        this.dialogTriggerAction = this.graphAction
        this.dialogTriggerElseAction = this.graphElseAction
      }

      const currentTrigger = this.store.triggers.find(trigger => trigger.id === this.triggerId)
      const trigger = {
        id: this.isNewTrigger ? null : this.triggerId,
        name: this.dialogTriggerName,
        description: this.dialogTriggerDescription,
        expression: this.dialogTriggerExpression,
        action: this.dialogTriggerAction,
        elseAction: this.dialogTriggerElseAction || null,
        workflowDefinition,
        workflowVersion,
        triggerType: this.selectedTriggerType,
        automationRuleStatus: this.dialogTriggerEnabled ? 'ENABLED' : 'DISABLED',
        stopProcessing: this.dialogStopProcessing,
        orderNumber: this.isNewTrigger ? null : currentTrigger?.orderNumber
      }

      const invalidLegacyRule = this.editorMode !== 'workflow' && (
        !trigger.expression ||
        !trigger.action ||
        (this.editorMode === 'graph' && this.elseBranchEnabled && !trigger.elseAction)
      )

      if (!trigger.name?.trim() || !trigger.triggerType || invalidLegacyRule) {
        this.$q.notify({
          message: 'Не заполнены обязательные поля',
          type: 'negative',
          position: 'top-right',
          actions: [{
            icon: 'close', color: 'white', dense: true, handler: () => undefined
          }]
        })
        return
      }

      this.saving = true
      try {
        if (this.editorMode === 'workflow') {
          const validationResponse = await axios.post('/api/v1/automation/validate', {workflowDefinition})
          if (validationResponse.data?.valid === false) {
            throw new Error(validationResponse.data.errors?.[0] || 'Цепочка содержит ошибки')
          }
        }

        const response = this.isNewTrigger
          ? await axios.post('/api/v1/trigger', trigger)
          : await axios.patch('/api/v1/trigger', trigger)

        if (this.isNewTrigger) {
          this.store.triggers.push(response.data)
        } else {
          const index = this.store.triggers.findIndex(item => item.id === this.triggerId)
          if (index >= 0) this.store.triggers.splice(index, 1, response.data)
        }
        this.dialogClose()
      } catch (e) {
        this.$q.notify({
          message: e.response?.data?.message || e.message,
          type: 'negative',
          position: 'top-right',
          actions: [{
            icon: 'close', color: 'white', dense: true, handler: () => undefined
          }]
        })
      } finally {
        this.saving = false
      }
    },

    async toggleTrigger(trigger, enabled) {
      if (this.togglingTriggerIds.includes(trigger.id)) return

      this.togglingTriggerIds.push(trigger.id)
      const payload = {
        ...trigger,
        automationRuleStatus: enabled ? 'ENABLED' : 'DISABLED'
      }

      try {
        const response = await axios.patch('/api/v1/trigger', payload)
        const index = this.store.triggers.findIndex(item => item.id === response.data.id)
        if (index >= 0) {
          this.store.triggers.splice(index, 1, response.data)
        }
      } catch (e) {
        this.$q.notify({
          message: e.response?.data?.message || e.message,
          type: 'negative',
          position: 'top-right'
        })
      } finally {
        this.togglingTriggerIds = this.togglingTriggerIds.filter(id => id !== trigger.id)
      }
    },

    runRoutingTest() {
      if (!this.testTaskId) {
        this.$q.notify({
          message: 'Укажите ID заявки',
          type: 'negative',
          position: 'top-right'
        })
        return
      }

      let payload
      if (this.editorMode === 'workflow') {
        if (this.workflowValidation.errors?.length) {
          this.$q.notify({
            message: this.workflowValidation.errors[0],
            type: 'negative',
            position: 'top-right'
          })
          return
        }
        payload = {
          taskId: this.testTaskId,
          workflowDefinition: JSON.stringify(this.workflow)
        }
      } else {
        const expression = this.editorMode === 'graph' ? this.graphExpression : this.dialogTriggerExpression
        const action = this.editorMode === 'graph' ? this.graphAction : this.dialogTriggerAction
        const elseAction = this.editorMode === 'graph' ? this.graphElseAction : this.dialogTriggerElseAction
        if (!expression || !action) {
          this.$q.notify({
            message: 'Заполните правило',
            type: 'negative',
            position: 'top-right'
          })
          return
        }
        payload = {
          taskId: this.testTaskId,
          expression,
          action,
          elseAction: elseAction || null
        }
      }

      this.testLoading = true
      this.testResult = null
      axios.post('/api/v1/automation/test', payload)
        .then(response => {
          this.testResult = response.data
        })
        .catch(e => {
          this.testResult = {
            valid: false,
            matched: false,
            error: e.response?.data?.message || e.message
          }
        })
        .finally(() => {
          this.testLoading = false
        })
    },

    isWorkflowTestResult(result) {
      return result?.mode === 'WORKFLOW' || Array.isArray(result?.trace)
    },

    workflowTestResultTitle(result) {
      if (result?.executed) return 'Действия будут выполнены'
      if (result?.scheduled) return 'Маршрут остановится на ожидающем узле'
      if (result?.completed) return 'Маршрут завершится без выполнения действий'
      return 'Маршрут не дошёл до выполняемого действия'
    },

    workflowTraceStatusLabel(status) {
      const labels = {
        PASSED: 'пройдено',
        ROUTED: 'выбрана ветка',
        TRUE: 'условие истинно',
        FALSE: 'условие ложно',
        WOULD_EXECUTE: 'будет выполнено',
        EXECUTED: 'выполнено',
        WOULD_WAIT: 'будет ожидание',
        WOULD_WAIT_EVENT: 'будет ожидание события',
        WOULD_REQUEST_APPROVAL: 'будет запрошено согласование',
        WOULD_REQUEST: 'будет выполнен запрос',
        WOULD_START: 'будет запущено',
        COMPLETED: 'завершено',
        FAILED: 'ошибка',
        ERROR: 'ошибка',
        BLOCKED: 'заблокировано',
        ALLOWED: 'разрешено',
        UNIQUE: 'дубликат не найден',
        DUPLICATE: 'найден дубликат',
        SET: 'значение установлено',
        FORKED: 'ветки запущены',
        JOINED: 'ветки объединены'
      }
      return labels[status] || status || 'пройдено'
    },

    formatDateTime(value) {
      if (!value) return ''
      const date = new Date(value)
      if (Number.isNaN(date.getTime())) return value
      return date.toLocaleString('ru-RU')
    },

    dialogDeleteTrigger() {
      axios.delete(`/api/v1/trigger/${this.triggerId}`)
        .then(() => {
          this.store.triggers = this.store.triggers.filter(trigger => trigger.id !== this.triggerId)
          this.dialogClose()
        })
        .catch(e =>
          this.$q.notify({
            message: e.message,
            type: 'negative',
            position: 'top-right',
            actions: [{
              icon: 'close', color: 'white', dense: true, handler: () => undefined
            }]
          }))
    },

    loadSupportLines() {
      axios.get('/api/v1/support-lines')
        .then(response => {
          this.supportLines = response.data || []
          if (this.editorMode === 'graph' && this.graphActions.length === 1 && !this.graphActions[0].value) {
            this.graphActions[0].value = this.supportLines.find(line => line.defaultSelection)?.id || null
          }
        })
        .catch(e => console.warn('Support lines load failed', e))
    },

    // filterUsers (val, update) {
    //   update(() => {
    //     if (val) {
    //       this.filteredUsers = this.store.users
    //         .filter(user =>
    //           ['ADMIN', 'OPERATOR'].includes(user.authorities[0]) && this.getUserName(user).toLowerCase().includes(val.toLowerCase())
    //         )
    //         .map(user => this.getUserName(user))
    //     } else {
    //       this.filteredUsers = this.store.users
    //         .filter(user => ['ADMIN', 'OPERATOR'].includes(user.authorities[0]))
    //         .map(user => this.getUserName(user))
    //     }
    //   })
    // }
  },

  mounted() {
    this.loadSupportLines()
  },

  setup() {
    const store = useStore()
    watch(
      () => store.triggers.map(trigger => trigger.id).join(','),
      (currentOrder, previousOrder) => {
        if (!previousOrder || currentOrder === previousOrder) return
        axios.patch('/api/v1/triggers/resort', store.triggers)
          .catch(error => console.warn('Trigger resort failed', error))
      }
    )
    return {store}
  }
}
</script>

<style scoped>
.list-group-item:hover {
  background-color: #e3e3e3;
}

.automation-dialog {
  width: 1540px;
  max-width: 98vw;
}

.automation-editor-section {
  padding: 0 24px 30px;
}

.automation-editor-section > .q-field + .q-field {
  margin-top: 8px;
}

.automation-mode-toggle {
  margin-top: 20px;
  margin-bottom: 28px;
}

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

.automation-workflow-wrapper {
  min-height: 560px;
  margin-top: 4px;
}

.automation-workflow-validation {
  margin-top: 16px;
  white-space: pre-wrap;
}

.automation-workflow-validation > div + div {
  margin-top: 6px;
}

.automation-workflow-validation-error {
  border: 1px solid #ef9a9a;
  background: #ffebee;
  color: #c62828;
}

.automation-workflow-validation-warning {
  border: 1px solid #ffe082;
  background: #fffde7;
  color: #8d6e00;
}

.automation-preview {
  margin-top: 18px;
  border: 1px solid #e0e0e0;
  background: #f5f5f5;
  color: #616161;
  word-break: break-word;
}

.automation-preview > div + div {
  margin-top: 6px;
}

.automation-rule-options {
  margin-top: 18px;
  padding: 12px 0 4px;
}

.automation-test-panel {
  margin-top: 18px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background: #fff;
}

.automation-test-content {
  padding: 4px 18px 18px;
}

.automation-test-result {
  margin-top: 16px;
}

.automation-test-trace {
  display: grid;
  gap: 4px;
  white-space: pre-wrap;
}

.automation-test-trace-step {
  font-size: 12px;
  line-height: 1.35;
}

.automation-test-match {
  border: 1px solid #a5d6a7;
  background: #f1f8e9;
  color: #2e7d32;
}

.automation-test-miss {
  border: 1px solid #ffe082;
  background: #fffde7;
  color: #8d6e00;
}

.automation-test-error {
  border: 1px solid #ef9a9a;
  background: #ffebee;
  color: #c62828;
}

.automation-dialog-actions {
  padding: 12px 20px 16px;
}

@media (max-width: 900px) {
  .automation-dialog {
    width: 98vw;
  }

  .automation-editor-section {
    padding-right: 16px;
    padding-left: 16px;
  }

  .automation-graph {
    gap: 18px;
    padding: 20px;
  }
}
</style>
