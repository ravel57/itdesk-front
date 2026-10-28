import axios from 'axios'
import {downloadBlob} from 'src/util/settingsClients/clientFiles'

// Скачивание шаблона CSV (используется в справке и в диалоге импорта).
// Требует в компоненте: this.notifyError, this.getErrorMessage (clientNotifyMixin).
export default {
  methods: {
    downloadImportTemplate() {
      axios.get('/api/v1/client-users/import-csv/template', {responseType: 'blob'})
        .then(response => downloadBlob(response.data, 'client-users-import-template.csv', 'text/csv;charset=utf-8'))
        .catch(error => this.notifyError(this.getErrorMessage(error)))
    }
  }
}
