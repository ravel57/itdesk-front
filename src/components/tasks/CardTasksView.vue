<template>
  <div
    v-for="(taskList, index) in this.groupedTasks"
    :key="taskList.groupKey || taskList.title || index"
    class="list"
    :data-tour="index === 0 ? 'tasks-board-column' : null"
  >
    <div
      class="list-header sticky-tabs"
      :data-tour="index === 0 ? 'tasks-column-header' : null"
      style="display: flex;align-content: center;align-items: center"
      :style="`background-color: hsl(${360 / this.groupedTasks.length * (this.groupedTasks.length - index)}deg 85% 40%);`"
    >
      <label
        v-if="taskList.taskCards && !this.isObserverUser"
        class="custom-checkbox"
        :data-tour="index === 0 ? 'tasks-group-select' : null"
      >
        <input
          v-if="taskList.taskCards"
          :id="`col-checkbox-${index}`"
          class="hidden-checkbox"
          type="checkbox"
          :checked="isGroupChecked(taskList.taskCards)"
          :disabled="this.isOnboardingDemo"
          @click.stop="toggleGroupTasks(taskList.taskCards, $event.target.checked)"
        >
        <span class="checkmark"></span>
      </label>
      <span class="list-header-title" :title="taskList.title">{{ taskList.title }}</span>
    </div>
    <div
      class="list-cards"
    >
      <q-item
        v-for="(task, taskIndex) in taskList.taskCards"
        :key="task.id || taskIndex"
        class="task-card-frame no-padding"
        :data-tour="index === 0 && taskIndex === 0 ? 'tasks-task-card' : null"
      >
        <q-item
          clickable
          class="task-card-clickable"
          @click="handleTaskClick(task)"
        >
          <task-card
            class="task-card"
            :task="task"
            :selectedGroupType="this.selectedGroupType"
            :descriptionRequire="false"
            :slaRequire="true"
            :taskNameShort="22"
            :isOnboardingDemo="this.isOnboardingDemo"
          >
            <!--:slaRequire="false"-->
            <template v-slot:checkBox>
              <label
                v-if="!this.isObserverUser"
                @click.stop
                class="custom-checkbox"
                :data-tour="index === 0 && taskIndex === 0 ? 'tasks-task-select' : null"
              >
                <input
                  :id="`radio_${task.id}_${taskIndex}`"
                  class="hidden-checkbox"
                  type="checkbox"
                  style="margin-left: 4px;height: 20px;width: 20px;margin-right: 8px;"
                  v-model="checkedTasks[task.id]"
                  :disabled="this.isOnboardingDemo || task.__onboardingDemo"
                  @click.stop
                >
                <span class="checkmark"></span>
              </label>
            </template>
            <template v-slot:chatLink>
              <a
                :href="this.getChatLink(task.client.id)"
                @click.stop="handleChatLinkClick($event, task)"
              >
                <div
                  :id="`link_to_chat_${task.id}_${taskIndex}`"
                  class="link-to-chat-container"
                  :class="{ 'link-to-chat-container--visible': this.isOnboardingDemo || task.__onboardingDemo }"
                  :data-tour="index === 0 && taskIndex === 0 ? 'tasks-chat-link' : null"
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

  props: ['groupedTasks', 'selectedGroupType', 'selectedSorting', 'isOnboardingDemo'],

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
      if (this.isObserverUser || this.isOnboardingDemo) {
        return
      }
      taskCards.forEach(task => {
        this.checkedTasks[task.id] = isChecked
      })
      this.updateSelectedTasks()
    },

    updateSelectedTasks () {
      if (this.isObserverUser || this.isOnboardingDemo) {
        if (this.isObserverUser && this.store.checkedTasks.length > 0) {
          this.store.checkedTasks = []
        }
        return
      }
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
    },

    handleTaskClick (task) {
      if (this.isOnboardingDemo || task?.__onboardingDemo) {
        return
      }
      this.$emit('onTaskClicked', task)
    },

    handleChatLinkClick (event, task) {
      if (this.isOnboardingDemo || task?.__onboardingDemo) {
        event.preventDefault()
      }
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
    },

    isObserverUser () {
      return Array.isArray(this.store.currentUser?.authorities) &&
        this.store.currentUser.authorities.includes('OBSERVER')
    }
  },

  created () {
    if (this.isObserverUser) {
      this.store.checkedTasks = []
      this.checkedTasks = {}
      return
    }
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

.list-header-title {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.list-cards {
  width: 440px;
  padding: 10px;
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-gutter: stable;
}

.task-card-frame {
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  flex: 0 0 auto;
  margin-top: 8px;
  overflow: hidden;
  border: 1px solid var(--q-primary);
  border-radius: 4px;
}

.task-card-clickable {
  width: 100%;
  max-width: 100%;
  min-width: 0;
  box-sizing: border-box;
  padding: 8px;
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

.link-to-chat-container--visible {
  display: unset;
}

.task-card:hover {
  .link-to-chat-container {
    display: unset;
  }
}

</style>
