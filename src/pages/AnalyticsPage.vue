<template>
  <q-page padding class="analytics-page">
    <div class="row items-start justify-between q-gutter-md q-mb-md">
      <div>
        <div class="text-h5 text-weight-medium">
          Аналитика
        </div>
        <div class="text-grey-7">
          Обращения, заявки, SLA, дедлайны и нагрузка операторов
        </div>
      </div>

      <div class="analytics-controls">
        <div class="period-toggle">
          <q-btn
            v-for="option in periodOptions"
            :key="option.value"
            :label="option.label"
            :color="periodPreset === option.value ? 'primary' : 'grey-3'"
            :text-color="periodPreset === option.value ? 'white' : 'dark'"
            unelevated
            dense
            no-caps
            class="period-toggle-btn"
            @click="selectPeriod(option.value)"
          />
        </div>

        <q-input
          v-model="fromDate"
          label="С"
          type="date"
          dense
          outlined
          class="analytics-date-input"
          @update:model-value="onManualPeriodChange"
        />

        <q-input
          v-model="toDate"
          label="По"
          type="date"
          dense
          outlined
          class="analytics-date-input"
          @update:model-value="onManualPeriodChange"
        />

        <q-select
          v-model="groupBy"
          :options="groupByOptions"
          label="Группировка"
          dense
          outlined
          emit-value
          map-options
          class="analytics-group-input"
          @update:model-value="loadAnalytics"
        />

        <q-btn
          icon="refresh"
          color="primary"
          flat
          round
          :loading="loading"
          @click="loadAnalytics"
        >
          <q-tooltip>
            Обновить
          </q-tooltip>
        </q-btn>
      </div>
    </div>

    <q-card flat bordered class="analytics-filter-card q-mb-md">
      <q-card-section>
        <div class="row items-center justify-between q-gutter-sm q-mb-md">
          <div>
            <div class="text-subtitle1 text-weight-medium">
              Фильтры и группировка аналитики
            </div>
            <div class="text-grey-7 text-caption">
              Фильтрует заявки и связанные с ними показатели. Теги работают по принципу «любой из выбранных».
            </div>
          </div>

          <div class="row q-gutter-xs items-center">
            <q-chip v-if="activeFilterCount > 0" dense square color="primary" text-color="white">
              Фильтров: {{ activeFilterCount }}
            </q-chip>
            <q-btn
              label="Сбросить"
              icon="filter_alt_off"
              dense
              flat
              no-caps
              :disable="activeFilterCount === 0"
              @click="resetAnalyticsFilters"
            />
          </div>
        </div>

        <div class="row q-col-gutter-sm">
          <div class="col-12 col-sm-6 col-md-3">
            <q-select
              v-model="analyticsFilters.typeIds"
              :options="taskTypeFilterOptions"
              label="Типы заявок"
              dense
              outlined
              multiple
              clearable
              use-chips
              emit-value
              map-options
              option-value="value"
              option-label="label"
              @update:model-value="loadAnalytics"
            />
          </div>

          <div class="col-12 col-sm-6 col-md-3">
            <q-select
              v-model="analyticsFilters.priorityIds"
              :options="priorityFilterOptions"
              label="Приоритеты"
              dense
              outlined
              multiple
              clearable
              use-chips
              emit-value
              map-options
              option-value="value"
              option-label="label"
              @update:model-value="loadAnalytics"
            />
          </div>

          <div class="col-12 col-sm-6 col-md-3">
            <q-select
              v-model="analyticsFilters.executorIds"
              :options="executorFilterOptions"
              label="Исполнители"
              dense
              outlined
              multiple
              clearable
              use-chips
              emit-value
              map-options
              option-value="value"
              option-label="label"
              @update:model-value="loadAnalytics"
            />
          </div>

          <div class="col-12 col-sm-6 col-md-3">
            <q-select
              v-model="analyticsFilters.tagIds"
              :options="tagFilterOptions"
              label="Теги"
              dense
              outlined
              multiple
              clearable
              use-chips
              emit-value
              map-options
              option-value="value"
              option-label="label"
              @update:model-value="loadAnalytics"
            />
          </div>
        </div>
      </q-card-section>
    </q-card>

    <div class="row q-col-gutter-md q-mb-md">
      <div
        v-for="card in metricCards"
        :key="card.key"
        class="col-12 col-sm-6 col-md-4 col-lg-3 col-xl-2"
      >
        <q-card flat bordered class="metric-card" :class="card.tone">
          <q-card-section>
            <div class="row items-center justify-between no-wrap">
              <div class="metric-title">
                {{ card.label }}
              </div>
              <q-icon :name="card.icon" size="22px" class="metric-icon"/>
            </div>

            <div class="metric-value">
              {{ card.value }}
            </div>

            <div class="metric-caption">
              {{ card.caption }}
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>

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
        <q-tab name="deadlines" icon="timer" label="SLA и дедлайны" no-caps/>
        <q-tab name="operators" icon="groups" label="Операторы" no-caps/>
      </q-tabs>
    </q-card>

    <q-tab-panels v-model="activeTab" animated keep-alive class="analytics-panels">
      <q-tab-panel name="overview" class="q-pa-none">
        <div class="row q-col-gutter-md">
          <div class="col-12 col-lg-8">
            <q-card flat bordered class="analytics-card">
              <q-card-section>
                <div class="row items-start justify-between q-gutter-sm">
                  <div>
                    <div class="text-h6">
                      Динамика заявок
                    </div>
                    <div class="text-grey-7 text-caption">
                      Закрытые и переоткрытые заявки · {{ periodCaption }}
                    </div>
                  </div>
                  <div class="row q-gutter-xs">
                    <q-chip dense square color="grey-2" text-color="dark">
                      Закрыто: {{ formatNumber(totalClosedByPeriod) }}
                    </q-chip>
                    <q-chip dense square color="warning" text-color="dark">
                      Переоткрыто: {{ formatNumber(totalReopenedByPeriod) }}
                    </q-chip>
                  </div>
                </div>
              </q-card-section>

              <q-separator/>

              <q-card-section>
                <div v-if="periodActivityRows.length" class="period-activity-chart">
                  <div
                    v-for="row in periodActivityRows"
                    :key="row.period"
                    class="period-activity-row"
                  >
                    <div class="period-activity-label">
                      {{ row.label }}
                    </div>

                    <div class="period-activity-metrics">
                      <div class="period-activity-metric">
                        <div class="period-activity-metric-title">
                          Закрыто
                        </div>
                        <div class="bar-chart-track">
                          <div class="bar-chart-fill" :style="{ width: row.closedPercent + '%' }"/>
                        </div>
                        <div class="bar-chart-value">
                          {{ formatNumber(row.closedCount) }}
                        </div>
                      </div>

                      <div class="period-activity-metric">
                        <div class="period-activity-metric-title">
                          Переоткрыто
                        </div>
                        <div class="bar-chart-track">
                          <div class="bar-chart-fill bar-chart-fill-warning"
                               :style="{ width: row.reopenedPercent + '%' }"/>
                        </div>
                        <div class="bar-chart-value">
                          {{ formatNumber(row.reopenedCount) }}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div v-else class="empty-state">
                  <q-icon name="insights" size="34px" class="text-grey-5"/>
                  <div class="text-grey-7 q-mt-sm">
                    Нет закрытых или переоткрытых заявок за выбранный период
                  </div>
                </div>
              </q-card-section>
            </q-card>
          </div>

          <div class="col-12 col-lg-4">
            <q-card flat bordered class="analytics-card">
              <q-card-section>
                <div class="text-h6">
                  Пульс очереди
                </div>
                <div class="text-grey-7 text-caption">
                  Что требует внимания прямо сейчас
                </div>
              </q-card-section>

              <q-separator/>

              <q-card-section class="queue-pulse-list">
                <div
                  v-for="item in queuePulseItems"
                  :key="item.key"
                  class="queue-pulse-item"
                >
                  <div class="row items-center justify-between no-wrap">
                    <div class="queue-pulse-label">
                      <q-icon :name="item.icon" size="18px" class="q-mr-xs"/>
                      {{ item.label }}
                    </div>
                    <q-chip dense square :color="item.color" :text-color="item.textColor">
                      {{ item.value }}
                    </q-chip>
                  </div>
                  <div class="queue-pulse-caption">
                    {{ item.caption }}
                  </div>
                </div>
              </q-card-section>
            </q-card>
          </div>

          <div class="col-12 col-lg-5">
            <q-card flat bordered class="analytics-card">
              <q-card-section>
                <div class="text-h6">
                  Закрыто / переоткрыто за период
                </div>
                <div class="text-grey-7 text-caption">
                  {{ groupBy === 'WEEK' ? 'Группировка по неделям' : 'Группировка по дням' }}
                </div>
              </q-card-section>

              <q-separator/>

              <q-table
                :rows="periodActivityTableRows"
                :columns="closedByPeriodColumns"
                row-key="period"
                flat
                dense
                :loading="loading"
                :rows-per-page-options="[10, 20, 50, 0]"
                no-data-label="Нет закрытых заявок за выбранный период"
              >
                <template v-slot:body-cell-period="props">
                  <q-td :props="props">
                    {{ formatPeriodDate(props.row.period) }}
                  </q-td>
                </template>
              </q-table>
            </q-card>
          </div>

          <div class="col-12 col-lg-7">
            <q-card flat bordered class="analytics-card">
              <q-card-section>
                <div class="text-h6">
                  Быстрый контроль качества
                </div>
                <div class="text-grey-7 text-caption">
                  Показометры по срокам, назначению и ожиданию ответа
                </div>
              </q-card-section>

              <q-separator/>

              <q-card-section>
                <div class="row q-col-gutter-md">
                  <div
                    v-for="gauge in qualityGauges"
                    :key="gauge.key"
                    class="col-12 col-sm-6"
                  >
                    <div class="quality-gauge">
                      <div class="row items-center justify-between q-mb-xs">
                        <div class="quality-gauge-title">
                          {{ gauge.label }}
                        </div>
                        <div class="quality-gauge-value">
                          {{ gauge.valueLabel }}
                        </div>
                      </div>
                      <q-linear-progress
                        rounded
                        size="12px"
                        :value="gauge.value / 100"
                        :color="gauge.color"
                        track-color="grey-3"
                      />
                      <div class="quality-gauge-caption">
                        {{ gauge.caption }}
                      </div>
                    </div>
                  </div>
                </div>
              </q-card-section>
            </q-card>
          </div>


          <div class="col-12">
            <q-card flat bordered class="analytics-card">
              <q-card-section>
                <div class="row items-start justify-between q-gutter-sm">
                  <div>
                    <div class="text-h6">
                      График нагрузки по часам
                    </div>
                    <div class="text-grey-7 text-caption">
                      Входящие, исходящие, созданные, закрытые и переоткрытые заявки по часам суток
                    </div>
                  </div>
                  <q-chip dense square color="grey-2" text-color="dark">
                    Всего действий: {{ formatNumber(totalHourlyLoad) }}
                  </q-chip>
                </div>
              </q-card-section>

              <q-separator/>

              <q-card-section>
                <div v-if="hourlyLoadRows.length" class="hourly-load-chart">
                  <div
                    v-for="row in hourlyLoadRows"
                    :key="row.hour"
                    class="hourly-load-row"
                  >
                    <div class="hourly-load-label">
                      {{ row.label }}
                    </div>
                    <div class="hourly-load-track">
                      <div class="hourly-load-fill" :style="{ width: row.percent + '%' }"/>
                    </div>
                    <div class="hourly-load-value">
                      {{ formatNumber(row.total) }}
                    </div>
                    <div class="hourly-load-breakdown">
                      <q-chip dense square color="blue-1" text-color="primary">
                        Вх: {{ formatNumber(row.incomingMessages) }}
                      </q-chip>
                      <q-chip dense square color="green-1" text-color="positive">
                        Исх: {{ formatNumber(row.outgoingMessages) }}
                      </q-chip>
                      <q-chip dense square color="grey-2" text-color="dark">
                        Созд: {{ formatNumber(row.createdTasks) }}
                      </q-chip>
                      <q-chip dense square color="positive" text-color="white">
                        Закр: {{ formatNumber(row.closedTasks) }}
                      </q-chip>
                      <q-chip dense square color="warning" text-color="dark">
                        Переоткр: {{ formatNumber(row.reopenedTasks) }}
                      </q-chip>
                    </div>
                  </div>
                </div>

                <div v-else class="empty-state">
                  <q-icon name="query_stats" size="34px" class="text-grey-5"/>
                  <div class="text-grey-7 q-mt-sm">
                    Нет данных по часовой нагрузке за выбранный период
                  </div>
                </div>
              </q-card-section>
            </q-card>
          </div>
        </div>
      </q-tab-panel>

      <q-tab-panel name="breakdown" class="q-pa-none">
        <div class="row q-col-gutter-md">
          <div class="col-12">
            <q-card flat bordered class="analytics-card">
              <q-card-section>
                <div class="row items-start justify-between q-gutter-sm">
                  <div>
                    <div class="text-h6">
                      Разбивка заявок
                    </div>
                    <div class="text-grey-7 text-caption">
                      Открытые, закрытые, переоткрытые и просроченные заявки в выбранном разрезе
                    </div>
                  </div>

                  <q-select
                    v-model="breakdownBy"
                    :options="breakdownByOptions"
                    label="Группировать по"
                    dense
                    outlined
                    emit-value
                    map-options
                    class="breakdown-select"
                  />
                </div>
              </q-card-section>

              <q-separator/>

              <q-card-section>
                <div v-if="currentBreakdownRows.length" class="breakdown-chart">
                  <div
                    v-for="row in currentBreakdownRows"
                    :key="row.key"
                    class="breakdown-row"
                  >
                    <div class="breakdown-name">
                      {{ row.name }}
                    </div>
                    <div class="breakdown-track">
                      <div class="breakdown-fill" :style="{ width: row.percent + '%' }"/>
                    </div>
                    <div class="breakdown-total">
                      {{ formatNumber(row.totalTasks) }}
                    </div>
                    <div class="breakdown-chips">
                      <q-chip dense square color="blue-1" text-color="primary">
                        Создано: {{ formatNumber(row.createdTasks) }}
                      </q-chip>
                      <q-chip dense square color="grey-2" text-color="dark">
                        Открыто: {{ formatNumber(row.openTasks) }}
                      </q-chip>
                      <q-chip dense square color="positive" text-color="white">
                        Закрыто: {{ formatNumber(row.closedTasks) }}
                      </q-chip>
                      <q-chip dense square color="warning" text-color="dark">
                        Переоткр: {{ formatNumber(row.reopenedTasks) }}
                      </q-chip>
                      <q-chip dense square :color="row.overdueSla > 0 ? 'negative' : 'grey-2'" :text-color="row.overdueSla > 0 ? 'white' : 'dark'">
                        SLA: {{ formatNumber(row.overdueSla) }}
                      </q-chip>
                      <q-chip dense square :color="row.overdueDeadlines > 0 ? 'warning' : 'grey-2'" text-color="dark">
                        Дедлайн: {{ formatNumber(row.overdueDeadlines) }}
                      </q-chip>
                    </div>
                  </div>
                </div>

                <div v-else class="empty-state">
                  <q-icon name="donut_large" size="34px" class="text-grey-5"/>
                  <div class="text-grey-7 q-mt-sm">
                    Нет данных для выбранной разбивки
                  </div>
                </div>
              </q-card-section>
            </q-card>
          </div>

          <div class="col-12">
            <q-card flat bordered class="analytics-card">
              <q-card-section>
                <div class="text-h6">
                  Таблица разбивки
                </div>
                <div class="text-grey-7 text-caption">
                  {{ currentBreakdownTitle }} · {{ periodCaption }}
                </div>
              </q-card-section>

              <q-separator/>

              <q-table
                :rows="currentBreakdownRows"
                :columns="breakdownColumns"
                row-key="key"
                flat
                dense
                :loading="loading"
                :rows-per-page-options="[10, 20, 50, 0]"
                no-data-label="Нет данных для выбранной разбивки"
              >
                <template v-slot:body-cell-overdueSla="props">
                  <q-td :props="props">
                    <q-chip
                      dense
                      square
                      :color="Number(props.row.overdueSla || 0) > 0 ? 'negative' : 'grey-2'"
                      :text-color="Number(props.row.overdueSla || 0) > 0 ? 'white' : 'dark'"
                    >
                      {{ formatNumber(props.row.overdueSla) }}
                    </q-chip>
                  </q-td>
                </template>

                <template v-slot:body-cell-overdueDeadlines="props">
                  <q-td :props="props">
                    <q-chip
                      dense
                      square
                      :color="Number(props.row.overdueDeadlines || 0) > 0 ? 'warning' : 'grey-2'"
                      text-color="dark"
                    >
                      {{ formatNumber(props.row.overdueDeadlines) }}
                    </q-chip>
                  </q-td>
                </template>
              </q-table>
            </q-card>
          </div>
        </div>
      </q-tab-panel>

      <q-tab-panel name="deadlines" class="q-pa-none">
        <div class="row q-col-gutter-md">
          <div class="col-12 col-md-6 col-lg-3">
            <q-card flat bordered class="analytics-card deadline-card">
              <q-card-section>
                <div class="deadline-card-label">
                  Просроченные дедлайны
                </div>
                <div class="deadline-card-value text-negative">
                  {{ formatNumber(overdueDeadlines) }}
                </div>
                <div class="deadline-card-caption">
                  Заявки, у которых срок выполнения уже нарушен
                </div>
              </q-card-section>
            </q-card>
          </div>

          <div class="col-12 col-md-6 col-lg-3">
            <q-card flat bordered class="analytics-card deadline-card">
              <q-card-section>
                <div class="deadline-card-label">
                  Предупреждения по дедлайну
                </div>
                <div class="deadline-card-value text-warning">
                  {{ formatNumber(deadlineWarnings) }}
                </div>
                <div class="deadline-card-caption">
                  Заявки, которые скоро нарушат срок
                </div>
              </q-card-section>
            </q-card>
          </div>

          <div class="col-12 col-md-6 col-lg-3">
            <q-card flat bordered class="analytics-card deadline-card">
              <q-card-section>
                <div class="deadline-card-label">
                  Просроченные SLA
                </div>
                <div class="deadline-card-value text-negative">
                  {{ formatNumber(overdueSla) }}
                </div>
                <div class="deadline-card-caption">
                  Открытые заявки с нарушенной реакцией
                </div>
              </q-card-section>
            </q-card>
          </div>

          <div class="col-12 col-md-6 col-lg-3">
            <q-card flat bordered class="analytics-card deadline-card">
              <q-card-section>
                <div class="deadline-card-label">
                  Сообщения без ответа
                </div>
                <div class="deadline-card-value">
                  {{ formatNumber(unansweredMessages) }}
                </div>
                <div class="deadline-card-caption">
                  Клиентские сообщения, ожидающие оператора
                </div>
              </q-card-section>
            </q-card>
          </div>

          <div class="col-12 col-lg-6">
            <q-card flat bordered class="analytics-card">
              <q-card-section>
                <div class="text-h6">
                  Риски по срокам
                </div>
                <div class="text-grey-7 text-caption">
                  Разделены SLA первого ответа и дедлайн выполнения заявки
                </div>
              </q-card-section>

              <q-separator/>

              <q-list separator>
                <q-item v-for="risk in deadlineRisks" :key="risk.key">
                  <q-item-section avatar>
                    <q-avatar :color="risk.color" text-color="white" size="36px">
                      <q-icon :name="risk.icon"/>
                    </q-avatar>
                  </q-item-section>
                  <q-item-section>
                    <q-item-label>{{ risk.label }}</q-item-label>
                    <q-item-label caption>{{ risk.caption }}</q-item-label>
                  </q-item-section>
                  <q-item-section side>
                    <div class="text-h6" :class="risk.textClass">
                      {{ risk.value }}
                    </div>
                  </q-item-section>
                </q-item>
              </q-list>
            </q-card>
          </div>

          <div class="col-12 col-lg-6">
            <q-card flat bordered class="analytics-card">
              <q-card-section>
                <div class="text-h6">
                  Средние времена
                </div>
                <div class="text-grey-7 text-caption">
                  Скорость реакции и закрытия за выбранный период
                </div>
              </q-card-section>

              <q-separator/>

              <q-card-section>
                <div class="time-metric">
                  <div>
                    <div class="time-metric-label">
                      Первый ответ
                    </div>
                    <div class="time-metric-caption">
                      Среднее время до первого ответа оператора
                    </div>
                  </div>
                  <div class="time-metric-value">
                    {{ formatDuration(avgFirstResponseSeconds) }}
                  </div>
                </div>

                <q-separator spaced/>

                <div class="time-metric">
                  <div>
                    <div class="time-metric-label">
                      Закрытие заявки
                    </div>
                    <div class="time-metric-caption">
                      Среднее время от создания до закрытия
                    </div>
                  </div>
                  <div class="time-metric-value">
                    {{ formatDuration(avgCloseTimeSeconds) }}
                  </div>
                </div>
              </q-card-section>
            </q-card>
          </div>
        </div>
      </q-tab-panel>

      <q-tab-panel name="operators" class="q-pa-none">
        <div class="row q-col-gutter-md">
          <div class="col-12 col-lg-5">
            <q-card flat bordered class="analytics-card">
              <q-card-section>
                <div class="text-h6">
                  Нагрузка по операторам
                </div>
                <div class="text-grey-7 text-caption">
                  Быстро видно, у кого накапливаются открытые и просроченные заявки
                </div>
              </q-card-section>

              <q-separator/>

              <q-card-section>
                <div v-if="operatorLoadRows.length" class="operator-bars">
                  <div
                    v-for="operator in operatorLoadRows"
                    :key="operator.userId || operator.name"
                    class="operator-bar-item"
                  >
                    <div class="row items-center justify-between q-mb-xs">
                      <div class="operator-name">
                        {{ operator.name || 'Без имени' }}
                      </div>
                      <div class="operator-total">
                        {{ formatNumber(operator.openTasks) }} открытых
                      </div>
                    </div>

                    <div class="operator-progress-line">
                      <span class="operator-progress-label">Открытые</span>
                      <q-linear-progress
                        rounded
                        size="8px"
                        :value="getProgressValue(operator.openTasks, maxOperatorOpenTasks)"
                        color="primary"
                        track-color="grey-3"
                      />
                    </div>

                    <div class="operator-progress-line">
                      <span class="operator-progress-label">Закрытые</span>
                      <q-linear-progress
                        rounded
                        size="8px"
                        :value="getProgressValue(operator.closedTasks, maxOperatorClosedTasks)"
                        color="positive"
                        track-color="grey-3"
                      />
                    </div>

                    <div class="operator-warning-row">
                      <q-chip dense square color="negative" text-color="white" icon="warning">
                        SLA: {{ formatNumber(operator.overdueSla) }}
                      </q-chip>
                      <q-chip dense square color="warning" text-color="dark" icon="event_busy">
                        Дедлайн: {{ formatNumber(operator.overdueDeadlines) }}
                      </q-chip>
                    </div>
                  </div>
                </div>

                <div v-else class="empty-state">
                  <q-icon name="insights" size="34px" class="text-grey-5"/>
                  <div class="text-grey-7 q-mt-sm">
                    Нет данных по операторам
                  </div>
                </div>
              </q-card-section>
            </q-card>
          </div>

          <div class="col-12 col-lg-7">
            <q-card flat bordered class="analytics-card">
              <q-card-section>
                <div class="text-h6">
                  Таблица операторов
                </div>
                <div class="text-grey-7 text-caption">
                  Открытые, закрытые, просрочки и средние времена
                </div>
              </q-card-section>

              <q-separator/>

              <q-table
                :rows="operatorLoadRows"
                :columns="operatorLoadColumns"
                row-key="userId"
                flat
                dense
                :loading="loading"
                :rows-per-page-options="[10, 20, 50, 0]"
                no-data-label="Нет данных по операторам"
              >
                <template v-slot:body-cell-overdueSla="props">
                  <q-td :props="props">
                    <q-chip
                      dense
                      square
                      :color="Number(props.row.overdueSla || 0) > 0 ? 'negative' : 'grey-2'"
                      :text-color="Number(props.row.overdueSla || 0) > 0 ? 'white' : 'dark'"
                    >
                      {{ formatNumber(props.row.overdueSla) }}
                    </q-chip>
                  </q-td>
                </template>

                <template v-slot:body-cell-overdueDeadlines="props">
                  <q-td :props="props">
                    <q-chip
                      dense
                      square
                      :color="Number(props.row.overdueDeadlines || 0) > 0 ? 'warning' : 'grey-2'"
                      text-color="dark"
                    >
                      {{ formatNumber(props.row.overdueDeadlines) }}
                    </q-chip>
                  </q-td>
                </template>
              </q-table>
            </q-card>
          </div>
        </div>
      </q-tab-panel>
    </q-tab-panels>
  </q-page>
