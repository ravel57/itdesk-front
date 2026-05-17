<template>
  <q-page class="export-page q-pa-md">
    <div class="export-page__header q-mb-md">
      <div>
        <div class="text-h6">Экспорт заявок</div>
      </div>

      <q-btn
        icon="upgrade"
        color="primary"
        label="Экспорт"
        :loading="exporting"
        @click="sendExportRequest"
      />
    </div>

    <q-card flat bordered class="export-card">
      <q-card-section>
        <div class="text-subtitle1 q-mb-md">Фильтры отчета</div>

        <div class="row q-col-gutter-md">
          <div class="col-12 col-md-4">
            <q-input
              v-model="filters.createdFrom"
              outlined
              dense
              type="date"
              label="Создано с"
              clearable
            />
          </div>

          <div class="col-12 col-md-4">
            <q-input
              v-model="filters.createdTo"
              outlined
              dense
              type="date"
              label="Создано по"
              clearable
            />
          </div>

          <div class="col-12 col-md-4">
            <q-select
              v-model="filters.completed"
              outlined
              dense
              emit-value
              map-options
              label="Состояние"
              :options="completedOptions"
            />
          </div>

          <div class="col-12 col-md-4">
            <q-input
              v-model="filters.updatedFrom"
              outlined
              dense
              type="date"
              label="Изменено с"
              clearable
            />
          </div>

          <div class="col-12 col-md-4">
            <q-input
              v-model="filters.updatedTo"
              outlined
              dense
              type="date"
              label="Изменено по"
              clearable
            />
          </div>

          <div class="col-12 col-md-4">
            <q-input
              v-model="filters.timezone"
              outlined
              dense
              label="Часовой пояс"
              hint="Например: Europe/Moscow"
            />
          </div>

          <div class="col-12 col-md-4">
            <q-input
              v-model="filters.closedFrom"
              outlined
              dense
              type="date"
              label="Закрыто с"
              clearable
            />
          </div>

          <div class="col-12 col-md-4">
            <q-input
              v-model="filters.closedTo"
              outlined
              dense
              type="date"
              label="Закрыто по"
              clearable
            />
          </div>
        </div>
      </q-card-section>

      <q-separator />

      <q-card-section>
        <div class="row q-col-gutter-md">
          <div class="col-12 col-md-4">
            <q-select
              v-model="filters.statusIds"
              outlined
              dense
              multiple
              emit-value
              map-options
              use-chips
              label="Статусы"
              :options="statusOptions"
            />
          </div>

          <div class="col-12 col-md-4">
            <q-select
              v-model="filters.priorityIds"
              outlined
              dense
              multiple
              emit-value
              map-options
              use-chips
              label="Приоритеты"
              :options="priorityOptions"
            />
          </div>

          <div class="col-12 col-md-4">
            <q-select
              v-model="filters.executorIds"
              outlined
              dense
              multiple
              emit-value
              map-options
              use-chips
              label="Исполнители"
              :options="userOptions"
            />
          </div>

          <div class="col-12 col-md-4">
            <q-select
              v-model="filters.organizationIds"
              outlined
              dense
              multiple
              emit-value
              map-options
              use-chips
              label="Организации"
              :options="organizationOptions"
            />
          </div>

          <div class="col-12 col-md-4">
            <q-select
              v-model="filters.typeIds"
              outlined
              dense
              multiple
              emit-value
              map-options
              use-chips
              label="Типы заявок"
              :options="taskTypeOptions"
            />
          </div>

          <div class="col-12 col-md-4">
            <q-select
              v-model="filters.tagIds"
              outlined
              dense
              multiple
              emit-value
              map-options
              use-chips
              label="Теги"
              :options="tagOptions"
            />
          </div>
        </div>
      </q-card-section>

      <q-separator />

      <q-card-actions align="right">
        <q-btn
          flat
          label="Сбросить"
          :disable="exporting"
          @click="resetFilters"
        />

        <q-btn
          color="primary"
          icon="upgrade"
          label="Экспортировать Excel"
          :loading="exporting"
          @click="sendExportRequest"
        />
      </q-card-actions>
    </q-card>
  </q-page>
</template>

<script>
import axios from 'axios'

const DEFAULT_FILTERS = () => ({
  createdFrom: null,
  createdTo: null,
  updatedFrom: null,
  updatedTo: null,
  closedFrom: null,
  closedTo: null,
  completed: 'all',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Moscow',
  statusIds: [],
  priorityIds: [],
  executorIds: [],
  organizationIds: [],
  typeIds: [],
  tagIds: []
})

