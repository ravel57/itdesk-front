<template>
  <div class="sla-page app-page-padding">
    <div class="settings-content-header">
      <div class="settings-content-heading">
        <div class="settings-content-title">SLA и OLA</div>
        <div class="settings-content-description">
          Настройте сроки обслуживания клиентов и внутренние сроки работы линий поддержки.
        </div>
      </div>
    </div>

    <q-tabs
      v-model="activeTab"
      dense
      align="left"
      active-color="primary"
      indicator-color="primary"
      class="q-mb-md text-grey-7"
    >
      <q-tab name="sla" icon="schedule" label="SLA клиента" no-caps/>
      <q-tab name="ola" icon="timer" label="OLA линий" no-caps/>
    </q-tabs>

    <sla-client-card v-show="activeTab === 'sla'"/>

    <ola-lines-card v-show="activeTab === 'ola'"/>
  </div>
</template>

<script>
import OlaLinesCard from 'components/settings/sla/OlaLinesCard.vue'
import SlaClientCard from 'components/settings/sla/SlaClientCard.vue'

export default {
  name: 'SlaPage',
  components: {OlaLinesCard, SlaClientCard},

  data: () => ({
    activeTab: 'sla'
  })
}
</script>

<style scoped>
:deep(.q-field--outlined .q-field__control) {
  border-radius: 10px;
  background: var(--app-surface, #ffffff);
}
:deep(.q-field--focused .q-field__control) {
  box-shadow: 0 0 0 2px rgba(91, 108, 255, 0.16);
}
:deep(.q-field__native),
:deep(.q-field__input) {
  font-weight: 600;
}
</style>
