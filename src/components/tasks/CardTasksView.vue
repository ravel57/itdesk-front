<template>
  <div
    v-for="(taskList, index) in this.groupedTasks"
    :key="index"
    class="list"
  >
    <div
      class="list-header sticky-tabs"
      style="display: flex;align-content: center;"
      :style="`background-color: hsl(${360 / this.groupedTasks.length * (this.groupedTasks.length - index)}deg 85% 40%);`"
    >
      <input
        v-if="taskList.taskCards"
        :id="`col-checkbox-${index}`"
        class="radio-select"
        type="checkbox"
        style="margin-right: 8px;height: 20px;width: 20px;"
        :checked="isGroupChecked(taskList.taskCards)"
        @click.stop="toggleGroupTasks(taskList.taskCards, $event.target.checked)"
      >
      {{ taskList.title }}
    </div>
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
            class="task-card"
            :task="task"
            :selectedSorting="this.selectedGroupType"
            :descriptionRequire="false"
            :slaRequire="false"
            :taskNameShort="22"
          >
            <template v-slot:checkBox>
              <input
                :id="`radio_${task.id}_${taskIndex}`"
                class="radio-select"
                type="checkbox"
                style="margin-left: 4px;height: 20px;width: 20px;margin-right: 8px;"
                v-model="checkedTasks[task.id]"
                @click.stop
              >
            </template>
            <template v-slot:chatLink>
              <a :href="this.getChatLink(task.client.id)" @click.stop>
                <div
                  :id="`link_to_chat_${task.id}_${taskIndex}`"
                  class="link-to-chat-container"
                >
                  <div class="link-container">
                    <q-icon class="link" color="white" name="open_in_new"/>
                  </div>
                </div>
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
    colCheckbox: {}
  }),

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
    toggleGroupTasks (taskCards, isChecked) {
      taskCards.forEach(task => {
        this.checkedTasks[task.id] = isChecked
      })
      this.updateSelectedTasks()
    },

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

  computed: {
    isGroupChecked () {
      return (taskCards) => {
        if (taskCards) {
          return taskCards.every(task => this.checkedTasks[task.id])
        }
      }
    },

    storeCheckedTasks () {
      return this.store.checkedTasks
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
  z-index: 2;
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
  min-width: 20px;
  width: 20px;
  height: 20px;
  accent-color: var(--q-primary);
}

.link-to-chat-container {
  background-color: var(--q-primary);
  display: none;
  height: 60px;
  overflow: hidden;
  position: absolute;
  right: -38px;
  top: -38px;
  transform: rotate(45deg);
  transition: transform .3s ease;
  width: 60px;
  z-index: 1;
}

.link-container {
  color: var(--q-primary);
  display: flex;
  font-size: 15px;
  margin-left: 3px;
  padding: 0;
  text-decoration: none;
  transition: transform .3s ease;
  width: 50%;
  position: absolute;
  right: 25%;
  bottom: 0;
  height: 50%;
}

.link {
  position: absolute;
  height: 100%;
  width: 100%;
  transform: rotate(-45deg);
}

.link-to-chat-container:hover {
  transform: rotate(45deg) scale(1.2);
}

.task-card:hover {
  .link-to-chat-container {
    display: unset;
  }
}

</style>
