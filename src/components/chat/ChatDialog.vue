<template>
  <div
    v-if="this.nowWatching.length > 0"
    class="now-watching-cloud"
    :style="this.nowWatchingStyle"
  >
    <div
      class="now-watching-text"
      v-text="`Сейчас смотрят: ${this.nowWatching}`"
    />
  </div>
  <div style="position: relative">
    <q-card
      class="search-container"
    >
      <div class="search">
        <q-input
          v-model="search"
          label="Поиск по сообщениям"
          dense
          clearable
          style="width: 100%;padding: 0 8px 5px;"
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
    </q-card>
    <q-list
      v-if="this.isShowSearchResults"
      class="search-results shadow-2 rounded-borders scrollable-list-container"
      :style="(this.searchResults.length > 0) ? 'height: auto' : 'height: 0'"
      bordered
    >
      <q-item
        v-for="message in searchResults"
        :key="message.id"
        style="background-color: white"
        clickable
      >
        <q-item-section
          @click="scrollToMessageAfterSearch(message.id)"
          style="width: 100%; background-color: white"
        >
          {{ this.getSearchTitle(message) }}
        </q-item-section>
      </q-item>
    </q-list>
  </div>
  <q-layout
    container
    :id="this.isDialog ? 'chat-dialog-pop-up' : 'chat-dialog'"
    ref="chatDialog"
    :style="chatStyle"
    class="shadow-2"
    @scroll="this.getPortionMessages()"
  >
    <q-page-container>
      <q-page
        style="padding-top: 8px;min-height: 0"
        :ref="this.isDialog ? 'chatPopUp' : 'chat'"
        :id="this.isDialog ? 'chatPopUp' : 'chat'"
      >
        <div class="q-pa-md row justify-center q-gutter-md">
          <div
            v-for="message in this.messages"
            :key="message.id"
            style="position: relative;width: 100%; margin-top: 0"
            @click.right="this.invertContextMenu"
          >
            <!--<q-chat-message v-if="this.isDateChanged(message)" :label="this.getDate(message)"/>-->
            <q-chat-message
              :id="`message_${message.id}`"
              :avatar="message.avatar"
              :name="this.getName(message)"
              :sent="message.sent"
              text-color="black"
              :class="message.deleted ? 'strikethrough' : ''"
              style="white-space: pre-wrap;"
              :bg-color="message.comment ? 'deep-purple-2' : message.sent ? '#e0e0e0' : 'white'"
            >
              <template v-slot:stamp>
              <span
                v-text="this.getStamp(message)"
              />
                <q-icon
                  v-if="message.linkedTaskId"
                  style="margin-left: 8px"
                  name="link"
                />
              </template>
              <div
                v-if="message.replyMessageText"
                class="flex cursor-pointer"
                @click="this.scrollToMessageAfterSearch(message.replyMessageId)"
              >
                <q-icon
                  name="reply"
                />
                {{ message.replyMessageText }}
              </div>
              <div>
                <img
                  v-if="message.fileUuid && message.fileType.startsWith('image/')"
                  :src="`/files/images/${message.fileUuid}`"
                  :style="this.getMediaMessageSize(message)"
                  style="cursor: pointer"
                  @click="this.openPhoto(message)"
                  alt=""
                >
                <video
                  v-else-if="message.fileUuid && message.fileType.startsWith('video/')"
                  style="max-width: 400px;"
                  :style="this.isMobile ? 'height: 200px;width: 200px' : 'height: 400px;width: 400px'"
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
                  style="min-width: 300px; width: 90%; max-width: 400px"
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
              </div>
            </q-chat-message>
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
                    @click="this.setReplyMessage(message)"
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
                  v-if="this.tasks.filter(t => !t.completed).length > 0"
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
        </div>
      </q-page>
    </q-page-container>
  </q-layout>
  <q-page
    position="bottom"
    class="input-container"
    expand
  >
    <div
      v-if="['ADMIN', 'OPERATOR', 'CLIENT'].includes(this.store.currentUser.authorities[0])"
      style="width: 100%;"
    >
      <q-card
        class="input-item"
        :style="'background-color: ' +  (this.isComment ? '#d1c4e9' : '')"
      >
        <q-btn
          v-if="this.scrollToBottomKey"
          class="shadow-1"
          icon="keyboard_double_arrow_down"
          style="
            width: 36px;
            height: 36px;
            position: absolute;
            z-index: 1;
            bottom: 100%;
            right: 5px;
            opacity: 0.5;
            background-color: white;
            border-radius: 4px;
            margin-bottom: 5px;
          "
          @click="this.smoothScrollToBottom"
        />
        <div
          v-if="this.attachedFile || this.typing.filter(t => t.username !== this.currentUser.username).length > 0 || this.replyMessageId !== null"
          class="action-clouds"
        >
          <div class="input-clouds-container">
            <div
              v-if="this.attachedFile"
              class="attach-file-text"
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
              class="typing-users-cloud"
              v-if="this.typing.filter(t => t.username !== this.currentUser.username).length > 0"
              v-text="this.getTypingUsers"
            />
            <div
              class="reply-message-cloud"
              v-if="this.replyMessageId !== null"
            >
              <q-icon
                style="margin-right: 2px"
                name="reply"
              />
              В ответ на: {{ this.getReplyMessage(this.messages.find(m => m.id === this.replyMessageId)) }}
              <q-icon
                style="margin-right: 2px"
                name="close"
                @click="this.replyMessageId = null"
              />
            </div>
          </div>
        </div>
        <q-btn
          style="margin-bottom: 6px"
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
          :value="this.inputField"
          :placeholder="this.renderShortcutPlaceholder"
          :style="textareaStyle"
          @keydown.tab.prevent="handleTabPressed"
          @keydown="this.handleKeyPressed"
          @input="this.textChanged"
        />
        <div>
          <q-btn
            v-if="this.inputField.length > 0 || this.attachedFile"
            icon="send"
            @click="this.sendMessage"
            :loading="this.isSending"
            color="white"
            text-color="primary"
            dense
            push
            flat
            :ripple="false"
            style="margin-right: 5px; margin-bottom: 6px"
          >
            <q-tooltip>
              ctrl+enter отправить
            </q-tooltip>
          </q-btn>
        </div>
        <div
          v-if="this.comments"
        >
          <q-btn
            style="margin-bottom: 6px"
            @click="this.switchToComment"
            dense
            flat
            icon="comment"
            :color="this.isComment ? 'primary' : 'grey'"
          >
            <q-tooltip>
              Режим комментария: Сообщение увидят только операторы
            </q-tooltip>
          </q-btn>
        </div>
      </q-card>
    </div>
  </q-page>
  <q-dialog v-model="this.isShowMaxSizePhoto">
    <q-card :style="this.isMobile ? 'max-height: 60vh; max-width: 90vw' : 'max-height: 90vh; max-width: 80vw'">
      <div style="overflow-x: auto">
        <img
          :style="`height: ${this.selectedPhoto.fileHeight}px; width: ${this.selectedPhoto.fileWidth}px`"
          :src="`/files/images/${this.selectedPhoto.fileUuid}`"
          alt="">
      </div>
    </q-card>
  </q-dialog>
