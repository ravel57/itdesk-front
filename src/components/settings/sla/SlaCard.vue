<template>
  <q-card flat bordered class="sla-card">
    <div class="sla-card-header">
      <div>
        <div class="sla-title">{{ title }}</div>
        <div class="sla-subtitle">{{ subtitle }}</div>
      </div>
      <slot name="actions"/>
    </div>

    <slot/>
  </q-card>
</template>

<script>
// Общая оболочка карточки страницы SLA и OLA: заголовок, подзаголовок, слот действий и содержимое.
export default {
  name: 'SlaCard',
  props: {
    title: {type: String, default: ''},
    subtitle: {type: String, default: ''}
  }
}
</script>

<style scoped>
.sla-card {
  border-radius: 18px;
  overflow: hidden;
  background: var(--app-surface, #ffffff);
  box-shadow: 0 14px 32px rgba(24, 39, 75, 0.08);
}

.sla-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  padding: 18px 20px;
  border-bottom: 1px solid var(--app-border, #edf0f7);
  background: linear-gradient(180deg, var(--app-surface, #ffffff) 0%, var(--app-surface, #fbfcff) 100%);
}

.sla-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--app-text, #1f2937);
}

.sla-subtitle {
  margin-top: 4px;
  font-size: 13px;
  color: var(--app-text-muted, #7b8794);
}
</style>
