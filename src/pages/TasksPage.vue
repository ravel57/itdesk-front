<template>
  <q-layout style="min-height: 0">
    <q-page-container>
      <q-page padding style="min-height: 0">
        <div :style="this.isMobile ? 'display: flex; flex-direction: column;' : 'display: flex'">
          <div style="display: flex; width: 100%;">
            <q-input
              outlined
              v-model="this.searchRequest"
              label="Поиск"
              style="width: 100%; align-content: center; min-width: 300px; padding-right: 8px"
              clearable
            />
          </div>
          <div style="display: flex">
            <q-btn-dropdown
              v-if="!this.isShowListMode"
              color="primary"
              :label="this.selectedGroupType.label"
              style="align-content: center;"
            >
              <q-list>
                <q-item
                  v-for="(grouper, index) in this.filterType"
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
            <q-btn
              icon="filter_alt"
              flat
              @click="this.changeFilterSelection"
              :color="this.isFilterSelected ? 'primary' : 'dark'"
            />
            <q-toggle
              v-model="this.isShowListMode"
              color="grey"
              left-label
              checked-icon="list"
              unchecked-icon="dashboard"
              size="50px"
              keep-color
            />
            <q-toggle
              v-model="this.isShowCompletedTasks"
              color="primary"
              left-label
              icon="add_task"
              size="50px"
            />
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
                    label="название"
                    v-model="this.dialogNewFilterName"
                    ref="dialogNewFilterName"
                  />
                  {{ this.filterChain.map(it => ({label: it.label, selectedOptions: it.selectedOptions})) }}
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
          style="display: flex;margin-top: 8px; align-items: center;">
          <q-select
            outlined
            v-model="this.selectedSavedFilter"
            :options="this.savedFilters.map(it => it.label)"
            label="Сохраненные фильтры"
            style="width: 25%; align-content: center; min-width: 300px; margin-right: 8px"
            @update:model-value="this.onSavedFilterSelected"
            clearable
          />
          <q-btn
            v-if="this.selectedSavedFilter.length > 0"
            ref="deleteSavedFilterButton"
            icon="delete"
            color="grey"
            @click="isDeleteSavedFilterDialogShow = true"
            style="margin-right: 8px"
            flat
          />
          <div
            v-if="this.isFilterSelected"
            style="overflow: auto; margin-right: 8px"
          >
            <div class="scroll-container">
              <div
                v-for="(filter, index) in this.filterChain"
                :key="index"
                style="display: flex; border-right: 16px; padding-right: 16px"
                :id="`filter_${index}`"
              >
                <q-select
                  outlined
                  :label="filter.label"
                  multiple
                  :options="filter.options"
                  use-chips
                  use-input
                  dense
                  filled
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
            v-if="filterType.filter(o => !this.filterChain.map(fc=> fc.label).includes(o.label)).length > 0"
            flat
            color="grey"
            icon="add_circle"
            @click="!this.isMenuActive"
          >
            <q-menu
              v-model="this.isMenuActive"
              anchor="bottom right"
              self="top right"
            >
              <q-list>
                <q-item
                  v-for="option in filterType.filter(o => !this.filterChain.map(fc=> fc.label).includes(o.label))"
                  :key="option.value"
                  clickable
                  @click="handleNewFilterSelection(option.label)"
                >
                  <q-item-section>{{ option.label }}</q-item-section>
                </q-item>
              </q-list>
            </q-menu>
          </q-btn>
