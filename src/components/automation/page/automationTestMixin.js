import axios from 'axios'

// Проверка маршрута автоматизации на существующей заявке (без изменения данных).
// Требует в компоненте: this.editorMode, this.workflow, this.workflowValidation, graph* и dialogTrigger*
// (automationEditorMixin / automationGraphMixin).
export default {
  data: () => ({
    testTaskId: null,
    testLoading: false,
    testResult: null,
    testEventPayload: ''
  }),

  methods: {
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
    }
  }
}
