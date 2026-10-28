<template>
  <q-page
    padding
    style="display: flex; flex-direction: column; height: 100vh; min-height: 0; padding-bottom: 0; overflow: hidden"
  >
    <div
      v-if="!this.isOneLineHeader"
      style="display: flex; align-items: center;"
      class="q-mb-sm"
      :style="this.isMobile ? 'width: 100%; justify-content: center;' : ''"
    >
      <tasks-scope-toggle
        :scope="this.tasksScope"
        :style="this.isMobile ? 'width: 100%' : ''"
      />
    </div>
    <div id="task-control-container" style="display: flex;flex-direction: column;">
      <div :style="this.isMobile ? 'display: flex; flex-direction: column;' : 'display: flex'">
        <div
          v-if="this.isOneLineHeader"
          style="display: flex; align-items: center; flex: 0 0 auto; padding-right: 8px"
        >
          <tasks-scope-toggle
            :scope="this.tasksScope"
          />
        </div>
        <div class="app-inline app-flex-full-width">
          <q-input class="app-inline app-task-search"
            outlined
            dense
            data-tour="tasks-page-search"
            v-model="this.searchRequest"
            label="Поиск"
            :style="this.isMobile ? 'padding-right: 0;' : ''"
            clearable
          />
        </div>
        <div
          style="display: flex; height: 40px;"
          :style="this.isMobile ? 'margin-top: 8px;flex-wrap: wrap;justify-content: center;height: auto;' : ''"
        >
          <div
            style="display: flex; flex-direction: row;flex-wrap: nowrap; margin-left: 8px;"
            :style=" this.isMobile && this.isShowTableMode ? 'justify-content: center; width: 100%;' : ''"
          >
            <q-btn
              data-tour="tasks-page-filter"
              icon="filter_alt"
              flat
              @click="this.changeFilterSelection"
              :color="this.isFilterSelected ? 'primary' : 'dark'"
            >
              <q-tooltip>
                {{ this.isFilterSelected ? "Деактивировать фильтр" : "Активировать фильтр" }}
              </q-tooltip>
            </q-btn>

            <div style="display: flex; flex-direction: row; position: relative">
              <q-toggle
                data-tour="tasks-page-view-mode"
                v-model="this.isShowTableMode"
                color="grey"
                left-label
                checked-icon="list"
                unchecked-icon="dashboard"
                size="50px"
                keep-color
              >
                <q-tooltip>
                  Режим отображения: {{ this.isShowTableMode ? "Таблица" : "Карточки" }}
                </q-tooltip>
              </q-toggle>
              <q-toggle
                data-tour="tasks-page-completed"
                v-model="this.isShowCompletedTasks"
                color="primary"
                left-label
                icon="add_task"
                size="50px"
              >
                <q-tooltip>
                  Закрытые заявки: {{ this.isShowCompletedTasks ? "Показаны" : "Скрыты" }}
                </q-tooltip>
              </q-toggle>

              <tasks-view-menu
                :isShowTableMode="this.isShowTableMode"
                :groupTypes="this.getFilterType"
                v-model:selectedGroupType="this.selectedGroupType"
                :sortingTypes="this.sortingTypes"
                :selectedSorting="this.selectedSorting"
                :ascendingSort="this.ascendingSort"
                @setSort="this.setSortVariable"
                @toggleSortDirection="this.changeSortingAsc"
                @openTableSettings="this.isShowTableSettings = true"
              >
                <template #bulk-history>
                  <template v-if="!this.isObserverUser">
                    <q-separator/>
                    <q-item
                      clickable
                      v-close-popup
                      :disable="!this.canUndoBulkAction || this.isBulkHistoryProcessing"
                      @click="this.undoBulkAction"
                    >
                      <q-item-section avatar>
                        <q-icon name="undo"/>
                      </q-item-section>
                      <q-item-section>{{ this.bulkUndoTooltip }}</q-item-section>
                    </q-item>
                    <q-item
                      clickable
                      v-close-popup
                      :disable="!this.canRedoBulkAction || this.isBulkHistoryProcessing"
                      @click="this.redoBulkAction"
                    >
                      <q-item-section avatar>
                        <q-icon name="redo"/>
                      </q-item-section>
                      <q-item-section>{{ this.bulkRedoTooltip }}</q-item-section>
                    </q-item>
                  </template>
                </template>
              </tasks-view-menu>
            </div>
          </div>
          <tasks-save-filter-dialog
            ref="saveFilterDialog"
            v-model="this.dialogSaveFilterVisible"
            v-model:name="this.dialogNewFilterName"
            v-model:scope="this.dialogFilterScope"
            :selectedSavedFilter="this.selectedSavedFilter"
            :canManageGlobalFilters="this.canManageGlobalFilters"
            :filterJoinOperator="this.filterJoinOperator"
            :filterChain="this.filterChain"
            :getFilterSelectedOptionsText="this.getFilterSelectedOptionsText"
            @cancel="this.dialogSaveFilterClose"
            @save="saveFilter"
          />
        </div>
      </div>
      <tasks-filter-panel
        v-if="this.isFilterSelected"
        :isMobile="this.isMobile"
        :filterChain="this.filterChain"
        :filterTypes="this.filterTypes"
        v-model:selectedSavedFilter="this.selectedSavedFilter"
        :savedFilterOptions="this.savedFilterOptions"
        :selectedSavedFilterScope="this.selectedSavedFilterScope"
        v-model:filterJoinOperator="this.filterJoinOperator"
        :canSaveCurrentFilter="this.canSaveCurrentFilter"
        :isShowDelFilterPreset="this.isShowDelFilterPreset"
        :canDeleteSelectedSavedFilter="this.canDeleteSelectedSavedFilter"
        @savedFilterSelected="this.onSavedFilterSelected"
        @filterJoinOperatorChanged="updateUrlWithFilterJoinOperator"
        @addFilter="handleNewFilterSelection"
        @deleteFilter="deleteFilter"
        @saveFilter="this.dialogSaveFilter"
        @requestDeleteSavedFilter="isDeleteSavedFilterDialogShow = true"
        @resetFilters="this.removeFilters"
      />
    </div>
    <div
      v-if="this.taskPageLoading && !this.taskPageInitialLoaded"
      class="tasks-page-loading"
    >
      <q-spinner size="40px" color="primary"/>
      <div class="q-mt-sm text-grey-7">Загрузка заявок...</div>
    </div>
    <div
      v-else-if="getFilteredTasks.length > 0"
      ref="tasksPageScroll"
      class="tasks-page-content"
      @scroll.passive="this.onTasksScroll"
    >
      <tasks-component
        class="tasks-page-component"
        :isShowTableMode="this.isShowTableMode"
        :isMobile="this.isMobile"
        :tableRows="getTableRows"
        :isFilterSelected="this.isFilterSelected"
        :groupedTasks="this.getGroupedTasks"
        :selectedGroupType="this.selectedGroupType"
        :selectedSorting="this.selectedSorting"
        :isNewTaskDialogShow="this.isNewTaskDialogShow"
        :isTaskDialogShow="this.isTaskDialogShow"
        :selectedTask="this.selectedTask"
        :activeColumns="this.activeColumns"
        @onTaskClicked="this.onTaskClicked"
        @closeDialog="this.closeDialog"
        @updateTask="this.updateTask"
        @addMessageToTask="this.addMessageToTask"
        @onTableNeedMore="this.onTasksTableNeedMore"
      />
      <div
        ref="tasksInfiniteSentinel"
        class="tasks-infinite-status"
      >
        <div v-if="this.taskPageLoading" class="row items-center justify-center q-gutter-sm text-grey-7">
          <q-spinner size="22px" color="primary"/>
          <span>Подгружаю заявки...</span>
        </div>
        <div v-else-if="!this.taskPageIsEnd" class="text-grey-6">
          Прокрутите ниже, чтобы загрузить ещё
        </div>
        <div v-else class="text-grey-6">
          Показано {{ this.getFilteredTasks.length }} из {{ this.taskPageTotalElements }}
        </div>
      </div>
    </div>
    <div
      v-else
    >
      <div
        v-if="!this.isMobile"
        class="absolute-center"
      >
        <div v-if="this.filterChain.length > 0 || this.searchRequest.length > 0">
          <div style="display: flex;flex-direction: column;align-items: center;text-align: center">
            <div class="app-inline app-font-size-20">Заявок нет</div>
            <div class="app-inline app-margin-bottom-8">
              <q-btn
                icon="close"
                color="primary"
                @click="this.filterChain = []; this.filterJoinOperator = 'AND'; this.searchRequest = ''"
              >
                Сбросить фильтры
              </q-btn>
            </div>
            <div class="">
              <q-btn
                v-if="!this.isShowCompletedTasks"
                icon="visibility"
                color="primary"
                outline
                @click="this.isShowCompletedTasks = true"
              >
                Показать закрытые и замороженные
              </q-btn>
            </div>
            <no-tasks-placeholder/>
          </div>
        </div>
        <div class="app-inline app-row-center" v-else>
          <div class="app-inline app-width-140">
            <div class="app-inline app-font-size-20">
              Заявок нет
            </div>
            <div class="app-inline app-font-size-14">
              Возможно стоит создать их
            </div>
            <div class="app-inline app-font-size-14">
              <a class="app-inline app-color-primary"  href="/chats">Проверьте чаты.</a>
            </div>
          </div>
          <div class="app-inline app-column-center">
            <no-tasks-placeholder/>
            <q-btn
              v-if="!this.isShowCompletedTasks"
              icon="visibility"
              color="primary"
              outline
              @click="this.isShowCompletedTasks = true"
            >
              Показать закрытые и замороженные
            </q-btn>
          </div>
        </div>
      </div>
    </div>
    <tasks-bulk-actions-panel
      v-if="this.isShowBulkActionsMenu && !this.isObserverUser"
      :isMobile="this.isMobile"
      @openModal="this.openBulkModal"
    />
  </q-page>
  <tasks-delete-filter-dialog
    v-model="this.isDeleteSavedFilterDialogShow"
    :filterLabel="this.selectedSavedFilterLabel"
    @confirm="deleteSavedFilter"
  />
  <q-dialog
    v-if="!this.isObserverUser"
    v-model="this.isModalForBulkActions"
    persistent
    @hide="this.clearBulkActionReason"
  >
    <task-bulk-actions-modal
      :key="this.action"
      :action="this.action"
      :status-change-reason="this.bulkStatusChangeReason"
      :request-status-change-reason="this.requestBulkStatusChangeReason"
      @updateTask="this.updateTask"
      @close="this.closeBulkActionModal"
    />
  </q-dialog>
  <tasks-table-settings-dialog
    v-model="this.isShowTableSettings"
    v-model:columns="this.activeColumns"
    v-model:customized="this.tableColumnsCustomized"
  />

  <tasks-bulk-reason-dialog
    v-model="this.isBulkReasonDialogShow"
    v-model:reason="this.bulkStatusChangeReason"
    :title="this.getBulkReasonDialogTitle()"
    :message="this.getBulkReasonDialogMessage()"
    :confirmLabel="this.getBulkReasonConfirmLabel()"
    :error="this.bulkReasonError"
    @cancel="this.cancelBulkReasonDialog"
    @confirm="this.confirmBulkReasonDialog"
  />
