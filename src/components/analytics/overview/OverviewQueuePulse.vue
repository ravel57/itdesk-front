<template>
  <q-card-section class="queue-pulse-list app-column-gap-14">
    <div
      v-for="item in items"
      :key="item.key"
      class="queue-pulse-item"
    >
      <div class="row items-center justify-between no-wrap">
        <div class="queue-pulse-label">
          <q-icon :name="item.icon" size="18px" class="q-mr-xs"/>
          {{ item.label }}
        </div>
        <q-chip dense square :color="item.color" :text-color="item.textColor">
          {{ item.value }}
        </q-chip>
      </div>
      <div class="queue-pulse-caption app-shared-time-metric-caption">
        {{ item.caption }}
      </div>
    </div>
  </q-card-section>
</template>

<script>
// Список «Пульс очереди»: что требует внимания прямо сейчас.
export default {
  name: 'OverviewQueuePulse',

  props: {
    items: {
      type: Array,
      default: () => []
    }
  }
}
</script>

<style scoped>
.queue-pulse-item {
  padding-bottom: 12px;
  border-bottom: 1px solid var(--app-border, #eeeeee);
}

.queue-pulse-item:last-child {
  padding-bottom: 0;
  border-bottom: 0;
}

.queue-pulse-label {
  display: flex;
  align-items: center;
  font-weight: 500;
}
</style>
