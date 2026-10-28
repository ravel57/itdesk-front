<template>
  <q-layout>
    <q-page-container class="mfa-page app-auth-page">
      <q-page class="flex flex-center">
        <div class="mfa-box">
          <login-logo class="mfa-logo app-auth-logo"/>

          <div v-if="state === 'loading'" class="text-center q-pa-lg">
            <q-spinner color="primary" size="32px"/>
          </div>

          <template v-else-if="state === 'VERIFY'">
            <div class="mfa-title">Подтверждение входа</div>
            <div class="text-body2 text-center q-mb-sm">
              {{ useRecoveryCode ? 'Введите один из кодов восстановления.' : 'Введите 6-значный код из приложения-аутентификатора.' }}
            </div>
            <q-input
              v-model="code"
              outlined
              dense
              autofocus
              :inputmode="useRecoveryCode ? 'text' : 'numeric'"
              autocomplete="one-time-code"
              :label="useRecoveryCode ? 'Код восстановления' : 'Код из приложения'"
              @keyup.enter="verify"
            />
            <div v-if="attemptsLeft !== null" class="text-caption text-negative q-mt-xs">
              Осталось попыток: {{ attemptsLeft }}
            </div>
            <q-btn class="full-width q-mt-md" color="primary" label="Войти" :loading="verifying" @click="verify"/>
            <div class="row justify-between q-mt-sm">
              <a class="mfa-link" @click="toggleRecovery">
                {{ useRecoveryCode ? 'Код из приложения' : 'Нет телефона?' }}
              </a>
              <a class="mfa-link" href="/logout">Выйти</a>
            </div>
          </template>

          <template v-else-if="state === 'ENROLL'">
            <div class="mfa-title">Подключите двухфакторную аутентификацию</div>
            <div class="text-caption text-grey-7 text-center q-mb-sm">
              Для администраторов вход подтверждается кодом из приложения на телефоне.
            </div>
            <mfa-enrollment @done="finish"/>
            <div class="text-right q-mt-sm">
              <a class="mfa-link" href="/logout">Выйти</a>
            </div>
          </template>
        </div>
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<script>
import axios from 'axios'
import LoginLogo from 'components/LoginLogo.vue'
import { loginTargetFromRoute, loginUrl, safeLoginRedirect } from 'src/util/loginRedirect'
import MfaEnrollment from 'components/mfa/MfaEnrollment.vue'

export default {
  name: 'MfaPage',
  components: { LoginLogo, MfaEnrollment },

  data: () => ({
    state: 'loading',
    code: '',
    useRecoveryCode: false,
    verifying: false,
    attemptsLeft: null
  }),

  async mounted () {
    document.title = 'ULDESK : Подтверждение входа'
    try {
      const { data } = await axios.get('/api/v1/auth/mfa/status')
      if (!data?.state) {
        this.finish()
        return
      }
      this.state = data.state
    } catch (error) {
      this.returnToLogin()
    }
  },

  methods: {
    returnToLogin () {
      window.location.replace(loginUrl(loginTargetFromRoute(this.$route)))
    },
    toggleRecovery () {
      this.useRecoveryCode = !this.useRecoveryCode
      this.code = ''
    },

    async verify () {
      if (this.verifying || !this.code.trim()) {
        return
      }
      this.verifying = true
      try {
        const { data } = await axios.post('/api/v1/auth/mfa/verify', { code: this.code })
        this.finish(data?.redirect)
      } catch (error) {
        const body = error?.response?.data || {}
        this.code = ''
        if (body.loggedOut) {
          this.$q.notify({ type: 'negative', message: body.message })
          setTimeout(() => this.returnToLogin(), 1500)
          return
        }
        this.attemptsLeft = body.attemptsLeft ?? null
        this.$q.notify({ type: 'negative', message: body.message || 'Неверный код' })
      } finally {
        this.verifying = false
      }
    },

    finish (redirect) {
      // Полная загрузка: приложение заново получит пользователя, права и подключит сокет
      window.location.replace(loginTargetFromRoute(this.$route) || safeLoginRedirect(redirect) || '/')
    }
  }
}
</script>

<style scoped>
.mfa-box {
  background-color: var(--app-surface, white);
  padding: 16px;
  width: 340px;
  max-width: calc(100vw - 32px);
  border-radius: 4px;
}

.mfa-title {
  text-align: center;
  margin: 8px 0;
  font-size: 19px;
  font-weight: 550;
}

.mfa-link {
  color: var(--q-primary);
  cursor: pointer;
  font-size: 13px;
}
</style>
