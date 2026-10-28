<template>
  <q-card-section>
    <div class="row q-col-gutter-md">
      <div
        v-for="gauge in gauges"
        :key="gauge.key"
        class="col-12 col-sm-6"
      >
        <div class="quality-gauge">
          <div class="row items-center justify-between q-mb-xs">
            <div class="quality-gauge-title">
              {{ gauge.label }}
            </div>
            <div class="quality-gauge-value">
              {{ gauge.valueLabel }}
            </div>
          </div>
          <q-linear-progress
            rounded
            size="12px"
            :value="gauge.value / 100"
            :color="gauge.color"
            track-color="grey-3"
          />
          <div class="quality-gauge-caption">
            {{ gauge.caption }}
          </div>
        </div>
      </div>
    </div>
  </q-card-section>
</template>

<script>
// Показометры «Быстрый контроль качества».
export default {
  name: 'OverviewQualityGauges',

  props: {
    gauges: {
      type: Array,
      default: () => []
    }
  }
}
</script>

<style scoped>
.quality-gauge {
  padding: 12px;
  border: 1px solid #eeeeee;
  border-radius: 8px;
  background: #fafafa;
}

.quality-gauge-title {
  font-weight: 500;
}

.quality-gauge-value {
  font-weight: 700;
}

.quality-gauge-caption {
  margin-top: 6px;
  color: #757575;
  font-size: 12px;
}
</style>
