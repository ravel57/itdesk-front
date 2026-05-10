<template>
  <q-card
    data-tour="chat-helper-column"
    class="my-card no-shadow"
    style="border-radius: 0;border-left: 1px solid #0000001f;"
  >
    <div
      class="chat-helper-root"
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
      <q-card-section class="helper-sections">
        <q-card
          data-tour="chat-helper-templates"
          class="no-shadow helper-card helper-templates-card"
          :style="{ height: this.isMobile ? 'auto' : templatesBlockHeight + 'px' }"
        >
          <q-expansion-item
            v-model="templatesOpened"
            label="Шаблоны"
            class="spoiler"
          >
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
            <div
              class="templates-list"
              :style="{ height: this.isMobile ? '60vh' : templatesListHeight }"
            >
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
        <div
          v-if="!this.isMobile"
          class="helper-resizer"
          @mousedown="startTemplatesResize"
        />
        <q-card data-tour="chat-helper-kb" class="no-shadow helper-card helper-knowledge-card">
          <q-expansion-item
            v-model="knowledgeBaseOpened"
            label="База знаний"
            class="spoiler"
          >
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
                data-tour="chat-helper-ai"
                flat
                bordered
                class="kb-ai-card"
              >
                <q-card-section class="q-pb-sm">
                  <q-input
                    v-model="this.aiQuery"
                    label="Спросить ИИ (β-функция)"
                    dense
                    outlined
                    :readonly="this.aiLoading"
                    :clearable="!this.aiLoading"
                    class="full-width"
                    @clear="aiQuery = ''"
                    @keyup.enter="aiQueryRequest"
                  >
                    <template #append>
                      <q-spinner
                        v-if="aiLoading"
                        size="18px"
                        class="q-ml-sm"
                      />
                        <q-btn
                          v-else
                          flat
                          dense
                          round
                          icon="sym_o_network_intel_node"
                          :disable="!this.aiQuery?.trim()"
                          @click="aiQueryRequest"
                        >
                        <q-tooltip>Отправить</q-tooltip>
                      </q-btn>
                    </template>
                  </q-input>
                </q-card-section>
                <q-separator/>
                <q-card-section class="q-pt-sm">
                  <div
                    v-if="this.aiResponse.length > 0"
                    class="markdown kb-ai-response ai-md"
                    v-html="this.aiResponseHtml"
                  />
                </q-card-section>
                <q-separator/>
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
    aiResponse: '',
    templatesBlockHeight: 720,
    templatesBlockHeightStorageKey: 'chatHelper.templatesBlockHeight',
    templatesOpened: true,
    knowledgeBaseOpened: true,
    templatesOpenedStorageKey: 'chatHelper.templatesOpened',
    knowledgeBaseOpenedStorageKey: 'chatHelper.knowledgeBaseOpened',
    resizingTemplates: false,
    resizeStartY: 0,
    resizeStartHeight: 0
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
    },

    startTemplatesResize (event) {
      if (this.isMobile) {
        return
      }

      this.resizingTemplates = true
      this.resizeStartY = event.clientY
      this.resizeStartHeight = this.templatesBlockHeight

      document.body.style.userSelect = 'none'
      document.body.style.cursor = 'row-resize'

      window.addEventListener('mousemove', this.resizeTemplates)
      window.addEventListener('mouseup', this.stopTemplatesResize)
    },

    resizeTemplates (event) {
      if (!this.resizingTemplates) {
        return
      }
      const delta = event.clientY - this.resizeStartY
      const nextHeight = this.resizeStartHeight + delta
      const minHeight = 180
      const maxHeight = window.innerHeight - 220
      this.templatesBlockHeight = Math.min(Math.max(nextHeight, minHeight), maxHeight)
      localStorage.setItem(
        this.templatesBlockHeightStorageKey,
        String(this.templatesBlockHeight)
      )
    },

    stopTemplatesResize () {
      if (this.resizingTemplates) {
        localStorage.setItem(
          this.templatesBlockHeightStorageKey,
          String(this.templatesBlockHeight)
        )
      }
      this.resizingTemplates = false
      document.body.style.userSelect = ''
      document.body.style.cursor = ''
      window.removeEventListener('mousemove', this.resizeTemplates)
      window.removeEventListener('mouseup', this.stopTemplatesResize)
    },
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
    },

    templatesOpened (newValue) {
      localStorage.setItem(
        this.templatesOpenedStorageKey,
        String(newValue)
      )
    },

    knowledgeBaseOpened (newValue) {
      localStorage.setItem(
        this.knowledgeBaseOpenedStorageKey,
        String(newValue)
      )
    },
  },

  computed: {
    aiResponseHtml () {
      const rawMd = (typeof this.aiResponse === 'string'
        ? this.aiResponse
        : JSON.stringify(this.aiResponse, null, 2)
      )
        .replace(/\r\n/g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim()
      const html = DOMPurify.sanitize(marked.parse(rawMd || ''))
      const root = document.createElement('div')
      root.innerHTML = html
      root.querySelectorAll('p').forEach(p => {
        if (p.textContent.replace(/\u00A0/g, '').trim() === '' && p.children.length === 0) {
          p.remove()
        }
      })
      return root.innerHTML
    },

    templatesListHeight () {
      return `${Math.max(this.templatesBlockHeight - 122, 80)}px`
    },
  },

  mounted () {
    const savedHeight = Number(localStorage.getItem(this.templatesBlockHeightStorageKey))
    if (savedHeight && !Number.isNaN(savedHeight)) {
      const minHeight = 180
      const maxHeight = window.innerHeight - 220
      this.templatesBlockHeight = Math.min(Math.max(savedHeight, minHeight), maxHeight)
    }
  },

  created () {
    const savedTemplatesOpened = localStorage.getItem(this.templatesOpenedStorageKey)
    const savedKnowledgeBaseOpened = localStorage.getItem(this.knowledgeBaseOpenedStorageKey)
    if (savedTemplatesOpened !== null) {
      this.templatesOpened = savedTemplatesOpened === 'true'
    }
    if (savedKnowledgeBaseOpened !== null) {
      this.knowledgeBaseOpened = savedKnowledgeBaseOpened === 'true'
    }
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
  },

  beforeUnmount () {
    this.stopTemplatesResize()
  },

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
  white-space: normal;
  max-height: 260px;
  overflow: auto;
}

.ai-md :deep(p) {
  margin: 0;
  padding: 0;
}

.ai-md :deep(p + p) {
  margin-top: 4px;
}

.ai-md :deep(ul),
.ai-md :deep(ol) {
  margin: 4px 0;
  padding-left: 18px;
}

.ai-md :deep(li) {
  margin: 0;
  padding: 0;
}

.ai-md :deep(li + li) {
  margin-top: 4px;
}

.chat-helper-root {
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.helper-sections {
  padding: 0;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.helper-card {
  margin-bottom: 0;
  min-height: 0;
  overflow: hidden;
}

.helper-templates-card {
  flex-shrink: 0;
}

.helper-knowledge-card {
  flex: 1;
  min-height: 160px;
  overflow: auto;
}

.templates-list {
  padding-top: 0;
  overflow-y: auto;
}

.helper-resizer {
  height: 8px;
  flex-shrink: 0;
  cursor: row-resize;
  position: relative;
}

.helper-resizer::before {
  content: '';
  position: absolute;
  left: 16px;
  right: 16px;
  top: 3px;
  height: 2px;
  background: #0000001f;
  border-radius: 2px;
}

.helper-resizer:hover::before {
  background: var(--q-primary);
}
</style>
