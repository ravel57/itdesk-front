<template>
  <div
    v-for="(taskList, index) in this.groupedTasks"
    :key="index"
    class="list"
  >
    <div
      class="list-header sticky-tabs"
      :style="`background-color: hsl(${360 / this.groupedTasks.length * (this.groupedTasks.length - index)}deg 85% 40%);`"
      v-text="taskList.title"
    />
    <div
      class="list-cards"
    >
      <q-item
        v-for="(task, taskIndex) in taskList.taskCards"
        :key="taskIndex"
        style="border-style: solid;border-width: 0.01em;border-radius: 4px; border-color: var(--q-primary); margin-top: 8px; max-width: 420px;width: 420px;"
        class="no-padding"
      >
        <q-item
          clickable
          style="padding: 8px;max-width: 420px;width: 420px;overflow: hidden"
          @click="this.$emit('onTaskClicked', task)"
        >
          <task-card
            :task="task"
            :selectedSorting="this.selectedGroupType"
            :descriptionRequire="false"
            :slaRequire="false"
            :taskNameShort="22"
          >
            <template v-slot:checkBox>
              <input
                v-if="!task.completed"
                :id="`radio_${task.id}_${taskIndex}`"
                class="radio-select"
                type="checkbox"
                style="margin-bottom: 8px;margin-left: 4px;"
                v-model="checkedTasks[task.id]"
                @click.stop
              >
            </template>
            <template v-slot:chatLink>
              <a
                style="font-size: 15px;color: var(--q-primary);text-decoration: none;margin-left: 3px;"
                :href="this.getChatLink(task.client.id)"
              >
                <q-icon name="assignment_ind"/>
                Перейти в чат
              </a>
            </template>
          </task-card>
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

  computed: {
    storeCheckedTasks () {
      return this.store.checkedTasks
    }
  },

  watch: {
    checkedTasks: {
      handler () {
        this.updateSelectedTasks()
      },
      deep: true
    },
    storeCheckedTasks: {
      handler () {
        if (this.storeCheckedTasks.length === 0 && this.checkedTasks.length !== 0) {
          this.checkedTasks = []
        }
      },
      deep: true
    }
  },

  methods: {
    updateSelectedTasks () {
      this.store.checkedTasks = Object.entries(this.checkedTasks)
        .filter(([id, checked]) => checked)
        .map(([id]) => {
          return this.groupedTasks
            .flatMap(group => group.taskCards ? group.taskCards : [])
            .find(task => task.id === Number(id))
        })
        .filter(task => task !== undefined)
    },

    getChatLink (id) {
      const origin = window.location.origin
      return `${origin}/chats/${id}`
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
  width: 440px;
  margin-right: 20px;
}

.sticky-tabs {
  position: sticky;
  top: 0;
  z-index: 1;
}

.list-header {
  border-radius: 5px;
  width: 440px;
  max-width: 440px;
  color: white;
  background-color: var(--q-primary);
  padding: 10px;
  font-weight: bold;
}

.list-cards {
  width: 440px;
  padding: 10px;
}

.radio-select {
  width: 20px;
  height: 20px;
  accent-color: var(--q-primary);
}

</style>
