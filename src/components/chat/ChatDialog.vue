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
          borderless
          clearable
          style="width: 100%;padding: 8px 4px 0 4px;"
          @focus="this.isShowSearchResults = true"
          @blur="this.onBlur"
        >
          <template v-slot:prepend>
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
      style="border-radius: 0 0 4px 4px;border-bottom: 1px solid #0000001f;"
    >
      <q-item
        v-for="message in searchResults"
        dense
        :key="message.id"
        style="background-color: white"
        clickable
      >
        <q-item-section
          @click="scrollToMessageAfterSearch(message.id)"
          class="justify-between"
          style="width: 100%; background-color: white;display: flex;align-items: center;flex-direction: row"
        >
          <div style="display: flex;align-items: center;flex-direction: row;">
            <svg v-if="this.getName(message) !== ''" style="margin-right: 8px" width="20" height="20" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M0.432193 13.8757L0.431791 13.8559C0.437263 12.5425 0.362052 10.9444 0.51429 9.66617C1.06099 5.07597 4.92198 1.43399 9.45856 0.824872C10.0584 0.744332 10.6484 0.734517 11.2522 0.727173C12.3729 0.765053 13.548 0.731395 14.6729 0.731472C15.1618 0.731511 15.6521 0.720803 16.1402 0.754104C21.141 1.09531 25.3184 5.12436 25.7314 10.1578C25.8281 11.336 25.7552 12.6767 25.7802 13.8774C25.4588 13.8779 25.1373 13.8802 24.816 13.878C23.6035 13.8695 23.7398 14.187 23.6417 15.1379C23.4215 17.2716 21.7225 19.0301 19.5986 19.2937C16.8784 19.6314 14.6321 17.7307 14.2997 15.0622C14.1904 14.3026 13.7317 14.331 13.088 14.3284C12.8906 14.3276 12.6797 14.314 12.4843 14.3404L12.4599 14.344C11.8538 14.4297 11.902 15.1759 11.8179 15.6173C11.6462 16.5188 11.1154 17.4321 10.4586 18.0691C8.6007 19.8706 5.50491 19.7156 3.77619 17.8344C2.88113 16.8603 2.5745 15.8253 2.51764 14.5544C2.49943 14.1473 2.29021 13.9334 1.86357 13.8928C1.39407 13.848 0.903897 13.8781 0.432193 13.8757ZM10.4889 2.59808C10.0687 2.62214 9.65763 2.65184 9.24287 2.7282C5.65091 3.38958 2.67168 6.45736 2.30341 10.1203C2.24564 10.695 2.26972 11.2677 2.26031 11.8437C2.46677 11.8715 2.67354 11.8647 2.88131 11.8648C6.11031 11.8677 9.33938 11.8658 12.5684 11.8651C13.5999 11.8648 14.6353 11.8838 15.6664 11.8617L23.9181 11.8683C23.8932 11.2614 23.9378 10.6511 23.8734 10.0459C23.4533 6.10394 20.1418 2.9601 16.2125 2.62219C15.8112 2.58767 15.414 2.58956 15.0117 2.58928C13.5372 2.58826 11.9722 2.53594 10.5044 2.59741L10.4889 2.59808Z" fill="#5C35F9"/>
              <path d="M3.28256 20.9081C3.25071 20.9952 3.24359 21.0725 3.25285 21.1649C3.35083 22.1429 4.28927 22.7426 5.21264 22.7422C6.33634 22.7418 7.38908 21.9149 8.16315 21.1642C8.94619 20.4048 9.6329 19.521 10.7899 19.4021C11.7216 19.3352 12.535 19.7171 13.0983 20.4742C13.8216 19.5609 14.8809 19.1131 16.0314 19.5488C17.0697 19.942 17.7451 21.0013 18.593 21.6765C19.3357 22.2678 20.3057 22.8524 21.2961 22.7329C22.2772 22.6145 22.9066 21.9226 22.9402 20.9309C23.5593 21.316 23.4454 22.2953 23.2011 22.8673C22.8143 23.7731 21.9196 24.3741 21.0332 24.7231C19.2485 25.4256 16.6283 25.4431 14.8396 24.6671C14.0788 24.3285 13.5003 23.7834 13.0739 23.0728C12.586 24.1746 11.4709 24.743 10.3497 25.0053C8.2852 25.4884 5.0117 25.328 3.53295 23.6711C2.8457 22.9011 2.39219 21.6978 3.28256 20.9081Z" fill="#5C35F9"/>
            </svg>
            <div
              v-else
              style="width: 20px;height: 20px;border-radius: 100%;display: flex;justify-content: center;align-items: center;color: white;font-size: 10px;margin-right: 8px"
              :style="'background-color: ' + nameToPastelHex(`${this.client.lastname} ${this.client.firstname}`) + ';'"
            >
              {{ this.getAbbreviation(this.client) }}
            </div>
            <div class="truncate">
              {{ message.text }}
            </div>
          </div>
          <div class="">
            {{ this.getTimeLastMessage(message)}}
          </div>
        </q-item-section>
      </q-item>
    </q-list>
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
              :id="`${this.isDialog ? 'modal_message' : 'message'}_${message.id}`"
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
                  style="height: 40px; width: 40px; display: flex; align-items: center; justify-content: center;"
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
                    style="width: 40px; height: 40px; border-radius: 4px; object-fit: cover;"
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
          v-if="this.attachedFiles.length > 0 ||
          this.typing.filter(t => t.username !== this.currentUser.username).length > 0 ||
          this.replyMessageId !== null ||
          this.taskWatchingNow.filter(user => user.id !== this.currentUser.id).length > 0"
          :style="this.replyMessageId !== null ? 'bottom: 210%;' : 'bottom: 100%;'"
          class="action-clouds"
        >
          <div class="input-clouds-container">
            <div style="width: 100%;display: flex;justify-content: center">
              <div
                class="typing-users-cloud"
                v-if="this.typing.filter(t => t.username !== this.currentUser.username).length > 0 ||
                this.taskWatchingNow.filter(user => user.id !== this.currentUser.id).length > 0
                "
              >
                <div
                  v-if="this.watchUsers.length > 0"
                  style="margin-right: 8px"
                >
                  <q-icon name="visibility"/>
                  {{ this.watchUsers.join(', ') }}
                </div>
                <div v-if="typingUsers.length > 0">
                  <q-icon name="border_color"/>
                  {{ typingUsers.join(', ') }} {{ typingUsers.length > 1 ? ' печатают...' : ' печатает...' }}
                </div>
              </div>
            </div>
            <div
              v-if="this.attachedFiles.length > 2"
              class="attach-file-card"
              style="cursor: pointer;"
              @click="this.showListPinedFiles = true"
            >
              Еще {{ this.attachedFiles.length - 2 }} файла...
            </div>
            <div
              v-for="(file, index) in this.attachedFiles"
              :key="index"
            >
              <div
                v-if="index <= 1"
                class="attach-file-card"
              >
                <div class="attach-file-format">
                  {{ file.name.split('.')[file.name.split('.').length - 1].toUpperCase() }}
                </div>
                <div class="truncate">{{ file.name.split('.')[0] }}</div>
                <q-space/>
                <q-btn
                  flat
                  round
                  style="color: gray"
                  dense
                  icon="delete"
                  @click="this.attachedFiles.splice(index, 1)"
                />
              </div>
            </div>
          </div>
        </div>
        <q-btn
          style="margin-bottom: 6px"
          id="choose-file-btn"
          type="file"
          @click="showListPinedFiles = true"
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
            v-if="this.inputField.length > 0 || this.attachedFiles.length > 0"
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
            <q-tooltip
              v-if="!this.isMobile"
            >
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
  <q-dialog backdrop-filter="blur(4px)" v-model="this.showListPinedFiles">
    <q-card class="dialog-width">
      <q-toolbar class="justify-between">
        <div class="text-h6" v-text="'Добавить файлы'"/>
        <q-btn
          flat
          round
          dense
          icon="close"
          v-close-popup
        />
      </q-toolbar>
      <q-card-section>
        <div style="margin-bottom: 8px;">
          <div
            style="margin-bottom: 16px"
            v-for="(file, index) in this.attachedFiles"
            :key="index"
          >
            <div style="display: flex;align-items: center;padding: 4px;border: solid 1px rgba(108, 108, 108, 0.2);border-radius: 4px">
              <div style="padding: 2px 8px 2px 8px;border-radius: 4px;background-color: rgba(255, 149, 0, 1);color: white;font-size: 12px;margin-right: 8px">
                {{ file.name.split('.')[file.name.split('.').length - 1].toUpperCase() }}
              </div>
              <div class="truncate">{{ file.name.split('.')[0] }}</div>
              <q-space/>
              <q-btn
                flat
                round
                dense
                style="color: gray"
                icon="delete"
                @click="this.attachedFiles.splice(index, 1)"
              />
            </div>
          </div>
        </div>
        <div style="font-size: 14px;margin-bottom: 16px">Добавлено {{ this.attachedFiles.length }} файлов</div>
        <q-file
          v-model="this.attachedFiles"
          label="Перетащите сюда файл"
          color="primary"
          outlined
          append
          max-file-size="10485760"
          multiple
          style="width: 100%"
        >
          <template v-slot:prepend>
            <q-icon name="attach_file"/>
          </template>
        </q-file>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script>
