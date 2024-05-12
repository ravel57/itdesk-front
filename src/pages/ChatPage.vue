<template>
  <div>
    <div
      class="sticky-tabs"
      v-if="this.isMobile"
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
    <q-page style="padding: 8px">
      <div class="q-gutter-sm row">
        <div
          class="col"
          v-if="!this.isMobile || this.tab === 'tab1'"
        >
          <chat-dialog
            :messages="this.getClient.messages"
            :inputField="this.inputField"
            :templates="this.templates"
            :isSending="this.isSending"
            :clientId="this.getClient.id"
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
            :templates="this.templates"
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
import ChatInfo from 'components/chat/ChatInfo.vue'
import ChatTasks from 'components/chat/ChatTasks.vue'
import { useStore } from 'stores/store'
import { useRoute } from 'vue-router'
import { markRead } from 'src/util/ws'

export default {
  components: { ChatTasks, ChatInfo, ChatHelper, ChatDialog },

  data: () => ({
    tab: 'tab1',
    templates: [
      { text: 'Добрый день!', shortCut: 'дд' },
      { text: 'Мы вас не обслуживаем', shortCut: 'необслуж' },
      { text: 'Василий где деньги', shortCut: 'деньги' },
      { text: 'Используйте другой принтер', shortCut: 'дрпринтер' },
      { text: 'Какой код от энидеска', shortCut: 'энидеск' },
      { text: 'КОЛЛЕГИ!!!', shortCut: 'колги' },
      { text: 'Примите подкюлчение', shortCut: 'подключ' },
      { text: 'Послезавтра сделаем', shortCut: '' },
      { text: 'Сотрудник в пути', shortCut: '' },
      { text: 'Уже решаем', shortCut: '' },
      { text: 'Не наша зона ответственности', shortCut: '' },
      { text: 'Давайте сами винду активируете', shortCut: '' }
    ],
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

  mounted () {
    this.markMessagesRead()
  },

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