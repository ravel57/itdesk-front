<template>
  <q-page class="q-pa-md incidents-page">
    <div class="row items-center q-col-gutter-md q-mb-md">
      <div class="col-12 col-md">
        <div class="text-h5">Инциденты</div>
        <div class="text-caption text-grey-7">Массовые проблемы, связанные заявки и коммуникации</div>
      </div>
      <div class="col-auto" v-if="canEdit">
        <q-btn color="primary" icon="add" label="Создать инцидент" @click="openCreateDialog"/>
      </div>
    </div>

    <q-card flat bordered class="q-mb-md">
      <q-card-section class="row q-col-gutter-md items-center">
        <div class="col-12 col-md-5">
          <q-input v-model="filters.search" dense outlined clearable debounce="350" label="Поиск"
                   @update:model-value="loadIncidents">
            <template #prepend>
              <q-icon name="search"/>
            </template>
          </q-input>
        </div>
        <div class="col-6 col-md-2">
          <q-select v-model="filters.severities" dense outlined multiple clearable :options="severityOptions"
                    label="Критичность" emit-value map-options @update:model-value="loadIncidents"/>
        </div>
        <div class="col-6 col-md-2">
          <q-select v-model="filters.statuses" dense outlined multiple clearable :options="statusOptions" label="Статус"
                    emit-value map-options @update:model-value="loadIncidents"/>
        </div>
        <div class="col-12 col-md-3">
          <q-select v-model="filters.serviceIds" dense outlined multiple clearable use-chips :options="serviceOptions"
                    label="Сервисы" emit-value map-options @update:model-value="loadIncidents"/>
        </div>
        <div class="col-6 col-md-auto">
          <q-checkbox v-model="filters.overdueOnly" label="Просрочено обновление" @update:model-value="loadIncidents"/>
        </div>
        <div class="col-6 col-md-auto">
          <q-checkbox v-model="filters.includeClosed" label="Показывать закрытые" @update:model-value="loadIncidents"/>
        </div>
      </q-card-section>
    </q-card>

    <q-table
      flat
      bordered
      row-key="id"
      :rows="incidents"
      :columns="columns"
      :loading="loading"
      :pagination="pagination"
      @request="onRequest"
      @row-click="openIncident"
      class="incident-table"
    >
      <template #body-cell-incidentNumber="props">
        <q-td :props="props"><strong>{{ props.row.incidentNumber }}</strong></q-td>
      </template>
      <template #body-cell-services="props">
        <q-td :props="props">
          <div class="ellipsis" style="max-width: 260px">{{ props.row.serviceName || '—' }}</div>
        </q-td>
      </template>
      <template #body-cell-severity="props">
        <q-td :props="props">
          <q-chip dense :color="severityColor(props.row.severity)" text-color="white">{{ props.row.severity }}</q-chip>
        </q-td>
      </template>
      <template #body-cell-status="props">
        <q-td :props="props">
          <q-chip dense outline :color="statusColor(props.row.status)">{{ statusLabel(props.row.status) }}</q-chip>
        </q-td>
      </template>
      <template #body-cell-impact="props">
        <q-td :props="props">
          <div class="ellipsis" style="max-width: 340px">{{ props.row.impactSummary || '—' }}</div>
          <div class="text-caption text-grey-7">{{ props.row.organizationsCount }} орг. · {{
              props.row.linkedTasksCount
            }} заявок
          </div>
        </q-td>
      </template>
      <template #body-cell-nextUpdate="props">
        <q-td :props="props">
          <div :class="props.row.communicationOverdue ? 'text-negative text-weight-bold' : ''">
            {{ formatDate(props.row.nextUpdateAt) }}
          </div>
          <div v-if="props.row.communicationOverdue" class="text-caption text-negative">Просрочено на
            {{ formatDuration(props.row.communicationOverdueSeconds) }}
          </div>
        </q-td>
      </template>
      <template #no-data>
        <div class="full-width row flex-center q-pa-xl text-grey-7">Инциденты не найдены</div>
      </template>
    </q-table>

    <q-dialog v-model="createDialog" persistent>
      <q-card style="width: 760px; max-width: 96vw">
        <q-toolbar>
          <q-toolbar-title>Новый инцидент</q-toolbar-title>
          <q-btn flat round dense icon="close" v-close-popup/>
        </q-toolbar>
        <q-card-section class="q-gutter-md">
          <q-input v-model="form.title" outlined label="Название *"
                   :rules="[v => !!String(v || '').trim() || 'Обязательное поле']"/>
          <div class="row q-col-gutter-md">
            <div class="col-6">
              <q-select v-model="form.severity" outlined :options="severityOptions" emit-value map-options
                        label="Критичность"/>
            </div>
            <div class="col-6">
              <q-select v-model="form.status" outlined :options="statusOptions" emit-value map-options label="Статус"/>
            </div>
          </div>
          <q-select v-model="form.serviceIds" outlined multiple clearable use-chips :options="serviceOptions" emit-value
                    map-options label="Затронутые сервисы"/>
          <q-input v-model="form.description" outlined type="textarea" autogrow label="Описание"/>
          <q-input v-model="form.impactSummary" outlined type="textarea" autogrow label="Влияние"/>
          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-6">
              <q-select v-model="form.leaderId" outlined clearable :options="userOptions" emit-value map-options
                        label="Руководитель инцидента"/>
            </div>
            <div class="col-12 col-md-6">
              <q-select v-model="form.supportLineId" outlined clearable :options="supportLineOptions" emit-value
                        map-options label="Линия поддержки"/>
            </div>
          </div>
          <q-select v-model="form.organizationIds" outlined multiple clearable :options="organizationOptions" emit-value
                    map-options use-chips label="Затронутые организации" class="organization-select"
                    popup-content-class="organization-select-popup"/>
          <q-select v-model="form.participantIds" outlined multiple clearable :options="userOptions" emit-value
                    map-options use-chips label="Участники"/>
          <q-input v-model.number="form.updateIntervalMinutes" outlined type="number" min="5"
                   label="Интервал обязательных обновлений, минут"/>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Отмена" v-close-popup/>
          <q-btn color="primary" label="Создать" :loading="saving" @click="createIncident"/>
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script>
import axios from 'axios'
import {useStore} from 'stores/store'

