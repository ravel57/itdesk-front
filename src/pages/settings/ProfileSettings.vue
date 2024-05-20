<template>
  <div class="q-pa-md">
    <q-btn
      label="Сменить пароль"
      @click="this.newPasswordDialogShow"
    />
  </div>
  <q-dialog
    v-model="this.isNewPasswordDialogShow"
    persistent
    backdrop-filter="blur(4px)"
  >
    <q-card class="dialog-width">
      <q-toolbar class="justify-end">
        <q-btn flat round dense icon="close" v-close-popup />
      </q-toolbar>
      <q-card-section style="padding-top: 0">
        Новый пароль
      </q-card-section>
      <q-input
        v-model="this.newPassword"
        label="Новый пароль"
        type="password"
        style="padding: 16px"
      />
      <q-input
        v-model="this.newPasswordReenter"
        label="Повторите новый пароль"
        type="password"
        style="padding: 16px"
      />
      <q-card-actions align="right">
        <q-btn
          color="white"
          text-color="primary"
          label="Отмена"
          @click="this.newPasswordDialogClose"
        />
        <q-btn
          color="primary"
          label="Сохранить"
          @click="this.changePassword"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script>
import axios from 'axios'
import { useStore } from 'stores/store'

export default {
  name: 'ProfileSettings',

  data: () => ({
    isNewPasswordDialogShow: false,
    newPassword: '',
    newPasswordReenter: ''
  }),

  methods: {
    changePassword () {
      if (this.newPassword === this.newPasswordReenter) {
        axios.post('/api/v1/user/change-password', { password: this.newPassword })
          .then(() => {
            this.newPasswordDialogClose()
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
        this.$q.notify({
          message: 'Пароли не совпадают',
          type: 'negative',
          position: 'top-right',
          actions: [{
            icon: 'close', color: 'white', dense: true, handler: () => undefined
          }]
        })
      }
    },

    newPasswordDialogShow () {
      this.isNewPasswordDialogShow = true
      this.newPassword = ''
      this.newPasswordReenter = ''
    },

    newPasswordDialogClose () {
      this.isNewPasswordDialogShow = false
    }
  },

  setup () {
    const store = useStore()
    return { store }
  }
}
</script>

<style scoped>

</style>
