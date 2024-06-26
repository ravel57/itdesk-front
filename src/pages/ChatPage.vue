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
      style="padding: 8px; height: calc(100vh - 98px); min-height: auto"
    >
      <div
        class="q-gutter-sm row"
        :style="this.isMobile ? 'height: calc(100vh - 90px)' : 'height: calc(100vh - 62px)'"
      >
        <div
          v-if="!this.isMobile || this.tab === 'tab1'"
          id="chatColumn"
          class="col no-shadow rounded-borders"
          style="border: solid #E8E8E8 1px"
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
            @sendMessage="this.sendMessage"
            @keyPressed="this.keyPressed($event)"
            @updated="this.markMessagesRead"
            @isSending="this.isSending = true"
            @pastToInputField="pastToInputField"
            @linkToTask="this.linkToTask"
            @clearLinkedMessageId="this.clearLinkedMessageId"
            @deleteMessage="this.deleteMessage"
            @showHelper="this.showHelper"
          />
        </div>
        <div
          class="col no-shadow rounded-borders"
          v-if="(!this.isMobile || this.tab === 'tab2') && (this.isShowHelper || this.isMobile) && ['ADMIN', 'OPERATOR'].includes(this.store.currentUser.authorities[0])"
        >
          <chat-helper
            :isMobile="this.isMobile"
            :templates="this.store.templates"
            :macros="this.macros"
            :knowledgeBase="this.store.knowledgeBase"
            @onTemplateClick="onTemplateClick"
            @hideHelper="this.hideHelper"
          />
        </div>

        <div
          class="col no-shadow rounded-borders"
          v-if="!this.isMobile || this.tab === 'tab3'"
          :style="!this.isMobile ? 'max-width: 33vw' : ''"
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
            @scrollToElementById="this.linkedMessageId = $event"
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
    macros: [], // FIXME
    inputField: '',
    isComment: false,
    isNotificationEnabled: true,
    isSending: false,
    linkedMessageId: null,
    isShowHelper: true
  }),

  methods: {
    onTemplateClick (text) {
      this.inputField += ' ' + text
    },

    sendMessage (message) {
      this.inputField = ''
      this.isSending = false
      this.getClient.messages.push(message)
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

    updateTask (task, newTask) {
      this.getClient.tasks[this.getClient.tasks.indexOf(task)] = newTask.data
    },

    pastToInputField (text) {
      this.inputField = text
      typing(this.getClient, this.store.currentUser, text)
    },

    linkToTask (message, task) {
      axios.post(`/api/v1/client/${this.getClient.id}/link-message-to-task`, { message, task })
        .then(response => {
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
        .then(response => {
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

    deleteClient () {
      this.store.clients = this.store.clients.filter(client => client.id !== this.getClient.id)
      this.router.push('/')
    },

    showHelper () {
      this.isShowHelper = true
      localStorage.setItem('isShowHelper', 'true')
    },

    hideHelper () {
      this.isShowHelper = false
      this.tab = 'tab1'
      localStorage.setItem('isShowHelper', 'false')
    }
  },

  computed: {
    getClient () {
      const clientId = Number(this.router.params.clientId)
      const client = this.store.clients.filter(client => client.id === clientId)[0]
      if (client !== undefined) {
        return client
      } else {
        return {
          messages: [],
          tasks: []
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
  },

  created () {
    const typingMessageTextElement = this.store.clients
      .find(client => client.id === this.getClient.id)
      .typingMessageText[this.store.currentUser.id]
    if (typingMessageTextElement) {
      this.inputField = typingMessageTextElement
    }
    this.isShowHelper = localStorage.getItem('isShowHelper') !== 'false'
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