</template>

<script>
import moment from 'moment'
import { api } from 'boot/axios'
import { useStore } from 'stores/store'

export default {
  name: 'AnalyticsPage',

  setup () {
    return {
      store: useStore()
    }
  },

  data: () => ({
    loading: false,
    analyticsSummary: {},
    activeTab: 'overview',
    periodPreset: '7',
    fromDate: '',
    toDate: '',
    groupBy: 'DAY',
    breakdownBy: 'type',
    analyticsFilters: {
      typeIds: [],
      priorityIds: [],
      executorIds: [],
      tagIds: []
    },

    periodOptions: [
      {
        label: 'Сегодня',
        value: 'today'
      },
      {
        label: '7 дней',
        value: '7'
      },
      {
        label: '30 дней',
        value: '30'
      }
    ],

    groupByOptions: [
      {
        label: 'По дням',
        value: 'DAY'
      },
      {
        label: 'По неделям',
        value: 'WEEK'
      }
    ],

    breakdownByOptions: [
      {
        label: 'По типам заявок',
        value: 'type'
      },
      {
        label: 'По приоритетам',
        value: 'priority'
      },
      {
        label: 'По исполнителям',
        value: 'executor'
      },
      {
        label: 'По тегам',
        value: 'tag'
      }
    ],

    breakdownColumns: [
      {
        name: 'name',
        label: 'Группа',
        field: 'name',
        align: 'left',
        sortable: true
      },
      {
        name: 'totalTasks',
        label: 'Всего',
        field: 'totalTasks',
        align: 'right',
        sortable: true,
        format: value => Number(value || 0).toLocaleString('ru-RU')
      },
      {
        name: 'createdTasks',
        label: 'Создано',
        field: 'createdTasks',
        align: 'right',
        sortable: true,
        format: value => Number(value || 0).toLocaleString('ru-RU')
      },
      {
        name: 'openTasks',
        label: 'Открытые',
        field: 'openTasks',
        align: 'right',
        sortable: true,
        format: value => Number(value || 0).toLocaleString('ru-RU')
      },
      {
        name: 'closedTasks',
        label: 'Закрытые',
        field: 'closedTasks',
        align: 'right',
        sortable: true,
        format: value => Number(value || 0).toLocaleString('ru-RU')
      },
      {
        name: 'reopenedTasks',
        label: 'Переоткрытые',
        field: 'reopenedTasks',
        align: 'right',
        sortable: true,
        format: value => Number(value || 0).toLocaleString('ru-RU')
      },
      {
        name: 'overdueSla',
        label: 'Просроч. SLA',
        field: 'overdueSla',
        align: 'right',
        sortable: true
      },
      {
        name: 'overdueDeadlines',
        label: 'Просроч. дедлайны',
        field: 'overdueDeadlines',
        align: 'right',
        sortable: true
      },
      {
        name: 'unassignedTasks',
        label: 'Без исполнителя',
        field: 'unassignedTasks',
        align: 'right',
        sortable: true,
        format: value => Number(value || 0).toLocaleString('ru-RU')
      }
    ],

    closedByPeriodColumns: [
      {
        name: 'period',
        label: 'Период',
        field: 'period',
        align: 'left',
        sortable: true
      },
      {
        name: 'closedCount',
        label: 'Закрыто',
        field: 'closedCount',
        align: 'right',
        sortable: true,
        format: value => Number(value || 0).toLocaleString('ru-RU')
      },
      {
        name: 'reopenedCount',
        label: 'Переоткрыто',
        field: 'reopenedCount',
        align: 'right',
        sortable: true,
        format: value => Number(value || 0).toLocaleString('ru-RU')
      }
    ]
  }),

  computed: {
    summary () {
      const localSummary = this.unwrapAnalyticsResponse(this.analyticsSummary)
      if (Object.keys(localSummary).length > 0) {
        return localSummary
      }
      return this.unwrapAnalyticsResponse(this.store.analyticsSummary)
    },

    activeFilterCount () {
      return this.analyticsFilterQuery.typeIds.length +
        this.analyticsFilterQuery.priorityIds.length +
        this.analyticsFilterQuery.executorIds.length +
        this.analyticsFilterQuery.tagIds.length
    },

    analyticsFilterQuery () {
      return {
        typeIds: this.normalizeSelectedIds(this.analyticsFilters.typeIds),
        priorityIds: this.normalizeSelectedIds(this.analyticsFilters.priorityIds),
        executorIds: this.normalizeSelectedIds(this.analyticsFilters.executorIds),
        tagIds: this.normalizeSelectedIds(this.analyticsFilters.tagIds)
      }
    },

    taskTypeFilterOptions () {
      return this.toEntityOptions(this.store.taskTypes || [], 'Без названия')
    },

    priorityFilterOptions () {
      return this.toEntityOptions(this.store.priorities || [], 'Без приоритета')
    },

    executorFilterOptions () {
      return (this.store.users || [])
        .filter(user => user && user.id !== undefined && user.id !== null)
        .map(user => ({
          label: this.getUserDisplayName(user),
          value: user.id
        }))
        .sort((left, right) => left.label.localeCompare(right.label))
    },

    tagFilterOptions () {
      return this.toEntityOptions(this.store.tags || [], 'Без тега')
    },

    currentBreakdownTitle () {
      const option = this.breakdownByOptions.find(item => item.value === this.breakdownBy)
      return option ? option.label : 'Разбивка'
    },

    currentBreakdownRows () {
      const keyMap = {
        type: ['taskTypeBreakdown', 'typeBreakdown', 'tasksByType'],
        priority: ['priorityBreakdown', 'tasksByPriority'],
        executor: ['executorBreakdown', 'tasksByExecutor'],
        tag: ['tagBreakdown', 'tasksByTag']
      }
      const rows = this.getSummaryRows(keyMap[this.breakdownBy] || [])
      return this.normalizeBreakdownRows(rows)
    },

    newAppeals () {
      return this.getSummaryNumber(['newAppeals', 'newMessages', 'incomingAppeals'])
    },

    openTasks () {
      return this.getSummaryNumber(['openTasks', 'openedTasks', 'activeTasks'])
    },

    closedTasks () {
      return this.getSummaryNumber(['closedTasks', 'closedTaskCount', 'resolvedTasks'])
    },

    overdueSla () {
      return this.getSummaryNumber(['overdueSla', 'overdueSlaTasks', 'slaOverdueTasks'])
    },

    overdueDeadlines () {
      return this.getSummaryNumber(['overdueDeadlines', 'overdueDeadlineTasks', 'deadlineOverdueTasks'])
    },

    deadlineWarnings () {
      return this.getSummaryNumber(['deadlineWarnings', 'deadlineWarningTasks', 'deadlineAlmostOverdueTasks'])
    },

    unassignedTasks () {
      return this.getSummaryNumber(['unassignedTasks', 'tasksWithoutAssignee'])
    },

    unansweredMessages () {
      return this.getSummaryNumber(['unansweredMessages', 'messagesAwaitingResponse', 'needAnswerMessages'])
    },

    reopenedTasks () {
      return this.getSummaryNumber(['reopenedTasks', 'reopenedTaskCount', 'returnedToWorkTasks'])
    },

    avgFirstResponseSeconds () {
      return this.getSummaryNumber(['avgFirstResponseSeconds', 'averageFirstResponseSeconds'])
    },

    avgCloseTimeSeconds () {
      return this.getSummaryNumber(['avgCloseTimeSeconds', 'averageCloseTimeSeconds'])
    },

    totalClosedByPeriod () {
      return this.closedTrendRows.reduce((sum, row) => sum + row.count, 0)
    },

    totalReopenedByPeriod () {
      const total = this.reopenedTrendRows.reduce((sum, row) => sum + row.count, 0)
      return total || this.reopenedTasks
    },

    closedTrendRows () {
      const rows = this.getSummaryRows(['closedByPeriod', 'closedTasksByPeriod'])
      return this.normalizePeriodRows(rows)
    },

    reopenedTrendRows () {
      const rows = this.getSummaryRows(['reopenedByPeriod', 'reopenedTasksByPeriod', 'returnedToWorkByPeriod'])
      return this.normalizePeriodRows(rows)
    },

    periodActivityRows () {
      const map = new Map()

      this.closedTrendRows.forEach(row => {
        map.set(row.period, {
          period: row.period,
          label: row.label,
          closedCount: row.count,
          reopenedCount: 0
        })
      })

      this.reopenedTrendRows.forEach(row => {
        const current = map.get(row.period) || {
          period: row.period,
          label: row.label,
          closedCount: 0,
          reopenedCount: 0
        }
        current.reopenedCount = row.count
        map.set(row.period, current)
      })

      const rows = Array.from(map.values())
        .sort((left, right) => String(left.period).localeCompare(String(right.period)))
        .map(row => ({
          ...row,
          totalCount: Number(row.closedCount || 0) + Number(row.reopenedCount || 0)
        }))

      const max = Math.max(...rows.map(row => Math.max(row.closedCount, row.reopenedCount)), 0)

      return rows.map(row => ({
        ...row,
        closedPercent: max > 0 ? Math.max((row.closedCount / max) * 100, row.closedCount > 0 ? 8 : 0) : 0,
        reopenedPercent: max > 0 ? Math.max((row.reopenedCount / max) * 100, row.reopenedCount > 0 ? 8 : 0) : 0
      }))
    },

    periodActivityTableRows () {
      return this.periodActivityRows.map(row => ({
        period: row.period,
        closedCount: row.closedCount,
        reopenedCount: row.reopenedCount,
        totalCount: row.totalCount
      }))
    },

    hourlyLoadRows () {
      const rows = this.getSummaryRows(['hourlyLoad', 'loadByHour', 'hourLoad'])
      const normalized = rows.map(row => {
        const rawHour = row.hour !== undefined && row.hour !== null ? row.hour : row.hourOfDay
        const hour = Number(rawHour || 0)
        const incomingMessages = Number(row.incomingMessages || row.incoming || 0)
        const outgoingMessages = Number(row.outgoingMessages || row.outgoing || 0)
        const createdTasks = Number(row.createdTasks || row.taskCreated || 0)
        const closedTasks = Number(row.closedTasks || row.taskClosed || 0)
        const reopenedTasks = Number(row.reopenedTasks || row.reopened || row.returnedToWorkTasks || 0)
        const total = Number(row.total || row.count || incomingMessages + outgoingMessages + createdTasks + closedTasks + reopenedTasks)

        return {
          hour,
          label: row.label || `${String(hour).padStart(2, '0')}:00`,
          incomingMessages,
          outgoingMessages,
          createdTasks,
          closedTasks,
          reopenedTasks,
          total
        }
      }).sort((left, right) => left.hour - right.hour)

      const max = Math.max(...normalized.map(row => row.total), 0)

      return normalized.map(row => ({
        ...row,
        percent: max > 0 ? Math.max((row.total / max) * 100, row.total > 0 ? 6 : 0) : 0
      }))
    },

    totalHourlyLoad () {
      return this.hourlyLoadRows.reduce((sum, row) => sum + row.total, 0)
    },

    operatorLoadRows () {
      const rows = Array.isArray(this.summary.operatorLoad) ? this.summary.operatorLoad : []
      return rows.map(row => ({
        ...row,
        userId: row.userId || row.id || row.username || row.name,
        name: row.name || row.fullName || row.username || 'Без имени',
        openTasks: Number(row.openTasks || 0),
        closedTasks: Number(row.closedTasks || 0),
        overdueSla: Number(row.overdueSla || row.overdueSlaTasks || 0),
        overdueDeadlines: Number(row.overdueDeadlines || row.overdueDeadlineTasks || row.deadlineOverdueTasks || 0),
        reopenedTasks: Number(row.reopenedTasks || row.reopenedTaskCount || row.returnedToWorkTasks || 0),
        avgFirstResponseSeconds: Number(row.avgFirstResponseSeconds || row.averageFirstResponseSeconds || 0),
        avgCloseTimeSeconds: Number(row.avgCloseTimeSeconds || row.averageCloseTimeSeconds || 0)
      }))
    },

    maxOperatorOpenTasks () {
      return Math.max(...this.operatorLoadRows.map(row => Number(row.openTasks || 0)), 0)
    },

    maxOperatorClosedTasks () {
      return Math.max(...this.operatorLoadRows.map(row => Number(row.closedTasks || 0)), 0)
    },

    operatorLoadColumns () {
      return [
        {
          name: 'name',
          label: 'Оператор',
          field: 'name',
          align: 'left',
          sortable: true
        },
        {
          name: 'openTasks',
          label: 'Открытые',
          field: 'openTasks',
          align: 'right',
          sortable: true,
          format: value => Number(value || 0).toLocaleString('ru-RU')
        },
        {
          name: 'closedTasks',
          label: 'Закрытые',
          field: 'closedTasks',
          align: 'right',
          sortable: true,
          format: value => Number(value || 0).toLocaleString('ru-RU')
        },
        {
          name: 'reopenedTasks',
          label: 'Переоткрытые',
          field: 'reopenedTasks',
          align: 'right',
          sortable: true,
          format: value => Number(value || 0).toLocaleString('ru-RU')
        },
        {
          name: 'overdueSla',
          label: 'Просроч. SLA',
          field: 'overdueSla',
          align: 'right',
          sortable: true
        },
        {
          name: 'overdueDeadlines',
          label: 'Просроч. дедлайны',
          field: 'overdueDeadlines',
          align: 'right',
          sortable: true
        },
        {
          name: 'avgFirstResponseSeconds',
          label: 'Первый ответ',
          field: 'avgFirstResponseSeconds',
          align: 'right',
          sortable: true,
          format: value => this.formatDuration(value)
        },
        {
          name: 'avgCloseTimeSeconds',
          label: 'Закрытие',
          field: 'avgCloseTimeSeconds',
          align: 'right',
          sortable: true,
          format: value => this.formatDuration(value)
        }
      ]
    },

    metricCards () {
      return [
        {
          key: 'newAppeals',
          label: 'Новые обращения',
          value: this.formatNumber(this.newAppeals),
          caption: 'Входящие за период',
          icon: 'forum',
          tone: 'metric-card-info'
        },
        {
          key: 'openTasks',
          label: 'Открытые заявки',
          value: this.formatNumber(this.openTasks),
          caption: 'Сейчас в работе',
          icon: 'task_alt',
          tone: 'metric-card-info'
        },
        {
          key: 'closedTasks',
          label: 'Закрыто',
          value: this.formatNumber(this.closedTasks),
          caption: 'За выбранный период',
          icon: 'done_all',
          tone: 'metric-card-positive'
        },
        {
          key: 'overdueSla',
          label: 'Просроченные SLA',
          value: this.formatNumber(this.overdueSla),
          caption: 'Нарушена реакция',
          icon: 'warning',
          tone: this.overdueSla > 0 ? 'metric-card-negative' : 'metric-card-positive'
        },
        {
          key: 'overdueDeadlines',
          label: 'Просроченные дедлайны',
          value: this.formatNumber(this.overdueDeadlines),
          caption: 'Нарушен срок выполнения',
          icon: 'event_busy',
          tone: this.overdueDeadlines > 0 ? 'metric-card-negative' : 'metric-card-positive'
        },
        {
          key: 'unansweredMessages',
          label: 'Без ответа',
          value: this.formatNumber(this.unansweredMessages),
          caption: 'Сообщения клиентов',
          icon: 'mark_chat_unread',
          tone: this.unansweredMessages > 0 ? 'metric-card-warning' : 'metric-card-positive'
        },
        {
          key: 'avgFirstResponseSeconds',
          label: 'Первый ответ',
          value: this.formatDuration(this.avgFirstResponseSeconds),
          caption: 'Среднее время',
          icon: 'reply',
          tone: 'metric-card-neutral'
        },
        {
          key: 'avgCloseTimeSeconds',
          label: 'Закрытие заявки',
          value: this.formatDuration(this.avgCloseTimeSeconds),
          caption: 'Среднее время',
          icon: 'schedule',
          tone: 'metric-card-neutral'
        },
        {
          key: 'unassignedTasks',
          label: 'Без исполнителя',
          value: this.formatNumber(this.unassignedTasks),
          caption: 'Открытые заявки',
          icon: 'person_off',
          tone: this.unassignedTasks > 0 ? 'metric-card-warning' : 'metric-card-positive'
        },
        {
          key: 'reopenedTasks',
          label: 'Переоткрыто',
          value: this.formatNumber(this.reopenedTasks),
          caption: 'Возвращены в работу',
          icon: 'restart_alt',
          tone: this.reopenedTasks > 0 ? 'metric-card-warning' : 'metric-card-neutral'
        }
      ]
    },

    queuePulseItems () {
      return [
        {
          key: 'overdueDeadlines',
          label: 'Дедлайн нарушен',
          value: this.formatNumber(this.overdueDeadlines),
          caption: 'Сначала закрывать эти заявки',
          icon: 'event_busy',
          color: this.overdueDeadlines > 0 ? 'negative' : 'grey-2',
          textColor: this.overdueDeadlines > 0 ? 'white' : 'dark'
        },
        {
          key: 'overdueSla',
          label: 'SLA нарушен',
          value: this.formatNumber(this.overdueSla),
          caption: 'Клиент ждет реакции дольше нормы',
          icon: 'timer_off',
          color: this.overdueSla > 0 ? 'negative' : 'grey-2',
          textColor: this.overdueSla > 0 ? 'white' : 'dark'
        },
        {
          key: 'unansweredMessages',
          label: 'Сообщения без ответа',
          value: this.formatNumber(this.unansweredMessages),
          caption: 'Очередь клиентских сообщений',
          icon: 'mark_chat_unread',
          color: this.unansweredMessages > 0 ? 'warning' : 'grey-2',
          textColor: 'dark'
        },
        {
          key: 'unassignedTasks',
          label: 'Без исполнителя',
          value: this.formatNumber(this.unassignedTasks),
          caption: 'Нужно назначить ответственного',
          icon: 'person_off',
          color: this.unassignedTasks > 0 ? 'warning' : 'grey-2',
          textColor: 'dark'
        }
      ]
    },

    qualityGauges () {
      return [
        {
          key: 'slaHealth',
          label: 'SLA без просрочки',
          value: this.calculateHealthPercent(this.openTasks, this.overdueSla),
          valueLabel: this.formatPercent(this.calculateHealthPercent(this.openTasks, this.overdueSla)),
          caption: 'Доля открытых заявок без нарушения SLA',
          color: this.getGaugeColor(this.calculateHealthPercent(this.openTasks, this.overdueSla))
        },
        {
          key: 'deadlineHealth',
          label: 'Дедлайны в норме',
          value: this.calculateHealthPercent(this.openTasks, this.overdueDeadlines),
          valueLabel: this.formatPercent(this.calculateHealthPercent(this.openTasks, this.overdueDeadlines)),
          caption: 'Доля открытых заявок без просрочки дедлайна',
          color: this.getGaugeColor(this.calculateHealthPercent(this.openTasks, this.overdueDeadlines))
        },
        {
          key: 'assignmentHealth',
          label: 'Назначены исполнители',
          value: this.calculateHealthPercent(this.openTasks, this.unassignedTasks),
          valueLabel: this.formatPercent(this.calculateHealthPercent(this.openTasks, this.unassignedTasks)),
          caption: 'Доля открытых заявок с ответственным',
          color: this.getGaugeColor(this.calculateHealthPercent(this.openTasks, this.unassignedTasks))
        },
        {
          key: 'responseHealth',
          label: 'Очередь без ожидания',
          value: this.calculateHealthPercent(this.newAppeals || this.unansweredMessages, this.unansweredMessages),
          valueLabel: this.formatPercent(this.calculateHealthPercent(this.newAppeals || this.unansweredMessages, this.unansweredMessages)),
          caption: 'Чем выше, тем меньше сообщений без ответа',
          color: this.getGaugeColor(this.calculateHealthPercent(this.newAppeals || this.unansweredMessages, this.unansweredMessages))
        }
      ]
    },

    deadlineRisks () {
      return [
        {
          key: 'overdueDeadlines',
          label: 'Дедлайн выполнения нарушен',
          caption: 'Заявки нужно закрыть или перенести срок с причиной',
          value: this.formatNumber(this.overdueDeadlines),
          icon: 'event_busy',
          color: this.overdueDeadlines > 0 ? 'negative' : 'positive',
          textClass: this.overdueDeadlines > 0 ? 'text-negative' : 'text-positive'
        },
        {
          key: 'deadlineWarnings',
          label: 'Скоро будет нарушен дедлайн',
          caption: 'Заявки попали в окно предупреждения за N минут',
          value: this.formatNumber(this.deadlineWarnings),
          icon: 'notification_important',
          color: this.deadlineWarnings > 0 ? 'warning' : 'positive',
          textClass: this.deadlineWarnings > 0 ? 'text-warning' : 'text-positive'
        },
        {
          key: 'overdueSla',
          label: 'SLA реакции нарушен',
          caption: 'Отдельно от дедлайна выполнения заявки',
          value: this.formatNumber(this.overdueSla),
          icon: 'timer_off',
          color: this.overdueSla > 0 ? 'negative' : 'positive',
          textClass: this.overdueSla > 0 ? 'text-negative' : 'text-positive'
        },
        {
          key: 'unansweredMessages',
          label: 'Клиентские сообщения без ответа',
          caption: 'Очередь сообщений, которые требуют ответа оператора',
          value: this.formatNumber(this.unansweredMessages),
          icon: 'mark_chat_unread',
          color: this.unansweredMessages > 0 ? 'warning' : 'positive',
          textClass: this.unansweredMessages > 0 ? 'text-warning' : 'text-positive'
        }
      ]
    },

    periodCaption () {
      if (!this.fromDate || !this.toDate) {
        return 'Период не выбран'
      }
      return `${this.formatPeriodDate(this.fromDate)} — ${this.formatPeriodDate(this.toDate)}`
    }
  },

  created () {
    this.applyPreset(false)
    this.loadAnalyticsDictionaries()
    this.loadAnalytics()
  },

  methods: {
    loadAnalyticsDictionaries () {
      if (typeof this.store.fetchAnalyticsDictionaries === 'function') {
        this.store.fetchAnalyticsDictionaries()
          .catch(error => console.error(error))
        return
      }
      if (typeof this.store.fetchData === 'function') {
        this.store.fetchData()
      }
    },

    resetAnalyticsFilters () {
      this.analyticsFilters = {
        typeIds: [],
        priorityIds: [],
        executorIds: [],
        tagIds: []
      }
      this.loadAnalytics()
    },

    normalizeSelectedIds (value) {
      if (!Array.isArray(value)) {
        return []
      }
      return value
        .filter(item => item !== undefined && item !== null && item !== '')
        .map(item => Number(item))
        .filter(item => Number.isFinite(item))
    },

    toEntityOptions (items, fallbackLabel) {
      return (items || [])
        .filter(item => item && item.id !== undefined && item.id !== null)
        .map(item => ({
          label: item.name || item.type || item.title || fallbackLabel,
          value: item.id
        }))
        .sort((left, right) => left.label.localeCompare(right.label))
    },

    getUserDisplayName (user) {
      const lastname = user && user.lastname ? user.lastname : ''
      const firstname = user && user.firstname ? user.firstname : ''
      const fullName = `${lastname} ${firstname}`.trim()
      return fullName || (user && user.username) || 'Без имени'
    },

    normalizeBreakdownRows (rows) {
      const normalized = (rows || []).map(row => ({
        ...row,
        key: row.key || `${row.id !== undefined && row.id !== null ? row.id : row.name}`,
        id: row.id,
        name: row.name || row.label || 'Без значения',
        totalTasks: Number(row.totalTasks || row.total || row.count || 0),
        createdTasks: Number(row.createdTasks || row.created || 0),
        openTasks: Number(row.openTasks || row.open || 0),
        closedTasks: Number(row.closedTasks || row.closed || 0),
        reopenedTasks: Number(row.reopenedTasks || row.reopened || 0),
        overdueSla: Number(row.overdueSla || row.overdueSlaTasks || 0),
        overdueDeadlines: Number(row.overdueDeadlines || row.overdueDeadlineTasks || 0),
        unassignedTasks: Number(row.unassignedTasks || 0)
      }))

      const max = Math.max(...normalized.map(row => row.totalTasks), 0)

      return normalized
        .sort((left, right) => right.totalTasks - left.totalTasks)
        .map(row => ({
          ...row,
          percent: max > 0 ? Math.max((row.totalTasks / max) * 100, row.totalTasks > 0 ? 6 : 0) : 0
        }))
    },

    unwrapAnalyticsResponse (value) {
      if (!value) {
        return {}
      }
      if (value.data && typeof value.data === 'object') {
        return value.data
      }
      return value
    },

    toCsvParam (value) {
      if (!Array.isArray(value) || value.length === 0) {
        return undefined
      }
      return value.join(',')
    },

    buildAnalyticsParams () {
      const filters = this.analyticsFilterQuery
      return {
        from: this.toIsoParam(this.fromDate, false),
        to: this.toIsoParam(this.toDate, true),
        groupBy: this.groupBy,
        typeIds: this.toCsvParam(filters.typeIds),
        priorityIds: this.toCsvParam(filters.priorityIds),
        executorIds: this.toCsvParam(filters.executorIds),
        tagIds: this.toCsvParam(filters.tagIds)
      }
    },

    applyPreset (needLoad = true) {
      const now = new Date()
      const from = new Date(now)
      if (this.periodPreset === 'today') {
        from.setDate(now.getDate())
      } else {
        from.setDate(now.getDate() - Number(this.periodPreset) + 1)
      }
      this.fromDate = this.formatDateInput(from)
      this.toDate = this.formatDateInput(now)
      if (needLoad) {
        this.loadAnalytics()
      }
    },

    loadAnalytics () {
      if (!this.fromDate || !this.toDate) {
        return
      }
      this.loading = true
      api.get('/api/v1/analytics/summary', {
        params: this.buildAnalyticsParams()
      })
        .then(({ data }) => {
          this.analyticsSummary = data || {}
        })
        .catch(error => {
          console.error(error)
          this.analyticsSummary = {}
          this.$q.notify({
            type: 'negative',
            message: 'Не удалось загрузить аналитику'
          })
        })
        .finally(() => {
          this.loading = false
        })
    },

    onManualPeriodChange () {
      this.periodPreset = 'custom'
      this.loadAnalytics()
    },

    formatDateInput (date) {
      const year = date.getFullYear()
      const month = `${date.getMonth() + 1}`.padStart(2, '0')
      const day = `${date.getDate()}`.padStart(2, '0')
      return `${year}-${month}-${day}`
    },

    toIsoParam (dateValue, endOfDay) {
      if (!dateValue) {
        return undefined
      }
      const time = endOfDay ? '23:59:59' : '00:00:00'
      return `${dateValue}T${time}`
    },

    getSummaryNumber (keys) {
      for (const key of keys) {
        if (this.summary[key] !== undefined && this.summary[key] !== null) {
          return Number(this.summary[key] || 0)
        }
      }
      return 0
    },

    getSummaryRows (keys) {
      const summary = this.unwrapAnalyticsResponse(this.summary)
      for (const key of keys) {
        const value = summary[key]
        if (Array.isArray(value)) {
          return value
        }
        if (value && typeof value === 'object') {
          return Object.entries(value).map(([entryKey, row]) => {
            if (row && typeof row === 'object') {
              return {
                key: row.key || entryKey,
                name: row.name || row.label || entryKey,
                ...row
              }
            }
            return {
              key: entryKey,
              name: entryKey,
              totalTasks: Number(row || 0)
            }
          })
        }
      }
      return []
    },

    normalizePeriodRows (rows) {
      const normalized = rows.map(row => ({
        period: row.period,
        label: this.formatPeriodDate(row.period),
        count: Number(row.count || row.value || 0)
      }))
      const max = Math.max(...normalized.map(row => row.count), 0)

      return normalized
        .sort((left, right) => String(left.period).localeCompare(String(right.period)))
        .map(row => ({
          ...row,
          percent: max > 0 ? Math.max((row.count / max) * 100, row.count > 0 ? 8 : 0) : 0
        }))
    },

    formatNumber (value) {
      return Number(value || 0).toLocaleString('ru-RU')
    },

    formatPercent (value) {
      return `${Math.round(Number(value || 0))}%`
    },

    formatDuration (seconds) {
      const totalSeconds = Number(seconds || 0)
      if (totalSeconds <= 0) {
        return '—'
      }
      const minutes = Math.round(totalSeconds / 60)
      if (minutes < 60) {
        return `${minutes} мин`
      }
      const hours = Math.floor(minutes / 60)
      const restMinutes = minutes % 60
      if (hours < 24) {
        return restMinutes > 0 ? `${hours} ч ${restMinutes} мин` : `${hours} ч`
      }
      const days = Math.floor(hours / 24)
      const restHours = hours % 24
      return restHours > 0 ? `${days} д ${restHours} ч` : `${days} д`
    },

    selectPeriod (value) {
      this.periodPreset = value
      this.applyPreset()
    },

    formatPeriodDate (value) {
      if (!value) {
        return '—'
      }
      const date = moment(value, ['YYYY-MM-DD', moment.ISO_8601], true)
      if (!date.isValid()) {
        return value
      }
      return date.format('DD.MM.YYYY')
    },

    calculateHealthPercent (total, badCount) {
      const safeTotal = Number(total || 0)
      const safeBadCount = Number(badCount || 0)
      if (safeTotal <= 0) {
        return 100
      }
      return Math.max(0, Math.min(100, ((safeTotal - safeBadCount) / safeTotal) * 100))
    },

    getGaugeColor (value) {
      const percent = Number(value || 0)
      if (percent >= 85) {
        return 'positive'
      }
      if (percent >= 60) {
        return 'warning'
      }
      return 'negative'
    },

    getProgressValue (value, max) {
      const safeMax = Number(max || 0)
      if (safeMax <= 0) {
        return 0
      }
      return Math.max(0, Math.min(1, Number(value || 0) / safeMax))
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

.analytics-controls {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: flex-end;
  align-items: center;
}

.analytics-date-input {
  width: 150px;
}

.analytics-group-input {
  width: 150px;
}

.analytics-tabs-card {
  border-radius: 8px;
}

.analytics-panels {
  background: transparent;
}

.analytics-card {
  height: 100%;
  border-radius: 8px;
}

.metric-card {
  height: 100%;
  border-radius: 8px;
  border-left: 4px solid #e0e0e0;
}

.metric-card-info {
  border-left-color: #1976d2;
}

.metric-card-positive {
  border-left-color: #21ba45;
}

.metric-card-warning {
  border-left-color: #f2c037;
}

.metric-card-negative {
  border-left-color: #c10015;
}

.metric-card-neutral {
  border-left-color: #9e9e9e;
}

.metric-title {
  color: #616161;
  font-size: 13px;
  line-height: 16px;
}

.metric-icon {
  color: #757575;
}

.metric-value {
  margin-top: 12px;
  font-size: 28px;
  line-height: 32px;
  font-weight: 600;
}

.metric-caption {
  margin-top: 4px;
  color: #757575;
  font-size: 12px;
}

.period-toggle {
  display: flex;
  gap: 8px;
  align-items: center;
}

.period-toggle-btn {
  border-radius: 4px;
  min-height: 32px;
  padding: 4px 10px;
}

.bar-chart {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.bar-chart-row {
  display: grid;
  grid-template-columns: 96px 1fr 56px;
  gap: 10px;
  align-items: center;
}

.bar-chart-label {
  color: #616161;
  font-size: 12px;
  white-space: nowrap;
}

.bar-chart-track {
  height: 14px;
  overflow: hidden;
  border-radius: 999px;
  background: #eeeeee;
}

.bar-chart-fill {
  height: 100%;
  border-radius: 999px;
  background: #1976d2;
}

.bar-chart-fill-warning {
  background: #f2c037;
}

.period-activity-chart {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.period-activity-row {
  display: grid;
  grid-template-columns: 96px 1fr;
  gap: 12px;
  align-items: start;
}

.period-activity-label {
  color: #616161;
  font-size: 12px;
  white-space: nowrap;
}

.period-activity-metrics {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.period-activity-metric {
  display: grid;
  grid-template-columns: 92px 1fr 56px;
  gap: 10px;
  align-items: center;
}

.period-activity-metric-title {
  color: #757575;
  font-size: 12px;
}

.bar-chart-value {
  text-align: right;
  font-weight: 600;
}

.queue-pulse-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.queue-pulse-item {
  padding-bottom: 12px;
  border-bottom: 1px solid #eeeeee;
}

.queue-pulse-item:last-child {
  padding-bottom: 0;
  border-bottom: 0;
}

.queue-pulse-label {
  display: flex;
  align-items: center;
  font-weight: 500;
}

.queue-pulse-caption {
  margin-top: 4px;
  color: #757575;
  font-size: 12px;
}

.quality-gauge {
  padding: 12px;
  border: 1px solid #eeeeee;
  border-radius: 8px;
  background: #fafafa;
}

.quality-gauge-title {
  font-weight: 500;
}

.quality-gauge-value {
  font-weight: 700;
}

.quality-gauge-caption {
  margin-top: 6px;
  color: #757575;
  font-size: 12px;
}

.deadline-card-label {
  color: #616161;
  font-size: 13px;
}

.deadline-card-value {
  margin-top: 10px;
  font-size: 30px;
  line-height: 34px;
  font-weight: 700;
}

.deadline-card-caption {
  margin-top: 6px;
  color: #757575;
  font-size: 12px;
}

.time-metric {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  justify-content: space-between;
}

.time-metric-label {
  font-weight: 500;
}

.time-metric-caption {
  margin-top: 4px;
  color: #757575;
  font-size: 12px;
}

.time-metric-value {
  white-space: nowrap;
  font-size: 20px;
  font-weight: 700;
}

.operator-bars {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.operator-bar-item {
  padding-bottom: 16px;
  border-bottom: 1px solid #eeeeee;
}

.operator-bar-item:last-child {
  padding-bottom: 0;
  border-bottom: 0;
}

.operator-name {
  font-weight: 600;
}

.operator-total {
  color: #757575;
  font-size: 12px;
}

.operator-progress-line {
  display: grid;
  grid-template-columns: 72px 1fr;
  gap: 8px;
  align-items: center;
  margin-top: 8px;
}

.operator-progress-label {
  color: #757575;
  font-size: 12px;
}

.operator-warning-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 10px;
}

.hourly-load-chart {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.hourly-load-row {
  display: grid;
  grid-template-columns: 56px minmax(140px, 1fr) 52px minmax(280px, 1.4fr);
  gap: 10px;
  align-items: center;
}

.hourly-load-label {
  color: #616161;
  font-size: 12px;
  white-space: nowrap;
}

.hourly-load-track {
  height: 14px;
  overflow: hidden;
  border-radius: 999px;
  background: #eeeeee;
}

.hourly-load-fill {
  height: 100%;
  border-radius: 999px;
  background: #1976d2;
}

.hourly-load-value {
  text-align: right;
  font-weight: 600;
}

.hourly-load-breakdown {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.analytics-filter-card {
  border-radius: 8px;
}

.breakdown-select {
  width: 220px;
}

.breakdown-chart {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.breakdown-row {
  display: grid;
  grid-template-columns: minmax(160px, 220px) minmax(160px, 1fr) 56px minmax(320px, 1.7fr);
  gap: 10px;
  align-items: center;
}

.breakdown-name {
  overflow: hidden;
  font-weight: 500;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.breakdown-track {
  height: 14px;
  overflow: hidden;
  border-radius: 999px;
  background: #eeeeee;
}

.breakdown-fill {
  height: 100%;
  border-radius: 999px;
  background: #1976d2;
}

.breakdown-total {
  text-align: right;
  font-weight: 600;
}

.breakdown-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

@media (max-width: 900px) {
  .hourly-load-row {
    grid-template-columns: 56px 1fr 52px;
  }

  .hourly-load-breakdown {
    grid-column: 2 / 4;
  }

  .breakdown-row {
    grid-template-columns: 1fr 56px;
  }

  .breakdown-name,
  .breakdown-track,
  .breakdown-chips {
    grid-column: 1 / 3;
  }

  .breakdown-total {
    text-align: left;
  }
}

.empty-state {
  display: flex;
  min-height: 180px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
}
</style>
