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
          flat
          color="primary"
          icon="admin_panel_settings"
          label="Права ролей"
          @click="openPermissionsDialog"
        />
        <q-btn
          unelevated
          color="primary"
          icon="add"
          label="Добавить пользователя"
          @click="dialogNewUser"
        />
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
        <template #top>
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
        </template>
        <template #body-cell-mfa="props">
          <q-td :props="props">
            <q-badge v-if="props.row.mfaEnabled" color="positive" label="Включена"/>
            <span v-else class="text-grey-6">—</span>
          </q-td>
        </template>
        <template #body-cell-status="props">
          <q-td :props="props">
            <q-badge v-if="props.row.invitePending" color="warning" text-color="dark" label="Приглашён"/>
            <span v-else class="text-grey-6">—</span>
          </q-td>
        </template>
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
        <div v-if="isNewUser" class="text-caption text-grey-7 q-mb-sm">
          На этот email придёт ссылка-приглашение, по которой пользователь сам задаст пароль.
        </div>
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
          :multiple="showDialogOrganizations"
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
        <q-select
          v-if="isNewUser && canJoinSupportLine"
          v-model="dialogSupportLineId"
          :options="supportLineOptions"
          :loading="supportLinesLoading"
          option-label="name"
          option-value="id"
          emit-value
          map-options
          clearable
          label="Линия поддержки"
          hint="Пользователь будет добавлен в участники выбранной линии"
        />
      </q-card-section>

      <q-card-section v-if="!isNewUser && dialogInvitePending" class="q-pt-none">
        <div class="row items-center no-wrap q-gutter-sm">
          <q-icon name="mail" color="warning" size="sm"/>
          <div class="col">Пользователь ещё не задал пароль по приглашению</div>
          <q-btn
            flat
            color="primary"
            label="Отправить повторно"
            :loading="resendingInvite"
            @click="resendInvite"
          />
        </div>
      </q-card-section>

      <q-card-section v-if="!isNewUser && dialogMfaEnabled" class="q-pt-none">
        <div class="row items-center no-wrap q-gutter-sm">
          <q-icon name="verified_user" color="positive" size="sm"/>
          <div class="col">Двухфакторная аутентификация включена</div>
          <q-btn
            flat
            color="negative"
            label="Сбросить 2FA"
            @click="resetUserMfa"
          />
        </div>
        <div class="text-caption text-grey-7">
          Если сотрудник потерял телефон и коды восстановления: при следующем входе он подключит приложение заново.
        </div>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn
          v-if="staffUsers.length > 1 && !isNewUser"
          unelevated
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

  <q-dialog
    v-model="permissionsDialogVisible"
    full-width
    :maximized="$q.screen.lt.sm"
  >
    <q-card class="permissions-card column no-wrap">
      <q-card-section class="row items-start no-wrap q-pb-sm">
        <div class="col">
          <div class="text-h6">Права ролей</div>
          <div class="text-caption text-grey-7">
            Старшая роль получает все права младшей: Администратор → Менеджер поддержки → Старший оператор → Оператор.
            Разделы менеджера организации настраиваются в «Общих» настройках.
          </div>
        </div>
        <q-btn flat round dense icon="close" v-close-popup/>
      </q-card-section>

      <div class="permissions-scroll col">
        <table class="permissions-table">
          <thead>
          <tr>
            <th class="permissions-table__name">Право</th>
            <th v-for="role in permissionRoles" :key="role.code" class="permissions-table__role">
              <q-chip
                dense
                square
                :color="roleColor(role.code)"
                text-color="white"
                class="q-ma-none"
                :label="role.name"
              />
            </th>
          </tr>
          </thead>
          <tbody>
          <template v-for="group in permissionGroups" :key="group.name">
            <tr class="permissions-table__group">
              <td :colspan="permissionRoles.length + 1">
                <span class="permissions-table__group-label">{{ group.name }}</span>
              </td>
            </tr>
            <tr v-for="permission in group.items" :key="permission.code" class="permissions-table__row">
              <td class="permissions-table__name">{{ permission.label }}</td>
              <td v-for="role in permissionRoles" :key="role.code" class="permissions-table__cell">
                <q-icon v-if="permission.roles.includes(role.code)" name="check_circle" color="positive" size="20px"/>
                <span v-else class="permissions-table__no">—</span>
              </td>
            </tr>
          </template>
          </tbody>
        </table>
      </div>
    </q-card>
  </q-dialog>
</template>

<script>
import {useStore} from 'stores/store'
import axios from 'axios'
import {roleLabel} from 'src/util/access'

