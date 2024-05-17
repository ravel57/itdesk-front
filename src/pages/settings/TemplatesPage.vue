<template>
  <div class="q-pa-md">
    <q-btn
      icon="add"
      label="Добавить шаблон"
      @click="this.dialogNewTemplate"
    />
    <q-list
      bordered
      class="rounded-borders"
      separator
      style="margin-top: 8px"
    >
      <q-item header class="text-bold">
        <q-item-section>
          Название
        </q-item-section>
        <q-item-section>
          Shortcut
        </q-item-section>
      </q-item>
      <draggable
        :list="this.store.templates"
        item-key="id"
        class="list-group"
        ghost-class="ghost"
        @start="dragging = true"
        @end="dragging = false"
      >
        <template #item="{ element }">
          <q-item
            class="list-group-item"
            :class="{ 'not-draggable': true }"
            style="cursor: grab"
          >
            <q-item-section
              top
              style="justify-content: center"
            >
              {{ element.text }}
            </q-item-section>
            <q-item-section
              top
              style="justify-content: center"
            >
              {{ element.shortcut }}
            </q-item-section>
            <q-item-section
              top
              side
            >
              <q-btn
                color="primary"
                dense
                flat
                icon="edit"
                @click="editRow(element)"
              />
            </q-item-section>
          </q-item>
        </template>
      </draggable>
    </q-list>
  </div>
  <q-dialog
    v-model="this.dialogVisible"
    persistent
    backdrop-filter="blur(4px)"
  >
    <q-card class="dialog-width">
      <q-toolbar class="justify-end">
        <q-btn flat round dense icon="close" v-close-popup/>
      </q-toolbar>
      <q-card-section style="padding-top: 0">
        <q-input
          v-model="this.dialogText"
          label="Текст"
          :rules="[val => (val && val.length > 0) || 'Обязательное поле']"
          ref="dialogText"
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
import draggable from 'vuedraggable'
import { watch } from 'vue'

export default {
  name: 'TemplatesPage',
  components: { draggable },

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
    templateId: null, // for updates
    dragging: true
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
      this.dialogText = ''
      this.dialogShortcut = ''
      setTimeout(() => this.$refs.dialogText.focus(), 250)
    },

    dialogClose () {
      this.dialogVisible = false
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
    watch(() => store.templates, () => {
      axios.post('/api/v1/update-templates/resort', store.templates)
    }, { deep: true })
    return { store }
  }
}
</script>

<style scoped>
.table-container {
  width: 100%;
}

.list-group-item:hover {
  background-color: #e3e3e3;
}
</style>
