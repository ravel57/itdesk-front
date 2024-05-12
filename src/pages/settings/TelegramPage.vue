<template>
  <div class="q-pa-md">
    <q-btn
      icon="add"
      label="Добавить бота"
      @click="this.dialogNewBotShow"
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
          <span
            v-if="!props.row.showToken"
            v-text="'**********************************************'"
          />
          <span
            v-else
            v-text="props.row.token"
          />
        </q-td>
      </template>
      <template v-slot:body-cell-show-token="props">
        <q-td :props="props">
          <q-btn
            color="primary"
            dense
            flat
            icon="visibility"
            @click="toggleTokenVisibility(props.row)"
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
    <q-card style="width: 50vw;">
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
          v-if="!this.isNewTelegramBot"
          color="white"
          label="Удалить"
          text-color="primary"
          @click="dialogDeleteBot"
        />
        <q-btn
          color="white"
          label="Закрыть"
          text-color="primary"
          @click="dialogClose"
        />
        <q-btn
          color="primary"
          label="Сохранить"
          @click="dialogSaveNewOrUpdateBot"/>
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
    dialogName: '',
    isNewTelegramBot: true,
    telegramBotId: null // for updates
  }),

  mounted () {
    axios.get('/api/v1/telegram-bots')
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
    toggleTokenVisibility (row) {
      row.showToken = !row.showToken
    },

    dialogNewBotShow () {
      this.dialogVisible = true
      this.isNewTelegramBot = true
    },

    updateToken (row) {
      this.isNewTelegramBot = false
      this.dialogVisible = true
      this.dialogName = row.name
      this.dialogToken = row.token
      this.telegramBotId = row.id
    },

    dialogClose () {
      this.dialogVisible = false
      this.dialogName = ''
      this.dialogToken = ''
    },

    // FIXME
    dialogDeleteBot () {
      const bot = this.telegramBots[this.telegramBots.indexOf(this.telegramBots.find(bot => bot.id === this.telegramBotId))]
      console.log(bot)
      axios.post('/api/v1/delete-telegram-bot', bot)
        .then(response => {
          const bots = this.telegramBots
          this.telegramBots[bots.indexOf(bots.find(bot => bot.id === this.telegramBotId))] = response.data
          this.dialogClose()
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

    dialogSaveNewOrUpdateBot () {
      const bot = {
        id: this.isNewTelegramBot ? null : this.telegramBotId,
        name: this.dialogName,
        token: this.dialogToken
      }
      if (this.isNewTelegramBot) {
        axios.post('/api/v1/new-telegram-bot', bot)
          .then(response => {
            this.telegramBots.push(response.data)
            this.dialogClose()
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
      } else {
        axios.post('/api/v1/update-telegram-bot', bot)
          .then(response => {
            const bots = this.telegramBots
            this.telegramBots[bots.indexOf(bots.find(bot => bot.id === this.telegramBotId))] = response.data
            this.dialogClose()
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
}
</script>

<style scoped>
.table-container {
  width: 100%;
}
</style>
