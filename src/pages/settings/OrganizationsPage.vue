<template>
  <div class="q-pa-md organizations-settings-page">
    <div class="settings-content-header">
      <div class="settings-content-heading">
        <div class="settings-content-title">Организации</div>
        <div class="settings-content-description">
          Управляйте организациями, договорами, сотрудниками и пакетами выездов.
        </div>
      </div>
      <div class="settings-content-actions">
        <q-btn
          unelevated
          no-caps
          color="primary"
          icon="add"
          label="Добавить организацию"
          @click="dialogNewOrganizationShow"
        />
      </div>
    </div>

    <q-input
      v-model="search"
      outlined
      dense
      clearable
      debounce="250"
      label="Поиск по названию, договору, тарифу, адресу или менеджеру"
      class="q-mb-md"
    >
      <template #prepend>
        <q-icon name="search"/>
      </template>
    </q-input>

    <div class="table-container">
      <q-list
        bordered
        class="rounded-borders bg-white settings-row-list organization-list"
        separator
      >
        <draggable
          :list="filteredOrganizations"
          item-key="id"
          class="organization-sortable-list"
          ghost-class="ghost"
          handle=".settings-drag-handle"
          :disabled="Boolean(search)"
          @start="dragging = true"
          @end="onOrganizationDragEnd"
        >
          <template #item="{ element }">
            <q-item
              class="organization-row"
              :class="{ 'not-draggable': Boolean(search) }"
            >
              <q-item-section side class="settings-drag-handle cursor-grab">
                <q-icon name="drag_indicator" color="grey-6"/>
              </q-item-section>

              <q-item-section class="organization-name-section">
                <q-item-label class="row items-center q-gutter-sm no-wrap">
                  <span class="text-weight-medium organization-name-ellipsis" :title="element.name">
                    {{ element.name }}
                  </span>
                  <q-badge
                    v-if="element.active === false"
                    color="grey-6"
                    label="Отключена"
                  />
                </q-item-label>

                <q-item-label caption class="q-mt-xs organization-meta-line">
                  <span>{{ element.contractNumber || 'Договор не указан' }}</span>
                  <span>· {{ element.tariffName || element.servicePackageName || 'Тариф не указан' }}</span>
                  <span>· Сотрудников: {{ organizationClientsCount(element) }}</span>
                  <span v-if="element.useVisitsLimit">
                    · Выезды: {{ numberOrZero(element.visitsUsed) }} / {{ numberOrZero(element.monthlyVisitsLimit) }}
                  </span>
                  <span v-else>· Выезды не учитываются</span>
                  <span>· SLA: {{ element.slaAgreementName || 'по общим настройкам' }}</span>
                </q-item-label>

                <q-item-label caption class="organization-secondary-line">
                  {{ element.inn ? `ИНН ${element.inn}` : 'ИНН не указан' }}
                  <span v-if="element.mainAddress"> · {{ element.mainAddress }}</span>
                </q-item-label>
              </q-item-section>

              <q-item-section side>
                <q-btn
                  color="primary"
                  dense
                  flat
                  icon="edit"
                  @click="editRow(element)"
                >
                  <q-tooltip>Настроить организацию</q-tooltip>
                </q-btn>
              </q-item-section>
            </q-item>
          </template>
        </draggable>

        <q-item v-if="filteredOrganizations.length === 0">
          <q-item-section class="text-grey-7 text-center q-pa-lg">
            Организации не найдены
          </q-item-section>
        </q-item>
      </q-list>
    </div>
  </div>

  <q-dialog
    v-model="dialogVisible"
    persistent
    backdrop-filter="blur(4px)"
  >
    <q-card class="dialog-width organization-dialog">
      <q-toolbar class="justify-between organization-dialog-toolbar">
        <div class="text-h6">
          {{ isNewOrganization ? 'Новая организация' : 'Настройки организации' }}
        </div>
        <q-btn flat round dense icon="close" v-close-popup/>
      </q-toolbar>

      <q-separator/>

      <q-card-section class="q-pa-none">
        <q-tabs
          v-model="dialogTab"
          dense
          class="text-grey organization-dialog-tabs"
          active-color="primary"
          indicator-color="primary"
          align="justify"
          narrow-indicator
        >
          <q-tab name="main" label="Основное"/>
          <q-tab name="visits" label="Выезды"/>
          <q-tab name="extra" label="Дополнительно"/>
        </q-tabs>

        <q-separator/>

        <q-tab-panels
          v-model="dialogTab"
          animated
          class="organization-tab-panels"
        >
          <q-tab-panel name="main" class="organization-tab-panel q-gutter-md">
            <div class="row q-col-gutter-md items-center">
              <div class="col-12 col-md-8">
                <q-input
                  v-model="dialog.name"
                  label="Название организации *"
                  outlined
                  dense
                  :rules="[val => (val && val.length > 0) || 'Обязательное поле']"
                  ref="dialogName"
                />
              </div>
              <div class="col-12 col-md-4">
                <q-toggle
                  v-model="dialog.active"
                  label="Организация активна"
                  color="primary"
                />
              </div>
            </div>

            <q-banner rounded class="bg-grey-2 text-grey-9 organization-info-banner">
              <template #avatar>
                <q-icon name="groups" color="primary"/>
              </template>
              Сотрудники организации берутся из карточек клиентов, у которых выбрана эта организация.
              Сейчас привязано: <b>{{ organizationClientsCount(dialog) }}</b>
              {{ pluralize(organizationClientsCount(dialog), ['сотрудник', 'сотрудника', 'сотрудников']) }}.
            </q-banner>
          </q-tab-panel>

          <q-tab-panel name="visits" class="organization-tab-panel q-gutter-md">
            <q-toggle
              v-model="dialog.useVisitsLimit"
              label="Учитывать пакет выездов для этой организации"
              color="primary"
            />

            <div class="row q-col-gutter-md">
              <div class="col-12 col-md-6">
                <q-input
                  v-model.number="dialog.monthlyVisitsLimit"
                  type="number"
                  min="0"
                  label="Выездов в месяц"
                  outlined
                  dense
                  :disable="!dialog.useVisitsLimit"
                />
              </div>
              <div class="col-12 col-md-6">
                <q-input
                  v-model.number="dialog.visitsUsed"
                  type="number"
                  min="0"
                  label="Использовано в периоде"
                  outlined
                  dense
                  :disable="!dialog.useVisitsLimit"
                />
              </div>

              <div class="col-12">
                <q-input
                  v-model="dialog.visitComment"
                  type="textarea"
                  autogrow
                  label="Условия выездов"
                  outlined
                  dense
                  :disable="!dialog.useVisitsLimit"
                />
              </div>
            </div>

            <q-banner rounded class="bg-grey-2 text-grey-9 organization-info-banner">
              <template #avatar>
                <q-icon name="directions_car" color="primary"/>
              </template>
              Эти поля нужны, чтобы в карточке заявки можно было списывать выезд из пакета или помечать его как
              сверхпакетный.
            </q-banner>
          </q-tab-panel>

          <q-tab-panel name="extra" class="organization-tab-panel">
            <q-list bordered class="rounded-borders organization-extra-list">
              <q-expansion-item
                default-opened
                icon="badge"
                label="Реквизиты и адреса"
                header-class="text-weight-medium"
              >
                <div class="q-pa-md row q-col-gutter-md">
                  <div class="col-12 col-md-4">
                    <q-input v-model="dialog.inn" label="ИНН" outlined dense/>
                  </div>
                  <div class="col-12 col-md-4">
                    <q-input v-model="dialog.kpp" label="КПП" outlined dense/>
                  </div>
                  <div class="col-12 col-md-4">
                    <q-input v-model="dialog.externalId" label="Внешний ID / код клиента" outlined dense/>
                  </div>
                  <div class="col-12 col-md-8">
                    <q-input v-model="dialog.mainAddress" label="Основной адрес" outlined dense/>
                  </div>
                  <div class="col-12 col-md-4">
                    <q-select
                      v-model="dialog.priorityLevel"
                      :options="priorityLevelOptions"
                      emit-value
                      map-options
                      label="Приоритет клиента"
                      outlined
                      dense
                    />
                  </div>
                  <div class="col-12 col-md-6">
                    <q-input
                      v-model="dialog.serviceAddresses"
                      type="textarea"
                      autogrow
                      label="Адреса / объекты обслуживания"
                      hint="Каждый адрес можно писать с новой строки"
                      outlined
                      dense
                    />
                  </div>
                  <div class="col-12 col-md-6">
                    <q-input
                      v-model="dialog.communicationChannels"
                      type="textarea"
                      autogrow
                      label="Каналы связи"
                      hint="Email, телефон, Telegram, WhatsApp, портал"
                      outlined
                      dense
                    />
                  </div>
                </div>
              </q-expansion-item>

              <q-separator/>

              <q-expansion-item
                icon="support_agent"
                label="Ответственный менеджер"
                header-class="text-weight-medium"
              >
                <div class="q-pa-md row q-col-gutter-md">
                  <div class="col-12 col-md-4">
                    <q-input v-model="dialog.managerName" label="Ответственный менеджер" outlined dense/>
                  </div>
                  <div class="col-12 col-md-4">
                    <q-input v-model="dialog.managerPhone" label="Телефон менеджера" outlined dense/>
                  </div>
                  <div class="col-12 col-md-4">
                    <q-input v-model="dialog.managerEmail" label="Email менеджера" outlined dense/>
                  </div>
                </div>
              </q-expansion-item>

              <q-separator/>

              <q-expansion-item
                icon="description"
                label="Договор и тариф"
                header-class="text-weight-medium"
              >
                <div class="q-pa-md row q-col-gutter-md">
                  <div class="col-12 col-md-4">
                    <q-input v-model="dialog.contractNumber" label="Номер договора" outlined dense/>
                  </div>
                  <div class="col-12 col-md-4">
                    <q-input v-model="dialog.contractStartDate" type="date" label="Дата начала договора" outlined dense
                             stack-label/>
                  </div>
                  <div class="col-12 col-md-4">
                    <q-input v-model="dialog.contractEndDate" type="date" label="Дата окончания договора" outlined dense
                             stack-label/>
                  </div>
                  <div class="col-12 col-md-4">
                    <q-input v-model="dialog.tariffName" label="Тариф" outlined dense/>
                  </div>
                  <div class="col-12 col-md-4">
                    <q-input v-model="dialog.servicePackageName" label="Пакет обслуживания" outlined dense/>
                  </div>
                  <div class="col-12 col-md-4">
                    <q-input
                      v-model.number="dialog.monthlyFee"
                      type="number"
                      label="Абонентская плата"
                      outlined
                      dense
                      suffix="₽"
                    />
                  </div>
                  <div class="col-12">
                    <q-input
                      v-model="dialog.description"
                      type="textarea"
                      autogrow
                      label="Краткое описание договорённостей"
                      outlined
                      dense
                    />
                  </div>
                </div>
              </q-expansion-item>

              <q-separator/>

              <q-expansion-item
                icon="directions_car"
                label="Дополнительные настройки выездов"
                header-class="text-weight-medium"
              >
                <div class="q-pa-md row q-col-gutter-md">
                  <div class="col-12 col-md-4">
                    <q-input
                      v-model.number="dialog.extraVisitPrice"
                      type="number"
                      min="0"
                      label="Выезд сверх пакета"
                      suffix="₽"
                      outlined
                      dense
                      :disable="!dialog.useVisitsLimit"
                    />
                  </div>
                  <div class="col-12 col-md-4">
                    <q-input
                      v-model.number="dialog.urgentVisitPrice"
                      type="number"
                      min="0"
                      label="Срочный выезд"
                      suffix="₽"
                      outlined
                      dense
                      :disable="!dialog.useVisitsLimit"
                    />
                  </div>
                  <div class="col-12 col-md-4">
                    <q-input
                      v-model.number="dialog.visitResetDay"
                      type="number"
                      min="1"
                      max="31"
                      label="День сброса лимита"
                      outlined
                      dense
                      :disable="!dialog.useVisitsLimit"
                    />
                  </div>
                  <div class="col-12">
                    <q-toggle
                      v-model="dialog.includedRemoteSupport"
                      label="Удалённая поддержка входит в абонентскую плату"
                      color="primary"
                    />
                  </div>
                </div>
              </q-expansion-item>

              <q-separator/>

              <!--              <q-expansion-item-->
              <!--                icon="timer"-->
              <!--                label="SLA"-->
              <!--                header-class="text-weight-medium"-->
              <!--              >-->
              <!--                <div class="q-pa-md row q-col-gutter-md">-->
              <!--                  <div class="col-12 col-md-4">-->
              <!--                    <q-input v-model="dialog.slaAgreementName" label="Название SLA / регламента" outlined dense />-->
              <!--                  </div>-->
              <!--                  <div class="col-12 col-md-4">-->
              <!--                    <q-input-->
              <!--                      v-model.number="dialog.slaFirstResponseMinutes"-->
              <!--                      type="number"-->
              <!--                      min="0"-->
              <!--                      label="Первый ответ"-->
              <!--                      suffix="мин"-->
              <!--                      outlined-->
              <!--                      dense-->
              <!--                    />-->
              <!--                  </div>-->
              <!--                  <div class="col-12 col-md-4">-->
              <!--                    <q-input-->
              <!--                      v-model.number="dialog.slaResolutionHours"-->
              <!--                      type="number"-->
              <!--                      min="0"-->
              <!--                      label="Решение"-->
              <!--                      suffix="ч"-->
              <!--                      outlined-->
              <!--                      dense-->
              <!--                    />-->
              <!--                  </div>-->
              <!--                  <div class="col-12 col-md-6">-->
              <!--                    <q-select-->
              <!--                      v-model="dialog.slaWorkCalendar"-->
              <!--                      :options="slaCalendarOptions"-->
              <!--                      emit-value-->
              <!--                      map-options-->
              <!--                      label="Как считать SLA"-->
              <!--                      outlined-->
              <!--                      dense-->
              <!--                    />-->
              <!--                  </div>-->
              <!--                  <div class="col-12 col-md-6">-->
              <!--                    <q-toggle-->
              <!--                      v-model="dialog.pauseSlaOnWaitingClient"-->
              <!--                      label="Ставить SLA на паузу при ожидании клиента"-->
              <!--                      color="primary"-->
              <!--                    />-->
              <!--                  </div>-->

              <!--                  <div class="col-12">-->
              <!--                    <div class="text-subtitle2 q-mb-sm">SLA по приоритетам из настроек</div>-->
              <!--                    <q-markup-table flat bordered dense>-->
              <!--                      <thead>-->
              <!--                      <tr>-->
              <!--                        <th class="text-left">Приоритет</th>-->
              <!--                        <th class="text-left">Значение</th>-->
              <!--                        <th class="text-left">Единица</th>-->
              <!--                      </tr>-->
              <!--                      </thead>-->
              <!--                      <tbody>-->
              <!--                      <tr v-for="priority in priorities" :key="priority.id">-->
              <!--                        <td class="text-left">-->
              <!--                          {{ priority.name }}-->
              <!--                        </td>-->
              <!--                        <td class="text-left sla-value-cell">-->
              <!--                          <q-input-->
              <!--                            v-model.number="dialogPrioritySla[priority.id].value"-->
              <!--                            type="number"-->
              <!--                            min="0"-->
              <!--                            dense-->
              <!--                            outlined-->
              <!--                          />-->
              <!--                        </td>-->
              <!--                        <td class="text-left sla-unit-cell">-->
              <!--                          <q-select-->
              <!--                            v-model="dialogPrioritySla[priority.id].unit"-->
              <!--                            :options="slaUnitOptions"-->
              <!--                            emit-value-->
              <!--                            map-options-->
              <!--                            dense-->
              <!--                            outlined-->
              <!--                          />-->
              <!--                        </td>-->
              <!--                      </tr>-->
              <!--                      <tr v-if="priorities.length === 0">-->
              <!--                        <td colspan="3" class="text-center text-grey-7 q-pa-md">-->
              <!--                          Приоритеты не найдены-->
              <!--                        </td>-->
              <!--                      </tr>-->
              <!--                      </tbody>-->
              <!--                    </q-markup-table>-->
              <!--                  </div>-->

              <!--                  <div class="col-12">-->
              <!--                    <q-input-->
              <!--                      v-model="dialog.slaComment"-->
              <!--                      type="textarea"-->
              <!--                      autogrow-->
              <!--                      label="Комментарий по SLA"-->
              <!--                      outlined-->
              <!--                      dense-->
              <!--                    />-->
              <!--                  </div>-->
              <!--                </div>-->
              <!--              </q-expansion-item>-->
              <!--              <q-separator />-->

              <q-expansion-item
                icon="notes"
                label="Внутренние заметки"
                header-class="text-weight-medium"
              >
                <div class="q-pa-md">
                  <q-input
                    v-model="dialog.internalComment"
                    type="textarea"
                    autogrow
                    label="Внутренний комментарий"
                    outlined
                    dense
                  />
                </div>
              </q-expansion-item>
            </q-list>
          </q-tab-panel>
        </q-tab-panels>
      </q-card-section>

      <q-separator/>

      <q-card-actions align="right" class="organization-dialog-actions">
        <q-btn
          v-if="!isNewOrganization"
          unelevated
          no-caps
          color="negative"
          icon="delete"
          label="Удалить"
          @click="dialogDeleteOrganization"
        />
        <q-space/>
        <q-btn
          color="white"
          label="Отмена"
          text-color="primary"
          @click="dialogClose"
        />
        <q-btn
          color="primary"
          label="Сохранить"
          :loading="saving"
          @click="dialogSaveNewOrUpdateOrganization"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script>
