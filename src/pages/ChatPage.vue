<template>
  <q-layout view="hHh lpR fFf">
    <q-page-container>
      <q-page>
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
                @sendMessage="this.sendMessage"
                @keyPressed="this.keyPressed"
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
                @changeClient="this.changeClient"
              />
              <chat-tasks
                :tasks="this.getClient.tasks"
                :isNotificationEnabled="isNotificationEnabled"
                @newTask="this.newTask"
                @updateTask="this.updateTask"
              />
            </div>
          </div>
        </q-page>
      </q-page>
    </q-page-container>
  </q-layout>
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

  data: () => {
    return {
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
      isNotificationEnabled: true
    }
  },

  mounted () {
  },

  methods: {
    onTemplateClick (text) {
      this.inputField += ' ' + text
    },

    sendMessage (message) {
      axios.post(`http://localhost:8080/api/v1/client/${this.getClient.id}/new-message`, message)
        .then(() => {
          this.getClient.messages.push(message)
          this.inputField = ''
        })
    },

    keyPressed (text) {
      this.inputField = text
    },

    newTask (newTask) {
      axios.post(`http://localhost:8080/api/v1/client/${this.getClient.id}/new-task`, newTask)
        .then(task => {
          this.getClient.tasks.push(task.data)
        })
    },

    updateTask (task) {
      axios.post(`http://localhost:8080/api/v1/client/${this.getClient.id}/update-task`, task)
        .then(task => {
          this.getClient.tasks[this.getClient.tasks.indexOf(task)] = task.data
        })
    },

    changeClient (client) { }
  },

  computed: {
    getClient () {
      try {
        const clientId = Number(this.router.params.clientId)
        return this.store.clients.filter(client => client.id === clientId)[0]
      } catch (e) {
        return {}
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
