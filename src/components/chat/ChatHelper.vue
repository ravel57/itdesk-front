<template>
  <q-card
    class="my-card no-shadow"
    style="border-radius: 0;border-left: 1px solid #0000001f;"
  >
    <div
      style="overflow: auto"
      :style="this.isMobile ? 'height: calc(100vh - 89px)' : 'height: 100vh;'"
    >
      <div style="width: 100%; display: flex; justify-content: space-between;padding: 8px;">
        <q-icon
          style="height: 40px; color: var(--q-primary); font-size: 1.715em;"
          name="support"
        />
        <q-btn
          v-if="!this.isMobile"
          icon="close"
          @click="this.hideHelper"
          style="color: gray"
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
            <div
              class="row q-col-gutter-md items-start"
              style="padding: 0 16px;"
            >
              <div
                class="col-12 col-md-6"
              >
                <q-input
                  v-model="this.knowledgeBaseSearch"
                  label="Поиск по названию"
                  dense
                  clearable
                  class="full-width"
                  @clear="this.knowledgeBaseSearch = ''"
                >
                  <template #append>
                    <q-icon name="search"/>
                  </template>
                </q-input>
              </div>
              <div class="col-12 col-md-6">
                <q-select
                  id="task-tags"
                  v-model="this.tagsFilter"
                  :options="this.filteredTags"
                  multiple
                  label="Теги"
                  use-chips
                  use-input
                  dense
                  class="full-width"
                  @filter="filterTags"
                />
              </div>
            </div>
            <div class="q-px-md q-pb-md">
              <q-card
                flat
                bordered
                class="kb-ai-card"
              >
<!--                <q-card-section class="q-pb-sm">-->
<!--                  <q-input-->
<!--                    v-model="this.aiQuery"-->
<!--                    label="Спросить ИИ (β-функция)"-->
<!--                    dense-->
<!--                    outlined-->
<!--                    :readonly="this.aiLoading"-->
<!--                    :clearable="!this.aiLoading"-->
<!--                    class="full-width"-->
<!--                    @clear="aiQuery = ''"-->
<!--                    @keyup.enter="aiQueryRequest"-->
<!--                  >-->
<!--                    <template #append>-->
<!--                      <q-spinner-->
<!--                        v-if="aiLoading"-->
<!--                        size="18px"-->
<!--                        class="q-ml-sm"-->
<!--                      />-->
<!--                        <q-btn-->
<!--                          v-else-->
<!--                          flat-->
<!--                          dense-->
<!--                          round-->
<!--                          icon="sym_o_network_intel_node"-->
<!--                          :disable="!this.aiQuery?.trim()"-->
<!--                          @click="aiQueryRequest"-->
<!--                        >-->
<!--                        <q-tooltip>Отправить</q-tooltip>-->
<!--                      </q-btn>-->
<!--                    </template>-->
<!--                  </q-input>-->
<!--                </q-card-section>-->
<!--                <q-separator/>-->
<!--                <q-card-section class="q-pt-sm">-->
<!--                  <div-->
<!--                    v-if="this.aiResponse.length > 0"-->
<!--                    class="markdown kb-ai-response ai-md"-->
<!--                    v-html="this.aiResponseHtml"-->
<!--                  />-->
<!--                </q-card-section>-->
<!--                <q-separator/>-->
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
                    <q-item-section>
                      <q-item-label
                        lines="1"
                      >
                        {{ item.title }}
                      </q-item-label>
                      <q-item-label
                        caption
                        lines="2"
                      >
                        Теги: {{ item.tags.map(tag => tag.name).join(',') }}
                      </q-item-label>
                    </q-item-section>
                  </q-item>
                </div>
              </q-card>
            </div>
          </q-expansion-item>
        </q-card>
        <!--<q-card style="margin-bottom: 8px">-->
        <!--  <q-expansion-item label="Макросы" class="spoiler">-->
        <!--    <div style="height: 60vh;overflow: auto">-->
        <!--      <q-item-->
        <!--        v-for="(item, index) in this.macros"-->
        <!--        :key="index"-->
        <!--        class="hidden-text q-layout-padding"-->
        <!--        clickable-->
        <!--      >-->
        <!--        {{ item.text }}-->
        <!--      </q-item>-->
        <!--    </div>-->
        <!--  </q-expansion-item>-->
        <!--</q-card>-->
      </q-card-section>
    </div>
    <!--<q-scroll-area-->
    <!--  :style="this.isMobile ? 'height: calc(100vh - 75px)' : 'height: calc(100vh - 16px)'"-->
    <!-- >-->
    <!--  -->
    <!--</q-scroll-area>-->
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
import axios from 'axios'
import { marked } from 'marked'
import DOMPurify from 'dompurify'

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
    knowledgeBaseSearch: '',
    filteredTags: [],
    aiQuery: '',
    aiLoading: false,
    aiResponse: ''
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
    },

    filterTags (val, update) {
      update(() => {
        this.filteredTags = this.store.tags
          .filter(tag => tag.name.toLowerCase().includes(val.toLowerCase()))
          .map(tag => tag.name)
      })
    },

    aiQueryRequest () {
      this.aiLoading = true
      axios.get(`/api/v1/llm-query?query=${encodeURI(this.aiQuery)}`)
        .then(response => {
          this.aiResponse = response.data
          this.aiLoading = false
        })
        .catch(() => {
          this.aiResponse = ''
          this.aiLoading = false
        })
    }
  },

  watch: {
    knowledgeBaseSearch (newValue) {
      this.filteredKnowledgeBase = this.knowledgeBase
        .filter(kb => kb.title.toLowerCase().includes(newValue.toLowerCase()))
    },

    tagsFilter (newValue) {
      if (newValue.length > 0) {
        this.filteredKnowledgeBase = this.knowledgeBase.filter(kb =>
          kb.tags.map(tag => tag.name).some(tagName => newValue.includes(tagName))
        )
      } else {
        this.filteredKnowledgeBase = this.knowledgeBase
      }
    },

    templateSearch (newValue) {
      this.filteredTemplates = this.templates
        .filter(template => template.text.toLowerCase().includes(newValue.toLowerCase()) || template.shortcut.toLowerCase().includes(newValue.toLowerCase()))
    }
  },

  computed: {
    aiResponseHtml () {
      const rawMd = typeof this.aiResponse === 'string'
        ? this.aiResponse
        : JSON.stringify(this.aiResponse, null, 2)
      const html = DOMPurify.sanitize(marked.parse(rawMd || ''))
      const root = document.createElement('div')
      root.innerHTML = html
      root.querySelectorAll('p').forEach(p => {
        if (p.textContent.replace(/\u00A0/g, '').trim() === '' && p.children.length === 0) {
          p.remove()
        }
      })
      return root.innerHTML
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

.kb-ai-card {
  border-radius: 12px;
}

.kb-ai-response {
  font-size: 14px;
  white-space: pre-wrap;
  max-height: 260px;
  overflow: auto;
}

.ai-md p {
  margin: 0;          /* убираем “пустые строки” между абзацами */
}

.ai-md p + p {
  margin-top: 6px;    /* если хочешь небольшой аккуратный интервал */
}

.ai-md ul,
.ai-md ol {
  margin: 6px 0;
  padding-left: 18px;
}

.ai-md li {
  margin: 2px 0;
}
</style>
