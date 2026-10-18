<template>
  <q-dialog v-model="open" maximized transition-show="none" transition-hide="none">
    <q-card class="jev-log column no-wrap">
      <q-toolbar class="jev-log__toolbar">
        <div class="col">
          <div class="text-h6">Журнал решений Jev</div>
          <div class="text-caption text-grey-7">
            Уверенность Jev по каждому вопросу каждой автоматизации. Решения ниже порога не применяются.
            Много решений «у порога» — повод подвинуть порог в настройках.
          </div>
        </div>
        <q-select
          v-model="days"
          :options="periodOptions"
          emit-value
          map-options
          dense
          outlined
          class="jev-log__period"
          label="Период"
          @update:model-value="reloadAll"
        />
        <q-btn flat round dense icon="refresh" :loading="loading" @click="reloadAll">
          <q-tooltip>Обновить</q-tooltip>
        </q-btn>
        <q-btn flat round dense icon="close" v-close-popup aria-label="Закрыть"/>
      </q-toolbar>

      <q-separator/>

      <div class="jev-log__body col">
        <div class="text-subtitle1 q-mb-sm">Сводка по автоматизациям</div>
        <q-table
          flat
          bordered
          dense
          :rows="stats"
          :columns="statsColumns"
          :row-key="row => `${row.action}|${row.question}`"
          :pagination="{ rowsPerPage: 0 }"
          hide-bottom
          no-data-label="За период решений нет"
          class="jev-log__stats"
        >
          <template #body="props">
            <q-tr
              :props="props"
              class="cursor-pointer"
              :class="{ 'jev-log__row--active': isActiveFilter(props.row) }"
              @click="toggleFilter(props.row)"
            >
              <q-td key="action" :props="props">{{ actionLabel(props.row.action) }}</q-td>
              <q-td key="question" :props="props">{{ questionLabel(props.row.question) }}</q-td>
              <q-td key="total" :props="props">{{ props.row.total }}</q-td>
              <q-td key="avgConfidence" :props="props">{{ percent(props.row.avgConfidence) }}</q-td>
              <q-td key="threshold" :props="props">{{ props.row.threshold == null ? '—' : percent(props.row.threshold) }}</q-td>
              <q-td key="accepted" :props="props">{{ share(props.row.accepted, props.row.total) }}</q-td>
              <q-td key="rejected" :props="props">{{ props.row.rejected }}</q-td>
              <q-td key="none" :props="props">{{ props.row.none }}</q-td>
              <q-td key="nearThreshold" :props="props">
                <span :class="props.row.nearThreshold > 0 ? 'text-warning text-weight-medium' : ''">
                  {{ props.row.nearThreshold }}
                </span>
              </q-td>
            </q-tr>
          </template>
        </q-table>

        <div class="row items-center q-gutter-sm q-mt-lg q-mb-sm">
          <div class="text-subtitle1">Решения</div>
          <q-space/>
          <q-chip
            v-if="filter.action"
            removable
            dense
            color="primary"
            text-color="white"
            @remove="clearFilter"
          >
            {{ actionLabel(filter.action) }} · {{ questionLabel(filter.question) }}
          </q-chip>
          <q-select
            v-model="filter.outcome"
            :options="outcomeOptions"
            emit-value
            map-options
            clearable
            dense
            outlined
            label="Итог"
            class="jev-log__outcome"
            @update:model-value="reloadDecisions(1)"
          />
        </div>

        <q-table
          flat
          bordered
          dense
          :rows="decisions"
          :columns="decisionColumns"
          row-key="id"
          :loading="loading"
          v-model:pagination="pagination"
          :rows-per-page-options="[25, 50, 100]"
          no-data-label="Решений нет"
          @request="onRequest"
        >
          <template #body-cell-context="props">
            <q-td :props="props" class="jev-log__objects">
              <template v-if="references(props.row.context).length">
                <q-chip
                  v-for="ref in references(props.row.context)"
                  :key="ref.key"
                  dense
                  clickable
                  :icon="objectType(ref.type).icon"
                  class="jev-log__object"
                >
                  <span class="ellipsis">{{ objectLabels[ref.key] || `${objectType(ref.type).label} #${ref.id}` }}</span>
                  <q-menu anchor="bottom left" self="top left" @before-show="loadPreview(ref, props.row.context)">
                    <q-card class="jev-log__preview">
                      <q-card-section v-if="preview(ref).loading" class="row justify-center">
                        <q-spinner color="primary" size="24px"/>
                      </q-card-section>
                      <q-card-section v-else-if="preview(ref).error" class="text-negative">
                        {{ preview(ref).error }}
                      </q-card-section>
                      <template v-else-if="preview(ref).data">
                        <q-card-section class="q-pb-sm">
                          <div class="text-caption text-grey-7">{{ objectType(ref.type).label }} #{{ ref.id }}</div>
                          <div class="text-subtitle2">{{ preview(ref).data.title }}</div>
                        </q-card-section>
                        <q-card-section v-if="preview(ref).data.text" class="q-py-none">
                          <div class="jev-log__preview-text">{{ preview(ref).data.text }}</div>
                        </q-card-section>
                        <q-card-section v-if="preview(ref).data.fields?.length" class="q-pt-sm q-pb-none">
                          <div v-for="field in preview(ref).data.fields" :key="field.label" class="row no-wrap q-mb-xs">
                            <div class="jev-log__preview-label text-grey-7">{{ field.label }}</div>
                            <div class="col">{{ field.value }}</div>
                          </div>
                        </q-card-section>
                        <q-card-actions v-if="preview(ref).data.link" align="right">
                          <q-btn flat dense no-caps color="primary" icon-right="open_in_new" label="Открыть"
                                 @click="openObject(preview(ref).data.link)"/>
                        </q-card-actions>
                      </template>
                    </q-card>
                  </q-menu>
                </q-chip>
              </template>
              <span v-else>{{ props.row.context || '—' }}</span>
            </q-td>
          </template>
          <template #body-cell-confidence="props">
            <q-td :props="props">
              <div class="row items-center no-wrap q-gutter-xs">
                <q-linear-progress
                  :value="Number(props.row.confidence) || 0"
                  :color="confidenceColor(props.row)"
                  track-color="grey-3"
                  rounded
                  size="6px"
                  class="jev-log__bar"
                />
                <span>{{ percent(props.row.confidence) }}</span>
              </div>
            </q-td>
          </template>
          <template #body-cell-outcome="props">
            <q-td :props="props">
              <q-badge :color="outcomeColor(props.row.outcome)" :label="outcomeLabel(props.row.outcome)"/>
            </q-td>
          </template>
        </q-table>
      </div>
    </q-card>
  </q-dialog>
