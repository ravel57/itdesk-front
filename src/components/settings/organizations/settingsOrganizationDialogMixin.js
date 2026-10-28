import axios from 'axios'
import { defaultOrganization, normalizeOrganization } from 'src/util/settingsOrganizations/organizationDefaults'
import { sortByOrderNumber } from 'src/util/settingsOrganizations/organizationList'

// Состояние и действия диалога организации: открыть, сохранить, удалить, закрыть.
// Требует в компоненте: this.store, initDialogPrioritySla / savePrioritySla (settingsOrganizationSlaMixin),
// notifyPositive / notifyNegative (settingsOrganizationHelpersMixin).
// Событие 'saved' — список организаций в сторе обновлён, родителю нужно пересобрать локальный список.
export default {
  data: () => ({
    dialogVisible: false,
    dialogTab: 'main',
    dialog: defaultOrganization(),
    dialogOriginalName: '',
    isNewOrganization: true,
    saving: false
  }),

  methods: {
    dialogNewOrganizationShow() {
      this.isNewOrganization = true
      this.dialogVisible = true
      this.dialogTab = 'main'
      this.dialog = defaultOrganization()
      this.dialogOriginalName = ''
      this.initDialogPrioritySla(null)
      setTimeout(() => this.$refs.dialogName && this.$refs.dialogName.focus(), 250)
    },

    editRow(row) {
      this.isNewOrganization = false
      this.dialogVisible = true
      this.dialogTab = 'main'
      this.dialog = this.normalizeOrganization(row)
      this.dialogOriginalName = row.name
      this.initDialogPrioritySla(row)
    },

    dialogClose() {
      this.dialogVisible = false
      this.dialog = defaultOrganization()
      this.dialogOriginalName = ''
      this.dialogPrioritySla = {}
    },

    normalizeOrganization(organization) {
      return normalizeOrganization(organization)
    },

    dialogSaveNewOrUpdateOrganization() {
      const organization = this.normalizeOrganization(this.dialog)
      organization.id = this.isNewOrganization ? null : this.dialog.id
      organization.orderNumber = this.isNewOrganization ? 0 : this.dialog.orderNumber

      if (!organization.name || organization.name.trim().length === 0) {
        this.notifyNegative('Не заполнены обязательные поля')
        this.dialogTab = 'main'
        return
      }

      this.saving = true
      const request = this.isNewOrganization
        ? axios.post('/api/v1/organization', organization)
        : axios.patch('/api/v1/organization', organization)

      request
        .then(response => this.savePrioritySla(response.data))
        .then(savedOrganization => {
          if (this.isNewOrganization) {
            this.store.organizations.push(savedOrganization)
          } else {
            const index = this.store.organizations.findIndex(organization => organization.id === savedOrganization.id)
            if (index >= 0) {
              this.store.organizations.splice(index, 1, savedOrganization)
            }
          }
          this.store.organizations = sortByOrderNumber(this.store.organizations)
          this.$emit('saved')
          this.dialogClose()
          this.notifyPositive('Организация сохранена')
        })
        .catch(e => this.notifyNegative(e.response?.data?.message || e.response?.data || e.message))
        .finally(() => {
          this.saving = false
        })
    },

    dialogDeleteOrganization() {
      axios.delete(`/api/v1/organization/${this.dialog.id}`)
        .then(() => {
          this.store.organizations = this.store.organizations.filter(organization => organization.id !== this.dialog.id)
          this.dialogClose()
          this.notifyPositive('Организация удалена')
        })
        .catch(e => this.notifyNegative(e.response?.data?.message || e.response?.data || e.message))
    }
  }
}
