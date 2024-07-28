<template>
  <div class="q-pa-md">
    <q-btn
      icon="add"
      label="Добавить статью"
      @click="this.dialogNewKnowledge"
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
            Информация
          </q-item-section>
          <q-item-section>
            Теги
          </q-item-section>
        </q-item>
        <draggable
          :list="this.store.knowledgeBase"
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
                {{ element.title }}
              </q-item-section>
              <q-item-section
                top
                style="justify-content: center;white-space: pre-wrap;"
              >
                {{ element.texts.join('\n') }}
              </q-item-section>
              <q-item-section
                top
                style="justify-content: center"
              >
                {{ element.tags.map(tag => tag.name).join(', ') }}
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
        <q-btn flat round dense icon="close" v-close-popup/>
      </q-toolbar>
      <q-card-section style="padding-top: 0">
        <q-input
          v-model="this.dialogTitle"
          label="Название"
          :rules="[val => (val && val.length > 0) || 'Обязательное поле']"
          ref="dialogName"
        />
        <div style="display: flex;width: 100%">
          <div style="width: 100%; margin-right: 8px">
            <div v-for="(textField, index) in this.dialogTexts" :key="index">
              <div style="display: flex;flex-direction: row; flex-wrap: nowrap;margin-bottom: 8px">
                <q-input
                  style="width: 100%; margin-right: 4px"
                  v-model="this.dialogTexts[index]"
                  :id="index"
                  label="Текст"
                />
                <q-btn
                  v-if="this.dialogTexts.length > 1"
                  icon="delete"
                  text-color="gray"
                  @click="this.dialogTexts.splice(index, 1)"
                />
              </div>
            </div>
          </div>
          <div style="position: relative; width: 10%">
            <q-btn
              icon="add"
              style="height: 40px; width: 40px;position: absolute;bottom: 8px;"
              text-color="primary"
              @click="this.dialogTexts.push([])"
            />
          </div>
        </div>
        <q-select
          v-model="this.dialogTags"
          :options="this.store.tags.map(t => t.name)"
          multiple
          label="Теги"
          use-chips
          use-input
          dense
          style="padding-top: 16px"
        />
      </q-card-section>
      <q-card-actions align="right">
        <q-btn
          v-if="!this.isNewKnowledge"
          color="white"
          label="Удалить"
          text-color="primary"
          @click="dialogDeleteKnowledge"
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
          @click="dialogSaveNewOrUpdateKnowledge"/>
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
  name: 'KnowledgeBasePage',

  components: { draggable },

  data: () => ({
    dialogVisible: false,
    dialogTitle: '',
    dialogTexts: [],
    dialogTags: [],
    dialogTextsCounter: 1,

    isNewKnowledge: true,
    knowledgeId: null, // for updates
    dragging: true
  }),

  methods: {
    editRow (row) {
      this.knowledgeId = row.id
      this.isNewKnowledge = false
      this.dialogVisible = true
      this.dialogTitle = row.title
      this.dialogTexts = structuredClone(row.texts)
      this.dialogTags = row.tags.map(tag => tag.name)
    },

    dialogNewKnowledge () {
      this.dialogVisible = true
      this.isNewKnowledge = true
      this.dialogTitle = ''
      this.dialogTexts = [[]]
      this.dialogTags = []
      setTimeout(() => this.$refs.dialogName.focus(), 250)
    },

    dialogClose () {
      this.dialogVisible = false
    },

    dialogSaveNewOrUpdateKnowledge () {
      const tags = []
      this.dialogTags.forEach(tagName => tags.push(this.store.tags.find(tag => tag.name === tagName)))
      const knowledge = {
        id: this.isNewKnowledge ? null : this.knowledgeId,
        title: this.dialogTitle,
        texts: this.dialogTexts,
        tags
      }
      if (knowledge.title.length === 0) {
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
      if (this.isNewKnowledge) {
        axios.post('/api/v1/knowledge-base', knowledge)
          .then(response => {
            this.store.knowledgeBase.push(response.data)
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
        axios.patch('/api/v1/knowledge-base', knowledge)
          .then(response => {
            this.store.knowledgeBase[this.store.knowledgeBase.indexOf(this.store.knowledgeBase.find(knowledge => knowledge.id === this.knowledgeId))] = response.data
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

    dialogDeleteKnowledge () {
      axios.delete(`/api/v1/knowledge-base/${this.knowledgeId}`)
        .then(() => {
          this.store.knowledgeBase = this.store.knowledgeBase.filter(knowledge => knowledge.id !== this.knowledgeId)
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
    watch(() => store.knowledgeBase, () => {
      axios.post('/api/v1/knowledge-base/resort', store.knowledgeBase)
    }, { deep: true })
    return { store }
  }
}
</script>

<style scoped>

</style>
