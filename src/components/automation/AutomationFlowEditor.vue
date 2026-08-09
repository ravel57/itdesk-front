<template>
  <div class="flow-editor" tabindex="0" @keydown="onEditorKeydown">
    <div class="flow-toolbar">
      <div class="row items-center q-gutter-sm">
        <q-btn-dropdown outline dense no-caps icon="auto_awesome" label="Шаблоны">
          <q-list style="min-width: 300px">
            <q-item clickable v-close-popup @click="applyTemplate('priority')">
              <q-item-section avatar>
                <q-icon name="priority_high" color="deep-orange"/>
              </q-item-section>
              <q-item-section>
                <q-item-label>Маршрутизация по приоритету</q-item-label>
                <q-item-label caption>Критичные заявки направляются в отдельную ветку</q-item-label>
              </q-item-section>
            </q-item>
            <q-item clickable v-close-popup @click="applyTemplate('sla')">
              <q-item-section avatar>
                <q-icon name="timer" color="negative"/>
              </q-item-section>
              <q-item-section>
                <q-item-label>Эскалация по SLA</q-item-label>
                <q-item-label caption>Действие, задержка, проверка и эскалация</q-item-label>
              </q-item-section>
            </q-item>
            <q-item clickable v-close-popup @click="applyTemplate('reopen')">
              <q-item-section avatar>
                <q-icon name="replay" color="primary"/>
              </q-item-section>
              <q-item-section>
                <q-item-label>Возврат заявки в работу</q-item-label>
                <q-item-label caption>Очистка исполнителя и повторная маршрутизация</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </q-btn-dropdown>

        <q-separator vertical/>

        <q-btn flat round dense icon="undo" :disable="!canUndo" @click="undo">
          <q-tooltip>Отменить</q-tooltip>
        </q-btn>
        <q-btn flat round dense icon="redo" :disable="!canRedo" @click="redo">
          <q-tooltip>Повторить</q-tooltip>
        </q-btn>

        <q-separator vertical/>

        <q-btn flat round dense icon="zoom_out" :disable="zoom <= 0.5" @click="changeZoom(-0.1)"/>
        <div class="flow-zoom-label">{{ Math.round(zoom * 100) }}%</div>
        <q-btn flat round dense icon="zoom_in" :disable="zoom >= 1.6" @click="changeZoom(0.1)"/>
        <q-btn flat round dense icon="fit_screen" @click="fitView">
          <q-tooltip>Показать весь граф</q-tooltip>
        </q-btn>

        <q-separator vertical/>

        <q-btn
          flat
          round
          dense
          icon="delete_outline"
          color="negative"
          :disable="!selectedNode && !selectedEdgeId"
          @click="deleteSelection"
        >
          <q-tooltip>Удалить выбранное</q-tooltip>
        </q-btn>
      </div>

      <div class="row items-center q-gutter-sm">
        <q-chip
          dense
          :color="validation.errors.length ? 'negative' : validation.warnings.length ? 'warning' : 'positive'"
          text-color="white"
          :icon="validation.errors.length ? 'error' : validation.warnings.length ? 'warning' : 'check_circle'"
        >
          {{
            validation.errors.length ? `${validation.errors.length} ошибок` : validation.warnings.length ? `${validation.warnings.length} предупреждений` : 'Граф корректен'
          }}
        </q-chip>
        <q-btn
          v-if="pendingConnection"
          outline
          dense
          no-caps
          color="primary"
          icon="link_off"
          label="Отменить связь"
          @click="pendingConnection = null"
        />
      </div>
    </div>

    <div class="flow-main">
      <aside class="flow-palette">
        <div class="flow-side-title">Узлы</div>
        <div class="flow-side-caption">Добавьте шаг и соедините выход с входом другого узла.</div>

        <div
          v-for="group in paletteGroups"
          :key="group.id"
          class="flow-palette-group"
        >
          <button
            type="button"
            class="flow-palette-group-title"
            :aria-expanded="group.expanded"
            @click="group.expanded = !group.expanded"
          >
            <q-icon :name="group.icon" :color="group.color" size="17px"/>
            <span class="flow-palette-group-title-label">{{ group.label }}</span>
            <q-icon :name="group.expanded ? 'expand_less' : 'expand_more'" size="18px"/>
          </button>

          <q-slide-transition>
            <div v-show="group.expanded" class="flow-palette-group-items">
              <q-btn
                v-for="item in group.items"
                :key="item.type"
                outline
                no-caps
                align="left"
                class="flow-palette-btn full-width"
                :icon="item.icon"
                :color="item.color"
                :label="item.label"
                :disable="item.type === 'EVENT' && hasEventNode"
                @click="addNode(item.type)"
              />
            </div>
          </q-slide-transition>
        </div>

        <q-separator class="q-my-md"/>

        <div class="flow-side-title">Как соединять</div>
        <div class="flow-help-step"><span>1</span> Нажмите цветной выход справа.</div>
        <div class="flow-help-step"><span>2</span> Нажмите вход слева у следующего узла.</div>
        <div class="flow-help-step"><span>3</span> Для условия соедините отдельно «ДА» и «НЕТ».</div>
      </aside>

      <section class="flow-workspace">
        <div
          ref="viewport"
          class="flow-viewport"
          :class="{ 'flow-viewport--connecting': pendingConnection }"
          @mousedown.self="startPan"
          @click.self="clearSelection"
        >
          <div class="flow-surface" :style="surfaceStyle">
            <div class="flow-zoom-layer" :style="zoomLayerStyle">
              <svg class="flow-edges" :width="canvasWidth" :height="canvasHeight">
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

                <g v-for="edge in renderedEdges" :key="edge.id">
                  <path
                    class="flow-edge-hit"
                    :d="edge.path"
                    @click.stop="selectEdge(edge.id)"
                  />
                  <path
                    class="flow-edge-line"
                    :class="[
                      `flow-edge-line--${edge.handle}`,
                      { 'flow-edge-line--selected': selectedEdgeId === edge.id }
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
                </g>
              </svg>

              <div
                v-for="node in localFlow.nodes"
                :key="node.id"
                class="flow-node"
                :class="[
                  `flow-node--${node.type.toLowerCase()}`,
                  { 'flow-node--selected': selectedNodeId === node.id }
                ]"
                :style="nodeStyle(node)"
                @click.stop="selectNode(node.id)"
              >
                <button
                  v-if="node.type !== 'EVENT'"
                  type="button"
                  class="flow-port flow-port--input"
                  :class="{ 'flow-port--ready': pendingConnection && pendingConnection.source !== node.id }"
                  :style="inputPortStyle(node)"
                  @click.stop="completeConnection(node.id)"
                >
                  <q-tooltip>Вход</q-tooltip>
                </button>

                <div class="flow-node-header" @mousedown.stop.prevent="startNodeDrag($event, node)">
                  <q-icon :name="nodeIcon(node.type)" :color="nodeColor(node.type)" size="20px"/>
                  <div class="flow-node-title ellipsis">{{ node.label || nodeTypeLabel(node.type) }}</div>
                  <q-btn flat round dense size="sm" icon="more_vert" @mousedown.stop @click.stop>
                    <q-menu>
                      <q-list dense style="min-width: 180px">
                        <q-item clickable v-close-popup @click="duplicateNode(node)" :disable="node.type === 'EVENT'">
                          <q-item-section avatar>
                            <q-icon name="content_copy"/>
                          </q-item-section>
                          <q-item-section>Дублировать</q-item-section>
                        </q-item>
                        <q-item clickable v-close-popup @click="deleteNode(node.id)" :disable="node.type === 'EVENT'">
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
                  <div class="flow-node-kind">{{ nodeTypeLabel(node.type) }}</div>
                  <div class="flow-node-summary">{{ nodeSummary(node) }}</div>
                </div>

                <template v-for="port in outputPorts(node)" :key="port.handle">
                  <button
                    type="button"
                    class="flow-port flow-port--output"
                    :class="[
                      `flow-port--${port.handle}`,
                      { 'flow-port--active': pendingConnection?.source === node.id && pendingConnection?.handle === port.handle }
                    ]"
                    :style="outputPortStyle(node, port)"
                    @click.stop="beginConnection(node.id, port.handle)"
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

      <aside class="flow-inspector">
        <div class="flow-side-title">Настройка узла</div>

        <div v-if="!selectedNode" class="flow-inspector-empty">
          <q-icon name="touch_app" size="42px" color="grey-5"/>
          <div>Выберите узел на схеме</div>
        </div>

        <template v-else>
          <q-input
            v-model="selectedNode.label"
            dense
            outlined
            label="Название узла"
            @change="commit"
          />

          <template v-if="selectedNode.type === 'EVENT'">
            <q-select
              v-model="selectedNode.config.triggerType"
              outlined
              dense
              label="Событие *"
              :options="triggerTypeOptions"
              emit-value
              map-options
              class="q-mt-md"
              @update:model-value="commit"
            />
            <q-banner rounded class="bg-blue-1 text-blue-9 q-mt-md">
              Сценарий запускается только этим событием. В одном графе может быть один стартовый узел.
            </q-banner>
          </template>

          <template v-else-if="selectedNode.type === 'CONDITION'">
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
                <div class="flow-condition-group q-mt-sm">
                  <div class="row items-center justify-between">
                    <div class="text-caption text-grey-7">Все условия группы — И</div>
                    <q-btn flat round dense size="sm" icon="delete_outline" color="negative"
                           @click="removeConditionGroup(selectedNode, groupIndex)"/>
                  </div>

                  <div v-for="(condition, conditionIndex) in group.conditions" :key="condition.id"
                       class="flow-condition-item">
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
                        no-caps
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
                    no-caps
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
                  no-caps
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

          <template v-else-if="selectedNode.type === 'ACTION'">
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
              autogrow
              type="textarea"
              label="Сценарий действий *"
              class="q-mt-sm"
              @change="commit"
            />

            <template v-else>
              <div v-for="(action, actionIndex) in nodeActions(selectedNode)" :key="action.id"
                   class="flow-action-item q-mt-sm">
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
                    no-caps
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
                no-caps
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
            <q-btn outline dense no-caps icon="content_copy" label="Дублировать"
                   :disable="selectedNode.type === 'EVENT'" @click="duplicateNode(selectedNode)"/>
            <q-btn
              unelevated
              no-caps
              color="negative"
              icon="delete"
              dense
              label="Удалить"
              :disable="selectedNode.type === 'EVENT'"
              @click="deleteNode(selectedNode.id)"
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
  </div>
