<template>
  <div>
    <div
      class="sticky-tabs"
      v-if="this.$q.screen.width < 1023"
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
    <q-page padding>
      <div class="q-gutter-md row">
        <div
          class="col"
          v-if="this.$q.screen.width > 1023 || this.tab === 'tab1'"
          style="height: 100%;"
        >
          <chat-dialog
            :messages="this.getClient.messages"
            :inputField="this.inputField"
            :templates="this.templates"
            :isSending="this.isSending"
            @sendMessage="this.sendMessage"
            @keyPressed="this.keyPressed($event)"
            @updated="this.markMessagesRead"
            @isSending="this.isSending = true"
          />
        </div>

        <div
          class="col"
          v-if="this.$q.screen.width > 1023 || this.tab === 'tab2'"
          style="height: 100%;"
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
          v-if="this.$q.screen.width > 1023 || this.tab === 'tab3'"
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
import axios from 'axios'

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
      axios.post(`/api/v1/client/${this.getClient.id}/new-message`, message) /* http://localhost:8080 */
        .then(() => {
          this.getClient.messages.push(message)
          this.inputField = ''
          this.isSending = false
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
    },

    markMessagesRead () {
      if (this.getClient.id) {
        axios.post(`/api/v1/client/${this.getClient.id}/mark-read`) /* http://localhost:8080 */
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
      }
    },

    changeClient (client) {
      axios.post(`/api/v1/client/${this.getClient.id}/update`, client) /* http://localhost:8080 */
        .then(newClient => {
          this.store.clients[this.store.clients.indexOf(this.getClient)] = newClient
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