import { useStore } from 'stores/store'
import axios from 'axios'
import { useResizeObserver } from '@vueuse/core'
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'

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
    attachedFiles: [],
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
    replyFileType: null,

    showListPinedFiles: false
  }),

  updated () {
    setTimeout(() => { this.$emit('updated') }, 150)
  },

  mounted () {
    try {
      this.scrollToBottom()
      this.$refs.textInput.focus()
    } catch (ignoredError) {
    }
  },

  methods: {
    nameToPastelHex (name) {
      let hash = 0
      for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash)
      }

      let r = (hash & 0xFF0000) >> 16
      let g = (hash & 0x00FF00) >> 8
      let b = hash & 0x0000FF

      r = Math.floor((r + 255) / 2)
      g = Math.floor((g + 255) / 2)
      b = Math.floor((b + 255) / 2)

      const pastelHex = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`

      return pastelHex
    },

    getAbbreviation (client) {
      const lastname = client.lastname ? client.lastname[0].toUpperCase() : ''
      const firstname = client.firstname ? client.firstname[0].toUpperCase() : ''
      return `${lastname}${firstname}`
    },

    copyToClipboard (text) {
      navigator.clipboard.writeText(text)
    },

    pastToInputField (text) {
      this.$emit('pastToInputField', text)
    },

    scrollToBottom (timeout = 0) {
      setTimeout(() => {
        let scrollArea = document.querySelector('#chat-dialog > div > div')
        if (this.isDialog) {
          scrollArea = document.querySelector('#chat-dialog-pop-up > div > div')
        }
        scrollArea.scrollTo(0, scrollArea.scrollHeight)
      }, timeout)
    },

    smoothScrollToBottom () {
      let scrollArea = document.querySelector('#chat-dialog > div > div')
      if (this.isDialog) {
        scrollArea = document.querySelector('#chat-dialog-pop-up > div > div')
      }
      scrollArea.scrollTo({ top: scrollArea.scrollHeight, left: 0, behavior: 'smooth' })
    },

    sendMessage () {
      const textarea = this.$refs.textInput
      if (textarea.value || this.attachedFiles.length > 0) {
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
        this.$emit('sendMessage', { message, attachedFiles: this.attachedFiles, clientId: this.client.id })
        this.attachedFiles = []
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

    getTimeLastMessage (message) {
      if (message) {
        const dateFormatted = new Date(message.date)
        const currentDate = new Date()
        const timeDifference = currentDate - dateFormatted
        const seconds = Math.floor(timeDifference / 1000)
        const minutes = Math.floor(seconds / 60)
        const hours = Math.floor(minutes / 60)
        const days = Math.floor(hours / 24)
        const years = Math.floor(days / 365)

        const declension = (number, words) => {
          return words[
            (number % 10 === 1 && number % 100 !== 11) ? 0
              : (number % 10 >= 2 && number % 10 <= 4 && (number % 100 < 10 || number % 100 >= 20)) ? 1
                  : 2
          ]
        }

        let result
        if (years > 0) {
          result = `${years} ${declension(years, ['год', 'года', 'лет'])}`
        } else if (days > 0) {
          result = `${days} ${declension(days, ['день', 'дня', 'дней'])}`
        } else if (hours > 0) {
          result = `${hours} ${declension(hours, ['час', 'часа', 'часов'])}`
        } else {
          result = `${minutes} ${declension(minutes, ['минута', 'минуты', 'минут'])}`
        }
        return `${result} назад`
      }
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
        this.attachedFiles = fileInput.files[0]
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
        let requestUri = `/api/v1/client/${this.client.id}/search-messages`
        if (this.isDialog) {
          const queryParams = new URLSearchParams(window.location.search)
          const taskId = queryParams.get('task')
          requestUri = `/api/v1/client/${this.client.id}/task/${taskId}/search-messages`
        }
        axios.post(requestUri, { text: this.search })
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
      const id = this.isDialog ? `modal_message_${messageId}` : `message_${messageId}`
      this.scrollToElementById(id)
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
    },

    getTypingWatchingUsers () {
      const watchingNow = this.taskWatchingNow.filter(user =>
        user.id !== this.currentUser.id &&
        !this.typing.some(t => t.username === user.username)
      )

      const typingNow = this.typing.filter(t => t.username !== this.currentUser.username)

      return {
        typing: typingNow.map(t => `${t.lastname} ${t.firstname}`),
        watching: watchingNow.map(user => `${user.lastname} ${user.firstname}`)
      }
    }
  },

  computed: {
    typingUsers () {
      return this.getTypingWatchingUsers().typing
    },

    watchUsers () {
      return this.getTypingWatchingUsers().watching
    },

    renderShortcutPlaceholder () {
      return `${this.isComment ? 'Текст комментария' : 'Текст сообщения'} ${this.isMobile || this.isDialog ? '' : '\nВведите shortcut и нажмите tab чтобы выполнить авто-ввод'}`
    },

    chatStyle () {
      return {
        height: this.isDialog ? 'calc(100% - 93px)' : (this.isMobile ? 'calc(100vh - 181px)' : 'calc(100vh - 95px)'),
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
    const router = useRoute()
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
      router,
      getMediaMessageSize
    }
  }

}
</script>

<style scoped>

.action-clouds {
  width: 100%;
  height: 100%;
  display: block;
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  color: white;
  font-size: 14px;
  z-index: 1000;
  max-width: 100%;
}

.attach-file-card {
  display: flex;
  align-items: center;
  padding: 4px;
  border: solid 1px rgba(108, 108, 108, 0.2);
  border-radius: 4px;
  background-color: white;
  color: rgba(36, 36, 36, 1);
  margin-bottom: 4px;
  height: 44px;
}

.attach-file-format {
  padding: 2px 8px 2px 8px;
  border-radius: 4px;
  background-color: rgba(255, 149, 0, 1);
  color: white;font-size: 12px;
  margin-right: 8px
}

.typing-users-cloud {
  display: flex;
  flex-wrap: nowrap;
  opacity: 0.5;
  background-color: rgba(255, 255, 255, 1);
  color: rgba(92, 53, 249, 1) !important;
  border-radius: 4px;
  margin-top: 5px;
  text-align: center;
  padding-left: 10px;
  padding-right: 10px;
  margin-bottom: 8px;
  width: max-content;
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
  width: 100%;
  z-index: 10;
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
  padding: 0 4px;
  position: absolute;
  width: 100%;
  display: flex;
  flex-direction: column;
  flex-wrap: nowrap;
  bottom: 0;
}

.strikethrough {
  text-decoration: line-through;
  opacity: 0.6;
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
