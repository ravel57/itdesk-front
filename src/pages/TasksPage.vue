<template>
  <q-page padding style="padding-bottom: 0;position: relative; overflow-y: hidden">
      <div :style="this.isMobile ? 'display: flex; flex-direction: column;' : 'display: flex'">
        <div style="display: flex; width: 100%;">
          <q-input
            outlined
            v-model="this.searchRequest"
            label="Поиск"
            style="width: 100%; align-content: center; min-width: 300px; padding-right: 8px"
            :style="this.isMobile ? 'padding-right: 0;' : ''"
            clearable
          />
        </div>
        <div
          style="display: flex"
          :style="this.isMobile ? 'margin-top: 8px;flex-wrap: wrap;justify-content: center' : ''"
        >
          <q-btn-dropdown
            v-if="!this.isShowTableMode"
            color="primary"
            :label="this.selectedGroupType.label"
            style="align-content: center;"
            :style="this.isMobile ? 'width: 100%' : ''"
          >
            <template v-slot:label>
              <q-tooltip>
                Группировка
              </q-tooltip>
            </template>
            <q-list>
              <q-item
                v-for="(grouper, index) in this.filterTypes"
                :key="index"
                clickable
                v-close-popup
                @click="this.selectedGroupType = grouper"
              >
                <q-item-section>
                  <q-item-label>{{ grouper.label }}</q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </q-btn-dropdown>
          <div
            style="display: flex; flex-direction: row;flex-wrap: nowrap; margin-left: 8px;"
            :style=" this.isMobile && this.isShowTableMode ? 'justify-content: center; width: 100%;' : ''"
          >
            <q-btn
              icon="filter_alt"
              flat
              @click="this.changeFilterSelection"
              :color="this.isFilterSelected ? 'primary' : 'dark'"
            >
              <q-tooltip>
                {{ this.isFilterSelected ? "Деактивировать фильтр" : "Активировать фильтр" }}
              </q-tooltip>
            </q-btn>
            <q-toggle
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
          </div>
          <q-dialog
            v-model="dialogSaveFilterVisible"
            persistent
            backdrop-filter="blur(4px)"
          >
            <q-card class="dialog-width">
              <q-toolbar class="justify-end">
                <q-btn flat round dense icon="close" v-close-popup/>
              </q-toolbar>
              <q-card-section style="padding-top: 0">
                Сохранить фильтр?
                <q-input
                  label="Название"
                  v-model="this.dialogNewFilterName"
                  :rules="[val => (val && val.length > 0) || 'Обязательное поле']"
                  ref="dialogNewFilterName"
                />
                <div
                  style="white-space: pre-wrap"
                  v-for="(filter, index) in this.filterChain.map(it => ({label: it.label, selectedOptions: it.selectedOptions}))"
                  :key="index"
                >
                  {{ filter.label + ' : ' + filter.selectedOptions.join(', ') }}
                </div>
              </q-card-section>
              <q-card-actions align="right">
                <q-btn
                  color="white"
                  text-color="primary"
                  label="Закрыть"
                  @click="this.dialogSaveFilterClose"
                />
                <q-btn
                  color="primary"
                  label="Сохранить"
                  @click="saveFilter"
                />
              </q-card-actions>
            </q-card>
          </q-dialog>
        </div>
      </div>
      <div
        v-if="this.isFilterSelected"
        id="filter-container"
        style="display: flex;margin-top: 8px; align-items: center;"
        :style="this.isMobile ? 'display:flex; flex-direction:row; flex-wrap: wrap; justify-content:center; width: 100%': ''"
      >
        <q-select
          v-model="this.selectedSavedFilter"
          :options="this.savedFilters.map(it => it.label)"
          label="Сохраненные фильтры"
          style="width: 12.5%; align-content: center; min-width: 300px; margin-right: 8px"
          :style="this.isMobile ? 'width: 100%; margin-bottom: 8px' : ''"
          @update:model-value="this.onSavedFilterSelected"
          outlined
          clearable
        />
        <div
          v-if="this.isFilterSelected"
          style="overflow: auto; margin-right: 8px;height: 100%"
          :style="isMobile ? 'width: 100%': ''"
        >
          <div style="display: flex;flex-direction: row; flex-wrap: nowrap">
            <div
              v-for="(filter, index) in this.filterChain"
              :key="index"
              style="display: flex; border-right: 16px; padding-right: 16px"
              :id="`filter_${filter.slug}`"
            >
              <q-select
                outlined
                :label="filter.label"
                multiple
                :options="filter.options"
                use-chips
                use-input
                dense
                stack-label
                v-model="filter.selectedOptions"
                input-debounce="0"
                style="width: 250px; height: 100%;"
                behavior="menu"
              >
                <!--@filter="filterFn"-->
                <template v-slot:no-option>
                  <q-item>
                    <q-item-section class="text-grey">
                      Нет результатов
                    </q-item-section>
                  </q-item>
                </template>
              </q-select>
              <q-btn
                icon="cancel"
                dense
                flat
                color="blue-grey"
                size="xs"
                icon-top
                class="vertical-top"
                style="height: 20px;"
                @click="deleteFilter(index)"
              />
            </div>
          </div>
        </div>
        <q-btn
          v-if="filterTypes.filter(o => !this.filterChain.map(fc=> fc.label).includes(o.label)).length > 0"
          flat
          color="grey"
          icon="add_circle"
          @click="!this.isMenuActive"
        >
          <q-tooltip>
            Добавить фильтр
          </q-tooltip>
          <q-menu
            v-model="this.isMenuActive"
            anchor="bottom right"
            self="top right"
          >
            <q-list>
              <q-item
                v-for="option in filterTypes.filter(o => !this.filterChain.map(fc=> fc.label).includes(o.label))"
                :key="option.value"
                clickable
                @click="handleNewFilterSelection(option.label)"
              >
                <q-item-section>{{ option.label }}</q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </q-btn>
        <q-btn
          v-if="this.selectedSavedFilter.length === 0 && this.filterChain.length > 0"
          ref="saveFilterButton"
          icon="save"
          color="grey"
          @click="this.dialogSaveFilter"
          flat
          style="height: 40px"
        >
          <q-tooltip>
            Сохранить фильтр
          </q-tooltip>
        </q-btn>
        <q-btn
          v-else-if="this.isShowDelFilterPreset"
          ref="deleteSavedFilterButton"
          icon="delete"
          color="grey"
          @click="isDeleteSavedFilterDialogShow = true"
          flat
          style="height: 40px"
        >
          <q-tooltip>
            Удалить фильтр
          </q-tooltip>
        </q-btn>
        <q-btn
          v-if="this.filterChain.length > 0"
          icon="cancel"
          color="grey"
          @click="this.removeFilters"
          flat
          style="height: 40px"
        >
          <q-tooltip>
            Сбросить фильтр
          </q-tooltip>
        </q-btn>
      </div>
    <div v-if="getFilteredTasks.length > 0">
      <tasks-component
        :isShowTableMode="this.isShowTableMode"
        :isMobile="this.isMobile"
        :tableRows="this.getTableRows"
        :isFilterSelected="this.isFilterSelected"
        :groupedTasks="this.getGroupedTasks"
        :selectedGroupType="this.selectedGroupType"
        :isNewTaskDialogShow="this.isNewTaskDialogShow"
        :isTaskDialogShow="this.isTaskDialogShow"
        :selectedTask="this.selectedTask"
        :filter-container-height="this.filterContainerHeight"
        @onTaskClicked="this.onTaskClicked"
        @closeDialog="this.closeDialog"
        @addMessageToTask="this.addMessageToTask"
      />
    </div>
    <div
      v-else
    >
      <div
        v-if="!this.isMobile"
        class="text-h3 absolute-center text-primary"
        v-text="'Заявок нет'"
      />
    </div>
    <div
      v-if="this.isShowBulkActionsMenu"
      :style="this.isMobile ? 'left: 2vw !important;' : ''"
      class="mass-container"
    >
      <q-page class="shadow-1" style="min-height: 0; padding: 8px; border-radius: 5px;display: flex">
        <q-btn flat text-color="primary" icon="check_circle" @click="this.openBulkModal('close')">
          <q-tooltip>Закрыть заявки</q-tooltip>
        </q-btn>
        <q-btn flat text-color="primary" icon="ac_unit" @click="this.openBulkModal('freeze')">
          <q-tooltip>Заморозить заявки</q-tooltip>
        </q-btn>
        <q-btn flat text-color="primary" icon="manage_accounts" @click="this.openBulkModal('executor')">
          <q-tooltip>Сменить исполнителя заявок</q-tooltip>
        </q-btn>
        <q-btn flat text-color="primary" icon="clear_all" @click="this.openBulkModal('status')">
          <q-tooltip>Изменить статус заявок</q-tooltip>
        </q-btn>
        <q-btn flat text-color="primary" icon="star_half" @click="this.openBulkModal('priority')">
          <q-tooltip>Изменить приоритет заявок</q-tooltip>
        </q-btn>
        <q-separator
          style="margin-left: 16px;margin-right: 4px"
          :style="this.isMobile ? 'margin-left: 8px': ''"
          vertical
        />
        <q-separator
          style="margin-right: 16px"
          :style="this.isMobile ? 'margin-right: 8px': ''"
          vertical/>
        <q-btn flat text-color="primary" icon="check_box_outline_blank" @click="this.store.checkedTasks = []">
          <q-tooltip>Снять выделение</q-tooltip>
        </q-btn>
      </q-page>
    </div>
  </q-page>
  <q-dialog
    v-model="this.isDeleteSavedFilterDialogShow"
    persistent
    backdrop-filter="blur(4px)"
  >
    <q-card class="dialog-width">
      <q-toolbar class="justify-end">
        <q-btn flat round dense icon="close" v-close-popup/>
      </q-toolbar>
      <q-card-section style="padding-top: 0">
        Удалить фильтр {{ this.selectedSavedFilter }}?
      </q-card-section>
      <q-card-actions align="right">
        <q-btn
          color="white"
          text-color="primary"
          label="Отмена"
          @click="this.isDeleteSavedFilterDialogShow = false"
        />
        <q-btn
          color="primary"
          label="Удалить"
          @click="deleteSavedFilter"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
  <q-dialog v-model="this.isModalForBulkActions" persistent>
    <task-bulk-actions-modal
      :action="this.action"
      @updateTask="this.updateTask"
    />
  </q-dialog>
