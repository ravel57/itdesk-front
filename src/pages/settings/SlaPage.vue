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
      v-for="(organization, rowIndex) in this.store.organizations"
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
    tableData: []
  }),

  methods: {
    onCellValueChange (newVal) {
      newVal.map((item, organizationIndex) => {
        item.forEach((priorityItem, priorityIndex) => {
          axios.post('/api/v1/sla', {
            organization: this.store.organizations[organizationIndex],
            priority: this.store.priorities[priorityIndex],
            duration: priorityItem
          })
            .then(response => {})
            .catch(e =>
              this.$q.notify({
                message: e.message,
                type: 'negative',
                position: 'top-right',
                actions: [{
                  icon: 'close', color: 'white', dense: true, handler: () => undefined
                }]
              }))
        })
        return item
      })
    }
  },

  mounted () {
    axios.get('/api/v1/sla')
      .then(response => {
        console.log(response.data)
        for (const dataKey in response.data) {
          this.tableData.push(dataKey)
        }
      })
      .catch(e =>
        this.$q.notify({
          message: e.message,
          type: 'negative',
          position: 'top-right',
          actions: [{
            icon: 'close', color: 'white', dense: true, handler: () => undefined
          }]
        }))
    this.tableData = this.store.organizations.map(() => {
      return new Array(this.store.priorities.length)
    })
  },

  setup () {
    const store = useStore()
    return { store }
  },

  watch: {
    tableData: {
      handler: function (newVal, oldVal) {
        this.onCellValueChange(newVal)
      },
      deep: true
    }
  }
}
</script>

<style scoped>

</style>