<!--          <q-select-->
<!--            outlined-->
<!--            v-model="this.addNewFilterSelectorText"-->
<!--            :options="this.filterType.map(e => e.label)"-->
<!--            dense-->
<!--            @update:model-value="handleNewFilterSelection($event)"-->
<!--            ref="newFilterSelector"-->
<!--          >-->
<!--            <template v-slot:prepend>-->
<!--              <q-icon name="add_circle"/>-->
<!--            </template>-->
<!--          </q-select>-->
          <q-btn
            ref="saveFilterButton"
            icon="save"
            color="grey"
            @click="this.dialogSaveFilter"
            flat
            style="height: 40px"
          />
          <q-btn
            v-if="this.filterChain.length > 0"
            icon="cancel"
            color="grey"
            @click="this.removeFilters"
            flat
            style="height: 40px"
          />
        </div>
        <q-table
          v-if="this.isShowListMode"
          :rows="this.getTableRows"
          :columns="this.tableColumns"
          :rows-per-page-options="[10, 20, 50]"
          :sortable="true"
          row-key="id"
          style="margin-top: 8px"
          rows-per-page-label="Строк на странице"
        >
          <template v-slot:body-cell-name="props">
            <q-td :props="props">
              <router-link :to="{path: `/chats/${props.row.client.id}`, query: { task: props.row.id }}">
                {{ props.row.name }}
              </router-link>
            </q-td>
          </template>
        </q-table>
        <q-scroll-area
          v-else
          class="board"
          horizontal
          style="height: 75vh; margin-top: 8px"
        >
          <div
            v-for="(taskList, index) in this.getGroupedTasks"
            :key="index"
            class="list"
          >
            <div
              class="list-header sticky-tabs"
              v-text="taskList.title"
            />
            <div
              class="list-cards"
            >
              <q-item
                v-for="(task, index) in taskList.taskCards"
                :key="index"
                class="no-padding"
              >
                <router-link
                  class="card"
                  clickable
                  :to="{path: `/chats/${task.client.id}`,query: { task: task.id }}"
                >
                  {{ this.shortenLine(`${task.name}: ${task.client.lastname} ${task.client.firstname}`) }}
                </router-link>
              </q-item>
            </div>
          </div>
        </q-scroll-area>
      </q-page>
      <q-dialog
        v-model="this.isDeleteSavedFilterDialogShow"
        persistent
        backdrop-filter="blur(4px)"
      >
        <q-card class="dialog-width">
          <q-toolbar class="justify-end">
            <q-btn flat round dense icon="close" v-close-popup />
          </q-toolbar>
          <q-card-section style="padding-top: 0">
            Удалить фильтр {{ this.selectedSavedFilter.name }}?
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
    </q-page-container>
  </q-layout>
</template>

<script>
import { useStore } from 'stores/store'
import { useRoute } from 'vue-router'
import axios from 'axios'
import moment from 'moment/moment'