</template>

<script>
import axios from 'axios'

const API = '/api/v1/settings/jev/decisions'

const ACTION_LABELS = {
  createTaskIfNeeded: 'Создание заявки',
  suggestKnowledgeArticle: 'Статья базы знаний',
  checkIncidentRecovery: 'Восстановление после инцидента',
  selectSupportLine: 'Выбор линии',
  escalateIfNeeded: 'Эскалация',
  findDuplicate: 'Дубли заявок',
  classifyTask: 'Классификация заявки',
  setPriority: 'Приоритет',
  setAnswerRequiredIfNeeded: 'Нужен ответ',
  detectIncident: 'Детектор инцидентов'
}

const QUESTION_LABELS = {
  kind: 'Тип сообщения',
  open_match: 'Совпадение с открытой заявкой',
  open_task_match: 'Совпадение с открытой заявкой',
  service_problem: 'Проблема по сервису',
  svc_other: 'Проблема вне каталога',
  related_task: 'Повтор закрытой заявки',
  article: 'Статья',
  recovery: 'Состояние после восстановления',
  support_line: 'Линия',
  needs_escalation: 'Нужна эскалация',
  target_line: 'Линия для эскалации',
  duplicate_of: 'Дубль заявки',
  task_type: 'Тип заявки',
  service: 'Сервис',
  priority: 'Приоритет',
  needs_reply: 'Нужен ответ',
  is_outage: 'Это сбой',
  symptom: 'Симптом',
  active_incident: 'Открытый инцидент',
  same_problem: 'Одна проблема в пачке',
  probable_cause: 'Вероятная причина'
}

