<template>
  <div class="q-pa-md">
    <q-btn
      icon="add"
      label="Добавить бота"
      @click="this.dialogNewEmailShow"
    />
    <div class="table-container">
      <q-table
        :rows="this.emails"
        :columns="this.columns"
        row-key="id"
        full-width
      >
        <template v-slot:body-cell-password="props">
          <q-td :props="props">
            <span
              v-if="!props.row.showPassword"
              v-text="'**********'"
            />
            <span
              v-else
              v-text="props.row.password"
            />
          </q-td>
        </template>
        <template v-slot:body-cell-show-password="props">
          <q-td :props="props">
            <q-btn
              color="primary"
              dense
              flat
              icon="visibility"
              @click="togglePasswordVisibility(props.row)"
            />
            <q-btn
              color="primary"
              dense
              flat
              icon="edit"
              @click="updateEmail(props.row)"
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
          v-model="this.dialogEmailFrom"
          label="почта отправления"
          :rules="[val => (val && val.length > 0) || 'Обязательное поле']"
        />
        <q-input
          v-model="this.dialogPassword"
          label="пароль"
          :rules="[val => (val && val.length > 0) || 'Обязательное поле']"
        />
        <q-input
          v-model="this.dialogImapServer"
          label="IMAP Server"
          :rules="[val => (val && val.length > 0) || 'Обязательное поле']"
        />
        <q-input
          v-model="this.dialogImapPort"
          label="IMAP Port"
          :rules="[val => (val && val.length > 0) || 'Обязательное поле']"
        />
        <q-input
          v-model="this.dialogSmtpServer"
          label="SMTP Server"
          :rules="[val => (val && val.length > 0) || 'Обязательное поле']"
        />
        <q-input
          v-model="this.dialogSmtpPort"
          label="SMTP Port"
          :rules="[val => (val && val.length > 0) || 'Обязательное поле']"
        />
        <q-input
          v-model="this.dialogSubject"
          label="тема для писем"
          :rules="[val => (val && val.length > 0) || 'Обязательное поле']"
        />
      </q-card-section>
      <q-card-actions align="right">
        <q-btn
          v-if="!this.isNewEmail"
          color="white"
          label="Удалить"
          text-color="primary"
          @click="dialogDeleteEmail"
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
          @click="dialogSaveNewOrUpdateEmail"/>
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script>
import { useStore } from 'stores/store'
import axios from 'axios'

export default {
  name: 'EmailPage',

  data: () => ({
    columns: [
      { name: 'name', label: 'Название', align: 'left', field: 'name' },
      { name: 'emailFrom', label: 'почта', align: 'left', field: 'emailFrom' },
      { name: 'password', label: 'пароль', align: 'left', field: 'password' },
      { name: 'show-password', label: 'Показать пароль', align: 'center', field: 'show-password' }
    ],
    emails: [],
    dialogVisible: false,
    dialogName: '',
    dialogEmailFrom: '',
    dialogPassword: '',
    dialogSmtpServer: '',
    dialogSmtpPort: '465',
    dialogImapServer: '',
    dialogImapPort: '993',
    dialogSubject: '',
    isNewEmail: false,
    showPassword: false,
    emailId: null // for updates
  }),

  methods: {
    togglePasswordVisibility (row) {
      row.showPassword = !row.showPassword
    },

    dialogNewEmailShow () {
      this.dialogVisible = true
      this.isNewEmail = true
      this.dialogName = ''
      this.dialogEmailFrom = ''
      this.dialogPassword = ''
      this.dialogSmtpServer = ''
      this.dialogImapPort = '993'
      this.dialogSubject = ''
      this.dialogSmtpPort = '465'
      this.dialogImapServer = ''
      setTimeout(() => this.$refs.dialogName.focus(), 250)
    },

    updateEmail (row) {
      this.isNewEmail = false
      this.dialogVisible = true
      this.dialogName = row.name
      this.dialogEmailFrom = row.emailFrom
      this.dialogPassword = row.password
      this.dialogSmtpServer = row.smtpServer
      this.dialogSmtpPort = row.smtpPort
      this.dialogImapServer = row.imapServer
      this.dialogImapPort = row.imapPort
      this.dialogSubject = row.subject
      this.emailId = row.id
    },

    dialogClose () {
      this.dialogVisible = false
    },

    dialogDeleteEmail () {
      const email = this.emails[this.emails.indexOf(this.emails.find(email => email.id === this.emailId))]
      axios.delete(`/api/v1/email/${email.id}`, email)
        .then(() => {
          this.emails = this.emails.filter(email => email.id !== this.emailId)
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

    dialogSaveNewOrUpdateEmail () {
      const email = {
        id: this.isNewEmail ? null : this.emailId,
        name: this.dialogName,
        emailFrom: this.dialogEmailFrom,
        password: this.dialogPassword,
        smtpServer: this.dialogSmtpServer,
        smtpPort: this.dialogSmtpPort,
        imapServer: this.dialogImapServer,
        imapPort: this.dialogImapPort,
        subject: this.dialogSubject
      }
      if (this.isNewEmail) {
        axios.post('/api/v1/new-email', email)
          .then(response => {
            this.emails.push(response.data)
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
        axios.post('/api/v1/update-email', email)
          .then(response => {
            const emails = this.emails
            this.emails[emails.indexOf(emails.find(email => email.id === this.emailId))] = response.data
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
  },

  mounted () {
    axios.get('/api/v1/emails')
      .then(response => {
        this.emails = response.data
        this.emails.forEach(it => {
          it.showPassword = false
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

  setup () {
    const store = useStore()
    return { store }
  }
}

</script>

<style scoped>

</style>