</template>

<script>
import {useStore} from 'stores/store'
import {useRoute} from 'vue-router'
import TasksComponent from 'components/tasks/TasksComponent.vue'
import TaskBulkActionsModal from 'components/tasks/TaskBulkActionsModal.vue'
import TasksBulkActionsPanel from 'components/tasks/TasksBulkActionsPanel.vue'
import TasksBulkReasonDialog from 'components/tasks/TasksBulkReasonDialog.vue'
import TasksDeleteFilterDialog from 'components/tasks/TasksDeleteFilterDialog.vue'
import TasksFilterPanel from 'components/tasks/TasksFilterPanel.vue'
import TasksSaveFilterDialog from 'components/tasks/TasksSaveFilterDialog.vue'
import TasksScopeToggle from 'components/tasks/TasksScopeToggle.vue'
import TasksTableSettingsDialog from 'components/tasks/TasksTableSettingsDialog.vue'
import TasksViewMenu from 'components/tasks/TasksViewMenu.vue'
import NoTasksPlaceholder from 'components/NoTasksPlaceholder.vue'
import {onTaskUpdated} from 'src/util/ws'
import { useSlaInfo } from 'src/composables/useSlaInfo'
import { taskCardConfig } from 'src/util/taskCardConfig'
import {
  defaultTableColumns,
  resolveTableColumns,
  tableColumnsFromCardConfig
} from 'src/util/taskTableColumns'
import tasksBulkActionsMixin from 'src/mixins/tasks/tasksBulkActionsMixin'
import tasksBulkHistoryMixin from 'src/mixins/tasks/tasksBulkHistoryMixin'
import tasksDirectoriesMixin from 'src/mixins/tasks/tasksDirectoriesMixin'
import tasksFiltersMixin from 'src/mixins/tasks/tasksFiltersMixin'
import tasksInfiniteScrollMixin from 'src/mixins/tasks/tasksInfiniteScrollMixin'
import tasksPageLoaderMixin from 'src/mixins/tasks/tasksPageLoaderMixin'
import tasksSavedFiltersMixin from 'src/mixins/tasks/tasksSavedFiltersMixin'
import tasksSlaMixin from 'src/mixins/tasks/tasksSlaMixin'
import tasksViewMixin from 'src/mixins/tasks/tasksViewMixin'

