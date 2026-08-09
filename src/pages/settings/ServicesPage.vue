<template>
  <q-page class="q-pa-md">
    <div class="settings-content-header">
      <div class="settings-content-heading">
        <div class="settings-content-title">Сервисы и мониторинг</div>
        <div class="settings-content-description">
          Управляйте каталогом услуг, договорными подключениями, SLA/OLA и интеграциями Zabbix.
        </div>
      </div>
      <div class="settings-content-actions">
        <q-btn flat round color="primary" icon="refresh" :loading="loading" @click="loadAll"/>
        <q-btn v-if="tab === 'services'" unelevated no-caps color="primary" icon="add" label="Сервис" @click="openService()"/>
        <q-btn v-if="tab === 'zabbix'" unelevated no-caps color="primary" icon="add" label="Интеграция" @click="openZabbix()"/>
        <q-btn v-if="tab === 'assignments'" unelevated no-caps color="primary" icon="add" label="Подключение" @click="openAssignment()"/>
        <q-btn v-if="tab === 'criticalities'" unelevated no-caps color="primary" icon="add" label="Критичность" @click="openCriticality()"/>
      </div>
    </div>

    <q-tabs v-model="tab" dense align="left" class="text-primary q-mb-md">
      <q-tab name="services" icon="dns" label="Сервисы"/>
      <q-tab name="assignments" icon="handshake" label="Организации и договоры"/>
      <q-tab name="zabbix" icon="monitor_heart" label="Zabbix"/>
      <q-tab name="criticalities" icon="priority_high" label="Критичности"/>
    </q-tabs>

    <q-tab-panels v-model="tab" animated>
      <q-tab-panel name="services" class="q-pa-none">
        <q-table
          class="settings-row-table"
          flat bordered row-key="id" :rows="services" :columns="serviceColumns"
          :filter="serviceFilter" :loading="loading" :pagination="{ rowsPerPage: 20 }"
        >
          <template #top-left>
            <q-input v-model="serviceFilter" dense outlined clearable debounce="250"
                     placeholder="Поиск по коду или названию">
              <template #prepend>
                <q-icon name="search"/>
              </template>
            </q-input>
          </template>
          <template #body-cell-name="props">
            <q-td :props="props">
              <div class="text-weight-medium">{{ props.row.code }} · {{ props.row.name }}</div>
              <div class="text-caption text-grey-7 ellipsis" style="max-width: 420px">{{ props.row.description }}</div>
            </q-td>
          </template>
          <template #body-cell-criticality="props">
            <q-td :props="props">{{ props.row.criticality?.name || '—' }}</q-td>
          </template>
          <template #body-cell-monitoring="props">
            <q-td :props="props">
              <q-chip dense :color="monitoringColor(props.row.monitoringStatus)" text-color="white">
                {{ monitoringLabel(props.row.monitoringStatus) }}
              </q-chip>
              <div class="text-caption text-grey-7">{{ props.row.lastMonitoringMessage || '' }}</div>
            </q-td>
          </template>
          <template #body-cell-active="props">
            <q-td :props="props">
              <q-icon :name="props.row.active ? 'check_circle' : 'pause_circle'"
                      :color="props.row.active ? 'positive' : 'grey'" size="sm"/>
            </q-td>
          </template>
          <template #body-cell-actions="props">
            <q-td :props="props" class="q-gutter-xs">
              <q-btn flat round dense icon="monitor_heart" :loading="checkingId === props.row.id"
                     @click="checkMonitoring(props.row)">
                <q-tooltip>Проверить Zabbix</q-tooltip>
              </q-btn>
              <q-btn flat round dense icon="edit" @click="openService(props.row)"/>
              <q-btn flat round dense icon="delete" color="negative" @click="removeService(props.row)"/>
            </q-td>
          </template>
        </q-table>
      </q-tab-panel>

      <q-tab-panel name="assignments" class="q-pa-none">
        <q-table class="settings-row-table" flat bordered row-key="id" :rows="assignments" :columns="assignmentColumns" :loading="loading"
                 :pagination="{ rowsPerPage: 20 }">
          <template #body-cell-organization="props">
            <q-td :props="props">
              <div
                class="organization-name-ellipsis"
                style="max-width: 280px"
                :title="props.row.organization?.name || ''"
              >{{ props.row.organization?.name || '—' }}
              </div>
            </q-td>
          </template>
          <template #body-cell-service="props">
            <q-td :props="props">{{ props.row.service?.code }} · {{ props.row.service?.name }}</q-td>
          </template>
          <template #body-cell-validity="props">
            <q-td :props="props">{{ dateRange(props.row.validFrom, props.row.validTo) }}</q-td>
          </template>
          <template #body-cell-sla="props">
            <q-td :props="props">Ответ: {{ minutesLabel(props.row.firstResponseSlaMinutes) }}<br>Решение:
              {{ minutesLabel(props.row.resolutionSlaMinutes) }}
            </q-td>
          </template>
          <template #body-cell-active="props">
            <q-td :props="props">
              <q-icon :name="props.row.active ? 'check_circle' : 'pause_circle'"
                      :color="props.row.active ? 'positive' : 'grey'"/>
            </q-td>
          </template>
          <template #body-cell-actions="props">
            <q-td :props="props">
              <q-btn flat round dense icon="edit" @click="openAssignment(props.row)"/>
              <q-btn flat round dense icon="delete" color="negative" @click="removeAssignment(props.row)"/>
            </q-td>
          </template>
        </q-table>
      </q-tab-panel>

      <q-tab-panel name="zabbix" class="q-pa-none">
        <q-table class="settings-row-table" flat bordered row-key="id" :rows="zabbixIntegrations" :columns="zabbixColumns" :loading="loading">
          <template #body-cell-auth="props">
            <q-td :props="props">
              {{ props.row.hasApiToken ? 'API token' : props.row.hasPassword ? 'Логин / пароль' : 'Не настроена' }}
            </q-td>
          </template>
          <template #body-cell-lastTest="props">
            <q-td :props="props">
              <q-icon :name="props.row.lastTestSuccess ? 'check_circle' : 'error'"
                      :color="props.row.lastTestSuccess ? 'positive' : 'negative'"/>
              {{ props.row.lastTestMessage || 'Не проверялась' }}
            </q-td>
          </template>
          <template #body-cell-actions="props">
            <q-td :props="props">
              <q-btn flat round dense icon="network_check" :loading="testingZabbixId === props.row.id"
                     @click="testZabbix(props.row)"/>
              <q-btn flat round dense icon="edit" @click="openZabbix(props.row)"/>
              <q-btn flat round dense icon="delete" color="negative" @click="removeZabbix(props.row)"/>
            </q-td>
          </template>
        </q-table>
      </q-tab-panel>

      <q-tab-panel name="criticalities" class="q-pa-none">
        <q-table class="settings-row-table" flat bordered row-key="id" :rows="criticalities" :columns="criticalityColumns" :loading="loading">
          <template #body-cell-defaultSelection="props">
            <q-td :props="props">
              <q-icon v-if="props.row.defaultSelection" name="star" color="amber"/>
            </q-td>
          </template>
          <template #body-cell-actions="props">
            <q-td :props="props">
              <q-btn flat round dense icon="edit" @click="openCriticality(props.row)"/>
              <q-btn flat round dense icon="delete" color="negative" @click="removeCriticality(props.row)"/>
            </q-td>
          </template>
        </q-table>
      </q-tab-panel>
    </q-tab-panels>

    <q-dialog v-model="serviceDialog" persistent maximized transition-show="slide-up" transition-hide="slide-down">
      <q-card>
        <q-toolbar class="bg-primary text-white">
          <q-toolbar-title>{{ serviceForm.id ? 'Редактирование сервиса' : 'Новый сервис' }}</q-toolbar-title>
          <q-btn flat round dense icon="close" v-close-popup/>
        </q-toolbar>
        <q-card-section class="q-pa-md service-form">
          <q-form ref="serviceFormRef" class="q-gutter-md" @submit="saveService">
            <div class="row q-col-gutter-md">
              <q-input v-model="serviceForm.code" class="col-12 col-md-3" outlined label="Код *" :rules="[required]"/>
              <q-input v-model="serviceForm.name" class="col-12 col-md-6" outlined label="Название *"
                       :rules="[required]"/>
              <q-toggle v-model="serviceForm.active" class="col-12 col-md-3" label="Активен"/>
              <q-input v-model="serviceForm.description" class="col-12" type="textarea" outlined autogrow
                       label="Описание"/>
            </div>

            <q-separator/>
            <div class="text-subtitle1">Ответственные и маршрутизация</div>
            <div class="row q-col-gutter-md">
              <q-select v-model="serviceForm.criticalityId" class="col-12 col-md-3" outlined clearable emit-value
                        map-options :options="criticalityOptions" label="Критичность"/>
              <q-select v-model="serviceForm.ownerId" class="col-12 col-md-3" outlined clearable emit-value map-options
                        use-input input-debounce="0" :options="userOptions" label="Владелец"/>
              <q-select v-model="serviceForm.defaultSupportLineId" class="col-12 col-md-3" outlined clearable emit-value
                        map-options :options="supportLineOptions" label="Линия по умолчанию"/>
              <q-select v-model="serviceForm.defaultPriorityId" class="col-12 col-md-3" outlined clearable emit-value
                        map-options :options="priorityOptions" label="Приоритет по умолчанию"/>
              <q-select v-model="serviceForm.taskTypeIds" class="col-12 col-md-6" outlined multiple use-chips emit-value
                        map-options :options="taskTypeOptions" label="Разрешённые типы заявок"/>
              <q-select v-model="serviceForm.executorIds" class="col-12 col-md-6" outlined multiple use-chips emit-value
                        map-options :options="userOptions" label="Команда сервиса"/>
              <q-select v-model="serviceForm.dependencyIds" class="col-12" outlined multiple use-chips emit-value
                        map-options :options="dependencyOptions" label="Зависимые сервисы"/>
              <q-toggle v-model="serviceForm.autoAssignDefaultLine" label="Автоматически назначать линию по умолчанию"/>
            </div>

            <q-separator/>
            <div class="text-subtitle1">SLA</div>
            <div class="row q-col-gutter-md">
              <q-input v-model.number="serviceForm.firstResponseSlaMinutes" class="col-12 col-md-3" outlined
                       type="number" min="0" label="Первый ответ, минут"/>
              <q-input v-model.number="serviceForm.resolutionSlaMinutes" class="col-12 col-md-3" outlined type="number"
                       min="0" label="Решение, минут"/>
              <q-input v-model="serviceForm.supportCalendar" class="col-12 col-md-3" outlined
                       label="Календарь поддержки" hint="GENERAL_SETTINGS — общий календарь"/>
              <q-toggle v-model="serviceForm.pauseSlaOnWaitingClient" class="col-12 col-md-3"
                        label="Пауза при ожидании клиента"/>
            </div>

            <div class="row items-center q-mt-md">
              <div class="text-subtitle1">Правила приоритета</div>
              <q-space/>
              <q-btn flat color="primary" icon="add" label="Правило" @click="addPriorityRule"/>
            </div>
            <q-markup-table v-if="serviceForm.priorityRules.length" flat bordered>
              <thead>
              <tr>
                <th>Порядок</th>
                <th>Тип заявки</th>
                <th>Ключевое слово / regex</th>
                <th>Приоритет</th>
                <th>Активно</th>
                <th/>
              </tr>
              </thead>
              <tbody>
              <tr v-for="(rule, index) in serviceForm.priorityRules" :key="index">
                <td>
                  <q-input v-model.number="rule.orderNumber" dense borderless type="number"/>
                </td>
                <td>
                  <q-select v-model="rule.taskTypeId" dense borderless clearable emit-value map-options
                            :options="taskTypeOptions"/>
                </td>
                <td>
                  <q-input v-model="rule.keyword" dense borderless placeholder="ошибка или regex:ошибк(а|и)"/>
                </td>
                <td>
                  <q-select v-model="rule.priorityId" dense borderless emit-value map-options
                            :options="priorityOptions"/>
                </td>
                <td>
                  <q-toggle v-model="rule.active" dense/>
                </td>
                <td>
                  <q-btn flat round dense icon="delete" color="negative"
                         @click="serviceForm.priorityRules.splice(index, 1)"/>
                </td>
              </tr>
              </tbody>
            </q-markup-table>

            <div class="row items-center q-mt-md">
              <div class="text-subtitle1">OLA по линиям</div>
              <q-space/>
              <q-btn flat color="primary" icon="add" label="Этап OLA" @click="addOlaStage"/>
            </div>
            <q-markup-table v-if="serviceForm.olaStages.length" flat bordered>
              <thead>
              <tr>
                <th>Порядок</th>
                <th>Линия</th>
                <th>Длительность, сек.</th>
                <th>Рабочее время</th>
                <th>Предупреждение, %</th>
                <th>Активно</th>
                <th/>
              </tr>
              </thead>
              <tbody>
              <tr v-for="(stage, index) in serviceForm.olaStages" :key="index">
                <td>
                  <q-input v-model.number="stage.orderNumber" dense borderless type="number"/>
                </td>
                <td>
                  <q-select v-model="stage.supportLineId" dense borderless emit-value map-options
                            :options="supportLineOptions"/>
                </td>
                <td>
                  <q-input v-model.number="stage.durationSeconds" dense borderless type="number" min="1"/>
                </td>
                <td>
                  <q-toggle v-model="stage.useWorkingTime" dense/>
                </td>
                <td>
                  <q-input v-model.number="stage.warningPercent" dense borderless type="number" min="1" max="100"/>
                </td>
                <td>
                  <q-toggle v-model="stage.active" dense/>
                </td>
                <td>
                  <q-btn flat round dense icon="delete" color="negative"
                         @click="serviceForm.olaStages.splice(index, 1)"/>
                </td>
              </tr>
              </tbody>
            </q-markup-table>

            <q-separator/>
            <div class="text-subtitle1">Zabbix</div>
            <div class="row q-col-gutter-md">
              <q-toggle v-model="serviceForm.zabbixEnabled" class="col-12 col-md-2" label="Мониторинг включён"/>
              <q-select v-model="serviceForm.zabbixIntegrationId" class="col-12 col-md-4" outlined clearable emit-value
                        map-options :options="zabbixOptions" label="Интеграция Zabbix"/>
              <q-input v-model="serviceForm.monitoringUrl" class="col-12 col-md-6" outlined
                       label="Ссылка на мониторинг / дашборд"/>
              <q-input v-model="serviceForm.monitoringIdentifiers.hostIds" class="col-12 col-md-3" outlined
                       label="Host ID" hint="Через запятую"/>
              <q-input v-model="serviceForm.monitoringIdentifiers.hostNames" class="col-12 col-md-3" outlined
                       label="Host names" hint="Через запятую"/>
              <q-input v-model="serviceForm.monitoringIdentifiers.hostGroupIds" class="col-12 col-md-3" outlined
                       label="Host group ID" hint="Через запятую"/>
            </div>

            <div class="row justify-end q-gutter-sm q-pt-md">
              <q-btn flat label="Отмена" v-close-popup/>
              <q-btn color="primary" type="submit" label="Сохранить" :loading="saving"/>
            </div>
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>

    <q-dialog v-model="zabbixDialog" persistent>
      <q-card style="min-width: min(720px, 95vw)">
        <q-card-section>
          <div class="text-h6">{{ zabbixForm.id ? 'Интеграция Zabbix' : 'Новая интеграция Zabbix' }}</div>
        </q-card-section>
        <q-card-section class="q-gutter-md">
          <q-input v-model="zabbixForm.name" outlined label="Название *" :rules="[required]"/>
          <q-input v-model="zabbixForm.baseUrl" outlined label="URL Zabbix *" hint="Например https://zabbix.example.com"
                   :rules="[required]"/>
          <div class="row q-col-gutter-md">
            <q-input v-model="zabbixForm.username" class="col-6" outlined label="Логин"/>
            <q-input v-model="zabbixForm.password" class="col-6" outlined type="password" label="Пароль"
                     hint="Пусто — оставить прежний"/>
          </div>
          <q-input v-model="zabbixForm.apiToken" outlined type="password" label="API token"
                   hint="При наличии token логин и пароль не используются"/>
          <div class="row q-col-gutter-md">
            <q-input v-model.number="zabbixForm.requestTimeoutSeconds" class="col-6" outlined type="number" min="2"
                     max="120" label="Таймаут, сек."/>
            <q-toggle v-model="zabbixForm.active" class="col-6" label="Активна"/>
          </div>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Отмена" v-close-popup/>
          <q-btn color="primary" label="Сохранить" :loading="saving" @click="saveZabbix"/>
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-dialog v-model="assignmentDialog" persistent>
      <q-card style="min-width: min(900px, 96vw)">
        <q-card-section>
          <div class="text-h6">Подключение сервиса к организации</div>
        </q-card-section>
        <q-card-section class="row q-col-gutter-md">
          <q-select v-model="assignmentForm.organizationId" class="col-12 col-md-6 organization-select" outlined
                    emit-value map-options
                    :options="organizationOptions" label="Организация *"
                    popup-content-class="organization-select-popup"/>
          <q-select v-model="assignmentForm.serviceId" class="col-12 col-md-6" outlined emit-value map-options
                    :options="serviceOptions" label="Сервис *"/>
          <q-input v-model="assignmentForm.contractNumber" class="col-12 col-md-4" outlined label="Договор"/>
          <q-input v-model="assignmentForm.tariffName" class="col-12 col-md-4" outlined
                   label="Тариф / уровень поддержки"/>
          <q-input v-model="assignmentForm.slaPolicyName" class="col-12 col-md-4" outlined
                   label="Название SLA-политики"/>
          <q-input v-model="assignmentForm.validFrom" class="col-6 col-md-3" outlined type="date" label="Действует с"
                   stack-label/>
          <q-input v-model="assignmentForm.validTo" class="col-6 col-md-3" outlined type="date" label="Действует до"
                   stack-label/>
          <q-input v-model.number="assignmentForm.firstResponseSlaMinutes" class="col-6 col-md-3" outlined type="number"
                   min="0" label="Первый ответ, мин."/>
          <q-input v-model.number="assignmentForm.resolutionSlaMinutes" class="col-6 col-md-3" outlined type="number"
                   min="0" label="Решение, мин."/>
          <q-input v-model="assignmentForm.supportCalendar" class="col-12 col-md-4" outlined label="Календарь"/>
          <q-select v-model="assignmentForm.availableChannels" class="col-12 col-md-8" outlined multiple use-chips
                    emit-value map-options :options="channelOptions" label="Доступные каналы"/>
          <q-toggle v-model="assignmentForm.active" label="Активно"/>
          <q-toggle v-model="assignmentForm.defaultForOrganization" label="Сервис по умолчанию"/>
          <q-input v-model="assignmentForm.notes" class="col-12" outlined type="textarea" autogrow label="Примечания"/>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Отмена" v-close-popup/>
          <q-btn color="primary" label="Сохранить" :loading="saving" @click="saveAssignment"/>
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-dialog v-model="criticalityDialog">
      <q-card style="min-width: 420px">
        <q-card-section>
          <div class="text-h6">Критичность сервиса</div>
        </q-card-section>
        <q-card-section class="q-gutter-md">
          <q-input v-model="criticalityForm.name" outlined label="Название *"/>
          <q-input v-model.number="criticalityForm.orderNumber" outlined type="number" label="Порядок"/>
          <q-toggle v-model="criticalityForm.defaultSelection" label="По умолчанию"/>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Отмена" v-close-popup/>
          <q-btn color="primary" label="Сохранить" :loading="saving" @click="saveCriticality"/>
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script>
import axios from 'axios'
import {useStore} from 'stores/store'

