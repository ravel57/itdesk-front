<template>
  <sla-card
    title="OLA по линиям поддержки"
    subtitle="Внутренний срок начинается при переводе заявки на линию и не перезапускает клиентский SLA."
  >
    <template #actions>
      <q-btn
        flat
        color="primary"
        icon="settings"
        label="Настройки линий"
        @click="$router.push('/settings/support-lines')"
      />
    </template>

    <q-table
      class="settings-row-table ola-table"
      flat
      :rows="olaLines"
      :columns="olaColumns"
      row-key="id"
      :pagination="{ rowsPerPage: 0 }"
      hide-pagination
    >
      <template #body-cell-enabled="props">
        <q-td :props="props">
          <q-toggle
            :model-value="props.row.olaEnabled === true"
            @update:model-value="value => updateOlaLine(props.row, { olaEnabled: value })"
          />
        </q-td>
      </template>

      <template #body-cell-duration="props">
        <q-td :props="props">
          <div class="ola-duration-cell">
            <q-input
              :model-value="props.row.olaValue"
              dense
              outlined
              type="number"
              min="1"
              :disable="props.row.olaEnabled !== true"
              @change="event => updateOlaLine(props.row, { olaValue: Number(event.target.value || 0) })"
            />
            <q-select
              :model-value="props.row.olaUnit || 'HOURS'"
              :options="olaUnitOptions"
              dense
              outlined
              emit-value
              map-options
              :disable="props.row.olaEnabled !== true"
              @update:model-value="value => updateOlaLine(props.row, { olaUnit: value })"
            />
          </div>
        </q-td>
      </template>

      <template #body-cell-warning="props">
        <q-td :props="props">
          <q-input
            :model-value="props.row.olaWarningPercent || 80"
            dense
            outlined
            type="number"
            min="1"
            max="100"
            suffix="%"
            :disable="props.row.olaEnabled !== true"
            @change="event => updateOlaLine(props.row, {
              olaWarningPercent: Math.min(100, Math.max(1, Number(event.target.value || 80)))
            })"
          />
        </q-td>
      </template>

      <template #body-cell-workingTime="props">
        <q-td :props="props">
          <q-toggle
            :model-value="props.row.olaUseWorkingTime !== false"
            :disable="props.row.olaEnabled !== true"
            @update:model-value="value => updateOlaLine(props.row, { olaUseWorkingTime: value })"
          />
        </q-td>
      </template>
    </q-table>

    <q-card-section v-if="!olaLines.length" class="text-center text-grey-7 q-py-xl">
      Сначала создайте линию поддержки
    </q-card-section>
  </sla-card>
</template>

<script>
import axios from 'axios'
import {useStore} from 'stores/store'
import SlaCard from './SlaCard.vue'
import {buildOlaLinePayload} from 'src/util/settingsSla/olaPayload'
import {getSlaErrorMessage} from 'src/util/settingsSla/slaErrors'
import {OLA_COLUMNS, OLA_UNIT_OPTIONS} from 'src/util/settingsSla/slaOptions'

// Вкладка «OLA линий»: настройка внутренних сроков линий поддержки.
export default {
  name: 'OlaLinesCard',
  components: {SlaCard},

  data: () => ({
    olaUpdateQueues: {},
    olaUnitOptions: OLA_UNIT_OPTIONS,
    olaColumns: OLA_COLUMNS
  }),

  computed: {
    olaLines() {
      return [...(this.store.supportLines || [])]
        .sort((left, right) => Number(left.orderNumber || 0) - Number(right.orderNumber || 0))
    }
  },

  methods: {
    // Обновления одной линии выполняются строго по очереди
    async updateOlaLine(line, patch) {
      const lineId = line?.id
      if (lineId == null) {
        return
      }

      const previousUpdate = this.olaUpdateQueues[lineId] || Promise.resolve()
      const update = previousUpdate
        .catch(() => undefined)
        .then(async () => {
          const currentLine = this.store.supportLines.find(item => item.id === lineId) || line
          const payload = buildOlaLinePayload(currentLine, patch)
          if (!payload) {
            return
          }

          const {data} = await axios.patch('/api/v1/support-line', payload)
          const index = this.store.supportLines.findIndex(item => item.id === lineId)
          if (index >= 0) {
            this.store.supportLines.splice(index, 1, data)
          }
        })

      this.olaUpdateQueues[lineId] = update
      try {
        await update
      } catch (e) {
        this.notifyError(e)
      } finally {
        if (this.olaUpdateQueues[lineId] === update) {
          delete this.olaUpdateQueues[lineId]
        }
      }
    },

    notifyError(e) {
      this.$q.notify({
        message: getSlaErrorMessage(e),
        type: 'negative'
      })
    }
  },

  mounted() {
    if (!this.store.supportLines?.length) {
      axios.get('/api/v1/support-lines')
        .then(({data}) => {
          this.store.supportLines = Array.isArray(data) ? data : []
        })
        .catch(this.notifyError)
    }
  },

  setup() {
    const store = useStore()
    return {store}
  }
}
</script>

<style scoped>
.ola-table {
  border-radius: 0 0 18px 18px;
}

.ola-duration-cell {
  display: grid;
  grid-template-columns: minmax(100px, 1fr) 150px;
  gap: 8px;
  min-width: 280px;
}

@media (max-width: 700px) {
  .ola-duration-cell {
    grid-template-columns: 1fr;
    min-width: 180px;
  }
}
</style>
