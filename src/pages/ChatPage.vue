<template>
  <div>
    <div
      v-if="this.isMobile"
      class="sticky-tabs"
    >
      <q-tabs
        v-model="tab"
        dense
        align="justify"
        class="bg-primary text-white"
        :breakpoint="0"
      >
        <q-tab name="tab1" icon="forum"/>
        <q-tab name="tab2" icon="database" v-if="this.isShowHelper || this.isMobile"/>
        <q-tab name="tab3" icon="info"/>
      </q-tabs>
    </div>
    <q-page
      style="min-height: auto"
    >
      <div
        ref="chatPageLayout"
        class="chat-page-layout"
        :class="{ 'chat-page-layout-mobile': this.isMobile }"
        :style="this.isMobile ? 'height: calc(100vh - 90px)' : desktopGridStyle"
      >
        <div
          v-if="!this.isMobile || this.tab === 'tab1'"
          id="chatColumn"
          class="chat-page-column no-shadow"
        >
          <chat-dialog
            :isMobile="this.isMobile"
            :messages="this.getClient.messages"
            :inputField="this.inputField"
            :templates="this.store.templates"
            :isSending="this.isSending"
            :clientId="this.getClient.id"
            :typing="this.getClient.typingUsers"
            :currentUser="this.store.currentUser"
            :linkedMessageId="this.linkedMessageId"
            :tasks="this.getClient.tasks"
            :task-watching-now="this.getClient.watchingUsers"
            :deleteClient="this.deleteClient"
            :isShowHelper="this.isShowHelper"
            :client="this.getClient"
            :isEnd="this.isEnd"
            @sendMessage="this.sendMessage"
            @keyPressed="this.keyPressed($event)"
            @updated="this.markMessagesRead"
            @isSending="this.isSending = true"
            @pastToInputField="pastToInputField"
            @linkToTask="this.linkToTask"
            @clearLinkedMessageId="this.clearLinkedMessageId"
            @deleteMessage="this.deleteMessage"
            @showHelper="this.showHelper"
            @getMessagePage="this.getMessagePage"
            @scrollToMessageAfterSearch="this.getMessageOnSearch($event)"
          />
        </div>
        <div
          v-if="!this.isMobile && isHelperVisible"
          class="chat-page-column-resizer"
          @mousedown="startColumnResize('chat-helper', $event)"
        />

        <div
          class="chat-page-column no-shadow"
          v-if="(!this.isMobile || this.tab === 'tab2') && (this.isShowHelper || this.isMobile) && ['ADMIN', 'OPERATOR'].includes(this.store.currentUser.authorities[0])"
        >
          <chat-helper
            :isMobile="this.isMobile"
            :templates="this.store.templates"
            :knowledgeBase="this.store.knowledgeBase"
            @onTemplateClick="onTemplateClick"
            @hideHelper="this.hideHelper"
          />
        </div>

        <div
          v-if="!this.isMobile && isHelperVisible"
          class="chat-page-column-resizer"
          @mousedown="startColumnResize('helper-tasks', $event)"
        />

        <div
          class="chat-page-column no-shadow"
          v-if="!this.isMobile || this.tab === 'tab3'"
        >
          <chat-tasks
            :tasks="this.getClient.tasks"
            :isNotificationEnabled="isNotificationEnabled"
            :tags="this.store.tags"
            :users="this.store.users"
            :organizations="this.store.organizations"
            :client="this.getClient"
            :statuses="this.store.statuses"
            :priorities="this.store.priorities"
            :is-mobile="this.isMobile"
            @newTask="this.newTask"
            @updateTask="this.updateTask"
            @scrollToElementById="this.getLinkedMessage($event)"
          />
        </div>
      </div>
    </q-page>
  </div>
</template>

<script>
import ChatDialog from 'components/chat/ChatDialog.vue'
import ChatHelper from 'components/chat/ChatHelper.vue'
import ChatTasks from 'components/chat/ChatTasks.vue'
import { useStore } from 'stores/store'
import { useRoute } from 'vue-router'
import { markRead, typing } from 'src/util/ws'
import axios from 'axios'

