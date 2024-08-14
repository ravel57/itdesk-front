<template>
  <div style="position: relative">
    <q-card
      class="search-container no-shadow"
      style="background-color: #F0F0F0"
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
          icon="support"
          @click="this.showHelper"
          flat
          dense
          class="q-ml-auto"
        />
      </div>
    </q-card>
    <q-list
      v-if="this.isShowSearchResults"
      class="search-results no-shadow rounded-borders scrollable-list-container"
      :style="(this.searchResults.length > 0) ? 'height: auto' : 'height: 0'"
      style="border-radius: 0 0 4px 4px;border-bottom: 1px solid #0000001f"
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
    <div
      v-if="this.nowWatching.length > 0"
      class="now-watching-cloud"
      style="opacity: 0.8;"
    >
      <div
        class="now-watching-text"
      >
        <q-icon
          color="white"
          name="visibility"
        >
          <q-tooltip>
            Сейчас смотрят
          </q-tooltip>
        </q-icon>
        {{ this.nowWatching }}
      </div>
    </div>
  </div>
  <q-layout
    container
    :id="this.isDialog ? 'chat-dialog-pop-up' : 'chat-dialog'"
    ref="chatDialog"
    :style="chatStyle"
    class="no-shadow"
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
                v-if="message.replyMessageId"
                class="flex cursor-pointer"
                @click="this.scrollToMessageAfterSearch(message.replyMessageId)"
              >
                <div
                  v-if="!message.replyUuid && !message.replyFileType"
                  style="height: 40px;width: 40px;display: flex;align-items: center;justify-content: center;"
                >
                  <q-icon
                    size="25px"
                    name="reply"
                  />
                </div>
                <div
                  v-else-if="message.replyFileType && message.replyFileType.startsWith('application/')"
                  style="height: 40px;width: 40px;display: flex;align-items: center;justify-content: center;"
                >
                  <q-icon
                    size="25px"
                    name="description"
                  />
                </div>
                <div
                  v-else-if="message.replyUuid && message.replyFileType.startsWith('image/')"
                >
                  <img
                    :src="`/files/images/${message.replyUuid}`"
                    style="width: 40px;height: 40px;border-radius: 4px;object-fit: cover;"
                    alt=""
                  >
                </div>
                <div
                  v-else-if="message.replyUuid && message.replyFileType.startsWith('video/')"
                >
                  <video
                    style="width: 40px;height: 40px;border-radius: 4px;object-fit: cover;"
                  >
                    <source
                      :src="`/files/videos/${message.replyUuid}`"
                      type="video/mp4"
                    >
                    Your browser does not support the video tag.
                  </video>
                </div>
                <div style="margin-left: 10px;display: flex; flex-direction: column;justify-content: center">
                  <div class="">От: {{ message.user ? message.user.lastname + ' ' + message.user.firstname : this.client.lastname + ' ' + this.client.username }}</div>
                  <div class="">{{ message.replyMessageText ? message.replyMessageText : (message.replyFileType.startsWith('image/') ? 'Изображение' : (message.replyFileType.startsWith('video/') ? 'Видео' : 'Файл')) }}</div>
                </div>
              </div>
              <div>
                <img
                  v-if="message.fileUuid && message.fileType.startsWith('image/')"
                  :src="`/files/images/${message.fileUuid}`"
                  :style="getMediaMessageSize(message)"
                  style="cursor: pointer;border-radius: 4px"
                  @click="this.openPhoto(message)"
                  alt=""
                >
                <video
                  v-else-if="message.fileUuid && message.fileType.startsWith('video/')"
                  style="max-width: 400px;"
                  :style="getMediaMessageSize(message)"
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
                  v-if="message.text"
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
                  v-if="message.text"
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
                    Привязать к заявке
                  </q-item-section>
                  <q-item-section side>
                    <q-icon name="keyboard_arrow_right"/>
                  </q-item-section>
                  <q-menu anchor="top end" self="top start">
                    <q-list>
                      <q-item
                        v-for="task in this.tasks.filter(t => !t.completed)"
                        :key="task.id"
                        dense
                        clickable
                        @click="this.linkToTask(message, task)"
                        v-close-popup
                        v-once
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
        v-if="this.replyMessageId !== null"
        class="no-shadow"
        style="width: 100%;height: 50px;display: flex;flex-direction: row;border-radius: 0;border-top: 1px solid #0000001f"
      >
        <div ref="replyContainer" style="display: flex;width: 100%;max-height: 50px;align-items: center">
          <div style="height: 50px;width: 50px;display: flex;justify-content: center;align-items: center;margin-left: 5px;margin-right: 10px">
            <img
              v-if="this.getReplayed.fileUuid && this.getReplayed.fileType.startsWith('image/')"
              :src="`/files/images/${this.getReplayed.fileUuid}`"
              alt="reply-img"
              style="width: 40px;height: 40px;border-radius: 4px;object-fit: cover;"
            >
            <video
              v-else-if="this.getReplayed.fileUuid && this.getReplayed.fileType.startsWith('video/')"
              style="width: 40px;height: 40px;border-radius: 4px;object-fit: cover;"
            >
              <source
                :src="`/files/videos/${this.getReplayed.fileUuid}`"
                type="video/mp4"
              >
              Your browser does not support the video tag.
            </video>
            <q-icon
              v-else
              size="20px"
              name="reply"
            />
          </div>
          <div style="width: 100%">
            <div class="">
              В ответ на {{ this.getMessageSender }}
            </div>
            <div class="truncate">
              {{ this.getReplyMessage(this.getReplayed) }}
            </div>
          </div>
          <q-icon
            size="20px"
            style="height: 50px;width: 50px;cursor: pointer"
            name="close"
            @click="this.replyMessageId = null"
          />
        </div>
      </q-card>
      <q-card
        class="input-item no-shadow"
        style="border-bottom: 1px solid #0000001f;"
        :style="'background-color: ' +  (this.isComment ? '#d1c4e9;' : '') + 'border-top: ' + (this.replyMessageId ? '' : '1px solid #0000001f;')"
      >
        <q-btn
          v-if="this.scrollToBottomKey"
          class="shadow-1"
          icon="keyboard_double_arrow_down"
          :style="this.replyMessageId !== null ? 'bottom: 210%;' : 'bottom: 100%;'"
          style="
            width: 36px;
            height: 36px;
            position: absolute;
            z-index: 1;
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
          :style="this.replyMessageId !== null ? 'bottom: 210%;' : 'bottom: 100%;'"
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
          </div>
        </div>
        <q-btn
          style="margin-bottom: 6px"
          id="choose-file-btn"
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
            id="send-message-btn"
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
            id="comment-mode-btn"
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
    <q-card style="overflow: hidden;" :style="this.isMobile ? 'max-height: 60vh; max-width: 90vw;' : 'max-height: 90vh; max-width: 80vw;'">
      <div style="overflow-x: auto">
        <img
          :style="this.getScaledImageStyle()"
          :src="`/files/images/${this.selectedPhoto.fileUuid}`"
          alt="">
      </div>
    </q-card>
  </q-dialog>
