<template>
  <q-page class="profile-page q-pa-md">
    <div class="profile-page__content column q-gutter-md">
      <div class="settings-content-header q-mb-none">
        <div class="settings-content-heading">
          <div class="settings-content-title">Профиль</div>
          <div class="settings-content-description">
            Управляйте уведомлениями, безопасностью и личными параметрами аккаунта.
          </div>
        </div>
      </div>

      <q-card flat bordered class="profile-card">
        <q-card-section>
          <div class="text-subtitle1 text-weight-medium">
            Уведомления
          </div>
          <div class="text-caption text-grey-7">
            Настройте, какие события будут показываться в системных уведомлениях браузера
          </div>
        </q-card-section>

        <q-separator/>

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
          <q-checkbox
            v-model="notifySlaHalfTimePassed"
            label="Уведомлять, когда SLA прошёл на 50%"
          />
          <q-checkbox
            v-model="notifySlaOverdue"
            label="Уведомлять, когда SLA нарушен"
          />
          <div class="row items-center q-gutter-sm">
            <q-checkbox
              v-model="notifyChatUnansweredTooLong"
              label="Уведомлять, если новое сообщение в чате без ответа дольше"
            />

            <q-input
              v-model.number="notifyChatUnansweredTooLongMinutes"
              type="number"
              dense
              outlined
              suffix="мин."
              style="width: 130px"
              :disable="!notifyChatUnansweredTooLong"
              :min="1"
              :step="1"
            />
          </div>

          <q-checkbox
            v-model="notifyDeadlineOverdue"
            label="Уведомлять о нарушении дедлайна"
          />

          <div class="row items-center q-gutter-sm">
            <q-checkbox
              v-model="notifyDeadlineOverdueBeforeMinutesEnabled"
              label="Уведомлять за"
            />
            <q-input
              v-model.number="notifyDeadlineOverdueBeforeMinutes"
              type="number"
              dense
              outlined
              suffix="мин."
              style="width: 130px"
              :disable="!notifyDeadlineOverdueBeforeMinutesEnabled"
              :min="1"
              :step="1"
            />
            <span>до дедлайна</span>
          </div>

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

        <q-separator/>

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
          <q-btn flat round dense icon="close" v-close-popup/>
        </q-toolbar>

        <q-card-section class="column q-gutter-md">
          <q-input
            v-model="newPassword"
            label="Новый пароль *"
            :rules="[val => (val && val.length > 0) || 'Обязательное поле']"
            type="password"
          />
          <q-input
            v-model="newPasswordReenter"
            label="Повторите новый пароль *"
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
import {useStore} from 'stores/store'
import {useSystemNotifications} from 'src/composables/useSystemNotifications'

