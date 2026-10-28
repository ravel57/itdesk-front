<template>
  <div class="row q-col-gutter-md">
    <div class="col-12 col-md-6 col-lg-3">
      <q-card flat bordered class="analytics-card deadline-card app-shared-analytics-card">
        <q-card-section>
          <div class="deadline-card-label">
            Просроченные дедлайны
          </div>
          <div
            class="deadline-card-value"
            :class="overdueDeadlines > 0 ? 'text-negative' : 'text-grey-7'"
          >
            {{ formatNumber(overdueDeadlines) }}
          </div>
          <div class="deadline-card-caption app-shared-deadline-card-caption">
            Заявки, у которых срок выполнения уже нарушен
          </div>
        </q-card-section>
      </q-card>
    </div>

    <div class="col-12 col-md-6 col-lg-3">
      <q-card flat bordered class="analytics-card deadline-card app-shared-analytics-card">
        <q-card-section>
          <div class="deadline-card-label">
            Предупреждения по дедлайну
          </div>
          <div
            class="deadline-card-value"
            :class="deadlineWarnings > 0 ? 'text-warning' : 'text-grey-7'"
          >
            {{ formatNumber(deadlineWarnings) }}
          </div>
          <div class="deadline-card-caption app-shared-deadline-card-caption">
            Заявки, которые скоро нарушат срок
          </div>
        </q-card-section>
      </q-card>
    </div>

    <div class="col-12 col-md-6 col-lg-3">
      <q-card flat bordered class="analytics-card deadline-card app-shared-analytics-card">
        <q-card-section>
          <div class="deadline-card-label">
            Просроченные SLA
          </div>
          <div
            class="deadline-card-value"
            :class="overdueSla > 0 ? 'text-negative' : 'text-grey-7'"
          >
            {{ formatNumber(overdueSla) }}
          </div>
          <div class="deadline-card-caption app-shared-deadline-card-caption">
            Открытые заявки с нарушенной реакцией
          </div>
        </q-card-section>
      </q-card>
    </div>

    <div v-if="canViewInternalAnalytics" class="col-12 col-md-6 col-lg-3">
      <q-card flat bordered class="analytics-card deadline-card app-shared-analytics-card">
        <q-card-section>
          <div class="deadline-card-label">
            Просроченные OLA
          </div>
          <div
            class="deadline-card-value"
            :class="overdueOla > 0 ? 'text-negative' : 'text-grey-7'"
          >
            {{ formatNumber(overdueOla) }}
          </div>
          <div class="deadline-card-caption app-shared-deadline-card-caption">
            Нарушены внутренние сроки текущих линий
          </div>
        </q-card-section>
      </q-card>
    </div>

    <div v-if="canViewInternalAnalytics" class="col-12 col-md-6 col-lg-3">
      <q-card flat bordered class="analytics-card deadline-card app-shared-analytics-card">
        <q-card-section>
          <div class="deadline-card-label">
            Предупреждения OLA
          </div>
          <div
            class="deadline-card-value"
            :class="olaWarnings > 0 ? 'text-warning' : 'text-grey-7'"
          >
            {{ formatNumber(olaWarnings) }}
          </div>
          <div class="deadline-card-caption app-shared-deadline-card-caption">
            OLA линий скоро будет нарушен
          </div>
        </q-card-section>
      </q-card>
    </div>

    <div class="col-12 col-md-6 col-lg-3">
      <q-card flat bordered class="analytics-card deadline-card app-shared-analytics-card">
        <q-card-section>
          <div class="deadline-card-label">
            Сообщения без ответа
          </div>
          <div
            class="deadline-card-value"
            :class="unansweredMessages > 0 ? 'text-warning' : 'text-grey-7'"
          >
            {{ formatNumber(unansweredMessages) }}
          </div>
          <div class="deadline-card-caption app-shared-deadline-card-caption">
            Клиентские сообщения, ожидающие оператора
          </div>
        </q-card-section>
      </q-card>
    </div>

    <div class="col-12 col-lg-6">
      <q-card flat bordered class="analytics-card app-shared-analytics-card">
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
      <q-card flat bordered class="analytics-card app-shared-analytics-card">
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
              <div class="time-metric-label app-font-weight-500">
                Первый ответ
              </div>
              <div class="time-metric-caption app-shared-time-metric-caption">
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
              <div class="time-metric-label app-font-weight-500">
                Закрытие заявки
              </div>
              <div class="time-metric-caption app-shared-time-metric-caption">
                Среднее время от создания до закрытия
              </div>
            </div>
            <div class="time-metric-value">
              {{ formatDuration(avgCloseTimeSeconds) }}
            </div>
          </div>

          <q-separator spaced/>

          <div class="time-metric">
            <div>
              <div class="time-metric-label app-font-weight-500">
                Нахождение на линии
              </div>
              <div class="time-metric-caption app-shared-time-metric-caption">
                Среднее время заявки на одном этапе поддержки
              </div>
            </div>
            <div class="time-metric-value">
              {{ formatDuration(avgLineTimeSeconds) }}
            </div>
          </div>
        </q-card-section>
      </q-card>
    </div>
  </div>
