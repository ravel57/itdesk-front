<template>
  <div class="mfa-profile">
    <div class="row items-center no-wrap q-gutter-sm">
      <q-icon :name="status.enabled ? 'verified_user' : 'gpp_maybe'" :color="status.enabled ? 'positive' : 'grey-6'" size="sm"/>
      <div class="col">
        <div class="text-body2">
          Двухфакторная аутентификация {{ status.enabled ? 'включена' : 'выключена' }}
        </div>
        <div class="text-caption text-grey-7">
          <template v-if="status.enabled">
            Кодов восстановления осталось: {{ status.recoveryCodesLeft }}.
            <template v-if="status.required">Для администраторов она обязательна.</template>
          </template>
          <template v-else>После пароля при входе нужно будет ввести код из приложения на телефоне.</template>
        </div>
      </div>
      <q-btn
        v-if="!status.enabled"
        unelevated
        no-caps
        color="primary"
        label="Включить"
        @click="enrollDialog = true"
      />
      <q-btn
        v-else-if="!status.required"
        flat
        no-caps
        color="negative"
        label="Отключить"
        @click="disableDialog = true"
      />
    </div>

    <q-dialog v-model="enrollDialog" persistent>
      <q-card class="mfa-profile__dialog">
        <q-toolbar class="justify-between">
          <div class="text-h6">Двухфакторная аутентификация</div>
          <q-btn flat round dense icon="close" v-close-popup/>
        </q-toolbar>
        <q-card-section class="q-pt-none">
          <mfa-enrollment v-if="enrollDialog" @done="onEnrolled"/>
        </q-card-section>
      </q-card>
    </q-dialog>

    <q-dialog v-model="disableDialog">
      <q-card class="mfa-profile__dialog">
        <q-toolbar class="justify-between">
          <div class="text-h6">Отключить 2FA</div>
          <q-btn flat round dense icon="close" v-close-popup/>
        </q-toolbar>
        <q-card-section class="q-pt-none">
          <q-input
            v-model="disableCode"
            outlined
            dense
            autofocus
            autocomplete="one-time-code"
            label="Код из приложения или код восстановления"
            @keyup.enter="disable"
          />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Отмена" color="primary" v-close-popup/>
          <q-btn unelevated color="negative" label="Отключить" :loading="disabling" @click="disable"/>
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script>
import axios from 'axios'
import MfaEnrollment from 'components/mfa/MfaEnrollment.vue'

export default {
  name: 'MfaProfileSection',
  components: { MfaEnrollment },

  data: () => ({
    status: { enabled: false, required: false, recoveryCodesLeft: 0 },
    enrollDialog: false,
    disableDialog: false,
    disableCode: '',
    disabling: false
  }),

  mounted () {
    this.load()
  },

  methods: {
    load () {
      axios.get('/api/v1/auth/mfa/status')
        .then(({ data }) => { this.status = data || this.status })
    },

    onEnrolled () {
      this.enrollDialog = false
      this.load()
    },

    disable () {
      this.disabling = true
      axios.post('/api/v1/auth/mfa/disable', { code: this.disableCode })
        .then(() => {
          this.disableDialog = false
          this.disableCode = ''
          this.$q.notify({ type: 'positive', message: 'Двухфакторная аутентификация отключена' })
          this.load()
        })
        .catch(error => {
          this.$q.notify({ type: 'negative', message: error?.response?.data?.message || 'Не удалось отключить' })
        })
        .finally(() => { this.disabling = false })
    }
  }
}
</script>

<style scoped>
.mfa-profile__dialog {
  width: 420px;
  max-width: 96vw;
}
</style>