// Страница списка заявок — оркестратор. Логика разнесена по миксинам (src/mixins/tasks/) по темам:
//  - tasksDirectoriesMixin   справочники значений для фильтров/группировки;
//  - tasksSlaMixin           SLA заявок (загрузка, таймер, расчёт);
//  - tasksFiltersMixin       цепочка фильтров, синхронизация с URL и localStorage;
//  - tasksSavedFiltersMixin  сохранённые фильтры;
//  - tasksViewMixin          область (все/мои/мои линии), сортировка, группировка, строки таблицы;
//  - tasksPageLoaderMixin    постраничная загрузка и перезагрузка заявок;
//  - tasksInfiniteScrollMixin подгрузка по прокрутке;
//  - tasksBulkHistoryMixin   undo/redo массовых действий;
//  - tasksBulkActionsMixin   массовые действия и диалог причины.
// Чистые функции лежат в src/util/tasks/. Миксины опираются на общие this.* (см. шапку каждого) —
// на странице остаются диалог заявки/URL заявки, обновление заявок в списках, веб-сокет и жизненный цикл.
export default {

  components: {
    NoTasksPlaceholder,
    TaskBulkActionsModal,
    TasksBulkActionsPanel,
    TasksBulkReasonDialog,
    TasksComponent,
    TasksDeleteFilterDialog,
    TasksFilterPanel,
    TasksSaveFilterDialog,
    TasksScopeToggle,
    TasksTableSettingsDialog,
    TasksViewMenu
  },

  mixins: [
    tasksDirectoriesMixin,
    tasksSlaMixin,
    tasksFiltersMixin,
    tasksSavedFiltersMixin,
    tasksViewMixin,
    tasksPageLoaderMixin,
    tasksInfiniteScrollMixin,
    tasksBulkHistoryMixin,
    tasksBulkActionsMixin
  ],

  data: () => ({
    activeColumns: defaultTableColumns(),
    tableColumnsCustomized: false,
    isShowTableMode: false,
    isShowCompletedTasks: false,
    searchRequest: '',
    selectedTask: {},
    isNewTaskDialogShow: false,
    isTaskDialogShow: false,
    isShowTableSettings: false,

    currentExecutorLabel: 'Вы',
    unassignedExecutorLabel: 'Без исполнителя',

    taskUpdatedUnsubscribe: null,
  }),

  methods: {
    onTaskClicked(task) {
      this.openTaskDialog(task, true)
    },

    openTaskDialog(task, updateUrl = true) {
      if (!task || !task.id) {
        return
      }
      this.selectedTask = task
      this.isNewTaskDialogShow = false
      this.isTaskDialogShow = true
      if (updateUrl) {
        this.updateUrlWithTask(task.id)
      }
    },

    closeDialog() {
      const query = {...this.$route.query}
      if (query.task) {
        delete query.task
        this.$router.replace({
          path: this.$route.path,
          query
        })
      }
      this.isNewTaskDialogShow = false
      this.isTaskDialogShow = false
      this.selectedTask = null
    },

    updateUrlWithTask(openedTaskId) {
      if (!openedTaskId) {
        return
      }
      const currentTaskId = this.$route.query.task
      if (String(currentTaskId || '') === String(openedTaskId)) {
        return
      }
      this.$router.replace({
        path: this.$route.path,
        query: {
          ...this.$route.query,
          task: String(openedTaskId)
        }
      })
    },

    initializeTaskFromUrl() {
      const taskIdFromUrl = this.$route.query.task
      if (!taskIdFromUrl) {
        this.isNewTaskDialogShow = false
        this.isTaskDialogShow = false
        this.selectedTask = null
        return
      }
      const taskId = Number(taskIdFromUrl)
      if (!Number.isFinite(taskId)) {
        return
      }
      const taskFromUrl = this.getStoreTaskById(taskId)
      if (!taskFromUrl) {
        return
      }
      if (taskFromUrl.completed && !this.isShowCompletedTasks) {
        this.isShowCompletedTasks = true
        return
      }
      this.openTaskDialog(taskFromUrl, false)
    },

    updateTask(task, newTask) {
      const updatedTask = newTask?.data || newTask || task?.data || task
      if (!updatedTask?.id) {
        return
      }

      this.trackBulkActionHistoryAfterState(updatedTask)
      this.replaceTaskInLists(updatedTask)

      // Не завершаем историю сразу после первого обновления.
      // Массовое действие может обновлять заявки последовательно, и быстрый finish
      // сохранял в undo только первый успевший элемент пачки.
      this.scheduleFinishBulkActionHistory(1000)
    },

    getStoreTaskById(taskId) {
      return this.store.getTaskPageTasks.find(task => task?.id === taskId) ||
        this.store.getTasks.find(task => task?.id === taskId) ||
        null
    },

    getCheckedTaskById(taskId) {
      return this.store.checkedTasks.find(task => task?.id === taskId) || null
    },

    replaceTaskInLists(task) {
      if (!task?.id) {
        return
      }
      const loadedTask = this.store.getTaskPageTasks.find(item => item?.id === task.id)
      const normalizedTask = this.store.normalizeTaskPageTask({
        ...task,
        client: task.client || loadedTask?.client
      })
      const shouldHideFromCurrentList =
        !this.isShowCompletedTasks &&
        (Boolean(normalizedTask.completed) || Boolean(normalizedTask.frozen))
      const loadedTaskIndex = this.store.taskPage.tasks.findIndex(item => item?.id === normalizedTask.id)
      if (loadedTaskIndex !== -1) {
        if (shouldHideFromCurrentList) {
          this.store.taskPage.tasks.splice(loadedTaskIndex, 1)
          this.store.taskPage.totalElements = Math.max(0, Number(this.store.taskPage.totalElements || 0) - 1)
        } else {
          this.store.taskPage.tasks.splice(loadedTaskIndex, 1, normalizedTask)
        }
      } else if (!shouldHideFromCurrentList) {
        this.reloadTasksPageDebounced()
      }
      const tasks = this.store.getTasks
      const taskIndex = tasks.findIndex(item => item?.id === normalizedTask.id)
      if (taskIndex !== -1) {
        tasks.splice(taskIndex, 1, normalizedTask)
      }
      const checkedTaskIndex = this.store.checkedTasks.findIndex(item => item?.id === normalizedTask.id)
      if (checkedTaskIndex !== -1) {
        this.store.checkedTasks.splice(checkedTaskIndex, 1, normalizedTask)
      }
      if (this.selectedTask?.id === normalizedTask.id) {
        this.selectedTask = normalizedTask
      }
      if (Object.prototype.hasOwnProperty.call(this.slaInfoByTaskId, normalizedTask.id)) {
        const slaInfo = {...this.slaInfoByTaskId}
        delete slaInfo[normalizedTask.id]
        this.slaInfoByTaskId = slaInfo
      }
    },

    addMessageToTask(event) {
      this.selectedTask.messages.push(event.message)
    },

    onTaskUpdatedFromSocket(payload) {
      const socketTask = payload?.task

      if (!socketTask?.id) {
        return
      }

      const loadedTask = this.store.taskPage.tasks.find(item => {
        return Number(item?.id) === Number(socketTask.id)
      })

      if (!loadedTask) {
        // Новая заявка (например, от автоматизации): перечитываем страницу, чтобы учесть фильтры и сортировку
        this.reloadTasksPageDebounced()
        return
      }

      const normalizedTask = this.store.normalizeTaskPageTask({
        ...socketTask,
        client: socketTask.client?.id ? socketTask.client : loadedTask.client
      })

      this.replaceTaskInLists(normalizedTask)

      this.$nextTick(() => {
        this.loadSlaInfoForTask(normalizedTask, true)
      })
    }
  },

  computed: {
    cardFieldsConfig() {
      return taskCardConfig.value
    },

    // На широком экране переключатель пунктов стоит в одной строке с поиском и кнопками
    isOneLineHeader() {
      return !this.isMobile && this.$q.screen.width >= 1280
    },

    isMobile() {
      return this.$q.screen.width < 1023
    },

    isObserverUser() {
      return Array.isArray(this.store.currentUser?.authorities) &&
        this.store.currentUser.authorities.includes('OBSERVER')
    }
  },

  watch: {
    isShowTableMode(newValue) {
      localStorage.setItem('isShowListMode', newValue ? 'true' : 'false')
      this.reloadTasksPageDebounced()
    },

    '$route.query.task'() {
      this.initializeTaskFromUrl()
    },

    '$route.query.scope'() {
      this.reloadTasksPageDebounced()
    },

    isShowCompletedTasks() {
      localStorage.setItem('isShowCompletedTasks', this.isShowCompletedTasks)
      this.reloadTasksPageDebounced()
    },

    cardFieldsConfig: {
      deep: true,
      handler(cardConfig) {
        if (!this.tableColumnsCustomized) {
          this.activeColumns = tableColumnsFromCardConfig(cardConfig)
        }
      }
    },

    searchRequest() {
      this.reloadTasksPageDebounced()
    }
  },

  mounted() {
    document.title = 'ULDESK : Список заявок'
    if (this.isObserverUser) {
      this.store.checkedTasks = []
      this.isShowBulkActionsMenu = false
      this.isModalForBulkActions = false
    }
    this.taskUpdatedUnsubscribe = onTaskUpdated(this.onTaskUpdatedFromSocket)
    this.startSlaTimer()
    this.addTasksScrollIntentListeners()
    this.addBulkHistoryShortcutListener()
    this.addTasksScrollCaptureListeners()
    this.initializeFilterChainFromUrl()
    this.loadSavedFilters()
      .finally(() => {
        this.resetTasksPageAndLoad()
          .then(() => this.initializeTaskFromUrl())
      })
    this.$nextTick(() => this.setupTasksInfiniteObserver())
  },

  created() {
    this.restoreSortingSettings()
    this.isShowCompletedTasks = localStorage.getItem('isShowCompletedTasks') !== 'false'
    this.isShowTableMode = localStorage.getItem('isShowListMode') !== 'false'
    const resolvedTableColumns = resolveTableColumns(localStorage, taskCardConfig.value)
    this.activeColumns = resolvedTableColumns.columns
    this.tableColumnsCustomized = resolvedTableColumns.customized
    this.restoreSavedGroupType()
    this.ensureSelectedGroupTypeAvailable()
  },

  setup() {
    const store = useStore()
    const router = useRoute()
    const slaScope = useSlaInfo()
    return {store, router, slaScope}
  },

  beforeUnmount() {
    this.removeTasksScrollListeners()
    this.removeBulkHistoryShortcutListener()
    this.stopSlaTimer()
    this.clearBulkActionHistoryFinishTimer()
    this.clearTasksPageReloadTimer()
    this.clearTasksScrollTimers()
    if (this.taskUpdatedUnsubscribe) {
      this.taskUpdatedUnsubscribe()
      this.taskUpdatedUnsubscribe = null
    }
  },
}
</script>

<style>
.board {
  white-space: nowrap;
}

.scroll-container {
  display: flex;
  flex: 1 1 auto;
  min-height: 0;
  height: 100%;
  width: 100%;
  overflow-x: auto;
  overflow-y: auto;
}

.tasks-page-content {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-height: 0;
  width: 100%;
  overflow-x: hidden;
  overflow-y: auto;
}

.tasks-page-component {
  display: flex;
  flex: 0 0 auto;
  min-height: 0;
  width: 100%;
  overflow: visible;
}

.tasks-page-loading {
  display: flex;
  flex: 1 1 auto;
  min-height: 0;
  width: 100%;
  align-items: center;
  justify-content: center;
  flex-direction: column;
}

.tasks-infinite-status {
  flex: 0 0 auto;
  min-height: 52px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px 0 18px;
}
</style>
