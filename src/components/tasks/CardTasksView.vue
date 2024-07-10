<template>
  <div
    v-for="(taskList, index) in this.groupedTasks"
    :key="index"
    class="list"
  >
    <div
      class="list-header sticky-tabs"
      v-text="taskList.title"
    />
    <div
      class="list-cards"
    >
      <q-item
        v-for="(task, index) in taskList.taskCards"
        :key="index"
        class="no-padding"
      >
        <q-item
          class="card"
          clickable
          @click="this.$emit('onTaskClicked', task)"
        >
          <task-card
            :task="task"
            :selectedSorting="this.selectedGroupType"
            :descriptionRequire="false"
            :slaRequire="false"
            :taskNameShort="14"
          />
        </q-item>
      </q-item>
    </div>
  </div>
</template>

<script>
import TaskCard from 'components/TaskCard.vue'

export default {

  components: { TaskCard },

  name: 'CardTasksView',

  props: ['groupedTasks', 'selectedGroupType']

}
</script>

<style scoped>

</style>
