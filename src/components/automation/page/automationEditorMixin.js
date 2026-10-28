import {
  createDefaultWorkflow,
  legacyRuleToWorkflow,
  parseWorkflowDefinition
} from 'src/util/automationFlow'
import {buildEditorSnapshot} from 'src/util/automationPage/editorSnapshot'

// Состояние окна редактора автоматизации: поля, открытие (новая/существующая), закрытие,
// защита от потери несохранённых изменений.
// Требует в компоненте: this.readGraph/resetGraph/graph* (automationGraphMixin),
// this.testTaskId/testResult/testEventPayload (automationTestMixin), this.saving (automationEditorSaveMixin),
// this.$refs.dialogTriggerName / workflowEditor.
export default {
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
    isNewTrigger: false,
    triggerId: null, // for update
    editorMode: 'graph',
    dialogTriggerEnabled: true,
    dialogStopProcessing: false,
    workflow: createDefaultWorkflow('TASK_CREATED'),
    workflowValidation: {errors: [], warnings: []}
  }),

  computed: {
    // В графе есть шаг «Опубликовать подсказку оператору» — показываем оценки подсказок этого правила
    workflowPublishesHints() {
      return this.editorMode === 'workflow' &&
        (this.workflow?.nodes || []).some(node => node?.config?.operation === 'hint.publish')
    },

    hasUnsavedEditorChanges() {
      return this.dialogVisible && this.savedEditorSnapshot !== null && this.editorSnapshot() !== this.savedEditorSnapshot
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
    }
  },

  watch: {
    hasUnsavedEditorChanges(dirty) {
      if (dirty) {
        window.addEventListener('beforeunload', this.onEditorBeforeUnload)
      } else {
        window.removeEventListener('beforeunload', this.onEditorBeforeUnload)
      }
    }
  },

  beforeUnmount() {
    window.removeEventListener('beforeunload', this.onEditorBeforeUnload)
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
      return buildEditorSnapshot({
        name: this.dialogTriggerName,
        description: this.dialogTriggerDescription,
        enabled: this.dialogTriggerEnabled,
        stopProcessing: this.dialogStopProcessing,
        mode: this.editorMode,
        definition
      })
    },

    confirmDiscardChanges() {
      if (!this.hasUnsavedEditorChanges) return Promise.resolve(true)
      if (this.discardConfirmation) return this.discardConfirmation
      this.discardConfirmation = new Promise(resolve => {
        this.$q.dialog({
          title: 'Несохранённые изменения',
          message: 'Изменения сценария не сохранены. Закрыть редактор без сохранения?',
          cancel: {label: 'Продолжить редактирование', flat: true, noCaps: true},
          ok: {label: 'Закрыть без сохранения', color: 'negative', noCaps: true},
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

    openGraphBackup(backup) {
      const restored = parseWorkflowDefinition(backup.definition.workflow_definition)
      if (!restored) {
        this.$q.notify({type: 'negative', message: 'В этой версии нет графового определения'})
        return
      }
      this.workflow = restored
      this.editorMode = 'workflow'
      this.$q.notify({type: 'info', message: 'Прежний граф открыт. Проверьте его и нажмите «Сохранить», чтобы применить.'})
    },

    focusTraceStep(step) { this.$refs.workflowEditor?.focusNode(step.nodeId) }
  }
}
