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
          flat
          round
          dense
          icon="help_outline"
          color="primary"
          @click="this.showAutomationGuide = true"
        >
          <q-tooltip>Инструкция по автоматизациям</q-tooltip>
        </q-btn>
        <q-btn
          outline
          color="primary"
          icon="create_new_folder"
          label="Создать папку"
          @click="this.createFolder"
        />
        <q-btn
          unelevated
          color="primary"
          icon="add"
          label="Добавить автоматизацию"
          @click="this.newTrigger"
        />
      </div>
    </div>

    <q-banner
      v-if="this.isAutomationIntroVisible"
      rounded
      class="bg-blue-1 text-primary automation-intro-banner"
    >
      <template v-slot:avatar>
        <q-icon name="bolt" color="primary"/>
      </template>
      <div class="text-weight-medium">Автоматизация — сценарий из связанных шагов</div>
      <div class="text-caption text-grey-8">
        Событие запускает граф, а стрелки определяют порядок шагов: получить данные, проверить условие,
        выбрать ветку и выполнить нужные действия. Настройки и логику сценария можно менять в редакторе.
      </div>
      <template v-slot:action>
        <q-btn
          flat
          color="primary"
          label="Подробная инструкция"
          @click="this.showAutomationGuide = true"
        />
        <q-btn
          flat
          round
          dense
          icon="close"
          @click="this.dismissAutomationIntro"
        />
      </template>
    </q-banner>

    <q-list
      bordered
      class="rounded-borders settings-row-list automation-tree"
      style="margin-top: 8px"
    >
      <automation-tree-level
        :nodes="this.tree"
        :level="0"
        :folder-by-id="this.folderById"
        :trigger-by-id="this.triggerById"
        :toggling-ids="this.togglingTriggerIds"
        :trigger-type-label="this.triggerTypeLabel"
        @drag-end="this.onTreeDragEnd"
        @toggle-folder="this.toggleFolder"
        @rename-folder="this.renameFolder"
        @delete-folder="this.deleteFolder"
        @toggle-trigger="(trigger, enabled) => this.toggleTrigger(trigger, enabled)"
        @edit-trigger="this.editTrigger"
      />
    </q-list>
  </div>
  <q-dialog
    :model-value="this.dialogVisible"
    @update:model-value="this.onEditorVisibilityChange"
    persistent
    maximized
    backdrop-filter="blur(4px)"
  >
    <q-card class="dialog-width automation-dialog">
      <q-toolbar class="justify-between">
        <div class="text-h6" v-text="this.isNewTrigger ? 'Новый триггер' : 'Изменить триггер'"/>
        <q-btn flat round dense icon="close" :disable="this.saving" aria-label="Закрыть редактор" @click="this.dialogClose"/>
      </q-toolbar>
      <q-card-section class="automation-editor-section">
        <div class="automation-editor-header row items-center q-col-gutter-sm">
          <div class="col-12 col-md-4">
            <q-input
              v-model="this.dialogTriggerName"
              label="Название *"
              dense
              outlined
              hide-bottom-space
              :rules="[val => (val && val.length > 0) || 'Обязательное поле']"
              ref="dialogTriggerName"
            />
          </div>
          <div class="col-12 col-md">
            <q-input
              v-model="this.dialogTriggerDescription"
              label="Описание"
              dense
              outlined
              hide-bottom-space
              clearable
            />
          </div>
          <div class="col-auto">
            <q-toggle
              v-model="this.dialogTriggerEnabled"
              dense
              color="primary"
              label="Активен"
            />
          </div>
          <div class="col-auto">
            <q-toggle
              v-model="this.dialogStopProcessing"
              dense
              color="primary"
              label="Не проверять следующие сценарии"
            >
              <q-tooltip>Не проверять следующие сценарии после выполнения ветки</q-tooltip>
            </q-toggle>
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
          <automation-flow-editor :test-trace="testResult?.trace || []" ref="workflowEditor"
            v-model="this.workflow"
            :trigger-types="this.store.triggerTypeOptions"
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
            <automation-event-select
              v-model="this.selectedTriggerType"
              label="Когда выполнять *"
              :options="this.store.triggerTypeOptions"
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
                    autogrow
                    type="textarea"
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

            <q-expansion-item v-if="editorMode === 'workflow'" dense label="Задать данные события вместо заявки" class="q-mt-sm">
              <q-input v-model="testEventPayload" outlined type="textarea" rows="6" label="Данные события (JSON)" hint="Например: { &quot;service&quot;: { &quot;id&quot;: 1 }, &quot;problem&quot;: { &quot;severity&quot;: 5, &quot;status&quot;: &quot;OPEN&quot; } }. Тест не изменяет данные и не вызывает ИИ."/>
            </q-expansion-item>
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
                  <q-btn flat dense :label="step.label || step.nodeType || step.nodeId" @click="focusTraceStep(step)"/>
                  <span> — {{ this.workflowTraceStatusLabel(step.status) }}</span>
                  <span v-if="step.detail">: {{ step.detail }}</span>
                  <automation-trace-details :step="step"/>
                </div>
              </div>
            </q-banner>
          </div>
        </q-expansion-item>

        <div v-if="this.editorMode === 'script'">
          <automation-event-select
            id="task-executor"
            v-model="this.selectedTriggerType"
            label="Событие *"
            :options="this.store.triggerTypeOptions"
          />
          <automation-expression-input
            v-model="this.dialogTriggerExpression"
            :variables="this.expressionVariables"
            label="Выражение условия *"
            autogrow
            type="textarea"
            :rules="[val => (val && val.length > 0) || 'Обязательное поле']"
          />
          <automation-expression-input
            v-model="this.dialogTriggerAction"
            :variables="this.expressionVariables"
            label="Действия ветки ДА *"
            autogrow
            type="textarea"
            :rules="[val => (val && val.length > 0) || 'Обязательное поле']"
          />
          <automation-expression-input
            v-model="this.dialogTriggerElseAction"
            :variables="this.expressionVariables"
            label="Действия ветки НЕТ (необязательно)"
            autogrow
            type="textarea"
          />
        </div>
      <q-expansion-item
        v-if="triggerId && !isNewTrigger && workflowPublishesHints"
        label="Оценки подсказок оператору"
        icon="thumbs_up_down"
        class="automation-editor-extra"
        @show="hintStatsOpened = true"
      >
        <operator-hint-stats v-if="hintStatsOpened" :rule-id="triggerId"/>
      </q-expansion-item>
      <q-expansion-item v-if="triggerId && !isNewTrigger" label="Журнал выполнения: решения и данные шагов" icon="history" class="automation-editor-extra" @show="loadGraphHistory">
        <q-expansion-item v-if="graphBackups.length" dense label="Версия графа до переноса логики">
          <div v-for="backup in graphBackups" :key="backup.migration_version" class="q-pa-sm">
            <div class="text-caption">Сохранено {{ formatDateTime(backup.saved_at) }}</div>
            <q-btn outline dense label="Открыть прежний граф в редакторе" @click="openGraphBackup(backup)"/>
          </div>
        </q-expansion-item>
        <q-btn flat dense icon="refresh" label="Обновить" :loading="historyLoading" @click="loadGraphHistory"/>
        <div v-if="!graphHistory.length" class="text-caption q-pa-sm">Пока нет записей новых графовых операций.</div>
        <div v-for="row in graphHistory" :key="row.execution_id + row.created_at + row.step.nodeId" class="q-pa-sm">
          <div class="text-caption">{{ formatDateTime(row.created_at) }} · {{ row.execution_id }}</div>
          <q-btn flat dense :label="row.step.label" @click="focusTraceStep(row.step)"/>
          <span>{{ workflowTraceStatusLabel(row.step.status) }}: {{ row.step.detail }}</span>
          <automation-trace-details :step="row.step"/>
        </div>
      </q-expansion-item>
      </q-card-section>
      <q-card-actions align="right" class="automation-dialog-actions">
        <q-btn
          v-if="!this.isNewTrigger"
          unelevated
          color="negative"
          icon="delete"
          label="Удалить"
          :disable="this.saving"
          @click="this.dialogDeleteTrigger"
        />
        <q-btn
          color="white"
          label="Отмена"
          text-color="primary"
          :disable="this.saving"
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

  <q-dialog v-model="this.showAutomationGuide">
    <q-card class="automation-guide-dialog">
      <q-toolbar class="justify-between">
        <div class="text-h6">Инструкция по автоматизациям</div>
        <q-btn flat round dense icon="close" v-close-popup/>
      </q-toolbar>
      <q-card-section class="automation-guide-section">
        <q-list>
          <q-expansion-item
            default-opened
            icon="bolt"
            label="Как это работает"
            header-class="text-weight-medium"
          >
            <div class="automation-guide-text">
              Автоматизация — это граф сценария: блоки описывают отдельные шаги, а стрелки задают порядок их
              выполнения. Когда происходит выбранное событие — например, создана заявка или поступило сообщение —
              система начинает с блока «Событие» и проходит по связанным с ним шагам.
            </div>
            <div class="automation-guide-text q-mt-sm">
              Шаги могут получать данные, сохранять результаты в переменные, обращаться к ИИ, проверять условия
              и выполнять действия. Условие направляет выполнение в ветку «ДА» или «НЕТ», а операция — в ветку
              успеха или ошибки. Сценарий может обрабатывать список, ждать события или продолжаться в фоне.
              Блок «Завершение» заканчивает текущую ветку.
            </div>
            <div class="automation-guide-text q-mt-sm">
              Например: поступило сообщение → загрузить статьи базы знаний → выбрать подходящую через Jev →
              проверить уверенность → подготовить подсказку. Порог и действия задаются в самом графе,
              а пройденные шаги и их результаты видны в журнале выполнения.
            </div>
          </q-expansion-item>

          <q-expansion-item icon="tune" label="Как править графы" header-class="text-weight-medium">
            <div class="automation-guide-text">
              Начните с блока «Настройки сценария»: там находятся пороги, интервалы и ограничения.
              Кнопки этапов над холстом помогут перейти к нужной части. Порядок выполнения задают стрелки,
              а не расположение блоков или кнопок этапов. Каждый шаг отдельно получает данные,
              оценивает их, проверяет условия или выполняет действие. Выберите нужный блок по названию в панели
              «Узлы», задайте параметры и имя результата. Значения можно ввести, выбрать из справочника
              или взять из данных предыдущего шага. Условия редактируются сравнениями и группами «все / хотя бы одно».
            </div>
          </q-expansion-item>

          <q-expansion-item icon="data_object" label="Переменные: var., item и результаты шагов" header-class="text-weight-medium">
            <div class="automation-guide-text">
              В выражениях и шаблонах с двойными фигурными скобками данные доступны через корни <code>task</code> (заявка),
              <code>client</code> (клиент), <code>message</code> (сообщение) и <code>var</code> (переменные сценария).
              <code>var.</code> — не поле заявки, а отдельное хранилище: туда попадают имена результатов шагов
              («Сохранить результат как»), значения из блока «Переменная» и служебные значения внутри циклов.
            </div>
            <div class="automation-guide-text q-mt-sm">
              <b>var.item — не зарезервированное слово</b>, а имя текущего элемента списка. В узле «Для каждого
              элемента» это имя задаёт поле «Текущий элемент» (по умолчанию — <code>item</code>, можно изменить).
              А вот в операциях из каталога со списком — «Отобрать и упорядочить», «Получить поля списка», а также
              в полях вариантов у «Решения ИИ» — элемент всегда называется именно <code>item</code>: это фиксированное
              имя конкретной операции, его нельзя переименовать. Подсказки при наборе покажут <code>var.item</code> и
              известные поля элемента (например <code>var.item.date</code>), если движок знает форму списка.
            </div>
          </q-expansion-item>
          <q-expansion-item icon="fact_check" label="Как проверить результат изменений" header-class="text-weight-medium">
            <div class="automation-guide-text">
              Проверка не изменяет систему и не вызывает ИИ. Если она остановилась на анализе, нажмите на имя
              шага и откройте «Тестовые данные»: выберите предполагаемый ответ и уверенность, затем повторите проверку.
              Для чтения данных тоже можно задать тестовый результат — например список заявок или число клиентов.
              В данных шага видны параметры, результат и переменные. Для события без заявки можно открыть
              «Задать данные события вместо заявки» и указать данные для проверки.
            </div>
          </q-expansion-item>

          <q-expansion-item
            icon="add_circle_outline"
            label="Как создать автоматизацию"
            header-class="text-weight-medium"
          >
            <div class="automation-guide-text">
              Нажмите «Добавить автоматизацию», задайте название и выберите событие, на которое должно реагировать
              сценарий. Добавьте нужные блоки из панели «Узлы», выберите блок, чтобы настроить его справа,
              и соедините выходы с входами следующих шагов. Начните с блока «Событие» и завершите ветки блоками
              «Завершение». Например, выход «ДА» условия может вести к действию, а «НЕТ» — сразу к завершению.
              Перед сохранением проверьте граф на тестовых данных.
            </div>
          </q-expansion-item>

          <q-expansion-item
            icon="account_tree"
            label="Из чего состоит граф"
            header-class="text-weight-medium"
          >
            <div class="automation-guide-text">
              Блоки в панели «Узлы» сгруппированы по назначению. Выберите блок на холсте, чтобы настроить
              его параметры и посмотреть доступные входы и выходы.
              <div class="automation-guide-node-group"><b>Старт и структура</b> — событие, настройки сценария, вызов другого сценария и завершение ветки. «Пояснение на холсте» добавляет заметку для читателя графа и не выполняет действий.</div>
              <div class="automation-guide-node-group"><b>Сообщения и уведомления</b> — отправить сообщение клиенту, добавить внутренний комментарий, установить необходимость ответа или уведомить сотрудника. Комментарий в переписке и пояснение на холсте — разные блоки.</div>
              <div class="automation-guide-node-group"><b>Заявки</b> — создать заявку, изменить её поля, назначить наименее загруженного сотрудника, добавить или удалить тег. Переход на другую линию задаётся в «Изменить заявку»; уведомление при необходимости добавляется следующим шагом.</div>
              <div class="automation-guide-node-group"><b>Условия и ветвление</b> — выбор ветки ДА/НЕТ, варианты значения, рабочее время, разделение и объединение веток.</div>
              <div class="automation-guide-node-group"><b>Получить данные</b> — загрузить заявки, сообщения, сервисы, сотрудников и другие объекты для дальнейшей обработки.</div>
              <div class="automation-guide-node-group"><b>Значения и списки</b> — подготовить значение, отобрать или объединить списки, получить их поля, ограничить текст, изменить счётчик или обработать каждый элемент.</div>
              <div class="automation-guide-node-group"><b>Решения ИИ</b> — получить оценку Jev или сформулировать текст. Порог решения проверяется отдельным условием графа.</div>
              <div class="automation-guide-node-group"><b>Инциденты и сигналы сбоев</b> — создать инцидент, привязать заявки, проверить восстановление и обработать сигналы массовых обращений.</div>
              <div class="automation-guide-node-group"><b>Ожидание и согласование</b> — пауза по времени, ожидание события или изменения заявки и ручное решение сотрудника.</div>
              <div class="automation-guide-node-group"><b>Защита от повторов</b> — ограничить частоту, найти похожую заявку, выполнить шаг один раз по ключу или последовательно обработать события с одним ключом.</div>
              <div class="automation-guide-node-group"><b>Интеграции</b> — HTTP-запрос во внешнюю систему с сохранением ответа в переменную.</div>
              <div class="automation-guide-node-group"><b>Дополнительно: скрипты</b> — «Скрипт команд» заменяет общее название «Действия». Здесь также доступны обработка ошибки и повтор скрипта. Для обычных задач используйте тематические блоки.</div>
              <div class="automation-guide-node-group">В параметрах выбирайте обычное значение или «Скрипт».
                Типы заявок, сервисы, приоритеты, линии и сотрудники доступны из справочников; скрипт берёт
                значение из события или предыдущих шагов. Поиск над списком блоков помогает найти нужное действие.
              </div>
            </div>
          </q-expansion-item>

          <q-expansion-item
            icon="history"
            label="Где смотреть реальное выполнение"
            header-class="text-weight-medium"
          >
            <div class="automation-guide-text">
              Откройте сохранённый сценарий и разверните «Журнал выполнения: решения и данные шагов».
              В нём видны выполненные шаги, выбранные ветки, входные данные, результаты и ошибки.
              В «Журнале решений» Jev можно отдельно посмотреть ответы ИИ. Сам ответ ИИ ещё не означает,
              что действие выполнено: это определяют следующие условия и шаги графа.
            </div>
          </q-expansion-item>

          <q-expansion-item
            icon="tune"
            label="Порядок срабатывания и настройки"
            header-class="text-weight-medium"
          >
            <div class="automation-guide-text">
              Активные сценарии для одного события проверяются по порядку в списке. Перетаскивайте их за
              значок слева, чтобы изменить порядок. Переключатель рядом с названием включает и выключает
              сценарий без удаления. Опция «Не проверять следующие сценарии после выполнения ветки»
              позволяет остановить дальнейшую обработку этого события другими сценариями.
            </div>
          </q-expansion-item>
        </q-list>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script>
