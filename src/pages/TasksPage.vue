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
            style="width: 100%;"
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
            <q-btn-dropdown color="primary" :label="this.selectedFilterType.label">
              <q-list>
                <q-item
                  v-for="(filter, index) in this.filterType"
                  :key="index"
                  clickable
                  v-close-popup
                  @click="this.selectedFilterType = filter"
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
          :columns="tableColumns"
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
            class="list"
            v-for="(taskList, index) in this.getTasks"
            :key="index"
          >
            <div class="list-header sticky-tabs">{{ taskList.title }}</div>
            <div class="list-cards">
              <q-item
                v-for="(task, index) in taskList.taskCards"
                :key="index"
                class="card"
                clickable
                @click="this.onCardClick(task)"
              >
                {{ task.name }}
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
      { label: 'Исполитель', slug: 'executor' },
      { label: 'Тег', slug: 'tag' },
      { label: 'Организация', slug: 'organization' },
      { label: 'Приоритет', slug: 'priority' },
      { label: 'Статус', slug: 'status' }
    ],

    selectedFilterType: { label: 'Исполитель', slug: 'executor' },

    filterChain: [],

    addNewFilterSelectorText: '',

    selectedOptions: [],

    savedFilters: [],

    selectedSavedFilter: '',

    dialogNewFilterName: '',

    dialogSaveFilterVisible: false,

    isShowListMode: false,

    tableColumns: [
      { name: 'name', label: 'Name', align: 'left', field: 'name' },
      { name: 'tags', label: 'Tags', align: 'left', field: 'tags', format: (val) => val.join(', ') },
      { name: 'priority', label: 'Priority', align: 'left', field: 'priority' },
      { name: 'createdAt', label: 'Created At', align: 'left', field: 'createdAt' },
      { name: 'status', label: 'Status', align: 'left', field: 'status' },
      { name: 'deadline', label: 'Deadline', align: 'left', field: 'deadline' },
      { name: 'executor', label: 'Executor', align: 'left', field: 'executor' },
      { name: 'sla', label: 'SLA', align: 'left', field: 'sla' }
    ]
  }),

  methods: {
    filterFn (val, update) {
      update(() => {
        const needle = val.toLowerCase()
        return this.executors.filter(option => option.label.toLowerCase().indexOf(needle) !== -1)
      })
    },

    handleNewFilterSelection (event) {
      const slug = this.filterType.filter(el => el.label === event)[0].slug
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
      this.filterChain.push({ label: event, options, selectedOptions: [] })
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
      axios.post('/api/v1/new-filter', newFilter) /* http://localhost:8080 */
        .then(response => {
          this.savedFilters.push(newFilter)
          this.dialogSaveFilterVisible = false
          this.dialogNewFilterName = ''
        })
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
        if (slug === 'executor') {
          tasks = tasks.filter(t => el.selectedOptions.includes(t.executor))
        } else if (slug === 'tag') {
          tasks = tasks.filter(t => el.selectedOptions.includes(t.tag.name))
        } else if (slug === 'priority') {
          tasks = tasks.filter(t => el.selectedOptions.includes(t.priority))
        } else if (slug === 'organization') {
          tasks = tasks.filter(t => el.selectedOptions.includes(t.organization))
        } else if (slug === 'status') {
          tasks = tasks.filter(t => el.selectedOptions.includes(t.status))
        }
      })
      return tasks
    },

    getTasks () {
      let options
      let source
      const tasks = this.getFilteredTasks
      const slug = this.selectedFilterType.slug
      const sortedCards = []
      if (slug === 'executor') {
        source = this.executors
        options = Object.groupBy(tasks, ({ executor }) => executor)
      } else if (slug === 'tag') {
        source = this.tags
        options = Object.groupBy(tasks, ({ tags }) => tags)
      } else if (slug === 'priority') {
        source = this.priorities
        options = Object.groupBy(tasks, ({ priority }) => priority)
      } else if (slug === 'organization') {
        source = this.organizations
        options = Object.groupBy(tasks, ({ organization }) => organization)
      } else if (slug === 'status') {
        source = this.statuses
        options = Object.groupBy(tasks, ({ status }) => status)
      }
      source.forEach(el => {
        sortedCards.push({
          title: el,
          taskCards: options[el]
        })
      })
      return sortedCards
    },

    getTableRows () {
      try {
        return this.getFilteredTasks.map(it => {
          it.tags = it.tags.map(it => it.name)
          return it
        })
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
      return Array.from(new Set(this.store.getTasks.map(task => task.priority)))
    },

    organizations () {
      return this.store.organizations.map(organization => organization.name)
    },

    statuses () {
      return Array.from(new Set(this.store.getTasks.map(task => task.status)))
    }
  },

  mounted () { // FIXME перенести в store
    axios.get('/api/v1/filters') /* http://localhost:8080 */
      .then(response => { this.savedFilters = response.data })
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
