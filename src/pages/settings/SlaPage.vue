<template>
  <table>
    <thead>
    <tr>
      <td/>
      <th
        v-for="(priority, columnIndex) in this.store.priorities"
        :key="columnIndex"
        v-text="priority.name"
      />
    </tr>
    </thead>
    <tbody>
    <tr
      v-for="(organization, rowIndex) in this.getOrganizations"
      :key="rowIndex"
    >
      <td
        v-text="organization.name"
      />
      <td
        v-for="(priority, columnIndex) in this.store.priorities"
        :key="columnIndex"
      >
        <div class="sla-cell" style="display:flex; gap:8px; align-items:center;">
          <q-input
            v-model.number="tableData[rowIndex][columnIndex].value"
            type="number"
            dense outlined hide-bottom-space
            placeholder="0"
            class="sla-value"
            :debounce="400"
            @update:model-value="() => onCellEdited(rowIndex, columnIndex)"
            @input="() => onCellEdited(rowIndex, columnIndex)"
            @blur="() => onCellEdited(rowIndex, columnIndex)"
          />
          <q-select
            v-model="tableData[rowIndex][columnIndex].unit"
            :options="periodOptions"
            emit-value
            map-options
            dense
            outlined
            hide-bottom-space
            class="sla-unit"
            style="width:120px;"
            @update:model-value="() => onCellEdited(rowIndex, columnIndex)"
            @input="() => onCellEdited(rowIndex, columnIndex)"
          />
        </div>
      </td>
    </tr>
    </tbody>
  </table>
</template>

<script>
import { useStore } from 'stores/store'
import axios from 'axios'

export default {
  name: 'SlaPage',

  data: () => ({
    tableData: [],
    isPopulatingSla: false,
    lastSent: {},
    periodOptions: [
      { label: 'минуты', value: 'MINUTES' },
      { label: 'часы', value: 'HOURS' },
      { label: 'дни', value: 'DAYS' }
    ]
  }),

  computed: {
    getOrganizations () {
      // первая строка = дефолтный SLA
      return [{ name: 'Стандартный SLA' }].concat(structuredClone(this.store.organizations))
    }
  },

  methods: {
    notifyError (e) {
      this.$q.notify({
        message: e?.response?.data?.message || e.message,
        type: 'negative',
        position: 'top-right',
        actions: [{ icon: 'close', color: 'white', dense: true, handler: () => undefined }]
      })
    },

    buildEmptyTable () {
      const rows = this.getOrganizations.length
      const cols = this.store.priorities.length

      return Array.from({ length: rows }, () =>
        Array.from({ length: cols }, () => ({
          value: '',
          unit: 'HOURS'
        }))
      )
    },

    async loadSla () {
      this.isPopulatingSla = true
      try {
        this.tableData = this.buildEmptyTable()

        const { data } = await axios.get('/api/v1/sla')
        // data: { [orgName]: { [priorityName]: { value, unit } } }

        this.getOrganizations.forEach((org, rowIndex) => {
          this.store.priorities.forEach((priority, colIndex) => {
            const cell = data?.[org.name]?.[priority.name]

            this.tableData[rowIndex][colIndex] = {
              value: cell?.value ?? '',
              unit: cell?.unit ?? 'HOURS'
            }
          })
        })
      } catch (e) {
        this.notifyError(e)
      } finally {
        this.isPopulatingSla = false
      }
    },

    async onCellEdited (rowIndex, colIndex) {
      if (this.isPopulatingSla) return

      const organization = (rowIndex === 0) ? null : this.store.organizations[rowIndex - 1]
      const priority = this.store.priorities[colIndex]
      const cell = this.tableData[rowIndex][colIndex]

      const valueStr = String(cell.value ?? '').trim()
      const value = valueStr === '' ? null : Number(valueStr)
      const unit = cell.unit || 'HOURS'

      try {
        await axios.post('/api/v1/sla', {
          organization,
          priority,
          value,
          unit
        })
      } catch (e) {
        this.notifyError(e)
      }
    }
  },

  async created () {
    await this.loadSla()
  },

  setup () {
    const store = useStore()
    return { store }
  }
}
</script>

<style scoped>
.sla-cell {
  display: flex;
  width: 200px;
}
</style>
