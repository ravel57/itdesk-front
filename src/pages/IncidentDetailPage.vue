<template>
  <q-page class="q-pa-md" v-if="incident">
    <div class="row items-start q-col-gutter-md q-mb-md">
      <div class="col-auto">
        <q-btn flat round icon="arrow_back" @click="$router.push('/incidents')"/>
      </div>
      <div class="col">
        <div class="row items-center q-gutter-sm">
          <div class="text-h5">{{ incident.incidentNumber }} — {{ incident.title }}</div>
          <q-chip dense :color="severityColor(incident.severity)" text-color="white">{{ incident.severity }}</q-chip>
          <q-chip dense outline :color="statusColor(incident.status)">{{ statusLabel(incident.status) }}</q-chip>
          <q-chip v-if="incident.communicationOverdue" dense color="negative" text-color="white" icon="schedule">
            Обновление просрочено
          </q-chip>
        </div>
        <div class="text-caption text-grey-7">{{ serviceDisplay }} · {{ incident.organizationsCount }} орг. ·
          {{ incident.linkedTasksCount }} заявок
        </div>
      </div>
      <div class="col-auto row q-gutter-sm" v-if="canEdit">
        <q-btn outline color="primary" icon="add_comment" label="Добавить запись" @click="openTimelineDialog"/>
        <q-btn color="primary" icon="save" label="Сохранить" :loading="saving" @click="saveIncident"/>
      </div>
    </div>

    <q-banner v-if="incident.communicationOverdue" rounded class="bg-red-1 text-negative q-mb-md">
      <template #avatar>
        <q-icon name="warning" color="negative"/>
      </template>
      Следующее обязательное обновление было запланировано на {{ formatDate(incident.nextUpdateAt) }}.
      Просрочка: {{ formatDuration(incident.communicationOverdueSeconds) }}.
    </q-banner>

    <q-tabs v-model="tab" dense align="left" active-color="primary" indicator-color="primary" class="text-grey-7">
      <q-tab name="overview" icon="dashboard" label="Обзор"/>
      <q-tab name="timeline" icon="history" label="Хронология"/>
      <q-tab name="tasks" icon="task" :label="`Заявки (${incident.linkedTasksCount})`"/>
      <q-tab name="team" icon="groups" label="Команда"/>
      <q-tab name="postmortem" icon="fact_check" label="Разбор"/>
    </q-tabs>
    <q-separator/>

    <q-tab-panels v-model="tab" animated class="bg-transparent">
      <q-tab-panel name="overview" class="q-pa-none q-pt-md">
        <div class="row q-col-gutter-md">
          <div class="col-12 col-lg-8">
            <q-card flat bordered>
              <q-card-section class="row q-col-gutter-md">
                <div class="col-12 col-md-8">
                  <q-input v-model="form.title" outlined label="Название *" :readonly="!canEdit"/>
                </div>
                <div class="col-6 col-md-2">
                  <q-select v-model="form.severity" outlined :options="severityOptions" emit-value map-options
                            label="Критичность" :readonly="!canEdit"/>
                </div>
                <div class="col-6 col-md-2">
                  <q-select v-model="form.status" outlined :options="statusOptions" emit-value map-options
                            label="Статус" :readonly="!canEdit"/>
                </div>
                <div class="col-12 col-md-6">
                  <q-select v-model="form.serviceIds" outlined multiple use-chips clearable :options="serviceOptions"
                            emit-value map-options label="Затронутые сервисы" :readonly="!canEdit"/>
                </div>
                <div class="col-12 col-md-6">
                  <q-select v-model="form.supportLineId" outlined clearable :options="supportLineOptions" emit-value
                            map-options label="Линия поддержки" :readonly="!canEdit"/>
                </div>
                <div class="col-12">
                  <q-input v-model="form.description" outlined type="textarea" autogrow label="Техническое описание"
                           :readonly="!canEdit"/>
                </div>
                <div class="col-12">
                  <q-input v-model="form.impactSummary" outlined type="textarea" autogrow label="Влияние"
                           :readonly="!canEdit"/>
                </div>
                <div class="col-12">
                  <q-input v-model="form.publicDescription" outlined type="textarea" autogrow label="Публичное описание"
                           :readonly="!canEdit"/>
                </div>
                <div class="col-12 col-md-6">
                  <q-select v-model="form.organizationIds" outlined multiple use-chips clearable
                            :options="organizationOptions" emit-value map-options label="Затронутые организации"
                            class="organization-select" popup-content-class="organization-select-popup"
                            :readonly="!canEdit"/>
                </div>
                <div class="col-12 col-md-6">
                  <q-input v-model.number="form.updateIntervalMinutes" outlined type="number" min="5"
                           label="Интервал обновлений, минут" :readonly="!canEdit"/>
                </div>
                <div class="col-12 col-md-6">
                  <q-input v-model="form.nextUpdateAt" outlined type="datetime-local" label="Следующее обновление"
                           :readonly="!canEdit"/>
                </div>
                <div class="col-12 col-md-6">
                  <q-input v-model="form.actualStartedAt" outlined type="datetime-local" label="Фактическое начало"
                           :readonly="!canEdit"/>
                </div>
                <div class="col-12 col-md-6">
                  <q-input v-model="form.detectedAt" outlined type="datetime-local" label="Обнаружен"
                           :readonly="!canEdit"/>
                </div>
                <div class="col-12 col-md-6">
                  <q-input v-model="form.declaredAt" outlined type="datetime-local" label="Объявлен"
                           :readonly="!canEdit"/>
                </div>
                <div class="col-12">
                  <q-input v-model="form.workaround" outlined type="textarea" autogrow label="Обходное решение"
                           :readonly="!canEdit"/>
                </div>
              </q-card-section>
            </q-card>
          </div>
          <div class="col-12 col-lg-4">
            <q-card flat bordered class="q-mb-md">
              <q-card-section>
                <div class="text-subtitle1 q-mb-sm">Ответственные</div>
                <q-select v-model="form.leaderId" outlined clearable :options="userOptions" emit-value map-options
                          label="Руководитель" :readonly="!canEdit" class="q-mb-sm"/>
                <q-select v-model="form.technicalOwnerId" outlined clearable :options="userOptions" emit-value
                          map-options label="Технический ответственный" :readonly="!canEdit" class="q-mb-sm"/>
                <q-select v-model="form.communicationOwnerId" outlined clearable :options="userOptions" emit-value
                          map-options label="Ответственный за коммуникации" :readonly="!canEdit"/>
              </q-card-section>
            </q-card>
            <q-card flat bordered>
              <q-card-section>
                <div class="text-subtitle1 q-mb-sm">Метрики</div>
                <div class="metric-row">
                  <span>Длительность</span><strong>{{ formatDuration(incident.metrics?.durationSeconds) }}</strong>
                </div>
                <div class="metric-row"><span>MTTD</span><strong>{{
                    formatDuration(incident.metrics?.mttdSeconds)
                  }}</strong></div>
                <div class="metric-row"><span>MTTA</span><strong>{{
                    formatDuration(incident.metrics?.mttaSeconds)
                  }}</strong></div>
                <div class="metric-row"><span>До объявления</span><strong>{{
                    formatDuration(incident.metrics?.timeToDeclareSeconds)
                  }}</strong></div>
                <div class="metric-row"><span>MTTR</span><strong>{{
                    formatDuration(incident.metrics?.mttrSeconds)
                  }}</strong></div>
                <div class="metric-row"><span>Обновления вовремя</span><strong>{{
                    incident.metrics?.communicationCompliancePercent ?? 100
                  }}%</strong></div>
                <q-linear-progress rounded size="10px"
                                   :value="(incident.metrics?.communicationCompliancePercent ?? 100) / 100"
                                   color="primary" class="q-mt-sm"/>
              </q-card-section>
            </q-card>
          </div>
        </div>
      </q-tab-panel>

      <q-tab-panel name="timeline" class="q-pa-none q-pt-md">
        <q-card flat bordered>
          <q-card-section v-if="!incident.timeline?.length" class="text-grey-7">Записей пока нет</q-card-section>
          <q-list separator>
            <q-item v-for="entry in reversedTimeline" :key="entry.id">
              <q-item-section avatar>
                <q-avatar :color="audienceColor(entry.audience)" text-color="white" :icon="timelineIcon(entry.type)"/>
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ entry.text }}</q-item-label>
                <q-item-label caption>{{ audienceLabel(entry.audience) }} · {{ entry.author?.displayName || 'Система' }}
                  · {{ formatDate(entry.createdAt) }}
                </q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </q-card>
      </q-tab-panel>

      <q-tab-panel name="tasks" class="q-pa-none q-pt-md">
        <div class="row q-col-gutter-md">
          <div class="col-12 col-lg-8">
            <q-card flat bordered>
              <q-card-section class="row items-center q-gutter-sm">
                <div class="text-subtitle1 col">Связанные заявки</div>
                <q-btn-dropdown v-if="canEdit && selectedTaskRows.length" outline color="primary"
                                label="Массовые действия">
                  <q-list>
                    <q-item clickable v-close-popup @click="bulkTaskAction('CONFIRM_RECOVERY')">
                      <q-item-section>Подтвердить восстановление</q-item-section>
                    </q-item>
                    <q-item clickable v-close-popup @click="bulkTaskAction('UNCONFIRM_RECOVERY')">
                      <q-item-section>Снять подтверждение</q-item-section>
                    </q-item>
                    <q-item clickable v-close-popup @click="bulkTaskAction('UNLINK')">
                      <q-item-section class="text-negative">Отвязать от инцидента</q-item-section>
                    </q-item>
                  </q-list>
                </q-btn-dropdown>
              </q-card-section>
              <q-table flat row-key="id" selection="multiple" v-model:selected="selectedTaskRows"
                       :rows="incident.taskLinks || []" :columns="taskColumns" :pagination="{ rowsPerPage: 20 }">
                <template #body-cell-id="props">
                  <q-td :props="props">
                    <q-btn flat dense color="primary" :label="`#${props.row.id}`"
                           @click="$router.push(`/chats/${props.row.client?.id}?task=${props.row.id}`)"/>
                  </q-td>
                </template>
                <template #body-cell-confirmed="props">
                  <q-td :props="props">
                    <q-toggle :model-value="props.row.recoveryConfirmed" :disable="!canEdit"
                              @update:model-value="setRecoveryConfirmation(props.row, $event)"/>
                  </q-td>
                </template>
                <template #body-cell-organization="props">
            <q-td :props="props">
              <div
                class="organization-name-ellipsis"
                style="max-width: 280px"
                :title="props.row.organization?.name || ''"
              >{{ props.row.organization?.name || '—' }}</div>
            </q-td>
          </template>

          <template #body-cell-actions="props">
                  <q-td :props="props">
                    <q-btn v-if="canEdit" flat round dense icon="link_off" color="negative"
                           @click="unlinkTask(props.row.id)"/>
                  </q-td>
                </template>
              </q-table>
              <q-card-section v-if="canEdit" class="row q-col-gutter-sm items-center">
                <div class="col">
                  <q-input v-model="taskIdsText" outlined dense label="ID заявок через запятую"/>
                </div>
                <div class="col-auto">
                  <q-btn color="primary" label="Связать" :loading="taskActionLoading" @click="linkTaskIds"/>
                </div>
              </q-card-section>
            </q-card>
          </div>
          <div class="col-12 col-lg-4">
            <q-card flat bordered>
              <q-card-section class="row items-center">
                <div class="text-subtitle1 col">Похожие заявки</div>
                <q-btn flat round icon="refresh" :loading="suggestionsLoading" @click="loadSuggestions"/>
              </q-card-section>
              <q-list separator>
                <q-item v-for="item in suggestions" :key="item.id">
                  <q-item-section side>
                    <q-checkbox v-model="selectedSuggestionIds" :val="item.id"/>
                  </q-item-section>
                  <q-item-section>
                    <q-item-label>#{{ item.id }} — {{ item.name }}</q-item-label>
                    <q-item-label
                      caption
                      class="organization-name-ellipsis"
                      :title="item.organization?.name || 'Без организации'"
                    >{{ item.organization?.name || 'Без организации' }} · совпадение
                      {{ Math.round((item.score || 0) * 100) }}%
                    </q-item-label>
                    <q-item-label caption v-if="item.matchedTerms?.length">{{
                        item.matchedTerms.join(', ')
                      }}
                    </q-item-label>
                  </q-item-section>
                </q-item>
              </q-list>
              <q-card-section v-if="!suggestions.length" class="text-grey-7">Подходящих заявок не найдено
              </q-card-section>
              <q-card-actions align="right">
                <q-btn v-if="canEdit" color="primary" :disable="!selectedSuggestionIds.length" label="Связать выбранные"
                       @click="linkSuggestedTasks"/>
              </q-card-actions>
            </q-card>
          </div>
        </div>
      </q-tab-panel>

      <q-tab-panel name="team" class="q-pa-none q-pt-md">
        <q-card flat bordered>
          <q-card-section class="row q-col-gutter-md">
            <div class="col-12 col-md-6">
              <q-select v-model="form.participantIds" outlined multiple use-chips :options="userOptions" emit-value
                        map-options label="Участники" :readonly="!canEdit"/>
            </div>
            <div class="col-12 col-md-6">
              <q-select v-model="form.observerIds" outlined multiple use-chips :options="userOptions" emit-value
                        map-options label="Наблюдатели" :readonly="!canEdit"/>
            </div>
            <div class="col-12">
              <div class="text-subtitle1 q-mb-sm">Затронутые клиенты</div>
              <q-chip
                v-for="client in incident.clients"
                :key="client.id"
                outline
                class="incident-client-chip"
                :title="client.organization?.name || ''"
              >
                <span class="incident-client-chip__name">{{ client.displayName || `Клиент #${client.id}` }}</span><span
                v-if="client.organization"
                class="incident-client-chip__organization"
              > · {{ client.organization.name }}</span></q-chip>
            </div>
          </q-card-section>
        </q-card>
      </q-tab-panel>

      <q-tab-panel name="postmortem" class="q-pa-none q-pt-md">
        <q-card flat bordered>
          <q-card-section class="q-gutter-md">
            <q-input v-model="form.rootCause" outlined type="textarea" autogrow label="Первопричина"
                     :readonly="!canEdit"/>
            <q-input v-model="form.resolution" outlined type="textarea" autogrow label="Что восстановило сервис"
                     :readonly="!canEdit"/>
            <q-input v-model="form.postmortemSummary" outlined type="textarea" autogrow
                     label="Итоговый разбор и корректирующие действия" :readonly="!canEdit"/>
          </q-card-section>
        </q-card>
      </q-tab-panel>
    </q-tab-panels>

    <q-dialog v-model="timelineDialog" persistent>
      <q-card style="width: 680px; max-width: 95vw">
        <q-toolbar>
          <q-toolbar-title>Новая запись</q-toolbar-title>
          <q-btn flat round dense icon="close" v-close-popup/>
        </q-toolbar>
        <q-card-section class="q-gutter-md">
          <div class="row q-col-gutter-md">
            <div class="col-6">
              <q-select v-model="timelineForm.audience" outlined :options="audienceOptions" emit-value map-options
                        label="Аудитория"/>
            </div>
            <div class="col-6">
              <q-select v-model="timelineForm.type" outlined :options="timelineTypeOptions" emit-value map-options
                        label="Тип"/>
            </div>
          </div>
          <q-select v-model="selectedTemplateKey" outlined clearable :options="templateOptions" emit-value map-options
                    label="Шаблон обновления" @update:model-value="applyTemplate"/>
          <q-input v-model="timelineForm.text" outlined type="textarea" autogrow label="Текст *"/>
          <q-input v-model="timelineForm.nextUpdateAt" outlined type="datetime-local" label="Следующее обновление"/>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Отмена" v-close-popup/>
          <q-btn color="primary" label="Опубликовать" :loading="timelineSaving" @click="addTimelineEntry"/>
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
  <q-page v-else class="flex flex-center">
    <q-spinner size="48px" color="primary"/>
  </q-page>
