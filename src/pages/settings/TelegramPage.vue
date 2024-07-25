<template>
  <div class="q-pa-md">
    <q-btn
      icon="add"
      label="Добавить бота"
      @click="this.dialogNewBotShow"
    />
    <q-btn
      icon="info"
      label="Инструкция"
      @click="this.isShowInstruction = true"
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
    <q-card class="dialog-width">
      <q-toolbar class="justify-end">
        <q-btn flat round dense icon="close" v-close-popup/>
      </q-toolbar>
      <q-card-section style="padding-top: 0">
        <q-input
          v-model="this.dialogName"
          label="Название"
          :rules="[val => (val && val.length > 0) || 'Обязательное поле']"
          ref="dialogName"
        />
        <q-input
          v-model="this.dialogToken"
          label="ключ API"
          :rules="[val => (val && val.length > 0) || 'Обязательное поле']"
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
  <q-dialog v-model="this.isShowInstruction">
    <q-card>
      <q-card-section>
        <div class="text-h6">Инструкция</div>
      </q-card-section>

      <q-card-section class="q-pt-none">
        Чтобы активировать сервис настройки чат-ботов, перейдите по ссылке <a href="https://t.me/BotFather">https://t.me/BotFather</a> и нажмите «Запустить».
      </q-card-section>

      <q-card-section class="q-pt-none" style="padding-bottom: 0;">
        После запуска появится список команд. Кроме того, базовые команды можно выбрать в BotFather, нажав на кнопку «Меню». Разберём основные опции, которые понадобятся на старте:
      </q-card-section>
      <q-card-section class="q-pt-none">
        <ul style="margin-top: 3px;margin-bottom: 3px;">
          <li>/setname — имя для чат-бота в Телеграм, которое будет появляться в диалогах с пользователями. </li>
          <li>/setdescription — описание для Телеграм-бота.</li>
          <li>/setabouttext — приветствие от бота.</li>
          <li>/setuserpic — аватарка умного помощника.</li>
          <li>/setcommands — стандартные команды для чат-бота.</li>
          <li>/deletebot — удаление Телеграм-бота.</li>
          <li>/token — генерация нового токена.</li>
          <li>/setinlinegeo — запрос геоданных у пользователей. </li>
          <li>/setjoingroups — добавление Телеграм-бота в каналы и чаты.</li>
          <li>/setprivacy — ограничение доступа бота к конфиденциальным данным.</li>
        </ul>
      </q-card-section>

      <q-card-section class="q-pt-none">
        Чтобы создать Телеграм-бот через BotFather, выбираем команду /newbot. BotFather попросит настроить название и имя для бота.
      </q-card-section>

      <q-card-section class="q-pt-none">
        Ограничений и особых требований для названия нет. Однако наименование должно быть строго на латинице с окончанием bot/Bot. В название можно добавить эмодзи, чтобы выделить бота в поиске Телеграм.
      </q-card-section>

      <q-card-section class="q-pt-none">
        Обратите внимание: имя Телеграм-бота должно быть уникальным. Если вы введёте наименование, которое уже есть в системе мессенджера, BotFather попросит вас выбрать другое имя.
      </q-card-section>

      <q-card-section class="q-pt-none">
        При создании бота BotFather генерирует уникальный токен — ключ к вашему чат-боту. Это специальный идентификатор, с помощью которого созданный вами чат-бот в Телеграме проходит авторизацию в интерфейсе мессенджера. Идентификатор понадобится вам при добавлении бота в настройках каналов связи.
      </q-card-section>

      <q-card-section class="q-pt-none">
        Не публикуйте идентификатор в открытом доступе. Также не рекомендуется сообщать его другим лицам, даже коллегам в пределах вашей компании. Иначе есть риск, что токен попадёт в руки злоумышленников, которые украдут Телеграм-бот.
      </q-card-section>
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
    dragging: false,
    telegramBotId: null,
    isShowInstruction: false// for updates
  }),

  mounted () {
    axios.get('/api/v1/telegram-bots')
      .then(response => {
        this.telegramBots = response.data
        this.telegramBots.forEach(it => {
          it.showToken = false
        })
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
      this.dialogName = ''
      this.dialogToken = ''
      setTimeout(() => this.$refs.dialogName.focus(), 250)
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
    },

    dialogDeleteBot () {
      const bot = this.telegramBots[this.telegramBots.indexOf(this.telegramBots.find(bot => bot.id === this.telegramBotId))]
      axios.delete(`/api/v1/telegram-bot/${bot.id}`, bot)
        .then(() => {
          this.telegramBots = this.telegramBots.filter(bot => bot.id !== this.telegramBotId)
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
      if (bot.name.length === 0 || bot.token.length === 0) {
        this.$q.notify({
          message: 'Не заполнены обязательные поля',
          type: 'negative',
          position: 'top-right',
          actions: [{
            icon: 'close', color: 'white', dense: true, handler: () => undefined
          }]
        })
        return
      }
      if (this.isNewTelegramBot) {
        axios.post('/api/v1/telegram-bot', bot)
          .then(response => {
            this.telegramBots.push(response.data)
            this.dialogClose()
            this.$q.notify({
              message: 'Бот добавлен',
              type: 'positive',
              position: 'top-right',
              actions: [{
                icon: 'check_circle', color: 'white', dense: true, handler: () => undefined
              }]
            })
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
        axios.patch('/api/v1/telegram-bot', bot)
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
