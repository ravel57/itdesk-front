<template>
  <div class="empty-state">
    <q-icon :name="icon" size="34px" class="text-grey-5"/>
    <div class="text-grey-7 q-mt-sm">
      {{ text }}
    </div>
  </div>
</template>

<script>
// Заглушка «нет данных» для графиков вкладки «Обзор».
export default {
  name: 'OverviewEmptyState',

  props: {
    icon: {
      type: String,
      default: 'insights'
    },
    text: {
      type: String,
      default: ''
    }
  }
}
</script>

<style scoped>
.empty-state {
  display: flex;
  min-height: 180px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
}
</style>
