<template>
  <div
    v-if="this.taskWatchingNow.length > 0"
    v-text="`Сейчас смотрят: ${this.taskWatchingNow.join(', ')}`"
  />
  <q-layout
    view="lHh Lpr lFf"
    container
    style="height: calc(100vh - 75px);"
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
          <div
            v-for="message in this.messages"
            :key="message.id"
            style="width: 100%; margin-top: 0"
          >
            <q-chat-message
              v-if="this.isDateChanged(message)"
              :label="this.getDate(message)"
            />
            <q-chat-message
              :avatar="message.avatar"
              :name="this.getName(message)"
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
          <q-toolbar class="no-padding">
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
              <div class="flex">
                <q-btn
                  icon="send"
                  @click="this.sendMessage"
                  color="white"
                  text-color="primary"
                />
                <q-spinner-tail
                  style="position: fixed; margin-left: 8px"
                  v-if="this.isSending"
                  color="primary"
                  size="2.5em"
                  :thickness="30"
                />
              </div>
            </div>
          </q-toolbar>
        </q-page-sticky>
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<script>
// TODO загрузка порциями
import axios from 'axios'

export default {
  name: 'ChatDialog',

  props: ['messages', 'inputField', 'templates', 'isSending', 'clientId'],

  data: () => ({
    toggleIsComment: false,
    text: '',
    taskWatchingNow: [],
    previousMessageDate: ''
  }),

  updated () {
    this.$emit('updated')
  },

  mounted () {
    this.$refs.textInput.focus()
    this.scrollToBottom() // FIXME
  },

  methods: {
    scrollToBottom () {
      try {
        document.getElementById('chat').scrollIntoView({ block: 'end' })
      } catch (e) {}
    },

    sendMessage () {
      const textarea = document.getElementById('textarea')
      if (textarea.value) {
        this.$emit('isSending', true)
        const message = {
          id: null,
          text: textarea.value,
          date: new Date(),
          sent: true,
          comment: this.toggleIsComment,
          read: true
        }
        axios.post(`/api/v1/client/${this.clientId}/new-message`, message)
          .then(() => {
            this.$emit('sendMessage', message)
            this.scrollToBottom()
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
      this.$q.notify({
        message: 'onFileChanged',
        type: 'positive',
        position: 'top-right',
        actions: [{
          icon: 'close', color: 'white', dense: true, handler: () => undefined
        }]
      })
      const target = event.target
      if (target && target.files) {
        this.file.value = target.files[0]
      }
    },

    getStamp (message) {
      return message.date.toLocaleTimeString('ru-RU', {
        timeZone: 'Europe/Moscow',
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    },

    getDate (message) {
      return message.date.toLocaleDateString('ru-RU', {
        timeZone: 'Europe/Moscow',
        year: 'numeric',
        month: 'numeric',
        day: 'numeric'
      })
    },

    isDateChanged (message) {
      // const date = message.date.toISOString().slice(0, 10) // this.getDate(message) // .setHours(0, 0, 0, 0)
      // if (this.previousMessageDate !== date) {
      //   this.previousMessageDate = date
      //   return true
      // } else {
      return false
      // }
    },

    getName (message) {
      if (message.user) {
        return message.user.firstname + ' ' + message.user.lastname
      } else {
        return ''
      }
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