const emptyService = () => ({
  id: null,
  code: '',
  name: '',
  description: '',
  monitoringUrl: '',
  active: true,
  orderNumber: 0,
  criticalityId: null,
  ownerId: null,
  defaultSupportLineId: null,
  defaultPriorityId: null,
  taskTypeIds: [],
  executorIds: [],
  dependencyIds: [],
  firstResponseSlaMinutes: null,
  resolutionSlaMinutes: null,
  supportCalendar: 'GENERAL_SETTINGS',
  pauseSlaOnWaitingClient: true,
  autoAssignDefaultLine: true,
  priorityRules: [],
  olaStages: [],
  zabbixIntegrationId: null,
  zabbixEnabled: false,
  monitoringIdentifiers: {hostIds: '', hostNames: '', hostGroupIds: ''}
})

const emptyZabbix = () => ({
  id: null,
  name: '',
  baseUrl: '',
  username: '',
  password: '',
  apiToken: '',
  active: true,
  requestTimeoutSeconds: 15
})

const emptyAssignment = () => ({
  id: null,
  organizationId: null,
  serviceId: null,
  contractNumber: '',
  tariffName: '',
  validFrom: null,
  validTo: null,
  supportCalendar: 'GENERAL_SETTINGS',
  slaPolicyName: '',
  firstResponseSlaMinutes: null,
  resolutionSlaMinutes: null,
  availableChannels: ['EMAIL', 'TELEGRAM', 'WHATSAPP', 'PORTAL'],
  active: true,
  defaultForOrganization: false,
  notes: ''
})

