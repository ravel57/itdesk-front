<template>
  <div style="position: relative">
    <q-card
      data-tour="chat-message-search"
      class="search-container no-shadow"
      style="background-color: #F0F0F0"
    >
      <div id="messageSearch" class="search">
        <q-input
          v-model="search"
          label="Поиск по сообщениям"
          dense
          borderless
          clearable
          style="width: 100%; padding: 8px 4px 0 4px;"
          @focus="this.isShowSearchResults = true"
          @blur="this.onBlur"
        >
          <template v-slot:prepend>
            <q-icon name="search"/>
          </template>
        </q-input>
        <q-btn
          v-if="!this.isMobile"
          icon="attach_file"
          @click="this.showFiles"
          flat
          dense
          class="q-ml-auto"
        />
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
            <svg v-if="this.getName(message) !== ''" style="margin-right: 8px" width="20" height="20"
                 viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M0.432193 13.8757L0.431791 13.8559C0.437263 12.5425 0.362052 10.9444 0.51429 9.66617C1.06099 5.07597 4.92198 1.43399 9.45856 0.824872C10.0584 0.744332 10.6484 0.734517 11.2522 0.727173C12.3729 0.765053 13.548 0.731395 14.6729 0.731472C15.1618 0.731511 15.6521 0.720803 16.1402 0.754104C21.141 1.09531 25.3184 5.12436 25.7314 10.1578C25.8281 11.336 25.7552 12.6767 25.7802 13.8774C25.4588 13.8779 25.1373 13.8802 24.816 13.878C23.6035 13.8695 23.7398 14.187 23.6417 15.1379C23.4215 17.2716 21.7225 19.0301 19.5986 19.2937C16.8784 19.6314 14.6321 17.7307 14.2997 15.0622C14.1904 14.3026 13.7317 14.331 13.088 14.3284C12.8906 14.3276 12.6797 14.314 12.4843 14.3404L12.4599 14.344C11.8538 14.4297 11.902 15.1759 11.8179 15.6173C11.6462 16.5188 11.1154 17.4321 10.4586 18.0691C8.6007 19.8706 5.50491 19.7156 3.77619 17.8344C2.88113 16.8603 2.5745 15.8253 2.51764 14.5544C2.49943 14.1473 2.29021 13.9334 1.86357 13.8928C1.39407 13.848 0.903897 13.8781 0.432193 13.8757ZM10.4889 2.59808C10.0687 2.62214 9.65763 2.65184 9.24287 2.7282C5.65091 3.38958 2.67168 6.45736 2.30341 10.1203C2.24564 10.695 2.26972 11.2677 2.26031 11.8437C2.46677 11.8715 2.67354 11.8647 2.88131 11.8648C6.11031 11.8677 9.33938 11.8658 12.5684 11.8651C13.5999 11.8648 14.6353 11.8838 15.6664 11.8617L23.9181 11.8683C23.8932 11.2614 23.9378 10.6511 23.8734 10.0459C23.4533 6.10394 20.1418 2.9601 16.2125 2.62219C15.8112 2.58767 15.414 2.58956 15.0117 2.58928C13.5372 2.58826 11.9722 2.53594 10.5044 2.59741L10.4889 2.59808Z"
                fill="#5C35F9"/>
              <path
                d="M3.28256 20.9081C3.25071 20.9952 3.24359 21.0725 3.25285 21.1649C3.35083 22.1429 4.28927 22.7426 5.21264 22.7422C6.33634 22.7418 7.38908 21.9149 8.16315 21.1642C8.94619 20.4048 9.6329 19.521 10.7899 19.4021C11.7216 19.3352 12.535 19.7171 13.0983 20.4742C13.8216 19.5609 14.8809 19.1131 16.0314 19.5488C17.0697 19.942 17.7451 21.0013 18.593 21.6765C19.3357 22.2678 20.3057 22.8524 21.2961 22.7329C22.2772 22.6145 22.9066 21.9226 22.9402 20.9309C23.5593 21.316 23.4454 22.2953 23.2011 22.8673C22.8143 23.7731 21.9196 24.3741 21.0332 24.7231C19.2485 25.4256 16.6283 25.4431 14.8396 24.6671C14.0788 24.3285 13.5003 23.7834 13.0739 23.0728C12.586 24.1746 11.4709 24.743 10.3497 25.0053C8.2852 25.4884 5.0117 25.328 3.53295 23.6711C2.8457 22.9011 2.39219 21.6978 3.28256 20.9081Z"
                fill="#5C35F9"/>
            </svg>
            <div
              v-else
              style="width: 20px;height: 20px;border-radius: 100%;display: flex;justify-content: center;align-items: center;color: white;font-size: 10px;margin-right: 8px"
              :style="'background-color: ' + nameToPastelHex(`${this.client.lastname} ${this.client.firstname}`) + ';'"
            >
              {{ this.getAbbreviation(this.client) }}
            </div>
            <div
              class="truncate"
              v-html="this.highlightSearchText(message.text)"
            />
          </div>
          <div class="">
            {{ this.getTimeLastMessage(message) }}
          </div>
        </q-item-section>
      </q-item>
    </q-list>
  </div>
  <q-layout
    data-tour="chat-message-list"
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
            v-for="message in sortedMessages"
            :key="message.id"
            class="chat-message-row"
            style="position: relative;width: 100%; margin-top: 0"
            @click.right="this.invertContextMenu"
            :class="{ 'chat-dialog--wheel-scrolling': isWheelScrollingMessages }"
            @wheel.passive="markMessagesWheelScrolling"
          >
            <!--<q-chat-message v-if="this.isDateChanged(message)" :label="this.getDate(message)"/>-->
            <q-chat-message
              :id="`${this.isDialog ? 'modal_message' : 'message'}_${message.id}`"
              :avatar="message.avatar"
              :name="this.getName(message)"
              :sent="message.isSent"
              text-color="black"
              :class="message.deleted ? 'strikethrough' : ''"
              style="white-space: pre-wrap;"
              :bg-color="message.isComment ? 'deep-purple-2' : message.isSent ? '#e0e0e0' : 'white'"
            >
              <template v-slot:stamp>
                <span
                  v-text="this.getStamp(message)"
                />
                <q-icon
                  v-if="!this.isDialog && message.linkedTaskId"
                  class="linked-task-icon"
                  name="link"
                  @click.stop="openLinkedTaskByMessage(message)"
                >
                  <q-tooltip>Открыть связанную заявку</q-tooltip>
                </q-icon>
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
                  v-else-if="message.replyUuid && message.replyFileType && message.replyFileType.startsWith('image/')"
                >
                  <img
                    :src="`/files/images/${message.replyUuid}`"
                    style="width: 40px;height: 40px;border-radius: 4px;object-fit: cover;"
                    alt=""
                  >
                </div>
                <div
                  v-else-if="message.replyUuid && message.replyFileType && message.replyFileType.startsWith('video/')"
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
                  <div class="">От: {{
                      message.user ? message.user.lastname + ' ' + message.user.firstname : this.client.lastname + ' ' + this.client.username
                    }}
                  </div>
                  <div class="">
                    {{ getReplyPreviewText(message) }}
                  </div>
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
                  class="chat-message-text"
                  v-html="this.findLinks(message.text)"
                  style="max-width: 400px;"
                />
              </div>
            </q-chat-message>

            <div
              data-tour="chat-answer-required"
              v-if="this.canSetAnswerRequired(message)"
              class="answer-required-actions"
              :class="{ 'answer-required-actions--selected': isSelectedAnswerRequiredMessage(message) }"
            >
              <q-btn
                dense
                flat
                no-caps
                size="12px"
                icon="priority_high"
                label="Требует ответа"
                :color="isAnswerRequired(message) ? 'primary' : 'grey'"
                @click="setAnswerRequired(message, true)"
              />

              <q-btn
                dense
                flat
                no-caps
                size="12px"
                icon="done"
                label="Не требует ответа"
                :color="isAnswerNotRequired(message) ? 'positive' : 'grey'"
                @click="setAnswerRequired(message, false)"
              />
            </div>

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
                  v-if="canEditMessage(message)"
                  clickable
                  v-close-popup
                >
                  <q-item-section
                    @click="this.startEditMessage(message)"
                  >
                    Редактировать
                  </q-item-section>
                </q-item>
                <q-item
                  v-if="!message.deleted"
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
                <q-item
                  v-if="message.text"
                  clickable
                  v-close-popup
                  @click="this.findInKnowledgeBase(message)"
                >
                  <q-item-section>
                    Найти в базе знаний
                  </q-item-section>
                </q-item>
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
          <div
            style="height: 50px;width: 50px;display: flex;justify-content: center;align-items: center;margin-left: 5px;margin-right: 10px">
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
        v-if="this.editingMessage !== null"
        class="no-shadow"
        style="width: 100%;height: 50px;display: flex;flex-direction: row;border-radius: 0;border-top: 1px solid #0000001f"
      >
        <div style="display: flex;width: 100%;max-height: 50px;align-items: center">
          <div style="height: 50px;width: 50px;display: flex;justify-content: center;align-items: center;margin-left: 5px;margin-right: 10px">
            <q-icon
              size="20px"
              name="edit"
            />
          </div>
          <div style="width: 100%">
            <div>
              Редактирование сообщения
            </div>
            <div class="truncate">
              {{ this.editingMessage.text }}
            </div>
          </div>
          <q-icon
            size="20px"
            style="height: 50px;width: 50px;cursor: pointer"
            name="close"
            @click="this.cancelEditMessage"
          />
        </div>
      </q-card>

      <q-card
        data-tour="chat-message-composer"
        class="input-item no-shadow"
        :class="{ 'input-item--comment': this.isComment }"
        :style="composerStyle"
      >
        <q-btn
          v-if="this.scrollToBottomKey || this.pendingNewMessagesCount > 0 || this.hasTrimmedNewerMessages"
          class="shadow-1 chat-go-latest-btn"
          icon="keyboard_double_arrow_down"
          no-caps
          dense
          :label="this.getGoToLatestButtonLabel()"
          :style="this.replyMessageId !== null ? 'bottom: 210%;' : 'bottom: 100%;'"
          @click="this.handleGoToLatestClick"
        />
        <div
          v-if="this.attachedFiles.length > 0 ||
          this.typing.filter(t => t.username !== this.currentUser.username).length > 0 ||
          this.replyMessageId !== null ||
          this.editingMessage !== null ||
          this.taskWatchingNow.filter(user => user.id !== this.currentUser.id).length > 0"
          :style="(this.replyMessageId !== null || this.editingMessage !== null) ? 'bottom: 210%;' : 'bottom: 100%;'"
          class="action-clouds"
        >
          <div class="input-clouds-container">
            <div class="typing-users-cloud-row">
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
          data-tour="chat-attach-file"
          style="margin-bottom: 6px"
          id="choose-file-btn"
          type="file"
          @click="showListPinedFiles = true"
          icon="sym_o_attach_file_add"
          class="no-padding"
          flat
        />
        <input
          type="file"
          id="fileInput"
          style="display: none"
        />
        <textarea
          data-tour="chat-message-input"
          ref="textInput"
          :value="this.inputField"
          :placeholder="this.renderShortcutPlaceholder"
          :style="textareaStyle"
          @keydown.tab.prevent="handleTabPressed"
          @keydown="this.handleKeyPressed"
          @input="this.textChanged"
          @paste="this.handlePaste"
        />

        <q-menu
          v-if="isComment"
          ref="mentionSuggestionsMenu"
          v-model="mentionMenu"
          :target="mentionTargetEl"
          anchor="top left"
          self="bottom left"
          :offset="[0, 8]"
          fit
          no-parent-event
          auto-close="false"
          no-focus
          no-refocus
        >
          <q-list dense style="min-width: 260px; max-height: 220px; overflow: auto;">
            <q-item
              v-for="(u, i) in filteredMentionUsers"
              :key="u.id || u.uuid || (u.username + '_' + i)"
              clickable
              :active="i === mentionIndex"
              active-class="bg-grey-3"
              @click="selectMention(u)"
            >
              <q-item-section>
                <div class="text-body2">
                  {{ `${u.lastname || ''} ${u.firstname || ''}` }}
                </div>
                <div class="text-caption text-grey-7">
                  @{{ u.username || (u.email ? u.email.split('@')[0] : '') }}
                </div>
              </q-item-section>
            </q-item>

            <q-item v-if="filteredMentionUsers.length === 0">
              <q-item-section class="text-grey-6 text-caption">
                Нет совпадений
              </q-item-section>
            </q-item>
          </q-list>
        </q-menu>

        <q-menu
          ref="templateSuggestionsMenu"
          v-model="templateMenu"
          :target="templateTargetEl"
          anchor="top left"
          self="bottom left"
          :offset="[0, 8]"
          fit
          no-parent-event
          :auto-close="false"
          no-focus
          no-refocus
        >
          <q-list dense class="template-suggestions-list">
            <q-item
              v-for="(template, index) in filteredTemplateSuggestions"
              :key="template.id || template.shortcut || index"
              clickable
              :active="index === templateIndex"
              active-class="bg-grey-3"
              class="template-suggestion-item"
              @mousedown.prevent
              @click="selectTemplateSuggestion(template)"
            >
              <q-item-section side top>
                <q-badge
                  outline
                  color="primary"
                  class="template-suggestion-shortcut"
                >
                  :{{ template.shortcut }}
                </q-badge>
              </q-item-section>

              <q-item-section>
                <q-item-label lines="2" class="template-suggestion-text">
                  {{ template.text }}
                </q-item-label>
              </q-item-section>
            </q-item>

            <q-item v-if="filteredTemplateSuggestions.length === 0">
              <q-item-section class="text-grey-6 text-caption">
                Нет совпадений
              </q-item-section>
            </q-item>
          </q-list>
        </q-menu>

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
              {{ this.sendShortcutText }}
            </q-tooltip>
          </q-btn>
        </div>
        <div
          v-if="this.comments"
        >
          <q-btn
            data-tour="chat-comment-mode"
            id="comment-mode-btn"
            style="margin-bottom: 6px"
            @click="this.switchToComment"
            dense
            flat
            icon="comment"
            :color="this.isComment ? 'primary' : 'grey'"
          >
            <q-tooltip
              v-if="!this.isMobile"
            >
              Режим комментария: Сообщение увидят только операторы
            </q-tooltip>
          </q-btn>
        </div>
      </q-card>
    </div>
  </q-page>
  <q-dialog v-model="this.isShowMaxSizePhoto">
    <q-card style="overflow: hidden;"
            :style="this.isMobile ? 'max-height: 60vh; max-width: 90vw;' : 'max-height: 90vh; max-width: 80vw;'">
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
            <div
              style="display: flex; align-items: center; padding: 4px; border: solid 1px rgba(108, 108, 108, 0.2); border-radius: 4px">
              <div
                style="padding: 2px 8px 2px 8px; border-radius: 4px; background-color: rgba(255, 149, 0, 1); color: white; font-size: 12px; margin-right: 8px">
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
        <div style="font-size: 14px; margin-bottom: 16px">Добавлено {{ this.attachedFiles.length }} файлов</div>
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
  <q-dialog backdrop-filter="blur(4px)" v-model="this.isShowFileList">
    <q-card class="dialog-width">
      <q-toolbar class="justify-between">
        <div class="text-h6" v-text="'Файлы'"/>
        <q-btn
          flat
          round
          dense
          icon="close"
          v-close-popup
        />
      </q-toolbar>
      <q-card-section>
        <div class="file-list-toolbar">
          <div class="text-caption text-grey-7">
            Файлов: {{ sortedFileList.length }}
          </div>
          <q-btn
            dense
            flat
            no-caps
            icon="sort"
            :label="fileSortDirection === 'desc' ? 'Сначала новые' : 'Сначала старые'"
            @click="toggleFileSortDirection"
          />
        </div>
        <div style="margin-bottom: 8px;">
          <div
            style="margin-bottom: 16px"
            v-for="(file, index) in sortedFileList"
            :key="file.uuid || index"
          >
            <a
              class="file-list-item"
              :href="getFileUrl(file)"
              target="_blank"
            >
              <div class="file-list-ext">
                {{ getFileExt(file) }}
              </div>
              <div class="file-list-info">
                <div class="truncate">{{ getFileTitle(file) }}</div>
                <div
                  v-if="getFileDateText(file)"
                  class="file-list-date"
                >
                  {{ getFileDateText(file) }}
                </div>
              </div>

              <q-space/>
            </a>
          </div>
        </div>
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
    typing: {
      default: () => [],
      type: Array
    },
    currentUser: { type: Object },
    linkedMessageId: { type: Number },
    tasks: { type: Array },
    taskWatchingNow: {
      default: () => [],
      type: Array
    },
    isShowHelper: { type: Boolean },
    isMobile: { type: Boolean },
    isDialog: {
      default: false,
      type: Boolean
    },
    client: { type: Object },
    isEnd: { type: Boolean },
    pendingNewMessagesCount: {
      type: Number,
      default: 0
    },
    hasTrimmedNewerMessages: {
      type: Boolean,
      default: false
    },
    comments: {
      default: true,
      type: Boolean
    },
    showAnswerRequiredActions: {
      default: true,
      type: Boolean
    },
    clientFiles: {
      type: Array,
      default: () => []
    },
  },

  data: () => ({
    textareaHeight: 46,
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
    routeMessageIdToScroll: null,

    chatWindowWidth: 500,

    replyFileUuid: null,
    replyFileType: null,

    showListPinedFiles: false,

    mentionMenu: false,
    mentionQuery: '',
    mentionIndex: 0,
    mentionTargetEl: null,

    templateMenu: false,
    templateQuery: '',
    templateIndex: 0,
    templateTargetEl: null,
    templateMatchStart: null,
    templateMatchEnd: null,

    isShowFileList: false,
    fileList: [],
    fileSortDirection: 'desc',
    editingMessage: null,

    lastKnownLastMessageId: null,
    lastKnownMessagesLength: 0,
    isWheelScrollingMessages: false,
    wheelScrollingTimer: null,
    highlightMessageTimers: {},
    portionMessagesTimer: null,
    markReadEmitTimer: null,
  }),

  mounted () {
    try {
      this.mentionTargetEl = this.$refs.textInput
      this.templateTargetEl = this.$refs.textInput
      if (this.getRouteMessageId()) {
        this.scrollToRouteMessage()
      } else {
        this.scrollToBottom()
      }
      this.$refs.textInput.focus()
      this.$nextTick(() => {
        this.autoResize()
        this.scheduleMessagesUpdatedEmit()
      })
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
      scrollArea.scrollTo({
        top: scrollArea.scrollHeight,
        left: 0,
        behavior: 'smooth'
      })
    },

    sendMessage () {
      this.closeTemplateMenu()
      const textarea = this.$refs.textInput
      if (this.editingMessage !== null) {
        const text = String(textarea.value || '').trim()
        if (!text) {
          this.$q.notify({
            message: 'Текст сообщения не может быть пустым',
            type: 'warning',
            position: 'top-right'
          })
          return
        }
        this.$emit('isSending', true)
        this.$emit('editMessage', {
          clientId: this.client.id,
          message: this.editingMessage,
          text
        })
        this.editingMessage = null
        textarea.value = ''
        this.$emit('keyPressed', '')
        this.autoResize()
        return
      }
      if (textarea.value || this.attachedFiles.length > 0) {
        this.$emit('isSending', true)
        const message = {
          id: null,
          text: textarea.value,
          date: new Date(),
          isSent: true,
          isComment: this.isComment,
          isRead: true,
          replyMessageId: this.replyMessageId,
          replyUuid: this.replyFileUuid,
          replyFileType: this.replyFileType,
          user: this.currentUser
        }
        this.$emit('sendMessage', {
          message,
          attachedFiles: this.attachedFiles,
          clientId: this.client.id
        })
        this.attachedFiles = []
        this.replyMessageId = null
        this.replyFileType = null
        this.replyFileUuid = null
      }
      this.$nextTick(() => {
        const textarea = this.$refs.textInput
        if (textarea) {
          textarea.style.height = '46px'
          textarea.style.overflowY = 'hidden'
        }
        this.textareaHeight = 46
        let chat = document.getElementById('chat-dialog')
        if (this.isDialog) {
          chat = document.getElementById('chat-dialog-pop-up')
        }
        if (chat) {
          chat.style.height = this.chatStyle.height
        }
      })
      this.scrollToBottom(500)
    },

    handleTabPressed (event) {
      if (this.templateMenu) {
        const template = this.filteredTemplateSuggestions[this.templateIndex]
        if (template) {
          event.preventDefault()
          this.selectTemplateSuggestion(template)
          return
        }
      }

      const textarea = this.$refs.textInput
      if (!textarea?.value) {
        return
      }

      const caret = textarea.selectionStart ?? textarea.value.length
      const before = textarea.value.slice(0, caret)
      const shortcutMatch = before.match(/(?:^|\s):([^\s:]*)$/)
      if (!shortcutMatch) {
        return
      }

      const shortcut = shortcutMatch[1].toLowerCase()
      const template = (Array.isArray(this.templates) ? this.templates : [])
        .find(item => String(item.shortcut || '').replace(/^:/, '').toLowerCase() === shortcut)

      if (template) {
        event.preventDefault()
        this.templateMatchStart = caret - shortcutMatch[0].trimStart().length
        this.templateMatchEnd = caret
        this.selectTemplateSuggestion(template)
      }
    },

    getStamp (message) {
      const date = message?.date instanceof Date
        ? message.date
        : new Date(message?.date)
      if (Number.isNaN(date.getTime())) {
        return ''
      }
      const time = date.toLocaleTimeString('ru-RU', {
        timeZone: 'Europe/Moscow',
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
      return message.editedAt ? `${time} · изменено` : time
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
            (number % 10 === 1 && number % 100 !== 11)
              ? 0
              : (number % 10 >= 2 && number % 10 <= 4 && (number % 100 < 10 || number % 100 >= 20))
                  ? 1
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
            icon: 'close',
            color: 'white',
            dense: true,
            handler: () => undefined
          }]
        })
      })
    },

    escapeHtml (value) {
      return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;')
    },

    escapeRegExp (value) {
      return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    },

    highlightSearchText (text) {
      const value = String(text ?? '')
      const query = String(this.search || '').trim()
      if (!query) {
        return this.escapeHtml(value)
      }
      const searchRegex = new RegExp(this.escapeRegExp(query), 'gi')
      let result = ''
      let lastIndex = 0

      value.replace(searchRegex, (match, offset) => {
        result += this.escapeHtml(value.slice(lastIndex, offset))
        result += `<mark class="chat-search-highlight">${this.escapeHtml(match)}</mark>`
        lastIndex = offset + match.length
        return match
      })

      result += this.escapeHtml(value.slice(lastIndex))
      return result
    },

    findLinks (message) {
      const urlRegex = /https?:\/\/\S+/g
      const decodedText = document.createElement('textarea')
      decodedText.innerHTML = String(message ?? '')
      const text = decodedText.value
      let result = ''
      let lastIndex = 0

      text.replace(urlRegex, (url, offset) => {
        result += this.highlightSearchText(text.slice(lastIndex, offset))
        const safeUrl = this.escapeHtml(url)
        result += `<a href="${safeUrl}" target="_blank" rel="noopener noreferrer">${this.highlightSearchText(url)}</a>`
        lastIndex = offset + url.length
        return url
      })

      result += this.highlightSearchText(text.slice(lastIndex))
      return result
    },

    scrollToElementById (id) {
      const root = document.getElementById(id)
      if (!root) {
        return false
      }
      const messageBubble =
        root.querySelector('.q-message-text-content') ||
        root.querySelector('.q-message-text') ||
        root
      messageBubble.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      })
      this.highlightMessageElement(messageBubble, id)
      return true
    },

    highlightMessageElement (element, id) {
      if (!element) {
        return
      }
      const key = String(id)
      if (this.highlightMessageTimers[key]) {
        clearTimeout(this.highlightMessageTimers[key])
        delete this.highlightMessageTimers[key]
      }
      element.classList.remove('chat-message--highlighted')
      void element.offsetWidth
      element.classList.add('chat-message--highlighted')
      this.highlightMessageTimers[key] = setTimeout(() => {
        element.classList.remove('chat-message--highlighted')
        element.style.removeProperty('background-color')
        delete this.highlightMessageTimers[key]
        this.$emit('clearLinkedMessageId')
      }, 2500)
    },

    scrollToMessageAfterSearch (messageId) {
      const id = Number(messageId)
      if (!id) {
        return
      }
      this.routeMessageIdToScroll = id
      if (this.messages.some(m => Number(m.id) === id)) {
        this.$nextTick(() => {
          this.goToMessage(id)
        })
        return
      }
      this.$emit('scrollToMessageAfterSearch', id)
      setTimeout(() => {
        this.goToMessage(id)
      }, 500)
    },

    linkToTask (message, task) {
      this.$emit('linkToTask', message, task)
    },

    openLinkedTaskByMessage (message) {
      this.$emit('openLinkedTask', message)
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
                icon: 'close',
                color: 'white',
                dense: true,
                handler: () => undefined
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
      return this.scrollToElementById(id)
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
      queryParams.delete('task')
      queryParams.set('newTaskFromMessage', message.id)
      this.$router.push({
        path: this.$route.path,
        query: Object.fromEntries(queryParams.entries())
      })
    },

    switchToComment () {
      this.isComment = !this.isComment

      if (!this.isComment) {
        this.closeMentionMenu()
        return
      }

      this.$nextTick(() => {
        this.updateMentionState()
      })
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
        if (!textarea) {
          return
        }
        const maxHeight = this.getTextareaMaxHeight()
        textarea.style.height = 'auto'
        textarea.style.overflowY = 'hidden'
        const nextHeight = Math.max(46, Math.min(textarea.scrollHeight, maxHeight))
        const isScrollable = textarea.scrollHeight > maxHeight
        textarea.style.height = `${nextHeight}px`
        textarea.style.overflowY = isScrollable ? 'auto' : 'hidden'
        if (chat) {
          chat.style.height = this.chatStyle.height
          chat.style.height = nextHeight + replyContainer > 46
            ? `calc(${this.chatStyle.height} - ${nextHeight + (replyContainer !== 0 ? replyContainer + 1 : replyContainer) - 46}px)`
            : this.chatStyle.height
        }
        this.textareaHeight = nextHeight
      })
    },

    getPortionMessages () {
      if (this.portionMessagesTimer) {
        return
      }
      this.portionMessagesTimer = setTimeout(() => {
        this.portionMessagesTimer = null
        this.handlePortionMessages()
      }, 80)
    },

    handlePortionMessages () {
      const scrollZone = this.getScrollZone()
      if (!scrollZone) {
        return
      }
      const distanceToBottom = scrollZone.scrollHeight - scrollZone.clientHeight - scrollZone.scrollTop
      this.scrollToBottomKey = distanceToBottom >= 600
      const denominator = scrollZone.scrollHeight - scrollZone.clientHeight
      if (denominator <= 0 || this.requestPending) {
        return
      }
      const scrollPercent = (scrollZone.scrollTop / denominator) * 100
      if (distanceToBottom <= 120 && !this.hasTrimmedNewerMessages) {
        this.scheduleMessagesUpdatedEmit()
      }
      if (scrollPercent <= 3) {
        this.loadOlderMessagesWithAnchor(scrollZone)
        return
      }
      if (distanceToBottom <= 80 && this.hasTrimmedNewerMessages) {
        this.loadNewerMessagesWithAnchor(scrollZone)
      }
    },

    loadOlderMessagesWithAnchor (scrollZone) {
      if (this.isEnd || this.requestPending) {
        return
      }
      this.requestPending = true
      const previousScrollHeight = scrollZone.scrollHeight
      const previousScrollTop = scrollZone.scrollTop
      this.$emit('getMessagePage', 1)
      setTimeout(() => {
        this.requestPending = false
        const newScrollHeight = scrollZone.scrollHeight
        const addedHeight = newScrollHeight - previousScrollHeight
        scrollZone.scrollTop = previousScrollTop + addedHeight
      }, 260)
    },

    loadNewerMessagesWithAnchor (scrollZone) {
      if (this.requestPending) {
        return
      }
      this.requestPending = true
      const previousScrollTop = scrollZone.scrollTop
      this.$emit('getNewerMessagePage')
      setTimeout(() => {
        this.requestPending = false
        // Не прыгаем сразу в самый низ.
        // Оставляем пользователя на старой позиции, чтобы он мог продолжить листать вниз.
        scrollZone.scrollTop = previousScrollTop
      }, 260)
    },

    handleGoToLatestClick () {
      if (this.pendingNewMessagesCount > 0 || this.hasTrimmedNewerMessages) {
        this.$emit('goToLatestMessages')
        return
      }
      this.smoothScrollToBottom()
    },

    getGoToLatestButtonLabel () {
      if (this.pendingNewMessagesCount > 0) {
        return this.pendingNewMessagesCount
      }
      return ''
    },

    scheduleMessagesUpdatedEmit () {
      if (this.markReadEmitTimer) {
        clearTimeout(this.markReadEmitTimer)
      }
      this.markReadEmitTimer = setTimeout(() => {
        this.markReadEmitTimer = null
        const scrollZone = this.getScrollZone()
        if (!this.isNearBottom(scrollZone, 220)) {
          return
        }
        if (this.hasTrimmedNewerMessages) {
          return
        }
        this.$emit('updated')
      }, 250)
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

    textChanged () {
      this.$emit('keyPressed', this.$refs.textInput.value)
      this.autoResize()
      this.updateMentionState()
      this.updateTemplateState()
    },

    normalizeTemplateSearch (value) {
      return String(value || '')
        .trim()
        .toLowerCase()
        .replace(/^:/, '')
    },

    getMatchingTemplates (value) {
      const query = this.normalizeTemplateSearch(value)
      const templates = Array.isArray(this.templates) ? this.templates : []

      if (!query) {
        return templates.slice(0, 8)
      }

      const score = template => {
        const text = String(template.text || '').toLowerCase()
        const shortcut = String(template.shortcut || '')
          .toLowerCase()
          .replace(/^:/, '')

        if (shortcut === query) return 0
        if (shortcut.startsWith(query)) return 1
        if (text.startsWith(query)) return 2
        if (shortcut.includes(query)) return 3
        if (text.includes(query)) return 4
        return 5
      }

      return templates
        .filter(template => {
          const text = String(template.text || '').toLowerCase()
          const shortcut = String(template.shortcut || '')
            .toLowerCase()
            .replace(/^:/, '')

          return text.includes(query) || shortcut.includes(query)
        })
        .sort((left, right) => score(left) - score(right))
        .slice(0, 8)
    },

    closeTemplateMenu () {
      this.templateMenu = false
      this.templateQuery = ''
      this.templateIndex = 0
      this.templateMatchStart = null
      this.templateMatchEnd = null
    },

    getTemplateSearchContext (textarea) {
      const caret = textarea.selectionStart ?? textarea.value.length
      const before = textarea.value.slice(0, caret)

      // Упоминания пользователей имеют приоритет над шаблонами только в режиме комментария.
      if (this.isComment && /(?:^|\s)@[^\s@]*$/.test(before)) {
        return null
      }

      const shortcutMatch = before.match(/(?:^|\s)(:([^\s:]*))$/)
      if (shortcutMatch) {
        const rawValue = shortcutMatch[1]
        return {
          query: shortcutMatch[2] || '',
          start: caret - rawValue.length,
          end: caret
        }
      }

      const lineStart = before.lastIndexOf('\n') + 1
      const currentLine = before.slice(lineStart)

      if (!currentLine.trim() || /\s$/.test(currentLine)) {
        return null
      }

      const tokens = [...currentLine.matchAll(/\S+/g)]
      if (tokens.length === 0) {
        return null
      }

      // Ищем сначала по длинному фрагменту, затем по последним словам.
      const maxTokenCount = Math.min(4, tokens.length)
      for (let count = maxTokenCount; count >= 1; count--) {
        const token = tokens[tokens.length - count]
        const relativeStart = token.index
        const rawQuery = currentLine.slice(relativeStart)
        const query = rawQuery.replace(/\s+/g, ' ').trim()

        if (query.length < 2) {
          continue
        }

        if (this.getMatchingTemplates(query).length > 0) {
          return {
            query,
            start: lineStart + relativeStart,
            end: caret
          }
        }
      }

      return null
    },

    updateTemplateState () {
      const textarea = this.$refs.textInput
      if (!textarea || !Array.isArray(this.templates) || this.templates.length === 0) {
        this.closeTemplateMenu()
        return
      }

      this.templateTargetEl = textarea
      const context = this.getTemplateSearchContext(textarea)

      if (!context) {
        this.closeTemplateMenu()
        return
      }

      this.templateQuery = context.query
      this.templateMatchStart = context.start
      this.templateMatchEnd = context.end
      this.templateIndex = 0

      this.$nextTick(() => {
        const shouldShowMenu = this.filteredTemplateSuggestions.length > 0
        this.templateMenu = shouldShowMenu

        if (shouldShowMenu) {
          // После фильтрации высота списка меняется. Пересчитываем позицию,
          // чтобы нижний край меню оставался возле поля ввода.
          this.$nextTick(() => {
            this.$refs.templateSuggestionsMenu?.updatePosition()
          })
        }
      })
    },

    selectTemplateSuggestion (template) {
      const textarea = this.$refs.textInput
      if (!textarea || !template) {
        return
      }

      const start = Number.isInteger(this.templateMatchStart)
        ? this.templateMatchStart
        : (textarea.selectionStart ?? textarea.value.length)
      const end = Number.isInteger(this.templateMatchEnd)
        ? this.templateMatchEnd
        : (textarea.selectionStart ?? textarea.value.length)
      const insertedText = String(template.text || '')
      const newText = textarea.value.slice(0, start) + insertedText + textarea.value.slice(end)
      const newCaret = start + insertedText.length

      textarea.value = newText
      this.$emit('keyPressed', newText)
      this.autoResize()
      this.closeTemplateMenu()

      this.$nextTick(() => {
        textarea.setSelectionRange(newCaret, newCaret)
        textarea.focus()
      })
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
    },

    closeMentionMenu () {
      this.mentionMenu = false
      this.mentionQuery = ''
      this.mentionIndex = 0
    },

    updateMentionState () {
      if (!this.isComment) {
        this.closeMentionMenu()
        return
      }

      const textarea = this.$refs.textInput
      if (!textarea) {
        this.closeMentionMenu()
        return
      }

      // ВАЖНО: обновляем target каждый раз (на случай если компонент пересоздали)
      this.mentionTargetEl = textarea

      const caret = textarea.selectionStart ?? textarea.value.length
      const before = textarea.value.slice(0, caret)

      // Триггер: @ в начале или после пробела
      const match = before.match(/(?:^|\s)@([^\s@]*)$/)

      if (!match) {
        this.closeMentionMenu()
        return
      }

      this.mentionQuery = match[1] || ''

      // если просто "@" и юзер начал стирать — не держим меню открытым
      if (this.mentionQuery.length === 0 && textarea.value.endsWith('@') === false) {
        this.closeMentionMenu()
        return
      }

      this.mentionIndex = 0

      // После фильтрации количество пользователей и высота списка меняются.
      // Открываем меню и пересчитываем позицию относительно поля ввода.
      this.$nextTick(() => {
        this.mentionMenu = true

        this.$nextTick(() => {
          this.$refs.mentionSuggestionsMenu?.updatePosition()
        })
      })
    },

    selectMention (user) {
      if (!this.isComment) {
        this.closeMentionMenu()
        return
      }

      const textarea = this.$refs.textInput
      if (!textarea) return

      const caret = textarea.selectionStart ?? textarea.value.length
      const before = textarea.value.slice(0, caret)
      const after = textarea.value.slice(caret)

      const atPos = before.lastIndexOf('@')
      if (atPos === -1) return

      const fullName = `${user.lastname || ''} ${user.firstname || ''}`.trim()
      const handle = fullName
        ? `[${fullName}]`
        : (user.username || (user.email ? user.email.split('@')[0] : null) || 'user')
      const inserted = `@${handle} `
      const newText = before.slice(0, atPos) + inserted + after

      textarea.value = newText
      this.$emit('keyPressed', newText)
      this.autoResize()

      this.closeMentionMenu()

      this.$nextTick(() => {
        const newCaret = atPos + inserted.length
        textarea.setSelectionRange(newCaret, newCaret)
        textarea.focus()
      })
    },

    isSendMessageShortcut (event) {
      const isEnter = event.key === 'Enter' || event.keyCode === 13
      if (!isEnter) {
        return false
      }

      if (this.isMacOs) {
        return event.metaKey && !event.ctrlKey
      }

      return event.ctrlKey && !event.metaKey
    },

    handleKeyPressed (event) {
      if (this.isSendMessageShortcut(event)) {
        event.preventDefault()
        this.sendMessage()
        return
      }

      if (this.isComment && this.mentionMenu) {
        if (event.key === 'ArrowDown') {
          event.preventDefault()
          this.mentionIndex = Math.min(this.mentionIndex + 1, this.filteredMentionUsers.length - 1)
          return
        }
        if (event.key === 'ArrowUp') {
          event.preventDefault()
          this.mentionIndex = Math.max(this.mentionIndex - 1, 0)
          return
        }
        if (event.key === 'Enter') {
          const u = this.filteredMentionUsers[this.mentionIndex]
          if (u) {
            event.preventDefault()
            this.selectMention(u)
            return
          }
        }
        if (event.key === 'Escape') {
          event.preventDefault()
          this.mentionMenu = false
          return
        }
      }

      if (this.templateMenu) {
        if (event.key === 'ArrowDown') {
          event.preventDefault()
          this.templateIndex = Math.min(
            this.templateIndex + 1,
            this.filteredTemplateSuggestions.length - 1
          )
          return
        }
        if (event.key === 'ArrowUp') {
          event.preventDefault()
          this.templateIndex = Math.max(this.templateIndex - 1, 0)
          return
        }
        if (event.key === 'Enter') {
          const template = this.filteredTemplateSuggestions[this.templateIndex]
          if (template) {
            event.preventDefault()
            this.selectTemplateSuggestion(template)
            return
          }
        }
        if (event.key === 'Escape') {
          event.preventDefault()
          this.closeTemplateMenu()
        }
      }
    },

    showFiles () {
      this.isShowFileList = true
      if (this.isDialog) {
        this.fileList = this.normalizeFileList(this.clientFiles)
        return
      }
      axios.get(`/api/v1/client-files/${this.client.id}`)
        .then(response => {
          this.fileList = this.normalizeFileList(response.data)
        })
        .catch(() => {
          this.fileList = []
        })
    },

    getFileName (file) {
      return file?.name || file?.uuid || 'Файл'
    },

    normalizeFileList (files) {
      return Array.isArray(files)
        ? files.filter(file => file && file.uuid)
        : []
    },

    toggleFileSortDirection () {
      this.fileSortDirection = this.fileSortDirection === 'desc' ? 'asc' : 'desc'
    },

    getFileDateTime (file) {
      const value = file?.date || file?.createdAt || file?.messageDate
      if (!value) {
        return NaN
      }
      const date = new Date(value)
      return Number.isNaN(date.getTime()) ? NaN : date.getTime()
    },

    getFileDateText (file) {
      const time = this.getFileDateTime(file)
      if (!Number.isFinite(time)) {
        return ''
      }
      return new Date(time).toLocaleString('ru-RU', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
    },

    getFileExt (file) {
      const name = this.getFileName(file)
      if (!name.includes('.')) {
        return 'FILE'
      }
      return name.split('.').pop().toUpperCase()
    },

    getFileTitle (file) {
      const name = this.getFileName(file)
      if (!name.includes('.')) {
        return name
      }
      return name.substring(0, name.lastIndexOf('.'))
    },

    getFileUrl (file) {
      if (!file?.uuid) {
        return '#'
      }
      const category = this.getFileRouteCategory(file)
      return `/files/${category}/${encodeURIComponent(file.uuid)}`
    },

    getFileRouteCategory (file) {
      const type = String(file?.type || '').trim().toLowerCase()
      const name = String(file?.name || '').trim().toLowerCase()
      if (type.startsWith('image/')) {
        return 'images'
      }
      if (type.startsWith('video/')) {
        return 'videos'
      }
      if (type.startsWith('audio/')) {
        return 'audios'
      }
      if (type === 'image' || type === 'images') {
        return 'images'
      }
      if (type === 'video' || type === 'videos') {
        return 'videos'
      }
      if (type === 'audio' || type === 'audios') {
        return 'audios'
      }
      if (type === 'document' || type === 'documents') {
        return 'documents'
      }
      if (
        type.startsWith('application/') ||
        type.startsWith('text/') ||
        name.endsWith('.pdf') ||
        name.endsWith('.doc') ||
        name.endsWith('.docx') ||
        name.endsWith('.xls') ||
        name.endsWith('.xlsx') ||
        name.endsWith('.txt') ||
        name.endsWith('.csv') ||
        name.endsWith('.zip') ||
        name.endsWith('.rar') ||
        name.endsWith('.7z')
      ) {
        return 'documents'
      }
      return 'documents'
    },

    isLastMessage (message) {
      const visibleMessages = this.messages.filter(m => !m.deleted)
      return visibleMessages.length > 0 && visibleMessages[visibleMessages.length - 1].id === message.id
    },

    isIncomingMessage (message) {
      return message && !message.isSent && !message.isComment && !message.deleted
    },

    isOperatorMessage (message) {
      return message && message.isSent && !message.isComment && !message.deleted
    },

    getConversationMessages () {
      return this.messages.filter(message => message && !message.deleted && !message.isComment)
    },

    getLastMessageIndex (messages, predicate) {
      for (let index = messages.length - 1; index >= 0; index--) {
        if (predicate(messages[index])) {
          return index
        }
      }
      return -1
    },

    getMessageIndex (messages, message) {
      const messageId = this.getMessageId(message)
      return messages.findIndex(currentMessage => {
        const currentMessageId = this.getMessageId(currentMessage)
        if (messageId && currentMessageId) {
          return currentMessageId === messageId
        }
        return currentMessage === message
      })
    },

    getLastMessageIndexBefore (messages, beforeIndex, predicate) {
      for (let index = beforeIndex - 1; index >= 0; index--) {
        if (predicate(messages[index])) {
          return index
        }
      }
      return -1
    },

    getFirstMessageIndexAfter (messages, afterIndex, predicate) {
      for (let index = afterIndex + 1; index < messages.length; index++) {
        if (predicate(messages[index])) {
          return index
        }
      }
      return -1
    },

    getAnswerRequiredGroupRange (message) {
      const conversationMessages = this.getConversationMessages()
      const messageIndex = this.getMessageIndex(conversationMessages, message)
      if (messageIndex === -1 || !this.isIncomingMessage(conversationMessages[messageIndex])) {
        return null
      }

      const previousOperatorIndex = this.getLastMessageIndexBefore(
        conversationMessages,
        messageIndex,
        currentMessage => this.isOperatorMessage(currentMessage)
      )
      const nextOperatorIndex = this.getFirstMessageIndexAfter(
        conversationMessages,
        messageIndex,
        currentMessage => this.isOperatorMessage(currentMessage)
      )

      const startIndex = previousOperatorIndex + 1
      const endIndex = nextOperatorIndex === -1
        ? conversationMessages.length - 1
        : nextOperatorIndex - 1

      return {
        conversationMessages,
        startIndex,
        endIndex
      }
    },

    getAnswerRequiredGroupMessages (message) {
      const range = this.getAnswerRequiredGroupRange(message)
      if (!range) {
        return []
      }

      return range.conversationMessages
        .slice(range.startIndex, range.endIndex + 1)
        .filter(currentMessage => this.isIncomingMessage(currentMessage) && this.getMessageId(currentMessage))
    },

    isInAnswerRequiredRange (message) {
      const groupMessages = this.getAnswerRequiredGroupMessages(message)
      if (groupMessages.length === 0) {
        return false
      }

      const conversationMessages = this.getConversationMessages()
      const messageIndex = this.getMessageIndex(conversationMessages, message)
      const lastIncomingIndex = this.getLastMessageIndex(conversationMessages, currentMessage => this.isIncomingMessage(currentMessage))
      const lastOperatorIndex = this.getLastMessageIndex(conversationMessages, currentMessage => this.isOperatorMessage(currentMessage))

      if (messageIndex === -1 || lastIncomingIndex === -1 || lastOperatorIndex > lastIncomingIndex) {
        return false
      }

      return messageIndex > lastOperatorIndex && messageIndex <= lastIncomingIndex
    },

    canSetAnswerRequired (message) {
      return this.showAnswerRequiredActions &&
        this.isIncomingMessage(message) &&
        !!this.getMessageId(message) &&
        this.isInAnswerRequiredRange(message)
    },

    hasAnswerRequiredValue (message) {
      return message && (
        message.answerRequired === 'ANSWER_REQUIRED' ||
        message.answerRequired === 'ANSWER_NOT_REQUIRED'
      )
    },

    getSelectedAnswerRequiredMessageIdInGroup (message) {
      const selectedMessage = [...this.getAnswerRequiredGroupMessages(message)]
        .reverse()
        .find(currentMessage => this.hasAnswerRequiredValue(currentMessage))
      return this.getMessageId(selectedMessage)
    },

    isSelectedAnswerRequiredMessage (message) {
      return this.getSelectedAnswerRequiredMessageIdInGroup(message) === this.getMessageId(message)
    },

    isAnswerRequired (message) {
      return this.isSelectedAnswerRequiredMessage(message) && message.answerRequired === 'ANSWER_REQUIRED'
    },

    isAnswerNotRequired (message) {
      return this.isSelectedAnswerRequiredMessage(message) && message.answerRequired === 'ANSWER_NOT_REQUIRED'
    },

    applyAnswerRequiredLocally (message, answerRequired) {
      const messageId = this.getMessageId(message)
      this.getAnswerRequiredGroupMessages(message).forEach(currentMessage => {
        const currentMessageId = this.getMessageId(currentMessage)
        currentMessage.answerRequired = currentMessageId === messageId
          ? answerRequired
          : 'NOT_SET'
      })
    },

    setAnswerRequired (message, value) {
      const messageId = this.getMessageId(message)
      if (!messageId) {
        this.$q.notify({
          message: 'Нельзя изменить признак ответа: сообщение ещё не сохранено',
          type: 'warning',
          position: 'top-right'
        })
        return
      }
      const answerRequired = value
        ? 'ANSWER_REQUIRED'
        : 'ANSWER_NOT_REQUIRED'
      const groupMessageIds = this.getAnswerRequiredGroupMessages(message)
        .map(currentMessage => this.getMessageId(currentMessage))
        .filter(currentMessageId => currentMessageId)
      const resetMessageIds = groupMessageIds
        .filter(currentMessageId => currentMessageId !== messageId)

      this.applyAnswerRequiredLocally(message, answerRequired)
      this.$emit('setAnswerRequired', {
        messageId,
        clientId: this.client.id,
        answerRequired,
        groupMessageIds,
        resetMessageIds
      })
    },

    getMessageId (message) {
      const id = Number(message?.id)
      return Number.isFinite(id) && id > 0 ? id : null
    },

    getRouteMessageId () {
      const rawMessageId = this.$route?.query?.messageId
      if (Array.isArray(rawMessageId)) {
        return Number(rawMessageId[0])
      }
      const messageId = Number(rawMessageId)
      return Number.isFinite(messageId) && messageId > 0 ? messageId : null
    },

    scrollToRouteMessage () {
      const messageId = this.getRouteMessageId()
      if (!messageId) {
        return
      }
      this.scrollToMessageAfterSearch(messageId)
    },

    findInKnowledgeBase (message) {
      const text = String(message?.text || '').trim()
      if (!text) {
        return
      }
      this.$emit('findInKnowledgeBase', text)
    },

    handlePaste (event) {
      const files = this.getFilesFromClipboard(event)
      if (files.length === 0) {
        return
      }
      event.preventDefault()
      const allowedFiles = files.filter(file => file.size <= 10485760)
      if (allowedFiles.length !== files.length) {
        this.$q.notify({
          message: 'Некоторые файлы больше 10 МБ и не были добавлены',
          type: 'warning',
          position: 'top-right',
          actions: [{
            icon: 'close',
            color: 'white',
            dense: true,
            handler: () => undefined
          }]
        })
      }
      if (allowedFiles.length === 0) {
        return
      }
      this.attachedFiles = [
        ...this.attachedFiles,
        ...allowedFiles
      ]
      this.$q.notify({
        message: `Добавлено из буфера: ${allowedFiles.length}`,
        type: 'positive',
        position: 'top-right',
        actions: [{
          icon: 'close',
          color: 'white',
          dense: true,
          handler: () => undefined
        }]
      })
      this.showListPinedFiles = true
    },

    getFilesFromClipboard (event) {
      const clipboardData = event.clipboardData
      if (!clipboardData) {
        return []
      }
      const files = []
      if (clipboardData.files && clipboardData.files.length > 0) {
        Array.from(clipboardData.files).forEach(file => {
          files.push(this.normalizePastedFile(file))
        })
      }
      if (clipboardData.items && clipboardData.items.length > 0) {
        Array.from(clipboardData.items).forEach(item => {
          if (item.kind !== 'file') {
            return
          }
          const file = item.getAsFile()
          if (!file) {
            return
          }
          const exists = files.some(existingFile =>
            existingFile.name === file.name &&
            existingFile.size === file.size &&
            existingFile.type === file.type
          )
          if (!exists) {
            files.push(this.normalizePastedFile(file))
          }
        })
      }
      return files
    },

    normalizePastedFile (file) {
      if (file.name && file.name.trim().length > 0) {
        return file
      }
      const extension = this.getFileExtensionByType(file.type)
      const fileName = `clipboard-${this.formatClipboardFileDate()}${extension}`
      return new File([file], fileName, {
        type: file.type,
        lastModified: file.lastModified || Date.now()
      })
    },

    getFileExtensionByType (type) {
      if (!type) {
        return ''
      }
      const map = {
        'image/png': '.png',
        'image/jpeg': '.jpg',
        'image/jpg': '.jpg',
        'image/gif': '.gif',
        'image/webp': '.webp',
        'application/pdf': '.pdf',
        'text/plain': '.txt'
      }
      return map[type] || ''
    },

    formatClipboardFileDate () {
      const date = new Date()
      const pad = value => String(value).padStart(2, '0')
      return [
        date.getFullYear(),
        pad(date.getMonth() + 1),
        pad(date.getDate())
      ].join('') + '-' + [
        pad(date.getHours()),
        pad(date.getMinutes()),
        pad(date.getSeconds())
      ].join('')
    },

    canEditMessage (message) {
      return message && !message.deleted && message.text && message.isSent === true
    },

    startEditMessage (message) {
      this.editingMessage = message
      this.replyMessageId = null
      this.replyFileUuid = null
      this.replyFileType = null
      this.attachedFiles = []
      this.$nextTick(() => {
        const textarea = this.$refs.textInput
        if (!textarea) {
          return
        }
        textarea.value = message.text || ''
        textarea.focus()
        textarea.setSelectionRange(textarea.value.length, textarea.value.length)
        this.$emit('keyPressed', textarea.value)
        this.autoResize()
      })
    },

    cancelEditMessage () {
      this.editingMessage = null
      this.$nextTick(() => {
        const textarea = this.$refs.textInput
        if (!textarea) {
          return
        }
        textarea.value = ''
        this.$emit('keyPressed', '')
        this.autoResize()
      })
    },

    getReplyPreviewText (message) {
      const replyText = String(message?.replyMessageText || '').trim()
      if (replyText) {
        return this.shortenLine(replyText, 50)
      }
      const replyFileType = String(message?.replyFileType || '')
      if (replyFileType.startsWith('image/')) {
        return 'Изображение'
      }
      if (replyFileType.startsWith('video/')) {
        return 'Видео'
      }
      if (replyFileType.startsWith('application/')) {
        return 'Документ'
      }
      return 'Сообщение'
    },

    getScrollZone () {
      const chat = document.getElementById(this.isDialog ? 'chat-dialog-pop-up' : 'chat-dialog')
      return chat?.children?.[0]?.children?.[0] || null
    },

    isNearBottom (scrollZone, threshold = 160) {
      if (!scrollZone) {
        return false
      }
      return scrollZone.scrollHeight - scrollZone.clientHeight - scrollZone.scrollTop <= threshold
    },

    markMessagesWheelScrolling () {
      this.isWheelScrollingMessages = true
      if (this.wheelScrollingTimer) {
        clearTimeout(this.wheelScrollingTimer)
      }
      this.wheelScrollingTimer = setTimeout(() => {
        this.isWheelScrollingMessages = false
      }, 180)
    },

    getTextareaMaxHeight () {
      return this.isDialog ? 300 : 400
    },

    getMessageSortTime (message) {
      const rawDate = message?.date
      const time = rawDate instanceof Date
        ? rawDate.getTime()
        : new Date(rawDate || 0).getTime()
      return Number.isFinite(time) ? time : 0
    },

    sortMessagesByDateAndId (messages) {
      if (!Array.isArray(messages)) {
        return []
      }
      return [...messages].sort((a, b) => {
        const dateDiff = this.getMessageSortTime(a) - this.getMessageSortTime(b)
        if (dateDiff !== 0) {
          return dateDiff
        }
        return Number(a?.id || 0) - Number(b?.id || 0)
      })
    },
  },

  computed: {
    typingUsers () {
      if (this.getTypingWatchingUsers()) {
        return this.getTypingWatchingUsers().typing
      } else {
        return []
      }
    },

    watchUsers () {
      if (this.getTypingWatchingUsers()) {
        return this.getTypingWatchingUsers().watching
      } else {
        return []
      }
    },

    renderShortcutPlaceholder () {
      return `${this.isComment ? 'Текст комментария' : 'Текст сообщения'} ${this.isMobile || this.isDialog ? '' : this.isComment ? '\nВведите @ для пинга' : '\nВведите shortcut и нажмите tab чтобы выполнить авто-ввод'}`
    },

    isMacOs () {
      if (typeof navigator === 'undefined') {
        return false
      }

      return /Mac/.test(navigator.platform || '') || /Mac OS X/.test(navigator.userAgent || '')
    },

    sendShortcutText () {
      return this.isMacOs ? 'cmd+enter отправить' : 'ctrl+enter отправить'
    },

    chatStyle () {
      return {
        height: this.isDialog ? 'calc(100% - 93px)' : (this.isMobile ? 'calc(100vh - 181px)' : 'calc(100vh - 95px)'),
        'border-radius': '0',
        'min-height': '0',
        'background-color': '#F0F0F0'
      }
    },

    composerStyle () {
      return {
        borderBottom: '1px solid #0000001f',
        borderTop: this.replyMessageId ? 'none' : '1px solid #0000001f',
        backgroundColor: this.isComment ? '#d1c4e9' : '#ffffff'
      }
    },

    textareaStyle () {
      const maxHeight = this.getTextareaMaxHeight()
      return {
        borderStyle: 'unset',
        margin: '0 8px',
        width: '100%',
        overflowX: 'hidden',
        overflowY: this.textareaHeight >= maxHeight ? 'auto' : 'hidden',
        resize: 'none',
        height: `${this.textareaHeight}px`,
        maxHeight: `${maxHeight}px`,
        transition: 'height 0.2s ease, background-color 0.2s ease',
        backgroundColor: this.isComment ? '#d1c4e9' : '#ffffff',
        color: '#242424'
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
    },

    filteredTemplateSuggestions () {
      return this.getMatchingTemplates(this.templateQuery)
    },

    filteredMentionUsers () {
      if (!this.isComment) {
        return []
      }

      const users = Array.isArray(this.store?.users) ? this.store.users : []
      const q = (this.mentionQuery || '').trim().toLowerCase()
      const toSearchString = (u) => (
        `${u.firstname || ''} ${u.lastname || ''} ${u.username || ''} ${u.email || ''}`
      ).toLowerCase()
      const filtered = q.length === 0
        ? users
        : users.filter(u => toSearchString(u).includes(q))
      return filtered.slice(0, 8)
    },

    sortedFileList () {
      const files = Array.isArray(this.fileList) ? [...this.fileList] : []
      const direction = this.fileSortDirection === 'asc' ? 'asc' : 'desc'
      return files.sort((left, right) => {
        const leftTime = this.getFileDateTime(left)
        const rightTime = this.getFileDateTime(right)
        const leftHasDate = Number.isFinite(leftTime)
        const rightHasDate = Number.isFinite(rightTime)
        if (!leftHasDate && !rightHasDate) {
          return this.getFileName(left).localeCompare(this.getFileName(right), 'ru')
        }
        if (!leftHasDate) {
          return 1
        }
        if (!rightHasDate) {
          return -1
        }
        if (leftTime === rightTime) {
          return this.getFileName(left).localeCompare(this.getFileName(right), 'ru')
        }
        return direction === 'asc'
          ? leftTime - rightTime
          : rightTime - leftTime
      })
    },

    sortedMessages () {
      return this.sortMessagesByDateAndId(this.messages)
    }
  },

  watch: {
    clientFiles: {
      deep: true,
      handler (value) {
        if (!this.isDialog || !this.isShowFileList) {
          return
        }
        this.fileList = this.normalizeFileList(value)
      }
    },

    linkedMessageId () {
      if (!this.linkedMessageId) {
        return
      }
      this.$nextTick(() => {
        this.goToMessage(this.linkedMessageId)
      })
    },

    search (newVal) {
      this.onSearch(newVal)
    },

    messages: {
      immediate: true,
      handler (newVal) {
        try {
          if (this.routeMessageIdToScroll) {
            const messageId = this.routeMessageIdToScroll
            if (this.messages.some(m => Number(m.id) === Number(messageId))) {
              this.$nextTick(() => {
                const scrolled = this.goToMessage(messageId)
                if (scrolled) {
                  this.routeMessageIdToScroll = null
                }
              })
            }
            return
          }
          const messages = this.sortMessagesByDateAndId(newVal)
          this.scheduleMessagesUpdatedEmit()
          const lastMessage = messages[messages.length - 1]
          const currentLastMessageId = this.getMessageId(lastMessage)
          const previousLastMessageId = this.lastKnownLastMessageId
          const previousMessagesLength = this.lastKnownMessagesLength
          this.lastKnownLastMessageId = currentLastMessageId
          this.lastKnownMessagesLength = messages.length
          if (!previousLastMessageId) {
            return
          }
          const messageWasAddedToBottom =
            currentLastMessageId &&
            currentLastMessageId !== previousLastMessageId &&
            messages.length >= previousMessagesLength
          if (!messageWasAddedToBottom) {
            return
          }
          const scrollZone = this.getScrollZone()
          const shouldScrollToBottom = this.isNearBottom(scrollZone)
          if (shouldScrollToBottom) {
            this.$nextTick(() => {
              this.scrollToBottom(0)
            })
          }
        } catch (ignoreError) {
        }
      },
      deep: true
    },

    inputField: {
      immediate: true,
      handler () {
        this.autoResize()
      }
    },

    replyMessageId () {
      this.autoResize()
    },

    '$route.query.messageId' () {
      this.scrollToRouteMessage()
    },
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
        const {
          width,
          height
        } = entry.contentRect
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
  },

  beforeUnmount () {
    Object.values(this.highlightMessageTimers || {}).forEach(timer => clearTimeout(timer))
    this.highlightMessageTimers = {}
    if (this.portionMessagesTimer) {
      clearTimeout(this.portionMessagesTimer)
      this.portionMessagesTimer = null
    }
    if (this.markReadEmitTimer) {
      clearTimeout(this.markReadEmitTimer)
      this.markReadEmitTimer = null
    }
  },
}
</script>

<style scoped>

.action-clouds {
  width: 100%;
  height: auto;
  min-height: 0;
  display: block;
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  color: white;
  font-size: 14px;
  z-index: 50;
  max-width: 100%;
  pointer-events: none;
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
  color: white;
  font-size: 12px;
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
  max-width: calc(100% - 16px);
  pointer-events: none;
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

.chat-message-text {
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  word-break: break-word;
}

:deep(.q-message-text-content) {
  white-space: pre-wrap;
}

.template-suggestions-list {
  min-width: 320px;
  max-height: 280px;
  overflow-y: auto;
  border-radius: 8px;
}

.template-suggestion-item {
  min-height: 58px;
  padding: 8px 12px;
}

.template-suggestion-shortcut {
  max-width: 140px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: monospace;
  font-size: 12px;
}

.template-suggestion-text {
  white-space: normal;
  line-height: 1.35;
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
  background-color: #ffffff;
  transition: background-color 0.2s ease;
}

.input-item--comment {
  background-color: #d1c4e9;
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
:deep(.chat-search-highlight) {
  padding: 1px 4px;
  margin: 0 1px;
  border: 1px solid rgba(147, 0, 245, 0.32);
  border-radius: 5px;
  background-color: rgba(174, 92, 255, 0.72);
  box-shadow: 0 1px 2px rgba(93, 64, 0, 0.16);
  color: #2f2a18;
  font-weight: 600;
  line-height: 1.35;
  box-decoration-break: clone;
  -webkit-box-decoration-break: clone;
}

.answer-required-actions {
  display: flex;
  justify-content: flex-start;
  gap: 8px;
  max-height: 0;
  margin: 0;
  overflow: hidden;
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  transition: opacity 0.15s ease, max-height 0.15s ease, margin 0.15s ease;
  position: relative;
  z-index: 10;
}

.chat-message-row:hover .answer-required-actions,
.answer-required-actions.answer-required-actions--selected {
  max-height: 36px;
  margin: 6px 0 0 0;
  opacity: 1;
  visibility: visible;
  pointer-events: auto;
}

.chat-dialog--wheel-scrolling .chat-message-row:hover .answer-required-actions:not(.answer-required-actions--selected) {
  max-height: 0;
  margin: 0;
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
}

.linked-task-icon {
  margin-left: 8px;
  cursor: pointer;
  color: #5c35f9;
}

.linked-task-icon:hover {
  opacity: 0.75;
}

.typing-users-cloud-row {
  width: 100%;
  display: flex;
  justify-content: center;
  padding-right: 0;
  pointer-events: none;
}

:deep(.q-message-text.chat-message--highlighted),
:deep(.q-message-text-content.chat-message--highlighted) {
  background-color: var(--q-primary) !important;
  color: white !important;
  transition: background-color 0.25s ease, color 0.25s ease;
}

:deep(.q-message-text.chat-message--highlighted *),
:deep(.q-message-text-content.chat-message--highlighted *) {
  color: white !important;
}

:deep(.q-message-text.chat-message--highlighted a),
:deep(.q-message-text-content.chat-message--highlighted a) {
  color: white !important;
  text-decoration-color: white;
}

.file-list-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.file-list-item {
  display: flex;
  align-items: center;
  padding: 6px;
  border: solid 1px rgba(108, 108, 108, 0.2);
  border-radius: 4px;
  text-decoration: none;
  color: inherit;
}

.file-list-ext {
  padding: 2px 8px;
  border-radius: 4px;
  background-color: rgba(255, 149, 0, 1);
  color: white;
  font-size: 12px;
  margin-right: 8px;
  flex: 0 0 auto;
}

.file-list-info {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.file-list-date {
  font-size: 12px;
  color: rgba(0, 0, 0, 0.54);
}

.chat-go-latest-btn {
  width: auto;
  min-width: 36px;
  height: 36px;
  position: absolute;
  z-index: 1;
  right: 5px;
  opacity: 0.92;
  background-color: white;
  border-radius: 4px;
  margin-bottom: 5px;
}

.chat-message-row {
  content-visibility: auto;
  contain-intrinsic-size: 90px;
}
</style>
