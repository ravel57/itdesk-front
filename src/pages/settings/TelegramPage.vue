<template>
  <div class="q-pa-md">
    <q-btn
      icon="add"
      label="Добавить бота"
      @click="this.dialogVisible = true"
    />
    <div class="table-container">
      <q-table
        :rows="telegramBots"
        :columns="columns"
        row-key="id"
        full-width
      >
      <template v-slot:body-cell-token="props">
        <q-td :props="props">
          <span v-if="!props.row.showToken" v-text="'************'"/>
          <span v-else v-text="props.row.token"/>
        </q-td>
      </template>
      <template v-slot:body-cell-show-token="props">
        <q-td :props="props">
          <q-btn
            color="primary"
            dense
            flat
            icon="visibility"
            @click="toggleToken(props.row)"
          />
          <q-btn
            color="primary"
            dense
            flat
            icon="edit"
            @click="updateToken(props.row)"
          />
        </q-td>
      </template>
    </q-table>
    </div>
  </div>
  <q-dialog
    v-model="this.dialogVisible"
    persistent
    backdrop-filter="blur(4px)"
  >
    <q-card>
      <q-card-section>
        <q-input
          v-model="this.dialogName"
          label="Название"
        />
        <q-input
          v-model="this.dialogToken"
          label="ключ API"
        />
      </q-card-section>
      <q-card-actions align="right">
        <q-btn
          color="white"
          label="Закрыть"
          text-color="primary"
          @click="closeDialog"
        />
        <q-btn
          color="primary"
          label="Сохранить"
          @click="dialogSaveNewBot"/>
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script>
import axios from 'axios'

export default {
  name: 'TelegramPage',

  data: () => ({
    columns: [
      { name: 'name', label: 'Название', align: 'left', field: 'name' },
      { name: 'token', label: 'API-ключ', align: 'left', field: 'token' },
      { name: 'show-token', label: 'Показать ключ', align: 'center', field: 'show-token' }
    ],
    telegramBots: [],
    dialogVisible: false,
    dialogToken: '',
    dialogName: ''
  }),

  mounted () {
    axios.get('/api/v1/telegram-bots') /* http://localhost:8080 */
      .then(response => {
        this.telegramBots = response.data
        this.telegramBots.forEach(it => { it.showToken = false })
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

  methods: {
    toggleToken (row) {
      row.showToken = !row.showToken
    },

    updateToken () {

    },

    closeDialog () {
      this.dialogVisible = false
      this.dialogName = ''
      this.dialogToken = ''
    },

    dialogSaveNewBot () {
      const newBot = {
        id: null,
        name: this.dialogName,
        token: this.dialogToken
      }
      axios.post('/api/v1/new-telegram-bot', newBot) /* http://localhost:8080 */
        .then(response => {
          this.telegramBots.push(response.data)
          this.closeDialog()
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
    }
  }
}
</script>

<style scoped>
.table-container {
  width: 100%;
}
</style>
