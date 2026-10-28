import axios from 'axios'
import {getWorkflowTriggerType} from 'src/util/automationFlow'

// Сохранение и удаление автоматизации из окна редактора.
// Требует в компоненте: состояние редактора (automationEditorMixin), graph* (automationGraphMixin), this.store.
export default {
  data: () => ({
    saving: false
  }),

  methods: {
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

    // Удаление необратимо, поэтому всегда спрашиваем явно, а не только когда есть несохранённые правки
    confirmDeleteTrigger() {
      const name = String(this.dialogTriggerName || '').trim()
      const unsaved = this.hasUnsavedEditorChanges
      return new Promise(resolve => {
        this.$q.dialog({
          title: 'Удалить автоматизацию?',
          message: `Автоматизация${name ? ` «${name}»` : ''} будет удалена безвозвратно${unsaved ? ', вместе с несохранёнными изменениями' : ''}. Ожидающие запуски этого сценария будут отменены. Это действие нельзя отменить.`,
          cancel: {label: 'Отмена', flat: true, noCaps: true},
          ok: {label: 'Удалить', color: 'negative', noCaps: true},
          persistent: true
        }).onOk(() => resolve(true)).onCancel(() => resolve(false)).onDismiss(() => resolve(false))
      })
    },

    async dialogDeleteTrigger() {
      if (this.saving || !await this.confirmDeleteTrigger()) return
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
    }
  }
}