</template>

<script>
import {nextTick} from 'vue'
import AutomationAdvancedNodeInspector from 'src/components/automation/AutomationAdvancedNodeInspector.vue'
import AutomationExpressionInput from 'src/components/automation/AutomationExpressionInput.vue'
import {
  createDefaultWorkflow,
  createEdge,
  createNode,
  deepClone,
  nextFlowId,
  normalizeWorkflow
} from 'src/util/automationFlow'

const EVENT_LABELS = {
  TASK_CREATED: 'Заявка создана',
  TASK_UPDATED: 'Заявка изменена',
  TASK_STATUS_CHANGED: 'Изменён статус заявки',
  TASK_PRIORITY_CHANGED: 'Изменён приоритет заявки',
  TASK_TYPE_CHANGED: 'Изменён тип заявки',
  TASK_SERVICE_CHANGED: 'Изменён сервис заявки',
  TASK_ASSIGNEE_CHANGED: 'Изменён исполнитель',
  TASK_GROUP_CHANGED: 'Изменена линия поддержки',
  TASK_TAG_ADDED: 'Добавлен тег',
  TASK_TAG_REMOVED: 'Удалён тег',
  TASK_CLOSED: 'Заявка закрыта',
  TASK_REOPENED: 'Заявка возвращена в работу',
  SLA_WARNING: 'Предупреждение SLA',
  SLA_BREACHED: 'SLA нарушен',
  MESSAGE_INCOMING: 'Входящее сообщение',
  MESSAGE_OUTGOING: 'Исходящее сообщение',
  INACTIVITY_TIMEOUT: 'Нет активности',
  SCHEDULED_CRON: 'По расписанию'
}

const NODE_SIZES = {
  EVENT: {width: 250, height: 145},
  CONDITION: {width: 310, height: 185},
  SWITCH: {width: 310, height: 185},
  ACTION: {width: 310, height: 185},
  DELAY: {width: 245, height: 145},
  WAIT_UNTIL: {width: 260, height: 150},
  WAIT_EVENT: {width: 280, height: 165},
  WAIT_TASK: {width: 280, height: 165},
  APPROVAL: {width: 280, height: 165},
  SUBFLOW: {width: 265, height: 150},
  FORK: {width: 280, height: 175},
  JOIN: {width: 230, height: 125},
  HTTP_REQUEST: {width: 290, height: 165},
  SET_VARIABLE: {width: 265, height: 145},
  EXPRESSION: {width: 265, height: 145},
  COUNTER: {width: 245, height: 135},
  ERROR_HANDLER: {width: 290, height: 165},
  RETRY: {width: 275, height: 160},
  ESCALATE: {width: 275, height: 160},
  CREATE_TASK: {width: 280, height: 165},
  NOTIFY: {width: 265, height: 145},
  BUSINESS_HOURS: {width: 265, height: 150},
  THROTTLE: {width: 265, height: 150},
  DEDUPLICATE: {width: 275, height: 155},
  NOTE: {width: 245, height: 135},
  END: {width: 220, height: 120}
}

const ADVANCED_NODE_TYPES = [
  'SWITCH', 'WAIT_UNTIL', 'WAIT_EVENT', 'WAIT_TASK', 'APPROVAL', 'SUBFLOW', 'FORK', 'JOIN',
  'HTTP_REQUEST', 'SET_VARIABLE', 'EXPRESSION', 'COUNTER', 'ERROR_HANDLER', 'RETRY', 'ESCALATE',
  'CREATE_TASK', 'NOTIFY', 'BUSINESS_HOURS', 'THROTTLE', 'DEDUPLICATE'
]

