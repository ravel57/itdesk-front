<template>
  <div class="q-pa-md">
    <q-btn
      icon="add"
      label="Добавить знание FIXME"
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
                style="justify-content: center"
              >
                {{ element.texts }}
              </q-item-section>
              <q-item-section
                top
                style="justify-content: center"
              >
                {{ element.tags }}
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
        <q-input
          v-model="this.dialogTexts"
          label="Тексты"
        />
        <q-input
          v-model="this.dialogTags"
          label="Теги"
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
      this.dialogTexts = row.texts.join('\n')
      this.dialogTags = row.tags.join('\n')
    },

    dialogNewKnowledge () {
      this.dialogVisible = true
      this.isNewKnowledge = true
      this.dialogTitle = ''
      this.dialogTexts = ''
      this.dialogTags = ''
      setTimeout(() => this.$refs.dialogName.focus(), 250)
    },

    dialogClose () {
      this.dialogVisible = false
    },

    dialogSaveNewOrUpdateKnowledge () {
      const knowledge = {
        id: this.isNewKnowledge ? null : this.knowledgeId,
        title: this.dialogTitle,
        texts: this.dialogTexts.split('\n'),
        tags: [] // this.dialogTags.split('\n')
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
