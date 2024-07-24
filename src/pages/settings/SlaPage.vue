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
    tableData: []
  }),

  methods: {
    onCellValueChange (newVal) {
      newVal.map((organization, organizationIndex) => {
        organization.forEach((priority, priorityIndex) => {
          axios.post('/api/v1/sla', {
            organization: this.store.organizations[organizationIndex],
            priority: this.store.priorities[priorityIndex],
            hours: priority
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
        return organization
      })
    }
  },

  computed: {
    getOrganizations () {
      return [{ name: 'Стандартный SLA' }].concat(structuredClone(this.store.organizations))
    }
  },

  created () {
    this.tableData = this.getOrganizations.map(() => { return new Array(0) })
    // /**/console.log(this.tableData)/**/
    axios.get('/api/v1/sla')
      .then(response => {
        try {
          // /**/console.log(response.data)/**/
          let counter = 0
          for (const organization in response.data) {
            this.store.priorities.forEach(priority => {
              // /**/console.log(response.data[organization])/**/
              const item = response.data[organization][priority.name]
              // /**/console.log(item)/**/
              if (this.tableData[counter] && item) {
                this.tableData[counter].push(item.toString().replace(/\D/g, ''))
              }
            })
            counter++
          }
        } catch (e) {
          this.$q.notify({
            message: e.message,
            type: 'negative',
            position: 'top-right',
            actions: [{
              icon: 'close', color: 'white', dense: true, handler: () => undefined
            }]
          })
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
