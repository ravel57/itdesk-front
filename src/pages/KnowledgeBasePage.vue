<template>
  <div class="q-pa-md knowledge-page">
    <div class="knowledge-toolbar row items-center q-col-gutter-sm">
      <div class="col-12 col-md-auto">
        <q-btn
          icon="add"
          label="Добавить статью"
          color="primary"
          unelevated
          @click="this.dialogNewKnowledge"
        />
      </div>

      <div class="col-12 col-md">
        <q-input
          v-model="this.knowledgeSearch"
          dense
          outlined
          clearable
          debounce="200"
          placeholder="Поиск по базе знаний"
          class="knowledge-search"
        >
          <template v-slot:prepend>
            <q-icon name="search" />
          </template>
        </q-input>
      </div>
    </div>

    <div class="table-container">
      <q-list
        bordered
        class="rounded-borders knowledge-list"
        separator
        full-width
      >
        <q-item header class="text-bold knowledge-list-header">
          <q-item-section>
            Название
          </q-item-section>
          <q-item-section>
            Информация
          </q-item-section>
          <q-item-section>
            Теги
          </q-item-section>
          <q-item-section side />
        </q-item>

        <draggable
          :list="this.knowledgeItemsForDisplay"
          item-key="id"
          class="list-group"
          ghost-class="ghost"
          :disabled="this.isKnowledgeSearchActive"
          @start="dragging = true"
          @end="dragging = false"
        >
          <template #item="{ element }">
            <q-item
              clickable
              class="list-group-item knowledge-item"
              :class="{ 'knowledge-item--search': this.isKnowledgeSearchActive }"
              @click="this.openKnowledgeView(element)"
            >
              <q-item-section
                top
                class="knowledge-title-section"
              >
                <div class="text-weight-medium">
                  {{ element.title }}
                </div>
                <div class="text-caption text-grey-7">
                  Статья #{{ element.id }}
                </div>
              </q-item-section>

              <q-item-section
                top
                class="knowledge-preview-section"
              >
                <div class="knowledge-preview">
                  {{ this.getKnowledgePreview(element) }}
                </div>
              </q-item-section>

              <q-item-section
                top
                class="knowledge-tags-section"
              >
                <div v-if="this.getKnowledgeTags(element).length" class="row q-gutter-xs">
                  <q-chip
                    v-for="tag in this.getKnowledgeTags(element)"
                    :key="tag.id || tag.name"
                    dense
                    outline
                    color="primary"
                    text-color="primary"
                    class="knowledge-tag"
                  >
                    {{ tag.name }}
                  </q-chip>
                </div>
                <span v-else class="text-grey-6">—</span>
              </q-item-section>

              <q-item-section
                top
                side
              >
                <q-btn
                  color="primary"
                  dense
                  flat
                  round
                  icon="edit"
                  @click.stop="this.editRow(element)"
                >
                  <q-tooltip>Редактировать</q-tooltip>
                </q-btn>
              </q-item-section>
            </q-item>
          </template>
        </draggable>

        <q-item v-if="this.knowledgeItemsForDisplay.length === 0">
          <q-item-section class="text-grey-7 text-center q-pa-md">
            Ничего не найдено
          </q-item-section>
        </q-item>
      </q-list>
    </div>
  </div>

  <q-dialog
    v-model="this.viewKnowledgeVisible"
    backdrop-filter="blur(4px)"
    @hide="this.onKnowledgeViewHide"
  >
    <q-card class="knowledge-view-card">
      <q-toolbar class="knowledge-view-toolbar">
        <q-icon
          name="menu_book"
          color="primary"
          size="28px"
          class="q-mr-sm"
        />
        <div class="col">
          <div class="text-h6 ellipsis">
            {{ this.selectedKnowledgeTitle }}
          </div>
        </div>

        <q-btn
          v-if="this.selectedKnowledge"
          flat
          round
          dense
          icon="edit"
          color="primary"
          @click="this.editRow(this.selectedKnowledge)"
        >
          <q-tooltip>Редактировать статью</q-tooltip>
        </q-btn>

        <q-btn
          flat
          round
          dense
          icon="close"
          @click="this.closeKnowledgeView"
        />
      </q-toolbar>

      <q-separator />

      <q-card-section v-if="this.selectedKnowledge" class="knowledge-view-body">
        <div
          v-if="this.getKnowledgeTags(this.selectedKnowledge).length"
          class="row q-gutter-xs q-mb-md"
        >
          <q-chip
            v-for="tag in this.getKnowledgeTags(this.selectedKnowledge)"
            :key="tag.id || tag.name"
            dense
            color="primary"
            text-color="white"
            icon="sell"
          >
            {{ tag.name }}
          </q-chip>
        </div>

        <div
          v-for="(textBlock, index) in this.getKnowledgeTexts(this.selectedKnowledge)"
          :key="index"
          class="knowledge-view-text"
        >
          {{ textBlock }}
        </div>

        <div
          v-if="this.getKnowledgeTexts(this.selectedKnowledge).length === 0"
          class="text-grey-7"
        >
          У статьи пока нет текста.
        </div>
      </q-card-section>

      <q-card-section v-else class="text-grey-7">
        Статья не найдена.
      </q-card-section>
    </q-card>
  </q-dialog>

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
          no-caps
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
    dialogTagOptions: [],
    dialogTextsCounter: 1,

    isNewKnowledge: true,
    knowledgeId: null, // for updates

    knowledgeSearch: '',
    dragging: true,

    viewKnowledgeVisible: false,
    selectedKnowledgeId: null,
    pendingKnowledgeId: null,
    knowledgeLoading: false,
    knowledgeViewOpening: false,
  }),

  computed: {
    isKnowledgeSearchActive () {
      return this.normalizeKnowledgeSearch(this.knowledgeSearch).length > 0
    },

    knowledgeItemsForDisplay () {
      if (!this.isKnowledgeSearchActive) {
        return this.store.knowledgeBase || []
      }

      const search = this.normalizeKnowledgeSearch(this.knowledgeSearch)

      return (this.store.knowledgeBase || []).filter(knowledge => {
        return this.getKnowledgeSearchText(knowledge).includes(search)
      })
    },

    selectedKnowledge () {
      return this.getKnowledgeById(this.selectedKnowledgeId)
    },

    selectedKnowledgeTitle () {
      if (!this.selectedKnowledge) {
        return 'Статья не найдена'
      }
      return this.selectedKnowledge.title || `Статья #${this.selectedKnowledge.id}`
    },
  },

  watch: {
    '$route.query.knowledgeId': {
      immediate: true,
      handler () {
        this.ensureKnowledgeBaseLoaded()
          .then(() => this.openKnowledgeFromRoute())
      }
    },

    'store.knowledgeBase': {
      deep: true,
      handler () {
        this.$nextTick(() => {
          if (this.pendingKnowledgeId || this.$route?.query?.knowledgeId) {
            this.openKnowledgeFromRoute()
          }
        })
      }
    },
  },

  mounted () {
    this.ensureKnowledgeBaseLoaded()
      .then(() => this.openKnowledgeFromRoute())
  },

  methods: {
    ensureKnowledgeBaseLoaded () {
      if ((this.store.knowledgeBase || []).length > 0) {
        return Promise.resolve()
      }

      if (this.knowledgeLoading) {
        return new Promise(resolve => {
          const timer = setInterval(() => {
            if (!this.knowledgeLoading) {
              clearInterval(timer)
              resolve()
            }
          }, 50)
        })
      }

      this.knowledgeLoading = true

      return axios.get('/api/v1/knowledge-base')
        .then(({ data }) => {
          this.store.knowledgeBase = Array.isArray(data) ? data : []
        })
        .catch(e => {
          this.$q.notify({
            message: e.message,
            type: 'negative',
            position: 'top-right',
            actions: [{
              icon: 'close', color: 'white', dense: true, handler: () => undefined
            }]
          })
        })
        .finally(() => {
          this.knowledgeLoading = false
        })
    },

    openKnowledgeView (knowledge, replace = false) {
      if (!knowledge || !knowledge.id) {
        return
      }
      const knowledgeId = Number(knowledge.id)
      this.pendingKnowledgeId = null
      this.selectedKnowledgeId = knowledgeId
      this.knowledgeViewOpening = true
      this.$nextTick(() => {
        this.viewKnowledgeVisible = true

        this.$nextTick(() => {
          this.knowledgeViewOpening = false
        })
      })
      const query = {
        ...this.$route.query,
        knowledgeId: String(knowledge.id)
      }
      const navigation = {
        path: this.$route.path,
        query
      }
      if (replace) {
        this.$router.replace(navigation).catch(() => undefined)
      } else if (String(this.$route.query.knowledgeId || '') !== String(knowledge.id)) {
        this.$router.push(navigation).catch(() => undefined)
      }
    },

    openKnowledgeFromRoute () {
      const knowledgeId = this.$route?.query?.knowledgeId
      if (!knowledgeId) {
        this.pendingKnowledgeId = null
        this.selectedKnowledgeId = null
        this.viewKnowledgeVisible = false
        return
      }
      const normalizedId = Number(knowledgeId)
      if (!Number.isFinite(normalizedId)) {
        this.pendingKnowledgeId = null
        return
      }
      this.pendingKnowledgeId = normalizedId
      const knowledge = this.getKnowledgeById(normalizedId)
      if (!knowledge) {
        return
      }
      this.pendingKnowledgeId = null
      this.selectedKnowledgeId = Number(knowledge.id)
      this.knowledgeViewOpening = true
      this.$nextTick(() => {
        this.viewKnowledgeVisible = true
        this.$nextTick(() => {
          this.knowledgeViewOpening = false
        })
      })
    },

    closeKnowledgeView () {
      this.viewKnowledgeVisible = false
      this.selectedKnowledgeId = null
      this.pendingKnowledgeId = null
      this.removeKnowledgeIdFromRoute()
    },

    removeKnowledgeIdFromRoute () {
      if (!this.$route?.query?.knowledgeId) {
        return
      }

      const query = { ...this.$route.query }
      delete query.knowledgeId

      this.$router.replace({
        path: this.$route.path,
        query
      }).catch(() => undefined)
    },

    getKnowledgeById (knowledgeId) {
      const normalizedId = Number(knowledgeId)

      if (!Number.isFinite(normalizedId)) {
        return null
      }

      return (this.store.knowledgeBase || []).find(knowledge => Number(knowledge.id) === normalizedId) || null
    },

    getKnowledgeTexts (knowledge) {
      if (!knowledge || !Array.isArray(knowledge.texts)) {
        return []
      }

      return knowledge.texts
        .map(text => String(text || '').trim())
        .filter(text => text.length > 0)
    },

    getKnowledgeTags (knowledge) {
      if (!knowledge || !Array.isArray(knowledge.tags)) {
        return []
      }

      return knowledge.tags.filter(tag => tag && tag.name)
    },

    getKnowledgePreview (knowledge) {
      const text = this.getKnowledgeTexts(knowledge).join(' ')
      if (!text) {
        return 'Без описания'
      }

      return text.length > 220 ? `${text.slice(0, 220)}...` : text
    },

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
            this.openKnowledgeView(response.data, true)
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
            const index = this.store.knowledgeBase.findIndex(knowledge => knowledge.id === this.knowledgeId)

            if (index >= 0) {
              this.store.knowledgeBase.splice(index, 1, response.data)
            }

            this.dialogClose()

            if (Number(this.selectedKnowledgeId) === Number(response.data.id)) {
              this.openKnowledgeView(response.data, true)
            }
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
          const deletedKnowledgeId = this.knowledgeId
          this.store.knowledgeBase = this.store.knowledgeBase.filter(knowledge => knowledge.id !== deletedKnowledgeId)
          this.dialogClose()

          if (Number(this.selectedKnowledgeId) === Number(deletedKnowledgeId)) {
            this.closeKnowledgeView()
          }
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

    normalizeKnowledgeSearch (value) {
      return String(value || '')
        .trim()
        .toLowerCase()
        .replaceAll('ё', 'е')
    },

    getKnowledgeSearchText (knowledge) {
      const title = knowledge?.title || ''
      const texts = this.getKnowledgeTexts(knowledge).join(' ')
      const tags = this.getKnowledgeTags(knowledge).map(tag => tag.name).join(' ')

      return this.normalizeKnowledgeSearch([
        title,
        texts,
        tags
      ].join(' '))
    },

    onKnowledgeViewHide () {
      if (this.knowledgeViewOpening) {
        return
      }
      if (this.$route?.query?.knowledgeId || this.selectedKnowledgeId) {
        this.selectedKnowledgeId = null
        this.pendingKnowledgeId = null
        this.removeKnowledgeIdFromRoute()
      }
    },

    normalizeKnowledgeTagSearch (value) {
      return String(value || '')
        .trim()
        .toLowerCase()
        .replaceAll('ё', 'е')
    },

    getAllDialogTagOptions () {
      return (this.store.tags || [])
        .filter(tag => tag && tag.name)
        .map(tag => tag.name)
        .filter((name, index, array) => array.indexOf(name) === index)
        .sort((left, right) => left.localeCompare(right, 'ru'))
    },

    filterDialogTags (value, update) {
      update(() => {
        const search = this.normalizeKnowledgeTagSearch(value)
        const options = this.getAllDialogTagOptions()
        this.dialogTagOptions = search
          ? options.filter(tagName => this.normalizeKnowledgeTagSearch(tagName).includes(search))
          : options
      })
    },
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
.knowledge-page {
  max-width: 1180px;
}

.knowledge-toolbar {
  margin-bottom: 8px;
}

.knowledge-search {
  max-width: 520px;
}

.knowledge-list {
  margin-top: 8px;
  overflow: hidden;
  background: #fff;
}

.knowledge-list-header {
  background: #fafafa;
}

.knowledge-item {
  min-height: 72px;
  cursor: pointer;
  transition: background-color 0.15s ease, box-shadow 0.15s ease;
}

.knowledge-item:hover {
  background: #f8fbff;
}

.knowledge-item--search {
  cursor: pointer;
}

.knowledge-title-section {
  min-width: 180px;
}

.knowledge-preview-section {
  white-space: pre-wrap;
  line-height: 1.45;
}

.knowledge-preview {
  color: #333;
  display: -webkit-box;
  overflow: hidden;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
}

.knowledge-tags-section {
  min-width: 180px;
}

.knowledge-tag {
  margin: 2px;
}

.knowledge-view-card {
  width: 820px;
  max-width: 92vw;
  border-radius: 12px;
}

.knowledge-view-toolbar {
  padding: 12px 16px;
}

.knowledge-view-body {
  max-height: 70vh;
  overflow-y: auto;
  padding: 20px 24px 24px;
}

.knowledge-view-text {
  white-space: pre-wrap;
  line-height: 1.65;
  font-size: 15px;
  color: #242424;
}

.knowledge-view-text + .knowledge-view-text {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #eeeeee;
}

.dialog-width {
  min-width: 640px;
}

.ghost {
  opacity: 0.5;
}

@media (max-width: 700px) {
  .dialog-width {
    min-width: unset;
    width: 94vw;
  }

  .knowledge-list-header {
    display: none;
  }

  .knowledge-item {
    display: block;
    padding-top: 12px;
    padding-bottom: 12px;
  }

  .knowledge-title-section,
  .knowledge-preview-section,
  .knowledge-tags-section {
    min-width: unset;
    width: 100%;
    padding-bottom: 8px;
  }

  .knowledge-search {
    max-width: unset;
  }
}
</style>
