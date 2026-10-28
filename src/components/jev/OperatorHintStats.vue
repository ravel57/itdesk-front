<template>
  <q-card flat :bordered="!ruleId" :class="ruleId ? 'operator-hint-stats--embedded' : 'settings-card'">
    <q-card-section :class="ruleId ? 'q-pa-sm' : 'settings-block'">
      <div class="row items-start justify-between q-col-gutter-sm">
        <div class="col-12 col-md">
          <div v-if="!ruleId" class="text-subtitle1">Подсказки оператору</div>
          <div class="text-body2 text-grey-7" :class="{ 'q-mt-xs': !ruleId }">
            {{ ruleId
            ? 'Подсказки этого правила и оценки операторов. Если у источника много «не помогло», поднимите порог или выключите источник в настройках сценария.'
            : 'Подсказки автоматизаций с шагом «Опубликовать подсказку оператору» и оценки операторов. Пороги и источники меняются в настройках правила.' }}
          </div>
        </div>
        <div class="col-12 col-md-auto">
          <q-btn-toggle
            v-model="days"
            dense
            no-caps
            unelevated
            toggle-color="primary"
            :options="periodOptions"
          />
        </div>
      </div>

      <div v-if="!loading && emptyMessage" class="q-mt-md text-grey-7 row items-center q-gutter-sm">
        <q-icon name="info" size="18px"/>
        <span>{{ emptyMessage }}</span>
        <q-btn
          v-if="!ruleId && rules.length === 0"
          flat
          dense
          no-caps
          color="primary"
          icon="account_tree"
          label="Открыть автоматизации"
          to="/settings/automatization"
        />
      </div>

      <div v-for="rule in rules" :key="rule.ruleId ?? 'none'" class="q-mt-md">
        <div v-if="!ruleId" class="row items-center q-gutter-sm">
          <div class="text-subtitle2">{{ rule.name || 'Правило без названия' }}</div>
          <q-badge v-if="!rule.exists" color="grey-6">удалено</q-badge>
          <q-badge v-else-if="!rule.enabled" color="orange-8">выключено</q-badge>
          <q-space/>
          <q-btn
            v-if="rule.exists && rule.ruleId"
            flat
            dense
            no-caps
            color="primary"
            icon="open_in_new"
            label="Открыть правило"
            :to="{ path: '/settings/automatization', query: { ruleId: rule.ruleId } }"
          />
        </div>

        <div v-if="rule.sources.length === 0" class="text-caption text-grey-7 q-mt-xs">
          За период подсказок не было
        </div>
        <q-markup-table v-else flat dense class="q-mt-xs hint-stats-table app-background-transparent">
          <thead>
          <tr>
            <th class="text-left">Источник</th>
            <th class="text-right">Подсказок</th>
            <th class="text-right">Помогло</th>
            <th class="text-right">Не помогло</th>
            <th class="text-right">Без оценки</th>
            <th class="text-right">Доля «помогло»</th>
            <th class="text-right">Ср. уверенность Jev</th>
          </tr>
          </thead>
          <tbody>
          <tr v-for="row in rule.sources" :key="row.source">
            <td>{{ row.label || row.source }}</td>
            <td class="text-right">{{ row.total }}</td>
            <td class="text-right text-positive">{{ row.helpful }}</td>
            <td class="text-right text-negative">{{ row.notHelpful }}</td>
            <td class="text-right text-grey-7">{{ row.total - row.helpful - row.notHelpful }}</td>
            <td class="text-right">{{ helpfulShare(row) }}</td>
            <td class="text-right">{{ row.averageProbability == null ? '—' : row.averageProbability.toFixed(2) }}</td>
          </tr>
          </tbody>
        </q-markup-table>
      </div>
      <q-inner-loading :showing="loading"/>
    </q-card-section>
  </q-card>
</template>

<script>
import axios from 'axios'

// Статистика подсказок по правилам и источникам. Источники, их названия и правила приходят с сервера:
// компонент не знает ни названий правил, ни набора источников
export default {
  name: 'OperatorHintStats',

  props: {
    // Только одно правило — блок в редакторе правила
    ruleId: { type: Number, default: null }
  },

  data: () => ({
    days: 30,
    stats: { rules: [], publishingRules: [] },
    loading: false,
    periodOptions: [
      { label: '7 дней', value: 7 },
      { label: '30 дней', value: 30 },
      { label: '90 дней', value: 90 }
    ]
  }),

  computed: {
    // Правила со статистикой и включённые правила, у которых подсказок за период не было
    rules () {
      const withStats = this.stats.rules || []
      const known = new Set(withStats.map(rule => rule.ruleId))
      const silent = (this.stats.publishingRules || [])
        .filter(rule => rule.enabled && !known.has(rule.id))
        .map(rule => ({ ruleId: rule.id, name: rule.name, exists: true, enabled: true, sources: [] }))
      return [...withStats, ...silent]
    },

    emptyMessage () {
      if (this.ruleId) {
        return (this.stats.rules || []).length === 0 ? 'За период подсказок не было' : ''
      }
      if (this.rules.length === 0) {
        return 'Нет включённых автоматизаций, публикующих подсказки. Добавьте в граф правила шаг «Опубликовать подсказку оператору».'
      }
      return ''
    }
  },

  watch: {
    days () {
      this.load()
    },

    ruleId: {
      immediate: true,
      handler () {
        this.load()
      }
    }
  },

  methods: {
    load () {
      this.loading = true
      axios.get('/api/v1/operator-hints/stats', { params: { days: this.days, ruleId: this.ruleId || undefined } })
        .then(({ data }) => {
          this.stats = {
            rules: Array.isArray(data?.rules) ? data.rules : [],
            publishingRules: Array.isArray(data?.publishingRules) ? data.publishingRules : []
          }
        })
        .catch(e => this.$q.notify({ type: 'negative', message: e?.response?.data?.message || e.message }))
        .finally(() => {
          this.loading = false
        })
    },

    // Доля считается только по оценённым подсказкам
    helpfulShare (row) {
      const rated = row.helpful + row.notHelpful
      return rated === 0 ? '—' : `${Math.round(row.helpful * 100 / rated)}%`
    }
  }
}
</script>

<style scoped>
.settings-card {
  border-radius: 12px;
}

.operator-hint-stats--embedded {
  background: transparent;
}
</style>
