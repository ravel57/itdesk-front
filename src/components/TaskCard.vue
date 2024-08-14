<template>
  <div id="task-card" class="task-card">
    <slot name="chatLink"></slot>
    <div class="task-card-header">
      <div class="task-card-header-left">
        <slot name="checkBox"></slot>
        <div class="task-id">№{{ this.task.id }}</div>
        <div id="task-card-name" class="text-body2 task-card-name">{{ task.name }}</div>
      </div>
      <div class="task-card-status-container">
        <div
          id="task-card-status"
          :class="taskStatusClass"
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
      <tr v-if="this.descriptionRequire">
        <th class="small-text text-grey row-label" v-text="'Описание: '" />
        <th
          :class="descriptionClass"
          v-text="task.description.length === 0 ? '-' : task.description"
        />
      </tr>
      <tr>
        <th class="small-text text-grey row-label" v-text="'Теги: '" />
        <th
          :class="tagsClass"
          v-text="task.tags.map(tag => tag.name).length === 0 ? '-' : task.tags.map(tag => tag.name).join(', ')"
        />
      </tr>
      <tr>
        <th
          class="small-text text-grey row-label"
          :class="{'highlighted': this.selectedSorting.slug === 'priority'}"
          v-text="'Приоритет: '"
        />
        <th
          :class="priorityClass"
          v-text="task.priority.name"
        />
      </tr>
      <tr>
        <th class="small-text text-grey row-label" v-text="'Исполнитель: '" />
        <th
          :class="executorClass"
          v-text="task.executor ? getName(task.executor) : '-'"
        />
      </tr>
      <tr>
        <th
          class="small-text text-grey row-label"
          :class="{'highlighted': this.selectedSorting.slug === 'creating'}"
          v-text="'Создана: '"
        />
        <th
          :class="createdAtClass"
          v-text="this.getStamp(task.createdAt)"
        />
      </tr>
<!--      <tr v-if="!task.completed">-->
<!--        <th-->
<!--          class="small-text text-grey"-->
<!--          :style="this.selectedSorting.slug === 'status' ? 'color: black;font-weight: 600;': 'color:gray'"-->
<!--          v-text="'Статус: '"-->
<!--        />-->
<!--        <th-->
<!--          class="text-body2"-->
<!--          :style="this.selectedSorting.slug === 'status' ? 'font-weight: 600;': ''"-->
<!--          v-text="task.status.name"/>-->
<!--      </tr>-->
      <tr>
        <th
          class="small-text text-grey row-label"
          :class="{'highlighted': this.selectedSorting.slug === 'deadline'}"
          v-text="'Дедлайн: '"
        />
        <th
          :class="deadlineClass"
          :style="deadlineStyle"
          v-text="task.deadline ? this.getStamp(task.deadline) : '-'"
        />
      </tr>
      <!--    <tr v-if="task.sla && task.sla.duration > 0 && !task.completed && this.slaRequire">-->
      <!--      <th-->
      <!--        class="small-text"-->
      <!--        :style="this.selectedSorting.slug === 'sla' ? 'color: black;font-weight: 600;': 'color:gray'"-->
      <!--        v-text="'SLA: '"-->
      <!--      />-->
      <!--      <th class="text-body2"-->
      <!--          :style="this.selectedSorting.slug === 'sla' ? 'font-weight: 600;': ''"-->
      <!--          style="display: flex; flex-direction: row; flex-wrap: wrap; align-items: center">-->
      <!--        Осталось: {{ this.getSlaTime(task) }}-->
      <!--        <q-linear-progress-->
      <!--          stripe-->
      <!--          rounded-->
      <!--          :value="this.getSlaPercent(task)"-->
      <!--          reverse-->
      <!--          :color="this.getSlaColor(task)"-->
      <!--          style="width: 80px; margin-left: 16px; margin-right: 5px; border: solid 1px darkgray"-->
      <!--          size="12px"-->
      <!--        />-->
      <!--        <q-btn-->
      <!--          v-if="!this.slaIsPause"-->
      <!--          dense-->
      <!--          flat-->
      <!--          color="grey"-->
      <!--          @click.stop="this.slaIsPause = !this.slaIsPause"-->
      <!--          icon="pause_circle"-->
      <!--        />-->
      <!--        <q-btn-->
      <!--          v-if="this.slaIsPause"-->
      <!--          dense-->
      <!--          flat-->
      <!--          color="grey"-->
      <!--          @click.stop="this.slaIsPause = !this.slaIsPause"-->
      <!--          icon="play_circle"-->
      <!--        />-->
      <!--      </th>-->
      <!--    </tr>-->
      <tr v-if="!this.$route.path.includes('chat')">
        <th class="small-text text-grey row-label" v-text="'Последняя активность: '" />
        <th :class="lastActivityClass" v-text="this.getStamp(new Date(task.client.lastMessage.date))" />
      </tr>
    </table>
    <slot name="taskControl"></slot>
  </div>