export default {
  name: 'AutomationFlowEditor',
  components: {AutomationAdvancedNodeInspector, AutomationExpressionInput},

  props: {
    modelValue: {type: Object, required: true},
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
      selectedNodeId: null,
      selectedEdgeId: null,
      pendingConnection: null,
      zoom: 0.9,
      canvasWidth: 2200,
      canvasHeight: 1300,
      dragState: null,
      panState: null,
      history: [],
      historyIndex: -1,
      syncingExternal: false,
      paletteGroups: [
        {
          id: 'flow',
          label: 'Старт и структура',
          icon: 'account_tree',
          color: 'indigo-7',
          expanded: false,
          items: [
            {type: 'EVENT', label: 'Событие', icon: 'bolt', color: 'indigo-6'},
            {type: 'SUBFLOW', label: 'Подпроцесс', icon: 'account_tree', color: 'indigo-7'},
            {type: 'END', label: 'Завершение', icon: 'flag', color: 'indigo-8'}
          ]
        },
        {
          id: 'logic',
          label: 'Условия и ветвление',
          icon: 'schema',
          color: 'orange-8',
          expanded: false,
          items: [
            {type: 'CONDITION', label: 'Условие ДА/НЕТ', icon: 'call_split', color: 'orange-6'},
            {type: 'SWITCH', label: 'Варианты значения', icon: 'alt_route', color: 'orange-7'},
            {type: 'BUSINESS_HOURS', label: 'Рабочее время', icon: 'schedule', color: 'orange-8'},
            {type: 'FORK', label: 'Разделить ветки', icon: 'fork_right', color: 'orange-9'},
            {type: 'JOIN', label: 'Объединить ветки', icon: 'merge', color: 'deep-orange-8'}
          ]
        },
        {
          id: 'tasks',
          label: 'Заявки и коммуникации',
          icon: 'support_agent',
          color: 'teal-7',
          expanded: false,
          items: [
            {type: 'ACTION', label: 'Действия', icon: 'play_arrow', color: 'teal-5'},
            {type: 'ESCALATE', label: 'Эскалация', icon: 'trending_up', color: 'teal-6'},
            {type: 'CREATE_TASK', label: 'Создать заявку', icon: 'add_task', color: 'teal-7'},
            {type: 'NOTIFY', label: 'Уведомление', icon: 'notifications', color: 'teal-8'}
          ]
        },
        {
          id: 'waiting',
          label: 'Ожидание и участие человека',
          icon: 'hourglass_top',
          color: 'purple-7',
          expanded: false,
          items: [
            {type: 'DELAY', label: 'Задержка', icon: 'hourglass_bottom', color: 'purple-5'},
            {type: 'WAIT_UNTIL', label: 'Ждать до момента', icon: 'event', color: 'purple-6'},
            {type: 'WAIT_EVENT', label: 'Ждать событие', icon: 'notifications_active', color: 'purple-7'},
            {type: 'WAIT_TASK', label: 'Ждать заявку', icon: 'task_alt', color: 'purple-8'},
            {type: 'APPROVAL', label: 'Ручное решение', icon: 'approval', color: 'purple-9'}
          ]
        },
        {
          id: 'data',
          label: 'Данные и интеграции',
          icon: 'data_object',
          color: 'blue-grey-7',
          expanded: false,
          items: [
            {type: 'HTTP_REQUEST', label: 'HTTP-запрос', icon: 'http', color: 'blue-grey-5'},
            {type: 'SET_VARIABLE', label: 'Переменная', icon: 'data_object', color: 'blue-grey-6'},
            {type: 'EXPRESSION', label: 'Вычисление', icon: 'calculate', color: 'blue-grey-7'},
            {type: 'COUNTER', label: 'Счётчик', icon: 'exposure_plus_1', color: 'blue-grey-8'}
          ]
        },
        {
          id: 'reliability',
          label: 'Ошибки и контроль',
          icon: 'shield',
          color: 'red-7',
          expanded: false,
          items: [
            {type: 'ERROR_HANDLER', label: 'Обработка ошибки', icon: 'error_outline', color: 'red-5'},
            {type: 'RETRY', label: 'Повтор', icon: 'replay', color: 'red-6'},
            {type: 'THROTTLE', label: 'Ограничить частоту', icon: 'speed', color: 'red-7'},
            {type: 'DEDUPLICATE', label: 'Найти дубликат', icon: 'content_copy', color: 'red-8'}
          ]
        },
        {
          id: 'documentation',
          label: 'Документация',
          icon: 'description',
          color: 'grey-7',
          expanded: false,
          items: [
            {type: 'NOTE', label: 'Комментарий', icon: 'sticky_note_2', color: 'grey-7'}
          ]
        }
      ],
      delayUnits: [
        {label: 'сек.', value: 'SECONDS'},
        {label: 'мин.', value: 'MINUTES'},
        {label: 'ч.', value: 'HOURS'},
        {label: 'дн.', value: 'DAYS'}
      ],
      conditionFields: [
        {label: 'Тип заявки', value: 'task.type.id', kind: 'entity', source: 'taskTypes'},
        {label: 'Сервис', value: 'task.service.id', kind: 'nullable-entity', source: 'services'},
        {label: 'Приоритет', value: 'task.priority.id', kind: 'entity', source: 'priorities'},
        {label: 'Статус', value: 'task.status.id', kind: 'entity', source: 'statuses'},
        {label: 'Линия поддержки', value: 'task.supportLine.id', kind: 'nullable-entity', source: 'supportLines'},
        {label: 'Исполнитель', value: 'task.executor.id', kind: 'nullable-entity', source: 'users'},
        {label: 'Тег', value: 'task.tags', kind: 'tag', source: 'tags'},
        {label: 'Название заявки', value: 'task.name', kind: 'text'},
        {label: 'Описание заявки', value: 'task.description', kind: 'text'},
        {label: 'Заявка закрыта', value: 'task.completed', kind: 'boolean'},
        {label: 'Заявка приостановлена', value: 'task.frozen', kind: 'boolean'},
        {
          label: 'Организация клиента',
          value: 'client.organization.id',
          kind: 'nullable-entity',
          source: 'organizations'
        },
        {label: 'Канал обращения', value: 'client.sourceChannel', kind: 'text'},
        {label: 'Текст сообщения', value: 'message.text', kind: 'text'},
        {label: 'Сейчас рабочее время', value: '__WORKING_HOURS__', kind: 'function-boolean'},
        {label: 'Сейчас выходной', value: '__WEEKEND__', kind: 'function-boolean'}
      ],
      actionTypes: [
        {label: 'Назначить линию поддержки', value: 'ASSIGN_LINE'},
        {label: 'Назначить наименее загруженного участника линии', value: 'ASSIGN_LEAST_LOADED'},
        {label: 'Назначить конкретного исполнителя', value: 'ASSIGN_USER'},
        {label: 'Очистить исполнителя', value: 'CLEAR_ASSIGNEE'},
        {label: 'Изменить приоритет', value: 'SET_PRIORITY'},
        {label: 'Изменить статус', value: 'SET_STATUS'},
        {label: 'Добавить тег', value: 'ADD_TAG'},
        {label: 'Удалить тег', value: 'REMOVE_TAG'},
        {label: 'Изменить название заявки', value: 'SET_NAME'},
        {label: 'Изменить описание заявки', value: 'SET_DESCRIPTION'},
        {label: 'Установить дедлайн через N минут', value: 'SET_DEADLINE_MINUTES'},
        {label: 'Очистить дедлайн', value: 'CLEAR_DEADLINE'},
        {label: 'Отправить сообщение клиенту', value: 'SEND_MESSAGE'},
        {label: 'Установить «Требует ответа»', value: 'SET_ANSWER_REQUIRED'}
      ]
    }
  },

  computed: {
    advancedNodeTypes() {
      return ADVANCED_NODE_TYPES
    },

    selectedNode() {
      return this.localFlow.nodes.find(node => node.id === this.selectedNodeId) || null
    },

    expressionVariables() {
      const variables = new Set()
      for (const node of this.localFlow.nodes || []) {
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

    hasEventNode() {
      return this.localFlow.nodes.some(node => node.type === 'EVENT')
    },

    triggerTypeOptions() {
      return (this.triggerTypes || []).map(value => ({
        value,
        label: EVENT_LABELS[value] || value
      }))
    },

    nodeMap() {
      return new Map(this.localFlow.nodes.map(node => [node.id, node]))
    },

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
          marker: this.edgeMarker(handle),
          label: this.edgeHandleLabel(source, handle),
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
    },

    validation() {
      const errors = []
      const warnings = []
      const nodes = this.localFlow.nodes
      const edges = this.localFlow.edges
      const nodeIds = new Set(nodes.map(node => node.id))
      const events = nodes.filter(node => node.type === 'EVENT')
      if (events.length !== 1) errors.push('В графе должен быть ровно один узел события')
      if (!this.localFlow.entryNodeId || !nodeIds.has(this.localFlow.entryNodeId)) errors.push('Не указан стартовый узел')

      edges.forEach(edge => {
        if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) errors.push('Есть связь с удалённым узлом')
      })

      const incoming = new Map()
      nodes.forEach(node => incoming.set(node.id, 0))
      edges.forEach(edge => incoming.set(edge.target, (incoming.get(edge.target) || 0) + 1))

      nodes.forEach(node => {
        const type = node.type
        const config = node.config || {}
        if (type !== 'EVENT' && !incoming.get(node.id)) warnings.push(`Узел «${node.label}» не имеет входа`)
        if (type === 'EVENT' && !config.triggerType) errors.push('В стартовом узле не выбрано событие')

        const requiredHandles = this.requiredOutputHandles(node)
        requiredHandles.forEach(handle => {
          if (!this.hasEdge(node.id, handle)) errors.push(`У узла «${node.label}» не подключён выход «${this.edgeHandleLabel(node, handle) || handle}»`)
        })

        if (type === 'END' && edges.some(edge => edge.source === node.id)) errors.push(`Из конечного узла «${node.label}» не должно быть связи`)
        if (type === 'CONDITION' && !config.expression) errors.push(`Не заполнено условие «${node.label}»`)
        if (type === 'SWITCH') {
          if (!config.valueExpression) errors.push(`Не указано значение для SWITCH «${node.label}»`)
          if (!Array.isArray(config.cases) || !config.cases.length) errors.push(`В SWITCH «${node.label}» нет вариантов`)
        }
        if (type === 'ACTION' && !config.actionScript) errors.push(`В узле «${node.label}» нет действий`)
        if (type === 'DELAY' && Number(config.amount || 0) < 1) errors.push(`В узле «${node.label}» некорректная задержка`)
        if (type === 'WAIT_EVENT' || type === 'WAIT_TASK') {
          if (!config.eventType) errors.push(`В узле «${node.label}» не выбрано ожидаемое событие`)
          if (type === 'WAIT_TASK' && !config.taskIdExpression) errors.push(`В узле «${node.label}» не указан ID заявки`)
        }
        if (type === 'APPROVAL' && !config.title) errors.push(`У ручного решения «${node.label}» нет заголовка`)
        if (type === 'SUBFLOW' && !config.triggerId) errors.push(`В узле «${node.label}» не выбран подпроцесс`)
        if (type === 'FORK') {
          if (!config.joinNodeId || !nodeIds.has(config.joinNodeId)) {
            errors.push(`У FORK «${node.label}» не выбран JOIN`)
          } else if (this.nodeMap.get(config.joinNodeId)?.type !== 'JOIN') {
            errors.push(`У FORK «${node.label}» выбран узел, который не является JOIN`)
          } else {
            for (const branch of config.branches || []) {
              const start = this.edgeTarget(node.id, `branch:${branch.id}`)
              if (!start) continue
              const result = this.validateForkPath(start, config.joinNodeId, new Set())
              if (!result.reachesJoin) errors.push(`Ветка «${branch.label || branch.id}» должна завершаться выбранным JOIN`)
              if (result.asyncNode) errors.push(`Ветка «${branch.label || branch.id}» содержит ожидание «${result.asyncNode}». Вынесите его после JOIN`)
            }
          }
          if (!Array.isArray(config.branches) || config.branches.length < 2) errors.push(`У FORK «${node.label}» должно быть минимум две ветки`)
        }
        if (type === 'HTTP_REQUEST' && (!config.url || !config.method)) errors.push(`В HTTP-узле «${node.label}» не заполнены метод и URL`)
        if (['SET_VARIABLE', 'EXPRESSION', 'COUNTER'].includes(type) && !config.name) errors.push(`В узле «${node.label}» не указано имя переменной`)
        if (['ERROR_HANDLER', 'RETRY'].includes(type) && !config.actionScript) errors.push(`В узле «${node.label}» не заполнен сценарий`)
        if (type === 'ESCALATE' && !config.supportLineId) errors.push(`В эскалации «${node.label}» не выбрана линия`)
        if (type === 'CREATE_TASK' && !config.title) errors.push(`В узле создания заявки «${node.label}» нет названия`)
        if (type === 'NOTIFY' && !config.text) errors.push(`В уведомлении «${node.label}» нет текста`)
        if (type === 'THROTTLE' && Number(config.amount || 0) < 1) errors.push(`В ограничителе «${node.label}» некорректный интервал`)
        if (type === 'DEDUPLICATE' && Number(config.windowMinutes || 0) < 1) errors.push(`В поиске дубля «${node.label}» некорректный период`)
      })

      if (this.hasCycle()) errors.push('Произвольные циклические связи запрещены. Для повторов используйте узел «Повтор»')
      return {errors: [...new Set(errors)], warnings: [...new Set(warnings)]}
    },

    canUndo() {
      return this.historyIndex > 0
    },

    canRedo() {
      return this.historyIndex >= 0 && this.historyIndex < this.history.length - 1
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
    },

    validation: {
      deep: true,
      immediate: true,
      handler(value) {
        this.$emit('validation-change', deepClone(value))
      }
    }
  },

  mounted() {
    this.resetHistory()
    this.$refs.viewport?.addEventListener('wheel', this.onWheel, {passive: false})
    window.addEventListener('mousemove', this.onGlobalMouseMove)
    window.addEventListener('mouseup', this.onGlobalMouseUp)
    nextTick(() => this.fitView())
  },

  beforeUnmount() {
    this.$refs.viewport?.removeEventListener('wheel', this.onWheel)
    window.removeEventListener('mousemove', this.onGlobalMouseMove)
    window.removeEventListener('mouseup', this.onGlobalMouseUp)
  },

  methods: {
    nodeSize(node) {
      return NODE_SIZES[node?.type] || NODE_SIZES.NOTE
    },

    nodeStyle(node) {
      const size = this.nodeSize(node)
      return {
        left: `${node.x}px`,
        top: `${node.y}px`,
        width: `${size.width}px`,
        height: `${size.height}px`
      }
    },

    nodeIcon(type) {
      return {
        EVENT: 'bolt', CONDITION: 'call_split', SWITCH: 'alt_route', ACTION: 'play_arrow',
        DELAY: 'hourglass_bottom', WAIT_UNTIL: 'event', WAIT_EVENT: 'notifications_active', WAIT_TASK: 'task_alt',
        APPROVAL: 'approval', SUBFLOW: 'account_tree', FORK: 'fork_right', JOIN: 'merge', HTTP_REQUEST: 'http',
        SET_VARIABLE: 'data_object', EXPRESSION: 'calculate', COUNTER: 'exposure_plus_1',
        ERROR_HANDLER: 'error_outline', RETRY: 'replay', ESCALATE: 'trending_up', CREATE_TASK: 'add_task',
        NOTIFY: 'notifications', BUSINESS_HOURS: 'schedule', THROTTLE: 'speed', DEDUPLICATE: 'content_copy',
        NOTE: 'sticky_note_2', END: 'flag'
      }[type] || 'crop_square'
    },

    nodeColor(type) {
      return {
        EVENT: 'indigo-6', SUBFLOW: 'indigo-7', END: 'indigo-8',
        CONDITION: 'orange-6', SWITCH: 'orange-7', BUSINESS_HOURS: 'orange-8', FORK: 'orange-9', JOIN: 'deep-orange-8',
        ACTION: 'teal-5', ESCALATE: 'teal-6', CREATE_TASK: 'teal-7', NOTIFY: 'teal-8',
        DELAY: 'purple-5', WAIT_UNTIL: 'purple-6', WAIT_EVENT: 'purple-7', WAIT_TASK: 'purple-8', APPROVAL: 'purple-9',
        HTTP_REQUEST: 'blue-grey-5', SET_VARIABLE: 'blue-grey-6', EXPRESSION: 'blue-grey-7', COUNTER: 'blue-grey-8',
        ERROR_HANDLER: 'red-5', RETRY: 'red-6', THROTTLE: 'red-7', DEDUPLICATE: 'red-8',
        NOTE: 'grey-7'
      }[type] || 'grey'
    },

    nodeTypeLabel(type) {
      return {
        EVENT: 'Стартовое событие', CONDITION: 'Проверка условия', SWITCH: 'Многовариантное ветвление',
        ACTION: 'Последовательность действий', DELAY: 'Отложенное продолжение', WAIT_UNTIL: 'Ожидание момента',
        WAIT_EVENT: 'Ожидание события', WAIT_TASK: 'Ожидание связанной заявки', APPROVAL: 'Ручное решение',
        SUBFLOW: 'Вызов автоматизации', FORK: 'Разделение на ветки', JOIN: 'Объединение веток',
        HTTP_REQUEST: 'Внешний HTTP-запрос', SET_VARIABLE: 'Запись переменной', EXPRESSION: 'Вычисление значения',
        COUNTER: 'Изменение счётчика', ERROR_HANDLER: 'Действие с веткой ошибки', RETRY: 'Повтор с backoff',
        ESCALATE: 'Эскалация заявки', CREATE_TASK: 'Создание связанной заявки', NOTIFY: 'Отправка уведомления',
        BUSINESS_HOURS: 'Разветвление по рабочему времени', THROTTLE: 'Ограничение частоты',
        DEDUPLICATE: 'Поиск похожей заявки', NOTE: 'Комментарий', END: 'Конец ветки'
      }[type] || type
    },

    nodeSummary(node) {
      const c = node.config || {}
      if (node.type === 'EVENT') return EVENT_LABELS[c.triggerType] || c.triggerType || 'Событие не выбрано'
      if (node.type === 'CONDITION') return c.expression || 'Условие не заполнено'
      if (node.type === 'SWITCH') return `${c.valueExpression || 'значение не задано'} · вариантов: ${(c.cases || []).length}`
      if (node.type === 'ACTION') {
        const actions = Array.isArray(c.actions) ? c.actions : []
        if (c.manualScript) return c.actionScript || 'Скрипт не заполнен'
        if (!actions.length) return 'Нет действий'
        return actions.map(action => this.actionTypes.find(item => item.value === action.type)?.label || action.type).join(' → ')
      }
      if (node.type === 'DELAY') return `${c.amount || 0} ${this.delayUnits.find(item => item.value === c.unit)?.label || ''}`
      if (node.type === 'WAIT_UNTIL') return c.mode === 'FIXED' ? (c.dateTime || 'Дата не задана') : (c.mode || 'Режим не выбран')
      if (node.type === 'WAIT_EVENT') return `${EVENT_LABELS[c.eventType] || c.eventType || 'Событие не выбрано'} · ${c.scope || 'TASK'}`
      if (node.type === 'WAIT_TASK') return `${EVENT_LABELS[c.eventType] || c.eventType || 'Событие'} · заявка ${c.taskIdExpression || '?'}`
      if (node.type === 'APPROVAL') return c.title || 'Решение не настроено'
      if (node.type === 'SUBFLOW') return `Автоматизация #${c.triggerId || '?'} · ${c.mode || 'INLINE'}`
      if (node.type === 'FORK') return `${(c.branches || []).length} ветки → ${c.joinNodeId || 'JOIN не выбран'}`
      if (node.type === 'JOIN') return c.description || 'Синхронизация веток'
      if (node.type === 'HTTP_REQUEST') return `${c.method || 'GET'} ${c.url || 'URL не задан'}`
      if (node.type === 'SET_VARIABLE' || node.type === 'EXPRESSION') return `var.${c.name || '?'} = ${c.expression || '?'}`
      if (node.type === 'COUNTER') return `var.${c.name || '?'} ${c.operation || 'ADD'} ${c.amountExpression || 1}`
      if (node.type === 'ERROR_HANDLER' || node.type === 'RETRY') return c.actionScript || 'Сценарий не заполнен'
      if (node.type === 'ESCALATE') return `Линия #${c.supportLineId || '?'}${c.priorityName ? ` · ${c.priorityName}` : ''}`
      if (node.type === 'CREATE_TASK') return c.title || 'Название не задано'
      if (node.type === 'NOTIFY') return `${c.channel || 'CLIENT'} · ${c.text || 'Текст не задан'}`
      if (node.type === 'BUSINESS_HOURS') return 'Рабочее время / вне работы / выходной'
      if (node.type === 'THROTTLE') return `${c.scope || 'TASK'} · ${c.amount || 1} ${this.delayUnits.find(item => item.value === c.unit)?.label || ''}`
      if (node.type === 'DEDUPLICATE') return `Окно ${c.windowMinutes || 0} мин. · ${c.titleMode || 'NONE'}`
      if (node.type === 'NOTE') return c.text || 'Комментарий к схеме'
      if (node.type === 'END') return c.result || 'Сценарий завершён'
      return ''
    },

    inputPoint(node) {
      const size = this.nodeSize(node)
      return {x: node.x, y: node.y + size.height / 2}
    },

    outputPoint(node, handle) {
      const size = this.nodeSize(node)
      const port = this.outputPorts(node).find(item => item.handle === handle) || {yRatio: 0.5}
      return {x: node.x + size.width, y: node.y + size.height * port.yRatio}
    },

    inputPortStyle(node) {
      const size = this.nodeSize(node)
      return {top: `${size.height / 2 - 7}px`}
    },

    outputPorts(node) {
      const c = node.config || {}
      if (node.type === 'END' || node.type === 'JOIN') return node.type === 'JOIN' ? [{
        handle: 'next',
        label: '',
        tooltip: 'Продолжить после объединения',
        yRatio: 0.5
      }] : []
      if (node.type === 'CONDITION') return this.distributePorts([
        {handle: 'true', label: 'ДА', tooltip: 'Условие выполнено'},
        {handle: 'false', label: 'НЕТ', tooltip: 'Условие не выполнено'}
      ])
      if (node.type === 'SWITCH') {
        const ports = (c.cases || []).map(item => ({
          handle: `case:${item.id}`,
          label: item.label || String(item.value || 'Вариант'),
          tooltip: `Значение: ${item.value}`
        }))
        ports.push({handle: 'default', label: 'ИНАЧЕ', tooltip: 'Ни один вариант не совпал'})
        return this.distributePorts(ports)
      }
      if (node.type === 'WAIT_EVENT' || node.type === 'WAIT_TASK') return this.distributePorts([
        {handle: 'event', label: 'СОБЫТИЕ', tooltip: 'Ожидаемое событие произошло'},
        {handle: 'timeout', label: 'ТАЙМАУТ', tooltip: 'Истёк срок ожидания'}
      ])
      if (node.type === 'APPROVAL') return this.distributePorts([
        {handle: 'approved', label: 'ОДОБРЕНО', tooltip: 'Решение одобрено'},
        {handle: 'rejected', label: 'ОТКЛОНЕНО', tooltip: 'Решение отклонено'},
        {handle: 'timeout', label: 'ТАЙМАУТ', tooltip: 'Решение не принято вовремя'}
      ])
      if (node.type === 'BUSINESS_HOURS') return this.distributePorts([
        {handle: 'working', label: 'РАБОТА', tooltip: 'Сейчас рабочее время'},
        {handle: 'after_hours', label: 'НЕРАБОЧЕЕ', tooltip: 'Рабочий день, но вне часов'},
        {handle: 'weekend', label: 'ВЫХОДНОЙ', tooltip: 'Сейчас выходной день'}
      ])
      if (node.type === 'ERROR_HANDLER' || node.type === 'HTTP_REQUEST' || node.type === 'SUBFLOW' || node.type === 'CREATE_TASK' || node.type === 'ESCALATE' || node.type === 'NOTIFY') return this.distributePorts([
        {handle: 'success', label: 'УСПЕХ', tooltip: 'Шаг выполнен'},
        {handle: 'error', label: 'ОШИБКА', tooltip: 'Во время шага произошла ошибка'}
      ])
      if (node.type === 'RETRY') return this.distributePorts([
        {handle: 'success', label: 'УСПЕХ', tooltip: 'Действие выполнено'},
        {handle: 'failed', label: 'НЕ УДАЛОСЬ', tooltip: 'Попытки исчерпаны'}
      ])
      if (node.type === 'THROTTLE') return this.distributePorts([
        {handle: 'allowed', label: 'РАЗРЕШЕНО', tooltip: 'Ограничение не превышено'},
        {handle: 'blocked', label: 'БЛОК', tooltip: 'Слишком частый запуск'}
      ])
      if (node.type === 'DEDUPLICATE') return this.distributePorts([
        {handle: 'duplicate', label: 'ДУБЛЬ', tooltip: 'Похожая заявка найдена'},
        {handle: 'unique', label: 'НОВАЯ', tooltip: 'Дубликат не найден'}
      ])
      if (node.type === 'FORK') return this.distributePorts((c.branches || []).map(branch => ({
        handle: `branch:${branch.id}`,
        label: branch.label || 'Ветка',
        tooltip: branch.label || 'Параллельная ветка'
      })))
      return [{handle: 'next', label: '', tooltip: 'Следующий шаг', yRatio: 0.5}]
    },

    distributePorts(ports) {
      const count = Math.max(1, ports.length)
      return ports.map((port, index) => ({...port, yRatio: (index + 1) / (count + 1)}))
    },

    requiredOutputHandles(node) {
      if (node.type === 'END') return []
      if (node.type === 'FORK') return this.outputPorts(node).map(port => port.handle)
      return this.outputPorts(node).map(port => port.handle)
    },

    edgeMarker(handle) {
      const positive = ['true', 'event', 'approved', 'working', 'success', 'allowed', 'unique']
      const negative = ['false', 'timeout', 'rejected', 'after_hours', 'weekend', 'error', 'failed', 'blocked', 'duplicate']
      if (positive.includes(handle)) return 'true'
      if (negative.includes(handle)) return 'false'
      return 'default'
    },

    edgeHandleLabel(node, handle) {
      return this.outputPorts(node).find(port => port.handle === handle)?.label || ''
    },

    outputPortStyle(node, port) {
      const size = this.nodeSize(node)
      return {top: `${size.height * port.yRatio - 7}px`}
    },

    outputLabelStyle(node, port) {
      const size = this.nodeSize(node)
      return {top: `${size.height * port.yRatio - 10}px`}
    },

    addNode(type) {
      const viewport = this.$refs.viewport
      const x = viewport ? (viewport.scrollLeft + viewport.clientWidth / 2) / this.zoom - 130 : 400
      const y = viewport ? (viewport.scrollTop + viewport.clientHeight / 2) / this.zoom - 80 : 250
      const config = this.defaultConfig(type)
      const node = createNode(type, Math.max(20, x), Math.max(20, y), config)
      this.localFlow.nodes.push(node)
      if (type === 'EVENT') this.localFlow.entryNodeId = node.id
      this.selectedNodeId = node.id
      this.selectedEdgeId = null
      this.commit()
    },

    defaultConfig(type) {
      if (type === 'EVENT') return {triggerType: this.triggerTypes[0] || 'TASK_CREATED'}
      if (type === 'CONDITION') return {expression: 'true', groups: [], manualExpression: false}
      if (type === 'SWITCH') return {
        valueExpression: 'task.priority.id',
        cases: [
          {id: nextFlowId('case'), label: 'Вариант 1', value: ''},
          {id: nextFlowId('case'), label: 'Вариант 2', value: ''}
        ]
      }
      if (type === 'ACTION') return {actionScript: '', actions: [], manualScript: false, continueOnError: false}
      if (type === 'DELAY') return {amount: 15, unit: 'MINUTES'}
      if (type === 'WAIT_UNTIL') return {mode: 'DURATION', amount: 15, unit: 'MINUTES', minutesBefore: 30, dateTime: ''}
      if (type === 'WAIT_EVENT') return {
        eventType: 'MESSAGE_INCOMING', scope: 'TASK', filterExpression: '', timeoutAmount: 24, timeoutUnit: 'HOURS'
      }
      if (type === 'WAIT_TASK') return {
        eventType: 'TASK_CLOSED',
        taskIdExpression: 'task.id',
        filterExpression: '',
        timeoutAmount: 7,
        timeoutUnit: 'DAYS'
      }
      if (type === 'APPROVAL') return {
        title: 'Требуется решение', message: '', approverUserId: null, timeoutAmount: 24, timeoutUnit: 'HOURS'
      }
      if (type === 'SUBFLOW') return {triggerId: null, mode: 'INLINE'}
      if (type === 'FORK') return {
        joinNodeId: null,
        branches: [
          {id: nextFlowId('branch'), label: 'Ветка 1'},
          {id: nextFlowId('branch'), label: 'Ветка 2'}
        ]
      }
      if (type === 'JOIN') return {description: 'Дождаться завершения веток'}
      if (type === 'HTTP_REQUEST') return {
        method: 'GET', url: '', headersText: '{}', body: '', timeoutSeconds: 15, resultVariable: 'httpResponse'
      }
      if (type === 'SET_VARIABLE') return {name: 'value', expression: ''}
      if (type === 'EXPRESSION') return {name: 'result', expression: '0'}
      if (type === 'COUNTER') return {name: 'counter', operation: 'ADD', amountExpression: '1'}
      if (type === 'ERROR_HANDLER') return {actionScript: ''}
      if (type === 'RETRY') return {
        actionScript: '',
        maxAttempts: 3,
        delayAmount: 5,
        delayUnit: 'MINUTES',
        multiplier: 2
      }
      if (type === 'ESCALATE') return {
        supportLineId: this.supportLines[0]?.id || null,
        priorityName: null,
        clearAssignee: true,
        notifyUserId: null,
        reason: ''
      }
      if (type === 'CREATE_TASK') return {
        title: 'Связанная заявка',
        description: '',
        typeId: null,
        serviceId: null,
        priorityName: null,
        supportLineId: null,
        resultVariable: 'createdTaskId'
      }
      if (type === 'NOTIFY') return {channel: 'CLIENT', userId: null, text: ''}
      if (type === 'BUSINESS_HOURS') return {}
      if (type === 'THROTTLE') return {scope: 'TASK', customKey: '', amount: 30, unit: 'MINUTES'}
      if (type === 'DEDUPLICATE') return {
        windowMinutes: 120, typeId: null, titleMode: 'CURRENT', title: '', resultVariable: 'duplicateTaskId'
      }
      if (type === 'NOTE') return {text: ''}
      if (type === 'END') return {result: 'Сценарий завершён'}
      return {}
    },

    duplicateNode(node) {
      if (!node || node.type === 'EVENT') return
      const copy = deepClone(node)
      copy.id = nextFlowId(node.type.toLowerCase())
      copy.label = `${node.label} — копия`
      copy.x += 50
      copy.y += 50
      if (Array.isArray(copy.config?.groups)) {
        copy.config.groups.forEach(group => {
          group.id = nextFlowId('group')
          ;(group.conditions || []).forEach(condition => {
            condition.id = nextFlowId('condition-item')
          })
        })
      }
      if (Array.isArray(copy.config?.actions)) {
        copy.config.actions.forEach(action => {
          action.id = nextFlowId('action-item')
        })
      }
      if (Array.isArray(copy.config?.cases)) {
        copy.config.cases.forEach(item => {
          item.id = nextFlowId('case')
        })
      }
      if (Array.isArray(copy.config?.branches)) {
        copy.config.branches.forEach(item => {
          item.id = nextFlowId('branch')
        })
      }
      this.localFlow.nodes.push(copy)
      this.selectedNodeId = copy.id
      this.commit()
    },

    deleteNode(nodeId) {
      const node = this.nodeMap.get(nodeId)
      if (!node || node.type === 'EVENT') return
      this.localFlow.nodes = this.localFlow.nodes.filter(item => item.id !== nodeId)
      this.localFlow.edges = this.localFlow.edges.filter(edge => edge.source !== nodeId && edge.target !== nodeId)
      this.selectedNodeId = null
      this.selectedEdgeId = null
      this.pendingConnection = null
      this.commit()
    },

    selectNode(nodeId) {
      this.selectedNodeId = nodeId
      this.selectedEdgeId = null
    },

    selectEdge(edgeId) {
      this.selectedEdgeId = edgeId
      this.selectedNodeId = null
    },

    clearSelection() {
      this.selectedNodeId = null
      this.selectedEdgeId = null
    },

    deleteSelection() {
      if (this.selectedNode) {
        this.deleteNode(this.selectedNode.id)
        return
      }
      if (this.selectedEdgeId) {
        this.localFlow.edges = this.localFlow.edges.filter(edge => edge.id !== this.selectedEdgeId)
        this.selectedEdgeId = null
        this.commit()
      }
    },

    beginConnection(source, handle) {
      this.pendingConnection = {source, handle}
      this.selectedNodeId = source
      this.selectedEdgeId = null
    },

    completeConnection(target) {
      if (!this.pendingConnection || this.pendingConnection.source === target) return
      const sourceNode = this.nodeMap.get(this.pendingConnection.source)
      const targetNode = this.nodeMap.get(target)
      if (!sourceNode || !targetNode || targetNode.type === 'EVENT') return

      this.localFlow.edges = this.localFlow.edges.filter(edge => !(
        edge.source === this.pendingConnection.source &&
        (edge.sourceHandle || 'next') === this.pendingConnection.handle
      ))
      this.localFlow.edges.push(createEdge(this.pendingConnection.source, target, this.pendingConnection.handle))
      this.pendingConnection = null
      this.selectedNodeId = target
      this.commit()
    },

    hasEdge(source, handle) {
      return this.localFlow.edges.some(edge => edge.source === source && (edge.sourceHandle || 'next') === handle)
    },

    edgeTarget(source, handle) {
      return this.localFlow.edges.find(edge => edge.source === source && (edge.sourceHandle || 'next') === handle)?.target || null
    },

    validateForkPath(nodeId, joinId, path) {
      if (nodeId === joinId) return {reachesJoin: true, asyncNode: null}
      if (!nodeId || path.has(nodeId)) return {reachesJoin: false, asyncNode: null}
      const node = this.nodeMap.get(nodeId)
      if (!node) return {reachesJoin: false, asyncNode: null}
      const nextPath = new Set(path)
      nextPath.add(nodeId)
      const asyncTypes = ['DELAY', 'WAIT_UNTIL', 'WAIT_EVENT', 'WAIT_TASK', 'APPROVAL', 'RETRY']
      if (asyncTypes.includes(node.type) || (node.type === 'SUBFLOW' && node.config?.mode === 'ASYNC')) {
        return {reachesJoin: false, asyncNode: node.label || this.nodeTypeLabel(node.type)}
      }
      if (node.type === 'END') return {reachesJoin: false, asyncNode: null}
      const outgoing = this.localFlow.edges.filter(edge => edge.source === nodeId)
      if (!outgoing.length) return {reachesJoin: false, asyncNode: null}
      let reachesJoin = true
      let asyncNode = null
      for (const edge of outgoing) {
        const child = this.validateForkPath(edge.target, joinId, nextPath)
        reachesJoin = reachesJoin && child.reachesJoin
        if (!asyncNode && child.asyncNode) asyncNode = child.asyncNode
      }
      return {reachesJoin, asyncNode}
    },

    startNodeDrag(event, node) {
      this.dragState = {
        nodeId: node.id,
        startMouseX: event.clientX,
        startMouseY: event.clientY,
        startX: node.x,
        startY: node.y,
        before: JSON.stringify(this.localFlow)
      }
      this.selectedNodeId = node.id
      this.selectedEdgeId = null
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
        const node = this.nodeMap.get(this.dragState.nodeId)
        if (!node) return
        node.x = Math.max(10, this.dragState.startX + (event.clientX - this.dragState.startMouseX) / this.zoom)
        node.y = Math.max(10, this.dragState.startY + (event.clientY - this.dragState.startMouseY) / this.zoom)
        this.expandCanvasForNode(node)
      }
      if (this.panState) {
        const viewport = this.$refs.viewport
        if (!viewport) return
        viewport.scrollLeft = this.panState.startScrollLeft - (event.clientX - this.panState.startMouseX)
        viewport.scrollTop = this.panState.startScrollTop - (event.clientY - this.panState.startMouseY)
      }
    },

    onGlobalMouseUp() {
      if (this.dragState) {
        const changed = this.dragState.before !== JSON.stringify(this.localFlow)
        this.dragState = null
        if (changed) this.commit()
      }
      this.panState = null
    },

    expandCanvasForNode(node) {
      const size = this.nodeSize(node)
      this.canvasWidth = Math.max(this.canvasWidth, Math.ceil(node.x + size.width + 500))
      this.canvasHeight = Math.max(this.canvasHeight, Math.ceil(node.y + size.height + 400))
    },

    onWheel(event) {
      if (!event.ctrlKey) return
      event.preventDefault()
      this.changeZoom(event.deltaY > 0 ? -0.1 : 0.1)
    },

    changeZoom(delta) {
      this.zoom = Math.min(1.6, Math.max(0.5, Math.round((this.zoom + delta) * 10) / 10))
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
      }, {minX: Infinity, minY: Infinity, maxX: 0, maxY: 0})
      const viewport = this.$refs.viewport
      const graphWidth = bounds.maxX - bounds.minX + 140
      const graphHeight = bounds.maxY - bounds.minY + 140
      this.zoom = Math.min(1.2, Math.max(0.5, Math.min(viewport.clientWidth / graphWidth, viewport.clientHeight / graphHeight)))
      nextTick(() => {
        viewport.scrollLeft = Math.max(0, (bounds.minX - 70) * this.zoom)
        viewport.scrollTop = Math.max(0, (bounds.minY - 70) * this.zoom)
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
      return this.conditionFields.find(item => item.value === field) || {kind: 'text'}
    },

    conditionOperatorOptions(condition) {
      const kind = this.conditionMeta(condition.field).kind
      if (kind === 'tag') return [
        {label: 'содержит', value: 'has_tag'},
        {label: 'не содержит', value: 'no_tag'}
      ]
      if (kind === 'text') return [
        {label: 'содержит', value: 'contains'},
        {label: 'не содержит', value: 'not_contains'},
        {label: 'равно', value: 'equals'},
        {label: 'не равно', value: 'not_equals'},
        {label: 'начинается с', value: 'starts_with'},
        {label: 'заканчивается на', value: 'ends_with'},
        {label: 'регулярное выражение', value: 'matches'}
      ]
      return [
        {label: 'равно', value: 'equals'},
        {label: 'не равно', value: 'not_equals'}
      ]
    },

    conditionValueOptions(condition) {
      const meta = this.conditionMeta(condition.field)
      let options = []
      if (meta.source === 'taskTypes') options = this.toOptions(this.taskTypes, item => item.type || item.name)
      if (meta.source === 'services') options = this.toOptions(this.services, item => [item.code, item.name].filter(Boolean).join(' · '))
      if (meta.source === 'priorities') options = this.toOptions(this.priorities, item => item.name)
      if (meta.source === 'statuses') options = this.toOptions(this.statuses, item => item.name)
      if (meta.source === 'supportLines') options = this.toOptions(this.supportLines, item => item.name)
      if (meta.source === 'users') options = this.userOptions()
      if (meta.source === 'organizations') options = this.toOptions(this.organizations, item => item.name)
      if (meta.source === 'tags') options = this.toOptions(this.tags, item => item.name, item => item.name)
      if (meta.kind === 'boolean' || meta.kind === 'function-boolean') return [
        {label: 'Да', value: true},
        {label: 'Нет', value: false}
      ]
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
        const conditions = (group.conditions || []).map(condition => this.compileCondition(condition)).filter(Boolean)
        return conditions.length ? `(${conditions.join(' and ')})` : ''
      }).filter(Boolean)
      node.config.expression = compiledGroups.join(' or ')
    },

    compileCondition(condition) {
      if (!condition?.field || condition.value === null || condition.value === undefined || condition.value === '') return ''
      const meta = this.conditionMeta(condition.field)
      if (meta.kind === 'function-boolean') {
        const fn = condition.field === '__WEEKEND__' ? 'is_weekend()' : 'is_working_hours()'
        return condition.value ? fn : `!${fn}`
      }
      if (condition.value === '__NULL__') return condition.operator === 'not_equals' ? `notNull(${condition.field})` : `isNull(${condition.field})`
      const quoted = `'${this.escapeScript(condition.value)}'`
      if (meta.kind === 'tag') {
        const expression = `${condition.field}.hasTag(${quoted})`
        return condition.operator === 'no_tag' ? `!${expression}` : expression
      }
      if (meta.kind === 'text') {
        if (condition.operator === 'contains' || condition.operator === 'not_contains') {
          const expression = `${condition.field}.contains(${quoted})`
          return condition.operator === 'not_contains' ? `!${expression}` : expression
        }
        if (condition.operator === 'starts_with') return `startsWith(${condition.field}, ${quoted})`
        if (condition.operator === 'ends_with') return `endsWith(${condition.field}, ${quoted})`
        if (condition.operator === 'matches') return `matches(${condition.field}, ${quoted})`
        const expression = `${condition.field} = ${quoted}`
        return condition.operator === 'not_equals' ? `!(${expression})` : expression
      }
      const raw = meta.kind === 'boolean' || typeof condition.value === 'number' ? String(condition.value) : quoted
      const expression = `${condition.field} = ${raw}`
      return condition.operator === 'not_equals' ? `!(${expression})` : expression
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
      node.config.actionScript = this.nodeActions(node).map(action => this.compileAction(action)).filter(Boolean).join('; ')
    },

    actionNeedsValue(action) {
      return !['CLEAR_ASSIGNEE', 'CLEAR_DEADLINE', 'SET_ANSWER_REQUIRED'].includes(action.type)
    },

    actionValueOptions(action) {
      if (['ASSIGN_LINE', 'ASSIGN_LEAST_LOADED'].includes(action.type)) return this.toOptions(this.supportLines, item => item.name)
      if (action.type === 'ASSIGN_USER') return this.userOptions()
      if (action.type === 'SET_PRIORITY') return this.toOptions(this.priorities, item => item.name, item => item.name)
      if (action.type === 'SET_STATUS') return this.toOptions(this.statuses, item => item.name, item => item.name)
      if (['ADD_TAG', 'REMOVE_TAG'].includes(action.type)) return this.toOptions(this.tags, item => item.name, item => item.name)
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
    },

    compileAction(action) {
      if (!action?.type) return ''
      if (this.actionNeedsValue(action) && (action.value === null || action.value === undefined || action.value === '')) return ''
      const value = this.escapeScript(action.value)
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
        case 'SET_NAME':
          return `task.setName('${value}')`
        case 'SET_DESCRIPTION':
          return `task.setDescription('${value}')`
        case 'SET_DEADLINE_MINUTES':
          return `task.setDeadlineAfterMinutes(${Number(action.value)})`
        case 'CLEAR_DEADLINE':
          return 'task.clearDeadline()'
        case 'SEND_MESSAGE':
          return `client.sendMessage('${value}')`
        case 'SET_ANSWER_REQUIRED':
          return 'client.setAnswerRequired()'
        default:
          return ''
      }
    },

    escapeScript(value) {
      // Строка сценария оборачивается в одинарные кавычки. Сохраняем
      // поддерживаемые escape-последовательности (\n, \r, \t), чтобы
      // визуальный конструктор не превращал \n в литеральный текст "\\n".
      let normalized = String(value ?? '')
      while (normalized.includes('\\"')) {
        normalized = normalized.replaceAll('\\"', '"')
      }

      let result = ''
      for (let index = 0; index < normalized.length; index += 1) {
        const current = normalized[index]

        if (current === '\n') {
          result += '\\n'
          continue
        }
        if (current === '\r') {
          result += '\\r'
          continue
        }
        if (current === '\t') {
          result += '\\t'
          continue
        }
        if (current === "'") {
          result += "\\'"
          continue
        }
        if (current !== '\\') {
          result += current
          continue
        }

        const next = normalized[index + 1]
        if (['n', 'r', 't', '\\', "'", '"'].includes(next)) {
          result += `\\${next}`
          index += 1
        } else {
          result += '\\\\'
        }
      }

      return result
    },

    toOptions(items, labelGetter, valueGetter = item => item.id) {
      return (items || [])
        .filter(item => item && item.id !== undefined && item.id !== null && item.active !== false)
        .map(item => ({label: labelGetter(item), value: valueGetter(item)}))
    },

    userOptions() {
      return (this.users || [])
        .filter(user => user?.id !== undefined && user?.id !== null && user.enabled !== false)
        .map(user => ({
          value: user.id,
          label: `${user.lastname || ''} ${user.firstname || ''}`.trim() || user.username || `Пользователь ${user.id}`
        }))
    },

    applyTemplate(type) {
      let flow
      if (type === 'priority') flow = this.priorityTemplate()
      if (type === 'sla') flow = this.slaTemplate()
      if (type === 'reopen') flow = this.reopenTemplate()
      if (!flow) return
      this.localFlow = normalizeWorkflow(flow)
      this.selectedNodeId = this.localFlow.entryNodeId
      this.selectedEdgeId = null
      this.pendingConnection = null
      this.resetHistory()
      this.commit(false)
      nextTick(() => this.fitView())
    },

    priorityTemplate() {
      const flow = createDefaultWorkflow('TASK_CREATED')
      const condition = flow.nodes.find(node => node.type === 'CONDITION')
      condition.label = 'Критичный приоритет?'
      const criticalPriority = this.priorities.find(priority =>
        String(priority?.name || '').toLowerCase().includes('крит')
      ) || this.priorities[0]
      condition.config.groups = [{
        id: nextFlowId('group'),
        conditions: [{
          id: nextFlowId('condition-item'),
          field: 'task.priority.id',
          operator: 'equals',
          value: criticalPriority?.id || null
        }]
      }]
      this.syncConditionExpression(condition)
      const action = flow.nodes.find(node => node.type === 'ACTION')
      action.label = 'Маршрутизировать в экспертную линию'
      action.config.actions = [{
        id: nextFlowId('action-item'),
        type: 'ASSIGN_LEAST_LOADED',
        value: this.supportLines[0]?.id || null
      }]
      this.syncActionScript(action)
      return flow
    },

    slaTemplate() {
      const event = createNode('EVENT', 70, 240, {triggerType: 'SLA_WARNING'})
      const action = createNode('ACTION', 390, 110, {
        actions: [{id: nextFlowId('action-item'), type: 'ADD_TAG', value: this.tags[0]?.name || null}],
        actionScript: '', manualScript: false, continueOnError: false
      })
      this.syncActionScript(action)
      const delay = createNode('DELAY', 760, 110, {amount: 15, unit: 'MINUTES'})
      const condition = createNode('CONDITION', 1080, 180, {
        groups: [{
          id: nextFlowId('group'),
          conditions: [{id: nextFlowId('condition-item'), field: 'task.completed', operator: 'equals', value: false}]
        }],
        expression: '', manualExpression: false
      })
      this.syncConditionExpression(condition)
      const escalate = createNode('ACTION', 1460, 70, {
        actions: [{
          id: nextFlowId('action-item'),
          type: 'ASSIGN_LEAST_LOADED',
          value: this.supportLines[0]?.id || null
        }],
        actionScript: '', manualScript: false, continueOnError: false
      })
      this.syncActionScript(escalate)
      const end = createNode('END', 1810, 230, {result: 'Контроль SLA завершён'})
      return {
        version: 1,
        entryNodeId: event.id,
        nodes: [event, action, delay, condition, escalate, end],
        edges: [
          createEdge(event.id, action.id, 'next'),
          createEdge(action.id, delay.id, 'next'),
          createEdge(delay.id, condition.id, 'next'),
          createEdge(condition.id, escalate.id, 'true'),
          createEdge(condition.id, end.id, 'false'),
          createEdge(escalate.id, end.id, 'next')
        ]
      }
    },

    reopenTemplate() {
      const flow = createDefaultWorkflow('TASK_REOPENED')
      const condition = flow.nodes.find(node => node.type === 'CONDITION')
      condition.label = 'Есть исполнитель?'
      condition.config.groups = [{
        id: nextFlowId('group'),
        conditions: [{
          id: nextFlowId('condition-item'),
          field: 'task.executor.id',
          operator: 'not_equals',
          value: '__NULL__'
        }]
      }]
      this.syncConditionExpression(condition)
      const action = flow.nodes.find(node => node.type === 'ACTION')
      action.config.actions = [
        {id: nextFlowId('action-item'), type: 'CLEAR_ASSIGNEE', value: null},
        {id: nextFlowId('action-item'), type: 'ASSIGN_LEAST_LOADED', value: this.supportLines[0]?.id || null}
      ]
      this.syncActionScript(action)
      return flow
    },

    hasCycle() {
      const adjacency = new Map()
      this.localFlow.edges.forEach(edge => {
        if (!adjacency.has(edge.source)) adjacency.set(edge.source, [])
        adjacency.get(edge.source).push(edge.target)
      })
      const visiting = new Set()
      const visited = new Set()
      const dfs = nodeId => {
        if (visited.has(nodeId)) return false
        if (visiting.has(nodeId)) return true
        visiting.add(nodeId)
        for (const next of adjacency.get(nodeId) || []) {
          if (dfs(next)) return true
        }
        visiting.delete(nodeId)
        visited.add(nodeId)
        return false
      }
      return this.localFlow.nodes.some(node => dfs(node.id))
    },

    commit(recordHistory = true) {
      this.localFlow = normalizeWorkflow(this.localFlow)
      if (recordHistory) this.pushHistory()
      this.$emit('update:modelValue', deepClone(this.localFlow))
    },

    resetHistory() {
      this.history = [JSON.stringify(this.localFlow)]
      this.historyIndex = 0
    },

    pushHistory() {
      const snapshot = JSON.stringify(this.localFlow)
      if (this.history[this.historyIndex] === snapshot) return
      this.history = this.history.slice(0, this.historyIndex + 1)
      this.history.push(snapshot)
      if (this.history.length > 80) this.history.shift()
      this.historyIndex = this.history.length - 1
    },

    undo() {
      if (!this.canUndo) return
      this.historyIndex -= 1
      this.localFlow = JSON.parse(this.history[this.historyIndex])
      this.$emit('update:modelValue', deepClone(this.localFlow))
    },

    redo() {
      if (!this.canRedo) return
      this.historyIndex += 1
      this.localFlow = JSON.parse(this.history[this.historyIndex])
      this.$emit('update:modelValue', deepClone(this.localFlow))
    },

    onEditorKeydown(event) {
      if (event.key === 'Escape') {
        this.pendingConnection = null
        return
      }
      if ((event.key === 'Delete' || event.key === 'Backspace') && !['INPUT', 'TEXTAREA'].includes(event.target?.tagName)) {
        event.preventDefault()
        this.deleteSelection()
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
        event.preventDefault()
        event.shiftKey ? this.redo() : this.undo()
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'y') {
        event.preventDefault()
        this.redo()
      }
    }
  }
}
</script>

