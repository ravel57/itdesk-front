<template>
  <div class="q-pa-md">
    <div style="display:flex; gap:12px; flex-wrap:wrap;">
      <q-btn v-if="perm !== 'granted'" @click="ask">
        Разрешить уведомления
      </q-btn>
    </div>

    <q-separator class="q-mt-md q-mb-sm" />

    <div class="column q-gutter-y-sm">
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
        label="Уведомлять о новой заявке где вы назначены исполнителем"
      />
      <q-checkbox
        v-model="notifyTaskNewMessageAssigned"
        label="Уведомлять при новом сообщении в чате внутри заявки, где вы назначены исполнителем"
      />
    </div>
  </div>
</template>

<script>
import { useSystemNotifications } from 'src/composables/useSystemNotifications'

export default {
  name: 'SystemNotificationsDemo',

  data () {
    const { requestPermission, notify, permission } = useSystemNotifications()

    return {
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
    }
  }
}
</script>

<style scoped>

</style>
