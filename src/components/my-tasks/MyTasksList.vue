<template>
  <div class="app-inline app-padding-16">
    <div
      v-if="this.isInitialLoading"
      class="absolute-center text-grey-6"
    >
      Загружаю заявки...
    </div>

    <div
      v-else-if="this.tasks.length > 0"
      data-my-tasks-tour="task-list"
      style="display: flex; flex-wrap: wrap; flex-direction: row"
      :style="this.isMobile ? 'justify-content: center;' : 'justify-content: start;'"
    >
      <q-item
        v-for="(task, index) in this.tasks"
        :key="task.id"
        :data-my-tasks-tour="index === 0 ? 'task-card' : index === 1 ? 'second-task-card' : null"
        :class="{ 'my-tasks-demo-task-card': task.__demo && index === 0 }"
        style="border-style: solid;border-width: 0.01em;border-radius: 4px; border-color: var(--q-primary); margin-top: 8px; max-width: 420px;width: 100%;margin-right: 20px"
        clickable
        class="no-padding"
      >
        <q-item
          clickable
          style="padding: 8px;max-width: 420px;width: 420px;overflow: hidden"
          @click="$emit('task-click', task)"
        >
          <task-card
            class="task-card"
            :task="task"
            :descriptionRequire="false"
            :slaRequire="true"
            :task-name-short="20"
            :selected-sorting="''"
            @onTaskClicked="$emit('task-click', $event)"
          >
            <!--:slaRequire="false"-->
            <template v-slot:chatLink>
              <a
                :href="this.getChatLink(task.client.id, task)"
                @click.stop.prevent="$emit('chat-link-click', task, $event)"
              >
                <div
                  :id="`link_to_chat_${task.id}_${index}`"
                  :data-my-tasks-tour="index === 0 ? 'chat-link' : null"
                  class="link-to-chat-container app-shared-link-to-chat-container"
                >
                  <div class="link-container app-shared-link-container">
                    <q-icon class="link app-shared-link" color="white" name="open_in_new"/>
                    <q-tooltip>Открыть чат с клиентом по этой заявке</q-tooltip>
                  </div>
                </div>
              </a>
            </template>
          </task-card>
        </q-item>
      </q-item>
    </div>

    <div
      v-if="!this.onboardingActive && this.tasks.length > 0"
      class="text-grey-6 text-center q-py-md full-width"
    >
      <div v-if="this.pageLoading">
        Загружаю заявки...
      </div>
      <div v-else-if="!this.pageIsEnd">
        Прокрутите ниже, чтобы загрузить ещё
      </div>
      <div v-else>
        Показано {{ this.tasks.length }} из {{ this.totalElements }}
      </div>
    </div>

    <div
      v-else-if="this.showPlaceholder"
      class="absolute-center"
    >
      <div class="app-inline app-row-center">
        <div class="app-inline app-width-140">
          <div class="app-inline app-font-size-20">
            Заявок нет
          </div>
          <div class="app-inline app-font-size-14">
            Возможно стоит создать их
          </div>
          <div class="app-inline app-font-size-14">
            <a class="app-inline app-color-primary"  href="/chats">Проверьте чаты.</a>
          </div>
        </div>
        <div class="app-inline app-column-center">
          <no-tasks-placeholder/>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import TaskCard from 'components/TaskCard.vue'
import NoTasksPlaceholder from 'components/NoTasksPlaceholder.vue'
import {getMyTaskChatLink} from 'src/util/myTasks/myTasksPaging'

// Область содержимого страницы «Мои заявки»: «Загружаю заявки...», сетка карточек заявок со ссылкой в чат,
// подвал подгрузки и заглушка «Заявок нет». Состояние и загрузка — на странице, сюда приходят пропсы.
export default {
  name: 'MyTasksList',

  components: {NoTasksPlaceholder, TaskCard},

  props: {
    tasks: {type: Array, default: () => []},
    isInitialLoading: {type: Boolean, default: false},
    isMobile: {type: Boolean, default: false},
    onboardingActive: {type: Boolean, default: false},
    pageLoading: {type: Boolean, default: false},
    pageIsEnd: {type: Boolean, default: false},
    totalElements: {type: Number, default: 0},
    showPlaceholder: {type: Boolean, default: false}
  },

  emits: ['task-click', 'chat-link-click'],

  methods: {
    getChatLink(id, task = null) {
      return getMyTaskChatLink(id, task)
    }
  }
}
</script>

<style scoped>
/* Угол «Перейти в чат»: треугольник в правом верхнем углу внешней рамки карточки.
   Карточка вложена в q-item с отступом 8px, поэтому угол выносится на эту величину. */

.task-card:hover {
  .link-to-chat-container {
    display: unset;
  }
}

a:visited {
  text-decoration: none;
}

a:hover {
  text-decoration: none;
}

a:focus {
  text-decoration: none;
}

a:hover, a:active {
  text-decoration: none;
}

.my-tasks-onboarding-mode .my-tasks-demo-task-card {
  background: var(--app-surface, #fff);
}

.my-tasks-onboarding-mode .link-to-chat-container {
  display: unset;
}
</style>