<style scoped>
.flow-editor {
  min-height: 650px;
  border: 1px solid #d9dce3;
  border-radius: 10px;
  overflow: hidden;
  background: #f7f8fb;
  outline: none;
}

.flow-toolbar {
  min-height: 52px;
  padding: 8px 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  border-bottom: 1px solid #dfe2e8;
  background: #ffffff;
}

.flow-zoom-label {
  min-width: 44px;
  text-align: center;
  color: #626875;
  font-size: 12px;
}

.flow-main {
  display: grid;
  grid-template-columns: 245px minmax(500px, 1fr) 360px;
  height: calc(100vh - 250px);
  min-height: 620px;
}

.flow-palette,
.flow-inspector {
  min-width: 0;
  padding: 16px;
  overflow-y: auto;
  background: #ffffff;
}

.flow-palette {
  border-right: 1px solid #dfe2e8;
}

.flow-inspector {
  border-left: 1px solid #dfe2e8;
}

.flow-side-title {
  font-size: 15px;
  font-weight: 700;
  color: #252a34;
}

.flow-side-caption {
  margin-top: 4px;
  margin-bottom: 14px;
  color: #7a808c;
  font-size: 12px;
  line-height: 1.45;
}

.flow-palette-group {
  margin-bottom: 10px;
}

