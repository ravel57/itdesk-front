<template>
  <div class="q-pa-md">
    <q-btn
      icon="add"
      label="Добавить пользователя"
      @click="this.dialogNewUser"
    />
    <div class="table-container">
      <q-table
        :rows="this.store.users"
        :columns="this.columns"
        row-key="id"
        full-width
        :rows-per-page-options="[10, 20, 50]"
        rows-per-page-label="Строк на странице"
      >
        <template v-slot:body-cell-edit="props">
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
    v-model="this.dialogVisible"
    persistent
    backdrop-filter="blur(4px)"
  >
    <q-card class="dialog-width">
      <q-toolbar class="justify-end">
        <q-btn flat round dense icon="close" v-close-popup />
      </q-toolbar>
      <q-card-section style="padding-top: 0">
        <q-input
          v-model="this.dialogLastName"
          label="Фамилия"
          :rules="[val => (val && val.length > 0) || 'Обязательное поле']"
          ref="lastname"
        />
        <q-input
          v-model="this.dialogFirstName"
          label="Имя"
          :rules="[val => (val && val.length > 0) || 'Обязательное поле']"
        />
        <q-input
          v-if="this.isNewUser"
          v-model="this.dialogUsername"
          label="e-mail (username)"
          :rules="[val => (val && val.length > 0) || 'Обязательное поле']"
        />
        <q-input
          v-if="this.isNewUser"
          label="Пароль"
          type="password"
          v-model="this.dialogPassword"
          :rules="[val => (val && val.length > 0) || 'Обязательное поле']"
        />
        <q-select
          v-model="this.dialogRole"
          :options="this.store.roles.map(role => getRoleName(role))"
          label="Роль"
          :rules="[val => (val && val.length > 0) || 'Обязательное поле']"
        />
        <q-select
          v-if="this.showDialogOrganizations"
          v-model="this.dialogOrganization"
          :multiple="this.dialogRole === 'Оператор поддержки'"
          :options="this.store.organizations.map(organization => organization.name)"
          label="Организация"
          use-input
        />
      </q-card-section>
      <q-card-actions align="right">
        <q-btn
          v-if="this.store.users.length > 1 && !this.isNewUser"
          color="white"
          label="Удалить пользователя"
          text-color="primary"
          @click="dialogDeleteUser"
        />
        <q-btn
          color="white"
          label="Закрыть"
          text-color="primary"
          @click="dialogClose"
        />
        <q-btn
          color="primary"
          label="Сохранить"
          @click="dialogSaveNewOrUpdateUser"/>
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script>
import { useStore } from 'stores/store'
import axios from 'axios'

