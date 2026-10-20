<template>
  <div v-if="!this.requestSend" class="centered-container">
    <div class="login-box">
      <login-logo class="login-logo" />
      <div
        v-if="this.login"
        class="login-title"
      >
        Войти в ULDESK
      </div>
      <div
        v-else-if="this.passwordRestore"
        class="restore-password-container"
      >
        <div class="restore-header">
          <q-btn
            dense
            flat
            rounded
            @click="this.changeView('login')"
            class="back-btn"
            icon="arrow_back"
          />
          <div class="restore-title">
            Забыли пароль?
          </div>
          <div class="spacer" />
        </div>
      </div>
      <div
        v-else-if="this.emailRestore"
        class="restore-email-container"
      >
        <div class="restore-header">
          <q-btn
            dense
            flat
            rounded
            @click="this.changeView('login')"
            class="back-btn-wider"
            icon="arrow_back"
          />
          <div class="restore-title">
            Забыли почту?
          </div>
        </div>
      </div>
      <div v-if="this.login && this.loginMessage" class="login-message" role="alert">
        {{ this.loginMessage }}
      </div>
      <form v-if="this.login" method="post" action="/perform_login" class="login-form">
        <input type="hidden" name="_csrf" :value="csrfToken">
        <input v-if="redirectTarget" type="hidden" name="redirect" :value="redirectTarget">
        <q-input
          name="username"
          class="input-field"
          v-model="username"
          type="text"
          label="Почта *"
          :rules="[val => (val && val.length > 0) || 'Обязательное поле']"
        />
        <q-input
          name="password"
          class="input-field"
          v-model="password"
          :type="isPwd ? 'password' : 'text'"
          label="Пароль *"
          :rules="[val => (val && val.length > 0) || 'Обязательное поле']"
        >
          <template v-slot:append>
            <q-icon
              :name="isPwd ? 'visibility_off' : 'visibility'"
              class="toggle-password-visibility"
              @click="isPwd = !isPwd"
            />
          </template>
        </q-input>
        <a
          @click="this.changeView('passwordRestore')"
          class="forgot-password-link"
        >
          Забыли пароль?
        </a>
        <q-btn
          type="submit"
          color="primary"
        >
          Войти
        </q-btn>
      </form>
      <div v-else-if="this.passwordRestore">
        <div class="restore-email-instruction">Введите почту, с который связан ваш аккаунт</div>
        <div>
          <q-input
            name="email"
            class="input-field-no-padding"
            v-model="this.email"
            type="text"
            label="Связанная почта *"
          />
        </div>
        <q-btn
          @click="this.resetPassword"
          :loading="this.resetPending"
          class="submit-btn"
          color="primary"
        >
          Отправить запрос
        </q-btn>
      </div>
      <div v-else-if="this.emailRestore">
        <div class="email-restore-instruction">
          Мы отправим запрос на восстановление пароля пользователю Admin
        </div>
        <div class="contact-instruction">Или напишите нам на почту:</div>
        <div class="support-email">support@uldesk.com</div>
        <q-btn @click="this.requestSend = true" class="submit-btn-wider" color="primary">Отправить запрос</q-btn>
      </div>
    </div>
  </div>
  <div v-else class="centered-container">
    <div class="request-sent-box">
      <login-logo class="login-logo" />
      <div class="request-sent-message">
        <q-icon class="check-icon" name="check" />
        Отправили запрос
      </div>
      <div class="request-sent-instruction">
        Если аккаунт с такой почтой есть, на неё придёт ссылка для смены пароля. Ссылка действует 60 минут.
      </div>
      <q-btn @click="this.closeNotify" class="success-btn">Отлично</q-btn>
    </div>
  </div>
</template>

<script>
import LoginLogo from 'components/LoginLogo.vue'
import axios from 'axios'
import { useStore } from 'stores/store'
import { useRoute } from 'vue-router'
import { getCsrfToken } from 'boot/axios'
import { loginTargetFromRoute } from 'src/util/loginRedirect'

