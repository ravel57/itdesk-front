<template>
  <div class="q-pa-md">
    <div class="settings-content-header">
      <div class="settings-content-heading">
        <div class="settings-content-title">Пользователи</div>
        <div class="settings-content-description">
          Управляйте сотрудниками, их ролями и доступом к организациям.
        </div>
      </div>
      <div class="settings-content-actions">
        <q-btn
          unelevated
          no-caps
          color="primary"
          icon="add"
          label="Добавить пользователя"
          @click="dialogNewUser"
        />
        <q-input
          v-model="userSearch"
          dense
          outlined
          clearable
          debounce="150"
          placeholder="Поиск пользователей"
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
        :rows="filteredStaffUsers"
        :columns="columns"
        row-key="id"
        full-width
        :rows-per-page-options="[10, 20, 50]"
        rows-per-page-label="Строк на странице"
      >
        <template #body-cell-edit="props">
          <q-td>
            <q-btn
              color="primary"
              dense
              flat
              icon="edit"
              @click="editUser(props.row)"
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
          {{ isNewUser ? 'Новый пользователь' : 'Изменить пользователя' }}
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
          :disable="!isNewUser"
          :rules="[requiredRule]"
        />
        <q-input
          v-if="isNewUser"
          v-model="dialogPassword"
          label="Пароль *"
          type="password"
          :rules="[requiredRule]"
        />
        <q-select
          v-model="dialogRole"
          :options="staffRoleOptions"
          label="Роль *"
          :rules="[requiredRule]"
          @update:model-value="onDialogRoleChanged"
        />
        <q-select
          v-if="showDialogOrganizations"
          v-model="dialogOrganization"
          :multiple="dialogRole === 'Оператор поддержки'"
          :options="organizationOptions"
          option-label="name"
          option-value="id"
          emit-value
          map-options
          label="Организация"
          class="organization-select"
          popup-content-class="organization-select-popup"
          use-input
          @update:model-value="onDialogOrganizationChanged"
        />
      </q-card-section>

      <q-card-actions align="right">
        <q-btn
          v-if="staffUsers.length > 1 && !isNewUser"
          unelevated
          no-caps
          color="negative"
          icon="delete"
          label="Удалить пользователя"
          @click="dialogDeleteUser"
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
          @click="dialogSaveNewOrUpdateUser"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script>
import {useStore} from 'stores/store'
import axios from 'axios'

