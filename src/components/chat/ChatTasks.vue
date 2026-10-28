<template>
  <q-card
    data-tour="chat-client-tasks-column"
    id="taskColumn"
    bordered
    class="no-shadow"
    style="overflow: hidden;border-radius: 0;display: flex;flex-direction: column;padding: 16px 16px 0;"
    :style="this.isMobile ? 'height: calc(100vh - 89px)' : 'height: 100vh;'"
  >
    <div data-tour="chat-client-card" class="client-card-area" style="margin-bottom: 3px">
      <chat-info
        style="z-index: 1"
        :isMobile="this.isMobile"
        :client="this.client"
        :organizations="this.organizations"
        :onboarding-demo="this.onboardingDemo"
        @updateClient="this.updateClient"
      />
    </div>
    <q-separator/>
    <div v-if="!this.canViewTasks" class="text-caption text-grey-7 q-mt-md">
      Заявки недоступны: раздел закрыт для вашей роли.
    </div>
    <chat-tasks-toolbar
      v-if="this.canViewTasks"
      :total-for-header="this.getTasksTotalForHeader"
      :pinged-tasks="this.pingedTasks"
      :task-pings-loading="this.taskPingsLoading"
      v-model:isShowCompletedTasks="isShowCompletedTasks"
      v-model:showSearch="showSearch"
      v-model:search="search"
      :onboarding-demo="this.onboardingDemo"
      :selected-sorting="this.selectedSorting"
      :sorting-types="this.sortingTypes"
      :ascending-sort="this.ascendingSort"
      @openPingedTask="this.openPingedTask"
      @createTask="this.dialogNewTask"
      @sort="this.setSortVariable"
      @toggleSortOrder="this.changeSortingAsc"
    />
    <div
      v-if="this.canViewTasks"
      id="task-vertical-carousel"
      ref="taskScroll"
      style="overflow: auto;position: relative;width: 100%;height: 100%"
      @scroll.passive="this.onTaskScroll"
    >
      <chat-tasks-list
        :tasks="this.getActualTasks"
        :selected-sorting="this.selectedSorting"
        :is-demo-client="this.isDemoClient"
        :is-initial-tasks-loading="this.isInitialTasksLoading"
        :should-show-no-tasks-placeholder="this.shouldShowNoTasksPlaceholder"
        :task-page-loading="this.taskPageLoading"
        :task-page-is-end="this.taskPageIsEnd"
        :task-page-total-elements="this.taskPageTotalElements"
        @taskClick="this.onTaskClick"
        @linkedMessage="this.getLinkedMessage"
        @closeTask="this.setTaskCompleted"
      />
    </div>
  </q-card>
  <task-dialog
    v-if="getPossibilityToOpenDialogTask"
    :client="this.client"
    :isMobile="this.isMobile"
    :task="this.selectedTask"
    :isNewTaskDialogShow="this.isNewTaskDialogShow"
    :isTaskDialogShow="this.isTaskDialogShow"
    :isNewTask="this.isNewTask"
    :request-status-change-reason="this.requestStatusChangeReason"
    @closeDialog="this.closeDialog"
    @addMessageToTask="this.addMessageToTask"
    @updateTask="updateTask"
    @newTask="onNewTaskCreated"
  />
</template>

<script>
import ChatInfo from 'components/chat/ChatClientInfo.vue'
import TaskDialog from 'components/chat/TaskDialog.vue'
import ChatTasksList from 'components/chat/chat-tasks/ChatTasksList.vue'
import ChatTasksToolbar from 'components/chat/chat-tasks/ChatTasksToolbar.vue'
import chatTasksDialogMixin from 'components/chat/chat-tasks/chatTasksDialogMixin'
import chatTasksListMixin from 'components/chat/chat-tasks/chatTasksListMixin'
import chatTasksPagingMixin from 'components/chat/chat-tasks/chatTasksPagingMixin'
import chatTasksPingsMixin from 'components/chat/chat-tasks/chatTasksPingsMixin'
import chatTasksSlaMixin from 'components/chat/chat-tasks/chatTasksSlaMixin'
import chatTasksSortingMixin from 'components/chat/chat-tasks/chatTasksSortingMixin'
import chatTasksUrlMixin from 'components/chat/chat-tasks/chatTasksUrlMixin'
import { useStore } from 'stores/store'
import { onTaskMessage, onTaskUpdated } from 'src/util/ws'
import { useSlaInfo } from 'src/composables/useSlaInfo'

