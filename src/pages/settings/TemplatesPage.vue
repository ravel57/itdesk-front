<template>
  <div class="q-pa-md">
    <q-btn
      icon="add"
      label="Добавить шаблон"
      @click="this.dialogNewTemplate"
    />
    <div class="table-container">
      <q-table
        :rows="this.store.templates"
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
          v-model="this.dialogText"
          label="Текст"
          :rules="[val => (val && val.length > 0) || 'Обязательное поле']"
        />
        <q-input
          v-model="this.dialogShortcut"
          label="Shortcut"
        />
      </q-card-section>
      <q-card-actions align="right">
        <q-btn
          v-if="!this.isNewTemplate"
          color="white"
          label="Удалить"
          text-color="primary"
          @click="dialogDeleteTemplate"
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
          @click="dialogSaveNewOrUpdateTemplate"/>
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script>
import { useStore } from 'stores/store'
import axios from 'axios'

export default {
  name: 'TemplatesPage',

  data: () => ({
    columns: [
      { name: 'text', label: 'Текст', align: 'left', field: 'text' },
      { name: 'shortcut', label: 'Shortcut', align: 'left', field: 'shortcut' },
      { name: 'edit', label: '', align: 'center', field: 'edit' }
    ],

    dialogVisible: false,
    dialogText: '',
    dialogShortcut: '',

    isNewTemplate: true,
    templateId: null // for updates
  }),

  methods: {
    editRow (row) {
      this.isNewTemplate = false
      this.dialogVisible = true
      this.dialogText = row.text
      this.dialogShortcut = row.shortcut
      this.templateId = row.id
    },

    dialogNewTemplate () {
      this.dialogVisible = true
      this.isNewTemplate = true
    },

    dialogClose () {
      this.dialogVisible = false
      this.dialogText = ''
      this.dialogShortcut = ''
    },

    dialogSaveNewOrUpdateTemplate () {
      const template = {
        id: this.isNewTemplate ? null : this.templateId,
        text: this.dialogText,
        shortcut: this.dialogShortcut
      }
      if (this.isNewTemplate) {
        axios.post('/api/v1/new-template', template)
          .then(response => {
            this.store.templates.push(response.data)
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
        axios.post('/api/v1/update-template', template)
          .then(response => {
            this.store.templates[this.store.templates.indexOf(this.store.templates.find(template => template.id === this.templateId))] = response.data
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

    dialogDeleteTemplate () {
      axios.delete(`/api/v1/template/${this.templateId}`)
        .then(() => {
          this.store.templates = this.store.templates.filter(template => template.id !== this.templateId)
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
