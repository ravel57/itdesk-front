<template>
  <q-page padding style="padding-bottom: 0;">
    <div style="display: flex; width: 100%;">
      <q-input
        outlined
        dense
        v-model="this.searchRequest"
        label="Поиск"
        style="width: 100%; align-content: center; min-width: 300px; padding-right: 8px"
        clearable
      />
    </div>
    <div style="padding: 16px">
      <div
        v-if="this.getFilteredTasks.length > 0"
        style="display: flex; flex-wrap: wrap; flex-direction: row"
        :style="this.isMobile ? 'justify-content: center;' : 'justify-content: start;'"
      >
        <q-item
          v-for="(task, index) in this.getFilteredTasks"
          :key="task.id"
          style="border-style: solid;border-width: 0.01em;border-radius: 4px; border-color: var(--q-primary); margin-top: 8px; max-width: 420px;width: 100%;margin-right: 20px"
          clickable
          class="no-padding"
        >
          <q-item
            clickable
            style="padding: 8px;max-width: 420px;width: 420px;overflow: hidden"
            @click="this.onTaskClicked(task)"
          >
            <task-card
              class="task-card"
              :task="task"
              :descriptionRequire="false"
              :slaRequire="false"
              :task-name-short="20"
              :selected-sorting="''"
              @onTaskClicked="this.onTaskClicked($event)"
            >
              <template v-slot:chatLink>
                <a :href="this.getChatLink(task.client.id)" @click.stop>
                  <div
                    :id="`link_to_chat_${task.id}_${index}`"
                    class="link-to-chat-container"
                  >
                    <div class="link-container">
                      <q-icon class="link" color="white" name="open_in_new"/>
                    </div>
                  </div>
                </a>
              </template>
            </task-card>
          </q-item>
        </q-item>
      </div>
      <div
        v-else
        class="text-h3 absolute-center text-primary"
        v-text="'Заявок нет'"
      />
      <task-dialog
        v-if="this.isTaskDialogShow"
        :client="this.selectedTask.client"
        :isMobile="this.isMobile"
        :task="this.selectedTask"
        :isNewTaskDialogShow="this.isNewTaskDialogShow"
        :isTaskDialogShow="this.isTaskDialogShow"
        :isNewTask="false"
        @closeDialog="this.closeDialog"
        @updateTask="this.updateTask"
        @addMessageToTask="this.addMessageToTask"
      />
    </div>
  </q-page>
</template>

<script>
import { useStore } from 'stores/store'
import { useRoute } from 'vue-router'
import TaskCard from 'components/TaskCard.vue'
import TaskDialog from 'components/chat/TaskDialog.vue'

export default {

  name: 'MyTasks',

  components: { TaskDialog, TaskCard },

  data: () => ({
    isShowTableMode: false,
    isNewTaskDialogShow: false,
    isTaskDialogShow: false,
    isFilterSelected: false,
    selectedTask: {},
    searchRequest: ''
  }),

  methods: {

    closeDialog () {
      const queryParams = new URLSearchParams(window.location.search)
      queryParams.delete('task')
      this.$router.push({ path: this.$route.path, query: Object.fromEntries(queryParams.entries()) })
      this.isNewTaskDialogShow = false
      this.isTaskDialogShow = false
    },

    onTaskClicked (task) {
      this.isTaskDialogShow = true
      this.selectedTask = task
      this.updateUrlWithTask(task.id)
    },

    updateTask (task, newTask) {
      this.selectedTask = newTask.data
    },

    updateUrlWithTask (openedTaskId) {
      const queryParams = new URLSearchParams(window.location.search)
      queryParams.set('task', openedTaskId)
      this.$router.push({ path: this.$route.path, query: Object.fromEntries(queryParams.entries()) })
    },

    initializeTaskFromUrl () {
      const queryParams = new URLSearchParams(window.location.search)
      const taskIdFromUrl = queryParams.get('task')
      if (!taskIdFromUrl && this.isTaskDialogShow) {
        this.closeDialog()
      }
      if (taskIdFromUrl) {
        const taskFromUrl = this.getFilteredTasks.find(task => task.id === Number(taskIdFromUrl))
        this.onTaskClicked(taskFromUrl)
      } else {
        this.isNewTaskDialogShow = false
      }
    },

    getChatLink (id) {
      const origin = window.location.origin
      return `${origin}/chats/${id}`
    },

    addMessageToTask (event) {
      this.selectedTask.messages.push(event.message)
    }
  },

  computed: {
    getFilteredTasks () {
      return this.store.getTasks.filter(task => task.executor && task.executor.id === this.store.currentUser.id)
        .filter(task => {
          let matchesSearchRequest = true
          if (this.searchRequest) {
            matchesSearchRequest = task.name.toLowerCase().includes(this.searchRequest.toLowerCase()) ||
              task.id.toString().toLowerCase().includes(this.searchRequest.toLowerCase()) ||
              task.priority.name.toLowerCase().includes(this.searchRequest.toLowerCase()) ||
              // task.createdAt.toLowerCase().includes(this.searchRequest.toLowerCase()) ||
              task.status.name.toLowerCase().includes(this.searchRequest.toLowerCase()) ||
              (task.executor.firstname + ' ' + task.executor.lastname).toLowerCase().includes(this.searchRequest.toLowerCase())
          }
          return !task.completed && matchesSearchRequest
        })
    },

    isMobile () {
      return this.$q.screen.width < 1023
    }
  },

  mounted () {
    setTimeout(() => this.initializeTaskFromUrl(), 300)
    document.title = 'ULDESK : Мои заявки'
  },

  watch: {
    '$route' (to) {
      this.initializeTaskFromUrl()
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
.card {
  border-radius: 5px;
  background-color: #fff;
  border: 1px solid #ccc;
  padding: 10px;
  width: 300px;
  display: inline-block;
  text-decoration: none;
  color: black;
  margin-left: 8px;
  margin-right: 8px;
  margin-bottom: 8px
}

.link-to-chat-container {
  background-color: var(--q-primary);
  display: none;
  height: 60px;
  overflow: hidden;
  position: absolute;
  right: -37px;
  top: -37px;
  transform: rotate(45deg);
  transition: transform .3s ease;
  width: 60px;
  z-index: 1;
}

.link-container {
  color: var(--q-primary);
  display: flex;
  font-size: 15px;
  margin-left: 3px;
  padding: 0;
  text-decoration: none;
  transition: transform .3s ease;
  width: 50%;
  position: absolute;
  right: 25%;
  bottom: 0;
  height: 50%;
}

.link {
  position: absolute;
  height: 100%;
  width: 100%;
  transform: rotate(-45deg);
}

.link-to-chat-container:hover {
  transform: rotate(45deg) scale(1.2);
}

.task-card:hover {
  .link-to-chat-container {
    display: unset;
  }
}

a:visited { text-decoration: none; }
a:hover { text-decoration: none; }
a:focus { text-decoration: none; }
a:hover, a:active { text-decoration: none; }
</style>