export default {

  name: 'ChatTasks',

  components: { ChatTasksList, ChatTasksToolbar, TaskDialog, ChatInfo },

  mixins: [
    chatTasksPingsMixin,
    chatTasksPagingMixin,
    chatTasksListMixin,
    chatTasksSortingMixin,
    chatTasksSlaMixin,
    chatTasksUrlMixin,
    chatTasksDialogMixin
  ],

  props: [
    'tasks',
    'tags',
    'users',
    'client',
    'statuses',
    'priorities',
    'organizations',
    'isMobile',
    'onboardingDemo',
    'requestStatusChangeReason'
  ],

  data: () => ({
    isNewTaskDialogShow: false,
    isTaskDialogShow: false,

    dialogTaskId: '',
    dialogTaskName: '',
    dialogTaskDescription: '',
    dialogTaskPriority: '',
    dialogTaskExecutor: '',
    dialogTaskTags: [],
    dialogTaskStatus: '',
    dialogTaskDeadline: '',
    dialogTaskComplete: false,
    linkedMessageId: '',

    taskCreatedAt: '',
    selectedTask: {},

    isShowCompletedTasks: false,
    isNewTask: true,
    isNewLinkedTask: false,
    taskId: null, // for update

    search: '',
    searchResults: [],
    dialogTab: 'tab1',

    showSearch: false,

    taskUpdatedUnsubscribe: null,
    taskMessageUnsubscribe: null,
  }),

  computed: {
    getPossibilityToOpenDialogTask () {
      return this.isNewTaskDialogShow || this.isTaskDialogShow
    },

    isSearchNotEmpty () {
      return this.searchResults.length > 0
    }
  },

  watch: {
    isNewTaskDialogShow (newVal) {
      if (this.isNewTaskDialogShow === false) {
        const queryParams = new URLSearchParams(window.location.search)
        queryParams.delete('task')
        this.$router.push({ path: this.$route.path, query: Object.fromEntries(queryParams.entries()) })
      }
    },

    isShowCompletedTasks () {
      localStorage.setItem('isShowCompletedTasks', this.isShowCompletedTasks)
      this.resetTasksPageAndLoad(true)
    },

    tasks: {
      handler (tasks) {
        if (this.isDemoClient) {
          this.loadSlaInfosForTasks()
          return
        }
        this.syncLinkedMessageIdsFromParent(tasks)
      },
      deep: true
    },

    'client.id': {
      handler (newClientId, oldClientId) {
        if (Number(newClientId || 0) === Number(oldClientId || 0)) {
          return
        }
        this.pingedTasks = []
        this.resetTasksPageAndLoad(true)
        this.loadTaskPings()
      }
    },

    search () {
      this.reloadTasksPageDebounced(true)
    },

    '$route.query.task' () {
      this.initializeTaskFromUrl()
    },

    '$route.query.newTaskFromMessage' () {
      this.initializeTaskFromUrl()
    },

    taskPageLoadedOnce () {
      this.initializeTaskFromUrl()
    },
  },

  mounted () {
    this.taskUpdatedUnsubscribe = onTaskUpdated(this.onTaskUpdatedFromSocket)
    this.taskMessageUnsubscribe = onTaskMessage(this.onTaskMessageForPingList)
    this.loadTaskPings()
    this.initializeTaskFromUrl()
    if (this.isDemoClient) {
      this.loadSlaInfosForTasks()
    } else {
      this.resetTasksPageAndLoad(true)
    }
    this.slaTimer = setInterval(() => {
      this.nowTs = Date.now()
    }, 1000)
  },

  beforeUnmount () {
    clearInterval(this.slaTimer)
    if (this.taskPageReloadTimer) {
      clearTimeout(this.taskPageReloadTimer)
    }
    if (this.taskPageRefreshTimer) {
      clearTimeout(this.taskPageRefreshTimer)
    }
    if (this.taskScrollTimer) {
      clearTimeout(this.taskScrollTimer)
    }
    if (this.taskPingsReloadTimer) {
      clearTimeout(this.taskPingsReloadTimer)
      this.taskPingsReloadTimer = null
    }
    if (this.taskUpdatedUnsubscribe) {
      this.taskUpdatedUnsubscribe()
      this.taskUpdatedUnsubscribe = null
    }
    if (this.taskMessageUnsubscribe) {
      this.taskMessageUnsubscribe()
      this.taskMessageUnsubscribe = null
    }
  },

  created () {
    this.restoreSortingSettings()
    this.isShowCompletedTasks = localStorage.getItem('isShowCompletedTasks') !== 'false'
  },

  setup () {
    const store = useStore()
    const slaScope = useSlaInfo()
    return { store, slaScope }
  }

}
</script>

<style scoped>
/* Карандаш редактирования клиента появляется при наведении на карточку клиента */
.client-card-area :deep(.edit-client-btn) {
  opacity: 0;
  transition: opacity 0.15s;
}

.client-card-area:hover :deep(.edit-client-btn),
.client-card-area :deep(.edit-client-btn:focus-visible) {
  opacity: 1;
}

/* На устройствах без наведения (тач) карандаш показываем всегда */
@media (hover: none) {
  .client-card-area :deep(.edit-client-btn) {
    opacity: 1;
  }
}

.small-text {
  font-size: 0.9em;
}

th {
  text-align: left;
}

.flex-container {
  display: flex;
  justify-content: space-between;
}

.flex-item {
  flex: 0 0 48%;
}

.no-border-card {
  border: none;
  box-shadow: none;
}
</style>
