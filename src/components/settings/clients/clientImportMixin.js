import axios from 'axios'
import {
  createCredentialColumns,
  createImportColumns
} from 'src/util/settingsClients/clientImportConstants'
import {
  buildImportPayloadRows,
  getImportRowState,
  mapPreviewRows
} from 'src/util/settingsClients/clientImportRows'
import {buildCredentialsCsv, downloadBlob} from 'src/util/settingsClients/clientFiles'

// Состояние и действия диалога импорта клиентов из CSV: выбор файла → предпросмотр → результат.
// Требует в компоненте: this.organizationOptions (prop), this.notifyError / this.getErrorMessage (clientNotifyMixin).
// Событие imported — после успешного импорта (родитель перезагружает пользователей и клиентов).
export default {
  data: () => ({
    importColumns: createImportColumns(),
    credentialColumns: createCredentialColumns(),

    importDialogVisible: false,
    importStage: 'select',
    importFile: null,
    importLoading: false,
    importRows: [],
    importResult: {},
    importCredentials: [],
    bulkDomain: '',
    bulkOrganizationId: null
  }),

  computed: {
    selectedImportRows() {
      return this.importRows.filter(row => row.selected)
    },

    selectedImportRowsCount() {
      return this.selectedImportRows.length
    },

    selectedInvalidRowsCount() {
      return this.selectedImportRows.filter(row => this.getImportRowState(row).level === 'error').length
    },

    selectedValidRowsCount() {
      return this.selectedImportRows.filter(row => this.getImportRowState(row).level !== 'error').length
    },

    allImportRowsSelected() {
      return this.importRows.length > 0 && this.importRows.every(row => row.selected)
    },

    someImportRowsSelected() {
      const selected = this.selectedImportRowsCount
      return selected > 0 && selected < this.importRows.length
    }
  },

  methods: {
    openImportDialog() {
      this.resetImportState()
      this.importDialogVisible = true
    },

    closeImportDialog() {
      this.importDialogVisible = false
      this.resetImportState()
    },

    resetImportState() {
      this.importStage = 'select'
      this.importFile = null
      this.importLoading = false
      this.importRows = []
      this.importResult = {}
      this.importCredentials = []
      this.bulkDomain = ''
      this.bulkOrganizationId = null
    },

    resetImportToFile() {
      this.importStage = 'select'
      this.importFile = null
      this.importRows = []
      this.importResult = {}
      this.importCredentials = []
    },

    loadImportPreview() {
      if (!this.importFile) {
        return
      }
      const formData = new FormData()
      formData.append('file', this.importFile)
      this.importLoading = true
      axios.post('/api/v1/client-users/import-csv/preview', formData, {
        headers: {'Content-Type': 'multipart/form-data'}
      })
        .then(response => {
          const rows = Array.isArray(response.data?.rows) ? response.data.rows : []
          this.importRows = mapPreviewRows(rows)
          this.importStage = 'preview'
          if (!rows.length) {
            this.$q.notify({message: 'В CSV нет строк для импорта', type: 'warning'})
          }
        })
        .catch(error => this.notifyError(this.getErrorMessage(error)))
        .finally(() => {
          this.importLoading = false
        })
    },

    getImportRowState(row) {
      return getImportRowState(row, this.organizationOptions)
    },

    applyBulkDomain() {
      const domain = String(this.bulkDomain || '').trim().replace(/^@+/, '')
      if (!domain) return
      this.importRows.forEach(row => {
        if (!row.selected) return
        const username = String(row.username || '').trim()
        if (username && !username.includes('@')) {
          row.username = `${username}@${domain}`.toLowerCase()
        }
      })
    },

    applyBulkOrganization() {
      const organization = this.organizationOptions.find(item => Number(item.id) === Number(this.bulkOrganizationId))
      if (!organization) return
      this.importRows.forEach(row => {
        if (row.selected) {
          row.organization = organization.name
        }
      })
    },

    selectValidImportRows() {
      this.importRows.forEach(row => {
        row.selected = this.getImportRowState(row).level !== 'error'
      })
    },

    clearImportSelection() {
      this.importRows.forEach(row => {
        row.selected = false
      })
    },

    toggleAllImportRows(value) {
      this.importRows.forEach(row => {
        row.selected = Boolean(value)
      })
    },

    removeImportRow(row) {
      this.importRows = this.importRows.filter(item => item !== row)
    },

    commitClientImport() {
      if (!this.selectedImportRowsCount || this.selectedInvalidRowsCount) {
        return
      }
      const rows = buildImportPayloadRows(this.importRows)

      this.importLoading = true
      axios.post('/api/v1/client-users/import-csv', { rows })
        .then(response => {
          this.importResult = response.data || {}
          this.importCredentials = Array.isArray(response.data?.credentials) ? response.data.credentials : []
          this.importStage = 'result'
          this.$emit('imported')
        })
        .catch(error => this.notifyError(this.getErrorMessage(error)))
        .finally(() => {
          this.importLoading = false
        })
    },

    downloadImportCredentials() {
      if (!this.importCredentials.length) {
        return
      }
      const csv = buildCredentialsCsv(this.importCredentials)
      downloadBlob(new Blob([csv], {type: 'text/csv;charset=utf-8'}), 'client-import-credentials.csv')
    }
  }
}
