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

.list {
  display: inline-block;
  vertical-align: top;
  width: 300px;
  margin-right: 20px;
}

.sticky-tabs {
  position: sticky;
  top: 0;
  z-index: 1;
}

.list-header {
  border-radius: 5px;
  width: 300px;
  color: white;
  background-color: var(--q-primary);
  padding: 10px;
  font-weight: bold;
}

.list-cards {
  padding: 10px;
}

.card {
  border-radius: 5px;
  background-color: #fff;
  border: 1px solid #ccc;
  margin-bottom: 10px;
  padding: 10px;
  width: 300px;
  display: inline-block;
  text-decoration: none;
  color: black;
}

</style>