const emptyCriticality = () => ({id: null, name: '', orderNumber: 0, defaultSelection: false})

export default {
  name: 'ServicesPage',

  setup() {
    return {store: useStore()}
  },

  data() {
    return {
      tab: 'services',
      loading: false,
      saving: false,
      checkingId: null,
      testingZabbixId: null,
      routeServiceOpened: false,
      serviceFilter: '',
      services: [],
      assignments: [],
      zabbixIntegrations: [],
      criticalities: [],
      serviceDialog: false,
      zabbixDialog: false,
      assignmentDialog: false,
      criticalityDialog: false,
      serviceForm: emptyService(),
      zabbixForm: emptyZabbix(),
      assignmentForm: emptyAssignment(),
      criticalityForm: emptyCriticality(),
      serviceColumns: [
        {name: 'name', label: 'Сервис', field: row => `${row.code} ${row.name}`, align: 'left', sortable: true},
        {
          name: 'criticality',
          label: 'Критичность',
          field: row => row.criticality?.name || '',
          align: 'left',
          sortable: true
        },
        {
          name: 'owner',
          label: 'Владелец',
          field: row => [row.owner?.lastname, row.owner?.firstname].filter(Boolean).join(' ') || row.owner?.username || '—',
          align: 'left'
        },
        {name: 'defaultLine', label: 'Линия', field: row => row.defaultSupportLine?.name || '—', align: 'left'},
        {name: 'monitoring', label: 'Мониторинг', field: 'monitoringStatus', align: 'left'},
        {name: 'active', label: 'Активен', field: 'active', align: 'center'},
        {name: 'actions', label: '', field: 'id', align: 'right'}
      ],
      assignmentColumns: [
        {
          name: 'organization',
          label: 'Организация',
          field: row => row.organization?.name || '',
          align: 'left',
          sortable: true
        },
        {name: 'service', label: 'Сервис', field: row => row.service?.name || '', align: 'left', sortable: true},
        {
          name: 'contract',
          label: 'Договор / тариф',
          field: row => [row.contractNumber, row.tariffName].filter(Boolean).join(' · ') || '—',
          align: 'left'
        },
        {name: 'validity', label: 'Период', field: 'validFrom', align: 'left'},
        {name: 'sla', label: 'SLA', field: 'resolutionSlaMinutes', align: 'left'},
        {name: 'active', label: 'Активно', field: 'active', align: 'center'},
        {name: 'actions', label: '', field: 'id', align: 'right'}
      ],
      zabbixColumns: [
        {name: 'name', label: 'Название', field: 'name', align: 'left', sortable: true},
        {name: 'url', label: 'URL', field: 'baseUrl', align: 'left'},
        {name: 'auth', label: 'Авторизация', field: 'hasApiToken', align: 'left'},
        {name: 'lastTest', label: 'Последняя проверка', field: 'lastTestMessage', align: 'left'},
        {name: 'actions', label: '', field: 'id', align: 'right'}
      ],
      criticalityColumns: [
        {name: 'name', label: 'Название', field: 'name', align: 'left', sortable: true},
        {name: 'orderNumber', label: 'Порядок', field: 'orderNumber', align: 'center', sortable: true},
        {name: 'defaultSelection', label: 'По умолчанию', field: 'defaultSelection', align: 'center'},
        {name: 'actions', label: '', field: 'id', align: 'right'}
      ],
      channelOptions: ['EMAIL', 'TELEGRAM', 'WHATSAPP', 'PORTAL', 'PHONE'].map(value => ({label: value, value}))
    }
  },

  computed: {
    criticalityOptions() {
      return this.criticalities.map(x => ({label: x.name, value: x.id}))
    },
    userOptions() {
      return this.store.users.map(x => ({
        label: [x.lastname, x.firstname].filter(Boolean).join(' ') || x.username,
        value: x.id
      }))
    },

    supportLineOptions() {
      return this.store.supportLines.map(x => ({label: x.name, value: x.id}))
    },

    priorityOptions() {
      return this.store.priorities.map(x => ({label: x.name, value: x.id}))
    },

    taskTypeOptions() {
      return this.store.taskTypes.map(x => ({label: x.type || x.name, value: x.id}))
    },

    dependencyOptions() {
      return this.services.filter(x => x.id !== this.serviceForm.id).map(x => ({
        label: `${x.code} · ${x.name}`,
        value: x.id
      }))
    },

    zabbixOptions() {
      return this.zabbixIntegrations.map(x => ({label: x.name, value: x.id}))
    },

    organizationOptions() {
      return this.store.organizations.map(x => ({label: x.name, value: x.id}))
    },

    serviceOptions() {
      return this.services.map(x => ({label: `${x.code} · ${x.name}`, value: x.id}))
    }
  },

  mounted() {
    this.store.fetchData();
    this.loadAll()
  },

  methods: {
    required: value => Boolean(value && String(value).trim()) || 'Обязательное поле',
    notifyError(error) {
      this.$q.notify({
        type: 'negative',
        message: error?.response?.data?.message || error?.response?.data || error?.message || 'Операция не выполнена'
      })
    },

    notifyOk(message) {
      this.$q.notify({type: 'positive', message})
    },

    async loadAll() {
      this.loading = true
      try {
        const [services, assignments, zabbix, criticalities] = await Promise.all([
          axios.get('/api/v1/services?includeInactive=true'), axios.get('/api/v1/organization-service-assignments'),
          axios.get('/api/v1/zabbix-integrations'), axios.get('/api/v1/service-criticalities')
        ])
        this.services = Array.isArray(services.data) ? services.data : []
        this.store.services = this.services.filter(item => item.active)
        this.assignments = Array.isArray(assignments.data) ? assignments.data : []
        this.zabbixIntegrations = Array.isArray(zabbix.data) ? zabbix.data : []
        this.criticalities = Array.isArray(criticalities.data) ? criticalities.data : []
        if (!this.routeServiceOpened) {
          this.routeServiceOpened = true
          const serviceId = Number(this.$route.query.serviceId)
          const service = Number.isFinite(serviceId) ? this.services.find(item => Number(item.id) === serviceId) : null
          if (service) this.openService(service)
        }
      } catch (error) {
        this.notifyError(error)
      } finally {
        this.loading = false
      }
    },

    openService(row = null) {
      if (!row) {
        this.serviceForm = emptyService()
      } else {
        this.serviceForm = {
          ...emptyService(),
          id: row.id,
          code: row.code,
          name: row.name,
          description: row.description,
          monitoringUrl: row.monitoringUrl || '',
          active: row.active,
          orderNumber: row.orderNumber,
          criticalityId: row.criticality?.id || null,
          ownerId: row.owner?.id || null,
          defaultSupportLineId: row.defaultSupportLine?.id || null,
          defaultPriorityId: row.defaultPriority?.id || null,
          taskTypeIds: (row.taskTypes || []).map(x => x.id),
          executorIds: (row.executors || []).map(x => x.id),
          dependencyIds: (row.dependencies || []).map(x => x.id),
          firstResponseSlaMinutes: row.firstResponseSlaMinutes,
          resolutionSlaMinutes: row.resolutionSlaMinutes,
          supportCalendar: row.supportCalendar || 'GENERAL_SETTINGS',
          pauseSlaOnWaitingClient: row.pauseSlaOnWaitingClient !== false,
          autoAssignDefaultLine: row.autoAssignDefaultLine !== false,
          priorityRules: JSON.parse(JSON.stringify(row.priorityRules || [])),
          olaStages: JSON.parse(JSON.stringify(row.olaStages || [])),
          zabbixIntegrationId: row.zabbixIntegration?.id || null,
          zabbixEnabled: Boolean(row.zabbixEnabled),
          monitoringIdentifiers: {hostIds: '', hostNames: '', hostGroupIds: '', ...(row.monitoringIdentifiers || {})}
        }
      }
      this.serviceDialog = true
    },

    addPriorityRule() {
      this.serviceForm.priorityRules.push({
        orderNumber: this.serviceForm.priorityRules.length,
        taskTypeId: null,
        keyword: '',
        priorityId: null,
        active: true
      })
    },

    addOlaStage() {
      this.serviceForm.olaStages.push({
        orderNumber: this.serviceForm.olaStages.length,
        supportLineId: null,
        durationSeconds: 3600,
        useWorkingTime: true,
        warningPercent: 80,
        active: true
      })
    },

    async saveService() {
      if (!await this.$refs.serviceFormRef.validate()) return
      this.saving = true
      try {
        const id = this.serviceForm.id;
        const payload = {...this.serviceForm};
        delete payload.id
        if (id) await axios.patch(`/api/v1/service/${id}`, payload); else await axios.post('/api/v1/service', payload)
        this.serviceDialog = false;
        await this.loadAll();
        this.notifyOk('Сервис сохранён')
      } catch (error) {
        this.notifyError(error)
      } finally {
        this.saving = false
      }
    },

    removeService(row) {
      this.$q.dialog({
        title: 'Удалить сервис?',
        message: 'Если сервис используется, он будет деактивирован.',
        cancel: true
      }).onOk(async () => {
        try {
          await axios.delete(`/api/v1/service/${row.id}`);
          await this.loadAll()
        } catch (e) {
          this.notifyError(e)
        }
      })
    },

    async checkMonitoring(row) {
      this.checkingId = row.id;
      try {
        const {data} = await axios.post(`/api/v1/service/${row.id}/monitoring/check`);
        await this.loadAll();
        this.$q.notify({
          type: data.status === 'OK' ? 'positive' : 'warning',
          message: data.message || 'Проверка завершена',
          position: 'top-right',
          actions: [{
            icon: 'close',
            color: 'white',
            dense: true,
            handler: () => undefined
          }]
        })
      } catch (e) {
        this.notifyError(e)
      } finally {
        this.checkingId = null
      }
    },

    openZabbix(row = null) {
      this.zabbixForm = row ? {...emptyZabbix(), ...row, password: '', apiToken: ''} : emptyZabbix();
      this.zabbixDialog = true
    },

    async saveZabbix() {
      this.saving = true;
      try {
        const id = this.zabbixForm.id;
        const payload = {...this.zabbixForm};
        delete payload.id;
        if (id) await axios.patch(`/api/v1/zabbix-integration/${id}`, payload); else await axios.post('/api/v1/zabbix-integration', payload);
        this.zabbixDialog = false;
        await this.loadAll();
        this.notifyOk('Интеграция сохранена')
      } catch (e) {
        this.notifyError(e)
      } finally {
        this.saving = false
      }
    },

    async testZabbix(row) {
      this.testingZabbixId = row.id;
      try {
        const {data} = await axios.post(`/api/v1/zabbix-integration/${row.id}/test`);
        await this.loadAll();
        this.$q.notify({
          type: data.success ? 'positive' : 'negative',
          message: data.message,
          position: 'top-right',
          actions: [{
            icon: 'close',
            color: 'white',
            dense: true,
            handler: () => undefined
          }]})
      } catch (e) {
        this.notifyError(e)
      } finally {
        this.testingZabbixId = null
      }
    },

    removeZabbix(row) {
      this.$q.dialog({title: 'Удалить интеграцию?', cancel: true}).onOk(async () => {
        try {
          await axios.delete(`/api/v1/zabbix-integration/${row.id}`);
          await this.loadAll()
        } catch (e) {
          this.notifyError(e)
        }
      })
    },

    openAssignment(row = null) {
      this.assignmentForm = row ? {
        ...emptyAssignment(),
        ...row,
        organizationId: row.organization?.id,
        serviceId: row.service?.id
      } : emptyAssignment();
      this.assignmentDialog = true
    },

    async saveAssignment() {
      if (!this.assignmentForm.organizationId || !this.assignmentForm.serviceId) return this.notifyError(new Error('Организация и сервис обязательны'));
      this.saving = true;
      try {
        const id = this.assignmentForm.id;
        const payload = {...this.assignmentForm};
        delete payload.id;
        delete payload.organization;
        delete payload.service;
        delete payload.effective;
        if (id) await axios.patch(`/api/v1/organization-service-assignment/${id}`, payload); else await axios.post('/api/v1/organization-service-assignment', payload);
        this.assignmentDialog = false;
        await this.loadAll();
        this.notifyOk('Подключение сохранено')
      } catch (e) {
        this.notifyError(e)
      } finally {
        this.saving = false
      }
    },

    removeAssignment(row) {
      this.$q.dialog({title: 'Удалить подключение?', cancel: true}).onOk(async () => {
        try {
          await axios.delete(`/api/v1/organization-service-assignment/${row.id}`);
          await this.loadAll()
        } catch (e) {
          this.notifyError(e)
        }
      })
    },

    openCriticality(row = null) {
      this.criticalityForm = row ? {...row} : emptyCriticality();
      this.criticalityDialog = true
    },
    async saveCriticality() {
      if (!this.criticalityForm.name?.trim()) return;
      this.saving = true;
      try {
        if (this.criticalityForm.id) await axios.patch('/api/v1/service-criticality', this.criticalityForm); else await axios.post('/api/v1/service-criticality', this.criticalityForm);
        this.criticalityDialog = false;
        await this.loadAll()
      } catch (e) {
        this.notifyError(e)
      } finally {
        this.saving = false
      }
    },

    removeCriticality(row) {
      this.$q.dialog({title: 'Удалить критичность?', cancel: true}).onOk(async () => {
        try {
          await axios.delete(`/api/v1/service-criticality/${row.id}`);
          await this.loadAll()
        } catch (e) {
          this.notifyError(e)
        }
      })
    },

    monitoringColor(status) {
      return ({
        OK: 'positive',
        WARNING: 'warning',
        CRITICAL: 'negative',
        UNAVAILABLE: 'grey-8',
        NOT_CONFIGURED: 'grey'
      })[status] || 'grey'
    },

    monitoringLabel(status) {
      return ({
        OK: 'Работает',
        WARNING: 'Предупреждение',
        CRITICAL: 'Критично',
        UNAVAILABLE: 'Недоступен',
        NOT_CONFIGURED: 'Не настроен'
      })[status] || status || 'Не настроен'
    },

    dateRange(from, to) {
      return `${from || '—'} — ${to || '∞'}`
    },

    minutesLabel(value) {
      return value == null ? 'по сервису' : `${value} мин.`
    }
  }
}
</script>

<style scoped>
.service-form {
  max-width: 1500px;
  margin: 0 auto;
}
</style>
