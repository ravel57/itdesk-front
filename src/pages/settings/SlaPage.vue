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
        <input
          v-model="tableData[rowIndex][columnIndex]"
        />
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
    isPopulatingSla: false
  }),

  methods: {
    notifyError (e) {
      this.$q.notify({
        message: e.message,
        type: 'negative',
        position: 'top-right',
        actions: [{ icon: 'close', color: 'white', dense: true, handler: () => undefined }]
      })
    },

    buildEmptyTable () {
      const rows = this.getOrganizations.length
      const cols = this.store.priorities.length
      return Array.from({ length: rows }, () => Array.from({ length: cols }, () => ''))
    },

    async loadSla () {
      this.isPopulatingSla = true
      try {
        this.tableData = this.buildEmptyTable()

        const { data } = await axios.get('/api/v1/sla')
        // data: { [orgName: string]: { [priorityName: string]: number } }

        this.getOrganizations.forEach((org, rowIndex) => {
          this.store.priorities.forEach((priority, colIndex) => {
            const hours = data?.[org.name]?.[priority.name]
            this.tableData[rowIndex][colIndex] = (hours === null || hours === undefined) ? '' : String(hours)
          })
        })
      } catch (e) {
        this.notifyError(e)
      } finally {
        this.isPopulatingSla = false
      }
    },

    onCellValueChange (newVal) {
      // важно: не дергать POST во время первичного заполнения таблицы
      if (this.isPopulatingSla) return

      newVal.forEach((row, rowIndex) => {
        row.forEach((cellValue, colIndex) => {
          const organization = (rowIndex === 0) ? null : this.store.organizations[rowIndex - 1]
          const priority = this.store.priorities[colIndex]

          const hoursStr = String(cellValue ?? '').trim()
          const hours = hoursStr === '' ? null : Number(hoursStr)

          axios.post('/api/v1/sla', {
            organization,
            priority,
            hours
          }).catch(this.notifyError)
        })
      })
    }
  },

  computed: {
    getOrganizations () {
      return [{ name: 'Стандартный SLA' }].concat(structuredClone(this.store.organizations))
    }
  },

  async created () {
    await this.loadSla()
  },

  setup () {
    const store = useStore()
    return { store }
  },

  watch: {
    tableData: {
      handler (newVal) {
        this.onCellValueChange(newVal)
      },
      deep: true
    }
  }
}
</script>

<style scoped>

</style>