export default {
  name: 'ExportPage',

  data: () => ({
    exporting: false,
    filters: DEFAULT_FILTERS(),
    statuses: [],
    priorities: [],
    users: [],
    organizations: [],
    taskTypes: [],
    tags: [],
    completedOptions: [
      { label: 'Все', value: 'all' },
      { label: 'Только открытые', value: 'false' },
      { label: 'Только закрытые', value: 'true' }
    ]
  }),

  computed: {
    statusOptions () {
      return this.statuses.map(item => ({ label: item.name, value: item.id }))
    },

    priorityOptions () {
      return this.priorities.map(item => ({ label: item.name, value: item.id }))
    },

    userOptions () {
      return this.users.map(user => ({
        label: this.getUserName(user),
        value: user.id
      }))
    },

    organizationOptions () {
      return this.organizations.map(item => ({ label: item.name, value: item.id }))
    },

    taskTypeOptions () {
      return this.taskTypes.map(item => ({ label: item.type, value: item.id }))
    },

    tagOptions () {
      return this.tags.map(item => ({ label: item.name, value: item.id }))
    }
  },

  mounted () {
    this.loadDictionaries()
  },

  methods: {
    loadDictionaries () {
      Promise.allSettled([
        axios.get('/api/v1/statuses').then(response => { this.statuses = Array.isArray(response.data) ? response.data : [] }),
        axios.get('/api/v1/priorities').then(response => { this.priorities = Array.isArray(response.data) ? response.data : [] }),
        axios.get('/api/v1/users').then(response => { this.users = Array.isArray(response.data) ? response.data : [] }),
        axios.get('/api/v1/organizations').then(response => { this.organizations = Array.isArray(response.data) ? response.data : [] }),
        axios.get('/api/v1/task-types').then(response => { this.taskTypes = Array.isArray(response.data) ? response.data : [] }),
        axios.get('/api/v1/tags').then(response => { this.tags = Array.isArray(response.data) ? response.data : [] })
      ])
    },

    resetFilters () {
      this.filters = DEFAULT_FILTERS()
    },

    sendExportRequest () {
      this.exporting = true

      axios.get('/api/v1/export/to-excel', {
        params: this.buildParams(),
        responseType: 'blob'
      })
        .then(response => {
          const blob = new Blob([response.data], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          })
          const url = window.URL.createObjectURL(blob)
          const link = document.createElement('a')
          link.href = url
          link.setAttribute('download', this.resolveFilename(response) || 'tasks_report.xlsx')
          document.body.appendChild(link)
          link.click()
          link.parentNode.removeChild(link)
          window.URL.revokeObjectURL(url)
        })
        .catch(error => {
          this.$q.notify({
            type: 'negative',
            message: error.response?.data || 'Не удалось выгрузить отчет'
          })
        })
        .finally(() => {
          this.exporting = false
        })
    },

    buildParams () {
      const params = {}

      const setValue = (key, value) => {
        if (value === null || value === undefined || value === '' || value === 'all') {
          return
        }
        params[key] = value
      }

      const setArray = (key, value) => {
        if (!Array.isArray(value) || !value.length) {
          return
        }
        params[key] = value.join(',')
      }

      setValue('createdFrom', this.filters.createdFrom)
      setValue('createdTo', this.filters.createdTo)
      setValue('updatedFrom', this.filters.updatedFrom)
      setValue('updatedTo', this.filters.updatedTo)
      setValue('closedFrom', this.filters.closedFrom)
      setValue('closedTo', this.filters.closedTo)
      setValue('completed', this.filters.completed)
      setValue('timezone', this.filters.timezone)

      setArray('statusIds', this.filters.statusIds)
      setArray('priorityIds', this.filters.priorityIds)
      setArray('executorIds', this.filters.executorIds)
      setArray('organizationIds', this.filters.organizationIds)
      setArray('typeIds', this.filters.typeIds)
      setArray('tagIds', this.filters.tagIds)

      return params
    },

    resolveFilename (response) {
      const header = response.headers?.['content-disposition']
      if (!header) {
        return null
      }

      const matched = /filename="?([^";]+)"?/i.exec(header)
      return matched?.[1] || null
    },

    getUserName (user) {
      if (!user) {
        return ''
      }

      const fullName = `${user.lastname || ''} ${user.firstname || ''}`.trim()
      return fullName || user.username || `#${user.id}`
    }
  }
}
</script>

<style scoped>
.export-page__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.export-card {
  border-radius: 12px;
}
</style>
