<template>
  <div class="q-pa-md">
    <q-btn
      icon="add"
      label="Добавить организацию"
      @click="this.dialogVisible = true"
    />
    <div class="table-container">
      <q-table
        :rows="this.store.organizations"
        :columns="this.columns"
        row-key="id"
        full-width
        :rows-per-page-options="[10, 20, 50]"
        rows-per-page-label="Строк на странице"
      >
        <template v-slot:body-cell-edit="props">
          <q-btn
            color="primary"
            dense
            flat
            icon="edit"
            @click="editRow(props.row)"
          />
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
          v-model="this.dialogName"
          label="Название"
        />
      </q-card-section>
      <q-card-actions align="right">
        <q-btn
          color="white"
          label="Закрыть"
          text-color="primary"
          @click="this.closeDialog"
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
import { useStore } from 'stores/store'
import axios from 'axios'

export default {
  name: 'OrganizationsComponent',

  data: () => ({
    columns: [
      { name: 'name', label: 'Название', align: 'left', field: 'name' },
      { name: 'edit', label: '', align: 'center', field: 'edit' }
    ],

    dialogVisible: false,
    dialogName: ''
  }),

  methods: {
    editRow (row) {
      console.log('Editing row:', row)
    },

    closeDialog () {
      this.dialogVisible = false
      this.dialogName = ''
    },

    dialogSaveNewOrganization () {
      const newOrganization = {
        id: null,
        name: this.dialogName
      }
      axios.post('/api/v1/new-organization', newOrganization) /* http://localhost:8080 */
        .then(response => {
          this.store.organizations.push(response.data)
          this.closeDialog()
        })
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