export default {
  name: 'ProfileSettings',

  data() {
    const {
      requestPermission,
      notify,
      permission
    } = useSystemNotifications()
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
      notifyTaskNewMessageAssigned: false,
      notifySlaHalfTimePassed: false,
      notifySlaOverdue: false,
      notifyChatUnansweredTooLong: false,
      notifyChatUnansweredTooLongMinutes: 30,
      notifyDeadlineOverdueBeforeMinutes: 30,
      notifyDeadlineOverdue: false,
      notifyDeadlineOverdueBeforeMinutesEnabled: false,
      isLoadingNotificationSettings: false,
    }
  },

  methods: {
    changePassword() {
      if (this.newPassword.length === 0 || this.newPasswordReenter.length === 0) {
        this.showNegativeNotify('Не заполнены обязательные поля')
        return
      }
      if (this.newPassword !== this.newPasswordReenter) {
        this.showNegativeNotify('Пароли не совпадают')
        return
      }

      axios.post('/api/v1/user/change-password', {password: this.newPassword})
        .then(() => {
          this.newPasswordDialogClose()
        })
        .catch(e => {
          this.showNegativeNotify(e.message)
        })
    },

    newPasswordDialogShow() {
      this.isNewPasswordDialogShow = true
      this.newPassword = ''
      this.newPasswordReenter = ''
    },

    newPasswordDialogClose() {
      this.isNewPasswordDialogShow = false
    },

    async ask() {
      this.perm = await this.myRequestPermission()
    },

    notify() {
      const n = this.myNotify('ULDesk', {
        body: 'Новая заявка назначена на вас',
        tag: 'new-task'
      })

      if (!n) {
        alert('Нет разрешения или браузер не поддерживает уведомления')
      }
    },

    showNegativeNotify(message) {
      this.$q.notify({
        message,
        type: 'negative',
        position: 'top-right',
        actions: [{
          icon: 'close',
          color: 'white',
          dense: true,
          handler: () => undefined
        }]
      })
    },

    loadNotificationSettings() {
      this.isLoadingNotificationSettings = true
      axios.get('/api/v1/user/notification-settings')
        .then(({data}) => {
          this.notifyChatPing = !!data.notifyChatPing
          this.notifyTaskChatPing = !!data.notifyTaskChatPing
          this.notifyNewAssignedTask = !!data.notifyNewAssignedTask
          this.notifyTaskNewMessageAssigned = !!data.notifyTaskNewMessageAssigned
          this.notifySlaHalfTimePassed = !!data.notifySlaHalfTimePassed
          this.notifySlaOverdue = !!data.notifySlaOverdue
          this.notifyDeadlineOverdue = !!data.notifyDeadlineOverdue
          this.notifyDeadlineOverdueBeforeMinutesEnabled = !!data.notifyDeadlineOverdueBeforeMinutesEnabled
          this.notifyChatUnansweredTooLong = !!data.notifyChatUnansweredTooLong
          const chatUnansweredTooLongMinutes = Number(data.notifyChatUnansweredTooLongMinutes)
          this.notifyChatUnansweredTooLongMinutes = Number.isFinite(chatUnansweredTooLongMinutes) && chatUnansweredTooLongMinutes >= 1
            ? Math.floor(chatUnansweredTooLongMinutes)
            : 30
          const deadlineOverdueBeforeMinutes = Number(data.notifyDeadlineOverdueBeforeMinutes)
          this.notifyDeadlineOverdueBeforeMinutes = Number.isFinite(deadlineOverdueBeforeMinutes) && deadlineOverdueBeforeMinutes >= 1
            ? Math.floor(deadlineOverdueBeforeMinutes)
            : 30
        })
        .catch(e => {
          this.showNegativeNotify(e.message)
        })
        .finally(() => {
          this.$nextTick(() => {
            this.isLoadingNotificationSettings = false
          })
        })
    },

    async saveNotificationSettings() {
      if (!this.validateNotificationSettings()) {
        return
      }
      return axios.patch('/api/v1/user/notification-settings', this.getNotificationSettingsPayload())
        .then(() => {
          this.$q.notify({
            message: 'Настройки уведомлений сохранены',
            type: 'positive',
            position: 'top-right',
            actions: [{
              icon: 'close',
              color: 'white',
              dense: true,
              handler: () => undefined
            }]
          })
        })
        .catch(e => {
          this.showNegativeNotify(e.message)
        })
    },

    saveNotificationSettingsSilent() {
      if (this.isLoadingNotificationSettings) {
        return
      }
      axios.patch('/api/v1/user/notification-settings', this.getNotificationSettingsPayload())
        .catch(e => {
          this.showNegativeNotify(e.message)
        })
    },

    getNotificationSettingsPayload() {
      const minutes = Number(this.notifyChatUnansweredTooLongMinutes)
      const deadlineOverdueBeforeMinutes = Number(this.notifyDeadlineOverdueBeforeMinutes)
      return {
        notifyChatPing: this.notifyChatPing,
        notifyTaskChatPing: this.notifyTaskChatPing,
        notifyNewAssignedTask: this.notifyNewAssignedTask,
        notifyTaskNewMessageAssigned: this.notifyTaskNewMessageAssigned,
        notifySlaHalfTimePassed: this.notifySlaHalfTimePassed,
        notifySlaOverdue: this.notifySlaOverdue,
        notifyDeadlineOverdue: this.notifyDeadlineOverdue,
        notifyDeadlineOverdueBeforeMinutesEnabled: this.notifyDeadlineOverdueBeforeMinutesEnabled,
        notifyChatUnansweredTooLong: this.notifyChatUnansweredTooLong,
        notifyChatUnansweredTooLongMinutes: Number.isFinite(minutes) && minutes >= 1
          ? Math.floor(minutes)
          : 30,
        notifyDeadlineOverdueBeforeMinutes: Number.isFinite(deadlineOverdueBeforeMinutes) && deadlineOverdueBeforeMinutes >= 1
          ? Math.floor(deadlineOverdueBeforeMinutes)
          : 30,
      }
    },

    validateNotificationSettings() {
      const deadlineOverdueBeforeMinutes = Number(this.notifyDeadlineOverdueBeforeMinutes)
      const chatUnansweredTooLongMinutes = Number(this.notifyChatUnansweredTooLongMinutes)
      if (this.notifyDeadlineOverdueBeforeMinutesEnabled && (!Number.isFinite(deadlineOverdueBeforeMinutes) || deadlineOverdueBeforeMinutes < 1)) {
        this.showNegativeNotify('Укажите количество минут до дедлайна больше 0')
        return false
      }
      if (!Number.isFinite(chatUnansweredTooLongMinutes) || chatUnansweredTooLongMinutes < 1) {
        this.showNegativeNotify('Укажите количество минут для чата без ответа больше 0')
        return false
      }
      this.notifyDeadlineOverdueBeforeMinutes = Math.floor(deadlineOverdueBeforeMinutes)
      this.notifyChatUnansweredTooLongMinutes = Math.floor(chatUnansweredTooLongMinutes)
      return true
    },
  },

  watch: {
    notifyChatPing: 'saveNotificationSettingsSilent',
    notifyTaskChatPing: 'saveNotificationSettingsSilent',
    notifyNewAssignedTask: 'saveNotificationSettingsSilent',
    notifyTaskNewMessageAssigned: 'saveNotificationSettingsSilent',
    notifySlaHalfTimePassed: 'saveNotificationSettingsSilent',
    notifySlaOverdue: 'saveNotificationSettingsSilent',
    notifyChatUnansweredTooLong: 'saveNotificationSettingsSilent',
    notifyDeadlineOverdue: 'saveNotificationSettingsSilent',
    notifyDeadlineOverdueBeforeMinutesEnabled: 'saveNotificationSettingsSilent',
  },

  mounted() {
    this.loadNotificationSettings()
  },

  setup() {
    const store = useStore()
    return {store}
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
