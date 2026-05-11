<template>
  <q-page class="profile-page q-pa-md">
    <div class="profile-page__content column q-gutter-md">
      <q-card flat bordered class="profile-card">
        <q-card-section>
          <div class="text-h6">
            Профиль
          </div>
          <div class="text-caption text-grey-7">
            Личные настройки пользователя
          </div>
        </q-card-section>
      </q-card>

      <q-card flat bordered class="profile-card">
        <q-card-section>
          <div class="text-subtitle1 text-weight-medium">
            Уведомления
          </div>
          <div class="text-caption text-grey-7">
            Настройте, какие события будут показываться в системных уведомлениях браузера
          </div>
        </q-card-section>

        <q-separator />

        <q-card-section class="column q-gutter-y-sm">
          <div class="row items-center q-gutter-sm">
            <q-btn
              v-if="perm !== 'granted'"
              color="primary"
              unelevated
              label="Разрешить уведомления"
              @click="ask"
            />

            <q-badge
              v-else
              color="positive"
              outline
              label="Уведомления разрешены"
            />
          </div>

          <q-checkbox
            v-model="notifyChatPing"
            label="Уведомлять при пинге в чате"
          />
          <q-checkbox
            v-model="notifyTaskChatPing"
            label="Уведомлять при пинге в чате внутри заявки"
          />
          <q-checkbox
            v-model="notifyNewAssignedTask"
            label="Уведомлять о новой заявке, где вы назначены исполнителем"
          />
          <q-checkbox
            v-model="notifyTaskNewMessageAssigned"
            label="Уведомлять при новом сообщении в чате внутри заявки, где вы назначены исполнителем"
          />

          <div class="row q-mt-md">
            <q-btn
              color="primary"
              unelevated
              label="Сохранить настройки уведомлений"
              @click="saveNotificationSettings"
            />
          </div>
        </q-card-section>
      </q-card>

      <q-card flat bordered class="profile-card">
        <q-card-section>
          <div class="text-subtitle1 text-weight-medium">
            Безопасность
          </div>
          <div class="text-caption text-grey-7">
            Управление паролем и доступом к аккаунту
          </div>
        </q-card-section>

        <q-separator />

        <q-card-section>
          <q-btn
            color="primary"
            unelevated
            label="Сменить пароль"
            @click="newPasswordDialogShow"
          />
        </q-card-section>
      </q-card>
    </div>

    <q-dialog
      v-model="isNewPasswordDialogShow"
      persistent
      backdrop-filter="blur(4px)"
    >
      <q-card class="dialog-width">
        <q-toolbar class="justify-between">
          <div class="text-h6">
            Сменить пароль
          </div>
          <q-btn flat round dense icon="close" v-close-popup />
        </q-toolbar>

        <q-card-section class="column q-gutter-md">
          <q-input
            v-model="newPassword"
            label="Новый пароль"
            :rules="[val => (val && val.length > 0) || 'Обязательное поле']"
            type="password"
          />
          <q-input
            v-model="newPasswordReenter"
            label="Повторите новый пароль"
            :rules="[val => (val && val.length > 0) || 'Обязательное поле']"
            type="password"
          />
        </q-card-section>

        <q-card-actions align="right">
          <q-btn
            color="white"
            text-color="primary"
            label="Отмена"
            @click="newPasswordDialogClose"
          />
          <q-btn
            color="primary"
            label="Сохранить"
            @click="changePassword"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script>
import axios from 'axios'
import { useStore } from 'stores/store'
import { useSystemNotifications } from 'src/composables/useSystemNotifications'

export default {
  name: 'ProfileSettings',

  data () {
    const { requestPermission, notify, permission } = useSystemNotifications()
    return {
      isNewPasswordDialogShow: false,
      newPassword: '',
      newPasswordReenter: '',
      perm: permission(),
      myRequestPermission: requestPermission,
      myNotify: notify,
      notifyChatPing: false,
      notifyTaskChatPing: false,
      notifyNewAssignedTask: false,
      notifyTaskNewMessageAssigned: false
    }
  },

  methods: {
    changePassword () {
      if (this.newPassword.length === 0 || this.newPasswordReenter.length === 0) {
        this.showNegativeNotify('Не заполнены обязательные поля')
        return
      }
      if (this.newPassword !== this.newPasswordReenter) {
        this.showNegativeNotify('Пароли не совпадают')
        return
      }

      axios.post('/api/v1/user/change-password', { password: this.newPassword })
        .then(() => {
          this.newPasswordDialogClose()
        })
        .catch(e => {
          this.showNegativeNotify(e.message)
        })
    },

    newPasswordDialogShow () {
      this.isNewPasswordDialogShow = true
      this.newPassword = ''
      this.newPasswordReenter = ''
    },

    newPasswordDialogClose () {
      this.isNewPasswordDialogShow = false
    },

    async ask () {
      this.perm = await this.myRequestPermission()
    },

    notify () {
      const n = this.myNotify('ULDesk', {
        body: 'Новая заявка назначена на вас',
        tag: 'new-task'
      })

      if (!n) {
        alert('Нет разрешения или браузер не поддерживает уведомления')
      }
    },

    showNegativeNotify (message) {
      this.$q.notify({
        message,
        type: 'negative',
        position: 'top-right',
        actions: [{
          icon: 'close', color: 'white', dense: true, handler: () => undefined
        }]
      })
    },

    loadNotificationSettings () {
      axios.get('/api/v1/user/notification-settings')
        .then(({ data }) => {
          this.notifyChatPing = !!data.notifyChatPing
          this.notifyTaskChatPing = !!data.notifyTaskChatPing
          this.notifyNewAssignedTask = !!data.notifyNewAssignedTask
          this.notifyTaskNewMessageAssigned = !!data.notifyTaskNewMessageAssigned
        })
        .catch(e => {
          this.showNegativeNotify(e.message)
        })
    },

    saveNotificationSettings () {
      axios.patch('/api/v1/user/notification-settings', {
        notifyChatPing: this.notifyChatPing,
        notifyTaskChatPing: this.notifyTaskChatPing,
        notifyNewAssignedTask: this.notifyNewAssignedTask,
        notifyTaskNewMessageAssigned: this.notifyTaskNewMessageAssigned
      })
        .then(() => {
          this.$q.notify({
            message: 'Настройки уведомлений сохранены',
            type: 'positive',
            position: 'top-right'
          })
        })
        .catch(e => {
          this.showNegativeNotify(e.message)
        })
    }
  },

  watch: {
    notifyChatPing: 'saveNotificationSettingsSilent',
    notifyTaskChatPing: 'saveNotificationSettingsSilent',
    notifyNewAssignedTask: 'saveNotificationSettingsSilent',
    notifyTaskNewMessageAssigned: 'saveNotificationSettingsSilent'
  },

  mounted () {
    this.loadNotificationSettings()
  },

  setup () {
    const store = useStore()
    return { store }
  },
}
</script>

<style scoped>
.profile-page {
  height: 100%;
  overflow: auto;
}

.profile-page__content {
  max-width: 760px;
}

.profile-card {
  border-radius: 12px;
}

.dialog-width {
  width: 520px;
  max-width: calc(100vw - 32px);
}
</style>
