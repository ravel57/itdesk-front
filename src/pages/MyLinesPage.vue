<template>
  <q-page padding class="my-lines-page">
    <my-lines-toolbar
      v-model:search-request="searchRequest"
      :page-loading="pageLoading"
      @refresh="resetPageAndLoad"
    />

    <div v-if="linesLoading" class="my-lines-loading absolute-center text-grey-6">
      <q-spinner color="primary" size="32px"/>
      <div>Загружаю линии...</div>
    </div>

    <template v-else-if="currentUserLines.length > 0">
      <my-lines-selector
        :lines="currentUserLines"
        :selected-line-id="selectedLineId"
        :current-user-id="store.currentUser?.id"
        @select="selectLine"
      />

      <div class="my-lines-status-row q-mt-md">
        <div class="text-body2 text-grey-7">
          <template v-if="selectedLine">
            Показаны заявки линии <strong>{{ selectedLine.name }}</strong>
          </template>
          <template v-else>
            Показаны заявки всех доступных линий
          </template>
        </div>
        <q-chip dense outline color="primary" icon="confirmation_number">
          {{ totalElements }}
        </q-chip>
      </div>

      <div v-if="isInitialLoading" class="my-lines-loading q-py-xl text-grey-6">
        <q-spinner color="primary" size="32px"/>
        <div>Загружаю заявки...</div>
      </div>

      <my-lines-task-groups
        v-else-if="displayedGroups.length > 0"
        :groups="displayedGroups"
        :paged-count="pagedTasks.length"
        :total-elements="totalElements"
        :page-loading="pageLoading"
        :page-is-end="pageIsEnd"
        :current-user-id="store.currentUser?.id"
        @task-click="onTaskClicked"
        @chat-link-click="onChatLinkClicked"
      />

      <div v-else-if="pageLoadedOnce && !pageLoading" class="my-lines-empty">
        <no-tasks-placeholder/>
        <div class="text-h6 q-mt-md">В выбранных линиях нет открытых заявок</div>
        <div class="text-body2 text-grey-7 q-mt-xs">
          Попробуйте выбрать другую линию или изменить поисковый запрос.
        </div>
      </div>
    </template>

    <div v-else-if="!linesLoading" class="my-lines-empty">
      <q-icon name="account_tree" size="72px" color="grey-5"/>
      <div class="text-h6 q-mt-md">У вас пока нет доступных линий</div>
      <div class="text-body2 text-grey-7 q-mt-xs text-center">
        Попросите администратора добавить вас ответственным, участником или наблюдателем линии поддержки.
      </div>
    </div>

    <task-dialog
      v-if="isTaskDialogShow && selectedTask?.client"
      :client="selectedTask.client"
      :isMobile="isMobile"
      :task="selectedTask"
      :isNewTaskDialogShow="false"
      :isTaskDialogShow="isTaskDialogShow"
      :isNewTask="false"
      @closeDialog="closeDialog"
      @updateTask="updateTask"
      @addMessageToTask="addMessageToTask"
    />
  </q-page>
</template>

<script>
import {useStore} from 'stores/store'
import TaskDialog from 'components/chat/TaskDialog.vue'
import NoTasksPlaceholder from 'components/NoTasksPlaceholder.vue'
import MyLinesToolbar from 'components/my-lines/MyLinesToolbar.vue'
import MyLinesSelector from 'components/my-lines/MyLinesSelector.vue'
import MyLinesTaskGroups from 'components/my-lines/MyLinesTaskGroups.vue'
import myLinesLinesMixin from 'components/my-lines/myLinesLinesMixin'
import myLinesLoaderMixin from 'components/my-lines/myLinesLoaderMixin'
import myLinesScrollMixin from 'components/my-lines/myLinesScrollMixin'
import myLinesDialogMixin from 'components/my-lines/myLinesDialogMixin'

export default {
  name: 'MyLinesPage',

  components: {
    NoTasksPlaceholder,
    TaskDialog,
    MyLinesToolbar,
    MyLinesSelector,
    MyLinesTaskGroups
  },

  mixins: [myLinesLinesMixin, myLinesLoaderMixin, myLinesScrollMixin, myLinesDialogMixin],

  data: () => ({
    searchRequest: ''
  }),

  computed: {
    isMobile() {
      return this.$q.screen.width < 1023
    }
  },

  async mounted() {
    document.title = 'ULDESK : Мои линии'
    this.addScrollListeners()

    await this.loadLines()
    this.resetPageAndLoad()
    setTimeout(() => this.initializeTaskFromUrl(), 300)
  },

  beforeUnmount() {
    this.removeScrollListeners()
    this.clearReloadTimer()
    this.clearScrollTimer()
  },

  watch: {
    searchRequest() {
      this.reloadDebounced()
    },

    '$route.query.task'() {
      this.initializeTaskFromUrl()
    },

    'store.supportLines': {
      deep: true,
      handler() {
        if (this.selectedLineId !== null && !this.selectedLine) {
          this.selectedLineId = null
        }
      }
    }
  },

  setup() {
    return {store: useStore()}
  }
}
</script>

<style scoped>
.my-lines-page {
  position: relative;
  padding-bottom: 0;
}

.my-lines-status-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.my-lines-loading,
.my-lines-empty {
  min-height: 260px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
}
</style>
