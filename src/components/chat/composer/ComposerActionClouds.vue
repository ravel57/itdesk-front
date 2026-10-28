<template>
  <div
    v-if="attachedFiles.length > 0 ||
    othersTypingCount > 0 ||
    raised ||
    othersWatchingCount > 0"
    :style="raised ? 'bottom: 210%;' : 'bottom: 100%;'"
    class="action-clouds"
  >
    <div class="input-clouds-container">
      <div class="typing-users-cloud-row">
        <div
          class="typing-users-cloud"
          v-if="othersTypingCount > 0 ||
          othersWatchingCount > 0
          "
        >
          <div
            v-if="watchUsers.length > 0"
            style="margin-right: 8px"
          >
            <q-icon name="visibility"/>
            {{ watchUsers.join(', ') }}
          </div>
          <div v-if="typingUsers.length > 0">
            <q-icon name="border_color"/>
            {{ typingUsers.join(', ') }} {{ typingUsers.length > 1 ? ' печатают...' : ' печатает...' }}
          </div>
        </div>
      </div>
      <div
        v-if="attachedFiles.length > 2"
        class="attach-file-card"
        style="cursor: pointer;"
        @click="$emit('showFiles')"
      >
        Еще {{ attachedFiles.length - 2 }} файла...
      </div>
      <div
        v-for="(file, index) in attachedFiles"
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
            @click="$emit('removeFile', index)"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { getTypingWatchingUsers } from 'src/util/chatComposer/presence'

// Облака над полем ввода: кто печатает / смотрит заявку и список прикреплённых файлов (первые два)
export default {
  name: 'ComposerActionClouds',

  props: {
    attachedFiles: {
      default: () => [],
      type: Array
    },
    typing: {
      default: () => [],
      type: Array
    },
    taskWatchingNow: {
      default: () => [],
      type: Array
    },
    currentUser: { type: Object },
    // Над полем ввода показана панель ответа/редактирования — облака поднимаются выше
    raised: { type: Boolean }
  },

  emits: ['showFiles', 'removeFile'],

  computed: {
    othersTypingCount () {
      return this.typing.filter(t => t.username !== this.currentUser.username).length
    },

    othersWatchingCount () {
      return this.taskWatchingNow.filter(user => user.id !== this.currentUser.id).length
    },

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
    }
  },

  methods: {
    getTypingWatchingUsers () {
      return getTypingWatchingUsers({
        typing: this.typing,
        taskWatchingNow: this.taskWatchingNow,
        currentUser: this.currentUser
      })
    }
  }
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
  /* Родитель .action-clouds — pointer-events: none (чтобы не мешать кликам по чату
     в пустых местах оверлея), эта карточка — реально кликабельная, поэтому включаем обратно. */
  pointer-events: auto;
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

.input-clouds-container {
  padding: 0 4px;
  position: absolute;
  width: 100%;
  display: flex;
  flex-direction: column;
  flex-wrap: nowrap;
  bottom: 0;
}

.truncate {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.typing-users-cloud-row {
  width: 100%;
  display: flex;
  justify-content: center;
  padding-right: 0;
  pointer-events: none;
}
</style>
