<template>
  <q-page padding class="analytics-page">
    <analytics-header
      v-model:from-date="fromDate"
      v-model:to-date="toDate"
      v-model:group-by="groupBy"
      :scope-label="analyticsScopeLabel"
      :period-preset="periodPreset"
      :loading="loading"
      @select-period="selectPeriod"
      @manual-period-change="onManualPeriodChange"
      @group-by-change="scheduleAnalyticsLoad()"
      @refresh="loadAnalytics()"
    />

    <analytics-filters
      :filters="analyticsFilters"
      :type-options="taskTypeFilterOptions"
      :priority-options="priorityFilterOptions"
      :executor-options="executorFilterOptions"
      :tag-options="tagFilterOptions"
      :support-line-options="supportLineFilterOptions"
      :active-filter-count="activeFilterCount"
      :can-filter-executors="canFilterExecutors"
      :can-filter-support-lines="canFilterSupportLines"
      @update-filter="onAnalyticsFilterUpdate"
      @change="scheduleAnalyticsLoad()"
      @reset="resetAnalyticsFilters"
    />

    <analytics-metric-cards
      :summary="summary"
      :can-view-internal-analytics="canViewInternalAnalytics"
    />

    <q-card flat bordered class="analytics-tabs-card q-mb-md">
      <q-tabs
        v-model="activeTab"
        dense
        active-color="primary"
        indicator-color="primary"
        align="left"
        narrow-indicator
      >
        <q-tab name="overview" icon="dashboard" label="Обзор" no-caps/>
        <q-tab name="breakdown" icon="donut_large" label="Разбивки" no-caps/>
        <q-tab name="deadlines" icon="timer" :label="canViewInternalAnalytics ? 'SLA, OLA и дедлайны' : 'SLA и дедлайны'" no-caps/>
        <q-tab v-if="canViewOperators" name="operators" icon="groups" label="Операторы" no-caps/>
        <q-tab v-if="canViewSupportLines" name="lines" icon="support_agent" label="Линии поддержки" no-caps/>
      </q-tabs>
    </q-card>

    <q-tab-panels v-model="activeTab" animated keep-alive class="analytics-panels">
      <q-tab-panel name="overview" class="q-pa-none">
        <analytics-overview-tab
          :summary="summary"
          :loading="loading"
          :group-by="groupBy"
          :period-caption="periodCaption"
          :can-view-internal-analytics="canViewInternalAnalytics"
        />
      </q-tab-panel>

      <q-tab-panel name="breakdown" class="q-pa-none">
        <analytics-breakdown-tab
          v-model:breakdown-by="breakdownBy"
          :summary="summary"
          :loading="loading"
          :available-breakdown-by-options="availableBreakdownByOptions"
          :period-caption="periodCaption"
          :can-view-internal-analytics="canViewInternalAnalytics"
          @breakdown-changed="saveAnalyticsSettingsToLocalStorage"
        />
      </q-tab-panel>

      <q-tab-panel name="deadlines" class="q-pa-none">
        <analytics-deadlines-tab
          :summary="summary"
          :can-view-internal-analytics="canViewInternalAnalytics"
        />
      </q-tab-panel>

      <q-tab-panel v-if="canViewOperators" name="operators" class="q-pa-none">
        <analytics-operators-tab
          :summary="summary"
          :loading="loading"
          :period-caption="periodCaption"
        />
      </q-tab-panel>

      <q-tab-panel v-if="canViewSupportLines" name="lines" class="q-pa-none">
        <analytics-lines-tab
          :summary="summary"
          :loading="loading"
          :support-line-filter-options="supportLineFilterOptions"
        />
      </q-tab-panel>
    </q-tab-panels>
  </q-page>
</template>

<script>
import {useStore} from 'stores/store'
import {
  getDefaultAnalyticsFilters,
  normalizeSelectedIds,
  toEntityOptions,
  toExecutorOptions
} from 'src/util/analytics/analyticsFilters'
import {buildPeriodCaption, getPresetRange} from 'src/util/analytics/analyticsPeriod'
import analyticsAccessMixin from 'components/analytics/analyticsAccessMixin'
import analyticsLoaderMixin from 'components/analytics/analyticsLoaderMixin'
import analyticsSettingsMixin from 'components/analytics/analyticsSettingsMixin'
import AnalyticsHeader from 'components/analytics/AnalyticsHeader.vue'
import AnalyticsFilters from 'components/analytics/AnalyticsFilters.vue'
import AnalyticsMetricCards from 'components/analytics/AnalyticsMetricCards.vue'
import AnalyticsOverviewTab from 'components/analytics/AnalyticsOverviewTab.vue'
import AnalyticsBreakdownTab from 'components/analytics/AnalyticsBreakdownTab.vue'
import AnalyticsDeadlinesTab from 'components/analytics/AnalyticsDeadlinesTab.vue'
import AnalyticsOperatorsTab from 'components/analytics/AnalyticsOperatorsTab.vue'
import AnalyticsLinesTab from 'components/analytics/AnalyticsLinesTab.vue'