export default {
  name: 'LoginComponent',
  components: { LoginLogo },

  data: () => ({
    username: '',
    password: '',
    email: '',
    isPwd: true,
    login: true,
    passwordRestore: false,
    emailRestore: false,
    requestSend: false,
    resetPending: false,
    csrfToken: ''
  }),

  computed: {
    redirectTarget () {
      return loginTargetFromRoute(this.$route)
    },
    loginMessage () {
      const route = this.$route
      if (route?.path === '/login-error') {
        return 'Неверная почта или пароль'
      }
      const isSessionEnded = route?.path === '/session-expired' ||
        route?.query?.sessionExpired !== undefined ||
        route?.query?.expired !== undefined
      if (isSessionEnded) {
        // Причина выхода из аккаунта (кроме выхода по кнопке «Выйти», который сразу
        // ведёт на /login без reason): бэкенд передаёт код через ?reason=, здесь —
        // только человекочитаемые формулировки без кодов ошибок.
        const reasons = {
          PASSWORD_CHANGED: 'Администратор сменил ваш пароль. Войдите заново.',
          LOGGED_IN_ELSEWHERE: 'Вы вошли в аккаунт с другого устройства или браузера.',
          ACCOUNT_DISABLED: 'Доступ к аккаунту заблокирован администратором.',
          ROLE_CHANGED: 'Администратор изменил вашу роль. Войдите заново, чтобы применить права.',
          IDLE_TIMEOUT: 'Сеанс завершён из-за долгого бездействия. Войдите снова.'
        }
        const reason = String(route?.query?.reason || '').toUpperCase()
        return reasons[reason] || 'Сеанс завершён. Войдите снова'
      }
      return ''
    }
  },

  methods: {
    changeView (view) {
      switch (view) {
        case 'login':
          this.login = true
          this.passwordRestore = false
          this.emailRestore = false
          return
        case 'passwordRestore':
          this.login = false
          this.passwordRestore = true
          this.emailRestore = false
          return
        case 'emailRestore':
          this.emailRestore = true
          this.login = false
          this.passwordRestore = false
          return
        default:
          this.login = true
      }
    },

    resetPassword () {
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
      const isValidEmail = emailRegex.test(this.email)
      if (this.email.length === 0) {
        this.$q.notify({
          message: 'Поле почты не заполнено',
          type: 'negative'
        })
        return
      }
      if (!isValidEmail) {
        this.$q.notify({
          message: 'Почта указана не корректно',
          type: 'negative'
        })
        return
      }
      this.resetPending = true
      axios.post('/api/v1/support/reset-password', { username: this.email.trim() })
        .then(() => {
          this.requestSend = true
        })
        .catch(error => {
          this.$q.notify({
            message: error?.response?.status === 429
              ? 'Слишком много запросов. Попробуйте через 15 минут'
              : 'Не удалось отправить запрос. Попробуйте позже',
            type: 'negative'
          })
        })
        .finally(() => {
          this.resetPending = false
        })
    },

    closeNotify () {
      this.requestSend = false
      this.changeView('login')
    },

    loginRequest () {
      axios.post('/api/auth/login', { username: this.username, password: this.password })
        .then(response => {
          if (response.status === 200) {
            this.$router.replace(this.redirectTarget || '/')
          }
        })
    }
  },

  mounted () {
    this.csrfToken = getCsrfToken()
    const url = new URL(window.location.href)
    const username = url.searchParams.get('username')
    if (username) {
      this.username = username
    }
    // Never consume passwords from the URL: query strings are persisted in
    // history and are commonly logged by reverse proxies.
    if (url.searchParams.has('password')) {
      url.searchParams.delete('password')
      window.history.replaceState({}, document.title, `${url.pathname}${url.search}${url.hash}`)
    }
  },

  setup () {
    const store = useStore()
    const router = useRoute()
    return { store, router }
  }
}
</script>

<style scoped>

.centered-container {
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 15;
  position: absolute;
  top: 50%;
  bottom: 50%;
  left: 50%;
  right: 50%;
}

.login-box {
  background-color: white;
  padding: 8px;
  width: 240px;
  min-width: 240px;
  min-height: 296px;
  height: auto;
  border-radius: 4px;
}

.login-logo {
  display: block;
  margin-left: auto;
  margin-right: auto;
}

.login-title {
  text-align: center;
  margin-top: 8px;
  font-size: 20px;
  font-weight: 550;
}

.restore-password-container,
.restore-email-container {
  margin-top: 8px;
}

.restore-header {
  display: flex;
  flex-direction: row;
  align-items: center;
}

.back-btn {
  margin-right: 2px;
  padding: 0;
  width: 25px;
  height: 28px;
}

.back-btn-wider {
  margin-right: 9px;
  padding: 0;
}

.restore-title {
  text-align: center;
  font-weight: 550;
  font-size: 20px;
}

.spacer {
  width: 25px;
  height: 28px;
  margin-left: 2px;
}

.login-form {
  display: flex;
  flex-direction: column;
}

.input-field {
  margin-top: 12px;
  margin-bottom: 4px;
}

.input-field-no-padding {
  padding: 0;
}

.toggle-password-visibility {
  cursor: pointer;
}

.forgot-password-link {
  color: var(--q-primary);
  margin-top: 2px;
  margin-bottom: 14px;
  cursor: pointer;
  z-index: 1;
}

.submit-btn,
.submit-btn-wider {
  width: 100%;
  margin-top: 66px;
}

.submit-btn-wider {
  margin-top: 51px;
}

.restore-email-instruction {
  margin: 8px;
  text-align: center;
}

.email-restore-instruction {
  text-align: center;
  padding: 8px;
}

.contact-instruction {
  text-align: center;
}

.support-email {
  text-align: center;
  padding-bottom: 8px;
  color: gray;
  font-weight: 520;
}

.request-sent-box {
  background-color: white;
  padding: 8px;
  width: 240px;
  height: auto;
  border-radius: 4px;
  min-width: 240px;
  min-height: 207px;
}

.request-sent-message {
  display: flex;
  flex-direction: row;
  align-items: center;
  margin-top: 16px;
  color: rgb(52, 199, 89);
  justify-content: center;
  font-weight: 520;
}

.check-icon {
  color: rgba(52, 199, 89, 1);
}

.request-sent-instruction {
  text-align: center;
  margin-top: 16px;
}

.success-btn {
  color: white;
  background-color: rgb(52, 199, 89);
  width: 100%;
  margin-top: 16px;
}

.login-message {
  margin-top: 8px;
  padding: 6px 8px;
  border-radius: 4px;
  background-color: rgba(193, 0, 21, 0.08);
  color: var(--q-negative);
  font-size: 13px;
  text-align: center;
}

.input-field :deep(.q-field__bottom) {
  min-height: 20px;
  padding-top: 4px;
}

.login-form .q-btn[type="submit"] {
  margin-top: 8px;
}
</style>
