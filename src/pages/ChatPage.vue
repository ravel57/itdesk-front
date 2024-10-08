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
        class="row"
        :style="this.isMobile ? 'height: calc(100vh - 90px)' : ''"
      >
        <div
          v-if="!this.isMobile || this.tab === 'tab1'"
          id="chatColumn"
          class="col no-shadow"
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
          class="col no-shadow"
          v-if="(!this.isMobile || this.tab === 'tab2') && (this.isShowHelper || this.isMobile) && ['ADMIN', 'OPERATOR'].includes(this.store.currentUser.authorities[0])"
          :style="!this.isMobile ? 'max-width: 22vw' : ''"
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
          class="col no-shadow"
          v-if="!this.isMobile || this.tab === 'tab3'"
          :style="!this.isMobile ? 'max-width: 22vw;min-width:452px;' : ''"
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
    pageCounter: 0
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
    }
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
    }
  },

  mounted () {
    if (this.isMobile) {
      this.tab = 'tab3'
    }
    this.markMessagesRead()
    this.isShowHelper = localStorage.getItem('isShowHelper') !== 'false'
    const typingMessageTextElement = this.store.clients
      .find(client => client.id === this.getClient.id)
    if (typingMessageTextElement.typingMessageText[this.store.currentUser.id]) {
      this.inputField = typingMessageTextElement.typingMessageText[this.store.currentUser.id]
    }
  },

  created () {
    this.getMessagePage()
    this.isShowHelper = localStorage.getItem('isShowHelper') !== 'false'
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
  }
}
</script>

<style scoped>

</style>
