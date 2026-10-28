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
          icon="upload_file"
          aria-label="Импорт из JSON"
          @click="this.importDialogVisible = true"
        >
          <q-tooltip>Импорт автоматизаций из JSON</q-tooltip>
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
      class="bg-blue-1 text-primary automation-intro-banner app-shared-plugin-extension-point"
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
      class="rounded-borders settings-row-list automation-tree app-inline app-margin-top-8"
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
        @clone-trigger="this.cloneTrigger"
        @export-trigger="this.exportTrigger"
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
        <div class="text-h6" v-text="this.isNewTrigger ? 'Новая автоматизация' : 'Изменить автоматизацию'"/>
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
            class="automation-workflow-validation app-automatization-page-automation-workflow-validation"
            :class="this.workflowValidation.errors.length ? 'automation-workflow-validation-error app-automation-workflow-validation-error' : 'automation-workflow-validation-warning app-automation-workflow-validation-warning'"
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

        <automation-graph-editor
          v-else-if="this.editorMode === 'graph'"
          v-model:selected-trigger-type="this.selectedTriggerType"
          v-model:else-branch-enabled="this.elseBranchEnabled"
          :graph-condition-groups="this.graphConditionGroups"
          :graph-actions="this.graphActions"
          :graph-else-actions="this.graphElseActions"
          :support-lines="this.supportLines"
          @else-branch-toggle="this.onElseBranchToggle"
          @add-condition-group="this.addConditionGroup"
          @remove-condition-group="this.removeConditionGroup"
          @reset-condition="this.resetCondition"
          @add-condition="this.addCondition"
          @remove-condition="this.removeCondition"
          @add-action="this.addAction"
          @remove-action="this.removeAction"
        />

        <q-banner v-if="this.editorMode === 'graph'" rounded class="automation-preview">
          <div><b>Условие:</b> {{ this.graphExpression || 'Заполните условия' }}</div>
          <div><b>Ветка ДА:</b> {{ this.graphAction || 'Добавьте действие' }}</div>
          <div><b>Ветка НЕТ:</b> {{ this.graphElseAction || 'Перейти к следующему сценарию' }}</div>
        </q-banner>

        <automation-test-panel
          v-if="this.editorMode !== 'script'"
          v-model:test-task-id.number="this.testTaskId"
          v-model:test-event-payload="this.testEventPayload"
          :editor-mode="this.editorMode"
          :test-loading="this.testLoading"
          :test-result="this.testResult"
          @run="this.runRoutingTest"
          @focus-step="this.focusTraceStep"
        />

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
        <automation-editor-extras
          :trigger-id="this.triggerId"
          :is-new-trigger="this.isNewTrigger"
          :workflow-publishes-hints="this.workflowPublishesHints"
          @focus-step="this.focusTraceStep"
          @open-backup="this.openGraphBackup"
        />
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

  <automation-import-dialog v-model="this.importDialogVisible" @imported="this.rebuildTree"/>

  <automation-guide-dialog v-model="this.showAutomationGuide"/>
</template>

<script>
import axios from 'axios'
import AutomationTreeLevel from 'src/components/automation/AutomationTreeLevel.vue'
import AutomationFlowEditor from 'components/automation/AutomationFlowEditor.vue'
import AutomationExpressionInput from 'components/automation/AutomationExpressionInput.vue'
import AutomationEventSelect from 'components/automation/AutomationEventSelect.vue'
import AutomationEditorExtras from 'components/automation/page/AutomationEditorExtras.vue'
import AutomationGraphEditor from 'components/automation/page/AutomationGraphEditor.vue'
import AutomationGuideDialog from 'components/automation/page/AutomationGuideDialog.vue'
import AutomationImportDialog from 'components/automation/page/AutomationImportDialog.vue'
import AutomationTestPanel from 'components/automation/page/AutomationTestPanel.vue'
import automationEditorMixin from 'components/automation/page/automationEditorMixin'
import automationEditorSaveMixin from 'components/automation/page/automationEditorSaveMixin'
import automationGraphMixin from 'components/automation/page/automationGraphMixin'
import automationTestMixin from 'components/automation/page/automationTestMixin'
import automationTreeMixin from 'components/automation/page/automationTreeMixin'
import automationTriggerActionsMixin from 'components/automation/page/automationTriggerActionsMixin'
import {useStore} from 'stores/store'

export default {
  name: 'AutomatizationPage',

  components: {
    AutomationEditorExtras,
    AutomationGraphEditor,
    AutomationGuideDialog,
    AutomationImportDialog,
    AutomationTestPanel,
    AutomationTreeLevel,
    AutomationFlowEditor,
    AutomationExpressionInput,
    AutomationEventSelect
  },

  mixins: [
    automationTreeMixin,
    automationTriggerActionsMixin,
    automationGraphMixin,
    automationEditorMixin,
    automationEditorSaveMixin,
    automationTestMixin
  ],

  data: () => ({
    showTooltipSetDefault: false,
    supportLines: [],
    showAutomationGuide: false,
    importDialogVisible: false,
    isAutomationIntroVisible: localStorage.getItem('automation-intro-dismissed') !== 'true',
  }),

  computed: {
    // Правило из ссылки ?ruleId=… (например, из статистики подсказок) открывается, когда список правил загружен
    routeRuleId() {
      const id = Number(this.$route?.query?.ruleId)
      return Number.isFinite(id) && id > 0 && this.store.triggers.some(trigger => trigger.id === id) ? id : null
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
    }
  },

  methods: {
    dismissAutomationIntro() {
      this.isAutomationIntroVisible = false
      localStorage.setItem('automation-intro-dismissed', 'true')
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
/* Четыре кнопки в шапке не должны сжимать заголовок: при нехватке места они переносятся под него */
.settings-content-header {
  flex-wrap: wrap;
}

.settings-content-heading {
  flex: 1 1 320px;
}

.automation-editor-header {
  padding: 4px 0 8px;
}

.automation-mode-toggle {
  margin-top: 20px;
  margin-bottom: 28px;
}

.automation-workflow-wrapper {
  min-height: 490px;
  margin-top: 4px;
}

.automation-preview {
  margin-top: 18px;
  border: 1px solid var(--app-border, #e0e0e0);
  background: var(--app-surface-muted, #f5f5f5);
  color: var(--app-text-muted, #616161);
  word-break: break-word;
}

.automation-preview > div + div {
  margin-top: 6px;
}

.automation-dialog-actions {
  padding: 12px 20px 16px;
}
@media (max-width: 900px) {
  .automation-editor-section {
    padding-right: 16px;
    padding-left: 16px;
  }
}
</style>
