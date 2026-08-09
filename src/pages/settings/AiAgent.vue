<template>
  <div class="q-pa-md">
    <div class="settings-content-header">
      <div class="settings-content-heading">
        <div class="settings-content-title">ИИ-агент</div>
        <div class="settings-content-description">
          Управляйте моделью ИИ-агента и запускайте переобучение на актуальных данных базы знаний.
        </div>
      </div>
      <div class="settings-content-actions">
        <q-btn color="primary" icon="model_training">
          Переобучить модель
          <q-tooltip>Запустить повторное обучение ИИ-агента на обновленных данных базы знаний</q-tooltip>
        </q-btn>
      </div>
    </div>
  </div>
</template>

<script>

export default {
  name: 'AiAgent'

}
</script>

<style scoped>

</style>
