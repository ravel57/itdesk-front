<template>
  <div class="q-pa-md">
    <q-btn
      icon="add"
      label="Добавить WhatsApp"
      @click="this.dialogNewAccountShow"
      style="margin-bottom: 8px;margin-right: 8px"
    />
    <q-btn
      icon="info"
      label="Инструкция"
      @click="this.isShowInstruction = true"
      style="margin-bottom: 8px;"
    />
    <div class="table-container">
      <q-table
        :rows="whatsappAccounts"
        :columns="columns"
        :rows-per-page-options="[0]"
        row-key="id"
        full-width
      >
        <template v-slot:body-cell-apiKey="props">
          <q-td :props="props">
            <span
              v-if="!props.row.showApiKey"
              v-text="'**********************************************'"
            />
            <span
              v-else
              v-text="props.row.apiKey"
            />
          </q-td>
        </template>
        <template v-slot:body-cell-show-api-key="props">
          <q-td :props="props">
            <q-btn
              color="primary"
              dense
              flat
              icon="visibility"
              @click="toggleApiKeyVisibility(props.row)"
            />
            <q-btn
              color="primary"
              dense
              flat
              icon="edit"
              @click="updateAuthorities(props.row)"
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
      <q-toolbar class="justify-between">
        <div class="text-h6" v-text="this.isNewWhatsappAccount ? 'Новый WhatsApp' : 'Изменить WhatsApp'"/>
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
          v-model="this.dialogApiKey"
          label="ключ API"
          :rules="[val => (val && val.length > 0) || 'Обязательное поле']"
        />
        <q-input
          v-model="this.dialogWhatsappID"
          label="WhatsappID"
          :rules="[val => (val && val.length > 0) || 'Обязательное поле']"
        />
      </q-card-section>
      <q-card-actions align="right">
        <q-btn
          v-if="!this.isNewWhatsappAccount"
          color="white"
          label="Удалить"
          text-color="primary"
          @click="dialogDeleteAccount"
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
          @click="dialogSaveNewOrUpdateAccount"/>
      </q-card-actions>
    </q-card>
  </q-dialog>
  <q-dialog
    v-model="this.isShowInstruction"
  >
    <whats-app-instruction/>
  </q-dialog>
</template>

<script>
import axios from 'axios'
import WhatsApp from 'components/instructions/WhatsApp.vue'

export default {
  name: 'WhatsappPage',
  components: { 'whats-app-instruction': WhatsApp },

  data: () => ({
    columns: [
      { name: 'name', label: 'Название', align: 'left', field: 'name' },
      { name: 'whatsappId', label: 'Whatsapp ID', align: 'left', field: 'whatsappId' },
      { name: 'apiKey', label: 'API-ключ', align: 'left', field: 'apiKey' },
      { name: 'show-api-key', label: 'Показать ключ', align: 'center', field: 'show-api-key' }
    ],
    whatsappAccounts: [],
    dialogVisible: false,
    dialogApiKey: '',
    dialogName: '',
    dialogWhatsappID: '',
    isNewWhatsappAccount: true,
    dragging: false,
    whatsappAccountId: null,
    isShowInstruction: false// for updates
  }),

  created () {
    axios.get('/api/v1/whatsapp')
      .then(response => {
        this.whatsappAccounts = response.data
        this.whatsappAccounts.forEach(it => {
          it.showApiKey = false
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
    toggleApiKeyVisibility (row) {
      row.showApiKey = !row.showApiKey
    },

    dialogNewAccountShow () {
      this.dialogVisible = true
      this.isNewWhatsappAccount = true
      this.dialogName = ''
      this.dialogApiKey = ''
      this.dialogWhatsappID = ''
      setTimeout(() => this.$refs.dialogName.focus(), 250)
    },

    updateAuthorities (row) {
      this.isNewWhatsappAccount = false
      this.dialogVisible = true
      this.dialogName = row.name
      this.dialogApiKey = row.apiKey
      this.dialogWhatsappID = row.whatsappId
      this.whatsappAccountId = row.id
    },

    dialogClose () {
      this.dialogVisible = false
    },

    dialogDeleteAccount () {
      const account = this.whatsappAccounts[this.whatsappAccounts.indexOf(this.whatsappAccounts.find(account => account.id === this.whatsappAccountId))]
      axios.delete(`/api/v1/whatsapp/${account.id}`, account)
        .then(() => {
          this.whatsappAccounts = this.whatsappAccounts.filter(account => account.id !== this.whatsappAccountId)
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

    dialogSaveNewOrUpdateAccount () {
      const account = {
        id: this.isNewWhatsappAccount ? null : this.whatsappAccountId,
        name: this.dialogName,
        apiKey: this.dialogApiKey,
        whatsappId: this.dialogWhatsappID
      }
      if (account.name.length === 0 || account.apiKey.length === 0) {
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
      if (this.isNewWhatsappAccount) {
        axios.post('/api/v1/whatsapp', account)
          .then(response => {
            this.whatsappAccounts.push(response.data)
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
        axios.patch('/api/v1/whatsapp', account)
          .then(response => {
            const accounts = this.whatsappAccounts
            this.whatsappAccounts[accounts.indexOf(accounts.find(account => account.id === this.whatsappAccountId))] = response.data
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
