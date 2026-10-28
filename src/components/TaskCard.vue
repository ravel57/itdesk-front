<template>
  <div
    id="task-card"
    class="task-card"
    :class="{ 'task-card--with-chat-link': !!this.$slots.chatLink }"
    :data-tour="this.isOnboardingDemo ? 'tasks-task-card-inner' : null"
  >
    <slot name="chatLink"></slot>
    <div class="task-card-header">
      <div class="task-card-header-left">
        <slot name="checkBox"></slot>
        <div class="task-card-title" data-tour="tasks-task-title">
          <div class="task-id" data-tour="tasks-task-id">№{{ this.task.id }}</div>
          <div id="task-card-name" class="text-body2 task-card-name">{{ task.name }}</div>
        </div>
      </div>
      <div class="task-card-status-container app-inline app-display-flex">
        <circle-counter class="app-inline app-margin-right-8"
          v-if="isHaveInTaskPing(task)"
          :image="'/at.svg'"
        />
        <div
          id="task-card-status"
          data-tour="tasks-task-status"
          :class="[taskStatusClass, fieldHighlightClass('status')]"
        >
          <div v-if="this.task.frozen">
            Заморожена
          </div>
          <div v-else-if="this.task.completed">
            Закрыта
          </div>
          <div v-else-if="!this.task.completed && !this.task.frozen">
            {{ task.status.name }}
          </div>
        </div>
      </div>
    </div>
    <table @click="this.$emit('onTaskClicked', this.task)">
      <template v-for="field in this.visibleCardFields" :key="field.key">
        <tr v-if="field.key === 'description' && task.description.length !== 0" data-tour="tasks-task-description">
          <th class="small-text text-grey row-label" v-text="'Описание: '"/>
          <th
            :class="descriptionClass"
            v-text="task.description"
          />
        </tr>
        <tr v-else-if="field.key === 'type'" data-tour="tasks-task-type">
          <th class="small-text text-grey row-label" :class="fieldHighlightClass('type')" v-text="'Тип: '"/>
          <th
            :class="typeClass"
            v-text="getTaskTypeName(task)"
          />
        </tr>
        <tr v-else-if="field.key === 'service' && task.service" data-tour="tasks-task-service">
          <th class="small-text text-grey row-label" :class="fieldHighlightClass('service')" v-text="'Сервис: '"/>
          <th :class="serviceClass" v-text="getServiceLabel(task.service)"/>
        </tr>
        <tr
          v-else-if="field.key === 'checklist' && getChecklistTotalCount(task) > 0"
          data-tour="tasks-task-checklist"
        >
          <th class="small-text text-grey row-label" v-text="'Чек-лист: '"/>
          <th :class="checklistClass">
            <div class="task-card-checklist-progress-row">
              <span>
                {{ getChecklistCompletedCount(task) }} / {{ getChecklistTotalCount(task) }}
              </span>
              <q-linear-progress
                rounded
                :value="getChecklistProgress(task)"
                color="primary"
                track-color="grey-3"
                class="task-card-checklist-progress"
                size="8px"
                :animation-speed="0"
              />
            </div>
          </th>
        </tr>
        <tr v-else-if="field.key === 'tags' && task.tags.map(tag => tag.name).length !== 0" data-tour="tasks-task-tags">
          <th class="small-text text-grey row-label" :class="fieldHighlightClass('tag')" v-text="'Теги: '"/>
          <th
            :class="tagsClass"
            v-text="task.tags.map(tag => tag.name).join(', ')"
          />
        </tr>
        <tr v-else-if="field.key === 'supportLine' && task.supportLine" data-tour="tasks-task-support-line">
          <th class="small-text text-grey row-label" :class="fieldHighlightClass('supportLine', 'supportLineLevel')" v-text="'Линия: '"/>
          <th :class="supportLineClass" v-text="task.supportLine.name"/>
        </tr>
        <tr v-else-if="field.key === 'priority'" data-tour="tasks-task-priority">
          <th
            class="small-text text-grey row-label"
            :class="fieldHighlightClass('priority')"
            v-text="'Приоритет: '"
          />
          <th
            :class="priorityClass"
            v-text="task.priority.name"
          />
        </tr>
        <tr v-else-if="field.key === 'executor' && task.executor" data-tour="tasks-task-executor">
          <th class="small-text text-grey row-label" :class="fieldHighlightClass('executor')" v-text="'Исполнитель: '"/>
          <th
            :class="executorClass"
            v-text="getName(task.executor)"
          />
        </tr>
        <tr v-else-if="field.key === 'createdAt'" data-tour="tasks-task-created">
          <th
            class="small-text text-grey row-label"
            :class="fieldHighlightClass('createdAt', 'creating')"
            v-text="'Создана: '"
          />
          <th
            :class="createdAtClass"
            v-text="this.getStamp(task.createdAt)"
          />
        </tr>
        <tr v-else-if="field.key === 'deadline' && task.deadline" data-tour="tasks-task-deadline">
          <th
            class="small-text text-grey row-label"
            :class="fieldHighlightClass('deadline')"
            v-text="'Дедлайн: '"
          />
          <th
            :class="deadlineClass"
            :style="deadlineStyle"
            v-text="this.getStamp(task.deadline)"
          />
        </tr>
        <tr v-else-if="field.key === 'closeReason' && isCloseReasonVisible(task)" data-tour="tasks-task-close-reason">
          <th class="small-text text-grey row-label" v-text="'Причина закрытия: '"/>
          <th
            :class="closeReasonClass"
            :title="getCloseReason(task)"
            v-text="getShortCloseReason(task)"
          />
        </tr>
        <tr v-else-if="field.key === 'sla' && isSlaVisible(task)" data-tour="tasks-task-sla">
          <th
            class="small-text text-grey"
            :class="fieldHighlightClass('sla')"
            style="color:var(--app-text-muted, #9e9e9e)"
          >
            SLA осталось:
            <q-tooltip>Регламентное время на решение заявки по договору с клиентом. После истечения заявка считается просроченной.</q-tooltip>
          </th>
          <th class="text-body2"
              :class="fieldHighlightClass('sla')"
              style="display: flex; flex-direction: row; flex-wrap: wrap; align-items: center">
            {{ this.getSlaTime(task) }}
            <div
              class="sla-pill app-task-card-sla-pill"
              :class="{ 'sla-pill--expired': isSlaExpired(task) }"
            >
              <q-linear-progress
                stripe
                rounded
                :value="this.getSlaPercent(task)"
                reverse
                :color="isSlaExpired(task) ? 'negative' : getSlaColor(task)"
                :track-color="isSlaExpired(task) ? 'negative-2' : 'grey-3'"
                class="sla-bar"
                size="12px"
                :animation-speed="0"
              />
            </div>
            <div v-if="this.$route.path.includes('chat')">
              <q-btn
                v-if="slaInfo && !slaInfo.paused"
                dense
                flat
                color="grey"
                :loading="slaActionLoading"
                :disable="slaActionLoading"
                @click.stop="pauseSla()"
                icon="pause_circle"
              />
              <q-btn
                v-if="slaInfo && slaInfo.paused"
                dense
                flat
                color="grey"
                :loading="slaActionLoading"
                :disable="slaActionLoading"
                @click.stop="resumeSla()"
                icon="play_circle"
              />
            </div>
          </th>
        </tr>
        <tr v-else-if="field.key === 'lastActivity'" data-tour="tasks-task-last-activity">
          <th class="small-text text-grey row-label" :class="fieldHighlightClass('lastActivity')" v-text="'Последнее действие: '"/>
          <th :class="lastActivityClass" v-text="getLastTaskHistoryTime(task)"/>
        </tr>
      </template>
    </table>
    <slot name="taskControl"></slot>
  </div>