import {useStore} from 'stores/store'
import axios from 'axios'
import draggable from 'vuedraggable'

const defaultOrganization = () => ({
  id: null,
  name: '',
  orderNumber: 0,
  active: true,
  inn: '',
  kpp: '',
  externalId: '',
  mainAddress: '',
  priorityLevel: 'NORMAL',
  managerName: '',
  managerPhone: '',
  managerEmail: '',
  contractNumber: '',
  contractStartDate: null,
  contractEndDate: null,
  tariffName: '',
  servicePackageName: '',
  monthlyFee: null,
  description: '',
  useVisitsLimit: false,
  monthlyVisitsLimit: 0,
  visitsUsed: 0,
  extraVisitPrice: null,
  urgentVisitPrice: null,
  visitResetDay: 1,
  includedRemoteSupport: true,
  visitComment: '',
  slaAgreementName: '',
  slaFirstResponseMinutes: null,
  slaResolutionHours: null,
  slaWorkCalendar: 'GENERAL_SETTINGS',
  pauseSlaOnWaitingClient: true,
  slaComment: '',
  serviceAddresses: '',
  communicationChannels: '',
  internalComment: ''
})

export default {
  name: 'OrganizationsComponent',
  components: {draggable},

  data: () => ({
    dragging: false,
    search: '',
    dialogVisible: false,
    dialogTab: 'main',
    dialog: defaultOrganization(),
    dialogOriginalName: '',
    dialogPrioritySla: {},
    slaByOrganization: {},
    isNewOrganization: true,
    saving: false,
    visitsUpdatingIds: {},
    localOrganizations: [],
    priorityLevelOptions: [
      {label: 'Обычный', value: 'NORMAL'},
      {label: 'Важный', value: 'HIGH'},
      {label: 'VIP', value: 'VIP'},
      {label: 'Проблемный', value: 'PROBLEM'}
    ],
    slaCalendarOptions: [
      {label: 'Из общих настроек', value: 'GENERAL_SETTINGS'},
      {label: 'Календарное время 24/7', value: 'CALENDAR_24_7'},
      {label: 'Только рабочее время', value: 'WORKING_HOURS'}
    ],
    slaUnitOptions: [
      {label: 'Минуты', value: 'MINUTES'},
      {label: 'Часы', value: 'HOURS'},
      {label: 'Дни', value: 'DAYS'}
    ]
  }),

  computed: {
    priorities() {
      return this.store.priorities || []
    },

    filteredOrganizations() {
      const organizations = this.localOrganizations
      const query = (this.search || '').trim().toLowerCase()
      if (!query) {
        return organizations
      }
      return organizations.filter(organization => [
        organization.name,
        organization.inn,
        organization.contractNumber,
        organization.tariffName,
        organization.servicePackageName,
        organization.mainAddress,
        organization.managerName,
        organization.managerEmail,
        organization.externalId
      ].filter(Boolean).some(value => String(value).toLowerCase().includes(query)))
    }
  },

  mounted() {
    this.syncLocalOrganizations()
    this.loadSla()
    this.loadPrioritiesIfNeeded()
  },

  watch: {
    'store.organizations': {
      deep: true,
      handler() {
        if (!this.dragging) {
          this.syncLocalOrganizations()
        }
      }
    }
  },

  methods: {
    dialogNewOrganizationShow() {
      this.isNewOrganization = true
      this.dialogVisible = true
      this.dialogTab = 'main'
      this.dialog = defaultOrganization()
      this.dialogOriginalName = ''
      this.initDialogPrioritySla(null)
      setTimeout(() => this.$refs.dialogName && this.$refs.dialogName.focus(), 250)
    },

    editRow(row) {
      this.isNewOrganization = false
      this.dialogVisible = true
      this.dialogTab = 'main'
      this.dialog = this.normalizeOrganization(row)
      this.dialogOriginalName = row.name
      this.initDialogPrioritySla(row)
    },

    dialogClose() {
      this.dialogVisible = false
      this.dialog = defaultOrganization()
      this.dialogOriginalName = ''
      this.dialogPrioritySla = {}
    },

    normalizeOrganization(organization) {
      return {
        ...defaultOrganization(),
        ...JSON.parse(JSON.stringify(organization || {})),
        active: organization?.active !== false,
        useVisitsLimit: Boolean(organization?.useVisitsLimit),
        includedRemoteSupport: organization?.includedRemoteSupport !== false,
        pauseSlaOnWaitingClient: organization?.pauseSlaOnWaitingClient !== false
      }
    },

    loadPrioritiesIfNeeded() {
      if (this.store.priorities && this.store.priorities.length > 0) {
        this.initDialogPrioritySla(this.dialog.id ? this.dialog : null)
        return
      }

      axios.get('/api/v1/priorities')
        .then(response => {
          this.store.priorities = response.data || []
          this.initDialogPrioritySla(this.dialog.id ? this.dialog : null)
        })
        .catch(() => undefined)
    },

    loadSla() {
      axios.get('/api/v1/sla')
        .then(response => {
          this.slaByOrganization = response.data || {}
          if (this.dialogVisible) {
            this.initDialogPrioritySla(this.dialog.id ? this.dialog : null)
          }
        })
        .catch(() => undefined)
    },

    initDialogPrioritySla(organization) {
      const organizationName = organization?.name || this.dialogOriginalName || this.dialog.name
      const source = organizationName ? this.slaByOrganization[organizationName] || {} : {}
      const result = {}

      this.priorities.forEach(priority => {
        const current = source[priority.name] || {}
        result[priority.id] = {
          value: current.value ?? 0,
          unit: current.unit || 'HOURS'
        }
      })

      this.dialogPrioritySla = result
    },

    dialogSaveNewOrUpdateOrganization() {
      const organization = this.normalizeOrganization(this.dialog)
      organization.id = this.isNewOrganization ? null : this.dialog.id
      organization.orderNumber = this.isNewOrganization ? 0 : this.dialog.orderNumber

      if (!organization.name || organization.name.trim().length === 0) {
        this.notifyNegative('Не заполнены обязательные поля')
        this.dialogTab = 'main'
        return
      }

      this.saving = true
      const request = this.isNewOrganization
        ? axios.post('/api/v1/organization', organization)
        : axios.patch('/api/v1/organization', organization)

      request
        .then(response => this.savePrioritySla(response.data))
        .then(savedOrganization => {
          if (this.isNewOrganization) {
            this.store.organizations.push(savedOrganization)
          } else {
            const index = this.store.organizations.findIndex(organization => organization.id === savedOrganization.id)
            if (index >= 0) {
              this.store.organizations.splice(index, 1, savedOrganization)
            }
          }
          this.store.organizations = [...this.store.organizations]
            .sort((a, b) => Number(a.orderNumber || 0) - Number(b.orderNumber || 0))
          this.syncLocalOrganizations()
          this.dialogClose()
          this.notifyPositive('Организация сохранена')
        })
        .catch(e => this.notifyNegative(e.response?.data?.message || e.response?.data || e.message))
        .finally(() => {
          this.saving = false
        })
    },

    savePrioritySla(organization) {
      if (!organization?.id || this.priorities.length === 0) {
        return Promise.resolve(organization)
      }

      const requests = this.priorities.map(priority => {
        const sla = this.dialogPrioritySla[priority.id] || {value: 0, unit: 'HOURS'}
        return axios.post('/api/v1/sla', {
          organization: {id: organization.id},
          priority: {id: priority.id},
          value: sla.value ?? 0,
          unit: sla.unit || 'HOURS'
        })
      })

      return Promise.all(requests)
        .then(() => this.loadSla())
        .then(() => organization)
    },

    dialogDeleteOrganization() {
      axios.delete(`/api/v1/organization/${this.dialog.id}`)
        .then(() => {
          this.store.organizations = this.store.organizations.filter(organization => organization.id !== this.dialog.id)
          this.dialogClose()
          this.notifyPositive('Организация удалена')
        })
        .catch(e => this.notifyNegative(e.response?.data?.message || e.response?.data || e.message))
    },

    onOrganizationDragEnd() {
      this.dragging = false
      if (this.search) {
        this.syncLocalOrganizations()
        return
      }
      const organizations = this.localOrganizations
        .filter(organization => organization.id)
        .map((organization, index) => ({
          ...organization,
          orderNumber: index
        }))
      axios.patch('/api/v1/organizations/resort', organizations)
        .then(response => {
          const savedOrganizations = response.data || organizations
          this.store.organizations = [...savedOrganizations]
            .sort((a, b) => Number(a.orderNumber || 0) - Number(b.orderNumber || 0))
          this.syncLocalOrganizations()
        })
        .catch(e => {
          this.syncLocalOrganizations()
          this.notifyNegative(e.response?.data?.message || e.response?.data || e.message)
        })
    },

    organizationClientsCount(organization) {
      if (!organization?.id || !this.store.clients) {
        return 0
      }
      return this.store.clients.filter(client => client.organization?.id === organization.id).length
    },

    numberOrZero(value) {
      const number = Number(value)
      return Number.isFinite(number) ? number : 0
    },

    visitUsagePercent(organization) {
      const limit = this.numberOrZero(organization.monthlyVisitsLimit)
      if (limit <= 0) {
        return 0
      }
      return Math.min(100, Math.round(this.numberOrZero(organization.visitsUsed) * 100 / limit))
    },

    visitsLeft(organization) {
      const left = this.numberOrZero(organization.monthlyVisitsLimit) - this.numberOrZero(organization.visitsUsed)
      if (left < 0) {
        return `+${Math.abs(left)} сверх пакета`
      }
      return `осталось ${left}`
    },

    visitProgressColor(organization) {
      const percent = this.visitUsagePercent(organization)
      if (percent >= 100) return 'negative'
      if (percent >= 80) return 'orange'
      if (percent >= 50) return 'warning'
      return 'primary'
    },

    slaUnitLabel(unit) {
      if (unit === 'MINUTES') return 'мин'
      if (unit === 'DAYS') return 'дн'
      return 'ч'
    },

    pluralize(count, words) {
      const value = Math.abs(Number(count)) % 100
      const last = value % 10
      if (value > 10 && value < 20) return words[2]
      if (last > 1 && last < 5) return words[1]
      if (last === 1) return words[0]
      return words[2]
    },

    notifyPositive(message) {
      this.$q.notify({
        message,
        type: 'positive',
        position: 'top-right',
        actions: [{icon: 'close', color: 'white', dense: true, handler: () => undefined}]
      })
    },

    notifyNegative(message) {
      this.$q.notify({
        message,
        type: 'negative',
        position: 'top-right',
        actions: [{icon: 'close', color: 'white', dense: true, handler: () => undefined}]
      })
    },

    syncLocalOrganizations() {
      this.localOrganizations = [...(this.store.organizations || [])]
        .sort((a, b) => Number(a.orderNumber || 0) - Number(b.orderNumber || 0))
    },
  },

  setup() {
    const store = useStore()
    return {store}
  }
}
</script>

