import axios from 'axios'
import {
  ASSIGNMENT_STRATEGY_OPTIONS,
  OLA_UNIT_OPTIONS,
  VISIBILITY_OPTIONS
} from 'src/util/settingsSupportLines/supportLineOptions'
import {
  buildLineForm,
  buildLinePayload,
  createEmptyLineForm,
  syncTeamSelections
} from 'src/util/settingsSupportLines/supportLineForm'
import {getSupportLineErrorMessage} from 'src/util/settingsSupportLines/supportLineLabels'
import {
  buildObserverOptions,
  buildUserOptions,
  isTeamUser,
  normalizeUserRole,
  sanitizeLineUserIds,
  userName
} from 'src/util/settingsSupportLines/supportLineUsers'

// Диалог создания/редактирования линии: состояние формы, списки выбора, сохранение и удаление.
// Требует в компоненте: this.store (setup: useStore()).
export default {
  data: () => ({
    dialogTab: 'general',
    dialogVisible: false,
    isNew: true,
    saving: false,
    form: {},
    assignmentStrategyOptions: ASSIGNMENT_STRATEGY_OPTIONS,
    visibilityOptions: VISIBILITY_OPTIONS,
    olaUnitOptions: OLA_UNIT_OPTIONS
  }),

  computed: {
    userOptions() {
      return buildUserOptions(this.store.users)
    },

    observerOptions() {
      return buildObserverOptions(this.store.users, this.form)
    }
  },

  created() {
    this.form = this.createEmptyLineForm()
  },

  methods: {
    createEmptyLineForm,
    normalizeUserRole,
    isTeamUser,
    sanitizeLineUserIds,
    userName,

    syncTeamSelections() {
      syncTeamSelections(this.form)
    },

    openCreate() {
      this.isNew = true
      this.dialogTab = 'general'
      this.form = {
        ...this.createEmptyLineForm(),
        defaultSelection: this.store.supportLines.length === 0,
        orderNumber: this.store.supportLines.length
      }
      this.dialogVisible = true
    },

    openEdit(line) {
      this.isNew = false
      this.dialogTab = 'general'
      this.form = buildLineForm(line)
      this.dialogVisible = true
    },

    buildPayload() {
      return buildLinePayload(this.form)
    },

    saveLine() {
      if (!this.form.name.trim()) {
        this.$q.notify({
          type: 'negative',
          message: 'Укажите название линии'
        })
        return
      }
      if (this.form.olaEnabled && Number(this.form.olaValue || 0) <= 0) {
        this.$q.notify({
          type: 'negative',
          message: 'Укажите положительный срок OLA'
        })
        this.dialogTab = 'ola'
        return
      }

      this.saving = true
      const request = this.isNew
        ? axios.post('/api/v1/support-line', this.buildPayload())
        : axios.patch('/api/v1/support-line', this.buildPayload())

      request
        .then(({data}) => {
          const index = this.store.supportLines.findIndex(line => line.id === data.id)
          if (index === -1) this.store.supportLines.push(data)
          else this.store.supportLines.splice(index, 1, data)
          if (data.defaultSelection) {
            this.store.supportLines = this.store.supportLines.map(line => ({
              ...line,
              defaultSelection: line.id === data.id
            }))
          }
          this.dialogVisible = false
        })
        .catch(error => this.showError(error))
        .finally(() => {
          this.saving = false
        })
    },

    removeLine() {
      axios.delete(`/api/v1/support-line/${this.form.id}`)
        .then(() => {
          this.store.supportLines = this.store.supportLines.filter(line => line.id !== this.form.id)
          this.dialogVisible = false
        })
        .catch(error => this.showError(error))
    },

    showError(error) {
      this.$q.notify({
        type: 'negative',
        message: getSupportLineErrorMessage(error)
      })
    }
  }
}