</template>

<script>
import analyticsSummaryMixin from './analyticsSummaryMixin'

export default {
  name: 'AnalyticsDeadlinesTab',

  mixins: [analyticsSummaryMixin],

  props: {
    summary: {
      type: Object,
      default: () => ({})
    },
    canViewInternalAnalytics: {
      type: Boolean,
      default: false
    }
  },

  computed: {
    deadlineRisks() {
      const risks = [
        {
          key: 'overdueDeadlines',
          label: 'Дедлайн выполнения нарушен',
          caption: 'Заявки нужно закрыть или перенести срок с причиной',
          value: this.formatNumber(this.overdueDeadlines),
          icon: 'event_busy',
          color: this.overdueDeadlines > 0 ? 'negative' : 'grey-5',
          textClass: this.overdueDeadlines > 0 ? 'text-negative' : 'text-grey-7'
        },
        {
          key: 'deadlineWarnings',
          label: 'Скоро будет нарушен дедлайн',
          caption: 'Заявки попали в окно предупреждения за N минут',
          value: this.formatNumber(this.deadlineWarnings),
          icon: 'notification_important',
          color: this.deadlineWarnings > 0 ? 'warning' : 'grey-5',
          textClass: this.deadlineWarnings > 0 ? 'text-warning' : 'text-grey-7'
        },
        {
          key: 'overdueSla',
          label: 'SLA реакции нарушен',
          caption: 'Отдельно от дедлайна выполнения заявки',
          value: this.formatNumber(this.overdueSla),
          icon: 'timer_off',
          color: this.overdueSla > 0 ? 'negative' : 'grey-5',
          textClass: this.overdueSla > 0 ? 'text-negative' : 'text-grey-7'
        },
        {
          key: 'overdueOla',
          label: 'OLA линии нарушен',
          caption: 'Внутренний срок текущей команды превышен',
          value: this.formatNumber(this.overdueOla),
          icon: 'support_agent',
          color: this.overdueOla > 0 ? 'negative' : 'grey-5',
          textClass: this.overdueOla > 0 ? 'text-negative' : 'text-grey-7'
        },
        {
          key: 'unansweredMessages',
          label: 'Клиентские сообщения без ответа',
          caption: 'Очередь сообщений, которые требуют ответа оператора',
          value: this.formatNumber(this.unansweredMessages),
          icon: 'mark_chat_unread',
          color: this.unansweredMessages > 0 ? 'warning' : 'grey-5',
          textClass: this.unansweredMessages > 0 ? 'text-warning' : 'text-grey-7'
        }
      ]
      return this.canViewInternalAnalytics
        ? risks
        : risks.filter(risk => risk.key !== 'overdueOla')
    },
  }
}
</script>

<style scoped>
.deadline-card-label {
  color: var(--app-text-muted, #616161);
  font-size: 13px;
}

.deadline-card-value {
  margin-top: 10px;
  font-size: 30px;
  line-height: 34px;
  font-weight: 700;
}

.time-metric {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  justify-content: space-between;
}

.time-metric-value {
  white-space: nowrap;
  font-size: 20px;
  font-weight: 700;
}
</style>