<style scoped>
.organization-list {
  overflow: hidden;
}

.organization-row {
  min-height: 68px;
}

.organization-meta-line,
.organization-secondary-line {
  color: #737b89;
  line-height: 1.45;
}

.organization-secondary-line {
  margin-top: 2px;
}

.organization-name-section {
  min-width: 0;
  overflow: hidden;
}

.organization-name-section .row {
  min-width: 0;
}

.visit-progress-block {
  min-width: 140px;
}

.dialog-width {
  width: min(1120px, 96vw);
  max-width: 1120px;
}

.organization-dialog {
  max-height: 92vh;
}

.organization-dialog-toolbar {
  padding: 20px 24px;
}

.organization-dialog-tabs {
  padding: 0 24px;
}

.organization-tab-panel {
  padding: 24px 28px;
}

.organization-dialog-actions {
  padding: 18px 24px;
  gap: 12px;
}

.organization-tab-panels {
  min-height: 460px;
  max-height: 68vh;
  overflow-y: auto;
}

.organization-info-banner {
  padding: 18px 20px;
}

.organization-extra-list :deep(.q-item) {
  padding: 16px 20px;
}

.organization-extra-list :deep(.q-expansion-item__content > .q-pa-md) {
  padding: 20px 24px;
}

.organization-extra-list :deep(.q-expansion-item__content) {
  background: #fff;
}

.sla-value-cell {
  width: 180px;
}

.sla-unit-cell {
  width: 180px;
}
</style>
