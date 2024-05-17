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
        style="padding-bottom: 66px; padding-top: 8px;"
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
            <!--<q-chat-message v-if="this.isDateChanged(message)" :label="this.getDate(message)"/>-->
            <q-chat-message
              :avatar="message.avatar"
              :name="this.getName(message)"
              :sent="message.sent"
              :stamp="this.getStamp(message)"
              :bg-color="message.comment ? 'blue-3' : message.sent ? '#e0e0e0' : 'indigo-3'"
              :text-color="message.comment ? 'white' : 'black'"
              style="white-space: pre-wrap;"
              left-icon="reply"
            >
              <div>
              <div v-html="this.findLinks(message.text)"/>
                <q-menu
                  touch-position
                  context-menu
                >
                  <q-list dense style="min-width: 100px">
                    <q-item clickable v-close-popup>
                      <q-item-section>Ответить</q-item-section>
                    </q-item>
                    <q-item clickable v-close-popup>
                      <q-item-section>Удалить</q-item-section>
                    </q-item>
                    <q-item clickable v-close-popup>
                      <q-item-section>Скопировать текст</q-item-section>
                    </q-item>
                  </q-list>
                </q-menu>
              </div>
            </q-chat-message>
          </div>
        </div>
        <q-page-sticky
          expand
          position="bottom"
          class="no-padding"
          bg-color="white"
        >
          <div
            v-if="this.typing.length > 0 && this.typing.filter(t => t.username !== this.currentUser.username).length > 0"
            v-text="this.typing.map(t => `${t.firstname} ${t.lastname}`).join(', ') + ' печатает...'"
          />
          <q-toolbar class="no-padding">
            <q-btn
              type="file"
              @click="attachFile"
              icon="attach_file"
              class="no-padding"
              flat
            />
            <input
              type="file"
              id="fileInput"
              style="display: none"
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
                @click="this.sendMessage"
                :loading="this.isSending"
                color="white"
                text-color="primary"
                push
                :ripple="false"
                style="margin: 0 5px"
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
import axios from 'axios'

export default {
  name: 'ChatDialog',

  props: ['messages', 'inputField', 'templates', 'isSending', 'clientId', 'typing', 'currentUser'],

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
    this.scrollToBottom()
  },

  methods: {
    scrollToBottom () {
      setTimeout(() => {
        document.getElementById('chat').scrollIntoView({ block: 'end' })
      }, 5)
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
            // TODO message not delivered
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
      if (this.$refs.textInput.value) {
        const matches = this.$refs.textInput.value.match(/:([^\\x00-\\7F]*)/)
        const value = matches[0].trim()
        if (event.keyCode === 9 /* tab */ && value.startsWith(':')) {
          event.preventDefault()
          const replaceValue = this.templates.filter(e => e.shortcut === value.replace(':', ''))[0].text
          this.$refs.textInput.value = this.$refs.textInput.value.replace(value, replaceValue)
        }
        this.textChanged()
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
        return message.user.firstname + ' ' + (message.user.lastname !== null ? message.user.lastname : '')
      } else {
        return ''
      }
    },

    attachFile () {
      const fileInput = document.getElementById('fileInput')
      fileInput.click()
      fileInput.addEventListener('change', () => {
        console.log('Выбранный файл:', fileInput.files[0]) // FIXME
        this.$q.notify({
          message: `Загружен файл: ${fileInput.files[0].name}`,
          type: 'positive',
          position: 'top-right',
          actions: [{
            icon: 'close', color: 'white', dense: true, handler: () => undefined
          }]
        })
      })
    },

    findLinks (message) {
      const urlRegex = /(https?:\/\/[^\s]+)/g
      const decodedText = document.createElement('textarea')
      decodedText.innerHTML = message
      return decodedText.value.replace(urlRegex, '<a href="$&" target="_blank">$&</a>')
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
