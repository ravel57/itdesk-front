<template>
  <q-card
    class="my-card no-shadow"
    style="border-radius: 0;border-left: 1px solid #0000001f;"
  >
    <div
      style="overflow: auto"
      :style="this.isMobile ? 'height: calc(100vh - 89px)' : 'height: 100vh;'"
    >
      <div style="width: 100%; display: flex; justify-content: space-between;padding-left: 8px;padding-bottom: 8px;">
        <q-icon
          style="height: 40px; color: var(--q-primary); font-size: 1.715em;"
          name="support"
        />
        <q-btn
          v-if="!this.isMobile"
          icon="arrow_back"
          @click="this.hideHelper"
          flat
          dense
          class="q-ml-auto flex justify-end"
        />
      </div>
      <q-card-section style="padding: 0">
        <q-card class="no-shadow" style="margin-bottom: 8px">
          <q-expansion-item label="Шаблоны" class="spoiler" default-opened>
            <q-input
              v-model="this.templateSearch"
              label="Поиск по шаблонам"
              dense
              clearable
              style="width: 100%;padding: 16px"
              @clear="this.templateSearch = ''"
            >
              <template v-slot:append>
                <q-icon name="search"/>
              </template>
            </q-input>
            <div style="height: 60vh; padding-top: 0;overflow-y: scroll">
              <q-item
                v-for="(item, index) in this.filteredTemplates"
                :key="index"
                class="hidden-text q-layout-padding"
                dense
                clickable
                style="padding: 16px"
                @click="onTemplateClick(item)"
              >
                <q-item-section>
                  <q-item-label
                    lines="1"
                  >
                    {{ item.text }}
                  </q-item-label>
                  <q-item-label
                    caption
                    lines="1"
                  >
                    :{{ item.shortcut }}
                  </q-item-label>
                </q-item-section>
              </q-item>
            </div>
          </q-expansion-item>
        </q-card>
        <q-card class="no-shadow" style="margin-bottom: 8px">
          <q-expansion-item label="База знаний" class="spoiler">
            <q-input
              v-model="this.knowledgeBaseSearch"
              label="Поиск по названию"
              dense
              clearable
              style="width: 100%;padding: 16px"
              @clear="this.knowledgeBaseSearch = ''"
            >
              <template v-slot:append>
                <q-icon name="search"/>
              </template>
            </q-input>
            <q-select
              id="task-tags"
              v-model="this.tagsFilter"
              :options="this.store.tags.map(t => t.name)"
              multiple
              label="Теги"
              use-chips
              use-input
              dense
              style="width: 100%;padding: 16px"
            />
            <div style="max-height: 60vh;overflow: auto">
              <q-item
                v-for="(item, index) in this.filteredKnowledgeBase"
                :key="index"
                dense
                class="hidden-text q-layout-padding"
                clickable
                style="padding: 16px;display: flex;flex-direction: column;"
                @click="showModal(item)"
              >
                <div style="width: 100%;overflow: hidden;text-overflow: ellipsis;white-space: nowrap;">
                  Название: {{ item.title }}
                </div>
                <div style="width: 100%;overflow: hidden;text-overflow: ellipsis;white-space: nowrap;">
                  Теги: {{ item.tags.map(tag => tag.name).join(',') }}
                </div>
              </q-item>
            </div>
          </q-expansion-item>
        </q-card>
<!--        <q-card style="margin-bottom: 8px">-->
<!--          <q-expansion-item label="Макросы" class="spoiler">-->
<!--            <div style="height: 60vh;overflow: auto">-->
<!--              <q-item-->
<!--                v-for="(item, index) in this.macros"-->
<!--                :key="index"-->
<!--                class="hidden-text q-layout-padding"-->
<!--                clickable-->
<!--              >-->
<!--                {{ item.text }}-->
<!--              </q-item>-->
<!--            </div>-->
<!--          </q-expansion-item>-->
<!--        </q-card>-->
      </q-card-section>
    </div>
<!--    <q-scroll-area-->
<!--      :style="this.isMobile ? 'height: calc(100vh - 75px)' : 'height: calc(100vh - 16px)'"-->
<!--    >-->
<!--      -->
<!--    </q-scroll-area>-->
  </q-card>
  <q-dialog
    v-model="modalVisible"
    backdrop-filter="blur(4px)"
  >
    <q-card class="dialog-width">
      <q-toolbar class="justify-between">
        <h6 style="width: 100%;overflow: hidden;text-overflow: ellipsis;white-space: nowrap" v-text="this.modalTitle"/>
        <q-btn flat round dense icon="close" v-close-popup/>
      </q-toolbar>
      <q-card-section style="padding-top: 0">
        <p
          v-for="(text, index) in this.modalText"
          :key="index"
          @click="copyToClipboard(text)"
          class="cursor-pointer"
          v-text="text"
        />
      </q-card-section>
      <q-card-actions align="right">
        <q-btn
          color="white"
          label="Закрыть"
          text-color="primary"
          @click="closeModal"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script>
import { useStore } from 'stores/store'
import { useRoute } from 'vue-router'

export default {
  name: 'ChatHelper',

  props: ['templates', 'knowledgeBase', 'macros', 'isMobile'],

  data: () => ({
    modalVisible: false,
    modalTitle: '',
    modalText: '',
    templateSearch: '',
    filteredTemplates: [],
    tagsFilter: [],
    filteredKnowledgeBase: [],
    knowledgeBaseSearch: ''
  }),

  methods: {
    onTemplateClick (template) {
      this.$emit('onTemplateClick', template.text)
    },

    showModal (knowledge) {
      this.modalTitle = knowledge.title
      this.modalText = knowledge.texts
      this.modalVisible = true
    },

    closeModal () {
      this.modalVisible = false
    },

    copyToClipboard (text) {
      navigator.clipboard.writeText(text)
      this.$q.notify({
        message: 'Текст скопирован в буфер обмена',
        type: 'positive',
        position: 'top-right',
        actions: [
          {
            icon: 'close', color: 'white', dense: true, handler: () => undefined
          }
        ]
      })
    },

    hideHelper () {
      this.$emit('hideHelper')
    }
  },

  watch: {
    knowledgeBaseSearch (newValue) {
      this.filteredKnowledgeBase = this.knowledgeBase
        .filter(kb => kb.title.toLowerCase().includes(newValue.toLowerCase()))
    },

    tagsFilter (newValue) {
      this.filteredKnowledgeBase = this.knowledgeBase.filter(kb =>
        kb.tags.map(tag => tag.name).some(tagName => newValue.includes(tagName))
      )
    },

    templateSearch (newValue) {
      this.filteredTemplates = this.templates
        .filter(template => template.text.toLowerCase().includes(newValue.toLowerCase()) || template.shortcut.toLowerCase().includes(newValue.toLowerCase()))
    }
  },

  created () {
    this.filteredKnowledgeBase = this.knowledgeBase
    this.filteredTemplates = this.templates
  },

  updated () {
    if (this.templates) {
      this.filteredTemplates = this.templates
    }
  },

  setup () {
    const store = useStore()
    const router = useRoute()
    return { store, router }
  }

}
</script>

<style scoped>
.spoiler {
  padding: 0;
  font-size: 20px
}

.hidden-text {
  font-size: 14px;
}

h1, h2, h3, h4, h5, h6, p {
  padding: 8px;
  margin: 0;
}
</style>
