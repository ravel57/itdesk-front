<template>
  <div class="q-pa-md">
    <q-btn
      icon="add"
      label="Добавить пользователя"
      @click="this.dialogVisible = true"
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
              @click="editRow(props.row)"
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
    <q-card>
      <q-card-section>
        <q-input
          v-model="this.dialogLastName"
          label="Фамилия"
        />
        <q-input
          v-model="this.dialogFirstName"
          label="Имя"
        />
        <q-input
          v-model="this.dialogUsername"
          label="username"
        />
        <q-input
          label="Пароль"
          type="password"
          v-model="this.dialogPassword"
        />
        <q-select
          v-model="dialogRole"
          :options="this.store.roles"
          label="Роль"
          use-input
        />
      </q-card-section>
      <q-card-actions align="right">
        <q-btn
          color="white"
          label="Закрыть"
          text-color="primary"
          @click="dialogClose"
        />
        <q-btn
          color="primary"
          label="Сохранить"
          @click="dialogSaveNewUser"/>
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
      { name: 'username', label: 'username', align: 'left', field: 'username' },
      { name: 'firstname', label: 'Имя', align: 'left', field: 'firstname' },
      { name: 'lastname', label: 'Фамилия', align: 'left', field: 'lastname' },
      { name: 'roles', label: 'Роли', align: 'left', field: 'authorities', format: (arr) => arr.join(', ') },
      { name: 'edit', label: '', align: 'center', field: 'edit' }
    ],

    dialogVisible: false,
    dialogUsername: '',
    dialogPassword: '',
    dialogFirstName: '',
    dialogLastName: '',
    dialogRole: []
  }),

  methods: {
    editRow (row) {
      console.log('Editing row:', row)
    },

    dialogClose () {
      this.dialogVisible = false
      this.dialogUsername = ''
      this.dialogLastName = ''
      this.dialogFirstName = ''
      this.dialogPassword = ''
      this.dialogRole = []
    },

    dialogSaveNewUser () {
      const newUser = {
        username: this.dialogUsername,
        password: this.dialogPassword,
        lastname: this.dialogLastName,
        firstname: this.dialogFirstName,
        authorities: this.dialogRole
      }
      axios.post('/api/v1/new-user', newUser)
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
