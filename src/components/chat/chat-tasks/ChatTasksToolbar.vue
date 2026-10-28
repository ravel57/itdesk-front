<template>
  <div data-tour="chat-task-toolbar" class="flex app-inline app-margin-bottom-8">
    <div>
      <div class="flex">
        <span
          class="text-h6"
          style="margin-top: 3px"
          v-text="this.getDeclension(this.totalForHeader)"
        />
        <q-btn-dropdown
          v-if="this.pingedTasks.length > 0"
          flat
          dense
          color="primary"
          icon="alternate_email"
          :loading="this.taskPingsLoading"
          :label="this.pingedTasks.length.toString()"
          class="task-ping-dropdown"
        >
          <q-list class="task-ping-menu">
            <q-item-label header class="text-weight-medium">
              Пинги в заявках
            </q-item-label>
            <q-separator/>
            <q-item
              v-for="task in this.pingedTasks"
              :key="`task-ping-${task.id}`"
              clickable
              v-close-popup
              @click="$emit('openPingedTask', task)"
            >
              <q-item-section avatar class="task-ping-icon-section">
                <q-icon name="alternate_email" color="primary"/>
              </q-item-section>
              <q-item-section>
                <q-item-label lines="1">
                  №{{ task.id }} {{ task.name || 'Без названия' }}
                </q-item-label>
                <q-item-label caption lines="1">
                  {{ this.getPingedTaskCaption(task) }}
                </q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </q-btn-dropdown>
        <div class="container q-pa-none q-gutter-md q-position-relative">
          <q-toggle
            data-tour="chat-tasks-completed"
            :model-value="this.isShowCompletedTasks"
            @update:model-value="$emit('update:isShowCompletedTasks', $event)"
            icon="add_task"
            color="primary"
            class="element q-position-absolute q-right-0"
            @mouseover="showTooltipClosedTasks = true"
            @mouseup="showTooltipClosedTasks = false"
          >
            <q-tooltip v-if="showTooltipClosedTasks">Показывать закрытые и замороженные заявки</q-tooltip>
          </q-toggle>
        </div>
      </div>
      <q-btn
        data-tour="chat-create-task"
        v-if="$can('TASK_EDIT')"
        id="create-task"
        class="text-primary cursor-pointer app-inline app-margin-right-8"
        icon="add_circle"
        color="primary"
        @click="$emit('createTask')"
        label="Создать заявку"
      />
      <q-btn class="app-inline app-margin-right-8"
        data-tour="chat-task-search-toggle"
        icon="search"
        flat
        :class="this.showSearch ? 'text-primary' : 'text-grey-7'"
        @click="$emit('update:showSearch', !this.showSearch)"
      >
        <q-tooltip>
          Поиск
        </q-tooltip>
      </q-btn>
      <q-btn class="app-inline app-margin-right-8"
        data-tour="chat-task-sort"
        icon="sort"
        flat
        :class="this.selectedSorting.label ? 'text-primary' : 'text-grey-7'"
      >
        <q-tooltip>
          <div v-if="this.selectedSorting.label">
            Сортировка: {{ this.selectedSorting.label }}
          </div>
          <div v-else>
            Сортировка
          </div>
        </q-tooltip>
        <q-menu
          v-model="sortMenuOpened"
          content-class="menu-content"
        >
          <q-list>
            <q-item
              v-for="sorting in this.sortingTypes"
              :key="sorting.slug"
              clickable
              v-close-popup
              :active="this.selectedSorting.slug === sorting.slug"
              active-class="text-primary"
              @click="$emit('sort', sorting)"
            >
              <q-item-section>
                {{ sorting.label }}
              </q-item-section>
              <q-item-section
                v-if="this.selectedSorting.slug === sorting.slug"
                side
              >
                <q-icon
                  name="check"
                  color="primary"
                  size="18px"
                />
              </q-item-section>
            </q-item>
          </q-list>
        </q-menu>
      </q-btn>
      <q-btn
        v-if="this.selectedSorting.label"
        @click="$emit('toggleSortOrder')"
        flat
        class="text-primary"
        style="width: 20px"
        :icon="this.ascendingSort ? 'arrow_upward' : 'arrow_downward'"
      />
      <div id="task-search">
        <q-input class="app-inline app-margin-top-8"
          v-if="this.showSearch || this.onboardingDemo"
          data-tour="chat-task-search"
          :model-value="this.search"
          @update:model-value="$emit('update:search', $event)"
          label="Поиск по заявкам"
          dense
          clearable
        >
          <template v-slot:append>
            <q-icon name="search"/>
          </template>
          </q-input>
        </div>
      </div>
    </div>
</template>

<script>
import { getDeclension, getPingedTaskCaption } from 'src/util/chatTasks/taskText'

// Панель над списком заявок чата: счётчик, пинги, переключатель закрытых, создание, поиск и сортировка.
// Состояние (поиск, сортировка, закрытые) принадлежит ChatTasks: сюда приходит props, наверх уходят события.
export default {
  name: 'ChatTasksToolbar',

  props: [
    'totalForHeader',
    'pingedTasks',
    'taskPingsLoading',
    'isShowCompletedTasks',
    'showSearch',
    'search',
    'onboardingDemo',
    'selectedSorting',
    'sortingTypes',
    'ascendingSort'
  ],

  emits: [
    'update:isShowCompletedTasks',
    'update:showSearch',
    'update:search',
    'openPingedTask',
    'createTask',
    'sort',
    'toggleSortOrder'
  ],

  data: () => ({
    showTooltipClosedTasks: false,
    sortMenuOpened: false,
  }),

  methods: {
    getDeclension (count) {
      return getDeclension(count)
    },

    getPingedTaskCaption (task) {
      return getPingedTaskCaption(task)
    },
  }
}
</script>

<style scoped>
.task-ping-dropdown {
  margin-left: 6px;
  min-height: 32px;
}

.task-ping-menu {
  min-width: 300px;
  max-width: 420px;
  max-height: 360px;
  overflow-y: auto;
}

.task-ping-icon-section {
  min-width: 34px;
}
</style>
