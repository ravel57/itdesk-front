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
    <tbody v-if="isSlaReady && tableData.length">
    <tr
      v-for="(organization, rowIndex) in getOrganizations"
      :key="organization.id || 'default-sla'"
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
      {
        label: 'минуты',
        value: 'MINUTES'
      },
      {
        label: 'часы',
        value: 'HOURS'
      },
      {
        label: 'дни',
        value: 'DAYS'
      }
    ]
  }),

  computed: {
    getOrganizations () {
      return [
        {
          id: null,
          name: 'Стандартный SLA',
          isDefaultSla: true
        },
        ...(this.store.organizations || [])
      ]
    },

    isSlaReady () {
      return this.store.priorities.length > 0
    }
  },

  methods: {
    notifyError (e) {
      this.$q.notify({
        message: e?.response?.data?.message || e.message,
        type: 'negative',
        position: 'top-right',
        actions: [{
          icon: 'close',
          color: 'white',
          dense: true,
          handler: () => undefined
        }]
      })
    },

    async loadSla () {
      if (!this.isSlaReady) {
        return
      }
      this.isPopulatingSla = true
      try {
        const organizations = this.getOrganizations
        const priorities = this.store.priorities

        const emptyTable = Array.from({ length: organizations.length }, () =>
          Array.from({ length: priorities.length }, () => ({
            value: '',
            unit: 'HOURS'
          }))
        )
        const { data } = await axios.get('/api/v1/sla')
        organizations.forEach((org, rowIndex) => {
          priorities.forEach((priority, colIndex) => {
            const cell = data?.[org.name]?.[priority.name]
            emptyTable[rowIndex][colIndex] = {
              value: cell?.value ?? '',
              unit: cell?.unit ?? 'HOURS'
            }
          })
        })
        this.tableData = emptyTable
      } catch (e) {
        this.notifyError(e)
      } finally {
        this.isPopulatingSla = false
      }
    },

    async onCellEdited (rowIndex, colIndex) {
      if (this.isPopulatingSla) {
        return
      }
      const organizationRow = this.getOrganizations[rowIndex]
      const organization = organizationRow?.isDefaultSla ? null : organizationRow
      const priority = this.store.priorities[colIndex]
      const cell = this.tableData?.[rowIndex]?.[colIndex]
      if (!priority || !cell) {
        return
      }
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

  mounted () {
    this.loadSla()
  },

  watch: {
    'store.organizations.length' () {
      this.loadSla()
    },
    'store.priorities.length' () {
      this.loadSla()
    }
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
