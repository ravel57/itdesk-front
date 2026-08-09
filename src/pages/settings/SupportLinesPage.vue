<template>
  <div class="q-pa-md support-lines-page">
    <div class="settings-content-header">
      <div class="settings-content-heading">
        <div class="settings-content-title">Линии технической поддержки</div>
        <div class="settings-content-description">
          Линия владеет заявкой, участники выполняют работу, наблюдатели контролируют очередь.
        </div>
      </div>
      <div class="settings-content-actions">
        <q-btn
          v-if="activeTab === 'lines'"
          unelevated
          no-caps
          color="primary"
          icon="add"
          label="Добавить линию"
          @click="openCreate"
        />
      </div>
    </div>

    <q-tabs
      v-model="activeTab"
      dense
      align="left"
      active-color="primary"
      indicator-color="primary"
      class="text-grey-7 q-mb-md"
    >
      <!--      <q-tab name="lines" icon="support_agent" label="Линии" no-caps />-->
      <!--      <q-tab name="routing" icon="alt_route" label="Маршрутизация" no-caps />-->
    </q-tabs>

    <q-tab-panels v-model="activeTab" animated class="bg-transparent">
      <q-tab-panel name="lines" class="q-pa-none">
        <q-list bordered separator class="rounded-borders support-lines-list settings-row-list">
          <draggable
            :list="store.supportLines"
            item-key="id"
            handle=".drag-handle"
            @end="saveOrder"
          >
            <template #item="{ element }">
              <q-item class="support-line-item">
                <q-item-section avatar class="drag-handle cursor-grab">
                  <q-icon name="drag_indicator" color="grey-6"/>
                </q-item-section>

                <q-item-section>
                  <q-item-label class="row items-center q-gutter-sm">
                    <span class="text-weight-medium">{{ element.name }}</span>
                    <q-badge v-if="element.defaultSelection" color="primary">По умолчанию</q-badge>
                    <q-badge v-if="element.active === false" color="grey">Отключена</q-badge>
                    <q-badge color="blue-grey-6">L{{ element.level || 1 }}</q-badge>
                  </q-item-label>

                  <q-item-label caption class="q-mt-xs">
                    <span>{{ getResponsibleLabel(element) }}</span>
                    <span class="q-mx-xs">·</span>
                    <span>Участников: {{ (element.members || []).length }}</span>
                    <span class="q-mx-xs">·</span>
                    <span>Наблюдателей: {{ (element.observers || []).length }}</span>
                    <span class="q-mx-xs">·</span>
                    <span>{{ getAssignmentStrategyLabel(element.assignmentStrategy) }}</span>
                  </q-item-label>

                  <q-item-label caption class="q-mt-xs">
                    <q-icon name="timer" size="15px" class="q-mr-xs"/>
                    {{ getOlaLabel(element) }}
                  </q-item-label>

                  <q-item-label v-if="element.description" caption class="q-mt-xs">
                    {{ element.description }}
                  </q-item-label>
                </q-item-section>

                <q-item-section side>
                  <div class="row no-wrap">
                    <q-btn
                      :text-color="element.defaultSelection ? 'primary' : 'grey'"
                      flat
                      dense
                      icon="beenhere"
                      @click.stop="setDefault(element)"
                    >
                      <q-tooltip>
                        {{ element.defaultSelection ? 'Используется по умолчанию' : 'Использовать по умолчанию' }}
                      </q-tooltip>
                    </q-btn>
                    <q-btn flat dense icon="edit" color="primary" @click.stop="openEdit(element)"/>
                  </div>
                </q-item-section>
              </q-item>
            </template>
          </draggable>
        </q-list>
      </q-tab-panel>

      <q-tab-panel name="routing" class="q-pa-none">
        <div class="row q-col-gutter-md">
          <div class="col-12 col-lg-5">
            <q-card flat bordered class="routing-card">
              <q-card-section>
                <div class="text-subtitle1 text-weight-medium">Черновик маршрутизации</div>
                <div class="text-caption text-grey-7 q-mt-xs">
                  Конструктор формирует выражение и действия для существующего экрана «Автоматизации».
                  Отдельная система маршрутов не создаётся.
                </div>
              </q-card-section>

              <q-separator/>

              <q-card-section class="q-gutter-md">
                <q-input v-model="routingForm.name" outlined dense label="Название правила"/>

                <q-select
                  v-model="routingForm.trigger"
                  :options="routingTriggerOptions"
                  outlined
                  dense
                  emit-value
                  map-options
                  label="Когда выполнять"
                />

                <div class="row q-col-gutter-sm">
                  <div class="col-12 col-sm-5">
                    <q-select
                      v-model="routingForm.conditionField"
                      :options="routingConditionFieldOptions"
                      outlined
                      dense
                      emit-value
                      map-options
                      label="Поле условия"
                    />
                  </div>
                  <div class="col-12 col-sm-3">
                    <q-select
                      v-model="routingForm.conditionOperator"
                      :options="routingOperatorOptions"
                      outlined
                      dense
                      emit-value
                      map-options
                      label="Оператор"
                    />
                  </div>
                  <div class="col-12 col-sm-4">
                    <q-input v-model="routingForm.conditionValue" outlined dense label="Значение"/>
                  </div>
                </div>

                <q-select
                  v-model="routingForm.targetLineId"
                  :options="lineOptions"
                  outlined
                  dense
                  emit-value
                  map-options
                  label="Целевая линия"
                />

                <q-select
                  v-model="routingForm.assignmentStrategy"
                  :options="routingAssignmentOptions"
                  outlined
                  dense
                  emit-value
                  map-options
                  label="После перевода"
                />

                <q-input
                  :model-value="routingPreview"
                  outlined
                  readonly
                  autogrow
                  type="textarea"
                  label="Заготовка для автоматизации"
                />
              </q-card-section>

              <q-card-actions align="right">
                <q-btn flat label="Очистить" no-caps @click="resetRoutingForm"/>
                <q-btn flat color="primary" icon="content_copy" label="Копировать" no-caps @click="copyRoutingPreview"/>
                <q-btn color="primary" icon="save" label="Сохранить черновик" no-caps @click="saveRoutingDraft"/>
              </q-card-actions>
            </q-card>
          </div>

          <div class="col-12 col-lg-7">
            <q-card flat bordered class="routing-card">
              <q-card-section class="row items-center justify-between">
                <div>
                  <div class="text-subtitle1 text-weight-medium">Черновики</div>
                  <div class="text-caption text-grey-7">
                    Черновики хранятся в браузере и служат подготовкой к созданию реальной автоматизации.
                  </div>
                </div>
                <q-btn
                  flat
                  color="primary"
                  icon="account_tree"
                  label="Открыть автоматизации"
                  no-caps
                  @click="openAutomations"
                />
              </q-card-section>

              <q-separator/>

              <q-list v-if="routingDrafts.length" separator>
                <q-item v-for="draft in routingDrafts" :key="draft.id">
                  <q-item-section>
                    <q-item-label>{{ draft.name || 'Маршрутизация без названия' }}</q-item-label>
                    <q-item-label caption>{{ draft.preview }}</q-item-label>
                  </q-item-section>
                  <q-item-section side>
                    <div class="row no-wrap">
                      <q-btn flat round dense icon="edit" @click="editRoutingDraft(draft)"/>
                      <q-btn flat round dense icon="delete" color="negative" @click="removeRoutingDraft(draft.id)"/>
                    </div>
                  </q-item-section>
                </q-item>
              </q-list>

              <q-card-section v-else class="text-center text-grey-7 q-py-xl">
                <q-icon name="alt_route" size="42px" color="grey-5"/>
                <div class="q-mt-sm">Черновиков маршрутизации пока нет</div>
              </q-card-section>
            </q-card>
          </div>
        </div>
      </q-tab-panel>
    </q-tab-panels>
  </div>

  <q-dialog v-model="dialogVisible" persistent>
    <q-card class="support-line-dialog column no-wrap">
      <q-toolbar class="support-line-dialog__toolbar">
        <q-toolbar-title>{{ isNew ? 'Новая линия' : 'Изменить линию' }}</q-toolbar-title>
        <q-btn flat round dense icon="close" @click="dialogVisible = false"/>
      </q-toolbar>

      <q-tabs
        v-model="dialogTab"
        dense
        align="left"
        active-color="primary"
        indicator-color="primary"
        class="support-line-dialog__tabs"
      >
        <q-tab name="general" label="Основное" no-caps/>
        <q-tab name="team" label="Команда" no-caps/>
        <q-tab name="distribution" label="Распределение" no-caps/>
        <q-tab name="ola" label="OLA" no-caps/>
      </q-tabs>

      <q-separator/>

      <q-tab-panels v-model="dialogTab" animated class="support-line-dialog__panels col">
        <q-tab-panel name="general" class="support-line-dialog__panel">
          <div class="support-line-dialog__content q-gutter-y-md">
            <q-input v-model="form.name" outlined label="Название *" autofocus/>
            <q-input v-model="form.description" outlined label="Описание" type="textarea" autogrow/>

            <div class="row q-col-gutter-md">
              <div class="col-12 col-sm-4">
                <q-input v-model.number="form.level" outlined label="Уровень" type="number" min="1"/>
              </div>
              <div class="col-12 col-sm-4 flex items-center">
                <q-toggle v-model="form.active" label="Активна"/>
              </div>
              <div class="col-12 col-sm-4 flex items-center">
                <q-toggle v-model="form.defaultSelection" label="По умолчанию"/>
              </div>
            </div>

            <q-select
              v-model="form.visibilityMode"
              :options="visibilityOptions"
              outlined
              emit-value
              map-options
              label="Видимость заявок линии"
            />
          </div>
        </q-tab-panel>

        <q-tab-panel name="team" class="support-line-dialog__panel">
          <div class="support-line-dialog__content q-gutter-y-md">
            <q-select
              v-model="form.responsibleUserId"
              :options="userOptions"
              outlined
              clearable
              emit-value
              map-options
              use-input
              input-debounce="0"
              label="Ответственный за линию"
              @update:model-value="syncTeamSelections"
            />

            <q-select
              v-model="form.memberIds"
              :options="userOptions"
              outlined
              label="Участники линии"
              multiple
              use-chips
              emit-value
              map-options
              use-input
              input-debounce="0"
              @update:model-value="syncTeamSelections"
            />

            <q-select
              v-model="form.observerIds"
              :options="observerOptions"
              outlined
              label="Наблюдатели"
              hint="Видят заявки и показатели линии, но не участвуют в автоматическом назначении"
              multiple
              use-chips
              emit-value
              map-options
              use-input
              input-debounce="0"
              @update:model-value="syncTeamSelections"
            />

            <q-banner rounded class="bg-grey-2 text-grey-9">
              Ответственный автоматически включается в участников линии. Наблюдатели не появляются в списке
              исполнителей.
            </q-banner>
          </div>
        </q-tab-panel>

        <q-tab-panel name="distribution" class="support-line-dialog__panel">
          <div class="support-line-dialog__content q-gutter-y-md">
            <q-select
              v-model="form.assignmentStrategy"
              :options="assignmentStrategyOptions"
              outlined
              emit-value
              map-options
              label="Стратегия назначения"
            />

            <q-toggle v-model="form.allowSelfAssignment" label="Разрешить участникам брать заявки в работу"/>
            <q-toggle v-model="form.notifyOnNewTask" label="Уведомлять команду о новой заявке без исполнителя"/>

            <q-input
              v-model.number="form.capacityPerMember"
              outlined
              type="number"
              min="0"
              label="Рекомендуемый лимит открытых заявок на участника"
              hint="0 — без ограничения. Пока используется как информационный параметр для интерфейса и аналитики."
            />
          </div>
        </q-tab-panel>

        <q-tab-panel name="ola" class="support-line-dialog__panel">
          <div class="support-line-dialog__content q-gutter-y-md">
            <div class="row items-start justify-between ola-header">
              <div>
                <div class="text-subtitle1">Внутренний срок линии</div>
                <div class="text-caption text-grey-7">
                  OLA начинается при переводе заявки на линию и не перезапускает клиентский SLA.
                </div>
              </div>
              <q-toggle v-model="form.olaEnabled" label="Использовать OLA"/>
            </div>

            <div class="row q-col-gutter-md">
              <div class="col-12 col-sm-7">
                <q-input
                  v-model.number="form.olaValue"
                  outlined
                  type="number"
                  min="0"
                  label="Срок"
                  :disable="!form.olaEnabled"
                />
              </div>
              <div class="col-12 col-sm-5">
                <q-select
                  v-model="form.olaUnit"
                  :options="olaUnitOptions"
                  outlined
                  emit-value
                  map-options
                  label="Единица"
                  :disable="!form.olaEnabled"
                />
              </div>
            </div>

            <q-input
              v-model.number="form.olaWarningPercent"
              outlined
              type="number"
              min="1"
              max="100"
              suffix="%"
              label="Предупреждать после расходования"
              :disable="!form.olaEnabled"
            />

            <q-toggle
              v-model="form.olaUseWorkingTime"
              label="Считать только рабочее время"
              :disable="!form.olaEnabled"
            />
          </div>
        </q-tab-panel>
      </q-tab-panels>

      <q-separator/>

      <q-card-actions align="right" class="support-line-dialog__actions">
        <q-btn
          v-if="!isNew"
          unelevated
          no-caps
          color="negative"
          icon="delete"
          label="Удалить"
          @click="removeLine"
        />
        <q-space/>
        <q-btn flat label="Отмена" @click="dialogVisible = false"/>
        <q-btn color="primary" label="Сохранить" :loading="saving" @click="saveLine"/>
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script>
import axios from 'axios'
import draggable from 'vuedraggable'
import {useStore} from 'stores/store'

