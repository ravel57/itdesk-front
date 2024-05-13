<template>
  <div class="q-pa-md">
    <q-btn
      icon="add"
      label="Добавить приоритет"
      @click="this.dialogNewPriorityShow"
    />
    <div class="table-container">
      <q-table
        :rows="this.store.priorities"
        :columns="columns"
        row-key="id"
        full-width
        :rows-per-page-options="[10, 20, 50]"
        rows-per-page-label="Строк на странице"
      >
        <template v-slot:body-cell-edit="props">
          <q-td :props="props">
            <q-btn
              color="primary"
              dense
              flat
              icon="edit"
              @click="updatePriority(props.row)"
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
          v-model="this.dialogName"
          label="Название"
          :rules="[val => (val && val.length > 0) || 'Обязательное поле']"
        />
      </q-card-section>
      <q-card-actions align="right">
        <q-btn
          v-if="!this.isNewPriority"
          color="white"
          label="Удалить"
          text-color="primary"
          @click="dialogDeletePriority"
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
          @click="dialogSaveNewOrUpdatePriority"/>
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script>
import { useStore } from 'stores/store'
import axios from 'axios'

export default {
  name: 'PriorityPage',

  data: () => ({
    columns: [
      { name: 'name', label: 'Название', align: 'left', field: 'name' },
      { name: 'edit', label: '', align: 'center', field: 'edit' }
    ],

    dialogVisible: false,
    dialogName: '',

    isNewPriority: true,
    priorityId: null // for updates
  }),

  methods: {
    dialogNewPriorityShow () {
      this.dialogVisible = true
      this.isNewPriority = true
    },

    updatePriority (row) {
      this.isNewPriority = false
      this.dialogVisible = true
      this.dialogName = row.name
      this.priorityId = row.id
    },

    dialogClose () {
      this.dialogVisible = false
      this.dialogName = ''
    },

    dialogDeletePriority () {
      axios.delete(`/api/v1/priority/${this.priorityId}`)
        .then(() => {
          this.store.priorities = this.store.priorities.filter(priority => priority.id !== this.priorityId)
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

    dialogSaveNewOrUpdatePriority () {
      const priority = {
        id: this.isNewPriority ? null : this.priorityId,
        name: this.dialogName
      }
      if (this.isNewPriority) {
        axios.post('/api/v1/new-priority', priority)
          .then(response => {
            this.store.priorities.push(response.data)
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
        axios.post('/api/v1/update-priority', priority)
          .then(response => {
            const priorities = this.store.priorities
            this.store.priorities[priorities.indexOf(priorities.find(priority => priority.id === this.priorityId))] = response.data
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