import AutomationTraceDetails from 'src/components/automation/AutomationTraceDetails.vue'
import OperatorHintStats from 'src/components/jev/OperatorHintStats.vue'
import AutomationTreeLevel from 'src/components/automation/AutomationTreeLevel.vue'
import axios from 'axios'
import AutomationFlowEditor from 'components/automation/AutomationFlowEditor.vue'
import AutomationExpressionInput from 'components/automation/AutomationExpressionInput.vue'
import AutomationEventSelect from 'components/automation/AutomationEventSelect.vue'
import {useStore} from 'stores/store'
import {
  createDefaultWorkflow,
  getWorkflowTriggerType,
  legacyRuleToWorkflow,
  parseWorkflowDefinition
} from 'src/util/automationFlow'

export default {
  name: 'AutomatizationPage',

  components: {
    OperatorHintStats,
    AutomationTraceDetails,
    AutomationTreeLevel,
    AutomationFlowEditor,
    AutomationExpressionInput,
    AutomationEventSelect
  },

  data: () => ({
    isNewTigger: true,
    dialogVisible: false,
    savedEditorSnapshot: null,
    discardConfirmation: null,
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
    testEventPayload: '',
    graphHistory: [],
    hintStatsOpened: false,
    graphBackups: [],
    historyLoading: false,
    workflow: createDefaultWorkflow('TASK_CREATED'),
    workflowValidation: {errors: [], warnings: []},
    saving: false,
    togglingTriggerIds: [],
    folders: [],
    tree: [],
    showAutomationGuide: false,
    isAutomationIntroVisible: localStorage.getItem('automation-intro-dismissed') !== 'true',
  }),

  computed: {
    // В графе есть шаг «Опубликовать подсказку оператору» — показываем оценки подсказок этого правила
    workflowPublishesHints() {
      return this.editorMode === 'workflow' &&
        (this.workflow?.nodes || []).some(node => node?.config?.operation === 'hint.publish')
    },

    // Правило из ссылки ?ruleId=… (например, из статистики подсказок) открывается, когда список правил загружен
    routeRuleId() {
      const id = Number(this.$route?.query?.ruleId)
      return Number.isFinite(id) && id > 0 && this.store.triggers.some(trigger => trigger.id === id) ? id : null
    },

    hasUnsavedEditorChanges() {
      return this.dialogVisible && this.savedEditorSnapshot !== null && this.editorSnapshot() !== this.savedEditorSnapshot
    },

    triggerById() {
      return Object.fromEntries(this.store.triggers.map(trigger => [trigger.id, trigger]))
    },

    folderById() {
      return Object.fromEntries(this.folders.map(folder => [folder.id, folder]))
    },

    // Ключ раскладки: меняется только когда правило/папка сменили место, а не при правке содержимого.
    layoutKey() {
      return JSON.stringify([
        this.store.triggers.map(t => [t.id, t.folderId ?? null, t.displayOrder ?? 0]),
        this.folders.map(f => [f.id, f.displayOrder ?? 0, f.parentId ?? null])
      ])
    },

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
        {label: 'Канал обращения', value: 'client.sourceChannel', kind: 'text'},
        {label: 'Источник сообщения события', value: 'message.fromSource', kind: 'text'},
        {label: 'Источник последнего сообщения', value: 'client.lastMessage.fromSource', kind: 'text'}
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

  watch: {
    routeRuleId: {
      immediate: true,
      handler(id) {
        if (!id) {
          return
        }
        const rule = this.store.triggers.find(trigger => trigger.id === id)
        const query = {...this.$route.query}
        delete query.ruleId
        this.$router.replace({path: this.$route.path, query}).catch(() => undefined)
        if (rule && !this.dialogVisible) {
          this.editTrigger(rule)
        }
      }
    },

    hasUnsavedEditorChanges(dirty) {
      if (dirty) {
        window.addEventListener('beforeunload', this.onEditorBeforeUnload)
      } else {
        window.removeEventListener('beforeunload', this.onEditorBeforeUnload)
      }
    },

    layoutKey: {
      immediate: true,
      handler() {
        this.rebuildTree()
      }
    }
  },

  methods: {
    editorSnapshot() {
      const definition = this.editorMode === 'workflow'
        ? this.workflow
        : {
            triggerType: this.selectedTriggerType,
            expression: this.editorMode === 'graph' ? this.graphExpression : this.dialogTriggerExpression,
            action: this.editorMode === 'graph' ? this.graphAction : this.dialogTriggerAction,
            elseAction: this.editorMode === 'graph' ? this.graphElseAction : this.dialogTriggerElseAction
          }
      // Object key order can change after normalization or undo without changing the graph.
      return JSON.stringify({
        name: this.dialogTriggerName || '',
        description: this.dialogTriggerDescription || '',
        enabled: this.dialogTriggerEnabled,
        stopProcessing: this.dialogStopProcessing,
        mode: this.editorMode,
        definition
      }, (_key, value) => value && typeof value === 'object' && !Array.isArray(value)
        ? Object.fromEntries(Object.keys(value).sort().map(key => [key, value[key]]))
        : value)
    },

    confirmDiscardChanges({deleting = false} = {}) {
      if (!this.hasUnsavedEditorChanges) return Promise.resolve(true)
      if (this.discardConfirmation) return this.discardConfirmation
      this.discardConfirmation = new Promise(resolve => {
        this.$q.dialog({
          title: deleting ? 'Удалить сценарий?' : 'Несохранённые изменения',
          message: deleting
            ? 'В сценарии есть несохранённые изменения. Удалить сценарий вместе с ними?'
            : 'Изменения сценария не сохранены. Закрыть редактор без сохранения?',
          cancel: {label: 'Продолжить редактирование', flat: true, noCaps: true},
          ok: {label: deleting ? 'Удалить сценарий' : 'Закрыть без сохранения', color: 'negative', noCaps: true},
          persistent: true
        }).onOk(() => resolve(true)).onCancel(() => resolve(false)).onDismiss(() => resolve(false))
      }).finally(() => { this.discardConfirmation = null })
      return this.discardConfirmation
    },

    onEditorBeforeUnload(event) {
      if (!this.hasUnsavedEditorChanges) return
      event.preventDefault()
      event.returnValue = ''
    },

    onEditorVisibilityChange(visible) {
      if (!visible) this.dialogClose()
    },

    closeEditor() {
      this.dialogVisible = false
      this.savedEditorSnapshot = null
    },

    triggerTypeLabel(trigger) {
      return this.store.triggerTypeLabels[trigger.triggerType] || trigger.triggerType
    },

    // Дерево отображения строится из плоских данных бэкенда: в каждом контейнере папки и правила вперемешку по displayOrder.
    rebuildTree() {
      const byPosition = (a, b) => (a.position - b.position) || (a.sort - b.sort)
      const folderIds = new Set(this.folders.map(folder => folder.id))
      const containerOf = folder => (folder.parentId != null && folderIds.has(folder.parentId) ? folder.parentId : null)
      const build = containerId => {
        const nodes = []
        this.folders.filter(folder => containerOf(folder) === containerId).forEach(folder => nodes.push({
          key: `folder-${folder.id}`,
          type: 'folder',
          id: folder.id,
          position: folder.displayOrder ?? 0,
          sort: -1,
          children: build(folder.id)
        }))
        this.store.triggers
          .filter(trigger => (trigger.folderId != null && folderIds.has(trigger.folderId) ? trigger.folderId : null) === containerId)
          .forEach(trigger => nodes.push({
            key: `trigger-${trigger.id}`,
            type: 'trigger',
            id: trigger.id,
            position: trigger.displayOrder ?? 0,
            sort: trigger.orderNumber ?? 0
          }))
        return nodes.sort(byPosition)
      }
      this.tree = build(null)
    },

    async onTreeDragEnd() {
      this.dragging = false
      await this.saveLayout()
    },

    layoutItems(nodes = this.tree) {
      return nodes.map(node => node.type === 'folder'
        ? {type: 'FOLDER', id: node.id, items: this.layoutItems(node.children)}
        : {type: 'TRIGGER', id: node.id})
    },

    applyLayoutResponse(data) {
      if (!data) return
      this.folders = data.folders || []
      const placements = new Map((data.triggers || []).map(item => [item.id, item]))
      this.store.triggers.forEach(trigger => {
        const placement = placements.get(trigger.id)
        if (placement) {
          Object.assign(trigger, {
            folderId: placement.folderId,
            displayOrder: placement.displayOrder,
            orderNumber: placement.orderNumber
          })
        }
      })
      // Порядок выполнения = порядок чтения дерева; держим массив в нём же.
      this.store.triggers.sort((a, b) => (a.orderNumber ?? 0) - (b.orderNumber ?? 0))
      this.rebuildTree()
    },

    async saveLayout() {
      try {
        const response = await axios.put('/api/v1/automation/layout', {items: this.layoutItems()})
        this.applyLayoutResponse(response.data)
      } catch (e) {
        this.rebuildTree()
        this.$q.notify({message: e.response?.data?.message || 'Не удалось сохранить расположение автоматизаций', type: 'negative'})
      }
    },

    async loadFolders() {
      try {
        const response = await axios.get('/api/v1/automation/folders')
        this.folders = Array.isArray(response.data) ? response.data : []
      } catch (e) {
        console.warn('Automation folders load failed', e)
      }
    },

    folderNameDialog(title, model) {
      return this.$q.dialog({
        title,
        prompt: {model, type: 'text', outlined: true, label: 'Название папки', isValid: value => value.trim().length > 0},
        cancel: {label: 'Отмена', flat: true, noCaps: true},
        ok: {label: 'Сохранить', noCaps: true},
        persistent: true
      })
    },

    createFolder() {
      this.folderNameDialog('Новая папка', 'Новая папка').onOk(async name => {
        try {
          const response = await axios.post('/api/v1/automation/folders', {name})
          this.folders.push(response.data)
        } catch (e) {
          this.$q.notify({message: e.response?.data?.message || 'Не удалось создать папку', type: 'negative'})
        }
      })
    },

    renameFolder(folderId) {
      const folder = this.folderById[folderId]
      if (!folder) return
      this.folderNameDialog('Переименовать папку', folder.name).onOk(async name => {
        try {
          const response = await axios.patch(`/api/v1/automation/folders/${folderId}`, {name})
          Object.assign(folder, response.data)
        } catch (e) {
          this.$q.notify({message: e.response?.data?.message || 'Не удалось переименовать папку', type: 'negative'})
        }
      })
    },

    async toggleFolder(folderId) {
      const folder = this.folderById[folderId]
      if (!folder) return
      const collapsed = !folder.collapsed
      folder.collapsed = collapsed
      try {
        await axios.patch(`/api/v1/automation/folders/${folderId}`, {collapsed})
      } catch (e) {
        folder.collapsed = !collapsed
        this.$q.notify({message: 'Не удалось сохранить состояние папки', type: 'negative'})
      }
    },

    deleteFolder(folderId) {
      const folder = this.folderById[folderId]
      if (!folder) return
      this.$q.dialog({
        title: 'Удалить папку?',
        message: `Папка «${folder.name}» будет удалена, а автоматизации из неё останутся в списке на её месте.`,
        cancel: {label: 'Отмена', flat: true, noCaps: true},
        ok: {label: 'Удалить', color: 'negative', noCaps: true},
        persistent: true
      }).onOk(async () => {
        try {
          const response = await axios.delete(`/api/v1/automation/folders/${folderId}`)
          this.applyLayoutResponse(response.data)
        } catch (e) {
          this.$q.notify({message: e.response?.data?.message || 'Не удалось удалить папку', type: 'negative'})
        }
      })
    },

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
      this.testEventPayload = ''
      this.graphHistory = []
      this.graphBackups = []
      this.hintStatsOpened = false
      const parsedWorkflow = parseWorkflowDefinition(row.workflowDefinition, row.triggerType)
      if (parsedWorkflow) {
        this.workflow = parsedWorkflow
        this.workflowValidation = {errors: [], warnings: []}
        this.editorMode = 'workflow'
      } else {
        this.workflow = legacyRuleToWorkflow(row)
        this.editorMode = this.readGraph(row.expression, row.action, row.elseAction) ? 'graph' : 'script'
      }
      this.savedEditorSnapshot = this.editorSnapshot()
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
      this.savedEditorSnapshot = this.editorSnapshot()
      setTimeout(() => this.$refs.dialogTriggerName.focus(), 250)
    },

    async dialogClose() {
      if (this.saving) return
      if (await this.confirmDiscardChanges()) this.closeEditor()
    },

    dismissAutomationIntro() {
      this.isAutomationIntroVisible = false
      localStorage.setItem('automation-intro-dismissed', 'true')
    },

    async dialogSaveNewOrUpdateTrigger() {
      let workflowDefinition = null
      let workflowVersion = 1

      if (this.editorMode === 'workflow') {
        if (this.workflowValidation.errors?.length) {
          this.$q.notify({
            message: this.workflowValidation.errors[0],
            type: 'negative'
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
          type: 'negative'
        })
        return
      }

      const submittedEditorSnapshot = this.editorSnapshot()
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
          this.triggerId = response.data.id
          this.isNewTrigger = false
        } else {
          const index = this.store.triggers.findIndex(item => item.id === this.triggerId)
          if (index >= 0) this.store.triggers.splice(index, 1, response.data)
        }
        this.savedEditorSnapshot = submittedEditorSnapshot
        if (!this.hasUnsavedEditorChanges) {
          this.closeEditor()
        } else {
          this.$q.notify({type: 'positive', message: 'Сценарий сохранён. Более поздние изменения ещё не сохранены.'})
        }
      } catch (e) {
        this.$q.notify({
          message: e.response?.data?.message || e.message,
          type: 'negative'
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
          type: 'negative'
        })
      } finally {
        this.togglingTriggerIds = this.togglingTriggerIds.filter(id => id !== trigger.id)
      }
    },

    async loadGraphHistory() {
      this.historyLoading = true
      try { const [history, backups] = await Promise.all([axios.get('/api/v1/automation/history', {params: {triggerId: this.triggerId}}), axios.get('/api/v1/automation/backups', {params: {triggerId: this.triggerId}})]); this.graphHistory = history.data.map(row => ({...row, step: typeof row.step === 'string' ? JSON.parse(row.step) : row.step})); this.graphBackups = backups.data.map(row => ({...row, definition: typeof row.definition === 'string' ? JSON.parse(row.definition) : row.definition})) } catch (error) { this.$q.notify({type: 'negative', message: 'Не удалось загрузить журнал шагов'}) } finally { this.historyLoading = false }
    },
    openGraphBackup(backup) { const restored = parseWorkflowDefinition(backup.definition.workflow_definition); if (!restored) { this.$q.notify({type: 'negative', message: 'В этой версии нет графового определения'}); return } this.workflow = restored; this.editorMode = 'workflow'; this.$q.notify({type: 'info', message: 'Прежний граф открыт. Проверьте его и нажмите «Сохранить», чтобы применить.'}) },
    focusTraceStep(step) { this.$refs.workflowEditor?.focusNode(step.nodeId) },
    runRoutingTest() {
      if (!this.testTaskId && !this.testEventPayload.trim()) {
        this.$q.notify({
          message: 'Укажите ID заявки',
          type: 'negative'
        })
        return
      }

      let payload
      if (this.editorMode === 'workflow') {
        if (this.workflowValidation.errors?.length) {
          this.$q.notify({
            message: this.workflowValidation.errors[0],
            type: 'negative'
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
            type: 'negative'
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

      if (this.testEventPayload.trim() && this.editorMode === 'workflow') {
        try { payload.eventPayload = JSON.parse(this.testEventPayload) } catch (error) { this.$q.notify({type: 'negative', message: 'Данные события должны быть корректным JSON'}); return }
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
      if (result?.trace?.some(step => step.status === 'NEEDS_INPUT')) return 'Проверка остановлена: задайте пример ответа анализа'
      if (result?.executed) return 'Маршрут проверен; реальные изменения не выполнялись'
      if (result?.scheduled) return 'Маршрут остановится на ожидающем узле'
      if (result?.completed) return 'Маршрут завершится без выполнения действий'
      return 'Маршрут не дошёл до выполняемого действия'
    },

    workflowTraceStatusLabel(status) {
      const labels = {
        PREVIEW: 'проверка без изменений',
        NEEDS_INPUT: 'нужен пример ответа анализа',
        QUEUED: 'поставлено в очередь',
        ITERATED: 'список обработан',
        BREAK: 'цикл остановлен',
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

    async dialogDeleteTrigger() {
      if (this.saving || !await this.confirmDiscardChanges({deleting: true})) return
      return axios.delete(`/api/v1/trigger/${this.triggerId}`)
        .then(() => {
          this.store.triggers = this.store.triggers.filter(trigger => trigger.id !== this.triggerId)
          this.closeEditor()
        })
        .catch(e =>
          this.$q.notify({
            message: e.message,
            type: 'negative'
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
    this.loadFolders()
  },

  beforeUnmount() {
    window.removeEventListener('beforeunload', this.onEditorBeforeUnload)
  },

  async beforeRouteLeave() {
    if (this.saving) return false
    const confirmed = await this.confirmDiscardChanges()
    if (confirmed) this.closeEditor()
    return confirmed
  },

  setup() {
    // Порядок выполнения правил сервер пересчитывает сам при сохранении раскладки (PUT /automation/layout).
    const store = useStore()
    return {store}
  }
}
</script>

<style scoped>
.automation-dialog {
  width: 100vw;
  max-width: 100vw;
  height: 100vh;
  max-height: 100vh;
  display: flex;
  flex-direction: column;
}

.automation-editor-section {
  padding: 0 24px 30px;
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
}

.automation-editor-section > .q-field + .q-field {
  margin-top: 8px;
}

/* Шапка редактора в одну строку: название, описание и переключатели занимают минимум высоты */
.automation-editor-header {
  padding: 4px 0 8px;
}

/* Журнал и оценки подсказок лежат в прокручиваемой области под графом, а не закреплены внизу окна */
.automation-editor-extra {
  margin-top: 12px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
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
  min-height: 490px;
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

.automation-intro-banner {
  margin-top: 8px;
}

.automation-guide-dialog {
  width: 640px;
  max-width: 92vw;
}

.automation-guide-section {
  padding: 0;
  max-height: 70vh;
  overflow-y: auto;
}

.automation-guide-text {
  padding: 0 16px 16px;
  color: #4a4a4f;
  font-size: 14px;
  line-height: 1.5;
}

.automation-guide-node-group {
  margin-top: 8px;
}

.automation-guide-node-group:first-child {
  margin-top: 0;
}

@media (max-width: 900px) {
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