const ROUTING_STORAGE_KEY = 'uldesk.support-line-routing-drafts'

export default {
  name: 'SupportLinesPage',
  components: {draggable},

  data: () => ({
    activeTab: 'lines',
    dialogTab: 'general',
    dialogVisible: false,
    isNew: true,
    saving: false,
    routingDrafts: [],
    form: {},
    routingForm: {},
    assignmentStrategyOptions: [
      {label: 'Оставлять без исполнителя', value: 'KEEP_UNASSIGNED'},
      {label: 'Ручное назначение', value: 'MANUAL'},
      {label: 'Наименее загруженный участник', value: 'LEAST_LOADED'},
      {label: 'По очереди (Round Robin)', value: 'ROUND_ROBIN'}
    ],
    visibilityOptions: [
      {label: 'Наследовать общую настройку', value: 'INHERIT'},
      {label: 'Все операторы', value: 'ALL_OPERATORS'},
      {label: 'Только участники', value: 'LINE_MEMBERS'},
      {label: 'Участники и наблюдатели', value: 'LINE_MEMBERS_AND_OBSERVERS'}
    ],
    olaUnitOptions: [
      {label: 'Минуты', value: 'MINUTES'},
      {label: 'Часы', value: 'HOURS'},
      {label: 'Рабочие дни', value: 'WORKING_DAYS'}
    ],
    routingTriggerOptions: [
      {label: 'При создании заявки', value: 'TASK_CREATED'},
      {label: 'При изменении типа', value: 'TASK_TYPE_CHANGED'},
      {label: 'При изменении приоритета', value: 'TASK_PRIORITY_CHANGED'},
      {label: 'При изменении линии', value: 'TASK_GROUP_CHANGED'}
    ],
    routingConditionFieldOptions: [
      {label: 'Тип заявки', value: 'type'},
      {label: 'Приоритет', value: 'priority'},
      {label: 'Текущая линия', value: 'supportLine'},
      {label: 'Тег', value: 'tag'},
      {label: 'Название содержит', value: 'name'}
    ],
    routingOperatorOptions: [
      {label: 'равно', value: 'EQUALS'},
      {label: 'не равно', value: 'NOT_EQUALS'},
      {label: 'содержит', value: 'CONTAINS'}
    ],
    routingAssignmentOptions: [
      {label: 'Только перевести на линию', value: 'GROUP_ONLY'},
      {label: 'Назначить наименее загруженного', value: 'LEAST_LOADED'}
    ]
  }),

  computed: {
    userOptions() {
      return (this.store.users || [])
        .filter(user => user?.id && this.isTeamUser(user))
        .map(user => ({value: user.id, label: this.userName(user)}))
        .sort((a, b) => a.label.localeCompare(b.label, 'ru'))
    },

    observerOptions() {
      const teamMemberIds = new Set((this.form.memberIds || []).map(id => Number(id)))
      if (this.form.responsibleUserId != null) {
        teamMemberIds.add(Number(this.form.responsibleUserId))
      }

      return (this.store.users || [])
        .filter(user => user?.id && this.isTeamUser(user))
        .filter(user => !teamMemberIds.has(Number(user.id)))
        .map(user => ({value: user.id, label: this.userName(user)}))
        .sort((a, b) => a.label.localeCompare(b.label, 'ru'))
    },

    lineOptions() {
      return (this.store.supportLines || [])
        .filter(line => line?.id && line.active !== false)
        .map(line => ({value: line.id, label: line.name}))
    },

    routingPreview() {
      const condition = this.buildRoutingCondition()
      const lineId = Number(this.routingForm.targetLineId)
      const actions = []

      if (Number.isFinite(lineId)) {
        actions.push(`task.assignToGroup(${lineId})`)
        if (this.routingForm.assignmentStrategy === 'LEAST_LOADED') {
          actions.push(`task.assignToLeastLoadedMember(${lineId})`)
        }
      }

      return [
        `Событие: ${this.routingForm.trigger || 'TASK_CREATED'}`,
        `Условие: ${condition || 'true'}`,
        `Действия: ${actions.length ? actions.join('; ') : 'выберите целевую линию'}`
      ].join('\n')
    }
  },

  created() {
    this.form = this.createEmptyLineForm()
    this.routingForm = this.createEmptyRoutingForm()
    this.loadRoutingDrafts()
  },

  methods: {
    createEmptyLineForm() {
      return {
        id: null,
        name: '',
        description: '',
        level: 1,
        active: true,
        defaultSelection: false,
        responsibleUserId: null,
        memberIds: [],
        observerIds: [],
        assignmentStrategy: 'KEEP_UNASSIGNED',
        visibilityMode: 'INHERIT',
        allowSelfAssignment: true,
        notifyOnNewTask: true,
        capacityPerMember: 0,
        olaEnabled: false,
        olaValue: 4,
        olaUnit: 'HOURS',
        olaWarningPercent: 80,
        olaUseWorkingTime: true,
        orderNumber: 0
      }
    },

    createEmptyRoutingForm() {
      return {
        id: null,
        name: '',
        trigger: 'TASK_CREATED',
        conditionField: 'type',
        conditionOperator: 'EQUALS',
        conditionValue: '',
        targetLineId: null,
        assignmentStrategy: 'GROUP_ONLY'
      }
    },

    normalizeUserRole(role) {
      return String(role || '')
        .trim()
        .toUpperCase()
        .replace(/^ROLE_/, '')
    },

    isTeamUser(user) {
      if (!user || user.enabled === false || user.isEnabled === false || user.active === false) {
        return false
      }
      const authorities = Array.isArray(user.authorities) ? user.authorities : []
      const roles = Array.isArray(user.roles) ? user.roles : (user.roles ? [user.roles] : [])
      const allowedRoles = new Set(['ADMIN', 'MANAGER', 'OPERATOR'])
      return [...authorities, ...roles]
        .map(role => this.normalizeUserRole(role))
        .some(role => allowedRoles.has(role))
    },

    syncTeamSelections() {
      const memberIds = new Set((this.form.memberIds || []).map(id => Number(id)))
      if (this.form.responsibleUserId != null) {
        memberIds.add(Number(this.form.responsibleUserId))
      }
      this.form.observerIds = (this.form.observerIds || [])
        .filter(id => !memberIds.has(Number(id)))
    },

    sanitizeLineUserIds(users) {
      return (users || [])
        .filter(user => user?.id && this.isTeamUser(user))
        .map(user => Number(user.id))
        .filter(id => Number.isFinite(id))
    },

    userName(user) {
      const fullName = `${user?.firstname || ''} ${user?.lastname || ''}`.trim()
      return fullName || user?.username || user?.email || `Пользователь ${user?.id}`
    },

    getResponsibleLabel(line) {
      return line?.responsible
        ? `Ответственный: ${this.userName(line.responsible)}`
        : 'Ответственный не назначен'
    },

    getAssignmentStrategyLabel(value) {
      return this.assignmentStrategyOptions.find(option => option.value === value)?.label || 'Распределение не настроено'
    },

    getOlaLabel(line) {
      if (!line?.olaEnabled) {
        return 'OLA отключён'
      }
      const unit = this.olaUnitOptions.find(option => option.value === line.olaUnit)?.label || line.olaUnit
      return `OLA: ${line.olaValue || 0} ${String(unit || '').toLowerCase()}, предупреждение ${line.olaWarningPercent || 80}%`
    },

    openCreate() {
      this.isNew = true
      this.dialogTab = 'general'
      this.form = {
        ...this.createEmptyLineForm(),
        defaultSelection: this.store.supportLines.length === 0,
        orderNumber: this.store.supportLines.length
      }
      this.dialogVisible = true
    },

    openEdit(line) {
      this.isNew = false
      this.dialogTab = 'general'
      const responsibleUserId = this.isTeamUser(line.responsible) ? line.responsible.id : null
      const memberIds = this.sanitizeLineUserIds(line.members)
      const occupiedIds = new Set(memberIds.map(id => Number(id)))
      if (responsibleUserId != null) occupiedIds.add(Number(responsibleUserId))
      const observerIds = this.sanitizeLineUserIds(line.observers)
        .filter(id => !occupiedIds.has(Number(id)))

      this.form = {
        ...this.createEmptyLineForm(),
        id: line.id,
        name: line.name || '',
        description: line.description || '',
        level: Number(line.level || 1),
        active: line.active !== false,
        defaultSelection: line.defaultSelection === true,
        responsibleUserId,
        memberIds,
        observerIds,
        assignmentStrategy: line.assignmentStrategy || 'KEEP_UNASSIGNED',
        visibilityMode: line.visibilityMode || 'INHERIT',
        allowSelfAssignment: line.allowSelfAssignment !== false,
        notifyOnNewTask: line.notifyOnNewTask !== false,
        capacityPerMember: Number(line.capacityPerMember || 0),
        olaEnabled: line.olaEnabled === true,
        olaValue: Number(line.olaValue || 4),
        olaUnit: line.olaUnit || 'HOURS',
        olaWarningPercent: Number(line.olaWarningPercent || 80),
        olaUseWorkingTime: line.olaUseWorkingTime !== false,
        orderNumber: line.orderNumber || 0
      }
      this.dialogVisible = true
    },

    buildPayload() {
      const memberIds = new Set(this.form.memberIds || [])
      if (this.form.responsibleUserId) {
        memberIds.add(this.form.responsibleUserId)
      }
      const observerIds = (this.form.observerIds || []).filter(id => !memberIds.has(id))

      return {
        id: this.form.id,
        name: this.form.name.trim(),
        description: this.form.description,
        level: Number(this.form.level || 1),
        active: this.form.active,
        defaultSelection: this.form.defaultSelection,
        orderNumber: this.form.orderNumber,
        responsible: this.form.responsibleUserId ? {id: this.form.responsibleUserId} : null,
        members: Array.from(memberIds).map(id => ({id})),
        observers: observerIds.map(id => ({id})),
        assignmentStrategy: this.form.assignmentStrategy,
        visibilityMode: this.form.visibilityMode,
        allowSelfAssignment: this.form.allowSelfAssignment,
        notifyOnNewTask: this.form.notifyOnNewTask,
        capacityPerMember: Math.max(0, Number(this.form.capacityPerMember || 0)),
        olaEnabled: this.form.olaEnabled,
        olaValue: this.form.olaEnabled ? Math.max(0, Number(this.form.olaValue || 0)) : null,
        olaUnit: this.form.olaUnit,
        olaWarningPercent: Math.min(100, Math.max(1, Number(this.form.olaWarningPercent || 80))),
        olaUseWorkingTime: this.form.olaUseWorkingTime
      }
    },

    saveLine() {
      if (!this.form.name.trim()) {
        this.$q.notify({
          type: 'negative',
          message: 'Укажите название линии',
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
      if (this.form.olaEnabled && Number(this.form.olaValue || 0) <= 0) {
        this.$q.notify({
          type: 'negative',
          message: 'Укажите положительный срок OLA',
          position: 'top-right',
          actions: [{
            icon: 'close',
            color: 'white',
            dense: true,
            handler: () => undefined
          }]
        })
        this.dialogTab = 'ola'
        return
      }

      this.saving = true
      const request = this.isNew
        ? axios.post('/api/v1/support-line', this.buildPayload())
        : axios.patch('/api/v1/support-line', this.buildPayload())

      request
        .then(({data}) => {
          const index = this.store.supportLines.findIndex(line => line.id === data.id)
          if (index === -1) this.store.supportLines.push(data)
          else this.store.supportLines.splice(index, 1, data)
          if (data.defaultSelection) {
            this.store.supportLines = this.store.supportLines.map(line => ({
              ...line,
              defaultSelection: line.id === data.id
            }))
          }
          this.dialogVisible = false
        })
        .catch(error => this.showError(error))
        .finally(() => {
          this.saving = false
        })
    },

    removeLine() {
      axios.delete(`/api/v1/support-line/${this.form.id}`)
        .then(() => {
          this.store.supportLines = this.store.supportLines.filter(line => line.id !== this.form.id)
          this.dialogVisible = false
        })
        .catch(error => this.showError(error))
    },

    setDefault(line) {
      axios.patch('/api/v1/support-line/set-default', line)
        .then(({data}) => {
          this.store.supportLines = this.store.supportLines.map(item => ({
            ...item,
            defaultSelection: item.id === data.id
          }))
        })
        .catch(error => this.showError(error))
    },

    saveOrder() {
      this.store.supportLines = this.store.supportLines.map((line, index) => ({...line, orderNumber: index}))
      axios.patch('/api/v1/support-lines/resort', this.store.supportLines)
        .then(({data}) => {
          this.store.supportLines = data
        })
        .catch(error => this.showError(error))
    },

    buildRoutingCondition() {
      const value = String(this.routingForm.conditionValue || '').trim().replaceAll("'", "\\'")
      if (!value) {
        return ''
      }

      const fieldExpressions = {
        type: 'task.type.type',
        priority: 'task.priority.name',
        supportLine: 'task.supportLine.name'
      }

      if (this.routingForm.conditionField === 'tag') {
        return this.routingForm.conditionOperator === 'NOT_EQUALS'
          ? `!task.hasTag('${value}')`
          : `task.hasTag('${value}')`
      }
      if (this.routingForm.conditionField === 'name') {
        return this.routingForm.conditionOperator === 'NOT_EQUALS'
          ? `!task.nameContains('${value}')`
          : `task.nameContains('${value}')`
      }

      const expression = fieldExpressions[this.routingForm.conditionField] || 'task.name'
      if (this.routingForm.conditionOperator === 'NOT_EQUALS') {
        return `${expression} !== '${value}'`
      }
      if (this.routingForm.conditionOperator === 'CONTAINS') {
        return `${expression}.toLowerCase().includes('${value.toLowerCase()}')`
      }
      return `${expression} === '${value}'`
    },

    resetRoutingForm() {
      this.routingForm = this.createEmptyRoutingForm()
    },

    saveRoutingDraft() {
      const draft = {
        ...this.routingForm,
        id: this.routingForm.id || `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        preview: this.routingPreview
      }
      const index = this.routingDrafts.findIndex(item => item.id === draft.id)
      if (index === -1) this.routingDrafts.push(draft)
      else this.routingDrafts.splice(index, 1, draft)
      this.persistRoutingDrafts()
      this.resetRoutingForm()
      this.$q.notify({
        type: 'positive',
        message: 'Черновик маршрутизации сохранён',
        position: 'top-right',
        actions: [{
          icon: 'close',
          color: 'white',
          dense: true,
          handler: () => undefined
        }]
      })
    },

    editRoutingDraft(draft) {
      this.routingForm = {...draft}
    },

    removeRoutingDraft(id) {
      this.routingDrafts = this.routingDrafts.filter(item => item.id !== id)
      this.persistRoutingDrafts()
    },

    loadRoutingDrafts() {
      try {
        const value = JSON.parse(localStorage.getItem(ROUTING_STORAGE_KEY) || '[]')
        this.routingDrafts = Array.isArray(value) ? value : []
      } catch (e) {
        this.routingDrafts = []
      }
    },

    persistRoutingDrafts() {
      localStorage.setItem(ROUTING_STORAGE_KEY, JSON.stringify(this.routingDrafts))
    },

    async copyRoutingPreview() {
      try {
        await navigator.clipboard.writeText(this.routingPreview)
        this.$q.notify({
          type: 'positive',
          message: 'Заготовка скопирована',
          position: 'top-right',
          actions: [{
            icon: 'close',
            color: 'white',
            dense: true,
            handler: () => undefined
          }]
        })
      } catch (e) {
        this.$q.notify({
          type: 'negative',
          message: 'Не удалось скопировать заготовку',
          position: 'top-right',
          actions: [{
            icon: 'close',
            color: 'white',
            dense: true,
            handler: () => undefined
          }]
        })
      }
    },

    openAutomations() {
      this.$router.push({path: '/settings/automatization', query: {source: 'support-lines'}})
    },

    showError(error) {
      this.$q.notify({
        type: 'negative',
        message: error?.response?.data?.message || error?.message || 'Ошибка сохранения',
        position: 'top-right',
        actions: [{
          icon: 'close',
          color: 'white',
          dense: true,
          handler: () => undefined
        }]
      })
    }
  },

  mounted() {
    if (!this.store.supportLines.length) {
      axios.get('/api/v1/support-lines').then(({data}) => {
        this.store.supportLines = data || []
      })
    }
  },

  setup() {
    return {store: useStore()}
  }
}
</script>

<style scoped>
.support-lines-page {
  width: 100%;
  max-width: none;
}

.cursor-grab {
  cursor: grab;
}

.support-lines-list,
.routing-card {
  border-radius: 14px;
  overflow: hidden;
  background: #ffffff;
}

.support-line-item {
  min-height: 68px;
}

.support-line-dialog {
  width: 780px;
  max-width: 96vw;
  height: 560px;
  max-height: 92vh;
  overflow: hidden;
}

.support-line-dialog__toolbar {
  min-height: 52px;
  padding: 0 16px;
}

.support-line-dialog__tabs {
  flex: 0 0 auto;
  padding: 0 4px;
}

.support-line-dialog__panels {
  min-height: 0;
  overflow: hidden;
  background: #ffffff;
}

.support-line-dialog__panel {
  height: 100%;
  min-height: 0;
  padding: 0;
  overflow-y: auto;
}

.support-line-dialog__content {
  padding: 24px;
}

.support-line-dialog__actions {
  flex: 0 0 auto;
  min-height: 58px;
  padding: 10px 8px 10px 16px;
}

.ola-header {
  gap: 16px;
}

.ola-header > div:first-child {
  min-width: 0;
  flex: 1 1 auto;
}

@media (max-width: 599px) {
  .support-line-dialog {
    width: 100vw;
    max-width: 100vw;
    height: 100vh;
    max-height: 100vh;
    border-radius: 0;
  }

  .support-line-dialog__content {
    padding: 16px;
  }

  .ola-header {
    align-items: flex-start;
  }
}
</style>