.flow-palette-group:last-of-type {
  margin-bottom: 6px;
}

.flow-palette-group-title {
  display: flex;
  width: 100%;
  align-items: center;
  gap: 7px;
  padding: 6px 4px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: #646b78;
  font: inherit;
  font-size: 12px;
  font-weight: 700;
  line-height: 1.3;
  text-align: left;
  cursor: pointer;
}

.flow-palette-group-title:hover {
  background: rgba(90, 98, 112, 0.08);
}

.flow-palette-group-title-label {
  min-width: 0;
  flex: 1 1 auto;
}

.flow-palette-group-items {
  padding-top: 4px;
}

.flow-palette-btn {
  margin-bottom: 7px;
  min-height: 40px;
  padding: 0 10px;
  font-size: 13px;
}

.flow-palette-btn:last-child {
  margin-bottom: 0;
}

.flow-palette-btn :deep(.q-btn__content) {
  width: 100%;
  flex-wrap: nowrap;
  justify-content: flex-start;
  white-space: nowrap;
}

.flow-palette-btn :deep(.q-icon) {
  flex: 0 0 auto;
}

.flow-palette-btn :deep(.block) {
  min-width: 0;
  white-space: nowrap;
}

.flow-help-step {
  display: flex;
  gap: 8px;
  margin-top: 10px;
  color: #676d78;
  font-size: 12px;
  line-height: 1.4;
}