export default {
  name: 'UsersComponent',

  data: () => ({
    columns: [
      {name: 'username', label: 'Username', align: 'left', field: 'username'},
      {name: 'firstname', label: 'Имя', align: 'left', field: 'firstname'},
      {name: 'lastname', label: 'Фамилия', align: 'left', field: 'lastname'},
      {
        name: 'roles',
        label: 'Роли',
        align: 'left',
        field: row => {
          switch (row.authorities?.[0]) {
            case 'ADMIN':
              return 'Администратор'
            case 'MANAGER':
              return 'Менеджер поддержки'
            case 'OPERATOR':
              return 'Оператор поддержки'
            case 'OBSERVER':
              return 'Менеджер организации'
            default:
              return ''
          }
        }
      },
      {name: 'edit', label: '', align: 'center', field: 'edit'}
    ],

    userSearch: '',

    dialogVisible: false,
    dialogUsername: '',
    dialogPassword: '',
    dialogFirstName: '',
    dialogLastName: '',
    dialogRole: '',
    dialogOrganization: [],
    allOrganizationsOptionId: '__ALL_ORGANIZATIONS__',

    isNewUser: true,
    userId: null
  }),

  computed: {
    staffUsers() {
      return (this.store.users || []).filter(user => user?.authorities?.[0] !== 'CLIENT')
    },

    filteredStaffUsers() {
      const needle = this.normalizeSearch(this.userSearch)
      if (!needle) {
        return this.staffUsers
      }

      return this.staffUsers.filter(user => {
        const organizations = (user.availableOrganizations || [])
          .map(organization => organization?.name)
        const values = [
          user.id,
          user.username,
          user.firstname,
          user.lastname,
          this.getRoleName(user.authorities?.[0]),
          ...organizations
        ]
        return this.matchesSearch(values, needle)
      })
    },

    staffRoleOptions() {
      return (this.store.roles || [])
        .filter(role => role !== 'CLIENT')
        .map(role => this.getRoleName(role))
        .filter(Boolean)
    },

    showDialogOrganizations() {
      return ['Оператор поддержки', 'Менеджер организации'].includes(this.dialogRole)
    },

    organizationOptions() {
      const organizations = (this.store.organizations || [])
        .filter(organization => organization?.id)
        .map(organization => ({
          id: organization.id,
          name: organization.name || `Организация ${organization.id}`
        }))

      if (this.dialogRole === 'Оператор поддержки') {
        return [
          {id: this.allOrganizationsOptionId, name: 'Все организации'},
          ...organizations
        ]
      }

      return organizations
    }
  },

  mounted() {
    axios.get('/api/v1/users/manage')
      .then(response => {
        this.store.users = Array.isArray(response.data) ? response.data : []
      })
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

    dialogNewUser() {
      this.dialogVisible = true
      this.isNewUser = true
      this.userId = null
      this.dialogUsername = ''
      this.dialogLastName = ''
      this.dialogFirstName = ''
      this.dialogPassword = ''
      this.dialogRole = ''
      this.dialogOrganization = []
      setTimeout(() => this.$refs.lastname?.focus(), 250)
    },

    editUser(row) {
      this.dialogVisible = true
      this.isNewUser = false
      this.userId = row.id
      this.dialogUsername = row.username
      this.dialogLastName = row.lastname || ''
      this.dialogFirstName = row.firstname || ''
      this.dialogRole = this.getRoleName(row.authorities?.[0])

      const availableOrganizations = row.availableOrganizations || []
      this.dialogOrganization = this.dialogRole === 'Оператор поддержки'
        ? (availableOrganizations.length > 0
            ? availableOrganizations.map(organization => organization.id)
            : [this.allOrganizationsOptionId])
        : (availableOrganizations[0]?.id || null)
    },

    dialogClose() {
      this.dialogVisible = false
    },

    dialogSaveNewOrUpdateUser() {
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
      const user = {
        id: this.isNewUser ? null : this.userId,
        username: this.isNewUser ? this.dialogUsername : null,
        password: this.isNewUser ? this.dialogPassword : null,
        lastname: this.dialogLastName,
        firstname: this.dialogFirstName,
        authorities: this.dialogRole,
        availableOrganizationIds: this.getSelectedOrganizationIdsForSave(),
        clientId: null,
        createNewClientCard: false,
        clientOrganizationId: null
      }

      const hasMissingRequiredField =
        (this.isNewUser && !user.username) ||
        (this.isNewUser && !user.password) ||
        !user.lastname ||
        !user.firstname ||
        !user.authorities

      if (hasMissingRequiredField) {
        this.notifyError('Не заполнены обязательные поля')
        return
      }

      if (this.isNewUser && !emailRegex.test(this.dialogUsername)) {
        this.notifyError('Почта указана некорректно')
        return
      }

      const request = this.isNewUser
        ? axios.post('/api/v1/user', user)
        : axios.patch('/api/v1/user', user)

      request
        .then(response => {
          const savedUser = response.data
          const index = this.store.users.findIndex(item => item.id === savedUser.id)
          if (index === -1) {
            this.store.users.push(savedUser)
          } else {
            this.store.users.splice(index, 1, savedUser)
          }
          this.dialogClose()
        })
        .catch(error => this.notifyError(this.getErrorMessage(error)))
    },

    dialogDeleteUser() {
      const userName = `${this.dialogLastName || ''} ${this.dialogFirstName || ''}`.trim() || this.dialogUsername || 'пользователя'
      this.$q.dialog({
        title: 'Удалить пользователя?',
        message: `Пользователь «${userName}» будет отключён и скрыт из интерфейса. Сообщения пользователя останутся в истории.`,
        cancel: {label: 'Отмена', flat: true, color: 'primary'},
        ok: {label: 'Удалить', color: 'negative', icon: 'delete', unelevated: true, noCaps: true},
        persistent: true
      }).onOk(() => {
        axios.delete(`/api/v1/delete-user/${this.userId}`)
          .then(() => {
            this.store.users = this.store.users.filter(user => user.id !== this.userId)
            this.dialogClose()
            this.$q.notify({
              message: 'Пользователь удалён из интерфейса',
              type: 'positive',
              position: 'top-right',
              actions: [{
                icon: 'close',
                color: 'white',
                dense: true,
                handler: () => undefined
              }]
            })
          })
          .catch(error => this.notifyError(this.getErrorMessage(error)))
      })
    },

    getRoleName(role) {
      switch (role) {
        case 'ADMIN':
          return 'Администратор'
        case 'MANAGER':
          return 'Менеджер поддержки'
        case 'OPERATOR':
          return 'Оператор поддержки'
        case 'OBSERVER':
          return 'Менеджер организации'
        default:
          return ''
      }
    },

    getSelectedOrganizationIdsForSave() {
      if (!this.showDialogOrganizations) {
        return []
      }

      const normalizeOrganizationId = value => {
        if (value && typeof value === 'object') {
          return Number(value.id)
        }
        return Number(value)
      }

      if (this.dialogRole === 'Оператор поддержки') {
        const selected = Array.isArray(this.dialogOrganization) ? this.dialogOrganization : []
        if (selected.includes(this.allOrganizationsOptionId)) {
          return []
        }
        return selected
          .map(normalizeOrganizationId)
          .filter(id => Number.isFinite(id))
      }

      const organizationId = normalizeOrganizationId(this.dialogOrganization)
      return Number.isFinite(organizationId) ? [organizationId] : []
    },

    onDialogOrganizationChanged(value) {
      if (this.dialogRole !== 'Оператор поддержки') {
        return
      }
      const selected = Array.isArray(value) ? value : []
      if (selected.includes(this.allOrganizationsOptionId)) {
        this.dialogOrganization = [this.allOrganizationsOptionId]
      }
    },

    onDialogRoleChanged(newRole) {
      this.dialogOrganization = newRole === 'Оператор поддержки'
        ? [this.allOrganizationsOptionId]
        : null
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
