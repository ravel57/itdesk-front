<template>
  <q-layout view="hHh lpR fFf">
    <q-page-container>
      <q-page padding>
        <div style="display: flex" class="justify-center">
          <q-select
            outlined
            v-model="this.selectedSavedFilter"
            :options="this.savedFilters.map(it => it.label)"
            label="Сохраненные фильтры"
            style="width: 100%; align-content: center;"
            @update:model-value="this.onSavedFilterSelected"
            clearable
          />
          <q-btn
            v-if="this.selectedSavedFilter.length > 0"
            ref="deleteSavedFilterButton"
            icon="delete"
            @click="this.deleteSavedFilter"
            flat
          />
          <div class="q-pa-md q-loading-bar--right" v-if="!this.isShowListMode">
            <q-btn-dropdown color="primary" :label="this.selectedGroupType.label">
              <q-list>
                <q-item
                  v-for="(filter, index) in this.filterType"
                  :key="index"
                  clickable
                  v-close-popup
                  @click="this.selectedGroupType = filter"
                >
                  <q-item-section>
                    <q-item-label>{{ filter.label }}</q-item-label>
                  </q-item-section>
                </q-item>
              </q-list>
            </q-btn-dropdown>
          </div>
          <q-toggle
            v-model="this.isShowListMode"
            color="grey"
            left-label
            label="Режим отображения"
            checked-icon="list"
            unchecked-icon="dashboard"
            size="50px"
            keep-color
          />
          <q-dialog
            v-model="dialogSaveFilterVisible"
            persistent
            backdrop-filter="blur(4px)"
          >
            <q-card>
              <q-card-section>
                Сохранить фильтр?
                <br>
                <q-input label="название" v-model="this.dialogNewFilterName"/>
                <br>
                {{ this.filterChain.map(it => ({label: it.label, selectedOptions: it.selectedOptions})) }}
              </q-card-section>
              <q-card-actions align="right">
                <q-btn
                  color="white"
                  text-color="primary"
                  label="Закрыть"
                  @click="this.dialogSaveFilterVisible = false"
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
        <div class="q-pa-md" style="display: flex;">
          <div class="scroll-container">
            <div
              v-for="(filter, index) in this.filterChain"
              :key="index"
              style="display: flex; border-right: 16px; padding-right: 16px"
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
<!--            @filter="filterFn"-->
                <template v-slot:no-option>
                  <q-item>
                    <q-item-section class="text-grey">
                      No results
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
          <q-select
            outlined
            v-model="addNewFilterSelectorText"
            :options="this.filterType.map(e => e.label)"
            dense
            @update:model-value="handleNewFilterSelection($event)"
            ref="newFilterSelector"
          >
            <template v-slot:prepend>
              <q-icon name="add_circle"/>
            </template>
          </q-select>
          <q-btn
            ref="saveFilterButton"
            icon="save"
            @click="this.dialogSaveFilterVisible = true"
            flat
          />
        </div>
        <q-table
          v-if="this.isShowListMode"
          :rows="this.getTableRows"
          :columns="this.tableColumns"
          :rows-per-page-options="[10, 20, 50]"
          rows-per-page-label="Строк на странице"
          @row-click="onRowClick"
        />
        <q-scroll-area
          v-else
          class="board"
          horizontal
          style="height: 75vh"
        >
          <div
            v-for="(taskList, index) in this.getTasks"
            :key="index"
            class="list"
          >
            <div class="list-header sticky-tabs" v-text="taskList.title"/>
            <div class="list-cards">
              <q-item
                v-for="(task, index) in taskList.taskCards"
                :key="index"
                class="card"
                clickable
                @click="this.onCardClick(task)"
              >
                {{ task.name }}: {{ task.client.firstname + ' ' + task.client.lastname }}
              </q-item>
            </div>
          </div>
        </q-scroll-area>
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<script>
import { useStore } from 'stores/store'
import { useRoute } from 'vue-router'
import axios from 'axios'

