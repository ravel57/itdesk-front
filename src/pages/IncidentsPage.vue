<template>
  <q-page class="q-pa-md incidents-page">
    <div class="row items-center q-col-gutter-md q-mb-md">
      <div class="col-12 col-md">
        <div class="text-h5">Инциденты</div>
        <div class="text-caption text-grey-7">Массовые проблемы, связанные заявки и коммуникации</div>
      </div>
      <div class="col-auto">
        <q-btn flat round dense icon="help_outline" color="primary" @click="helpDialog = true">
          <q-tooltip>Что такое инцидент и как с ним работать</q-tooltip>
        </q-btn>
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
          <q-select v-model="filters.serviceIds" dense outlined multiple clearable use-chips :options="filteredOptions('serviceOptions')" use-input input-debounce="0" @filter="(val, update) => filterOptions(val, update, 'serviceOptions')"
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
      v-model:pagination="pagination"
      :rows-per-page-options="[10, 20, 30, 50, 100]"
      rows-per-page-label="Строк на странице"
      :pagination-label="paginationLabel"
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
      <q-card class="incident-wizard">
        <q-toolbar>
          <q-toolbar-title>Новый инцидент</q-toolbar-title>
          <q-btn flat round dense icon="close" v-close-popup/>
        </q-toolbar>

        <q-stepper v-model="wizardStep" flat animated alternative-labels :contracted="$q.screen.lt.sm"
                   active-color="primary" done-color="primary" class="incident-wizard__stepper">
          <q-step :name="1" title="Суть" icon="edit" :done="wizardStep > 1">
            <div class="incident-wizard__hint">
              Коротко опишите, что случилось. Название увидят все, кто будет работать с инцидентом, поэтому
              пишите так, чтобы суть была понятна с первого взгляда.
            </div>
            <div class="incident-wizard__fields">
              <q-input v-model="form.title" outlined autofocus label="Название *"
                       hint="Например: «Не работает почта у всех пользователей»"
                       :error="titleError" error-message="Укажите название инцидента"
                       @update:model-value="titleError = false"/>
              <q-input v-model="form.description" outlined type="textarea" autogrow
                       label="Описание" hint="Что происходит технически. Можно заполнить позже"/>
              <q-input v-model="form.publicDescription" outlined type="textarea" autogrow
                       label="Публичное описание"
                       hint="Текст для клиентов: без технических подробностей. Можно заполнить позже"/>
            </div>
          </q-step>

          <q-step :name="2" title="Серьёзность" icon="priority_high" :done="wizardStep > 2">
            <div class="incident-wizard__hint">
              Критичность задаёт приоритет работ, статус показывает, на каком этапе инцидент. Если сбой ещё не
              подтверждён, оставьте статус «Черновик» — его можно сменить позже.
            </div>
            <div class="incident-wizard__fields">
              <div class="incident-form__pair">
                <q-select v-model="form.severity" outlined :options="severityOptions" emit-value map-options
                          label="Критичность" :hint="severityHint"/>
                <q-select v-model="form.status" outlined :options="statusOptions" emit-value map-options
                          label="Статус"/>
              </div>
              <q-select v-model="form.serviceIds" outlined multiple clearable use-chips :options="filteredOptions('serviceOptions')" use-input input-debounce="0" @filter="(val, update) => filterOptions(val, update, 'serviceOptions')"
                        emit-value map-options label="Затронутые сервисы"
                        hint="Какие сервисы не работают или работают с перебоями"/>
            </div>
          </q-step>

          <q-step :name="3" title="Масштаб" icon="groups" :done="wizardStep > 3">
            <div class="incident-wizard__hint">
              Опишите, как инцидент сказывается на клиентах, и отметьте организации, которых он касается.
              По ним видно масштаб проблемы и кому нужно сообщать об обновлениях.
            </div>
            <div class="incident-wizard__fields">
              <q-input v-model="form.impactSummary" outlined type="textarea" autogrow label="Влияние"
                       hint="Например: «Клиенты не могут отправлять и получать письма»"/>
              <q-input v-model="form.workaround" outlined type="textarea" autogrow label="Обходное решение"
                       hint="Если проблему можно временно обойти — опишите как, чтобы поддержка подсказывала это клиентам"/>
              <q-select v-model="form.organizationIds" outlined multiple clearable :options="filteredOptions('organizationOptions')" use-input input-debounce="0" @filter="(val, update) => filterOptions(val, update, 'organizationOptions')"
                        emit-value map-options use-chips label="Затронутые организации"
                        class="organization-select" popup-content-class="organization-select-popup"/>
            </div>
          </q-step>

          <q-step :name="4" title="Время" icon="schedule" :done="wizardStep > 4">
            <div class="incident-wizard__hint">
              Укажите, когда сбой начался на самом деле и когда его заметили. По этим датам считаются метрики
              инцидента (например, время обнаружения). Если точное время неизвестно — оставьте поля пустыми
              и заполните позже.
            </div>
            <div class="incident-wizard__fields">
              <div class="incident-form__pair incident-wizard__dates">
                <div class="incident-wizard__date">
                  <div class="incident-wizard__date-title">Фактическое начало</div>
                  <q-btn-toggle v-model="dateModes.actualStartedAt" unelevated dense
                                toggle-color="primary" color="grey-3" text-color="grey-8" class="incident-wizard__toggle"
                                :options="dateModeOptions"/>
                  <q-input v-if="dateModes.actualStartedAt === 'custom'" v-model="form.actualStartedAt" outlined
                           stack-label type="datetime-local" label="Когда сбой действительно начался"/>
                  <div v-else class="incident-wizard__date-note">{{ dateModeNote(dateModes.actualStartedAt, 'начался') }}</div>
                </div>
                <div class="incident-wizard__date">
                  <div class="incident-wizard__date-title">Обнаружен</div>
                  <q-btn-toggle v-model="dateModes.detectedAt" unelevated dense
                                toggle-color="primary" color="grey-3" text-color="grey-8" class="incident-wizard__toggle"
                                :options="dateModeOptions"/>
                  <q-input v-if="dateModes.detectedAt === 'custom'" v-model="form.detectedAt" outlined
                           stack-label type="datetime-local" label="Когда о сбое узнали"
                           :error="detectedError" error-message="Не может быть раньше фактического начала"
                           @update:model-value="detectedError = false"/>
                  <div v-else class="incident-wizard__date-note">{{ dateModeNote(dateModes.detectedAt, 'о сбое узнали') }}</div>
                </div>
              </div>
            </div>
          </q-step>

          <q-step :name="5" title="Команда" icon="support_agent" :done="wizardStep > 5">
            <div class="incident-wizard__hint">
              Руководитель отвечает за инцидент целиком. Технический ответственный занимается диагностикой и
              устранением, ответственный за коммуникации публикует обновления для клиентов. Линия поддержки и
              участники — остальные, кто будет работать над инцидентом. Всё это можно изменить в карточке.
            </div>
            <div class="incident-wizard__fields">
              <div class="incident-form__pair">
                <q-select v-model="form.leaderId" outlined clearable :options="filteredOptions('userOptions')" use-input input-debounce="0" @filter="(val, update) => filterOptions(val, update, 'userOptions')" emit-value map-options
                          label="Руководитель инцидента"/>
                <q-select v-model="form.supportLineId" outlined clearable :options="supportLineOptions" emit-value
                          map-options label="Линия поддержки"/>
              </div>
              <div class="incident-form__pair">
                <q-select v-model="form.technicalOwnerId" outlined clearable :options="filteredOptions('userOptions')"
                          use-input input-debounce="0"
                          @filter="(val, update) => filterOptions(val, update, 'userOptions')" emit-value map-options
                          label="Технический ответственный" hint="Отвечает за диагностику и устранение"/>
                <q-select v-model="form.communicationOwnerId" outlined clearable
                          :options="filteredOptions('userOptions')" use-input input-debounce="0"
                          @filter="(val, update) => filterOptions(val, update, 'userOptions')" emit-value map-options
                          label="Ответственный за коммуникации" hint="Публикует обновления для клиентов"/>
              </div>
              <q-select v-model="form.participantIds" outlined multiple clearable :options="filteredOptions('userOptions')" use-input input-debounce="0" @filter="(val, update) => filterOptions(val, update, 'userOptions')" emit-value
                        map-options use-chips label="Участники"/>
            </div>
          </q-step>

          <q-step :name="6" title="Проверка" icon="fact_check">
            <div class="incident-wizard__hint">
              Задайте, как часто нужно публиковать обновления по инциденту: если срок пройдёт, в списке появится
              отметка о просрочке. Проверьте данные и создайте инцидент — остальное можно дополнить в его карточке.
            </div>
            <div class="incident-wizard__fields">
              <q-input v-model.number="form.updateIntervalMinutes" outlined type="number" min="5"
                       label="Интервал обязательных обновлений, минут" hint="Не меньше 5 минут"/>
              <q-list bordered separator class="rounded-borders incident-wizard__summary">
                <q-item v-for="row in summaryRows" :key="row.label">
                  <q-item-section class="incident-wizard__summary-label">{{ row.label }}</q-item-section>
                  <q-item-section class="text-weight-medium">{{ row.value }}</q-item-section>
                </q-item>
              </q-list>
            </div>
          </q-step>
        </q-stepper>

        <q-card-actions class="incident-wizard__actions">
          <div class="text-caption text-grey-7">Шаг {{ wizardStep }} из {{ wizardStepsCount }}</div>
          <q-space/>
          <q-btn v-if="wizardStep === 1" flat label="Отмена" v-close-popup/>
          <q-btn v-else flat icon="arrow_back" label="Назад" @click="prevWizardStep"/>
          <q-btn v-if="wizardStep < wizardStepsCount" color="primary" icon-right="arrow_forward"
                 label="Далее" @click="nextWizardStep"/>
          <q-btn v-else color="primary" icon="check" label="Создать инцидент" :loading="saving"
                 @click="createIncident"/>
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-dialog v-model="helpDialog">
      <q-card style="width: 640px; max-width: 96vw">
        <q-toolbar>
          <q-toolbar-title>Что такое инцидент</q-toolbar-title>
          <q-btn flat round dense icon="close" v-close-popup/>
        </q-toolbar>
        <q-card-section class="incident-help">
          <p>
            Инцидент — это общий сбой или ухудшение работы сервиса, которое затрагивает сразу многих пользователей.
            Заявка описывает обращение одного клиента, а инцидент собирает всё по одной проблеме в одном месте:
            кто и что затронуто, что делается и когда будет следующее обновление.
          </p>
          <div class="incident-help__title">Как заполнять форму</div>
          <ul>
            <li><b>Название, критичность (P1–P4) и статус</b> — коротко о сути и серьёзности. Новый инцидент удобно
              начинать со статуса «Черновик» или «Проверка», пока сбой не подтверждён.</li>
            <li><b>Затронутые сервисы и организации</b> — по ним видно масштаб инцидента и кому нужно сообщать.</li>
            <li><b>Описание и влияние</b> — что происходит технически и как это сказывается на клиентах.</li>
            <li><b>Руководитель, линия поддержки, участники</b> — кто отвечает за инцидент и кто работает над ним.</li>
            <li><b>Интервал обязательных обновлений</b> — как часто нужно публиковать новости по инциденту. Если
              обновление просрочено, в списке инцидентов появится отметка «Просрочено на…».</li>
          </ul>
          <div class="incident-help__title">Что делать после создания</div>
          <ul>
            <li>Откройте инцидент из списка. На вкладке <b>«Хронология»</b> публикуются записи для нужной аудитории.</li>
            <li>На вкладке <b>«Заявки»</b> привяжите обращения клиентов, которые относятся к этому сбою.</li>
            <li>На вкладках <b>«Команда»</b> и <b>«Обзор»</b> меняются ответственные, статус и сроки, а после
              устранения на вкладке <b>«Разбор»</b> фиксируются первопричина и итоги.</li>
          </ul>
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script>
import axios from 'axios'
import {useStore} from 'stores/store'
import {onIncidentUpdated} from 'src/util/ws'
import {isStaff} from 'src/util/access'
import {serviceOrganizationsLabel} from 'src/util/serviceOrganizations'

