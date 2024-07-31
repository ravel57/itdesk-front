<template>
  <table
    @click="this.$emit('onTaskClicked', this.task)"
  >
    <tr v-if="task.completed">
      <th
        class="small-text text-grey"
        v-text="'ЗАЯВКА ЗАКРЫТА'"
        colspan="2"
      />
    </tr>
    <tr v-if="task.frozen">
      <th
        class="small-text text-grey"
        colspan="2"
      >
        <q-icon
          name="ac_unit"
        />
        ЗАЯВКА ЗАМОРОЖЕНА
      </th>
    </tr>
    <tr>
      <th
        class="small-text text-grey"
        v-text="'ID заявки'"
      />
      <th
        :class="{'text-body2': true, 'text-grey': task.completed}"
        v-text="task.id"
      />
    </tr>
    <tr>
      <th
        class="small-text text-grey"
        v-text="'Название: '"
      />
      <th
        :class="{'text-body2': true, 'text-grey': task.completed}"
        v-text="this.shortenLine(task.name)"
      />
    </tr>
    <tr v-if="this.descriptionRequire">
      <th
        class="small-text text-grey"
        v-text="'Описание: '"
      />
      <th
        :class="{'text-body2': true, 'text-grey': task.completed}"
        v-text="task.description"
      />
    </tr>
    <tr>
      <th
        class="small-text text-grey"
        v-text="'Теги: '"
      />
      <th
        :class="{'text-body2': true, 'text-grey': task.completed}"
        v-text="task.tags.map(tag => tag.name).length === 0 ? '-' : task.tags.map(tag => tag.name).join(', ')"
      />
    </tr>
    <tr>
      <th
        class="small-text text-grey"
        :style="this.selectedSorting.slug === 'priority' ? 'color: black;font-weight: 600;': 'color:gray'"
        v-text="'Приоритет: '"
      />
      <th
        :class="{'text-body2': true, 'text-grey': task.completed}"
        :style="this.selectedSorting.slug === 'priority' ? 'font-weight: 600;': ''"
        v-text="task.priority.name"
      />
    </tr>
    <tr>
      <th
        class="small-text text-grey"
        :style="this.selectedSorting.slug === 'creating' ? 'color: black;font-weight: 600;': 'color:gray'"
        v-text="'Создана: '"
      />
      <th
        :class="{'text-body2': true, 'text-grey': task.completed}"
        :style="this.selectedSorting.slug === 'creating' ? 'font-weight: 600;': ''"
        v-text="this.getStamp(task.createdAt)"/>
    </tr>
    <tr v-if="!task.completed">
      <th
        class="small-text text-grey"
        :style="this.selectedSorting.slug === 'status' ? 'color: black;font-weight: 600;': 'color:gray'"
        v-text="'Статус: '"
      />
      <th
        class="text-body2"
        :style="this.selectedSorting.slug === 'status' ? 'font-weight: 600;': ''"
        v-text="task.status.name"/>
    </tr>
    <tr>
      <th
        class="small-text text-grey"
        :style="this.selectedSorting.slug === 'deadline' ? 'color: black;': 'color:gray'"
        v-text="'Дедлайн: '"
      />
      <th
        class="text-body2"
        :style="`color: ${task.deadline < Date.now() ? 'red' : 'black'}; ${selectedSorting.slug === 'deadline' ? 'font-weight: 600;' : ''}`"
        v-text="this.getStamp(task.deadline)"
      />
    </tr>
    <tr>
      <th class="small-text text-grey" v-text="'Исполнитель: '"/>
      <th :class="{'text-body2': true, 'text-grey': task.completed}" v-text="getName(task.executor)"/>
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
<!--      FIXME-->
      <th class="small-text text-grey" v-text="'Последняя активность: '"/>
      <th :class="{'text-body2': true, 'text-grey': task.completed}" v-text="this.getStamp(new Date(task.client.lastMessage.date))"/>
    </tr>
  </table>
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
  }
}
</script>

<style scoped>
th {
  text-align: left;
}
</style>
