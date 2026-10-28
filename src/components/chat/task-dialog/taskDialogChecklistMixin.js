import { appendMissingChecklistItems, copyChecklist, createChecklistItemId, getChecklistItemsLabel, normalizeChecklist } from 'src/util/taskDialog/checklist'

// Чек-лист заявки в диалоге: пункты, добавление/удаление, применение шаблона типа заявки.
// Требует в компоненте: selectedTaskType (taskDialogDirectoriesMixin), taskFieldsInitializing (taskDialogFormMixin).
export default {
  data: () => ({
    dialogTaskChecklist: [],
    newChecklistItemText: '',
    typeChecklistApplyDialog: false
  }),

  computed: {
    selectedTaskTypeChecklist () {
      return normalizeChecklist(this.selectedTaskType?.checklistTemplate)
    },

    selectedTaskTypeChecklistLabel () {
      return getChecklistItemsLabel(this.selectedTaskTypeChecklist)
    }
  },

  methods: {
    addChecklistItem () {
      const text = this.newChecklistItemText.trim()

      if (!text) {
        return
      }

      this.dialogTaskChecklist.push({
        id: createChecklistItemId(),
        text,
        completed: false
      })

      this.newChecklistItemText = ''
    },

    removeChecklistItem (id) {
      this.dialogTaskChecklist = this.dialogTaskChecklist.filter(item => item.id !== id)
    },

    onTaskTypeChanged () {
      if (this.taskFieldsInitializing) {
        return
      }
      const selectedType = this.selectedTaskType
      if (!selectedType) {
        return
      }
      const template = normalizeChecklist(selectedType.checklistTemplate)
      if (template.length === 0) {
        return
      }
      if (selectedType.autoApplyChecklist === false) {
        return
      }
      if (this.dialogTaskChecklist.length === 0) {
        this.dialogTaskChecklist = copyChecklist(template)
        return
      }
      this.typeChecklistApplyDialog = true
    },

    openApplyTypeChecklistDialog () {
      if (this.selectedTaskTypeChecklist.length === 0) {
        return
      }
      if (this.dialogTaskChecklist.length === 0) {
        this.applySelectedTypeChecklist('replace')
        return
      }
      this.typeChecklistApplyDialog = true
    },

    applySelectedTypeChecklist (mode) {
      const template = copyChecklist(this.selectedTaskTypeChecklist)
      if (mode === 'replace') {
        this.dialogTaskChecklist = template
        return
      }
      if (mode === 'append') {
        this.dialogTaskChecklist = appendMissingChecklistItems(this.dialogTaskChecklist, template)
      }
    }
  }
}
