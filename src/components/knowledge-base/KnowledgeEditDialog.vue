<template>
  <q-dialog
    v-model="this.dialogVisible"
    persistent
    backdrop-filter="blur(4px)"
  >
    <q-card class="dialog-width">
      <q-toolbar class="justify-between">
        <div class="text-h6" v-text="this.isNewKnowledge ? 'Новая статья' : 'Изменить статью'" />
        <q-btn flat round dense icon="close" v-close-popup />
      </q-toolbar>
      <q-card-section style="padding-top: 0">
        <q-input
          v-model="this.dialogTitle"
          label="Название *"
          :rules="[val => (val && val.length > 0) || 'Обязательное поле']"
          ref="dialogName"
        />
        <div style="display: flex; width: 100%">
          <div style="width: 100%; margin-right: 8px">
            <div v-for="(textField, index) in this.dialogTexts" :key="index">
              <div style="display: flex; flex-direction: row; flex-wrap: nowrap; margin-bottom: 8px">
                <q-input
                  style="width: 100%; margin-right: 4px"
                  v-model="this.dialogTexts[index]"
                  :id="index"
                  label="Текст"
                  type="textarea"
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
              @click="this.dialogTexts.push('')"
            />
          </div>
        </div>
        <q-select
          v-model="this.dialogTags"
          :options="this.dialogTagOptions"
          multiple
          label="Теги"
          use-chips
          use-input
          input-debounce="0"
          dense
          style="padding-top: 16px"
          @filter="filterDialogTags"
          @popup-show="dialogTagOptions = getAllDialogTagOptions()"
        >
          <template v-slot:no-option>
            <q-item>
              <q-item-section class="text-grey">
                Теги не найдены
              </q-item-section>
            </q-item>
          </template>
        </q-select>
      </q-card-section>
      <q-card-actions align="right">
        <q-btn
          v-if="!this.isNewKnowledge"
          unelevated
          color="negative"
          icon="delete"
          label="Удалить"
          @click="dialogDeleteKnowledge"
        />
        <q-btn
          color="white"
          label="Отмена"
          text-color="primary"
          @click="dialogClose"
        />
        <q-btn
          color="primary"
          label="Сохранить"
          @click="dialogSaveNewOrUpdateKnowledge"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script>
import { useStore } from 'stores/store'
import axios from 'axios'
import knowledgeHelpersMixin from 'components/knowledge-base/knowledgeHelpersMixin'
import { filterTagOptions, getAllTagOptions } from 'src/util/knowledgeBase/knowledgeTags'

// Диалог создания / редактирования / удаления статьи со своим состоянием.
// Родитель открывает его через ref: dialogNewKnowledge() и editRow(row).
// События: created / updated (с ответом сервера), deleted (с id статьи).
export default {
  name: 'KnowledgeEditDialog',

  mixins: [knowledgeHelpersMixin],

  emits: ['created', 'updated', 'deleted'],

  data: () => ({
    dialogVisible: false,
    dialogTitle: '',
    dialogTexts: [],
    dialogTags: [],
    dialogTagOptions: [],
    dialogTextsCounter: 1,

    isNewKnowledge: true,
    knowledgeId: null // for updates
  }),

  methods: {
    editRow (row) {
      this.knowledgeId = row.id
      this.isNewKnowledge = false
      this.dialogVisible = true
      this.dialogTitle = row.title
      this.dialogTexts = structuredClone(row.texts || [''])
      this.dialogTags = this.getKnowledgeTags(row).map(tag => tag.name)
      this.dialogTagOptions = this.getAllDialogTagOptions()
    },

    dialogNewKnowledge () {
      this.dialogVisible = true
      this.isNewKnowledge = true
      this.dialogTitle = ''
      this.dialogTexts = ['']
      this.dialogTags = []
      this.dialogTagOptions = this.getAllDialogTagOptions()
      setTimeout(() => this.$refs.dialogName.focus(), 250)
    },

    dialogClose () {
      this.dialogVisible = false
    },

    dialogSaveNewOrUpdateKnowledge () {
      const tags = this.dialogTags
        .map(tagName => (this.store.tags || []).find(tag => tag.name === tagName))
        .filter(Boolean)
      const knowledge = {
        id: this.isNewKnowledge ? null : this.knowledgeId,
        title: this.dialogTitle,
        texts: this.dialogTexts,
        tags
      }
      if (knowledge.title.length === 0) {
        this.$q.notify({
          message: 'Не заполнены обязательные поля',
          type: 'negative'
        })
        return
      }
      if (this.isNewKnowledge) {
        axios.post('/api/v1/knowledge-base', knowledge)
          .then(response => {
            this.store.knowledgeBase.push(response.data)
            this.dialogClose()
            this.$emit('created', response.data)
          })
          .catch(e =>
            this.$q.notify({
              message: e.message,
              type: 'negative'
            }))
      } else {
        axios.patch('/api/v1/knowledge-base', knowledge)
          .then(response => {
            const index = this.store.knowledgeBase.findIndex(knowledge => knowledge.id === this.knowledgeId)

            if (index >= 0) {
              this.store.knowledgeBase.splice(index, 1, response.data)
            }

            this.dialogClose()

            this.$emit('updated', response.data)
          })
          .catch(e =>
            this.$q.notify({
              message: e.message,
              type: 'negative'
            }))
      }
    },

    dialogDeleteKnowledge () {
      axios.delete(`/api/v1/knowledge-base/${this.knowledgeId}`)
        .then(() => {
          const deletedKnowledgeId = this.knowledgeId
          this.store.knowledgeBase = this.store.knowledgeBase.filter(knowledge => knowledge.id !== deletedKnowledgeId)
          this.dialogClose()

          this.$emit('deleted', deletedKnowledgeId)
        })
        .catch(e =>
          this.$q.notify({
            message: e.message,
            type: 'negative'
          }))
    },

    getAllDialogTagOptions () {
      return getAllTagOptions(this.store.tags)
    },

    filterDialogTags (value, update) {
      update(() => {
        this.dialogTagOptions = filterTagOptions(this.getAllDialogTagOptions(), value)
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
.dialog-width {
  min-width: 640px;
}

@media (max-width: 700px) {
  .dialog-width {
    min-width: unset;
    width: 94vw;
  }
}
</style>
