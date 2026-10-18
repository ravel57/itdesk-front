<template>
  <div class="jev-settings q-pa-md">
    <div class="settings-content-header">
      <div class="settings-content-heading">
        <div class="settings-content-title">Jev (ИИ-решения)</div>
        <div class="settings-content-description">
          Модель TypeSafe Jev принимает решения в автоматизациях: классифицирует заявки, заводит новые,
          подбирает статьи и линии, ищет дубли и массовые сбои. Используется в правилах через действия
          <code>jev.*()</code>, например <code>jev.classifyTask()</code> или <code>jev.createTaskIfNeeded()</code>.
        </div>
      </div>

      <div class="settings-content-actions">
        <q-btn
          outline
          no-caps
          color="primary"
          icon="query_stats"
          label="Журнал решений"
          @click="decisionLogOpen = true"
        >
          <q-tooltip>Уверенность Jev по каждой автоматизации — для настройки порогов</q-tooltip>
        </q-btn>
      </div>
    </div>

    <jev-decision-log v-model="decisionLogOpen"/>

    <q-inner-loading :showing="loading"/>

    <div class="jev-settings__sections column q-gutter-md">
      <q-card flat bordered class="settings-card">
        <q-card-section class="settings-block">
          <div class="text-subtitle1">Пороги уверенности</div>
          <div class="text-caption text-grey-7">
            Jev возвращает уверенность каждого ответа. Решение автоматизации применяется, только если уверенность
            не ниже её порога, иначе ничего не меняется. Выше порог — меньше ошибочных срабатываний, но и меньше
            срабатываний вообще. Подобрать значения помогает «Журнал решений».
          </div>
          <div class="text-caption text-grey-7 q-mt-xs">
            Здесь — значения по умолчанию. Для отдельного правила порог задаётся аргументом действия, например
            <code>jev.escalateIfNeeded(0.8)</code> или <code>jev.createTaskIfNeeded(0.6, 0.85)</code>
            (второй — порог разбиения на заявки).
          </div>

          <div
            v-for="item in thresholdItems"
            :key="item.key"
            class="q-mt-md"
          >
            <div class="text-body2">
              {{ item.label }}: <b>{{ percent(form.thresholds[item.key]) }}</b>
            </div>
            <div class="text-caption text-grey-7">{{ item.hint }}</div>
            <q-slider
              v-model="form.thresholds[item.key]"
              :min="0"
              :max="1"
              :step="0.05"
              label
              :label-value="percent(form.thresholds[item.key])"
              color="primary"
            />
          </div>

          <q-separator class="q-my-md"/>

          <div class="text-body2 text-weight-medium">Нужен ли ответ — <code>jev.setAnswerRequiredIfNeeded()</code></div>

          <div class="q-mt-sm">
            <div class="text-body2">
              «Ответ нужен», если вероятность не ниже: <b>{{ percent(form.replyRequiredThreshold) }}</b>
            </div>
            <q-slider
              v-model="form.replyRequiredThreshold"
              :min="0"
              :max="1"
              :step="0.05"
              label
              :label-value="percent(form.replyRequiredThreshold)"
              color="primary"
            />
          </div>

          <div class="q-mt-sm">
            <div class="text-body2">
              «Ответ не нужен», если вероятность не выше: <b>{{ percent(form.replyNotRequiredThreshold) }}</b>
            </div>
            <q-slider
              v-model="form.replyNotRequiredThreshold"
              :min="0"
              :max="1"
              :step="0.05"
              label
              :label-value="percent(form.replyNotRequiredThreshold)"
              color="primary"
            />
            <div v-if="thresholdError" class="text-caption text-negative">
              {{ thresholdError }}
            </div>
            <div v-else class="text-caption text-grey-7">
              Между двумя порогами флаг «нужен ответ» не меняется.
            </div>
          </div>
        </q-card-section>
      </q-card>

      <q-card flat bordered class="settings-card">
        <q-card-section class="settings-block">
          <div class="text-subtitle1">Приоритеты, которые Jev не назначает</div>
          <div class="text-caption text-grey-7">
            Например, служебные приоритеты вроде «Приостановленно».
          </div>
          <q-select
            v-model="form.priorityExcluded"
            outlined
            dense
            multiple
            use-chips
            use-input
            new-value-mode="add-unique"
            input-debounce="0"
            :options="priorityOptions"
            label="Исключённые приоритеты"
            class="q-mt-md"
            @filter="filterPriorities"
          />
        </q-card-section>
      </q-card>

      <q-card flat bordered class="settings-card">
        <q-card-section class="settings-block">
          <div class="text-subtitle1">Детектор массовых инцидентов</div>
          <div class="text-caption text-grey-7">
            Jev размечает входящие сообщения (сбой ли это, какой сервис и симптом). Когда за окно набирается
            достаточно разных клиентов с одинаковым сбоем, Jev проверяет пачку целиком, и ответственные получают
            уведомление: владелец и исполнители сервиса, ответственный и участники линии, а если их нет — администраторы.
            Включается правилом автоматизации на входящее сообщение с действием <code>jev.detectIncident()</code>.
          </div>

          <q-option-group
            v-model="form.incidentMode"
            :options="incidentModeOptions"
            type="radio"
            class="q-mt-sm"
          />

          <div class="row q-col-gutter-md q-mt-sm">
            <div class="col-12 col-sm-6">
              <q-input
                v-model.number="form.incidentWindowMinutes"
                outlined
                dense
                type="number"
                min="1"
                max="1440"
                label="Окно, мин"
                hint="За какой период считаются похожие обращения"
              />
            </div>
            <div class="col-12 col-sm-6">
              <q-input
                v-model.number="form.incidentMinClients"
                outlined
                dense
                type="number"
                min="2"
                max="1000"
                label="Минимум разных клиентов"
                hint="При тревоге мониторинга сервиса порог на 1 ниже"
              />
            </div>
            <div class="col-12 col-sm-6">
              <q-input
                v-model.number="form.incidentCooldownMinutes"
                outlined
                dense
                type="number"
                min="0"
                max="10080"
                label="Пауза после срабатывания, мин"
                hint="Пока идёт пауза, похожие обращения привязываются к созданному инциденту"
              />
            </div>
            <div class="col-12 col-sm-6">
              <q-input
                v-model.number="form.incidentP1MinClients"
                outlined
                dense
                type="number"
                min="2"
                max="10000"
                label="Клиентов для P1"
                hint="Меньше — серьёзность не выше P2, даже если Jev оценил P1"
              />
            </div>
          </div>
          <div v-if="detectorError" class="text-caption text-negative q-mt-sm">
            {{ detectorError }}
          </div>

          <div class="q-mt-md">
            <div class="text-body2">
              Считать сбоем, если вероятность не ниже: <b>{{ percent(form.incidentOutageThreshold) }}</b>
            </div>
            <q-slider
              v-model="form.incidentOutageThreshold"
              :min="0"
              :max="1"
              :step="0.05"
              label
              :label-value="percent(form.incidentOutageThreshold)"
              color="primary"
            />
          </div>
        </q-card-section>
      </q-card>

    </div>
  </div>
