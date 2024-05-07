<template>
  <div class="q-pa-md">
    <q-btn
      icon="add"
      label="Добавить тег"
      @click="this.dialogVisible = true"
    />
    <div class="table-container">
      <q-table
        :rows="this.store.tags"
        :columns="columns"
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
        <q-input
          v-model="this.dialogDescription"
          label="Описание"
        />
      </q-card-section>
      <q-card-actions align="right">
        <q-btn
          color="white"
          label="Закрыть"
          text-color="primary"
          @click="closeDialog"
        />
        <q-btn
          color="primary"
          label="Сохранить"
          @click="dialogSaveNewTag"/>
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script>
import { useStore } from 'stores/store'
import axios from 'axios'

export default {
  name: 'TagsComponent',

  data: () => ({
    columns: [
      { name: 'name', label: 'Название', align: 'left', field: 'name' },
      { name: 'description', label: 'Описание', align: 'left', field: 'description' },
      { name: 'edit', label: '', align: 'center', field: 'edit' }
    ],

    dialogVisible: false,
    dialogName: '',
    dialogDescription: ''
  }),

  methods: {
    editRow (row) {
      console.log('Editing row:', row)
    },

    closeDialog () {
      this.dialogVisible = false
      this.dialogName = ''
      this.dialogDescription = ''
    },

    dialogSaveNewTag () {
      const newTag = {
        id: null,
        name: this.dialogName,
        description: this.dialogDescription
      }
      axios.post('/api/v1/new-tag', newTag) /* http://localhost:8080 */
        .then(response => {
          this.store.tags.push(response.data)
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
.table-container {
  width: 100%;
}

.edit-button-container {
  display: flex;
  justify-content: center;
}
</style>
