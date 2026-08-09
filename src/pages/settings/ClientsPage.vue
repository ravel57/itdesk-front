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
          unelevated
          no-caps
          color="primary"
          icon="add"
          label="Добавить клиента"
          @click="dialogNewClient"
        />
        <q-input
          v-model="clientSearch"
          dense
          outlined
          clearable
          debounce="150"
          placeholder="Поиск клиентов"
          class="settings-search"
        >
          <template #prepend>
            <q-icon name="search"/>
          </template>
        </q-input>
      </div>
    </div>

    <div class="table-container">
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
            />
          </q-td>
        </template>
      </q-table>
    </div>
  </div>

  <q-dialog
    v-model="dialogVisible"
    persistent
    backdrop-filter="blur(4px)"
  >
    <q-card class="dialog-width">
      <q-toolbar class="justify-between">
        <div class="text-h6">
          {{ isNewClient ? 'Новый клиент' : 'Изменить клиента' }}
        </div>
        <q-btn flat round dense icon="close" v-close-popup/>
      </q-toolbar>

      <q-card-section class="q-pt-none">
        <q-input
          ref="lastname"
          v-model="dialogLastName"
          label="Фамилия *"
          :rules="[requiredRule]"
        />
        <q-input
          v-model="dialogFirstName"
          label="Имя *"
          :rules="[requiredRule]"
        />
        <q-input
          v-model="dialogUsername"
          label="e-mail (username) *"
          :disable="!isNewClient"
          :rules="[requiredRule]"
        />
        <q-input
          v-if="isNewClient"
          v-model="dialogPassword"
          label="Пароль *"
          type="password"
          :rules="[requiredRule]"
        />

        <q-toggle
          v-if="isNewClient"
          v-model="dialogLinkExistingClient"
          label="Привязать к существующей карточке клиента"
          class="q-mt-sm"
          @update:model-value="onLinkExistingClientChanged"
        />

        <q-select
          v-if="shouldSelectExistingClient"
          v-model="dialogClientId"
          :options="filteredClientOptions"
          option-label="label"
          option-value="id"
          emit-value
          map-options
          use-input
          :clearable="isNewClient"
          :disable="!isNewClient"
          input-debounce="0"
          label="Карточка клиента *"
          :hint="isNewClient
            ? 'Начните вводить имя, организацию, e-mail, телефон или ID клиента'
            : 'Карточку клиента нельзя изменить после создания учётной записи'"
          :rules="[value => Boolean(value) || 'Выберите клиента']"
          @filter="filterClientOptions"
          @popup-show="resetClientOptions"
          @update:model-value="onClientCardChanged"
        />

        <div
          v-if="isNewClient && !dialogLinkExistingClient"
          class="text-caption text-grey-7 q-mt-sm"
        >
          При сохранении будет создана новая карточка клиента с указанными ФИО, e-mail и организацией.
        </div>

        <q-select
          v-model="dialogOrganizationId"
          :options="organizationOptions"
          option-label="name"
          option-value="id"
          emit-value
          map-options
          use-input
          input-debounce="0"
          label="Организация *"
          class="organization-select"
          popup-content-class="organization-select-popup"
          hint="Организация обязательна для клиентской учётной записи"
          :rules="[value => Boolean(value) || 'Выберите организацию']"
        />
      </q-card-section>

      <q-card-actions align="right">
        <q-btn
          v-if="!isNewClient"
          unelevated
          no-caps
          color="negative"
          icon="delete"
          label="Удалить клиента"
          @click="dialogDeleteClient"
        />
        <q-btn
          color="white"
          label="Отмена"
          text-color="primary"
          @click="dialogClose"
        />
        <q-btn
          color="primary"
          label="Сохранить"
          @click="dialogSaveNewOrUpdateClient"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script>
import {useStore} from 'stores/store'
import axios from 'axios'