.flow-help-step span {
  flex: 0 0 20px;
  height: 20px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #ede8ff;
  color: var(--q-primary);
  font-weight: 700;
}

.flow-workspace {
  min-width: 0;
  display: flex;
  flex-direction: column;
  background: #eef0f5;
}

.flow-viewport {
  flex: 1;
  overflow: auto;
  position: relative;
  background-color: #f7f8fb;
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
}

.flow-zoom-layer {
  position: absolute;
  left: 0;
  top: 0;
}

.flow-edges {
  position: absolute;
  inset: 0;
  overflow: visible;
  z-index: 1;
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
  stroke: #8c94a3;
  stroke-width: 2.2;
  pointer-events: none;
}

.flow-edge-line--true {
  stroke: #2e9b55;
}

.flow-edge-line--false {
  stroke: #d34b4b;
}

.flow-edge-line--selected {
  stroke-width: 4;
  filter: drop-shadow(0 0 3px rgba(82, 52, 255, .45));
}

.flow-edge-label {
  fill: #616776;
  font-size: 11px;
  font-weight: 700;
  text-anchor: middle;
  paint-order: stroke;
  stroke: #f7f8fb;
  stroke-width: 5px;
  stroke-linejoin: round;
  pointer-events: none;
}

.flow-node {
  position: absolute;
  z-index: 2;
  border: 1px solid #cfd3dc;
  border-top: 4px solid #8c94a3;
  border-radius: 9px;
  background: #ffffff;
  box-shadow: 0 5px 16px rgba(32, 37, 48, .09);
  transition: border-color .15s, box-shadow .15s;
}

