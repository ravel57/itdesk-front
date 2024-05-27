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
      <q-page-sticky
        expand
        position="top"
        class="no-padding"
        style="background: white; z-index: 3;"
      >
        <q-input
          filled
          v-model="search"
          label="Поиск"
          dense
          clearable
          style="width: 100%;"
        >
          <template v-slot:append>
            <q-icon name="search"/>
          </template>
        </q-input>
        <q-list
          v-if="this.searchResults.length > 0"
        >
          <q-item
            v-for="message in searchResults"
            :key="message.id"
            clickable
          >
            <q-item-section
              @click="goToMessage(message.id)"
              style="width: 100%;"
            >
              {{ message.text }}
            </q-item-section>
          </q-item>
        </q-list>
      </q-page-sticky>
      <q-page
        style="padding-bottom: 86px; padding-top: 48px;"
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
              :id="`message_${message.id}`"
              :avatar="message.avatar"
              :name="this.getName(message)"
              :sent="message.sent"
              :stamp="this.getStamp(message)"
              :bg-color="message.comment ? 'blue-3' : message.sent ? '#e0e0e0' : 'indigo-3'"
              :text-color="message.comment ? 'white' : 'black'"
              :class="message.deleted ? 'strikethrough' : ''"
              style="white-space: pre-wrap;"
              @click.right="this.invertContextMenu"
            >
              <div class="flex" v-if="this.getReplyMessageText(message)">
                <q-icon name="reply"/>
                {{ this.getReplyMessageText(message) }}
              </div>
              <div>
                <img
                  v-if="message.fileUuid && message.fileType.startsWith('image/')"
                  :src="`/files/images/${message.fileUuid}`"
                  style="width: 90%"
                  alt=""
                >
                <video
                  v-else-if="message.fileUuid && message.fileType.startsWith('video/')"
                  style="width: 90%"
                  controls
                >
                  <source
                    :src="`/files/videos/${message.fileUuid}`"
                    type="video/mp4"
                  >
                  Your browser does not support the video tag.
                </video>
                <audio
                  v-else-if="message.fileUuid && message.fileType.startsWith('audio/')"
                  style="width: 90%"
                  controls
                >
                  <source
                    :src="`/files/audios/${message.fileUuid}`"
                    type="audio/ogg"
                  >
                  Your browser does not support the video tag.
                </audio>
                <a
                  v-else-if="message.fileUuid"
                  :href="`/files/documents/${message.fileUuid}`"
                  target="_blank"
                >
                  <q-icon name="attach_file"/>
                  {{ message.fileName }}
                </a>
                <div v-html="this.findLinks(message.text)"/>
                <q-menu
                  v-if="this.isShowCustomContextMenu"
                  touch-position
                  context-menu
                >
                  <q-list dense style="min-width: 100px">
                    <q-item
                      clickable
                      v-close-popup
                    >
                      <q-item-section
                        @click="this.replyMessage(message)"
                      >
                        Ответить
                      </q-item-section>
                    </q-item>
                    <q-item
                      clickable
                      v-close-popup
                    >
                      <q-item-section
                        @click="this.deleteMessage(message)"
                      >
                        Удалить
                      </q-item-section>
                    </q-item>
                    <q-item
                      clickable
                      v-close-popup
                    >
                      <q-item-section
                        @click="copyToClipboard(message.text)"
                      >
                        Скопировать текст
                      </q-item-section>
                    </q-item>
                    <q-item
                      clickable
                    >
                      <q-item-section
                        @click="pastToInputField(message.text)"
                        v-close-popup
                      >
                        Вставить в поле ввода
                      </q-item-section>
                    </q-item>
                    <q-item
                      v-if="this.tasks.length > 0"
                      clickable
                    >
                      <q-item-section>
                        Сделать ключевым для заявки
                      </q-item-section>
                      <q-item-section side>
                        <q-icon name="keyboard_arrow_right"/>
                      </q-item-section>
                      <q-menu anchor="top end" self="top start">
                        <q-list>
                          <q-item
                            v-for="task in this.tasks"
                            :key="task"
                            dense
                            clickable
                            @click="this.linkToTask(message, task)"
                            v-close-popup>
                            <q-item-section
                            >
                              {{ task.name }}
                            </q-item-section>
                          </q-item>
                        </q-list>
                      </q-menu>
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
          style="background: white"
        >
          <div
            v-if="this.typing.filter(t => t.username !== this.currentUser.username).length > 0"
            v-text="this.getTypingUsers"
          />
          <div
            v-if="this.replyMessageId !== null"
          >
            <q-icon name="reply"/>
            {{ this.messages.find(m => m.id === this.replyMessageId).text }}
          </div>
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
              @keydown.tab.prevent="handleTabPressed"
              @keydown="this.handleKeyPressed"
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
          <div
            v-if="this.attachedFile"
            style="background: white; width: 100%"
          >
            {{ this.attachedFile ? this.attachedFile.name : '' }}
            <q-icon
              name="close"
              @click="this.attachedFile = null"
            />
          </div>
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

  props: [
    'messages',
    'inputField',
    'templates',
    'isSending',
    'clientId',
    'typing',
    'currentUser',
    'linkedMessageId',
    'tasks',
    'taskWatchingNow'
  ],

  data: () => ({
    toggleIsComment: false,
    text: '',
    isShowCustomContextMenu: true,
    rightClickCounter: 0,
    attachedFile: null,
    replyMessageId: null,
    search: '',
    searchResults: []
  }),

  updated () {
    this.$emit('updated')
  },

  mounted () {
    this.$refs.textInput.focus()
    this.scrollToBottom()
  },

  methods: {
    copyToClipboard (text) {
      navigator.clipboard.writeText(text)
    },

    pastToInputField (text) {
      this.$emit('pastToInputField', text)
    },

    scrollToBottom () {
      setTimeout(() => {
        document.getElementById('chat').scrollIntoView({ block: 'end' })
      }, 10)
    },

    sendMessage () {
      const textarea = document.getElementById('textarea')
      if (textarea.value || this.attachedFile) {
        this.$emit('isSending', true)
        const message = {
          id: null,
          text: textarea.value,
          date: new Date(),
          sent: true,
          comment: this.toggleIsComment,
          read: true,
          replyMessageId: this.replyMessageId
        }
        if (this.attachedFile) {
          const formData = new FormData()
          formData.append('file', this.attachedFile)
          axios.post('/files/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
            .then(response => {
              message.fileUuid = response.data
              message.fileName = this.attachedFile.name
              message.fileType = this.attachedFile.type
              axios.post(`/api/v1/client/${this.clientId}/new-message`, message)
                .then(() => {
                  this.$emit('sendMessage', message)
                  this.scrollToBottom()
                  this.attachedFile = null
                  this.replyMessageId = null
                })
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
        } else {
          axios.post(`/api/v1/client/${this.clientId}/new-message`, message)
            .then(() => {
              this.$emit('sendMessage', message)
              this.scrollToBottom()
              this.replyMessageId = null
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
      }
    },

    handleTabPressed (event) {
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

    handleKeyPressed (event) {
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
        this.attachedFile = fileInput.files[0]
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
      const urlRegex = /(https?:\/\/\S+)/g
      const decodedText = document.createElement('textarea')
      decodedText.innerHTML = message
      return decodedText.value.replace(urlRegex, '<a href="$&" target="_blank">$&</a>')
    },

    scrollToElementById (id) {
      const element = document.getElementById(id)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' })
        const clazz = 'bg-primary'
        element.classList.add(clazz)
        setTimeout(() => {
          element.classList.remove(clazz)
          this.$emit('clearLinkedMessageId')
        }, 2500)
      }
    },

    linkToTask (message, task) {
      this.$emit('linkToTask', message, task)
    },

    deleteMessage (message) {
      this.$emit('deleteMessage', message)
    },

    invertContextMenu () {
      if (this.rightClickCounter > 0) {
        this.isShowCustomContextMenu = false
        setTimeout(() => {
          this.isShowCustomContextMenu = true
          this.rightClickCounter = 0
        }, 1000)
      }
      this.rightClickCounter++
    },

    replyMessage (message) {
      this.replyMessageId = message.id
    },

    getReplyMessageText (message) {
      const find = this.messages.find(m => m.id === message.replyMessageId)
      if (find) {
        return find.text
      } else {
        return ''
      }
    },

    onSearch () {
      if (this.search) {
        this.searchResults = this.messages.filter(message => {
          if (message.text) {
            return message.text.toLowerCase().includes(this.search.toLowerCase())
          } else {
            return false
          }
        })
      } else {
        this.searchResults = []
      }
    },

    goToMessage (messageId) {
      this.scrollToElementById(`message_${messageId}`)
    }
  },

  computed: {
    getTypingUsers () {
      const filter = this.typing.filter(t => t.username !== this.currentUser.username)
      const s = filter.length > 1 ? ' печатают...' : ' печатает...'
      return filter.map(t => `${t.firstname} ${t.lastname}`).join(', ') + s
    }
  },

  watch: {
    linkedMessageId () {
      this.scrollToElementById(`message_${this.linkedMessageId}`)
    },
    search (newVal) {
      this.onSearch(newVal)
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