export default {
  name: 'IncidentsPage',

  data: () => ({
    store: useStore(),
    incidents: [],
    loading: false,
    saving: false,
    createDialog: false,
    wizardStep: 1,
    wizardStepsCount: 6,
    titleError: false,
    detectedError: false,
    dateModes: {actualStartedAt: 'none', detectedAt: 'none'},
    helpDialog: false,
    optionFilters: {},
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
      return this.$can('INCIDENT_EDIT')
    },

    userOptions() {
      // Менеджеры организаций (OBSERVER) в ролях инцидента не выбираются
      return this.users.filter(user => isStaff(user)).map(user => ({value: user.id, label: this.userName(user)}))
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

    dateModeOptions() {
      return [
        {label: 'Не указывать', value: 'none'},
        {label: 'Только что', value: 'now'},
        {label: 'Указать время', value: 'custom'}
      ]
    },

    severityHint() {
      return {
        P1: 'P1 — критично: ключевой сервис недоступен для большинства',
        P2: 'P2 — серьёзно: заметная деградация или недоступна часть функций',
        P3: 'P3 — средне: проблема затрагивает часть пользователей',
        P4: 'P4 — низкая: незначительные неудобства'
      }[this.form.severity] || ''
    },

    summaryRows() {
      const optionLabel = (options, value) => options.find(option => option.value === value)?.label
      const dash = '—'
      return [
        {label: 'Название', value: this.form.title || dash},
        {
          label: 'Критичность и статус',
          value: `${this.form.severity || dash} · ${optionLabel(this.statusOptions, this.form.status) || dash}`
        },
        {label: 'Сервисов затронуто', value: (this.form.serviceIds || []).length},
        {label: 'Организаций затронуто', value: (this.form.organizationIds || []).length},
        {label: 'Руководитель', value: optionLabel(this.userOptions, this.form.leaderId) || dash},
        {label: 'Участников', value: (this.form.participantIds || []).length}
      ]
    },

    supportLineOptions() {
      return this.supportLines.filter(line => line.active !== false).map(line => ({value: line.id, label: line.name}))
    }
  },

  mounted() {
    document.title = 'ULDESK : Инциденты'
    this.resetForm()
    this.loadDictionaries()
    this.loadIncidents()
    // инциденты, созданные или изменённые другими пользователями и автоматизациями
    this.incidentUpdatedUnsubscribe = onIncidentUpdated(() => {
      clearTimeout(this.incidentsReloadTimer)
      this.incidentsReloadTimer = setTimeout(() => this.loadIncidents(), 500)
    })
  },

  beforeUnmount() {
    clearTimeout(this.incidentsReloadTimer)
    if (this.incidentUpdatedUnsubscribe) this.incidentUpdatedUnsubscribe()
  },

  methods: {
    // Поиск по выпадающим спискам: вводим часть названия — список сужается
    filterOptions(value, update, name) {
      update(() => {
        this.optionFilters = {...this.optionFilters, [name]: String(value || '').toLowerCase().trim()}
      })
    },

    filteredOptions(name) {
      const options = this[name] || []
      const needle = this.optionFilters[name]
      return needle ? options.filter(option => String(option.label).toLowerCase().includes(needle)) : options
    },

    resetForm() {
      this.form = {
        title: '',
        description: '',
        publicDescription: '',
        workaround: '',
        actualStartedAt: '',
        detectedAt: '',
        technicalOwnerId: null,
        communicationOwnerId: null,
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

    paginationLabel(firstRowIndex, endRowIndex, totalRowsNumber) {
      return totalRowsNumber > 0
        ? `${firstRowIndex}–${endRowIndex} из ${totalRowsNumber}`
        : 'Нет записей'
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
          message: 'Сервер не вернул корректный идентификатор инцидента'
        })
        return
      }
      this.$router.push({name: 'incident-detail', params: {incidentId: String(incidentId)}})
    },

    openCreateDialog() {
      this.resetForm();
      this.wizardStep = 1
      this.titleError = false
      this.detectedError = false
      this.dateModes = {actualStartedAt: 'none', detectedAt: 'none'}
      this.createDialog = true
    },

    nextWizardStep() {
      if (this.wizardStep === 1 && !String(this.form.title || '').trim()) {
        this.titleError = true
        return
      }
      if (this.wizardStep === 4 && this.isDetectedBeforeStarted()) {
        this.detectedError = true
        return
      }
      this.wizardStep = Math.min(this.wizardStep + 1, this.wizardStepsCount)
    },

    dateModeNote(mode, what) {
      if (mode === 'now') return `Время создания инцидента: считаем, что ${what} прямо сейчас`
      return 'Можно заполнить позже в карточке инцидента'
    },

    // Дата по выбранному режиму: «сейчас» берётся в момент вызова, «не указывать» — пусто
    resolveDate(key) {
      const mode = this.dateModes[key]
      if (mode === 'now') return new Date().toISOString()
      if (mode === 'custom') return this.fromLocalInput(this.form[key])
      return null
    },

    isDetectedBeforeStarted() {
      const started = this.resolveDate('actualStartedAt')
      const detected = this.resolveDate('detectedAt')
      return Boolean(started && detected && new Date(detected) < new Date(started))
    },

    // Поле datetime-local отдаёт локальное время без часового пояса — на сервер отправляем ISO
    fromLocalInput(value) {
      return value ? new Date(value).toISOString() : null
    },

    prevWizardStep() {
      this.wizardStep = Math.max(this.wizardStep - 1, 1)
    },

    async createIncident() {
      if (!String(this.form.title || '').trim()) {
        this.wizardStep = 1
        this.titleError = true
        return
      }
      if (!(Number(this.form.updateIntervalMinutes) >= 5)) {
        this.$q.notify({type: 'negative', message: 'Интервал обновлений — не меньше 5 минут'})
        return
      }
      this.saving = true
      try {
        const payload = {
          ...this.form,
          actualStartedAt: this.resolveDate('actualStartedAt'),
          detectedAt: this.resolveDate('detectedAt')
        }
        const response = await axios.post('/api/v1/incident', payload)
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
      const base = code && name ? `${code} · ${name}` : (name || code || `Сервис #${service?.id}`)
      const organizations = serviceOrganizationsLabel(service, this.services)
      return organizations ? `${base} — ${organizations}` : base
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
        message: error.response?.data?.message || error.response?.data || error.message || 'Ошибка'
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

.incident-form__pair {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.incident-wizard {
  width: 760px;
  max-width: 96vw;
}

.incident-wizard__stepper {
  box-shadow: none;
}

.incident-wizard__hint {
  margin-bottom: 20px;
  padding: 12px 14px;
  border-radius: 8px;
  background: #f4f1ff;
  color: #4a4a4f;
  font-size: 14px;
  line-height: 1.5;
}

.incident-wizard__fields {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.incident-wizard__dates {
  align-items: start;
}

.incident-wizard__date {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.incident-wizard__date-title {
  font-size: 13px;
  font-weight: 600;
  color: #4a4a4f;
}

.incident-wizard__toggle {
  align-self: flex-start;
}

.incident-wizard__date-note {
  min-height: 56px;
  padding: 10px 12px;
  border: 1px dashed #d0d0d5;
  border-radius: 4px;
  color: #8a8a90;
  font-size: 13px;
  line-height: 1.4;
}

.incident-wizard__summary-label {
  max-width: 220px;
  color: #737b89;
}

.incident-wizard__actions {
  padding: 8px 16px 16px;
  gap: 8px;
}

.incident-help {
  font-size: 14px;
  line-height: 1.5;
  color: #4a4a4f;
}

.incident-help p {
  margin: 0 0 12px;
}

.incident-help ul {
  margin: 6px 0 12px;
  padding-left: 20px;
}

.incident-help li + li {
  margin-top: 6px;
}

.incident-help__title {
  margin-top: 4px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #8a8a90;
}

@media (max-width: 599px) {
  .incident-form__pair {
    grid-template-columns: 1fr;
  }
}
</style>
