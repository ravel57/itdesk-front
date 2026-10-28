<template>
  <div style="position: relative">
    <q-card
      data-tour="chat-message-search"
      class="search-container no-shadow"
      style="background-color: #F0F0F0"
    >
      <div id="messageSearch" class="search">
        <q-input
          :model-value="this.modelValue"
          @update:model-value="this.$emit('update:modelValue', $event)"
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
          v-if="this.showFilesAction && !this.isMobile"
          icon="attach_file"
          @click="this.$emit('showFiles')"
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
          @click="this.$emit('scrollToMessage', message.id)"
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
              :style="'background-color: ' + nameToPastelHex(this.getClientDisplayName(this.client)) + ';'"
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
</template>

<script>
import axios from 'axios'
import { getClientDisplayName, getClientAvatarAbbreviation } from 'src/util/clientName'
import { getMessageSenderName, highlightSearchText } from 'src/util/chatMessageText'

// Шапка чата: поиск по сообщениям (результаты показываются выпадающим списком) и кнопка списка файлов
export default {

  name: 'ChatMessageSearch',

  props: {
    // Поисковая строка (v-model)
    modelValue: { type: String },
    client: { type: Object },
    // Отсортированные сообщения чата (для локального поиска в портале клиента)
    messages: { type: Array },
    isDialog: {
      default: false,
      type: Boolean
    },
    isMobile: { type: Boolean },
    portalMode: {
      default: false,
      type: Boolean
    },
    showFilesAction: {
      default: true,
      type: Boolean
    }
  },

  emits: ['update:modelValue', 'scrollToMessage', 'showFiles'],

  data: () => ({
    searchResults: [],
    isShowSearchResults: false
  }),

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

    getClientDisplayName (client) {
      return getClientDisplayName(client)
    },

    getAbbreviation (client) {
      return getClientAvatarAbbreviation(client)
    },

    getName (message) {
      return getMessageSenderName(message)
    },

    highlightSearchText (text) {
      return highlightSearchText(text, this.modelValue)
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

    getSearchTitle (message) {
      if (this.getName(message) !== '') {
        return `${this.getName(message)} : ${message.text}`
      } else {
        return `${getClientDisplayName(this.client)} : ${message.text}`
      }
    },

    onSearch () {
      if (this.modelValue) {
        if (this.portalMode) {
          const needle = String(this.modelValue || '').trim().toLowerCase()
          this.searchResults = this.messages.filter(message => {
            const haystack = [
              message?.text,
              message?.fileName,
              message?.senderName,
              this.getName(message)
            ].map(value => String(value || '').toLowerCase()).join(' ')
            return haystack.includes(needle)
          })
          this.isShowSearchResults = true
          return
        }
        let requestUri = `/api/v1/client/${this.client.id}/search-messages`
        if (this.isDialog) {
          const queryParams = new URLSearchParams(window.location.search)
          const taskId = queryParams.get('task')
          requestUri = `/api/v1/client/${this.client.id}/task/${taskId}/search-messages`
        }
        axios.post(requestUri, { text: this.modelValue })
          .then(response => {
            this.searchResults = response.data
          })
          .catch(e =>
            this.$q.notify({
              message: e.message,
              type: 'negative'
            }))
        this.isShowSearchResults = true
      } else {
        this.searchResults = []
        setTimeout(() => {
          this.isShowSearchResults = false
        }, 300)
      }
    },

    onBlur () {
      setTimeout(() => {
        this.isShowSearchResults = false
      }, 300)
    }
  },

  watch: {
    modelValue (newVal) {
      this.onSearch(newVal)
    }
  }
}
</script>

<style scoped>
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
</style>
