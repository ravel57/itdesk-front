<template>
  <div class="q-pa-md">
    <div class="settings-content-header">
      <div class="settings-content-heading">
        <div class="settings-content-title">Клиенты</div>
        <div class="settings-content-description">
          Управляйте учетными записями клиентов и их привязкой к организациям.
        </div>
      </div>
      <div class="settings-content-actions">
        <q-btn
          outline
          color="primary"
          icon="upload_file"
          label="Импорт из CSV"
          @click="openImportDialog"
        />
        <q-btn
          unelevated
          color="primary"
          icon="add"
          label="Добавить клиента"
          @click="dialogNewClient"
        />
      </div>
    </div>

    <client-import-guide/>

    <q-input
      v-model="clientSearch"
      dense
      outlined
      clearable
      debounce="150"
      placeholder="Поиск клиентов"
      class="settings-search q-mb-md"
    >
      <template #prepend>
        <q-icon name="search"/>
      </template>
    </q-input>

    <div class="table-container app-width-full">
      <q-table
        class="settings-row-table"
        :rows="filteredClientUsers"
        :columns="columns"
        row-key="id"
        full-width
        :rows-per-page-options="[10, 20, 50]"
        rows-per-page-label="Строк на странице"
      >
        <template #body-cell-organization="props">
          <q-td :props="props">
            <div
              class="organization-name-ellipsis"
              style="max-width: 320px"
              :title="props.row.organizationName || ''"
            >{{ props.row.organizationName || '—' }}</div>
          </q-td>
        </template>

        <template #body-cell-edit="props">
          <q-td>
            <q-btn
              color="primary"
              dense
              flat
              icon="edit"
              @click="editClient(props.row)"
            >
              <q-tooltip>Изменить клиента</q-tooltip>
            </q-btn>
          </q-td>
        </template>
      </q-table>
    </div>
  </div>

  <client-edit-dialog
    ref="editDialog"
    :organization-options="organizationOptions"
    @change-password="openPasswordDialog"
  />

  <client-password-dialog ref="passwordDialog"/>

  <client-import-dialog
    ref="importDialog"
    :organization-options="organizationOptions"
    @imported="onClientsImported"
  />
</template>

<script>
import {useStore} from 'stores/store'
import axios from 'axios'
import {createClientColumns} from 'src/util/settingsClients/clientImportConstants'
import {matchesSearch, normalizeSearch} from 'src/util/settingsClients/clientSearch'
import {buildOrganizationOptions} from 'src/util/settingsClients/clientOptions'
import clientNotifyMixin from 'components/settings/clients/clientNotifyMixin'
import clientsDataMixin from 'components/settings/clients/clientsDataMixin'
import ClientImportGuide from 'components/settings/clients/ClientImportGuide.vue'
import ClientEditDialog from 'components/settings/clients/ClientEditDialog.vue'
import ClientPasswordDialog from 'components/settings/clients/ClientPasswordDialog.vue'
import ClientImportDialog from 'components/settings/clients/ClientImportDialog.vue'

export default {
  name: 'ClientsSettingsPage',

  components: {ClientImportGuide, ClientEditDialog, ClientPasswordDialog, ClientImportDialog},

  mixins: [clientNotifyMixin, clientsDataMixin],

  data: () => ({
    columns: createClientColumns(),
    clientSearch: ''
  }),

  computed: {
    clientUsers() {
      return (this.store.users || [])
        .filter(user => user?.authorities?.[0] === 'CLIENT')
        .map(user => {
          const client = this.getClientById(user.clientId)
          return {
            ...user,
            organizationName: client?.organization?.name || '',
            clientCardLabel: client ? this.getClientDisplayName(client) : (user.clientId ? `Клиент #${user.clientId}` : ''),
            clientSearchValues: [
              client?.id,
              client?.email,
              client?.phoneNumber
            ]
          }
        })
    },

    filteredClientUsers() {
      const needle = normalizeSearch(this.clientSearch)
      if (!needle) {
        return this.clientUsers
      }

      return this.clientUsers.filter(user => matchesSearch([
        user.id,
        user.clientId,
        user.username,
        user.firstname,
        user.lastname,
        user.organizationName,
        user.clientCardLabel,
        ...(user.clientSearchValues || [])
      ], needle))
    },

    organizationOptions() {
      return buildOrganizationOptions(this.store.organizations)
    }
  },

  mounted() {
    this.loadManageableUsers()
  },

  methods: {
    loadManageableUsers() {
      axios.get('/api/v1/users/manage')
        .then(response => {
          this.store.users = Array.isArray(response.data) ? response.data : []
        })
        .catch(error => this.notifyError(this.getErrorMessage(error)))
    },

    dialogNewClient() {
      this.$refs.editDialog.dialogNewClient()
    },

    editClient(row) {
      this.$refs.editDialog.editClient(row)
    },

    openPasswordDialog(payload) {
      this.$refs.passwordDialog.open(payload)
    },

    openImportDialog() {
      this.$refs.importDialog.openImportDialog()
    },

    onClientsImported() {
      this.loadManageableUsers()
      this.refreshClients()
    }
  },

  setup() {
    const store = useStore()
    return {store}
  }
}
</script>

<style scoped>
.settings-search {
  width: 420px;
  max-width: 100%;
}
@media (max-width: 900px) {
  .settings-content-actions {
    width: 100%;
  }

  .settings-search {
    width: 100%;
  }
}
</style>
