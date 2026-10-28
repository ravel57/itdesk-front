<template>
  <div class="search-sort-row">
    <q-input
      :model-value="searchQuery"
      dense
      data-tour="chat-search"
      placeholder="Поиск по клиенту или организации..."
      @update:model-value="$emit('update:searchQuery', $event)"
      @input="$emit('search', $event)"
      clearable
      class="search-sort-row__search"
      @clear="$emit('update:searchQuery', '')"
    >
      <template v-slot:append>
        <q-icon
          name="search"
        />
      </template>
    </q-input>

    <q-select
      :model-value="sortType"
      data-tour="chat-sort"
      :options="sortOptions"
      dense
      outlined
      emit-value
      map-options
      options-dense
      class="search-sort-row__sort"
      @update:model-value="$emit('update:sortType', $event)"
    />

<!--    <q-btn>-->
<!--      <q-tooltip>Новый пользователь</q-tooltip>-->
<!--    </q-btn>-->

    <notification-bell
      v-if="$q.screen.width > 1023"
      button-color="primary"
      class="q-ml-xs"
    />

    <q-btn
      flat
      dense
      round
      icon="help_outline"
      color="primary"
      @click="$emit('start-onboarding')"
    >
      <q-tooltip>Показать обучение</q-tooltip>
    </q-btn>
  </div>
</template>

<script>
import NotificationBell from 'components/notifications/NotificationBell.vue'

// Строка поиска и сортировки списка чатов (v-model:search-query, v-model:sort-type).
export default {
  name: 'ClientsChatsToolbar',

  components: { NotificationBell },

  props: {
    searchQuery: { type: String, default: '' },
    sortType: { type: String, default: '' },
    sortOptions: { type: Array, required: true }
  },

  emits: ['update:searchQuery', 'update:sortType', 'search', 'start-onboarding']
}
</script>

<style scoped>
.search-sort-row {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
}

.search-sort-row__search {
  flex: 1 1 auto;
  min-width: 0;
}

.search-sort-row__sort {
  flex: 0 0 300px;
  width: 300px;
}

@media (max-width: 600px) {
  .search-sort-row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 36px;
    gap: 6px;
    align-items: center;
    margin-bottom: 6px;
  }

  .search-sort-row__search {
    grid-column: 1 / -1;
    width: 100%;
  }

  .search-sort-row__sort {
    grid-column: 1;
    width: 100%;
    min-width: 0;
    flex: 1 1 auto;
  }

  .search-sort-row > .q-btn {
    grid-column: 2;
    justify-self: end;
  }
}
</style>
