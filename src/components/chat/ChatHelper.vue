<template>
  <q-card class="my-card">
    <div
      style="overflow: auto"
      :style="this.isMobile ? 'height: calc(100vh - 75px)' : 'height: calc(100vh - 16px)'"
    >
      <div style="width: 100%;">
        <q-btn
          v-if="!this.isMobile"
          icon="remove"
          @click="this.hideHelper"
          flat
          dense
          class="q-ml-auto flex justify-end"
        />
      </div>
      <q-card-section>
        <q-card style="margin-bottom: 8px">
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
            <div style="height: 60vh; padding-top: 0;overflow: auto">
              <q-item
                v-for="(item, index) in this.filteredTemplates"
                :key="index"
                class="hidden-text q-layout-padding"
                clickable
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
        <q-card style="margin-bottom: 8px">
          <q-expansion-item label="База знаний" class="spoiler">
            <div style="max-height: 60vh;overflow: auto">
              <q-item
                v-for="(item, index) in this.knowledgeBase"
                :key="index"
                class="hidden-text q-layout-padding"
                clickable
                @click="showModal(item)"
              >
                {{ item.title }}
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
      <q-toolbar class="justify-end">
        <q-btn flat round dense icon="close" v-close-popup/>
      </q-toolbar>
      <q-card-section style="padding-top: 0">
        <h6 v-text="this.modalTitle"/>
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
export default {
  name: 'ChatHelper',

  props: ['templates', 'knowledgeBase', 'macros', 'isMobile'],

  data: () => ({
    modalVisible: false,
    modalTitle: '',
    modalText: '',
    templateSearch: '',
    filteredTemplates: []
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
    templateSearch (newValue) {
      this.filteredTemplates = this.templates
        .filter(template => template.text.toLowerCase().includes(newValue.toLowerCase()) || template.shortcut.toLowerCase().includes(newValue.toLowerCase()))
    }
  },

  mounted () {
    this.filteredTemplates = this.templates
  },

  updated () {
    if (this.templates) {
      this.filteredTemplates = this.templates
    }
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
