<template>
  <div
    v-if="this.taskWatchingNow.length > 0"
  >
    Сейчас смотрят: {{ this.taskWatchingNow.join(', ') }}
  </div>
  <q-layout
    view="lHh Lpr lFf"
    container
    style="height: 88vh"
    class="shadow-2 rounded-borders"
  >
    <q-page-container>
      <q-page
        style="padding-bottom: 66px"
        ref="chat"
        id="chat"
        scroll
      >
        <div class="q-pa-md row justify-center q-gutter-md">
          <div style="width: 100%;">
            <q-chat-message
              label="Sunday, 19th"
            />
            <q-chat-message
              v-for="message in this.messages"
              :key="message.id"
              :avatar="message.avatar"
              :name="message.name"
              :sent="message.sent"
              :text="[message.text]"
              :stamp="this.getStamp(message)"
              :bg-color="message.comment ? 'blue-3' : '#e0e0e0'"
              :text-color="message.comment ? 'white' : 'black'"
            />
          </div>
        </div>
        <q-page-sticky
          expand
          position="bottom"
          class="no-padding"
        >
          <q-toolbar>
            <q-btn
              type="file"
              @change="onFileChanged($event)"
              icon="attach_file"
              class="no-padding"
              flat
            />
            <textarea
              ref="textInput"
              id="textarea"
              class="shadow-2 rounded-borders"
              :value="this.inputField"
              :placeholder="toggleIsComment ? 'Текст комментария' : 'Текст сообщения'"
              :style="'color: ' + this.toggleIsComment ? 'white' : 'black'"
              :class="this.toggleIsComment ? 'bg-blue-3' : 'bg-white'"
              @keydown.tab.prevent="handleTab"
              @keydown="this.handleKeyPress"
              @input="this.textChanged"
            />
            <div>
              <q-toggle
                v-model="this.toggleIsComment"
                color="primary"
                icon="comment"
              />
              <q-btn
                icon="send"
                @click="sendMessage"
              />
            </div>
          </q-toolbar>
        </q-page-sticky>
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<script>
// TODO загрузка порциями
export default {
  name: 'ChatDialog',

  props: ['messages', 'inputField', 'templates'],

  data: () => ({
    toggleIsComment: false,
    text: '',
    taskWatchingNow: []
  }),

  mounted () {
    this.$refs.textInput.focus()
    this.scrollToBottom() // FIXME
  },

  methods: {
    scrollToBottom () {
      try {
        document.getElementById('chat').scrollIntoView({ behavior: 'smooth', block: 'end' })
      } catch (e) {}
    },

    sendMessage () {
      const textarea = document.getElementById('textarea')
      if (textarea.value) {
        this.$emit('sendMessage', {
          id: null,
          text: textarea.value,
          date: new Date(),
          sent: true,
          comment: this.toggleIsComment,
          read: true
        })
      }
      this.scrollToBottom()
    },

    handleTab (event) {
      const matches = this.$refs.textInput.value.match(/:([^\\x00-\\7F]*)/)
      const value = matches[0].trim()
      if (event.keyCode === 9 /* tab */ && value.startsWith(':')) {
        event.preventDefault()
        const replaceValue = this.templates.filter(e => e.shortCut === value.replace(':', ''))[0].text
        this.$refs.textInput.value = this.$refs.textInput.value.replace(value, replaceValue)
      }
      this.textChanged()
    },

    handleKeyPress (event) {
      if (event.keyCode === 13 && event.ctrlKey) {
        this.sendMessage()
      }
    },

    textChanged () {
      this.$emit('keyPressed', this.$refs.textInput.value)
    },

    onFileChanged (event) {
      console.log(event)
      const target = event.target
      if (target && target.files) {
        this.file.value = target.files[0]
      }
    },

    getStamp (message) {
      return message.date.toLocaleTimeString('ru-RU', { timeZone: 'Europe/Moscow', hour: '2-digit', minute: '2-digit' })
    }
  }
}
</script>

<style scoped>
textarea {
  width: 200%;
  height: 70px;
  resize: none;
}
</style>