// Роли линейной поддержки: им можно ограничить организации или дать «Все организации»
const OPERATOR_ROLE_NAMES = ['Оператор поддержки', 'Старший оператор']
const OBSERVER_ROLE_NAME = 'Менеджер организации'

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
        field: row => roleLabel(row.authorities?.[0]) || ''
      },
      {name: 'mfa', label: '2FA', align: 'left', field: 'mfaEnabled'},
      {name: 'status', label: 'Статус', align: 'left', field: 'invitePending'},
      {name: 'edit', label: '', align: 'center', field: 'edit'}
    ],

    userSearch: '',

    dialogVisible: false,
    dialogUsername: '',
    dialogFirstName: '',
    dialogLastName: '',
    dialogRole: '',
    dialogOrganization: [],
    dialogSupportLineId: null,
    supportLinesLoading: false,
    allOrganizationsOptionId: '__ALL_ORGANIZATIONS__',

    isNewUser: true,
    userId: null,
    dialogMfaEnabled: false,
    dialogInvitePending: false,
    resendingInvite: false,

    permissionsDialogVisible: false,
    permissionRoles: [],
    permissionGroups: []
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

    isOperatorRole() {
      return OPERATOR_ROLE_NAMES.includes(this.dialogRole)
    },

    canJoinSupportLine() {
      return ['ADMIN', 'MANAGER', 'SENIOR_OPERATOR', 'OPERATOR']
        .map(role => this.getRoleName(role)).includes(this.dialogRole)
    },

    supportLineOptions() {
      return (this.store.supportLines || []).filter(line => line?.id && line.active !== false)
    },

    showDialogOrganizations() {
      return this.isOperatorRole || this.dialogRole === OBSERVER_ROLE_NAME
    },

    organizationOptions() {
      const organizations = (this.store.organizations || [])
        .filter(organization => organization?.id)
        .map(organization => ({
          id: organization.id,
          name: organization.name || `Организация ${organization.id}`
        }))

      if (this.isOperatorRole) {
        return [
          {id: this.allOrganizationsOptionId, name: 'Все организации'},
          ...organizations
        ]
      }

      return organizations
    }
  },

  mounted() {
    this.supportLinesLoading = true
    axios.get('/api/v1/support-lines')
      .then(response => {
        this.store.supportLines = Array.isArray(response.data) ? response.data : []
      })
      .catch(error => this.notifyError(this.getErrorMessage(error)))
      .finally(() => { this.supportLinesLoading = false })
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
      this.dialogRole = ''
      this.dialogOrganization = []
      this.dialogSupportLineId = null
      this.dialogInvitePending = false
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
      this.dialogMfaEnabled = Boolean(row.mfaEnabled)
      this.dialogInvitePending = Boolean(row.invitePending)

      const availableOrganizations = row.availableOrganizations || []
      // Менеджеру организации можно назначить несколько организаций, как и оператору
      this.dialogOrganization = this.isOperatorRole && availableOrganizations.length === 0
        ? [this.allOrganizationsOptionId]
        : availableOrganizations.map(organization => organization.id)
    },

    resetUserMfa() {
      this.$q.dialog({
        title: 'Сбросить двухфакторную аутентификацию?',
        message: 'При следующем входе сотрудник заново подключит приложение-аутентификатор.',
        cancel: {label: 'Отмена', flat: true, color: 'primary'},
        ok: {label: 'Сбросить', color: 'negative', unelevated: true, noCaps: true},
        persistent: true
      }).onOk(() => {
        axios.post(`/api/v1/user/${this.userId}/mfa/reset`)
          .then(() => {
            this.dialogMfaEnabled = false
            const user = this.store.users.find(item => item.id === this.userId)
            if (user) {
              user.mfaEnabled = false
            }
            this.$q.notify({message: 'Двухфакторная аутентификация сброшена', type: 'positive'})
          })
          .catch(error => this.notifyError(this.getErrorMessage(error)))
      })
    },

    openPermissionsDialog() {
      axios.get('/api/v1/permissions')
        .then(({data}) => {
          this.permissionRoles = (data?.roles || []).filter(role => role.code !== 'CLIENT')
          const groups = new Map()
          for (const permission of data?.permissions || []) {
            if (permission.code === 'PORTAL') {
              continue
            }
            if (!groups.has(permission.group)) {
              groups.set(permission.group, [])
            }
            groups.get(permission.group).push(permission)
          }
          this.permissionGroups = [...groups.entries()].map(([name, items]) => ({name, items}))
          this.permissionsDialogVisible = true
        })
        .catch(error => this.notifyError(this.getErrorMessage(error)))
    },

    dialogClose() {
      this.dialogVisible = false
    },

    dialogSaveNewOrUpdateUser() {
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
      const user = {
        id: this.isNewUser ? null : this.userId,
        username: this.isNewUser ? this.dialogUsername : null,
        lastname: this.dialogLastName,
        firstname: this.dialogFirstName,
        authorities: this.dialogRole,
        availableOrganizationIds: this.getSelectedOrganizationIdsForSave(),
        ...(this.isNewUser && this.canJoinSupportLine ? {supportLineId: this.dialogSupportLineId} : {}),
        clientId: null,
        createNewClientCard: false,
        clientOrganizationId: null
      }

      const hasMissingRequiredField =
        (this.isNewUser && !user.username) ||
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

      const wasNewUser = this.isNewUser

      request
        .then(response => {
          const savedUser = response.data
          if (wasNewUser && user.supportLineId) {
            const line = this.store.supportLines.find(item => Number(item.id) === Number(user.supportLineId))
            if (line && !(line.members || []).some(member => member.id === savedUser.id)) {
              line.members = [...(line.members || []), savedUser]
            }
          }
          const index = this.store.users.findIndex(item => item.id === savedUser.id)
          if (index === -1) {
            this.store.users.push(savedUser)
          } else {
            this.store.users.splice(index, 1, savedUser)
          }
          this.dialogClose()
          if (wasNewUser) {
            this.$q.notify({
              message: `Приглашение отправлено на ${savedUser.username}`,
              type: 'positive'
            })
          }
        })
        .catch(error => this.notifyError(this.getErrorMessage(error)))
    },

    resendInvite() {
      this.resendingInvite = true
      axios.post(`/api/v1/user/${this.userId}/resend-invite`)
        .then(() => {
          this.$q.notify({message: 'Приглашение отправлено повторно', type: 'positive'})
        })
        .catch(error => this.notifyError(this.getErrorMessage(error)))
        .finally(() => {
          this.resendingInvite = false
        })
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
              type: 'positive'
            })
          })
          .catch(error => this.notifyError(this.getErrorMessage(error)))
      })
    },

    roleColor(role) {
      return {
        ADMIN: 'deep-purple-6',
        MANAGER: 'indigo-6',
        SENIOR_OPERATOR: 'teal-6',
        OPERATOR: 'blue-6',
        OBSERVER: 'blue-grey-6'
      }[role] || 'grey-6'
    },

    getRoleName(role) {
      return role === 'CLIENT' ? '' : (roleLabel(role) || '')
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

      const selected = Array.isArray(this.dialogOrganization)
        ? this.dialogOrganization
        : (this.dialogOrganization ? [this.dialogOrganization] : [])
      if (this.isOperatorRole && selected.includes(this.allOrganizationsOptionId)) {
        return []
      }
      return selected
        .filter(value => value !== this.allOrganizationsOptionId)
        .map(normalizeOrganizationId)
        .filter(id => Number.isFinite(id))
    },

    onDialogOrganizationChanged(value) {
      if (!this.isOperatorRole) {
        return
      }
      const selected = Array.isArray(value) ? value : []
      if (selected.includes(this.allOrganizationsOptionId)) {
        this.dialogOrganization = [this.allOrganizationsOptionId]
      }
    },

    onDialogRoleChanged(newRole) {
      this.dialogOrganization = OPERATOR_ROLE_NAMES.includes(newRole)
        ? [this.allOrganizationsOptionId]
        : []
    },

    notifyError(message) {
      this.$q.notify({
        message,
        type: 'negative'
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

.permissions-card {
  max-width: 1200px !important;
  max-height: 88vh;
}

/* Прокручивается только таблица: заголовок с ролями и колонка прав остаются на месте */
.permissions-scroll {
  overflow: auto;
  margin: 0 16px 16px;
  border: 1px solid #e0e3e8;
  border-radius: 12px;
}

.permissions-table {
  width: 100%;
  min-width: 820px;
  border-collapse: separate;
  border-spacing: 0;
  font-size: 13px;
}

.permissions-table th,
.permissions-table td {
  padding: 8px 12px;
  border-bottom: 1px solid #edf0f4;
}

.permissions-table thead th {
  position: sticky;
  top: 0;
  z-index: 2;
  background: #fafbfc;
  color: #737b89;
  font-size: 12px;
  font-weight: 600;
  text-align: center;
  white-space: nowrap;
}

.permissions-table .permissions-table__name {
  position: sticky;
  left: 0;
  z-index: 1;
  min-width: 260px;
  text-align: left;
  background: #fff;
}

.permissions-table thead .permissions-table__name {
  z-index: 3;
  background: #fafbfc;
}

.permissions-table__group td {
  padding-top: 14px;
  background: #f5f3ff;
  color: #4b3fb5;
  font-weight: 600;
}

/* Ячейка группы на всю ширину не может «прилипнуть», поэтому закреплена сама подпись */
.permissions-table__group-label {
  position: sticky;
  left: 12px;
}

.permissions-table__row:hover td {
  background: #f0ecff;
}

.permissions-table__cell {
  width: 140px;
  text-align: center;
}

.permissions-table__no {
  color: #c6cbd3;
}
</style>
