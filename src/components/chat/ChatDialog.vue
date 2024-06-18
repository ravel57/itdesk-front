<template>
  <div
    v-if="this.taskWatchingNow.filter(user => user.id !== this.currentUser.id).length > 0"
    style="
      display: block;
      position: absolute;
      bottom: 96%;
      left: 50%;
      transform: translateX(-50%);
      padding: 0 5px;
      font-size: 14px;
      z-index: 1000;
      color: white;
      max-width: 100%;
      background: #1976D2;
      border-radius: 5px;
     "
    :style="
    'opacity: ' + (!this.isShowHelper || this.isMobile ? '0.4': '1') +
    ';left: ' + (this.isMobile ? '50%' : (!this.isShowHelper ? '32%' : '50%')) +
    ';bottom: ' + (this.isMobile ? '87%' : (this.isShowHelper === false ? '91%' : '95%'))
    ">
    <div
      style="display: flex; flex-wrap: nowrap; flex-direction: row"
      v-text="`Сейчас смотрят: ${this.taskWatchingNow.filter(user => user.id !== this.currentUser.id).map(user => `${user.firstname} ${user.lastname}`).join(', ')}`"
    />
  </div>
  <div class="">
    <div style="display: flex; width: 100%;">
      <q-input
        v-model="search"
        label="Поиск"
        dense
        clearable
        style="width: 100%;"
        @focus="this.isShowSearchResults = true"
        @blur="this.onBlur"
      >
        <template v-slot:append>
          <q-icon name="search"/>
        </template>
      </q-input>
      <q-btn
        v-if="!this.isShowHelper & !this.isMobile"
        icon="add"
        @click="this.showHelper"
        flat
        dense
        class="q-ml-auto"
      />
    </div>
    <q-list
      v-if="this.isShowSearchResults"
      class="shadow-2 rounded-borders scrollable-list-container"
      style="width: 100%; max-height: 400px;"
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
  </div>
  <q-layout
    container
    id="chatDialog"
    style="height: calc(100vh - 193px); background-color: #F0F0F0"
    class="shadow-2 rounded-borders"
  >
    <q-page-container>
      <q-page
        style="padding-top: 8px"
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
              :bg-color="message.comment ? 'blue-2' : message.sent ? '#e0e0e0' : 'white'"
              text-color="black"
              :class="message.deleted ? 'strikethrough' : ''"
              style="white-space: pre-wrap;"
              @click.right="this.invertContextMenu"
            >