</template>

<script>
import { useStore } from 'stores/store'
import { useRoute } from 'vue-router'
import axios from 'axios'
import TasksComponent from 'components/tasks/TasksComponent.vue'
import TaskBulkActionsModal from 'components/tasks/TaskBulkActionsModal.vue'

export default {
  components: { TaskBulkActionsModal, TasksComponent },
  data: () => ({
    filterTypes: [
      { label: 'Исполнитель', slug: 'executor' },
      { label: 'Тег', slug: 'tag' },
      { label: 'Организация', slug: 'organization' },
      { label: 'Приоритет', slug: 'priority' },
      { label: 'Статус', slug: 'status' },
      { label: 'Клиент', slug: 'client' }
    ],
    selectedGroupType: { label: 'Исполнитель', slug: 'executor' },
    filterChain: [],
    addNewFilterSelectorText: '',
    selectedOptions: [],
    savedFilters: [],
    selectedSavedFilter: '',
    dialogNewFilterName: '',
    dialogSaveFilterVisible: false,
    isShowTableMode: false,
    isMenuActive: false,
    isFilterSelected: false,
    isDeleteSavedFilterDialogShow: false,
    isFilterOpen: true,
    isShowCompletedTasks: false,
    searchRequest: '',
    selectedTask: {},
    isNewTaskDialogShow: false,
    isTaskDialogShow: false,
    isShowDelFilterPreset: false,
    filterContainerHeight: 0,
    isModalForBulkActions: false,

    action: 'close',
    isShowBulkActionsMenu: false
  }),

  methods: {
    filterFn (val, update) {
      update(() => {
        const needle = val.toLowerCase()
        return this.executors.map(user => user.firstname + ' ' + user.lastname)
          .filter(option => option.label.toLowerCase().indexOf(needle) !== -1)
      })
    },

    handleNewFilterSelection (label) {
      this.isMenuActive = false
      const slug = this.filterTypes.filter(el => el.label === label)[0].slug
      let options
      if (slug === 'executor') { // TODO переделать на switch case
        options = this.executors
      } else if (slug === 'tag') {
        options = this.tags
      } else if (slug === 'organization') {
        options = this.organizations
      } else if (slug === 'priority') {
        options = this.priorities
      } else if (slug === 'status') {
        options = this.statuses
      } else if (slug === 'client') {
        options = this.clients
      }
      this.filterChain.push({ label, options, selectedOptions: [], slug })
      this.addNewFilterSelectorText = ''
      this.isFilterOpen = false
    },

    deleteFilter (index) {
      this.filterChain.splice(index, 1)
      this.selectedSavedFilter = ''
    },

    saveFilter () {
      if (this.dialogNewFilterName.length > 0) {
        const newFilter = {
          id: null,
          label: this.dialogNewFilterName,
          selectedOptions: this.filterChain.map(it => ({
            label: it.label,
            selectedOptions: it.selectedOptions
          }))
        }
        axios.post('/api/v1/filter', newFilter)
          .then(response => {
            this.savedFilters.push(response.data)
            this.dialogSaveFilterClose()
            this.selectedSavedFilter = response.data.label
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
      } else {
        this.$q.notify({
          message: 'Необходимо задать имя фильтра',
          type: 'negative',
          position: 'top-right',
          actions: [{
            icon: 'close', color: 'white', dense: true, handler: () => undefined
          }]
        })
      }
    },

    onSavedFilterSelected () {
      const filterElement = this.savedFilters.find(el => this.selectedSavedFilter === el.label)
      if (filterElement !== undefined) {
        this.filterChain = structuredClone(filterElement.selectedOptions)
        this.isFilterSelected = true
      } else {
        this.selectedSavedFilter = ''
        this.filterChain = []
      }
    },

    dialogSaveFilter () {
      this.dialogSaveFilterVisible = true
      this.dialogNewFilterName = ''
      setTimeout(() => this.$refs.dialogNewFilterName.focus(), 250)
    },

    dialogSaveFilterClose () {
      this.dialogSaveFilterVisible = false
    },

    deleteSavedFilter () {
      const filterId = this.savedFilters.find(filter => this.selectedSavedFilter === filter.label).id
      axios.delete(`/api/v1/filter/${filterId}`)
        .then(() => {
          this.savedFilters = this.savedFilters.filter(filter => this.selectedSavedFilter !== filter.label)
          this.selectedSavedFilter = ''
          this.isDeleteSavedFilterDialogShow = false
          this.filterChain = []
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

    changeFilterSelection () {
      this.isFilterSelected = !this.isFilterSelected
      const queryParams = new URLSearchParams(window.location.search)
      if (queryParams.get('filterChain')) {
        queryParams.delete('filterChain')
        this.$router.push({ path: this.$route.path, query: Object.fromEntries(queryParams.entries()) })
      }
    },

    getOrganizationName (task) {
      if (task) {
        return task.client.organization
          ? task.client.organization.name
          : ''
      } else {
        return ''
      }
    },

    removeFilters () {
      this.selectedSavedFilter = ''
      this.filterChain = []
    },

    base64EncodeUnicode (str) {
      return btoa(
        encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, function (match, p1) {
          return String.fromCharCode('0x' + p1)
        })
      )
    },

    base64DecodeUnicode (str) {
      return decodeURIComponent(Array.prototype.map.call(atob(str), function (c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
      }).join(''))
    },

    updateUrlWithFilterChain (filterChain) {
      const queryParams = new URLSearchParams(window.location.search)
      if (filterChain.length) {
        queryParams.set('filterChain', this.base64EncodeUnicode(JSON.stringify(filterChain)))
      } else {
        queryParams.delete('filterChain')
      }
      this.$router.push({ path: this.$route.path, query: Object.fromEntries(queryParams.entries()) })
    },

    initializeFilterChainFromUrl () {
      const queryParams = new URLSearchParams(window.location.search)
      const filterChainFromUrl = queryParams.get('filterChain')

      if (filterChainFromUrl) {
        try {
          this.filterChain = JSON.parse(this.base64DecodeUnicode(filterChainFromUrl))
          this.isFilterSelected = true
        } catch (e) {
          console.error(e)
        }
      } else {
        this.filterChain = []
      }
    },

    onTaskClicked (task) {
      this.isTaskDialogShow = true
      this.selectedTask = task
      this.updateUrlWithTask(task.id)
    },

    closeDialog () {
      const queryParams = new URLSearchParams(window.location.search)
      queryParams.delete('task')
      this.$router.push({ path: this.$route.path, query: Object.fromEntries(queryParams.entries()) })
      this.isNewTaskDialogShow = false
      this.isTaskDialogShow = false
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
        const taskFromUrl = this.store.getTasks.find(task => task.id === Number(taskIdFromUrl))
        if (taskFromUrl.completed) {
          this.isShowCompletedTasks = true
        }
        this.onTaskClicked(taskFromUrl)
      } else {
        this.isNewTaskDialogShow = false
      }
    },

    updateTask (task, newTask) {
      this.getClient.tasks[this.getClient.tasks.indexOf(task)] = newTask.data
    },

    openBulkModal (action) {
      this.action = action
      this.isModalForBulkActions = true
    },

    addMessageToTask (event) {
      this.selectedTask.messages.push(event.message)
    }
  },

  computed: {
    getFilteredTasks () {
      let tasks = this.store.getTasks.filter(task => {
        let matchesSearchRequest = true
        if (this.searchRequest) {
          matchesSearchRequest = task.name.toLowerCase().includes(this.searchRequest.toLowerCase()) ||
            task.id.toString().toLowerCase().includes(this.searchRequest.toLowerCase()) ||
            task.priority.name.toLowerCase().includes(this.searchRequest.toLowerCase()) ||
            // task.createdAt.toLowerCase().includes(this.searchRequest.toLowerCase()) ||
            task.status.name.toLowerCase().includes(this.searchRequest.toLowerCase()) // ||
            // task.executor ? (task.executor.firstname + ' ' + task.executor.lastname).toLowerCase().includes(this.searchRequest.toLowerCase()) : true
        }
        return ((!task.frozen && !task.completed) || this.isShowCompletedTasks) && matchesSearchRequest
      })
      this.filterChain.forEach(el => {
        const slug = this.filterTypes.filter(ft => ft.label === el.label)[0].slug
        switch (slug) {
          case 'executor': {
            tasks = tasks.filter(task => task.executor !== null)
              .filter(task => el.selectedOptions.includes(`${task.executor.firstname} ${task.executor.lastname}`))
            break
          }
          case 'tag': {
            const set = new Set()
            tasks.forEach(task => el.selectedOptions
              .filter(e => task.tags.map(e => e.name).includes(e))
              .forEach(() => set.add(task)))
            tasks = Array.from(set)
            break
          }
          case 'priority': {
            tasks = tasks.filter(task => el.selectedOptions.includes(task.priority.name))
            break
          }
          case 'organization': {
            tasks = tasks
              .filter(task => task.client.organization != null)
              .filter(task => el.selectedOptions.includes(task.client.organization.name))
            break
          }
          case 'status': {
            tasks = tasks.filter(task => el.selectedOptions.includes(task.status.name))
            break
          }
          case 'client': {
            tasks = tasks.filter(task => el.selectedOptions.includes(`${task.client.lastname} ${task.client.firstname}`))
          }
        }
      })
      return tasks
    },

    getGroupedTasks () {
      let options
      let source
      const tasks = this.getFilteredTasks
      const slug = this.selectedGroupType.slug
      const groupedCards = []
      switch (slug) {
        case 'executor': {
          source = this.executors
          options = Object.groupBy(tasks, ({ executor }) => {
            if (executor) {
              return executor.firstname + ' ' + executor.lastname
            } else {
              return ''
            }
          })
          break
        }
        case 'tag': {
          source = this.tags
          options = Object.groupBy(tasks, ({ tags }) => tags.map(tag => tag.name).join(','))
          break
        }
        case 'priority': {
          source = this.priorities
          options = Object.groupBy(tasks, ({ priority }) => priority.name)
          break
        }
        case 'organization': {
          source = this.organizations
          options = Object.groupBy(tasks, ({ organization }) => {
            if (organization) {
              return organization.name
            } else {
              return ''
            }
          })
          break
        }
        case 'status': {
          source = this.statuses
          options = Object.groupBy(tasks, ({ status }) => status.name)
          break
        }
        case 'client':{
          source = this.clients
          options = Object.groupBy(tasks, ({ client }) => `${client.lastname} ${client.firstname}`)
        }
      }

      if (slug === 'tag') {
        for (const [keys, value] of Object.entries(options)) {
          for (const key of keys.split(',')) {
            const existingCard = groupedCards.find(card => card.title === key)
            if (existingCard) {
              existingCard.taskCards.push(value[0])
            } else {
              groupedCards.push({
                title: key,
                taskCards: [value[0]]
              })
            }
          }
        }
        groupedCards.forEach(it => {
          it.title = `${it.title} (${it.taskCards.length})`
        })
      } else if (slug === 'organization') {
        if (options['']) {
          options[''].forEach(task => {
            const existingCard = groupedCards.find(card => card.title === this.getOrganizationName(task))
            if (existingCard) {
              existingCard.taskCards.push(task)
            } else {
              groupedCards.push({
                title: this.getOrganizationName(task),
                taskCards: [task]
              })
            }
          })
        }
        groupedCards.forEach(it => {
          it.title = `${it.title} (${it.taskCards.length})`
        })
      } else {
        source.forEach(el => {
          groupedCards.push({
            title: options[el] ? `${el} (${options[el].length})` : el,
            taskCards: options[el]
          })
        })
      }
      return groupedCards
    },

    getTableRows () {
      try {
        return this.getFilteredTasks
      } catch (e) {
        return []
      }
    },

    // showMode () {
    //   return this.router.query['show-mode']
    // },

    executors () {
      return this.store.users.filter(user => user !== null)
        .filter(user => user.roles !== 'OBSERVER')
        .map(user => user.firstname + ' ' + user.lastname)
    },

    tags () {
      return this.store.tags.map(tag => tag.name)
    },

    priorities () {
      return this.store.priorities.map(priority => priority.name)
    },

    organizations () {
      return this.store.organizations.map(organization => organization.name)
    },

    statuses () {
      return this.store.statuses.map(status => status.name)
    },

    clients () {
      return this.store.clients.map(client => `${client.lastname} ${client.firstname}`)
    },

    isMobile () {
      return this.$q.screen.width < 1023
    },

    urlFilterChain () {
      return new URLSearchParams(window.location.search).get('filterChain')
    },

    showBulkActionsMenu () {
      return this.store.checkedTasks.length > 0
    }
  },

  watch: {
    filterChain: {
      handler (newVal) {
        if (this.isFilterSelected) {
          this.filterContainerHeight = document.getElementById('filter-container').scrollHeight
        }
        this.updateUrlWithFilterChain(newVal)
        const queryParams = new URLSearchParams(window.location.search)
        const filterChainFromUrl = queryParams.get('filterChain')
        try {
          const filters = JSON.parse(this.base64DecodeUnicode(filterChainFromUrl))
          document.getElementById(`filter_${filters[filters.length - 1].slug}`).children[0].click()
        } catch (ignored) {
        }
      },
      deep: true
    },

    isShowTableMode (newValue) {
      localStorage.setItem('isShowListMode', newValue ? 'true' : 'false')
    },

    selectedSavedFilter: {
      handler (newVal) {
        this.isShowDelFilterPreset = newVal !== ''
      },
      deep: true
    },

    '$route' (to) {
      this.initializeFilterChainFromUrl()
      this.initializeTaskFromUrl()
    },

    selectedGroupType () {
      localStorage.setItem('GroupType', `{ "label": "${this.selectedGroupType.label}", "slug": "${this.selectedGroupType.slug}" }`)
    },

    isFilterSelected () {
      if (this.isFilterSelected) {
        setTimeout(() => { this.filterContainerHeight = document.getElementById('filter-container').scrollHeight }, 100)
      } else {
        this.filterContainerHeight = 0
      }
    },

    isShowCompletedTasks () {
      localStorage.setItem('isShowCompletedTasks', this.isShowCompletedTasks)
    },

    showBulkActionsMenu () {
      if (this.showBulkActionsMenu) {
        this.isShowBulkActionsMenu = true
      } else {
        document.getElementsByClassName('mass-container')[0].style.animationName = 'HideBulkContainer'
        document.getElementsByClassName('mass-container')[0].style.animationPlayState = 'start'
        setTimeout(() => { this.isShowBulkActionsMenu = false }, 200)
      }
    }
  },

  mounted () {
    document.title = 'ULDESK : Заявки'
    this.store.checkedTasks = []
    setTimeout(() => this.initializeTaskFromUrl(), 300)
    setTimeout(() => this.initializeFilterChainFromUrl(), 300)
    axios.get('/api/v1/filters')
      .then(response => {
        this.savedFilters = response.data
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

  created () {
    this.isShowCompletedTasks = localStorage.getItem('isShowCompletedTasks') !== 'false'
    this.isShowTableMode = localStorage.getItem('isShowListMode') !== 'false'
    const savedGroupType = localStorage.getItem('GroupType')
    if (savedGroupType) {
      this.selectedGroupType = JSON.parse(savedGroupType)
    }
  },

  setup () {
    const store = useStore()
    const router = useRoute()
    return { store, router }
  }
}
</script>

<style>
.board {
  white-space: nowrap;
}

.scroll-container {
  display: flex;
  overflow-x: auto;
  overflow-y: auto;
  width: 100%;
}

.mass-container {
  position: absolute;
  background-color: white;
  left: 38vw;
  bottom: -150px;
  animation-name: BulkContainer;
  animation-duration: 0.2s;
  animation-fill-mode: forwards;
}

@keyframes BulkContainer {

  from {
    bottom: -150px;
  }

  to {
    bottom: 8px;
  }
}

@keyframes HideBulkContainer {

  from {
    bottom: 8px;
  }

  to {
    bottom: -150px;
  }
}

</style>