export default {
  name: 'IncidentsPage',
  data: () => ({
    store: useStore(),
    incidents: [],
    loading: false,
    saving: false,
    createDialog: false,
    users: [],
    organizations: [],
    supportLines: [],
    services: [],
    filters: {search: '', severities: [], statuses: [], serviceIds: [], overdueOnly: false, includeClosed: false},
    pagination: {page: 1, rowsPerPage: 30, rowsNumber: 0},
    form: {},
    columns: [
      {name: 'incidentNumber', label: 'Номер', field: 'incidentNumber', align: 'left', sortable: false},
      {name: 'title', label: 'Название', field: 'title', align: 'left'},
      {name: 'services', label: 'Сервисы', field: row => row.serviceName || '', align: 'left'},
      {name: 'severity', label: 'Критичность', field: 'severity', align: 'left'},
      {name: 'status', label: 'Статус', field: 'status', align: 'left'},
      {name: 'impact', label: 'Влияние', field: 'impactSummary', align: 'left'},
      {name: 'leader', label: 'Руководитель', field: row => row.leader?.displayName || '—', align: 'left'},
      {name: 'nextUpdate', label: 'Следующее обновление', field: 'nextUpdateAt', align: 'left'},
      {
        name: 'updatedAt',
        label: 'Изменён',
        field: row => row.updatedAt,
        format: value => value ? new Date(value).toLocaleString('ru-RU') : '—',
        align: 'left'
      }
    ],
    severityOptions: ['P1', 'P2', 'P3', 'P4'].map(value => ({label: value, value})),
    statusOptions: [
      ['DRAFT', 'Черновик'], ['VERIFYING', 'Проверка'], ['DECLARED', 'Объявлен'], ['DIAGNOSIS', 'Диагностика'],
      ['MITIGATION', 'Устранение'], ['MONITORING', 'Наблюдение'], ['RESTORED', 'Восстановлен'], ['CLOSED', 'Закрыт'], ['CANCELLED', 'Отменён']
    ].map(([value, label]) => ({value, label}))
  }),
  computed: {
    canEdit() {
      return ['ADMIN', 'MANAGER', 'OPERATOR'].includes(this.store.currentUser?.authorities?.[0])
    },
    userOptions() {
      return this.users.map(user => ({value: user.id, label: this.userName(user)}))
    },
    organizationOptions() {
      return this.organizations.map(org => ({value: org.id, label: org.name}))
    },
    serviceOptions() {
      return this.services.filter(service => service.active !== false).map(service => ({
        value: service.id,
        label: this.serviceLabel(service)
      }))
    },
    supportLineOptions() {
      return this.supportLines.filter(line => line.active !== false).map(line => ({value: line.id, label: line.name}))
    }
  },
  mounted() {
    this.resetForm()
    this.loadDictionaries()
    this.loadIncidents()
  },
  methods: {
    resetForm() {
      this.form = {
        title: '',
        description: '',
        impactSummary: '',
        serviceIds: [],
        severity: 'P3',
        status: 'DRAFT',
        leaderId: null,
        supportLineId: null,
        organizationIds: [],
        participantIds: [],
        updateIntervalMinutes: 30
      }
    },
    async loadDictionaries() {
      const requests = [axios.get('/api/v1/users'), axios.get('/api/v1/organizations'), axios.get('/api/v1/support-lines'), axios.get('/api/v1/services')]
      const results = await Promise.allSettled(requests)
      this.users = results[0].status === 'fulfilled' ? results[0].value.data : []
      this.organizations = results[1].status === 'fulfilled' ? results[1].value.data : []
      this.supportLines = results[2].status === 'fulfilled' ? results[2].value.data : []
      this.services = results[3].status === 'fulfilled' ? results[3].value.data : []
    },
    async loadIncidents() {
      this.loading = true
      try {
        const response = await axios.post('/api/v1/incidents-page', {
          page: this.pagination.page,
          size: this.pagination.rowsPerPage,
          ...this.filters
        })
        this.incidents = response.data.incidents || []
        this.pagination.rowsNumber = Number(response.data.totalElements) || 0
      } catch (error) {
        this.notifyError(error)
      } finally {
        this.loading = false
      }
    },
    onRequest({pagination}) {
      this.pagination.page = pagination.page
      this.pagination.rowsPerPage = pagination.rowsPerPage
      this.loadIncidents()
    },
    openIncident(event, row) {
      this.goToIncident(row?.id)
    },
    goToIncident(value) {
      const incidentId = Number(value)
      if (!Number.isSafeInteger(incidentId) || incidentId <= 0) {
        this.$q.notify({
          type: 'negative',
          message: 'Сервер не вернул корректный идентификатор инцидента',
          position: 'top-right',
          actions: [{
            icon: 'close',
            color: 'white',
            dense: true,
            handler: () => undefined
          }]
        })
        return
      }
      this.$router.push({name: 'incident-detail', params: {incidentId: String(incidentId)}})
    },
    openCreateDialog() {
      this.resetForm();
      this.createDialog = true
    },
    async createIncident() {
      if (!String(this.form.title || '').trim()) return
      this.saving = true
      try {
        const response = await axios.post('/api/v1/incident', this.form)
        this.createDialog = false
        this.goToIncident(response.data?.id)
      } catch (error) {
        this.notifyError(error)
      } finally {
        this.saving = false
      }
    },
    serviceLabel(service) {
      const code = String(service?.code || '').trim()
      const name = String(service?.name || '').trim()
      return code && name ? `${code} · ${name}` : (name || code || `Сервис #${service?.id}`)
    },
    userName(user) {
      return [user.lastname, user.firstname].filter(Boolean).join(' ') || user.username || `#${user.id}`
    },
    statusLabel(value) {
      return this.statusOptions.find(option => option.value === value)?.label || value
    },
    severityColor(value) {
      return ({P1: 'negative', P2: 'deep-orange', P3: 'warning', P4: 'blue-grey'})[value] || 'grey'
    },
    statusColor(value) {
      return ({
        CLOSED: 'positive',
        RESTORED: 'positive',
        CANCELLED: 'grey',
        DECLARED: 'negative',
        DIAGNOSIS: 'orange',
        MITIGATION: 'deep-orange',
        MONITORING: 'blue'
      })[value] || 'primary'
    },
    formatDate(value) {
      return value ? new Date(value).toLocaleString('ru-RU') : '—'
    },
    formatDuration(seconds) {
      const value = Number(seconds) || 0
      if (value >= 3600) return `${Math.floor(value / 3600)} ч ${Math.floor((value % 3600) / 60)} мин`
      return `${Math.max(1, Math.floor(value / 60))} мин`
    },
    notifyError(error) {
      this.$q.notify({
        type: 'negative',
        message: error.response?.data?.message || error.response?.data || error.message || 'Ошибка',
        position: 'top-right',
        actions: [{
          icon: 'close',
          color: 'white',
          dense: true,
          handler: () => undefined
        }]
      })
    }
  }
}
</script>

<style scoped>
.incident-table :deep(tbody tr) {
  cursor: pointer;
}

.incident-table :deep(tbody tr:hover) {
  background: rgba(92, 53, 249, 0.05);
}
</style>
