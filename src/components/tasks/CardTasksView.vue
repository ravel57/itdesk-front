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
        v-for="(task, taskIndex) in taskList.taskCards"
        :key="taskIndex"
        class="no-padding"
      >
        <q-item
          class="card"
          clickable
          @click="this.$emit('onTaskClicked', task)"
        >
          <input
            :id="`radio_${task.id}_${taskIndex}`"
            class="radio-select"
            type="checkbox"
            v-model="checkedTasks[task.id]"
            @click.stop
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
import { useStore } from 'stores/store'

export default {

  components: { TaskCard },

  name: 'CardTasksView',

  props: ['groupedTasks', 'selectedGroupType'],

  data: () => ({
    checkedTasks: {},
    selectedTasks: []
  }),

  watch: {
    checkedTasks: {
      handler () {
        this.updateSelectedTasks()
      },
      deep: true
    },
    selectedTasks: {
      handler () {
        this.store.checkedTasks = this.selectedTasks
      },
      deep: true
    }
  },

  methods: {
    updateSelectedTasks () {
      this.selectedTasks = Object.entries(this.checkedTasks)
        .filter(([id, checked]) => checked)
        .map(([id]) => this.groupedTasks.flatMap(group => group.taskCards).find(task => task.id === Number(id)))
        .filter(task => task !== undefined)
    }
  },

  created () {
    this.checkedTasks = this.store.checkedTasks.reduce((acc, task) => {
      acc[task.id] = true
      return acc
    }, {})
  },

  setup () {
    const store = useStore()
    return { store }
  }
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

.radio-select {
  width: 20px;
  height: 20px;
  accent-color: var(--q-primary);
}

</style>
