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
        padding
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
              :text="message.text"
              stamp="7 minutes ago"
              :bg-color="message.comment ? 'blue-3' : '#e0e0e0'"
              :text-color="message.comment ? 'white' : 'black'"
            />
          </div>
        </div>
        <q-page-sticky expand position="bottom">
          <q-toolbar>
            <textarea
              :placeholder="toggleValue ? 'Текст комментария' : 'Текст сообщения'"
              style="width: 200%; height: 70px;"
              class="shadow-2 rounded-borders"
              :class="this.toggleValue ? 'bg-blue-3' : 'bg-white'"
              ref="textInput"
              :value="this.inputField"
              id="textarea"
              @keydown.tab.prevent="handleTab"
              @keydown="this.handleKeyPress"
              @change="this.textChanged"
              :style="'color: ' + this.toggleValue ? 'white' : 'black'"
            />
            <div>
              <q-toggle
                v-model="this.toggleValue"
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
export default {
  name: 'ChatDialog',

  props: ['messages', 'inputField', 'templates'],

  data: () => ({
    toggleValue: false,
    text: '',
    taskWatchingNow: []
  }),

  mounted () {
    this.$refs.textInput.focus()
    this.scrollToBottom()
  },

  methods: {
    scrollToBottom () {
      document.getElementById('chat').scrollIntoView({ behavior: 'smooth', block: 'end' })
    },

    sendMessage () {
      const textarea = document.getElementById('textarea')
      if (textarea.value) {
        this.$emit('sendMessage', {
          id: 3,
          name: 'test test',
          text: [textarea.value],
          sent: true,
          comment: this.toggleValue
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
    }
  }
}
</script>