const OBJECT_TYPES = {
  client: { label: 'Клиент', icon: 'person' },
  message: { label: 'Сообщение', icon: 'chat' },
  task: { label: 'Заявка', icon: 'assignment' },
  incident: { label: 'Инцидент', icon: 'crisis_alert' },
  service: { label: 'Сервис', icon: 'dns' }
}

// Совпадает с JevDecisionObjectService.REFERENCE на бэке
const REFERENCE = /\b(client|message|task|incident|service)=(\d+)/g

const OUTCOMES = {
  ACCEPTED: { label: 'Принято', color: 'positive' },
  REJECTED: { label: 'Ниже порога', color: 'negative' },
  NONE: { label: 'Ни один вариант', color: 'grey-7' },
  UNDECIDED: { label: 'Между порогами', color: 'warning' }
}

export default {
  name: 'JevDecisionLog',

  props: {
    modelValue: { type: Boolean, default: false }
  },

  emits: ['update:modelValue'],

  data () {
    return {
      loading: false,
      days: 7,
      stats: [],
      decisions: [],
      objectLabels: {},
      previews: {},
      filter: { action: null, question: null, outcome: null },
      pagination: { page: 1, rowsPerPage: 50, rowsNumber: 0 },
      periodOptions: [
        { label: 'Сутки', value: 1 },
        { label: '7 дней', value: 7 },
        { label: '30 дней', value: 30 }
      ],
      outcomeOptions: Object.entries(OUTCOMES).map(([value, item]) => ({ value, label: item.label })),
      statsColumns: [
        { name: 'action', label: 'Автоматизация', field: 'action', align: 'left' },
        { name: 'question', label: 'Вопрос', field: 'question', align: 'left' },
        { name: 'total', label: 'Решений', field: 'total', align: 'right' },
        { name: 'avgConfidence', label: 'Ср. уверенность', field: 'avgConfidence', align: 'right' },
        { name: 'threshold', label: 'Порог', field: 'threshold', align: 'right' },
        { name: 'accepted', label: 'Принято', field: 'accepted', align: 'right' },
        { name: 'rejected', label: 'Ниже порога', field: 'rejected', align: 'right' },
        { name: 'none', label: 'Ни один', field: 'none', align: 'right' },
        { name: 'nearThreshold', label: 'У порога (±10%)', field: 'nearThreshold', align: 'right' }
      ],
      decisionColumns: [
        { name: 'createdAt', label: 'Время', field: 'createdAt', align: 'left', format: value => this.formatDate(value) },
        { name: 'ruleName', label: 'Правило', field: 'ruleName', align: 'left', format: value => value || '—' },
        { name: 'action', label: 'Автоматизация', field: 'action', align: 'left', format: value => this.actionLabel(value) },
        { name: 'context', label: 'Объект', field: 'context', align: 'left' },
        { name: 'question', label: 'Вопрос', field: 'question', align: 'left', format: value => this.questionLabel(value) },
        { name: 'choice', label: 'Выбор Jev', field: 'choice', align: 'left' },
        { name: 'confidence', label: 'Уверенность', field: 'confidence', align: 'left' },
        { name: 'threshold', label: 'Порог', field: 'threshold', align: 'right', format: value => value == null ? '—' : this.percent(value) },
        { name: 'outcome', label: 'Итог', field: 'outcome', align: 'left' }
      ]
    }
  },

  computed: {
    open: {
      get () {
        return this.modelValue
      },
      set (value) {
        this.$emit('update:modelValue', value)
      }
    }
  },

  watch: {
    modelValue (value) {
      if (value) this.reloadAll()
    }
  },

  methods: {
    async reloadAll () {
      await Promise.all([this.loadStats(), this.reloadDecisions(1)])
    },

    async loadStats () {
      try {
        const { data } = await axios.get(`${API}/stats`, { params: { days: this.days } })
        this.stats = Array.isArray(data) ? data : []
      } catch (e) {
        this.stats = []
        this.notifyError(e)
      }
    },

    async reloadDecisions (page = this.pagination.page) {
      this.loading = true
      try {
        const { data } = await axios.get(API, {
          params: {
            page,
            size: this.pagination.rowsPerPage,
            days: this.days,
            action: this.filter.action || undefined,
            question: this.filter.question || undefined,
            outcome: this.filter.outcome || undefined
          }
        })
        this.decisions = data?.decisions || []
        this.objectLabels = data?.objectLabels || {}
        this.pagination = { ...this.pagination, page, rowsNumber: Number(data?.totalElements) || 0 }
      } catch (e) {
        this.decisions = []
        this.notifyError(e)
      } finally {
        this.loading = false
      }
    },

    onRequest ({ pagination }) {
      this.pagination.rowsPerPage = pagination.rowsPerPage
      this.reloadDecisions(pagination.page)
    },

    toggleFilter (row) {
      if (this.isActiveFilter(row)) {
        this.clearFilter()
        return
      }
      this.filter.action = row.action
      this.filter.question = row.question
      this.reloadDecisions(1)
    },

    clearFilter () {
      this.filter.action = null
      this.filter.question = null
      this.reloadDecisions(1)
    },

    isActiveFilter (row) {
      return this.filter.action === row.action && this.filter.question === row.question
    },

    references (context) {
      return [...String(context || '').matchAll(REFERENCE)]
        .map(([, type, id]) => ({ type, id: Number(id), key: `${type}:${id}` }))
    },

    objectType (type) {
      return OBJECT_TYPES[type] || { label: type, icon: 'help_outline' }
    },

    preview (ref) {
      return this.previews[ref.key] || {}
    },

    async loadPreview (ref, context) {
      if (this.previews[ref.key]?.data || this.previews[ref.key]?.loading) return
      this.previews[ref.key] = { loading: true }
      const client = this.references(context).find(item => item.type === 'client')
      try {
        const { data } = await axios.get(`${API}/object`, {
          params: { type: ref.type, id: ref.id, clientId: client?.id }
        })
        this.previews[ref.key] = { data }
      } catch (e) {
        this.previews[ref.key] = { error: e?.response?.data?.message || 'Не удалось загрузить объект' }
      }
    },

    openObject (link) {
      this.open = false
      this.$router.push(link)
    },

    actionLabel (action) {
      return ACTION_LABELS[action] || action || '—'
    },

    questionLabel (question) {
      return QUESTION_LABELS[question] || question || '—'
    },

    outcomeLabel (outcome) {
      return OUTCOMES[outcome]?.label || outcome
    },

    outcomeColor (outcome) {
      return OUTCOMES[outcome]?.color || 'grey'
    },

    confidenceColor (row) {
      if (row.threshold == null) return 'primary'
      return Number(row.confidence) >= Number(row.threshold) ? 'positive' : 'negative'
    },

    percent (value) {
      return value == null ? '—' : `${Math.round(Number(value) * 100)}%`
    },

    share (part, total) {
      const count = Number(part) || 0
      const all = Number(total) || 0
      return all ? `${count} (${Math.round(count * 100 / all)}%)` : '0'
    },

    formatDate (value) {
      if (!value) return ''
      const date = new Date(value)
      return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString('ru-RU')
    },

    notifyError (error) {
      const data = error?.response?.data
      this.$q.notify({
        type: 'negative',
        message: typeof data === 'string' && data ? data : 'Не удалось загрузить журнал решений Jev'
      })
    }
  }
}
</script>

<style scoped>
.jev-log {
  width: 100%;
  height: 100%;
}

.jev-log__toolbar {
  gap: 12px;
  padding: 12px 16px;
}

.jev-log__period {
  width: 140px;
}

.jev-log__outcome {
  width: 200px;
}

.jev-log__body {
  overflow: auto;
  padding: 16px;
}

.jev-log__row--active {
  background: rgba(98, 0, 234, 0.08);
}

.jev-log__objects {
  white-space: normal;
}

.jev-log__object {
  max-width: 260px;
}

.jev-log__preview {
  width: 380px;
  max-width: 90vw;
}

.jev-log__preview-text {
  max-height: 180px;
  overflow-y: auto;
  padding: 8px 10px;
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.04);
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.jev-log__preview-label {
  width: 110px;
  flex: 0 0 110px;
}

.jev-log__bar {
  width: 80px;
}
</style>
