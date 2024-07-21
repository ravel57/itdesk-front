<template>
  <q-page padding style="padding-bottom: 0;">
    <div style="display: flex; width: 100%;">
      <q-input
        outlined
        v-model="this.searchRequest"
        label="Поиск"
        style="width: 100%; align-content: center; min-width: 300px; padding-right: 8px"
        clearable
      />
    </div>
    <div style="padding: 16px">
      <div
        style="display: flex; flex-wrap: wrap; flex-direction: row"
      >
        <q-item
          v-for="task in this.getFilteredTasks"
          :key="task.id"
          class="card"
          clickable
          :style="this.isMobile ? 'justify-content: center;' : ''"
        >
          <a
            style="font-size: 15px "
            :href="this.getChatLink(task.client.id)"
          >
            <q-icon name="assignment_ind"/>
            Перейти в чат
          </a>
          <task-card
            :task="task"
            :descriptionRequire="false"
            :slaRequire="false"
            :task-name-short="20"
            :selected-sorting="''"
            @onTaskClicked="this.onTaskClicked($event)"
          />
        </q-item>
      </div>
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
    isMobile () {
      return this.$q.screen.width < 1023
    },

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
a:visited { text-decoration: none; }
a:hover { text-decoration: none; }
a:focus { text-decoration: none; }
a:hover, a:active { text-decoration: none; }
</style>
