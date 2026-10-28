<template>
  <q-dialog v-model="open" maximized transition-show="none" transition-hide="none">
    <q-card class="jev-log column no-wrap">
      <q-toolbar class="jev-log__toolbar">
        <div class="col">
          <div class="text-h6">Журнал решений Jev</div>
          <div class="text-caption text-grey-7">
            Все вопросы к Jev, ответы, ошибки и пропуски. Применение ответа определяется условиями графа.
            Порог здесь не отображается: один ответ может проверяться несколькими условиями.
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
          :row-key="row => JSON.stringify([row.ruleId, row.ruleName, row.nodeId, row.nodeLabel, row.action, row.question, row.questionTitle, row.answerType])"
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
              <q-td key="ruleName" :props="props">{{ props.row.ruleName || actionLabel(props.row.action) }}</q-td>
              <q-td key="nodeLabel" :props="props">{{ props.row.nodeLabel || actionLabel(props.row.action) }}</q-td>
              <q-td key="question" :props="props" class="jev-log__question">{{ props.row.questionTitle || questionLabel(props.row.question) }}</q-td>
              <q-td key="total" :props="props">{{ props.row.total }}</q-td>
              <q-td key="avgConfidence" :props="props">{{ measurement(props.row.avgConfidence, props.row.answerType) }}</q-td>
              <q-td key="answered" :props="props">{{ props.row.answered }}</q-td>
              <q-td key="failed" :props="props">{{ props.row.failed }}</q-td>
              <q-td key="skipped" :props="props">{{ props.row.skipped }}</q-td>
              <q-td key="pending" :props="props">{{ props.row.pending }}</q-td>
            </q-tr>
          </template>
        </q-table>

        <div class="row items-center q-gutter-sm q-mt-lg q-mb-sm">
          <div class="text-subtitle1">Решения</div>
          <q-space/>
          <q-chip
            v-if="filter.action || filter.question || filter.ruleId || filter.nodeId"
            removable
            dense
            color="primary"
            text-color="white"
            @remove="clearFilter"
          >
            {{ filter.label || actionLabel(filter.action) }}
          </q-chip>
          <q-select
            v-model="filter.outcome"
            :options="outcomeOptions"
            emit-value
            map-options
            clearable
            dense
            outlined
            label="Статус / результат"
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
          <template #body-cell-step="props">
            <q-td :props="props">
              <div>{{ props.row.nodeLabel || actionLabel(props.row.action) }}</div>
              <q-badge v-if="props.row.source === 'GRAPH_TRACE'" outline color="grey" label="Из трассировки"/>
            </q-td>
          </template>
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
                          <q-btn flat dense color="primary" icon-right="open_in_new" label="Открыть"
                                 @click="openObject(preview(ref).data.link)"/>
                        </q-card-actions>
                      </template>
                    </q-card>
                  </q-menu>
                </q-chip>
              </template>
              <span v-else>{{ props.row.context || '—' }}</span>
              <div v-if="props.row.eventId" class="text-caption text-grey-7">Событие #{{ props.row.eventId }}</div>
            </q-td>
          </template>
          <template #body-cell-question="props">
            <q-td :props="props" class="jev-log__question">{{ props.row.questionTitle || questionLabel(props.row.question) }}</q-td>
          </template>
          <template #body-cell-choice="props">
            <q-td :props="props" class="jev-log__question">{{ props.row.choice || '—' }}</q-td>
          </template>
          <template #body-cell-confidence="props">
            <q-td :props="props">
              <div class="row items-center no-wrap q-gutter-xs">
                <q-linear-progress
                  v-if="props.row.confidence != null && props.row.answerType !== 'score'"
                  :value="Math.max(0, Math.min(1, Number(props.row.confidence)))"
                  color="primary"
                  track-color="grey-3"
                  rounded
                  size="6px"
                  class="jev-log__bar"
                />
                <span>{{ measurement(props.row.confidence, props.row.answerType) }}</span>
              </div>
            </q-td>
          </template>
          <template #body-cell-outcome="props">
            <q-td :props="props">
              <q-badge :color="outcomeColor(props.row.outcome)" :label="outcomeLabel(props.row.outcome)"/>
              <div v-if="props.row.errorMessage" class="text-caption text-grey-7 jev-log__status-message">{{ props.row.errorMessage }}</div>
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
  analyzeOutage: 'Детектор инцидентов: разметка',
  verifyBatch: 'Детектор инцидентов: проверка пачки',
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
  ACCEPTED: { label: 'Уверенный ответ (метод)', color: 'positive' },
  REJECTED: { label: 'Ниже порога метода', color: 'negative' },
  NONE: { label: 'Ни один вариант', color: 'grey-7' },
  UNDECIDED: { label: 'Без окончательного решения', color: 'warning' },
  ANSWERED: { label: 'Ответ получен', color: 'primary' },
  FAILED: { label: 'Запрос не выполнен', color: 'negative' },
  INVALID: { label: 'Некорректный ответ', color: 'negative' },
  SKIPPED: { label: 'Пропущено', color: 'grey-7' },
  PENDING: { label: 'Ожидается ответ', color: 'warning' }
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
      filter: { action: null, question: null, outcome: null, ruleId: null, nodeId: null, label: null },
      pagination: { page: 1, rowsPerPage: 50, rowsNumber: 0 },
      periodOptions: [
        { label: 'Сутки', value: 1 },
        { label: '7 дней', value: 7 },
        { label: '30 дней', value: 30 }
      ],
      outcomeOptions: Object.entries(OUTCOMES).map(([value, item]) => ({ value, label: item.label })),
      statsColumns: [
        { name: 'ruleName', label: 'Сценарий', field: 'ruleName', align: 'left' },
        { name: 'nodeLabel', label: 'Шаг', field: 'nodeLabel', align: 'left' },
        { name: 'question', label: 'Вопрос', field: 'question', align: 'left' },
        { name: 'total', label: 'Вопросов', field: 'total', align: 'right' },
        { name: 'avgConfidence', label: 'Ср. оценка Jev', field: 'avgConfidence', align: 'right' },
        { name: 'answered', label: 'Ответ получен', field: 'answered', align: 'right' },
        { name: 'failed', label: 'Ошибок', field: 'failed', align: 'right' },
        { name: 'skipped', label: 'Пропущено', field: 'skipped', align: 'right' },
        { name: 'pending', label: 'Ожидается', field: 'pending', align: 'right' }
      ],
      decisionColumns: [
        { name: 'createdAt', label: 'Время запроса', field: 'createdAt', align: 'left', format: value => this.formatDate(value) },
        { name: 'ruleName', label: 'Сценарий', field: 'ruleName', align: 'left', format: value => value || '—' },
        { name: 'step', label: 'Шаг / действие', field: 'nodeLabel', align: 'left' },
        { name: 'context', label: 'Событие и объекты', field: 'context', align: 'left' },
        { name: 'question', label: 'Вопрос', field: 'question', align: 'left', format: (value, row) => row.questionTitle || this.questionLabel(value) },
        { name: 'choice', label: 'Ответ Jev', field: 'choice', align: 'left', format: value => value || '—' },
        { name: 'confidence', label: 'Оценка Jev', field: 'confidence', align: 'left' },
        { name: 'outcome', label: 'Статус / результат', field: 'outcome', align: 'left' }
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
    modelValue: {
      immediate: true,
      handler (value) {
        if (value) this.reloadAll()
      }
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
            outcome: this.filter.outcome || undefined,
            ruleId: this.filter.ruleId || undefined,
            nodeId: this.filter.nodeId || undefined
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
      this.filter.ruleId = row.ruleId
      this.filter.nodeId = row.nodeId
      this.filter.label = [row.ruleName, row.nodeLabel || this.actionLabel(row.action)].filter(Boolean).join(' · ')
      this.reloadDecisions(1)
    },

    clearFilter () {
      this.filter.action = null
      this.filter.question = null
      this.filter.ruleId = null
      this.filter.nodeId = null
      this.filter.label = null
      this.reloadDecisions(1)
    },

    isActiveFilter (row) {
      return this.filter.action === row.action && this.filter.question === row.question && this.filter.ruleId === row.ruleId && this.filter.nodeId === row.nodeId
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

    measurement (value, type) {
      if (value == null) return '—'
      return type === 'score' ? Number(value).toLocaleString('ru-RU', { maximumFractionDigits: 2 }) : this.percent(value)
    },

    percent (value) {
      return value == null ? '—' : `${Math.round(Number(value) * 100)}%`
    },

    formatDate (value) {
      if (!value) return ''
      const date = new Date(value)
      if (Number.isNaN(date.getTime())) return String(value)
      // Сегодня и вчера — словом вместо числа, остальное — полная дата со временем
      const dayStart = d => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
      const daysAgo = Math.round((dayStart(new Date()) - dayStart(date)) / 86400000)
      const label = daysAgo === 0 ? 'Сегодня' : daysAgo === 1 ? 'Вчера' : null
      return label
        ? `${label}, ${date.toLocaleTimeString('ru-RU')}`
        : date.toLocaleString('ru-RU')
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
  background: var(--app-neutral-tint, rgba(0, 0, 0, 0.04));
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.jev-log__preview-label {
  width: 110px;
  flex: 0 0 110px;
}

.jev-log__question {
  max-width: 360px;
  min-width: 180px;
  white-space: normal;
  overflow-wrap: anywhere;
}

.jev-log__status-message {
  max-width: 300px;
  white-space: normal;
}

.jev-log__bar {
  width: 80px;
}
</style>
