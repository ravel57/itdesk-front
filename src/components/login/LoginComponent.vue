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
      <form v-if="this.login" method="post" action="/perform_login" class="login-form">
        <q-input
          name="username"
          class="input-field"
          v-model="username"
          type="text"
          label="Почта"
          :rules="[val => (val && val.length > 0) || 'Обязательное поле']"
        />
        <q-input
          name="password"
          class="input-field"
          v-model="password"
          :type="isPwd ? 'password' : 'text'"
          label="Пароль"
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
            label="Связанная почта"
          />
        </div>
        <q-btn
          @click="this.resetPassword"
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
      <div class="request-sent-instruction">Мы отправили запрос на восстановление пароля</div>
      <q-btn @click="this.closeNotify" class="success-btn">Отлично</q-btn>
    </div>
  </div>
</template>

<script>
import LoginLogo from 'components/LoginLogo.vue'
import axios from 'axios'
import { useStore } from 'stores/store'
import { useRoute } from 'vue-router'

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
    requestSend: false
  }),

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
          type: 'negative',
          position: 'top-right',
          actions: [{
            icon: 'close', color: 'white', dense: true, handler: () => undefined
          }]
        })
        return
      }
      if (!isValidEmail) {
        this.$q.notify({
          message: 'Почта указана не корректно',
          type: 'negative',
          position: 'top-right',
          actions: [{
            icon: 'close', color: 'white', dense: true, handler: () => undefined
          }]
        })
        return
      }
      this.$emit('resetPassword', this.email)
    },

    closeNotify () {
      this.requestSend = false
      this.changeView('login')
    },

    loginRequest () {
      axios.post('/api/auth/login', { username: this.username, password: this.password })
        .then(response => {
          if (response.status === 200) {
            this.$router.push('/chats')
          }
        })
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
  height: 296px;
  border-radius: 4px;
  min-width: 240px;
  min-height: 296px;
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
  margin-top: 16px;
  padding-bottom: 0;
}

.input-field-no-padding {
  padding: 0;
}

.toggle-password-visibility {
  cursor: pointer;
}

.forgot-password-link {
  color: var(--q-primary);
  margin-bottom: 15px;
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
  height: 207px;
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

</style>