export default {
  data: () => ({
    filterType: [
      { label: 'Исполнитель', slug: 'executor' },
      { label: 'Тег', slug: 'tag' },
      { label: 'Организация', slug: 'organization' },
      { label: 'Приоритет', slug: 'priority' },
      { label: 'Статус', slug: 'status' }
    ],

    selectedGroupType: { label: 'Исполитель', slug: 'executor' },

    filterChain: [],

    addNewFilterSelectorText: '',

    selectedOptions: [],

    savedFilters: [],

    selectedSavedFilter: '',

    dialogNewFilterName: '',

    dialogSaveFilterVisible: false,

    isShowListMode: false,

    tableColumns: [
      {
        name: 'name',
        label: 'Название',
        align: 'left',
        field: 'name'
      },
      {
        name: 'name',
        label: 'Название',
        align: 'left',
        field: row => row.name
      },
      {
        name: 'tags',
        label: 'Теги',
        align: 'left',
        field: row => row.tags.map(tag => tag.name).join(', ')
      },
      {
        name: 'priority',
        label: 'Приоритет',
        align: 'left',
        field: row => row.priority.name
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
        })
      },
      {
        name: 'status',
        label: 'Статус',
        align: 'left',
        field: row => row.status.name
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
          : ''
      },
      {
        name: 'executor',
        label: 'Исполнитель',
        align: 'left',
        field: row => row.executor.firstname + ' ' + row.executor.lastname
      },
      {
        name: 'sla',
        label: 'SLA',
        align: 'left',
        field: row => row.sla
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
    },

    onRowClick (event, row, index) {
      this.onCardClick(row)
    },

    onCardClick (card) {
      this.$router.push({ path: `/chats/${card.client.id}` })
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
      axios.post('/api/v1/new-filter', newFilter)
        .then(() => {
          this.savedFilters.push(newFilter)
          this.dialogSaveFilterVisible = false
          this.dialogNewFilterName = ''
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
      const filterElement = this.savedFilters.filter(el => this.selectedSavedFilter === el.label)[0]
      if (filterElement !== undefined) {
        this.filterChain = structuredClone(filterElement.selectedOptions)
      } else {
        this.selectedSavedFilter = ''
        this.filterChain = []
      }
    },

    deleteSavedFilter () {
    }
  },

  computed: {
    getFilteredTasks () {
      let tasks = this.store.getTasks.filter(task => !task.completed)
      this.filterChain.forEach(el => {
        const slug = this.filterType.filter(ft => ft.label === el.label)[0].slug
        switch (slug) {
          case 'executor': {
            tasks = tasks.filter(task => el.selectedOptions.includes(task.executor.name))
            break
          }
          case 'tag': {
            const tt = new Set()
            tasks.forEach(task => el.selectedOptions.filter(e => task.tags.map(e => e.name).includes(e)).forEach(e => tt.add(task)))
            tasks = Array.from(tt)
            break
          }
          case 'priority': {
            tasks = tasks.filter(task => el.selectedOptions.includes(task.priority))
            break
          }
          case 'organization': {
            tasks = tasks.filter(task => el.selectedOptions.includes(task.organization.name))
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

    getTasks () {
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
      } else if (slug === 'organization') {
        options[''].forEach(task => {
          const existingCard = groupedCards.find(card => card.title === task.client.organization.name)
          if (existingCard) {
            existingCard.taskCards.push(task)
          } else {
            groupedCards.push({
              title: task.client.organization.name,
              taskCards: [task]
            })
          }
        })
      } else {
        source.forEach(el => {
          groupedCards.push({
            title: el,
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
      return this.store.users.filter(user => user.roles !== 'OBSERVER')
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
    }
  },

  mounted () {
    axios.get('/api/v1/filters')
      .then(response => { this.savedFilters = response.data })
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