</template>

<script>
import { useStore } from 'stores/store'
import axios from 'axios'

export default {
  name: 'ChatDialog',
  props: {
    messages: { type: Array },
    inputField: { type: String },
    templates: { type: Array },
    isSending: { type: Boolean },
    typing: { default: () => [], type: Array },
    currentUser: { type: Object },
    linkedMessageId: { type: Number },
    tasks: { type: Array },
    taskWatchingNow: { default: () => [], type: Array },
    isShowHelper: { type: Boolean },
    isMobile: { type: Boolean },
    isDialog: { default: false, type: Boolean },
    client: { type: Object },
    isEnd: { type: Boolean },
    comments: { default: true, type: Boolean }
  },

  data: () => ({
    textareaHeight: 'auto',
    isComment: false,
    text: '',
    isShowCustomContextMenu: true,
    rightClickCounter: 0,
    attachedFile: null,
    replyMessageId: null,
    search: '',
    searchResults: [],
    isShowSearchResults: false,
    pageCounter: 2,
    requestPending: false,
    isShowMaxSizePhoto: false,
    selectedPhoto: '',
    scrollToBottomKey: false
  }),

  updated () {
    setTimeout(() => { this.$emit('updated') }, 150)
  },

  mounted () {
    try {
      if (!this.isDialog) {
        this.scrollToBottom(50)
      }
      this.$refs.textInput.focus()
    } catch (ignoredError) {
    }
  },

  methods: {
    copyToClipboard (text) {
      navigator.clipboard.writeText(text)
    },

    pastToInputField (text) {
      this.$emit('pastToInputField', text)
    },

    scrollToBottom (timeout = 0) {
      setTimeout(() => {
        const scrollArea = document.getElementById('chat-dialog').children[0].children[0]
        scrollArea.scrollTo(0, document.getElementById('chat-dialog').children[0].children[0].scrollHeight)
      }, timeout)
    },

    smoothScrollToBottom () {
      const scrollArea = document.getElementById('chat-dialog').children[0].children[0]
      scrollArea.scrollTo({ top: scrollArea.scrollHeight, left: 0, behavior: 'smooth' })
    },

    sendMessage () {
      const textarea = this.$refs.textInput
      if (textarea.value || this.attachedFile) {
        this.$emit('isSending', true)
        const message = {
          id: null,
          text: textarea.value,
          date: new Date(),
          sent: true,
          comment: this.isComment,
          read: true,
          replyMessageId: this.replyMessageId,
          user: this.currentUser
        }
        this.$emit('sendMessage', { message, attachedFile: this.attachedFile, clientId: this.client.id })
        this.attachedFile = null
        this.replyMessageId = null
      }
      this.$nextTick(() => {
        const textarea = this.$refs.textInput
        textarea.style.height = '46px'
        let chat = document.getElementById('chat-dialog')
        if (this.isDialog) {
          chat = document.getElementById('chat-dialog-pop-up')
        }
        chat.style.height = this.chatStyle.height
      })
      this.scrollToBottom(500)
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
      this.autoResize()
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
      const el = document.getElementById(id).children[0].children[0]
      const element = el.children[el.children.length - 1]
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

    scrollToMessageAfterSearch (messageId) {
      if (this.messages.filter(m => m.id === messageId).length > 0) {
        this.goToMessage(messageId)
      } else {
        this.$emit('scrollToMessageAfterSearch', messageId)
        setTimeout(() => { this.goToMessage(messageId) }, 300)
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
        }, 500)
      }
      this.rightClickCounter++
    },

    setReplyMessage (message) {
      this.replyMessageId = message.id
    },

    onSearch () {
      if (this.search) {
        axios.post(`/api/v1/client/${this.client.id}/search-messages`, { text: this.search })
          .then(response => {
            this.searchResults = response.data
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
        this.isShowSearchResults = true
      } else {
        this.searchResults = []
        setTimeout(() => {
          this.isShowSearchResults = false
        }, 300)
      }
    },

    goToMessage (messageId) {
      this.scrollToElementById(`message_${messageId}`)
    },

    onBlur () {
      setTimeout(() => {
        this.isShowSearchResults = false
      }, 300)
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
      return string.substring(0, 25) + '...'
    },

    getReplyMessage (message) {
      if (message.text) {
        return this.shortenLine(message.text)
      } else {
        if (message.fileType.startsWith('video/')) {
          return 'Видео'
        } else if (message.fileType.startsWith('image/')) {
          return 'Изображение'
        } else if (message.fileType.startsWith('audio/')) {
          return 'Аудио'
        }
      }
    },

    autoResize () {
      this.$nextTick(() => {
        let chat = document.getElementById('chat-dialog')
        if (this.isDialog) {
          chat = document.getElementById('chat-dialog-pop-up')
        }
        const textarea = this.$refs.textInput
        textarea.style.height = 'auto'
        textarea.style.height = textarea.scrollHeight + 'px'
        chat.style.height = this.chatStyle.height
        chat.style.height = textarea.offsetHeight > 46 ? `calc(${this.chatStyle.height} - ${textarea.offsetHeight - 46 + 'px'})` : this.chatStyle.height
        this.textareaHeight = textarea.style.height
      })
    },

    getMediaMessageSize (message) {
      const maxWidth = this.isMobile ? 200 : 400
      let newHeight = message.fileHeight
      if (message.fileHeight > maxWidth) {
        newHeight = (maxWidth * message.fileHeight) / message.fileWidth
      }
      return `max-width: ${maxWidth}px; height: ${newHeight}px; width: ${message.fileWidth}px`
    },

    getPortionMessages () {
      const scrollZone = document.getElementById('chat-dialog').children[0].children[0]

      this.scrollToBottomKey = (scrollZone.scrollHeight - scrollZone.clientHeight) - scrollZone.scrollTop >= 600

      if ((scrollZone.scrollTop / (scrollZone.scrollHeight - scrollZone.clientHeight)) * 100 === 0 && !this.requestPending && !this.isEnd) {
        this.requestPending = true
        const previousScrollHeight = scrollZone.scrollHeight
        const previousScrollTop = scrollZone.scrollTop
        this.$emit('getMessagePage', 1)
        setTimeout(() => {
          this.requestPending = false
          const newScrollHeight = scrollZone.scrollHeight
          const addedHeight = newScrollHeight - previousScrollHeight
          scrollZone.scrollTop = previousScrollTop + addedHeight
        }, 200)
      }
    },

    getSearchTitle (message) {
      if (this.getName(message) !== '') {
        return `${this.getName(message)} : ${message.text}`
      } else {
        const lastname = this.client.lastname
        const firstname = this.client.firstname
        return `${lastname !== null ? lastname : ''} ${firstname !== null ? firstname : ''} : ${message.text}`
      }
    },

    openPhoto (photo) {
      this.isShowMaxSizePhoto = true
      this.selectedPhoto = photo
    }
  },

  computed: {
    getTypingUsers () {
      const filter = this.typing.filter(t => t.username !== this.currentUser.username)
      const s = filter.length > 1 ? ' печатают...' : ' печатает...'
      return filter.map(t => `${t.firstname} ${t.lastname}`).join(', ') + s
    },

    renderShortcutPlaceholder () {
      return `${this.isComment ? 'Текст комментария' : 'Текст сообщения'} ${this.isMobile || this.isDialog ? '' : '\nВведите shortcut и нажмите tab чтобы выполнить авто-ввод'}`
    },

    chatStyle () {
      return {
        height: this.isDialog ? '84.5%' : (this.isMobile ? '75vh' : 'calc(100vh - 107px)'),
        'border-radius': '0',
        'min-height': '0',
        'background-color': '#F0F0F0'
      }
    },

    textareaStyle () {
      return {
        borderStyle: 'unset',
        margin: '0 8px',
        width: '100%',
        overflow: 'hidden',
        resize: 'none',
        height: this.textareaHeight + 'px',
        'max-height': this.isDialog ? '300px' : '400px',
        transition: 'height 0.2s ease',
        backgroundColor: this.isComment ? '#d1c4e9' : ''
      }
    },

    nowWatching () {
      return this.taskWatchingNow.filter(user => user.id !== this.currentUser.id).map(user => `${user.firstname} ${user.lastname}`).join(', ')
    },

    nowWatchingStyle () {
      return {
        opacity: '0.4',
        left: this.isMobile ? '50%' : (!this.isShowHelper ? '35%' : '23%'),
        top: this.isMobile ? '9%' : '7%'
      }
    }
  },

  watch: {
    linkedMessageId () {
      if (this.linkedMessageId) {
        this.scrollToElementById(`message_${this.linkedMessageId}`)
      }
    },

    search (newVal) {
      this.onSearch(newVal)
    },

    messages: {
      immediate: true,
      handler (newVal, oldVal) {
        try {
          if (document.getElementById('chat-dialog').children[0].children[0]) {
            const scrollZone = document.getElementById('chat-dialog').children[0].children[0]
            if ((scrollZone.scrollTop / (scrollZone.scrollHeight - scrollZone.clientHeight)) * 100 >= 90) {
              this.scrollToBottom(0)
            }
          }
        } catch (ignoreError) {}
      },
      deep: true
    }
  },

  setup () {
    const store = useStore()
    return { store }
  }

}
</script>

<style scoped>

.now-watching-cloud {
  display: block;
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  padding: 0 5px;
  font-size: 14px;
  z-index: 1000;
  color: white;
  max-width: 100%;
  background: #5C35F9;
  border-radius: 5px;
}

.now-watching-text {
  display: flex;
  flex-wrap: nowrap;
  flex-direction: row
}

.action-clouds {
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
}

.attach-file-text {
  height: 26px;
  border-style: solid;
  border-width: 1px;
  background-color: white;
  color: black !important;
  display: flex;
  flex-wrap: nowrap;
  align-items: center;
  border-radius: 4px;
  justify-content: center;
  padding-left: 10px
}

.typing-users-cloud {
  border-style: solid;
  border-width: 1px;
  background-color: white;
  color: black !important;
  border-radius: 4px;
  margin-top: 5px;
  text-align: center;
  padding-left: 10px;
  padding-right: 10px;
}

.reply-message-cloud {
  border-style: solid;
  border-width: 1px;
  background-color: white;
  color: black !important;
  display: flex;
  flex-direction: row;
  align-items: center;
  border-radius: 4px;
  margin-top: 5px;
  text-align: center;
  padding-left: 10px;
  padding-right: 10px;
  font-size: 16px;
}

textarea {
  border-style: unset;
  margin: 0 8px;
  width: 100%;
  resize: none;
  transition: height 0.2s ease;
}

textarea:focus {
  outline: none;
}

.search-container {
  border-bottom-left-radius: 0;
  border-bottom-right-radius: 0;
  z-index: 0
}

.search {
  display: flex;
  width: 100%;
}

.search-results {
  position: absolute;
  width: 100%;z-index: 10;
  background-color: white;
  max-height: 400px;
  overflow-y: auto;
}

.input-container {
  margin-bottom: 8px;
  max-height: 400px;
  min-height: 0 !important;
  width: 100%;
}

.input-item {
  position: relative;
  display: flex;
  width: 100%;
  flex-direction: row;
  flex-wrap: nowrap;
  align-items: end;
  border-radius: 0;
  border-bottom-left-radius: 5px;
  border-bottom-right-radius: 5px;
}

.input-clouds-container {
  display: flex;
  flex-direction: column;
  flex-wrap: nowrap
}

.strikethrough {
  text-decoration: line-through;
}

.scrollable-list-container {
  max-height: 300px;
  height: 70px;
  overflow-y: auto;
}

</style>