</template>

<script>
import axios from 'axios'
import {useStore} from 'stores/store'

export default {
  name: 'IncidentDetailPage',
  data: () => ({
    store: useStore(), incident: null, form: {}, tab: 'overview', saving: false,
    users: [], organizations: [], supportLines: [], services: [], templates: [], suggestions: [],
    timelineDialog: false, timelineSaving: false, selectedTemplateKey: null,
    timelineForm: {}, taskIdsText: '', taskActionLoading: false, suggestionsLoading: false,
    selectedTaskRows: [], selectedSuggestionIds: [], suggestionsLoaded: false, refreshTimer: null,
    severityOptions: ['P1', 'P2', 'P3', 'P4'].map(value => ({value, label: value})),
    statusOptions: [['DRAFT', 'Черновик'], ['VERIFYING', 'Проверка'], ['DECLARED', 'Объявлен'], ['DIAGNOSIS', 'Диагностика'], ['MITIGATION', 'Устранение'], ['MONITORING', 'Наблюдение'], ['RESTORED', 'Восстановлен'], ['CLOSED', 'Закрыт'], ['CANCELLED', 'Отменён']].map(([value, label]) => ({
      value,
      label
    })),
    audienceOptions: [['INTERNAL', 'Внутренняя'], ['OPERATORS', 'Операторам'], ['CLIENTS', 'Клиентам'], ['PUBLIC', 'Публичная']].map(([value, label]) => ({
      value,
      label
    })),
    timelineTypeOptions: [['NOTE', 'Заметка'], ['UPDATE', 'Обновление'], ['DECISION', 'Решение'], ['ACTION', 'Действие'], ['CLIENT_UPDATE', 'Клиентское обновление']].map(([value, label]) => ({
      value,
      label
    })),
    taskColumns: [
      {name: 'id', label: 'Заявка', field: 'id', align: 'left'},
      {name: 'name', label: 'Название', field: 'name', align: 'left'},
      {
        name: 'service',
        label: 'Сервис',
        field: row => row.service ? [row.service.code, row.service.name].filter(Boolean).join(' · ') : '—',
        align: 'left'
      },
      {name: 'organization', label: 'Организация', field: row => row.organization?.name || '—', align: 'left'},
      {name: 'status', label: 'Статус', field: 'status', align: 'left'},
      {name: 'executor', label: 'Исполнитель', field: row => row.executor?.displayName || '—', align: 'left'},
      {name: 'confirmed', label: 'Восстановление', field: 'recoveryConfirmed', align: 'center'},
      {name: 'actions', label: '', field: 'actions', align: 'right'}
    ]
  }),
  computed: {
    incidentId() {
      return Number(this.$route.params.incidentId)
    },
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
      return this.services.filter(service => service.active !== false || (this.form.serviceIds || []).includes(service.id)).map(service => ({
        value: service.id,
        label: this.serviceLabel(service)
      }))
    },
    serviceDisplay() {
      const services = this.incident?.services || []
      if (services.length) return services.map(service => this.serviceLabel(service)).join(', ')
      return this.incident?.serviceName || 'Сервис не указан'
    },
    supportLineOptions() {
      return this.supportLines.filter(line => line.active !== false).map(line => ({value: line.id, label: line.name}))
    },
    templateOptions() {
      return this.templates.map(item => ({value: item.key, label: item.title}))
    },
    reversedTimeline() {
      return [...(this.incident?.timeline || [])].reverse()
    }
  },
  watch: {
    tab(value) {
      if (value === 'tasks' && !this.suggestionsLoaded) this.loadSuggestions()
    }
  },
  async mounted() {
    await Promise.all([this.loadDictionaries(), this.loadTemplates(), this.loadIncident()])
    this.refreshTimer = setInterval(() => {
      if (!document.hidden) this.loadIncident(false)
    }, 30000)
  },
  beforeUnmount() {
    if (this.refreshTimer) clearInterval(this.refreshTimer)
  },
  methods: {
    async loadDictionaries() {
      const results = await Promise.allSettled([axios.get('/api/v1/users'), axios.get('/api/v1/organizations'), axios.get('/api/v1/support-lines'), axios.get('/api/v1/services?includeInactive=true')])
      this.users = results[0].status === 'fulfilled' ? results[0].value.data : []
      this.organizations = results[1].status === 'fulfilled' ? results[1].value.data : []
      this.supportLines = results[2].status === 'fulfilled' ? results[2].value.data : []
      this.services = results[3].status === 'fulfilled' ? results[3].value.data : []
    },
    async loadTemplates() {
      try {
        this.templates = (await axios.get('/api/v1/incident-update-templates')).data || []
      } catch (_) {
        this.templates = []
      }
    },
    async loadIncident(replaceForm = true) {
      try {
        const response = await axios.get(`/api/v1/incident/${encodeURIComponent(this.incidentId)}`)
        this.incident = response.data
        if (replaceForm) this.form = this.toForm(response.data)
      } catch (error) {
        this.notifyError(error);
        this.$router.push('/incidents')
      }
    },
    toForm(incident) {
      return {
        title: incident.title || '',
        description: incident.description || '',
        publicDescription: incident.publicDescription || '',
        impactSummary: incident.impactSummary || '',
        serviceIds: (incident.services || []).map(item => item.id),
        workaround: incident.workaround || '',
        rootCause: incident.rootCause || '',
        resolution: incident.resolution || '',
        postmortemSummary: incident.postmortemSummary || '',
        severity: incident.severity,
        status: incident.status,
        leaderId: incident.leader?.id || null,
        technicalOwnerId: incident.technicalOwner?.id || null,
        communicationOwnerId: incident.communicationOwner?.id || null,
        supportLineId: incident.supportLine?.id || null,
        participantIds: (incident.participants || []).map(item => item.id),
        observerIds: (incident.observers || []).map(item => item.id),
        organizationIds: (incident.organizations || []).map(item => item.id),
        updateIntervalMinutes: incident.updateIntervalMinutes || 30,
        actualStartedAt: this.toLocalInput(incident.actualStartedAt),
        detectedAt: this.toLocalInput(incident.detectedAt),
        declaredAt: this.toLocalInput(incident.declaredAt),
        nextUpdateAt: this.toLocalInput(incident.nextUpdateAt)
      }
    },
    buildSavePayload() {
      const payload = {...this.form}
      ;['actualStartedAt', 'detectedAt', 'declaredAt', 'nextUpdateAt'].forEach(key => {
        payload[key] = this.fromLocalInput(payload[key])
      })
      return payload
    },
    async saveIncident() {
      this.saving = true
      try {
        const response = await axios.patch(`/api/v1/incident/${encodeURIComponent(this.incidentId)}`, this.buildSavePayload())
        this.incident = response.data
        this.form = this.toForm(response.data)
        this.$q.notify({
          type: 'positive',
          message: 'Инцидент сохранён',
          position: 'top-right',
          actions: [{
            icon: 'close',
            color: 'white',
            dense: true,
            handler: () => undefined
          }]
        })
      } catch (error) {
        this.notifyError(error)
      } finally {
        this.saving = false
      }
    },
    openTimelineDialog() {
      this.selectedTemplateKey = null
      this.timelineForm = {
        audience: 'INTERNAL',
        type: 'NOTE',
        text: '',
        nextUpdateAt: this.toLocalInput(this.incident.nextUpdateAt)
      }
      this.timelineDialog = true
    },
    applyTemplate(key) {
      const template = this.templates.find(item => item.key === key)
      if (template) {
        this.timelineForm.text = template.text;
        this.timelineForm.type = 'CLIENT_UPDATE';
        this.timelineForm.audience = 'CLIENTS'
      }
    },
    async addTimelineEntry() {
      if (!String(this.timelineForm.text || '').trim()) return
      this.timelineSaving = true
      try {
        const payload = {
          ...this.timelineForm,
          templateKey: this.selectedTemplateKey,
          nextUpdateAt: this.fromLocalInput(this.timelineForm.nextUpdateAt)
        }
        this.incident = (await axios.post(`/api/v1/incident/${encodeURIComponent(this.incidentId)}/timeline`, payload)).data
        this.form = this.toForm(this.incident)
        this.timelineDialog = false
      } catch (error) {
        this.notifyError(error)
      } finally {
        this.timelineSaving = false
      }
    },
    parseTaskIds(text) {
      return [...new Set(String(text || '').split(/[^0-9]+/).map(Number).filter(Number.isFinite).filter(value => value > 0))]
    },
    async linkTaskIds() {
      const taskIds = this.parseTaskIds(this.taskIdsText)
      if (!taskIds.length) return
      this.taskActionLoading = true
      try {
        this.incident = (await axios.post(`/api/v1/incident/${encodeURIComponent(this.incidentId)}/tasks`, {taskIds})).data
        this.taskIdsText = ''
        this.loadSuggestions()
      } catch (error) {
        this.notifyError(error)
      } finally {
        this.taskActionLoading = false
      }
    },
    async unlinkTask(taskId) {
      try {
        this.incident = (await axios.delete(`/api/v1/incident/${encodeURIComponent(this.incidentId)}/task/${encodeURIComponent(taskId)}`)).data;
        this.loadSuggestions()
      } catch (error) {
        this.notifyError(error)
      }
    },
    async setRecoveryConfirmation(row, confirmed) {
      try {
        this.incident = (await axios.patch(`/api/v1/incident/${encodeURIComponent(this.incidentId)}/task/${encodeURIComponent(row.id)}/recovery-confirmation`, {confirmed})).data
      } catch (error) {
        this.notifyError(error)
      }
    },
    async bulkTaskAction(operation) {
      try {
        this.incident = (await axios.post(`/api/v1/incident/${encodeURIComponent(this.incidentId)}/tasks/bulk`, {
          operation,
          taskIds: this.selectedTaskRows.map(row => row.id)
        })).data
        this.selectedTaskRows = []
        this.loadSuggestions()
      } catch (error) {
        this.notifyError(error)
      }
    },
    async loadSuggestions() {
      if (!this.canEdit || this.suggestionsLoading) return
      this.suggestionsLoading = true
      try {
        this.suggestions = (await axios.get(`/api/v1/incident/${encodeURIComponent(this.incidentId)}/suggestions`)).data || []
        this.suggestionsLoaded = true
      } catch (_) {
        this.suggestions = []
      } finally {
        this.suggestionsLoading = false
      }
    },
    async linkSuggestedTasks() {
      try {
        this.incident = (await axios.post(`/api/v1/incident/${encodeURIComponent(this.incidentId)}/tasks`, {taskIds: this.selectedSuggestionIds})).data
        this.selectedSuggestionIds = []
        this.loadSuggestions()
      } catch (error) {
        this.notifyError(error)
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
      return this.statusOptions.find(item => item.value === value)?.label || value
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
    audienceColor(value) {
      return ({INTERNAL: 'grey-8', OPERATORS: 'primary', CLIENTS: 'teal', PUBLIC: 'blue'})[value] || 'grey'
    },
    audienceLabel(value) {
      return this.audienceOptions.find(item => item.value === value)?.label || value
    },
    timelineIcon(value) {
      return ({
        SYSTEM: 'settings',
        NOTE: 'notes',
        UPDATE: 'campaign',
        DECISION: 'gavel',
        ACTION: 'build',
        CLIENT_UPDATE: 'record_voice_over',
        RECOVERY_CONFIRMATION: 'verified'
      })[value] || 'circle'
    },
    formatDate(value) {
      return value ? new Date(value).toLocaleString('ru-RU') : '—'
    },
    formatDuration(seconds) {
      const value = Number(seconds) || 0
      if (!value) return '—'
      const days = Math.floor(value / 86400);
      const hours = Math.floor((value % 86400) / 3600);
      const minutes = Math.floor((value % 3600) / 60)
      return [days ? `${days} д` : '', hours ? `${hours} ч` : '', minutes || (!days && !hours) ? `${minutes} мин` : ''].filter(Boolean).join(' ')
    },
    toLocalInput(value) {
      if (!value) return ''
      const date = new Date(value);
      const pad = n => String(n).padStart(2, '0')
      return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
    },
    fromLocalInput(value) {
      return value ? new Date(value).toISOString() : null
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
.metric-row {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  padding: 7px 0;
  border-bottom: 1px solid rgba(0, 0, 0, .06);
}

.incident-client-chip {
  max-width: 100%;
}

.incident-client-chip__name {
  flex: 0 0 auto;
}

.incident-client-chip__organization {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

</style>