</template>

<script>
import CircleCounter from 'components/CircleCounter.vue'
import { useStore } from 'stores/store'
import { useSlaInfo } from 'src/composables/useSlaInfo'
import taskCardSlaMixin from 'components/task-card/taskCardSlaMixin'
import taskCardViewMixin from 'components/task-card/taskCardViewMixin'

// Карточка заявки в списках. Форматтеры, подсветка и css-классы строк — taskCardViewMixin,
// SLA (загрузка, таймер, пауза) — taskCardSlaMixin; чистые функции — src/util/taskCard/*.
export default {
  name: 'TaskCard',

  props: ['task', 'selectedGroupType', 'selectedSorting', 'descriptionRequire', 'slaRequire', 'taskNameShort', 'isOnboardingDemo'],

  components: { CircleCounter },

  mixins: [taskCardViewMixin, taskCardSlaMixin],

  setup () {
    const store = useStore()
    const slaScope = useSlaInfo()
    return { store, slaScope }
  }

}
</script>

<style scoped>
th {
  text-align: left;
}

.truncate {
  max-width: 200px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.task-card {
  display: flex;
  flex-direction: column;
  width: 100%;
  position: relative;
}

.task-card-header {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  flex-wrap: nowrap;
  position: relative;
  align-items: center;
  height: 23px;
}

.task-card-header-left {
  display: flex;
  flex-wrap: nowrap;
  overflow: hidden;
  white-space: nowrap;
  width: 70%;
  align-items: center;
}

.task-card-title {
  display: flex;
  align-items: center;
  min-width: 0;
  flex: 1;
  overflow: hidden;
}

.task-id {
  margin-right: 8px;
  margin-left: 3px;
  font-size: 14px; /* Увеличен размер текста для ID */
  color: var(--app-text-muted, grey);
  flex-shrink: 0;
}

.task-card-name {
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
  font-size: 14px; /* Уменьшен размер текста для названия */
}

.task-card-status-container {
  position: absolute;
  top: 0;
  right: 0;
}

#task-card-status {
  border-style: solid;
  background-color: rgba(148, 121, 255, 0.2);
  border-width: 1px;
  border-radius: 4px;
  border-color: var(--q-primary);
  color: var(--q-primary);
  padding-left: 4px;
  padding-right: 4px;
}