export default {
  name: 'UsersComponent',

  data: () => ({
    columns: [
      { name: 'username', label: 'Username', align: 'left', field: 'username' },
      { name: 'firstname', label: 'Имя', align: 'left', field: 'firstname' },
      { name: 'lastname', label: 'Фамилия', align: 'left', field: 'lastname' },
      {
        name: 'roles',
        label: 'Роли',
        align: 'left',
        field: row => {
          switch (row.authorities[0]) {
            case 'ADMIN': return 'Администратор'
            case 'OPERATOR': return 'Оператор поддержки'
            case 'OBSERVER': return 'Менеджер организации'
            case 'CLIENT': return 'Клиент'
            default: return ''
          }
        }
      },
      { name: 'edit', label: '', align: 'center', field: 'edit' }
    ],

    dialogVisible: false,
    dialogUsername: '',
    dialogPassword: '',
    dialogFirstName: '',
    dialogLastName: '',
    dialogRole: '',
    dialogOrganization: [],

    isNewUser: true,
    userId: null // for updates
  }),

  methods: {
    dialogNewUser () {
      this.dialogVisible = true
      this.isNewUser = true
      this.dialogUsername = ''
      this.dialogLastName = ''
      this.dialogFirstName = ''
      this.dialogPassword = ''
      this.dialogRole = ''
      this.dialogOrganization = ''
      setTimeout(() => this.$refs.lastname.focus(), 250)
    },

    editUser (row) {
      this.dialogVisible = true
      this.isNewUser = false
      this.userId = row.id
      this.dialogUsername = row.username
      this.dialogLastName = row.lastname
      this.dialogFirstName = row.firstname
      this.dialogRole = this.getRoleName(row.authorities[0])
      this.dialogOrganization = row.availableOrganizations
    },

    dialogClose () {
      this.dialogVisible = false
    },

    dialogSaveNewOrUpdateUser () {
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
      const isValidEmail = emailRegex.test(this.dialogUsername)
      const user = {
        id: this.isNewUser ? null : this.userId,
        username: this.isNewUser ? this.dialogUsername : null,
        password: this.isNewUser ? this.dialogPassword : null,
        lastname: this.dialogLastName,
        firstname: this.dialogFirstName,
        authorities: this.dialogRole,
        availableOrganizations: this.dialogRole === 'Менеджер организации' ? [this.dialogOrganization] : this.dialogOrganization
      }
      if ((this.isNewUser && user.username.length === 0) || (this.isNewUser && user.password.length === 0) ||
        user.lastname.length === 0 || user.firstname.length === 0 || user.authorities.length === 0) {
        this.$q.notify({
          message: 'Не заполнены обязательные поля',
          type: 'negative',
          position: 'top-right',
          actions: [{
            icon: 'close', color: 'white', dense: true, handler: () => undefined
          }]
        })
        return
      }
      if (this.isNewUser && !isValidEmail) {
        this.$q.notify({
          message: 'Почта указана не корректно',
          type: 'negative',
          position: 'top-right',
          actions: [{
            icon: 'close', color: 'white', dense: true, handler: () => undefined
          }]
        })
        return
      }
      if (this.isNewUser) {
        axios.post('/api/v1/user', user)
          .then(response => {
            this.store.users.push(response.data)
            this.dialogClose()
          })
          .catch(e =>
            this.$q.notify({
              message: e.message,
              type: 'negative',
              position: 'top-right',
              actions: [{
                icon: 'close', color: 'white', dense: true, handler: () => undefined
              }]
            }))
      } else {
        axios.patch('/api/v1/user', user)
          .then(response => {
            const users = this.store.users
            this.store.users[users.indexOf(users.find(user => user.id === this.userId))] = response.data
            this.dialogClose()
          })
          .catch(e =>
            this.$q.notify({
              message: e.message,
              type: 'negative',
              position: 'top-right',
              actions: [{
                icon: 'close', color: 'white', dense: true, handler: () => undefined
              }]
            }))
      }
    },

    dialogDeleteUser () {
      axios.delete(`/api/v1/delete-user/${this.userId}`)
        .then(response => {
          this.store.users = this.store.users.filter(user => user.id !== this.userId)
          this.dialogClose()
        })
        .catch(e =>
          this.$q.notify({
            message: e.message,
            type: 'negative',
            position: 'top-right',
            actions: [{
              icon: 'close', color: 'white', dense: true, handler: () => undefined
            }]
          }))
    },

    getRoleName (role) {
      switch (role) {
        case 'ADMIN': return 'Администратор'
        case 'OPERATOR': return 'Оператор поддержки'
        case 'OBSERVER': return 'Менеджер организации'
        case 'CLIENT': return 'Клиент'
      }
    }
  },
  computed: {
    showDialogOrganizations () {
      return this.dialogRole === 'Оператор поддержки' || this.dialogRole === 'Менеджер организации'
    }
  },
  watch: {
    dialogRole (newVal) {
      this.dialogOrganization = []
    }
  },
  setup () {
    const store = useStore()
    return { store }
  }
}
</script>

<style scoped>
.table-container {
  width: 100%;
}
</style>