<!--              :style="{ 'border-style': message.comment ? 'dashed' : 'unset', 'border-color': '#1976D2' }"-->
              <div
                v-if="this.getReplyMessageText(message)"
                class="flex"
              >
                <q-icon
                  name="reply"
                />
                {{ this.getReplyMessageText(message) }}
              </div>
              <div>
                <img
                  v-if="message.fileUuid && message.fileType.startsWith('image/')"
                  :src="`/files/images/${message.fileUuid}`"
                  style="width: 100%; max-width: 400px"
                  alt=""
                >
                <video
                  v-else-if="message.fileUuid && message.fileType.startsWith('video/')"
                  style="width: 100%; max-width: 400px"
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
                  style="width: 90%; max-width: 400px"
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
                <div
                  v-html="this.findLinks(message.text)"
                  style="max-width: 400px;"
                />
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
                      clickable
                    >
                      <q-item-section
                        @click="this.createNewTask(message)"
                        v-close-popup
                      >
                        Создать заявку из сообщения
                      </q-item-section>
                    </q-item>
                    <!-- <q-item-->
                    <!--   clickable-->
                    <!-- >-->
                    <!--   <q-item-section-->
                    <!--     v-close-popup-->
                    <!--   >-->
                    <!--     Найти в базе знаний TODO-->
                    <!--   </q-item-section>-->
                    <!-- </q-item>-->
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
                            v-for="task in this.tasks.filter(t => !t.completed)"
                            :key="task"
                            dense
                            clickable
                            @click="this.linkToTask(message, task)"
                            v-close-popup
                          >
                            <q-item-section>
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
      </q-page>
    </q-page-container>
  </q-layout>
  <div class="inputControl" style="margin-top: 8px">
    <q-card class="shadow-2" style="position: relative;">
      <div
        v-if="this.attachedFile || this.typing.filter(t => t.username !== this.currentUser.username).length > 0"
        style="
      display: block;
      position: absolute;
      bottom: 100%;
      left: 50%;
      transform: translateX(-50%);
      padding: 0 5px;
      color: white;
      font-size: 14px;
      z-index: 1000;
      margin-bottom: 5px;
      opacity: .6;
      max-width: 100%;
     ">
        <div style="display: flex; flex-direction: column; flex-wrap: nowrap">
          <div
            v-if="this.attachedFile"
            style="
            display: flex;
            flex-wrap: nowrap;
            align-items: center;
            background-color: #1976D2;
            border-radius: 5px;
            justify-content: center;
            padding-left: 10px"
            class="popupContent"
          >
            {{ this.shortenLine(this.attachedFile.name) }}
            <q-btn
              dense
              flat
              icon="delete"
              @click="this.attachedFile = null"
            />
          </div>
          <div
            style="
            background-color: #1976D2;
            border-radius: 5px;
            margin-top: 5px;
            text-align: center;
            padding-left: 10px;
            padding-right: 10px;"
            v-if="this.typing.filter(t => t.username !== this.currentUser.username).length > 0"
            v-text="this.getTypingUsers"
          />
        </div>
      </div>
      <div
        v-if="this.replyMessageId !== null"
        style="display: flex; justify-content: left; align-items: center; margin-left: 6px"
      >
        <q-icon
          name="reply"
        />
        {{ this.messages.find(m => m.id === this.replyMessageId).text }}
        <q-icon
          name="close"
          @click="this.replyMessageId = null"
        />
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
          style="border-color: #1875D0; border-style: unset"
          :value="this.inputField"
          :placeholder="`${isComment ? 'Текст комментария' : 'Текст сообщения'} (ctrl+enter отправить)\nВведите shortcut и нажмите tab чтобы выполнить авто-ввод`"
          class="bg-white"
          :style="'border-style: ' + (this.isComment ? 'dashed' : 'unset') + ';height: ' + (this.replyMessageId !== null ? '90%' : '')"
          @keydown.tab.prevent="handleTabPressed"
          @keydown="this.handleKeyPressed"
          @input="this.textChanged"
        />
        <div>
          <q-btn
            icon="send"
            @click="this.sendMessage"
            :loading="this.isSending"
            color="white"
            text-color="primary"
            dense
            push
            flat
            :ripple="false"
            style="margin-right: 5px"
            @mouseover="showTooltipSend = true"
            @mouseup="showTooltipSend = false"
          >
            <q-tooltip
              v-if="showTooltipSend"
            >
              ctrl+enter отправить
            </q-tooltip>
          </q-btn>
        </div>
        <div class="">
          <q-btn
            @click="this.switchToComment"
            dense
            flat
            icon="comment"
            :color="this.isComment ? 'primary' : 'grey'"
          />
        </div>
      </q-toolbar>
    </q-card>
  </div>
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
    'taskWatchingNow',
    'isShowHelper',
    'isMobile'
  ],

  data: () => ({
    isComment: false,
    text: '',
    isShowCustomContextMenu: true,
    rightClickCounter: 0,
    attachedFile: null,
    replyMessageId: null,
    search: '',
    searchResults: [],
    isShowSearchResults: false,
    showTooltipSend: false
  }),

  updated () {
    this.$emit('updated')
  },

  mounted () {
    if (this.isMobile) {
      document.getElementById('chatDialog').style.height = 'calc(-220px + 100vh)'
      document.getElementById('taskColumn').style.height = 'calc(-110px + 100vh);'
    }
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
          comment: this.isComment,
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
              axios.post(`/api/v1/client/${this.clientId}/message`, message)
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
          axios.post(`/api/v1/client/${this.clientId}/message`, message)
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
          const replaceValue = this.templates.find(e => e.shortcut === value.replace(':', '')).text
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
      const element = document.getElementById(id).children[0].children[0].children[1]
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' })
        const currentColor = element.style.backgroundColor
        element.style.backgroundColor = 'lightcoral'
        setTimeout(() => {
          element.style.backgroundColor = currentColor
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
        this.isShowSearchResults = true
      } else {
        this.searchResults = []
        this.isShowSearchResults = false
      }
    },

    goToMessage (messageId) {
      this.scrollToElementById(`message_${messageId}`)
    },

    onBlur () {
      setTimeout(() => {
        this.isShowSearchResults = false
      }, 100)
    },

    showHelper () {
      this.$emit('showHelper')
    },
    createNewTask (message) {
      const queryParams = new URLSearchParams(window.location.search)
      queryParams.set('newTaskFromMessage', message.id)
      this.$router.push({ path: this.$route.path, query: Object.fromEntries(queryParams.entries()) })
    },
    switchToComment () {
      this.isComment = !this.isComment
    },
    shortenLine (string) {
      if (string.length > 25) {
        return string.substring(0, 25) + '...'
      } else {
        return string
      }
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

.strikethrough {
  text-decoration: line-through;
}

.scrollable-list-container {
  max-height: 300px; /* Задайте нужную высоту */
  overflow-y: auto;
}
</style>
