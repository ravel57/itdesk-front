<template>
  <q-layout>
    <q-page-container style="background-color: var(--q-primary); position: relative; overflow: hidden">
      <q-page>
        <div v-if="!this.requestSend" style="display: flex;justify-content: center;align-items: center;z-index: 15;position: absolute;top: 50%;bottom: 50%;left: 50%;right: 50%;">
          <div style="background-color: white; padding: 8px; width: 240px; height: 296px; border-radius: 4px; min-width: 240px; min-height: 296px">
            <login-logo
              style="display: block;margin-left: auto;margin-right: auto;"
            />
            <div
              v-if="this.login"
              class="text-h6"
              style="text-align: center;margin-top: 8px;font-weight: 550"
            >
              Войти в ULDESK
            </div>
            <div
              v-else-if="this.passwordRestore"
              style="margin-top: 8px;"
            >
              <div style="display: flex; flex-direction: row;align-items: center">
                <q-btn
                  dense
                  flat
                  rounded
                  @click="this.changeView('login')"
                  style="margin-right: 3px;padding: 0"
                  icon="arrow_back"
                />
                <div class="text-h6" style="text-align: center;font-weight: 550">
                  Забыли пароль?
                </div>
              </div>
            </div>
            <div
              v-else-if="this.emailRestore"
              style="margin-top: 8px;"
            >
              <div style="display: flex; flex-direction: row;align-items: center">
                <q-btn
                  dense
                  flat
                  rounded
                  @click="this.changeView('login')"
                  style="margin-right: 9px;padding: 0"
                  icon="arrow_back"
                />
                <div class="text-h6" style="text-align: center;font-weight: 550">
                  Забыли почту?
                </div>
              </div>
            </div>
            <form v-if="this.login" method="post" action="/perform_login" style="display: flex; flex-direction: column">
              <q-input
                name="username"
                style="margin-top: 16px;padding-bottom: 0"
                v-model="username"
                type="text"
                label="Логин"
                :rules="[val => (val && val.length > 0) || 'Обязательное поле']"
              />
              <q-input
                name="password"
                style="margin-top: 16px; padding-bottom: 0"
                v-model="password"
                :type="isPwd ? 'password' : 'text'"
                label="Пароль"
                :rules="[val => (val && val.length > 0) || 'Обязательное поле']"
              >
                <template v-slot:append>
                  <q-icon
                    :name="isPwd ? 'visibility_off' : 'visibility'"
                    class="cursor-pointer"
                    @click="isPwd = !isPwd"
                  />
                </template>
              </q-input>
              <a
                @click="this.changeView('passwordRestore')"
                style="color: var(--q-primary); margin-bottom: 15px; cursor: pointer;z-index: 1"
              >
                Забыл пароль?
              </a>
              <q-btn
                type="submit"
                color="primary"
              >
                Войти
              </q-btn>
            </form>
            <form v-else-if="this.passwordRestore">
              <div style="margin: 8px;text-align: center">Введите почту, с который связан ваш аккаунт</div>
              <div>
                <q-input
                  name="email"
                  style="padding: 0"
                  v-model="this.email"
                  type="text"
                  label="Связанная почта"
                />
                <a
                  @click="this.changeView('emailRestore')"
                  style="color: var(--q-primary);cursor: pointer;"
                >
                  Не помню почту
                </a>
              </div>
              <q-btn
                @click="this.resetPassword"
                style="width: 100%;margin-top: 45px;"
                color="primary"
              >
                Отправить запрос
              </q-btn>
            </form>
            <form v-else-if="this.emailRestore">
              <div style="text-align: center; padding: 8px">
                Мы отправим запрос на восстановление пароля пользователю Admin
              </div>
              <div style="text-align: center;">Или напишите нам на почту:</div>
              <div style="text-align: center;padding-bottom: 8px; color: gray;font-weight: 520">support@uldesk.com</div>
              <q-btn @click="this.requestSend = true" style="width: 100%;margin-top: 51px" color="primary">Отправить запрос</q-btn>
            </form>
          </div>
        </div>
        <div v-else style="display: flex;justify-content: center;align-items: center;z-index: 15;position: absolute;top: 50%;bottom: 50%;left: 50%;right: 50%;">
          <div style="background-color: white; padding: 8px; width: 240px; height: 207px; border-radius: 4px; min-width: 240px; min-height: 207px;">
            <login-logo
              style="display: block;margin-left: auto;margin-right: auto;margin-top: 8px"
            />
            <div style="display: flex;flex-direction: row;align-items: center;margin-top: 16px; color: rgb(52, 199, 89);justify-content: center; font-weight: 520" class="text-h6">
              <q-icon
                style="color: rgba(52, 199, 89, 1)"
                name="check"
              />
              Отправили запрос
            </div>
            <div style="text-align: center;margin-top: 16px">Мы отправили запрос на восстановление пароля</div>
            <q-btn @click="this.closeNotify" style="color:white; background-color: rgb(52, 199, 89);width: 100%;margin-top: 16px">Отлично</q-btn>
          </div>
        </div>
        <div style="animation-delay: 0.45s;" class="backgroundImage">
          <svg width="1980" height="841" viewBox="0 0 1980 841" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M177.073 177.027C177.073 37.3561 59.0244 0.812796 0 0L0 841L1980 841L1980 288.217C1940.24 369.172 1836 531.081 1737.07 531.081C1613.41 531.081 1527.32 415.257 1411.46 531.081C1318.78 623.74 1197.07 569.689 1147.8 531.081C1089.02 472.641 936.39 390.825 796.098 531.081C655.805 671.337 561.057 589.521 531.22 531.081C518.13 480.362 469.366 378.925 379.024 378.925C266.098 378.925 177.073 351.616 177.073 177.027Z" fill="url(#paint0_linear_260_8832)"/>
            <defs>
              <linearGradient id="paint0_linear_260_8832" x1="990" y1="0" x2="990" y2="841" gradientUnits="userSpaceOnUse">
                <stop stop-color="#5C35F9"/>
                <stop offset="1" stop-color="#361F93"/>
              </linearGradient>
            </defs>
          </svg>
        </div>
        <div style="animation-delay: 0.35s;" class="backgroundImage">
          <svg width="1980" height="841" viewBox="0 0 1980 841" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M177.073 177.027C177.073 37.3561 59.0244 0.812796 0 0L0 841L1980 841L1980 288.217C1940.24 369.172 1836 531.081 1737.07 531.081C1613.41 531.081 1527.32 415.257 1411.46 531.081C1318.78 623.74 1197.07 569.689 1147.8 531.081C1089.02 472.641 936.39 390.825 796.098 531.081C655.805 671.337 561.057 589.521 531.22 531.081C518.13 480.362 469.366 378.925 379.024 378.925C266.098 378.925 177.073 351.616 177.073 177.027Z" fill="url(#paint0_linear_260_8833)"/>
            <defs>
              <linearGradient id="paint0_linear_260_8833" x1="990" y1="0" x2="990" y2="841" gradientUnits="userSpaceOnUse">
                <stop stop-color="#5C35F9"/>
                <stop offset="1" stop-color="#361F93"/>
              </linearGradient>
            </defs>
          </svg>
        </div>
        <div style="animation-delay: 0.25s;" class="backgroundImage">
          <svg width="1980" height="657" viewBox="0 0 1980 657" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M177.073 177.027C177.073 37.3561 59.0244 0.812796 0 0L0 841L1980 841L1980 288.217C1940.24 369.172 1836 531.081 1737.07 531.081C1613.41 531.081 1527.32 415.257 1411.46 531.081C1318.78 623.74 1197.07 569.689 1147.8 531.081C1089.02 472.641 936.39 390.825 796.098 531.081C655.805 671.337 561.057 589.521 531.22 531.081C518.13 480.362 469.366 378.925 379.024 378.925C266.098 378.925 177.073 351.616 177.073 177.027Z" fill="url(#paint0_linear_260_8834)"/>
            <defs>
              <linearGradient id="paint0_linear_260_8834" x1="990" y1="0" x2="990" y2="841" gradientUnits="userSpaceOnUse">
                <stop stop-color="#5C35F9"/>
                <stop offset="1" stop-color="#361F93"/>
              </linearGradient>
            </defs>
          </svg>
        </div>
        <div style="animation-delay: 0.15s;" class="backgroundImage">
          <svg width="1980" height="447" viewBox="0 0 1980 447" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M177.073 177.027C177.073 37.3561 59.0244 0.812796 0 0L0 841L1980 841L1980 288.217C1940.24 369.172 1836 531.081 1737.07 531.081C1613.41 531.081 1527.32 415.257 1411.46 531.081C1318.78 623.74 1197.07 569.689 1147.8 531.081C1089.02 472.641 936.39 390.825 796.098 531.081C655.805 671.337 561.057 589.521 531.22 531.081C518.13 480.362 469.366 378.925 379.024 378.925C266.098 378.925 177.073 351.616 177.073 177.027Z" fill="url(#paint0_linear_260_8835)"/>
            <defs>
              <linearGradient id="paint0_linear_260_8835" x1="990" y1="0" x2="990" y2="841" gradientUnits="userSpaceOnUse">
                <stop stop-color="#5C35F9"/>
                <stop offset="1" stop-color="#361F93"/>
              </linearGradient>
            </defs>
          </svg>
        </div>
        <div style="animation-delay: 0s;" class="backgroundImage">
          <svg width="1980" height="237" viewBox="0 0 1980 237" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M177.073 177.027C177.073 37.3561 59.0244 0.812796 0 0L0 841L1980 841L1980 288.217C1940.24 369.172 1836 531.081 1737.07 531.081C1613.41 531.081 1527.32 415.257 1411.46 531.081C1318.78 623.74 1197.07 569.689 1147.8 531.081C1089.02 472.641 936.39 390.825 796.098 531.081C655.805 671.337 561.057 589.521 531.22 531.081C518.13 480.362 469.366 378.925 379.024 378.925C266.098 378.925 177.073 351.616 177.073 177.027Z" fill="url(#paint0_linear_260_8836)"/>
            <defs>
              <linearGradient id="paint0_linear_260_8836" x1="990" y1="0" x2="990" y2="841" gradientUnits="userSpaceOnUse">
                <stop stop-color="#5C35F9"/>
                <stop offset="1" stop-color="#361F93"/>
              </linearGradient>
            </defs>
          </svg>
        </div>
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<script>
import LoginLogo from 'components/LoginLogo.vue'
import axios from 'axios'

export default {
  name: 'LoginPage',
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
      axios.post('/api/v1/support/reset-password', { username: this.email })
        .then(() => {
          this.requestSend = true
        })
        .catch(e => {
          this.$q.notify({
            message: e.message,
            type: 'negative',
            position: 'top-right',
            actions: [{
              icon: 'close', color: 'white', dense: true, handler: () => undefined
            }]
          })
        })
    },

    closeNotify () {
      this.requestSend = false
      this.changeView('login')
    }
    // login () {
    //   axios.post(`/login?username=${this.username}&password=${this.password}`)
    //     .catch(e => {
    //       this.$q.notify({
    //         message: e.message,
    //         type: 'negative',
    //         position: 'top-right',
    //         actions: [{
    //           icon: 'close', color: 'white', dense: true, handler: () => undefined
    //         }]
    //       })
    //     })
    // }
  },

  mounted () {
    document.title = 'ULDESK : Вход'
  }
}
</script>

<style scoped>

.backgroundImage {
  position: absolute;
  bottom: -800px;
  animation-name: BackgroundAnimation;
  animation-duration: 1s;
  animation-fill-mode: forwards;
}

@keyframes BackgroundAnimation {
  from {
    bottom: -800px;
  }

  to {
    bottom: -20px;
  }
}

</style>