</template>

<script>
import { useStore } from 'stores/store'
import axios from 'axios'
import { useResizeObserver } from '@vueuse/core'
import { onMounted, ref } from 'vue'

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
    requestPending: false,
    isShowMaxSizePhoto: false,
    selectedPhoto: '',
    scrollToBottomKey: false,

    chatWindowWidth: 500,

    replyFileUuid: null,
    replyFileType: null
  }),

  updated () {
    setTimeout(() => { this.$emit('updated') }, 150)
  },

  mounted () {
    try {
      if (!this.isDialog) {
        this.scrollToBottom()
      } else {
        setTimeout(() => {
          const scrollArea = document.querySelector('#chat-dialog-pop-up > div > div')
          scrollArea.scrollTo(0, scrollArea.scrollHeight)
        }, 0)
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
        const scrollArea = document.querySelector('#chat-dialog > div > div')
        scrollArea.scrollTo(0, scrollArea.scrollHeight)
      }, timeout)
    },

    smoothScrollToBottom () {
      const scrollArea = document.querySelector('#chat-dialog > div > div')
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
          replyUuid: this.replyFileUuid,
          replyFileType: this.replyFileType,
          user: this.currentUser
        }
        this.$emit('sendMessage', { message, attachedFile: this.attachedFile, clientId: this.client.id })
        this.attachedFile = null
        this.replyMessageId = null
        this.replyFileType = null
        this.replyFileUuid = null
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
        try {
          const matches = this.$refs.textInput.value.match(/:([^\\x00-\\7F]*)/)
          const value = matches[0].trim()
          if (event.keyCode === 9 /* tab */ && value.startsWith(':')) {
            event.preventDefault()
            const replaceValue = this.templates.find(e => e.shortcut === value.replace(':', '')).text
            this.$refs.textInput.value = this.$refs.textInput.value.replace(value, replaceValue)
          }
          this.textChanged()
        } catch (ignoredError) {}
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
      const el = document.querySelector(`#${id} > div > div:last-child`)
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
      this.replyFileUuid = message.fileUuid
      this.replyFileType = message.fileType
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

    shortenLine (string, offset = 25) {
      if (string.length > 25) {
        return string.substring(0, 25) + '...'
      } else {
        return string
      }
    },

    getReplyMessage (message) {
      if (message.text) {
        return this.shortenLine(message.text, 50)
      } else {
        if (message.fileType.startsWith('video/')) {
          return 'Видео'
        } else if (message.fileType.startsWith('image/')) {
          return 'Изображение'
        } else if (message.fileType.startsWith('audio/')) {
          return 'Аудио'
        } else {
          return 'Файл'
        }
      }
    },

    autoResize () {
      this.$nextTick(() => {
        let replyContainer = 0
        let chat = document.getElementById('chat-dialog')
        if (this.isDialog) {
          chat = document.getElementById('chat-dialog-pop-up')
        }
        if (this.$refs.replyContainer) {
          replyContainer = this.$refs.replyContainer.offsetHeight
        }
        const textarea = this.$refs.textInput
        textarea.style.height = 'auto'
        textarea.style.height = textarea.scrollHeight + 'px'
        chat.style.height = this.chatStyle.height
        chat.style.height = textarea.offsetHeight + replyContainer > 46 ? `calc(${this.chatStyle.height} - ${textarea.offsetHeight + (replyContainer !== 0 ? replyContainer + 1 : replyContainer) - 46 + 'px'})` : this.chatStyle.height
        this.textareaHeight = textarea.style.height
      })
    },

    getPortionMessages () {
      let scrollZone = null
      const chatDialog = document.getElementById('chat-dialog')
      const chatPopUp = document.getElementById('chat-dialog-pop-up')
      if (chatDialog) {
        scrollZone = chatDialog.children[0].children[0]
      } else {
        scrollZone = chatPopUp.children[0].children[0]
      }

      this.scrollToBottomKey = (scrollZone.scrollHeight - scrollZone.clientHeight) - scrollZone.scrollTop >= 600

      if ((scrollZone.scrollTop / (scrollZone.scrollHeight - scrollZone.clientHeight)) * 100 <= 3 && !this.requestPending && !this.isEnd) {
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
    },

    getScaledImageStyle () {
      const maxWidth = this.isMobile ? window.innerWidth * 0.9 : window.innerWidth * 0.8
      const maxHeight = this.isMobile ? window.innerHeight * 0.6 : window.innerHeight * 0.9

      let imgWidth = this.selectedPhoto.fileWidth
      let imgHeight = this.selectedPhoto.fileHeight

      const aspectRatio = imgWidth / imgHeight

      if (imgWidth > maxWidth || imgHeight > maxHeight) {
        if (imgWidth / maxWidth > imgHeight / maxHeight) {
          imgWidth = maxWidth
          imgHeight = maxWidth / aspectRatio
        } else {
          imgHeight = maxHeight
          imgWidth = maxHeight * aspectRatio
        }
      }

      return `height: ${imgHeight}px; width: ${imgWidth}px;`
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
        height: this.isDialog ? 'calc(100% - 90px)' : (this.isMobile ? 'calc(100vh - 178px)' : 'calc(100vh - 93px)'),
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

    getReplayed () {
      return this.messages.find(m => m.id === this.replyMessageId)
    },

    getMessageSender () {
      if (this.getReplayed.user) {
        return this.getReplayed.user.lastname + ' ' + this.getReplayed.user.firstname
      } else {
        return this.client.lastname + ' ' + this.client.firstname
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
    },

    replyMessageId () {
      this.autoResize()
    }
  },

  setup (props) {
    const store = useStore()
    const chatDialog = ref(null)
    const containerWidth = ref('')
    const containerHeight = ref('')

    const getMediaMessageSize = (message) => {
      let fileHeight, fileWidth

      if (message.fileHeight && message.fileWidth) {
        fileHeight = message.fileHeight
        fileWidth = message.fileWidth
      } else {
        fileHeight = props.isMobile ? 200 : 400
        fileWidth = props.isMobile ? 200 : 400
      }

      const newMaxWidth = containerWidth.value * 60 / 100
      const newMaxHeight = newMaxWidth
      let newWidth = fileWidth
      let newHeight = fileHeight

      const aspectRatio = fileWidth / fileHeight

      if (fileWidth <= newMaxWidth && fileHeight <= newMaxHeight) {
        newWidth = fileWidth
        newHeight = fileHeight
      } else {
        if (newWidth / newMaxWidth > newHeight / newMaxHeight) {
          newWidth = newMaxWidth
          newHeight = newMaxWidth / aspectRatio
        } else {
          newHeight = newMaxHeight
          newWidth = newMaxHeight * aspectRatio
        }
      }

      return `min-width: 200px; max-width: ${newMaxWidth}px; height: ${newHeight}px; width: ${newWidth}px;object-fit: cover;`
    }

    onMounted(() => {
      useResizeObserver(chatDialog, (entries) => {
        const entry = entries[0]
        const { width, height } = entry.contentRect
        containerHeight.value = height
        containerWidth.value = width
      })
    })

    return {
      store,
      chatDialog,
      getMediaMessageSize
    }
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
  max-width: 240px;
  background: #5C35F9;
  border-radius: 5px;
}

.now-watching-text {
  display: block;
  white-space: nowrap;
  width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  user-select: none;
}

.action-clouds {
  display: block;
  position: absolute;
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
  border-radius: 0;
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

.truncate {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

</style>