.status-completed {
  background-color: rgba(16, 181, 92, 0.2) !important;
  color: var(--app-success-text, rgba(16, 181, 92, 1)) !important;
  border-color: rgba(16, 181, 92, 1) !important;
}

.status-frozen {
  background-color: rgba(50, 173, 230, 0.2) !important;
  color: var(--app-info-text, rgba(50, 173, 230, 1)) !important;
  border-color: rgba(50, 173, 230, 1) !important;
}

.status-active {
  /* Default styling for active status */
}

.small-text {
  font-size: 14px; /* Восстановлен размер для small-text */
  color: var(--app-text-muted, grey);
}

.text-grey {
  color: var(--app-text-muted, grey);
}

.truncate {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.executor {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  width: 79%;
  display: block;
}

.task-close-reason {
  display: block;
  max-width: 260px;
  white-space: normal;
  overflow: hidden;
  text-overflow: ellipsis;
  overflow-wrap: anywhere;
  word-break: break-word;
  line-height: 1.35;
}

.highlighted {
  color: var(--app-text, black);
  font-weight: 600;
}

.task-card-field-highlighted {
  font-weight: 700 !important;
}

.row-label {
  padding-right: 8px;
}

.sla-pill--expired {
  border-color: red;
}

.sla-bar {
  width: 100%;
  border: 1px solid var(--app-border, rgba(0, 0, 0, 0.12));
  border-radius: 999px;
  box-sizing: border-box;
  overflow: hidden;
}

.task-card-checklist-progress-row {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.task-card-checklist-progress {
  width: 70px;
  flex: 0 0 70px;
  border: 1px solid var(--app-border, rgba(0, 0, 0, 0.12));
  border-radius: 999px;
  box-sizing: border-box;
  overflow: hidden;
}

/* место под угол «Перейти в чат», чтобы он не перекрывал статус */
.task-card--with-chat-link .task-card-status-container {
  right: 14px;
}
</style>
