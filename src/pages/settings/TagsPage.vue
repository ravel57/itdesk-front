<template>
  <div class="q-pa-md">
    <q-btn
      icon="add"
      label="Добавить тег"
      @click="this.dialogNewTag"
    />
    <div class="table-container">
      <q-list
        bordered
        class="rounded-borders"
        separator
        full-width
        style="margin-top: 8px"
      >
        <q-item header class="text-bold">
          <q-item-section>
            Название
          </q-item-section>
          <q-item-section>
            Описание
          </q-item-section>
        </q-item>
        <draggable
          :list="this.store.tags"
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
                {{ element.name }}
              </q-item-section>
              <q-item-section
                top
                style="justify-content: center"
              >
                {{ element.description }}
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
          v-model="this.dialogName"
          label="Название"
          :rules="[val => (val && val.length > 0) || 'Обязательное поле']"
        />
        <q-input
          v-model="this.dialogDescription"
          label="Описание"
        />
      </q-card-section>
      <q-card-actions align="right">
        <q-btn
          v-if="!this.isNewTag"
          color="white"
          label="Удалить"
          text-color="primary"
          @click="dialogDeleteTag"
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
          @click="dialogSaveNewOrUpdateTag"/>
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script>
import { useStore } from 'stores/store'
import axios from 'axios'
import { watch } from 'vue'
import draggable from 'vuedraggable'

export default {
  name: 'TagsComponent',

  components: { draggable },

  data: () => ({
    dialogVisible: false,
    dialogName: '',
    dialogDescription: '',

    isNewTag: true,
    tagId: null, // for updates
    dragging: true
  }),

  methods: {
    editRow (row) {
      this.isNewTag = false
      this.dialogVisible = true
      this.dialogName = row.name
      this.dialogDescription = row.description
      this.tagId = row.id
    },

    dialogNewTag () {
      this.dialogVisible = true
      this.isNewTag = true
    },

    dialogClose () {
      this.dialogVisible = false
      this.dialogName = ''
      this.dialogDescription = ''
    },

    dialogSaveNewOrUpdateTag () {
      const tag = {
        id: this.isNewTag ? null : this.tagId,
        name: this.dialogName,
        description: this.dialogDescription
      }
      if (this.isNewTag) {
        axios.post('/api/v1/new-tag', tag)
          .then(response => {
            this.store.tags.push(response.data)
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
        axios.post('/api/v1/update-tag', tag)
          .then(response => {
            this.store.tags[this.store.tags.indexOf(this.store.tags.find(tag => tag.id === this.tagId))] = response.data
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

    dialogDeleteTag () {
      axios.delete(`/api/v1/tag/${this.tagId}`)
        .then(() => {
          this.store.tags = this.store.tags.filter(tag => tag.id !== this.tagId)
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
    watch(() => store.tags, () => {
      axios.post('/api/v1/update-tags/resort', store.tags)
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

.edit-button-container {
  display: flex;
  justify-content: center;
}
</style>