export default {
  components: { ChatTasks, ChatHelper, ChatDialog },

  data: () => ({
    tab: 'tab1',
    inputField: '',
    isComment: false,
    isNotificationEnabled: true,
    isSending: false,
    linkedMessageId: null,
    isShowHelper: true,
    isEnd: false,
    pageCounter: 0,

    chatColumnWidth: 0,
    helperColumnWidth: 0,
    tasksColumnWidth: 0,

    columnResizeStorageKey: 'chatPage.columnWidthRatios',
    columnWidthRatios: {
      chat: 0.56,
      helper: 0.22,
      tasks: 0.22
    },

    minChatColumnWidth: 420,
    minHelperColumnWidth: 260,
    minTasksColumnWidth: 452,

    resizingColumn: null,
    resizeStartX: 0,
    resizeStartLeftWidth: 0,
    resizeStartRightWidth: 0
  }),

  methods: {
    onTemplateClick (text) {
      this.inputField += ' ' + text
    },

    sendMessage (event) {
      if (event.attachedFiles && event.attachedFiles.length > 0) {
        const formData = new FormData()
        event.attachedFiles.forEach(file => {
          formData.append('files', file)
        })
        axios.post('/files/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
          .then(response => {
            response.data.map((fileUuid, index) => ({
              fileUuid,
              fileName: event.attachedFiles[index].name,
              fileType: event.attachedFiles[index].type
            })).forEach(message => {
              this.sendTextMessage(message)
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
        this.sendTextMessage(event.message)
      }
    },

    sendTextMessage (message) {
      axios.post(`/api/v1/client/${this.getClient.id}/message`, message)
        .then(() => {
          this.isSending = false
          if (message.replyMessageId) {
            message.replyMessageText = this.getClient.messages.find(msg => msg.id === message.replyMessageId).text
          }
          // this.getClient.messages.push(message)
          this.keyPressed('')
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
    },

    keyPressed (text) {
      this.inputField = text
      typing(this.getClient, this.store.currentUser, text)
    },

    markMessagesRead () {
      if (this.getClient.id) {
        markRead(this.getClient)
      }
    },

    updateClient (newClient) {
      this.store.clients[this.store.clients.indexOf(this.getClient)] = newClient
    },

    newTask (task) {
      this.getClient.tasks.push(task.data)
    },

    updateTask (oldTask, newTask) {
      const updatedTask = newTask.data ? newTask.data : newTask
      const index = this.getClient.tasks.findIndex(task => task.id === updatedTask.id)
      if (index !== -1) {
        this.getClient.tasks[index] = updatedTask
      }
    },

    pastToInputField (text) {
      this.inputField = text
      typing(this.getClient, this.store.currentUser, text)
    },

    linkToTask (message, oldTask) {
      const task = {
        id: oldTask.id,
        name: oldTask.name,
        description: oldTask.description,
        status: oldTask.status,
        priority: oldTask.priority,
        executor: oldTask.executor,
        tags: oldTask.tags,
        completed: oldTask.completed,
        createdAt: oldTask.createdAt,
        deadline: oldTask.deadline,
        linkedMessageId: oldTask.linkedMessageId,
        sla: oldTask.sla
      }
      axios.post(`/api/v1/client/${this.getClient.id}/link-message-to-task`, { message, task })
        .then(() => {
          if (this.getClient.messages.find(msg => msg.id === oldTask.linkedMessageId)) {
            this.getClient.messages.find(msg => msg.id === oldTask.linkedMessageId).linkedTaskId = null
          }
          this.getClient.messages.find(msg => msg.id === message.id).linkedTaskId = oldTask.id
        })
        .catch(e => {
          this.$q.notify({
            message: e.message,
            type: 'negative',
            position: 'top-right',
            actions: [{
              icon: 'close', color: 'white', dense: true, handler: () => undefined
            }]
          })
        })
    },

    clearLinkedMessageId () {
      this.linkedMessageId = null
    },

    deleteMessage (message) {
      axios.delete(`/api/v1/client/${this.getClient.id}/delete-message/${message.id}`)
        .catch(e => {
          this.$q.notify({
            message: e.message,
            type: 'negative',
            position: 'top-right',
            actions: [{
              icon: 'close', color: 'white', dense: true, handler: () => undefined
            }]
          })
        })
    },

    deleteClient () {
      this.store.clients = this.store.clients.filter(client => client.id !== this.getClient.id)
      this.$router.push('/')
    },

    showHelper () {
      this.isShowHelper = true
      localStorage.setItem('isShowHelper', 'true')
    },

    hideHelper () {
      this.isShowHelper = false
      this.tab = 'tab1'
      localStorage.setItem('isShowHelper', 'false')
    },

    getMessagePage (pageCounter = 0) {
      this.pageCounter += pageCounter
      if (this.pageCounter <= 1) {
        this.getClient.messages = this.store.currentChatMessageData.messages
        this.isEnd = this.store.currentChatMessageData.isEnd
      } else {
        axios.get(`/api/v1/client/${this.getClient.id}/messages-page?page=${this.pageCounter}`)
          .then(response => {
            const messages = response.data.messages
            this.isEnd = response.data.isEnd
            messages.forEach(message => { message.date = new Date(message.date) })
            this.getClient.messages = messages.concat(this.getClient.messages)
          })
      }
    },

    getMessageOnSearch (messageId) {
      axios.get(`/api/v1/client/${this.getClient.id}/linked-message?linkedMessageId=${messageId}`)
        .then(response => {
          const messages = response.data.messages
          this.pageCounter = response.data.page
          this.isEnd = response.data.isEnd
          messages.forEach(message => { message.date = new Date(message.date) })
          this.getClient.messages = messages
        })
    },

    getLinkedMessage (task) {
      const taskWithLinkedMessage = this.getClient.messages.filter(m => m.id === task.linkedMessageId)
      if (taskWithLinkedMessage.length > 0) {
        this.linkedMessageId = task.linkedMessageId
      } else {
        axios.get(`/api/v1/client/${this.getClient.id}/linked-message?linkedMessageId=${task.linkedMessageId}`)
          .then(response => {
            const messages = response.data.messages
            this.pageCounter = response.data.page
            this.isEnd = response.data.isEnd
            messages.forEach(message => { message.date = new Date(message.date) })
            this.getClient.messages = messages
            setTimeout(() => { this.linkedMessageId = task.linkedMessageId }, 100)
          })
      }
    },

    initColumnWidths () {
      if (this.isMobile || !this.$refs.chatPageLayout) {
        return
      }

      const savedRatios = localStorage.getItem(this.columnResizeStorageKey)

      if (savedRatios) {
        try {
          const parsedRatios = JSON.parse(savedRatios)

          if (
            Number(parsedRatios.chat) > 0 &&
            Number(parsedRatios.helper) > 0 &&
            Number(parsedRatios.tasks) > 0
          ) {
            this.columnWidthRatios = {
              chat: Number(parsedRatios.chat),
              helper: Number(parsedRatios.helper),
              tasks: Number(parsedRatios.tasks)
            }
          }
        } catch (e) {
          localStorage.removeItem(this.columnResizeStorageKey)
        }
      }

      this.applyColumnWidthsFromRatios()
    },

    startColumnResize (resizeType, event) {
      if (this.isMobile) {
        return
      }

      this.resizingColumn = resizeType
      this.resizeStartX = event.clientX

      if (resizeType === 'chat-helper') {
        this.resizeStartLeftWidth = this.chatColumnWidth
        this.resizeStartRightWidth = this.helperColumnWidth
      }

      if (resizeType === 'helper-tasks') {
        this.resizeStartLeftWidth = this.helperColumnWidth
        this.resizeStartRightWidth = this.tasksColumnWidth
      }

      document.body.style.userSelect = 'none'
      document.body.style.cursor = 'col-resize'

      window.addEventListener('mousemove', this.resizeColumns)
      window.addEventListener('mouseup', this.stopColumnResize)
    },

    resizeColumns (event) {
      if (!this.resizingColumn) {
        return
      }
      const delta = event.clientX - this.resizeStartX
      const minChatWidth = this.minChatColumnWidth
      const minHelperWidth = this.minHelperColumnWidth
      const minTasksWidth = this.minTasksColumnWidth
      if (this.resizingColumn === 'chat-helper') {
        const totalWidth = this.resizeStartLeftWidth + this.resizeStartRightWidth
        let nextChatWidth = this.resizeStartLeftWidth + delta
        let nextHelperWidth = this.resizeStartRightWidth - delta
        if (nextChatWidth < minChatWidth) {
          nextChatWidth = minChatWidth
          nextHelperWidth = totalWidth - nextChatWidth
        }
        if (nextHelperWidth < minHelperWidth) {
          nextHelperWidth = minHelperWidth
          nextChatWidth = totalWidth - nextHelperWidth
        }
        this.chatColumnWidth = nextChatWidth
        this.helperColumnWidth = nextHelperWidth
      }
      if (this.resizingColumn === 'helper-tasks') {
        const totalWidth = this.resizeStartLeftWidth + this.resizeStartRightWidth
        let nextHelperWidth = this.resizeStartLeftWidth + delta
        let nextTasksWidth = this.resizeStartRightWidth - delta
        if (nextHelperWidth < minHelperWidth) {
          nextHelperWidth = minHelperWidth
          nextTasksWidth = totalWidth - nextHelperWidth
        }
        if (nextTasksWidth < minTasksWidth) {
          nextTasksWidth = minTasksWidth
          nextHelperWidth = totalWidth - nextTasksWidth
        }
        this.helperColumnWidth = nextHelperWidth
        this.tasksColumnWidth = nextTasksWidth
      }
    },

    stopColumnResize () {
      if (this.resizingColumn) {
        this.saveColumnWidths()
      }

      this.resizingColumn = null

      document.body.style.userSelect = ''
      document.body.style.cursor = ''

      window.removeEventListener('mousemove', this.resizeColumns)
      window.removeEventListener('mouseup', this.stopColumnResize)
    },

    saveColumnWidths () {
      const totalWidth = this.chatColumnWidth + this.helperColumnWidth + this.tasksColumnWidth
      if (totalWidth <= 0) {
        return
      }
      this.columnWidthRatios = {
        chat: this.chatColumnWidth / totalWidth,
        helper: this.helperColumnWidth / totalWidth,
        tasks: this.tasksColumnWidth / totalWidth
      }

      localStorage.setItem(
        this.columnResizeStorageKey,
        JSON.stringify(this.columnWidthRatios)
      )
    },

    applyColumnWidthsFromRatios () {
      if (this.isMobile || !this.$refs.chatPageLayout) {
        return
      }

      const layoutWidth = this.$refs.chatPageLayout.clientWidth
      const resizersWidth = this.isHelperVisible ? 16 : 8
      const availableWidth = layoutWidth - resizersWidth

      if (availableWidth <= 0) {
        return
      }

      if (this.isHelperVisible) {
        const widths = this.calculateColumnsByRatios(
          availableWidth,
          ['chat', 'helper', 'tasks'],
          {
            chat: this.minChatColumnWidth,
            helper: this.minHelperColumnWidth,
            tasks: this.minTasksColumnWidth
          }
        )

        this.chatColumnWidth = widths.chat
        this.helperColumnWidth = widths.helper
        this.tasksColumnWidth = widths.tasks
      } else {
        const widths = this.calculateColumnsByRatios(
          availableWidth,
          ['chat', 'tasks'],
          {
            chat: this.minChatColumnWidth,
            tasks: this.minTasksColumnWidth
          }
        )

        this.chatColumnWidth = widths.chat
        this.tasksColumnWidth = widths.tasks
      }
    },

    calculateColumnsByRatios (availableWidth, columns, minWidths) {
      const result = {}
      let remainingWidth = availableWidth
      let remainingColumns = [...columns]

      while (remainingColumns.length > 0) {
        const ratioSum = remainingColumns.reduce((sum, column) => {
          return sum + this.columnWidthRatios[column]
        }, 0)
        const tooSmallColumns = []
        remainingColumns.forEach(column => {
          const width = remainingWidth * (this.columnWidthRatios[column] / ratioSum)

          if (width < minWidths[column]) {
            result[column] = minWidths[column]
            tooSmallColumns.push(column)
          }
        })
        if (tooSmallColumns.length === 0) {
          remainingColumns.forEach(column => {
            result[column] = Math.round(
              remainingWidth * (this.columnWidthRatios[column] / ratioSum)
            )
          })
          break
        }
        tooSmallColumns.forEach(column => {
          remainingWidth -= minWidths[column]
        })
        remainingColumns = remainingColumns.filter(column => !tooSmallColumns.includes(column))
        if (remainingWidth <= 0) {
          remainingColumns.forEach(column => {
            result[column] = minWidths[column]
          })
          break
        }
      }
      return result
    },

    handleWindowResize () {
      if (this.resizingColumn) {
        return
      }
      this.applyColumnWidthsFromRatios()
    },
  },

  computed: {
    getClient () {
      const clientId = Number(this.router.params.clientId)
      const client = this.store.clients.find(client => client.id === clientId)
      if (client) {
        return client
      } else {
        return {
          messages: [],
          tasks: [],
          id: clientId
        }
      }
    },

    isMobile () {
      return this.$q.screen.width < 1023
    },

    isHelperVisible () {
      return this.isShowHelper &&
        ['ADMIN', 'OPERATOR'].includes(this.store.currentUser.authorities[0])
    },

    desktopGridStyle () {
      if (this.isMobile) {
        return ''
      }
      if (this.isHelperVisible) {
        return {
          height: '100vh',
          gridTemplateColumns: `${this.chatColumnWidth}px 8px ${this.helperColumnWidth}px 8px ${this.tasksColumnWidth}px`
        }
      }
      return {
        height: '100vh',
        gridTemplateColumns: `${this.chatColumnWidth}px 8px ${this.tasksColumnWidth}px`
      }
    },
  },

  mounted () {
    this.isShowHelper = localStorage.getItem('isShowHelper') !== 'false'
    this.$nextTick(() => {
      this.initColumnWidths()
      window.addEventListener('resize', this.handleWindowResize)
    })
    if (this.isMobile) {
      this.tab = 'tab3'
    }
    this.markMessagesRead()
    const typingMessageTextElement = this.store.clients
      .find(client => client.id === this.getClient.id)
    if (typingMessageTextElement.typingMessageText[this.store.currentUser.id]) {
      this.inputField = typingMessageTextElement.typingMessageText[this.store.currentUser.id]
    }
  },

  created () {
    this.getMessagePage()
    const typingMessageTextElement = this.store.clients
      .find(client => client.id === this.getClient.id)
      .typingMessageText[this.store.currentUser.id]
    if (typingMessageTextElement) {
      this.inputField = typingMessageTextElement
    }
  },

  setup () {
    const store = useStore()
    const router = useRoute()
    return { store, router }
  },

  beforeUnmount () {
    this.stopColumnResize()
    window.removeEventListener('resize', this.handleWindowResize)
  },
}
</script>

<style scoped>
.chat-page-layout {
  display: grid;
  width: 100%;
  overflow: hidden;
}

.chat-page-layout-mobile {
  display: block;
  overflow: auto;
}

.chat-page-column {
  min-width: 0;
  height: 100%;
  overflow: hidden;
}

.chat-page-column-resizer {
  width: 8px;
  height: 100%;
  cursor: col-resize;
  position: relative;
  z-index: 5;
}

.chat-page-column-resizer::before {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  left: 3px;
  width: 2px;
  background: #0000001f;
}

.chat-page-column-resizer:hover::before {
  background: var(--q-primary);
}
</style>
