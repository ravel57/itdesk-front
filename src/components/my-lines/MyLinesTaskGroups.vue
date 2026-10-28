<template>
  <section
    v-for="group in groups"
    :key="group.line.id"
    class="line-task-section"
  >
    <div class="line-task-section__header app-line-task-section__header">
      <div class="line-task-section__identity">
        <div class="line-task-section__level">L{{ group.line.level || 1 }}</div>
        <div>
          <div class="line-task-section__title">{{ group.line.name }}</div>
          <div class="line-task-section__caption app-shared-line-task-section__caption">
            {{ getLineRoleLabel(group.line) }} · показано {{ group.tasks.length }}
          </div>
        </div>
      </div>
      <div class="line-task-section__indicators">
        <q-chip
          v-if="countUnassigned(group.tasks) > 0"
          dense
          color="orange-1"
          text-color="orange-9"
          icon="person_off"
        >
          Без исполнителя: {{ countUnassigned(group.tasks) }}
        </q-chip>
        <q-chip
          v-if="countOlaRisk(group.tasks) > 0"
          dense
          color="red-1"
          text-color="red-8"
          icon="timer_off"
        >
          Риск OLA: {{ countOlaRisk(group.tasks) }}
        </q-chip>
      </div>
    </div>

    <div class="line-task-grid">
      <q-item
        v-for="(task, index) in group.tasks"
        :key="task.id"
        clickable
        class="line-task-card no-padding"
        @click="$emit('task-click', task)"
      >
        <q-item class="line-task-card__inner" clickable @click="$emit('task-click', task)">
          <task-card
            class="task-card"
            :task="task"
            :descriptionRequire="false"
            :slaRequire="true"
            :task-name-short="20"
            :selected-sorting="''"
            @onTaskClicked="$emit('task-click', $event)"
          >
            <template #chatLink>
              <a
                :href="getChatLink(task.client?.id)"
                @click.stop.prevent="$emit('chat-link-click', task)"
              >
                <div :id="`my_line_chat_${task.id}_${index}`" class="link-to-chat-container app-shared-link-to-chat-container">
                  <div class="link-container app-shared-link-container">
                    <q-icon class="link app-shared-link" color="white" name="open_in_new"/>
                  </div>
                </div>
              </a>
            </template>
          </task-card>
        </q-item>
      </q-item>
    </div>
  </section>

  <div class="text-grey-6 text-center q-py-lg full-width">
    <div v-if="pageLoading">Загружаю заявки...</div>
    <div v-else-if="!pageIsEnd">Прокрутите ниже, чтобы загрузить ещё</div>
    <div v-else>Показано {{ pagedCount }} из {{ totalElements }}</div>
  </div>
</template>

<script>
import TaskCard from 'components/TaskCard.vue'
import {countOlaRisk, countUnassigned, getLineChatLink, getLineRoleLabel} from 'src/util/myLines/lineHelpers'

// Заявки, сгруппированные по линиям на странице «Мои линии»: заголовок линии с индикаторами,
// сетка карточек заявок со ссылкой в чат и подвал подгрузки. Состояние и загрузка — на странице.
export default {
  name: 'MyLinesTaskGroups',

  components: {TaskCard},

  props: {
    groups: {type: Array, default: () => []},
    pagedCount: {type: Number, default: 0},
    totalElements: {type: Number, default: 0},
    pageLoading: {type: Boolean, default: false},
    pageIsEnd: {type: Boolean, default: false},
    currentUserId: {type: [Number, String], default: null}
  },

  emits: ['task-click', 'chat-link-click'],

  methods: {
    countUnassigned,
    countOlaRisk,

    getChatLink(clientId) {
      return getLineChatLink(clientId)
    },

    getLineRoleLabel(line) {
      return getLineRoleLabel(line, this.currentUserId)
    }
  }
}
</script>

<style scoped>
.line-task-section {
  margin-top: 22px;
}

.line-task-section__identity {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.line-task-section__level {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--q-primary);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  flex: 0 0 auto;
}

.line-task-section__title {
  font-size: 16px;
  font-weight: 700;
}

.line-task-section__indicators {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 6px;
}

.line-task-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(360px, 420px));
  gap: 12px 20px;
  padding-top: 10px;
}

.line-task-card {
  width: 100%;
  min-width: 0;
  max-width: 420px;
  box-sizing: border-box;
  border: 1px solid var(--q-primary);
  border-radius: 5px;
  overflow: hidden;
  background: var(--app-surface, #fff);
}

.line-task-card__inner {
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
  padding: 8px;
  overflow: hidden;
}

.line-task-card .task-card {
  width: 100%;
  min-width: 0;
}

/* Угол «Перейти в чат»: треугольник в правом верхнем углу внешней рамки карточки.
   Карточка вложена в q-item с отступом 8px, поэтому угол выносится на эту величину. */

.task-card:hover .link-to-chat-container {
  display: unset;
}
@media (max-width: 700px) {

  .line-task-section__indicators {
    justify-content: flex-start;
  }

  .line-task-grid {
    grid-template-columns: minmax(0, 1fr);
  }

  .line-task-card {
    max-width: none;
  }
}
</style>
