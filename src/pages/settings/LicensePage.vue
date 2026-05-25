<template>
  <div class="q-pa-md">
    <p>Количество пользователей в лицензии: {{ this.employeesCount }}</p>
    <p>Лицензия действует до: {{ this.licenseUntil }}</p>
  </div>
</template>

<script>
import axios from 'axios'
import moment from 'moment/moment'

export default {
  name: 'LicensePage',

  data: () => ({
    employeesCount: 0,
    licenseUntil: ''
  }),

  methods: {

  },

  mounted () {
    axios.get('/api/v1/license-info')
      .then(response => {
        this.employeesCount = response.data.employeesCount
        this.licenseUntil = moment(response.data.licenseUntil).format('DD.MM.YYYY')
      })
  }
}
</script>

<style scoped>

</style>