.flow-node:hover {
  box-shadow: 0 8px 22px rgba(32, 37, 48, .14);
}

.flow-node--selected {
  border-color: var(--q-primary);
  box-shadow: 0 0 0 2px rgba(93, 61, 255, .16), 0 9px 24px rgba(32, 37, 48, .16);
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
  left: -7px;
}

.flow-port--output {
  right: -7px;
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

.flow-statusbar {
  min-height: 30px;
  padding: 5px 10px;
  display: flex;
  align-items: center;
  gap: 18px;
  border-top: 1px solid #dfe2e8;
  background: #ffffff;
  color: #7a808c;
  font-size: 11px;
}

.flow-inspector-empty {
  min-height: 240px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: #999faa;
}

.flow-empty-card {
  padding: 13px;
  border: 1px dashed #cfd3dc;
  border-radius: 7px;
  background: #fafbfc;
  color: #777e89;
  font-size: 12px;
}

.flow-condition-group,
.flow-action-item {
  padding: 10px;
  border: 1px solid #e0e3e9;
  border-radius: 8px;
  background: #fafbfc;
}

.flow-condition-item,
.flow-action-item {
  display: grid;
  gap: 8px;
  margin-top: 8px;
}

.flow-action-item {
  background: #f7fbf8;
}

.flow-logic-divider {
  margin: 12px 0 4px;
  text-align: center;
  color: #fb8c00;
  font-size: 11px;
  font-weight: 800;
}

.flow-validation-list {
  padding: 10px;
  border-radius: 7px;
  background: #fafafa;
}

@media (max-width: 1250px) {
  .flow-main {
    grid-template-columns: 220px minmax(460px, 1fr) 320px;
  }
}

@media (max-width: 900px) {
  .flow-main {
    grid-template-columns: 1fr;
    height: auto;
  }

  .flow-palette,
  .flow-inspector {
    border: none;
    border-bottom: 1px solid #dfe2e8;
  }

  .flow-workspace {
    min-height: 600px;
  }
}
</style>