export default {
  data: () => ({
    filterType: [
      { label: 'Исполнитель', slug: 'executor' },
      { label: 'Тег', slug: 'tag' },
      { label: 'Организация', slug: 'organization' },
      { label: 'Приоритет', slug: 'priority' },
      { label: 'Статус', slug: 'status' }
    ],
    selectedGroupType: { label: 'Исполнитель', slug: 'executor' },
    filterChain: [],
    addNewFilterSelectorText: '',
    selectedOptions: [],
    savedFilters: [],
    selectedSavedFilter: '',
    dialogNewFilterName: '',
    dialogSaveFilterVisible: false,
    isShowListMode: false,
    isMenuActive: false,
    isFilterSelected: false,
    isDeleteSavedFilterDialogShow: false,
    isFilterOpen: true,
    isShowCompletedTasks: false,
    searchRequest: '',
    tableColumns: [
      {
        name: 'name',
        label: 'Название',
        align: 'left',
        field: row => row.name.length > 31 ? row.name.substring(0, 60) + '...' : row.name,
        sortable: true
      },
      {
        name: 'tags',
        label: 'Теги',
        align: 'left',
        field: row => row.tags.map(tag => tag.name).join(', '),
        sortable: true
      },
      {
        name: 'priority',
        label: 'Приоритет',
        align: 'left',
        field: row => row.priority.name,
        sortable: true
      },
      {
        name: 'createdAt',
        label: 'Создана',
        align: 'left',
        field: row => row.createdAt.toLocaleTimeString('ru-RU', {
          timeZone: 'Europe/Moscow',
          year: 'numeric',
          month: 'numeric',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }),
        sortable: true
      },
      {
        name: 'status',
        label: 'Статус',
        align: 'left',
        field: row => row.status.name,
        sortable: true
      },
      {
        name: 'deadline',
        label: 'Дедлайн',
        align: 'left',
        field: row => row.deadline
          ? row.deadline.toLocaleTimeString('ru-RU', {
            timeZone: 'Europe/Moscow',
            year: 'numeric',
            month: 'numeric',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })
          : '',
        sortable: true
      },
      {
        name: 'executor',
        label: 'Исполнитель',
        align: 'left',
        field: row => row.executor
          ? row.executor.firstname + ' ' + row.executor.lastname
          : '',
        sortable: true
      },
      {
        name: 'sla',
        label: 'SLA',
        align: 'left',
        field: row => {
          if (!row.sla || !row.sla.startDate || !row.sla.duration) {
            return '0 ч. 0 м.'
          }
          const endDateTime = moment(row.sla.startDate).clone().add(moment.duration(row.sla.duration))
          const now = moment()
          const duration = moment.duration(endDateTime.diff(now))
          if (duration.asMilliseconds() < 0) {
            return '0 ч. 0 м.'
          } else {
            return `${duration.days() * 24 + duration.hours()} ч. ${duration.minutes()} м.`
          }
        },
        sortable: true
      }
    ]
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
      const slug = this.filterType.filter(el => el.label === label)[0].slug
      let options
      if (slug === 'executor') {
        options = this.executors
      } else if (slug === 'tag') {
        options = this.tags
      } else if (slug === 'organization') {
        options = this.organizations
      } else if (slug === 'priority') {
        options = this.priorities
      } else if (slug === 'status') {
        options = this.statuses
      }
      this.filterChain.push({ label, options, selectedOptions: [] })
      this.addNewFilterSelectorText = ''
      this.isFilterOpen = false
    },

    deleteFilter (index) {
      this.filterChain.splice(index, 1)
    },

    saveFilter () {
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
      this.filterChain = []
    },

    shortenLine (string) {
      if (string.length > 31) {
        return string.substring(0, 31) + '...'
      } else {
        return string
      }
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
    }
  },

  computed: {
    getFilteredTasks () {
      let tasks = this.store.getTasks.filter(task => {
        let matchesSearchRequest = true
        if (this.searchRequest) {
          matchesSearchRequest = task.name.toLowerCase().includes(this.searchRequest.toLowerCase())
        }
        return (!task.completed || this.isShowCompletedTasks) && matchesSearchRequest
      })
      this.filterChain.forEach(el => {
        const slug = this.filterType.filter(ft => ft.label === el.label)[0].slug
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

    isMobile () {
      return this.$q.screen.width < 1023
    }
  },

  watch: {
    filterChain: {
      handler (newVal) {
        this.updateUrlWithFilterChain(newVal)
        try {
          if (!this.isFilterOpen) {
            document.getElementById(`filter_${newVal.length - 1}`).children[0].click()
            this.isFilterOpen = true
          }
        } catch (ignored) {
        }
      },
      deep: true
    }
  },

  mounted () {
    setInterval(() => this.initializeFilterChainFromUrl(), 100)
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

.list {
  display: inline-block;
  vertical-align: top;
  width: 300px;
  margin-right: 20px;
}

.list-header {
  background-color: #f1f1f1;
  padding: 10px;
  font-weight: bold;
}

.list-cards {
  padding: 10px;
}

.card {
  background-color: #fff;
  border: 1px solid #ccc;
  margin-bottom: 10px;
  padding: 10px;
  width: 300px;
  display: inline-block;
  text-decoration: none;
  color: black;
}

.sticky-tabs {
  position: sticky;
  top: 0;
  z-index: 1;
}

.scroll-container {
  display: flex;
  overflow-x: auto;
  overflow-y: hidden;
  width: 100%;
}
</style>