</template>

<script>
import axios from 'axios'
import JevDecisionLog from 'components/jev/JevDecisionLog.vue'

const API = '/api/v1/settings/jev'
const AUTOSAVE_DELAY_MS = 600

export default {
  name: 'JevSettingsPage',

  components: { JevDecisionLog },

  data () {
    return {
      loading: false,
      saving: false,
      decisionLogOpen: false,
      saveState: 'idle',
      saveTimer: null,
      saveQueued: false,
      lastSavedJson: null,
      allPriorityNames: [],
      thresholdItems: [],
      priorityOptions: [],
      incidentModeOptions: [
        {
          value: 'NOTIFY_ONLY',
          label: 'Только уведомлять — ответственные получают уведомление о массовом сбое, инцидент не создаётся'
        },
        {
          value: 'CREATE_DRAFT',
          label: 'Создавать черновик — инцидент в статусе «Черновик» с заполненными полями, заявки привязываются, ответственные получают уведомление'
        }
      ],
      meta: {
        enabled: false,
        apiKeyConfigured: false
      },
      form: this.defaultForm()
    }
  },

  computed: {
    thresholdError () {
      return this.form.replyNotRequiredThreshold >= this.form.replyRequiredThreshold
        ? 'Порог «ответ не нужен» должен быть меньше порога «ответ нужен»'
        : ''
    },

    detectorError () {
      const f = this.form
      const outOfRange = (value, min, max) => !Number.isInteger(value) || value < min || value > max
      if (outOfRange(f.incidentWindowMinutes, 1, 1440)) return 'Окно: от 1 до 1440 минут'
      if (outOfRange(f.incidentMinClients, 2, 1000)) return 'Минимум разных клиентов: от 2 до 1000'
      if (outOfRange(f.incidentCooldownMinutes, 0, 10080)) return 'Пауза: от 0 до 10080 минут'
      if (outOfRange(f.incidentP1MinClients, 2, 10000)) return 'Клиентов для P1: от 2 до 10000'
      return ''
    }
  },

  watch: {
    form: {
      deep: true,
      handler () {
        this.scheduleSave()
      }
    }
  },

  mounted () {
    this.load()
    this.loadPriorities()
  },

  beforeUnmount () {
    // Не терять последнюю правку, если со страницы ушли раньше, чем сработал таймер
    if (this.saveTimer) {
      clearTimeout(this.saveTimer)
      this.saveTimer = null
      this.save()
    }
  },

  methods: {
    defaultForm () {
      return {
        thresholds: {},
        replyRequiredThreshold: 0.6,
        replyNotRequiredThreshold: 0.25,
        priorityExcluded: [],
        incidentWindowMinutes: 15,
        incidentMinClients: 3,
        incidentOutageThreshold: 0.7,
        incidentCooldownMinutes: 60,
        incidentMode: 'NOTIFY_ONLY',
        incidentP1MinClients: 10
      }
    },

    percent (value) {
      return `${Math.round(Number(value || 0) * 100)}%`
    },

    payloadJson () {
      return JSON.stringify(this.form)
    },

    applySettings (data) {
      this.thresholdItems = Array.isArray(data.thresholds) ? data.thresholds : []
      this.form = {
        thresholds: Object.fromEntries(this.thresholdItems.map(item => [item.key, item.value])),
        replyRequiredThreshold: data.replyRequiredThreshold,
        replyNotRequiredThreshold: data.replyNotRequiredThreshold,
        priorityExcluded: [...(data.priorityExcluded || [])],
        incidentWindowMinutes: data.incidentWindowMinutes,
        incidentMinClients: data.incidentMinClients,
        incidentOutageThreshold: data.incidentOutageThreshold,
        incidentCooldownMinutes: data.incidentCooldownMinutes,
        incidentMode: data.incidentMode || 'NOTIFY_ONLY',
        incidentP1MinClients: data.incidentP1MinClients
      }
      this.lastSavedJson = this.payloadJson()
      this.applyMeta(data)
    },

    applyMeta (data) {
      this.meta = {
        enabled: !!data.enabled,
        apiKeyConfigured: !!data.apiKeyConfigured
      }
    },

    async load () {
      this.loading = true
      try {
        const { data } = await axios.get(API)
        this.applySettings(data)
      } catch (e) {
        this.notifyError(e, 'Не удалось загрузить настройки Jev')
      } finally {
        this.loading = false
      }
    },

    async loadPriorities () {
      try {
        const { data } = await axios.get('/api/v1/priorities')
        this.allPriorityNames = (Array.isArray(data) ? data : []).map(item => item.name).filter(Boolean)
      } catch (e) {
        this.allPriorityNames = []
      }
      this.priorityOptions = this.allPriorityNames
    },

    filterPriorities (value, update) {
      update(() => {
        const needle = String(value || '').toLowerCase()
        this.priorityOptions = needle
          ? this.allPriorityNames.filter(name => name.toLowerCase().includes(needle))
          : this.allPriorityNames
      })
    },

    scheduleSave () {
      if (this.lastSavedJson === null || this.payloadJson() === this.lastSavedJson) {
        return
      }
      clearTimeout(this.saveTimer)
      this.saveTimer = setTimeout(() => {
        this.saveTimer = null
        this.save()
      }, AUTOSAVE_DELAY_MS)
    },

    async save () {
      if (this.thresholdError || this.detectorError) {
        this.saveState = 'error'
        return
      }
      const json = this.payloadJson()
      if (json === this.lastSavedJson) {
        return
      }
      if (this.saving) {
        this.saveQueued = true
        return
      }
      this.saving = true
      this.saveState = 'saving'
      try {
        // Форму ответом не перезаписываем: пользователь мог продолжить редактирование
        const { data } = await axios.patch(API, JSON.parse(json))
        this.lastSavedJson = json
        this.applyMeta(data)
        this.saveState = 'saved'
      } catch (e) {
        this.saveState = 'error'
        this.notifyError(e, 'Не удалось сохранить настройки Jev')
      } finally {
        this.saving = false
        if (this.saveQueued) {
          this.saveQueued = false
          this.save()
        }
      }
    },

    notifyError (error, fallback) {
      const data = error?.response?.data
      this.$q.notify({
        type: 'negative',
        message: typeof data === 'string' && data ? data : fallback
      })
    }
  }
}
</script>

<style scoped>
.jev-settings {
  position: relative;
  width: 100%;
  max-width: 960px;
}

.jev-settings > .settings-content-header {
  margin-bottom: 20px;
}

.settings-card {
  border-radius: 12px;
}

.jev-save-state {
  display: flex;
  align-items: center;
  gap: 6px;
  min-height: 24px;
  font-size: 13px;
}
</style>