</template>

<script>
import moment from 'moment/moment'

export default {
  name: 'TaskCard',
  props: ['task', 'selectedSorting', 'descriptionRequire', 'slaRequire', 'taskNameShort'],
  data: () => ({
    slaIsPause: false
  }),
  methods: {
    getStamp (date) {
      if (date) {
        return date.toLocaleTimeString('ru-RU', {
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          year: 'numeric',
          month: 'numeric',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      } else {
        return ''
      }
    },

    getName (executor) {
      if (executor) {
        return executor.lastname + ' ' + executor.firstname
      } else {
        return ''
      }
    },

    getSlaHours (task) {
      const endDateTime = task.sla.startDate.clone().add(task.sla.duration)
      const now = moment()
      const duration = moment.duration(endDateTime.diff(now))
      return duration.days() * 24 + duration.hours() + duration.minutes() * 0.017
    },

    getSlaTime (task) {
      const endDateTime = task.sla.startDate.clone().add(task.sla.duration)
      const now = moment()
      const duration = moment.duration(endDateTime.diff(now))
      if (duration.asMilliseconds() < 0) {
        return '0 ч. 0 м.'
      } else {
        return `${duration.days() * 24 + duration.hours()} ч. ${duration.minutes()} м.`
      }
    },

    getSlaPercent (task) {
      return this.getSlaHours(task) / (task.sla.duration.days() * 24 + task.sla.duration.hours())
    },

    getSlaColor (task) {
      if (this.getSlaPercent(task) > 0.5) {
        return 'green'
      } else if (this.getSlaPercent(task) > 0.25) {
        return 'orange'
      } else {
        return 'red'
      }
    },

    shortenLine (string) {
      if (string.length > this.taskNameShort) {
        return string.substring(0, this.taskNameShort) + '...'
      } else {
        return string
      }
    }
  },

  computed: {
    taskStatusClass () {
      if (this.task.completed) {
        return 'status-completed'
      } else if (this.task.frozen) {
        return 'status-frozen'
      } else {
        return 'status-active'
      }
    },
    descriptionClass () {
      return {
        'text-body2': true,
        'text-grey': this.task.completed,
        truncate: true
      }
    },
    tagsClass () {
      return {
        'text-body2': true,
        'text-grey': this.task.completed,
        truncate: true
      }
    },
    priorityClass () {
      return {
        'text-body2': true,
        'text-grey': this.task.completed,
        highlighted: this.selectedSorting.slug === 'priority'
      }
    },
    executorClass () {
      return {
        'text-body2': true, // small size for executor text
        'text-grey': this.task.completed,
        executor: true
      }
    },
    createdAtClass () {
      return {
        'text-body2': true,
        'text-grey': this.task.completed,
        highlighted: this.selectedSorting.slug === 'creating'
      }
    },
    deadlineClass () {
      return {
        'text-body2': true,
        'text-grey': this.task.completed,
        highlighted: this.selectedSorting.slug === 'deadline'
      }
    },
    lastActivityClass () {
      return {
        'text-body2': true,
        'text-grey': this.task.completed
      }
    },
    deadlineStyle () {
      return {
        color: this.task.deadline && this.task.deadline < Date.now() ? 'red' : 'black',
        fontWeight: this.selectedSorting.slug === 'deadline' ? '600' : 'normal'
      }
    }
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

.task-id {
  margin-right: 8px;
  margin-left: 3px;
  font-size: 14px; /* Увеличен размер текста для ID */
  color: grey;
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
  color: rgba(16, 181, 92, 1) !important;
  border-color: rgba(16, 181, 92, 1) !important;
}

.status-frozen {
  background-color: rgba(50, 173, 230, 0.2) !important;
  color: rgba(50, 173, 230, 1) !important;
  border-color: rgba(50, 173, 230, 1) !important;
}

.status-active {
  /* Default styling for active status */
}

.small-text {
  font-size: 14px; /* Восстановлен размер для small-text */
  color: grey;
}

.text-grey {
  color: grey;
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

.highlighted {
  color: black;
  font-weight: 600;
}

.row-label {
  padding-right: 8px;
}
</style>
