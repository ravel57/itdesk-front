<template>
  <q-btn-toggle
    :model-value="this.scope"
    @update:model-value="this.setTasksScope"
    toggle-color="primary"
    color="white"
    text-color="grey-8"
    unelevated
    dense
    :options="this.tasksScopeOptions"
  />
</template>

<script>
// Переключатель «Мои заявки / Заявки моих линий / Все заявки».
// Выбранный пункт хранится в query-параметре scope и в localStorage.
// Стили (например, width: 100% на мобильном) приходят от родителя через fallthrough-атрибуты.
export default {
  props: {
    // Текущий пункт: 'my' | 'my-lines' | 'all'
    scope: {
      type: String,
      default: 'all'
    }
  },

  computed: {
    tasksScopeOptions() {
      return [
        {label: 'Мои заявки', value: 'my'},
        {label: 'Заявки моих линий', value: 'my-lines'},
        {label: 'Все заявки', value: 'all'}
      ]
    }
  },

  methods: {
    setTasksScope(scope) {
      const normalizedScope = ['my', 'my-lines'].includes(scope) ? scope : 'all'
      const query = {...this.$route.query}
      if (normalizedScope === 'all') {
        delete query.scope
      } else {
        query.scope = normalizedScope
      }
      try {
        localStorage.setItem('tasksScope', normalizedScope)
      } catch (e) {
        // localStorage недоступен — выбор действует только до перезагрузки
      }
      this.$router.replace({path: '/tasks', query})
    }
  }
}
</script>
