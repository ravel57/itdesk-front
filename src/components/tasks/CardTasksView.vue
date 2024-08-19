<template>
  <div
    v-for="(taskList, index) in this.groupedTasks"
    :key="index"
    class="list"
  >
    <div
      class="list-header sticky-tabs"
      style="display: flex;align-content: center;align-items: center"
      :style="`background-color: hsl(${360 / this.groupedTasks.length * (this.groupedTasks.length - index)}deg 85% 40%);`"
    >
      <label v-if="taskList.taskCards" class="custom-checkbox">
        <input
          v-if="taskList.taskCards"
          :id="`col-checkbox-${index}`"
          class="hidden-checkbox"
          type="checkbox"
          :checked="isGroupChecked(taskList.taskCards)"
          @click.stop="toggleGroupTasks(taskList.taskCards, $event.target.checked)"
        >
        <span class="checkmark"></span>
      </label>
      {{ taskList.title }}
    </div>
    <div
      class="list-cards"
    >
      <q-item
        v-for="(task, taskIndex) in taskList.taskCards"
        :key="taskIndex"
        style="
         border-style: solid;
         border-width: 0.01em;
         border-radius: 4px;
         border-color: var(--q-primary);
         margin-top: 8px;
         max-width: 420px;
         width: 420px;
         overflow: hidden
        "
        class="no-padding"
      >
        <q-item
          clickable
          style="padding: 8px;max-width: 420px;width: 420px;"
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
              <label @click.stop class="custom-checkbox">
                <input
                  :id="`radio_${task.id}_${taskIndex}`"
                  class="hidden-checkbox"
                  type="checkbox"
                  style="margin-left: 4px;height: 20px;width: 20px;margin-right: 8px;"
                  v-model="checkedTasks[task.id]"
                  @click.stop
                >
                <span class="checkmark"></span>
              </label>
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
  display: flex;
  flex-direction: column;
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
  overflow-y: scroll;
  overflow-x: hidden;
}

.hidden-checkbox {
  display: none;
}

.custom-checkbox {
  display: inline-block;
  position: relative;
  cursor: pointer;
  font-size: 16px;
  user-select: none;
  height: 20px;
  margin-right: 8px;
}

.checkmark {
  display: inline-block;
  width: 20px;
  height: 20px;
  background-color: white;
  border: 1px solid #d0cbcb;
  border-radius: 30%;
  position: relative;
  transition: background-color 0.2s, border-color 0.2s;
}

.hidden-checkbox:checked + .checkmark {
  background-color: var(--q-primary);
  border-color: var(--q-primary);
}

.checkmark:after {
  content: "";
  position: absolute;
  width: 100%;
  height: 100%;
  display: none;
}

.hidden-checkbox:checked + .checkmark:after {
  display: block;
  left: 7px;
  top: 3px;
  width: 5px;
  height: 10px;
  border: solid #fff;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
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
