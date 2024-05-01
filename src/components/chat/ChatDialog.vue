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
              v-for="(message) in this.messages"
              :key="message.id"
              :avatar="message.avatar"
              :name="message.name"
              :sent="message.sent"
              :text="[message.text]"
              :stamp="'7 minutes ago'"
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
              :placeholder="toggleIsComment ? 'Текст комментария' : 'Текст сообщения'"
              style="width: 200%; height: 70px;"
              class="shadow-2 rounded-borders"
              :class="this.toggleIsComment ? 'bg-blue-3' : 'bg-white'"
              ref="textInput"
              :value="this.inputField"
              id="textarea"
              @keydown.tab.prevent="handleTab"
              @keydown="this.handleKeyPress"
              @change="this.textChanged"
              :style="'color: ' + this.toggleIsComment ? 'white' : 'black'"
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
          comment: this.toggleIsComment
        })
      }
      this.scrollToBottom()
    },

    handleTab (event) {
      const matches = this.$refs.textInput.value.match(/:([^\\x00-\\x7F]*)/)
      const value = matches[0].trim()
      if (event.keyCode === 9 && value.startsWith(':')) {
        event.preventDefault()
        this.$refs.textInput.value = this.$refs.textInput.value.replace(value, '')
        this.$refs.textInput.value += this.templates.filter(e => e.shortCut === value.replace(':', ''))[0].text
      }
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
    }
  }
}
</script>
