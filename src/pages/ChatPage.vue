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
        class="bg-primary text-white shadow-2"
        :breakpoint="0"
      >
        <q-tab name="tab1" icon="forum"/>
        <q-tab name="tab2" icon="database"/>
        <q-tab name="tab3" icon="info"/>
      </q-tabs>
    </div>
    <q-page
      style="padding: 8px; height: calc(100vh - 98px); min-height: auto"
    >
      <div
        class="q-gutter-sm row"
        style="height: calc(100vh - 62px)"
      >
        <div
          class="col"
          v-if="!this.isMobile || this.tab === 'tab1'"
        >
          <chat-dialog
            :messages="this.getClient.messages"
            :inputField="this.inputField"
            :templates="this.store.templates"
            :isSending="this.isSending"
            :clientId="this.getClient.id"
            :typing="this.getClient.typingUsers"
            :currentUser="this.store.currentUser"
            @sendMessage="this.sendMessage"
            @keyPressed="this.keyPressed($event)"
            @updated="this.markMessagesRead"
            @isSending="this.isSending = true"
          />
        </div>
        <div
          class="col"
          v-if="!this.isMobile || this.tab === 'tab2'"
        >
          <chat-helper
            :templates="this.store.templates"
            :macros="this.macros"
            :knowledgeBase="this.knowledgeBase"
            @onTemplateClick="onTemplateClick"
          />
        </div>

        <div
          class="col"
          v-if="!this.isMobile || this.tab === 'tab3'"
          style="height: 100%;"
        >
          <chat-info
            style="z-index: 1"
            :client="this.getClient"
            :organizations="this.store.organizations"
            @changeClient="this.changeClient"
          />
          <chat-tasks
            :tasks="this.getClient.tasks"
            :isNotificationEnabled="isNotificationEnabled"
            :tags="this.store.tags"
            :users="this.store.users"
            :client="this.getClient"
            :statuses="this.store.statuses"
            :priorities="this.store.priorities"
            @newTask="this.newTask"
            @updateTask="this.updateTask"
          />
        </div>
      </div>
    </q-page>
  </div>
</template>

<script>
import ChatDialog from 'components/chat/ChatDialog.vue'
import ChatHelper from 'components/chat/ChatHelper.vue'
import ChatClientInfo from 'components/chat/ChatClientInfo.vue'
import ChatTasks from 'components/chat/ChatTasks.vue'
import { useStore } from 'stores/store'
import { useRoute } from 'vue-router'
import { markRead, typing } from 'src/util/ws'

export default {
  components: { ChatTasks, ChatInfo: ChatClientInfo, ChatHelper, ChatDialog },

  data: () => ({
    tab: 'tab1',
    macros: [],
    knowledgeBase: [
      { title: 'Доменны', texts: ['*.jopa.ru', '*.zalupa.ru', '*.penis.ru', '*.her.ru'], tags: [] },
      { title: 'Админки', texts: ['admin.jopa.ru'], tags: [] },
      { title: 'Почты', texts: ['mail.jopa.ru'], tags: [] },
      { title: 'Адреса удаленок', texts: ['rdp.jopa.ru'], tags: [] }
    ],
    inputField: '',
    isComment: false,
    isNotificationEnabled: true,
    isSending: false
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
        markRead(this.getClient.id)
      }
    },

    changeClient (newClient) {
      this.store.clients[this.store.clients.indexOf(this.getClient)] = newClient
    },

    newTask (task) {
      this.getClient.tasks.push(task.data)
    },

    updateTask (task, newTask) {
      this.getClient.tasks[this.getClient.tasks.indexOf(task)] = newTask.data
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
    this.markMessagesRead()
  },

  created () {
    this.inputField = this.store.clients.find(client => client.id === this.getClient.id).typingMessageText[this.store.currentUser.id]
  },

  setup () {
    const store = useStore()
    const router = useRoute()
    return { store, router }
  }
}
</script>

<style scoped>
.sticky-tabs {
  position: sticky;
  top: 0;
  z-index: 1;
}
</style>
