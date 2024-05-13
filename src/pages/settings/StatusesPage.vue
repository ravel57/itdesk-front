<template>
  <div class="q-pa-md">
    <q-btn
      icon="add"
      label="Добавить статус"
      @click="this.dialogVisible = true"
    />
    <div class="table-container">
      <q-table
        :rows="this.store.statuses"
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
    <q-card class="dialog-width">
      <q-card-section>
        <q-input
          v-model="this.dialogStatusName"
          label="Название"
          :rules="[val => (val && val.length > 0) || 'Обязательное поле']"
        />
      </q-card-section>
      <q-card-actions align="right">
        <q-btn
          color="white"
          label="Закрыть"
          text-color="primary"
          @click="this.dialogClose"
        />
        <q-btn
          color="primary"
          label="Сохранить"
          @click="this.dialogSaveNewOrganization"/>
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script>
import axios from 'axios'
import { useStore } from 'stores/store'

export default {
  name: 'StatusesPage',

  data: () => ({
    columns: [
      { name: 'name', label: 'Название', align: 'center', field: 'name' },
      { name: 'edit', label: '', align: 'center', field: 'edit' }
    ],

    dialogVisible: false,
    dialogStatusName: ''
  }),

  methods: {
    editRow (row) {
      console.log('Editing row:', row)
    },

    dialogClose () {
      this.dialogVisible = false
      this.dialogStatusName = ''
    },

    dialogSaveNewOrganization () {
      const newStatus = {
        id: null,
        name: this.dialogStatusName
      }
      axios.post('/api/v1/new-status', newStatus)
        .then(response => {
          this.store.statuses.push(response.data)
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

</style>
