<template>
  <q-card class="my-card">
    <q-scroll-area
      style="height: calc(100vh - 75px);"
    >
      <q-card-section>
        <q-card>
          <q-expansion-item label="Шаблоны" class="spoiler" default-opened>
            <q-scroll-area style="height: 60vh;">
              <q-item
                v-for="(item, index) in this.templates"
                :key="index"
                class="hidden-text q-layout-padding"
                clickable
                @click="onTemplateClick(item)"
              >
                <q-item-section>
                  <q-item-label lines="1">{{ item.text }}</q-item-label>
                  <q-item-label caption lines="1">:{{ item.shortcut }}</q-item-label>
                </q-item-section>

              </q-item>
            </q-scroll-area>
          </q-expansion-item>
        </q-card>
        <q-card>
          <q-expansion-item label="База знаний" class="spoiler">
            <q-scroll-area style="height: 60vh;">
              <q-item
                v-for="(item, index) in this.knowledgeBase"
                :key="index"
                class="hidden-text q-layout-padding"
                clickable
                @click="showModal(item)"
              >
                {{ item.title }} [{{ item.tags.join(', ') }}]
              </q-item>
            </q-scroll-area>
          </q-expansion-item>
        </q-card>
        <q-card>
          <q-expansion-item label="Макросы" class="spoiler">
            <q-scroll-area style="height: 60vh;">
              <q-item
                v-for="(item, index) in this.macros"
                :key="index"
                class="hidden-text q-layout-padding"
                clickable
              >
                {{ item.text }}
              </q-item>
            </q-scroll-area>
          </q-expansion-item>
        </q-card>
      </q-card-section>
    </q-scroll-area>
  </q-card>
  <q-dialog
    v-model="modalVisible"
    backdrop-filter="blur(4px)"
  >
    <q-card class="dialog-width">
      <q-toolbar class="justify-end">
        <q-btn flat round dense icon="close" v-close-popup />
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

  props: ['templates', 'knowledgeBase', 'macros'],

  data: () => ({
    modalVisible: false,
    modalTitle: '',
    modalText: ''
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
