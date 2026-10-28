<template>
  <div class="my-lines-toolbar">
    <div class="my-lines-heading">
      <div class="text-h5 text-weight-medium">Мои линии</div>
      <div class="text-caption text-grey-7">
        Заявки линий, где вы ответственный, участник или наблюдатель
      </div>
    </div>

    <div class="my-lines-search">
      <q-input
        :model-value="searchRequest"
        @update:model-value="$emit('update:searchRequest', $event)"
        outlined
        dense
        clearable
        debounce="0"
        label="Поиск по заявкам"
      >
        <template #prepend>
          <q-icon name="search"/>
        </template>
      </q-input>
      <q-btn
        flat
        round
        dense
        color="primary"
        icon="refresh"
        :loading="pageLoading"
        @click="$emit('refresh')"
      >
        <q-tooltip>Обновить</q-tooltip>
      </q-btn>
    </div>
  </div>
</template>

<script>
// Шапка страницы «Мои линии»: заголовок, поиск по заявкам и кнопка «Обновить».
export default {
  name: 'MyLinesToolbar',

  props: {
    searchRequest: {type: String, default: ''},
    pageLoading: {type: Boolean, default: false}
  },

  emits: ['update:searchRequest', 'refresh']
}
</script>

<style scoped>
.my-lines-toolbar {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
}

.my-lines-heading {
  min-width: 220px;
}

.my-lines-search {
  display: flex;
  align-items: center;
  gap: 6px;
  width: min(520px, 100%);
}

.my-lines-search .q-input {
  flex: 1;
}

@media (max-width: 700px) {
  .my-lines-toolbar {
    align-items: stretch;
    flex-direction: column;
  }

  .my-lines-search {
    width: 100%;
  }
}
</style>