// Страница-оркестратор: хранит период, фильтры и состояние вкладок.
// Загрузка — analyticsLoaderMixin, права — analyticsAccessMixin, localStorage — analyticsSettingsMixin.
export default {
  name: 'AnalyticsPage',

  components: {
    AnalyticsHeader,
    AnalyticsFilters,
    AnalyticsMetricCards,
    AnalyticsOverviewTab,
    AnalyticsBreakdownTab,
    AnalyticsDeadlinesTab,
    AnalyticsOperatorsTab,
    AnalyticsLinesTab
  },

  mixins: [analyticsLoaderMixin, analyticsAccessMixin, analyticsSettingsMixin],

  setup() {
    return {
      store: useStore()
    }
  },

  data: () => ({
    activeTab: 'overview',
    periodPreset: '7',
    fromDate: '',
    toDate: '',
    groupBy: 'DAY',
    breakdownBy: 'type',
    analyticsFilters: getDefaultAnalyticsFilters()
  }),

  computed: {
    activeFilterCount() {
      return this.analyticsFilterQuery.typeIds.length +
        this.analyticsFilterQuery.priorityIds.length +
        this.analyticsFilterQuery.executorIds.length +
        this.analyticsFilterQuery.tagIds.length +
        this.analyticsFilterQuery.supportLineIds.length
    },

    analyticsFilterQuery() {
      return {
        typeIds: normalizeSelectedIds(this.analyticsFilters.typeIds),
        priorityIds: normalizeSelectedIds(this.analyticsFilters.priorityIds),
        executorIds: this.canFilterExecutors
          ? normalizeSelectedIds(this.analyticsFilters.executorIds)
          : [],
        tagIds: normalizeSelectedIds(this.analyticsFilters.tagIds),
        supportLineIds: this.canFilterSupportLines
          ? normalizeSelectedIds(this.analyticsFilters.supportLineIds)
          : [],
      }
    },

    taskTypeFilterOptions() {
      return toEntityOptions(this.store.taskTypes || [], 'Без названия')
    },

    priorityFilterOptions() {
      return toEntityOptions(this.store.priorities || [], 'Без приоритета')
    },

    executorFilterOptions() {
      return toExecutorOptions(this.store.users)
    },

    tagFilterOptions() {
      return toEntityOptions(this.store.tags || [], 'Без тега')
    },

    supportLineFilterOptions() {
      return toEntityOptions(
        (this.store.supportLines || []).filter(line => line?.active !== false),
        'Без линии'
      )
    },

    periodCaption() {
      return buildPeriodCaption(this.fromDate, this.toDate)
    }
  },

  created() {
    const restored = this.restoreAnalyticsSettingsFromLocalStorage()
    if (!restored) {
      this.applyPreset(false)
    }
    this.loadAnalyticsDictionaries()
    this.loadAnalytics()
  },

  methods: {
    onAnalyticsFilterUpdate(field, value) {
      this.analyticsFilters[field] = value
    },

    resetAnalyticsFilters() {
      this.analyticsFilters = getDefaultAnalyticsFilters()
      this.scheduleAnalyticsLoad()
    },

    applyPreset(needLoad = true) {
      const range = getPresetRange(this.periodPreset)
      this.fromDate = range.fromDate
      this.toDate = range.toDate
      if (needLoad) {
        this.scheduleAnalyticsLoad()
      }
    },

    onManualPeriodChange() {
      this.periodPreset = 'custom'
      this.scheduleAnalyticsLoad()
    },

    selectPeriod(value) {
      this.periodPreset = value
      this.applyPreset()
    }
  },

  mounted() {
    document.title = 'ULDESK : Аналитика'
  }
}
</script>

<style scoped>
.analytics-page {
  display: flex;
  flex-direction: column;
}

.analytics-tabs-card {
  border-radius: 8px;
}

.analytics-panels {
  background: transparent;
}
</style>