export default {
  name: 'ClientsSettingsPage',

  data: () => ({
    columns: [
      {name: 'username', label: 'E-mail', align: 'left', field: 'username'},
      {name: 'firstname', label: 'Имя', align: 'left', field: 'firstname'},
      {name: 'lastname', label: 'Фамилия', align: 'left', field: 'lastname'},
      {
        name: 'organization',
        label: 'Организация',
        align: 'left',
        field: row => row.organizationName || '—'
      },
      {
        name: 'clientCard',
        label: 'Карточка клиента',
        align: 'left',
        field: row => row.clientCardLabel || '—'
      },
      {name: 'edit', label: '', align: 'center', field: 'edit'}
    ],

    clientSearch: '',

    dialogVisible: false,
    dialogUsername: '',
    dialogPassword: '',
    dialogFirstName: '',
    dialogLastName: '',
    dialogClientId: null,
    dialogOrganizationId: null,
    dialogLinkExistingClient: true,
    filteredClientOptions: [],

    isNewClient: true,
    userId: null
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
      const needle = this.normalizeSearch(this.clientSearch)
      if (!needle) {
        return this.clientUsers
      }

      return this.clientUsers.filter(user => this.matchesSearch([
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

    shouldSelectExistingClient() {
      return !this.isNewClient || this.dialogLinkExistingClient
    },

    clientOptions() {
      return (this.store.clients || [])
        .filter(client => client?.id)
        .map(client => {
          const name = this.getClientDisplayName(client)
          const organizationName = client.organization?.name || ''
          const organizationSuffix = organizationName ? ` — ${organizationName}` : ''
          const email = client.email || ''
          const phone = client.phoneNumber || ''
          return {
            id: client.id,
            label: `${name}${organizationSuffix}`,
            organizationId: client.organization?.id || null,
            searchText: [client.id, name, organizationName, email, phone]
              .filter(value => value !== null && value !== undefined && String(value).trim())
              .join(' ')
              .toLocaleLowerCase('ru-RU')
          }
        })
        .sort((left, right) => left.label.localeCompare(right.label, 'ru'))
    },

    organizationOptions() {
      return (this.store.organizations || [])
        .filter(organization => organization?.id)
        .map(organization => ({
          id: organization.id,
          name: organization.name || `Организация ${organization.id}`
        }))
        .sort((left, right) => left.name.localeCompare(right.name, 'ru'))
    }
  },

  mounted() {
    this.resetClientOptions()
    this.loadManageableUsers()
  },

  watch: {
    'store.clients': {
      deep: true,
      handler() {
        this.resetClientOptions()
      }
    }
  },

  methods: {
    normalizeSearch(value) {
      return String(value || '').trim().toLocaleLowerCase('ru-RU')
    },

    matchesSearch(values, needle) {
      return values
        .filter(value => value !== null && value !== undefined)
        .some(value => this.normalizeSearch(value).includes(needle))
    },

    requiredRule(value) {
      return Boolean(value && String(value).length > 0) || 'Обязательное поле'
    },

    loadManageableUsers() {
      axios.get('/api/v1/users/manage')
        .then(response => {
          this.store.users = Array.isArray(response.data) ? response.data : []
        })
        .catch(error => this.notifyError(this.getErrorMessage(error)))
    },

    dialogNewClient() {
      this.dialogVisible = true
      this.isNewClient = true
      this.userId = null
      this.dialogUsername = ''
      this.dialogLastName = ''
      this.dialogFirstName = ''
      this.dialogPassword = ''
      this.dialogClientId = null
      this.dialogOrganizationId = null
      this.dialogLinkExistingClient = true
      this.resetClientOptions()
      setTimeout(() => this.$refs.lastname?.focus(), 250)
    },

    editClient(row) {
      const client = this.getClientById(row.clientId)
      this.dialogVisible = true
      this.isNewClient = false
      this.userId = row.id
      this.dialogUsername = row.username
      this.dialogLastName = row.lastname || ''
      this.dialogFirstName = row.firstname || ''
      this.dialogPassword = ''
      this.dialogClientId = row.clientId || null
      this.dialogOrganizationId = client?.organization?.id || null
      this.dialogLinkExistingClient = true
      this.resetClientOptions()
    },

    dialogClose() {
      this.dialogVisible = false
    },

    dialogSaveNewOrUpdateClient() {
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
      const clientUser = {
        id: this.isNewClient ? null : this.userId,
        username: this.isNewClient ? this.dialogUsername : null,
        password: this.isNewClient ? this.dialogPassword : null,
        lastname: this.dialogLastName,
        firstname: this.dialogFirstName,
        authorities: 'Клиент',
        availableOrganizationIds: [],
        clientId: this.shouldSelectExistingClient ? this.dialogClientId : null,
        createNewClientCard: this.isNewClient && !this.dialogLinkExistingClient,
        clientOrganizationId: this.dialogOrganizationId
      }

      const missingRequiredField =
        (this.isNewClient && !clientUser.username) ||
        (this.isNewClient && !clientUser.password) ||
        !clientUser.lastname ||
        !clientUser.firstname ||
        !clientUser.clientOrganizationId ||
        (this.shouldSelectExistingClient && !clientUser.clientId)

      if (missingRequiredField) {
        this.notifyError('Не заполнены обязательные поля')
        return
      }

      if (this.isNewClient && !emailRegex.test(this.dialogUsername)) {
        this.notifyError('Почта указана некорректно')
        return
      }

      const request = this.isNewClient
        ? axios.post('/api/v1/user', clientUser)
        : axios.patch('/api/v1/user', clientUser)

      request
        .then(response => {
          const savedUser = response.data
          const index = this.store.users.findIndex(item => item.id === savedUser.id)
          if (index === -1) {
            this.store.users.push(savedUser)
          } else {
            this.store.users.splice(index, 1, savedUser)
          }

          this.applyOrganizationToLocalClient(savedUser.clientId)
          this.refreshClients()
          this.dialogClose()
        })
        .catch(error => this.notifyError(this.getErrorMessage(error)))
    },

    dialogDeleteClient() {
      const clientName = `${this.dialogLastName || ''} ${this.dialogFirstName || ''}`.trim() || this.dialogUsername || 'клиента'
      this.$q.dialog({
        title: 'Удалить клиентскую учётную запись?',
        message: `Учётная запись «${clientName}» будет отключена. Карточка клиента и переписка останутся в системе.`,
        cancel: {label: 'Отмена', flat: true, color: 'primary'},
        ok: {label: 'Удалить', color: 'negative', icon: 'delete', unelevated: true, noCaps: true},
        persistent: true
      }).onOk(() => {
        axios.delete(`/api/v1/delete-user/${this.userId}`)
          .then(() => {
            this.store.users = this.store.users.filter(user => user.id !== this.userId)
            this.dialogClose()
            this.$q.notify({
              message: 'Клиентская учётная запись удалена',
              type: 'positive',
              position: 'top-right'
            })
          })
          .catch(error => this.notifyError(this.getErrorMessage(error)))
      })
    },

    onLinkExistingClientChanged(linkExisting) {
      this.dialogClientId = null
      if (linkExisting) {
        this.dialogOrganizationId = null
      }
    },

    onClientCardChanged(clientId) {
      const client = this.getClientById(clientId)
      this.dialogOrganizationId = client?.organization?.id || null
    },

    getClientById(clientId) {
      return (this.store.clients || []).find(client => Number(client?.id) === Number(clientId)) || null
    },

    getClientDisplayName(client) {
      return `${client?.lastname || ''} ${client?.firstname || ''}`.trim() || `Клиент #${client?.id}`
    },

    resetClientOptions() {
      this.filteredClientOptions = [...this.clientOptions]
    },

    filterClientOptions(value, update) {
      update(() => {
        const needle = String(value || '').trim().toLocaleLowerCase('ru-RU')
        this.filteredClientOptions = needle
          ? this.clientOptions.filter(client => client.searchText.includes(needle))
          : [...this.clientOptions]
      })
    },

    applyOrganizationToLocalClient(clientId) {
      const client = this.getClientById(clientId)
      const organization = (this.store.organizations || [])
        .find(item => Number(item?.id) === Number(this.dialogOrganizationId))
      if (client && organization) {
        client.organization = organization
      }
    },

    refreshClients() {
      axios.get('/api/v1/clients')
        .then(response => {
          if (Array.isArray(response.data)) {
            this.store.clients = response.data
          }
        })
        .catch(() => undefined)
    },

    notifyError(message) {
      this.$q.notify({
        message,
        type: 'negative',
        position: 'top-right',
        actions: [{icon: 'close', color: 'white', dense: true}]
      })
    },

    getErrorMessage(error) {
      return error?.response?.data?.message || error?.response?.data || error?.message || 'Не удалось выполнить операцию'
    }
  },

  setup() {
    const store = useStore()
    return {store}
  }
}
</script>

<style scoped>
.table-container {
  width: 100%;
}

.settings-search {
  width: 320px;
  max-width: 100%;
}
</style>
