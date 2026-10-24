<template>
  <div class="mfa-enrollment">
    <template v-if="!recoveryCodes.length">
      <div class="text-body2">
        1. Откройте приложение-аутентификатор (Google Authenticator, Яндекс Ключ, 1Password и др.)
        и отсканируйте QR-код.
      </div>
      <div class="mfa-enrollment__qr">
        <q-spinner v-if="!qrDataUrl" color="primary" size="40px"/>
        <img v-else :src="qrDataUrl" alt="QR-код для приложения-аутентификатора" width="200" height="200">
      </div>
      <div v-if="secret" class="text-caption text-grey-7 text-center">
        Не сканируется? Введите ключ вручную:
        <div class="mfa-enrollment__secret">{{ formattedSecret }}</div>
      </div>
      <div class="text-body2 q-mt-md">2. Введите 6-значный код из приложения.</div>
      <q-input
        v-model="code"
        outlined
        dense
        autofocus
        inputmode="numeric"
        autocomplete="one-time-code"
        maxlength="7"
        label="Код из приложения"
        class="q-mt-sm"
        :disable="!secret"
        @keyup.enter="confirm"
      />
      <q-btn
        class="full-width q-mt-md"
        color="primary"
        label="Подтвердить"
        :loading="confirming"
        :disable="!secret || code.replace(/\s/g, '').length !== 6"
        @click="confirm"
      />
    </template>

    <template v-else>
      <div class="text-subtitle1 text-positive">
        <q-icon name="verified_user" class="q-mr-xs"/>
        Двухфакторная аутентификация включена
      </div>
      <div class="text-body2 q-mt-sm">
        Сохраните коды восстановления в надёжном месте. Каждый код срабатывает один раз — если телефон потерян,
        войдите с ним вместо кода из приложения. Больше они показаны не будут.
      </div>
      <div class="mfa-enrollment__codes">
        <code v-for="recoveryCode in recoveryCodes" :key="recoveryCode">{{ recoveryCode }}</code>
      </div>
      <div class="row q-gutter-sm">
        <q-btn flat color="primary" icon="content_copy" label="Скопировать" @click="copyCodes"/>
        <q-btn flat color="primary" icon="download" label="Скачать" @click="downloadCodes"/>
      </div>
      <q-btn
        class="full-width q-mt-md"
        color="primary"
        label="Я сохранил коды"
        @click="$emit('done', redirect)"
      />
    </template>
  </div>
</template>

<script>
import axios from 'axios'
import QRCode from 'qrcode'

export default {
  name: 'MfaEnrollment',

  emits: ['done'],

  data: () => ({
    secret: '',
    qrDataUrl: '',
    code: '',
    confirming: false,
    recoveryCodes: [],
    redirect: null
  }),

  computed: {
    formattedSecret () {
      return (this.secret.match(/.{1,4}/g) || []).join(' ')
    }
  },

  async mounted () {
    try {
      const { data } = await axios.post('/api/v1/auth/mfa/enroll/start')
      this.secret = data.secret
      this.qrDataUrl = await QRCode.toDataURL(data.otpauthUri, { width: 200, margin: 1 })
    } catch (error) {
      this.$q.notify({ type: 'negative', message: error?.response?.data?.message || 'Не удалось начать подключение' })
    }
  },

  methods: {
    async confirm () {
      if (this.confirming) {
        return
      }
      this.confirming = true
      try {
        const { data } = await axios.post('/api/v1/auth/mfa/enroll/confirm', { code: this.code })
        this.recoveryCodes = Array.isArray(data?.recoveryCodes) ? data.recoveryCodes : []
        this.redirect = data?.redirect || null
        this.secret = ''
        this.qrDataUrl = ''
      } catch (error) {
        this.code = ''
        this.$q.notify({ type: 'negative', message: error?.response?.data?.message || 'Неверный код' })
      } finally {
        this.confirming = false
      }
    },

    copyCodes () {
      navigator.clipboard?.writeText(this.recoveryCodes.join('\n'))
        .then(() => this.$q.notify({ type: 'positive', message: 'Коды скопированы' }))
    },

    downloadCodes () {
      const blob = new Blob([`Коды восстановления ULDESK\n\n${this.recoveryCodes.join('\n')}\n`], { type: 'text/plain;charset=utf-8' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = 'uldesk-recovery-codes.txt'
      link.click()
      URL.revokeObjectURL(link.href)
    }
  }
}
</script>

<style scoped>
.mfa-enrollment__qr {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 210px;
  margin: 12px 0 4px;
}

.mfa-enrollment__secret {
  font-family: monospace;
  font-size: 13px;
  color: #333;
  word-break: break-all;
  margin-top: 2px;
}

.mfa-enrollment__codes {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 6px 16px;
  margin: 12px 0;
  padding: 12px;
  border-radius: 6px;
  background: #f5f6fa;
  font-family: monospace;
  font-size: 15px;
}
</style>
