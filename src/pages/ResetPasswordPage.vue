<template>
  <q-layout>
    <q-page-container class="reset-page">
      <q-page class="flex flex-center">
        <div class="reset-box">
          <login-logo class="reset-logo"/>

          <div v-if="state === 'checking'" class="reset-state">
            <q-spinner color="primary" size="32px"/>
            <div class="q-mt-sm">Проверяем ссылку…</div>
          </div>

          <template v-else-if="state === 'invalid'">
            <div class="reset-title">Ссылка недействительна</div>
            <div class="reset-text">
              {{ message || 'Ссылка устарела или уже использована. Запросите новую на странице входа: «Забыли пароль?».' }}
            </div>
            <q-btn class="full-width q-mt-md" color="primary" label="На страницу входа" to="/login"/>
          </template>

          <template v-else-if="state === 'done'">
            <div class="reset-title reset-title--success">
              <q-icon name="check" class="q-mr-xs"/>
              Пароль изменён
            </div>
            <div class="reset-text">Войдите с новым паролем. Открытые сеансы с прежним паролем завершены.</div>
            <q-btn class="full-width q-mt-md" color="primary" label="Войти" to="/login"/>
          </template>

          <q-form v-else class="reset-form" @submit.prevent="submit">
            <div class="reset-title">Новый пароль</div>
            <q-input
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              label="Новый пароль *"
              autocomplete="new-password"
              autofocus
              :rules="[passwordRule]"
            >
              <template #append>
                <q-icon
                  :name="showPassword ? 'visibility' : 'visibility_off'"
                  class="cursor-pointer"
                  @click="showPassword = !showPassword"
                />
              </template>
            </q-input>
            <q-input
              v-model="passwordRepeat"
              :type="showPassword ? 'text' : 'password'"
              label="Повторите пароль *"
              autocomplete="new-password"
              :rules="[value => value === password || 'Пароли не совпадают']"
            />
            <div class="reset-hint">Не короче 8 символов</div>
            <q-btn class="full-width q-mt-md" type="submit" color="primary" label="Сохранить пароль" :loading="saving"/>
          </q-form>
        </div>
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<script>
import axios from 'axios'
import LoginLogo from 'components/LoginLogo.vue'

const MAX_PASSWORD_BYTES = 72

export default {
  name: 'ResetPasswordPage',
  components: { LoginLogo },

  data: () => ({
    token: '',
    state: 'checking',
    message: '',
    password: '',
    passwordRepeat: '',
    showPassword: false,
    saving: false
  }),

  async mounted () {
    document.title = 'ULDESK : Смена пароля'
    const url = new URL(window.location.href)
    this.token = url.searchParams.get('token') || ''
    // Токен не оставляем в адресной строке и истории браузера
    if (url.searchParams.has('token')) {
      url.searchParams.delete('token')
      window.history.replaceState(window.history.state, document.title, `${url.pathname}${url.search}${url.hash}`)
    }
    if (!this.token) {
      this.state = 'invalid'
      return
    }
    try {
      const { data } = await axios.post('/api/v1/support/reset-password/verify', { token: this.token })
      this.state = data?.valid ? 'form' : 'invalid'
    } catch (error) {
      this.state = 'invalid'
      this.message = error?.response?.status === 429
        ? 'Слишком много попыток. Попробуйте через 15 минут.'
        : 'Не удалось проверить ссылку. Попробуйте позже.'
    }
  },

  methods: {
    passwordRule (value) {
      if (!value || value.length < 8) return 'Минимум 8 символов'
      if (new TextEncoder().encode(value).length > MAX_PASSWORD_BYTES) return 'Слишком длинный пароль'
      return true
    },

    async submit () {
      if (this.passwordRule(this.password) !== true || this.password !== this.passwordRepeat) {
        return
      }
      this.saving = true
      try {
        await axios.post('/api/v1/support/reset-password/confirm', { token: this.token, password: this.password })
        this.state = 'done'
        this.password = ''
        this.passwordRepeat = ''
      } catch (error) {
        const status = error?.response?.status
        const message = error?.response?.data?.message
        if (status === 400) {
          this.$q.notify({ type: 'negative', message: message || 'Пароль не подходит' })
        } else if (status === 429) {
          this.$q.notify({ type: 'negative', message: 'Слишком много попыток. Попробуйте через 15 минут' })
        } else {
          this.state = 'invalid'
          this.message = message || ''
        }
      } finally {
        this.saving = false
      }
    }
  }
}
</script>

<style scoped>
.reset-page {
  background-color: var(--q-primary);
  min-height: 100vh;
}

.reset-box {
  background-color: white;
  padding: 16px;
  width: 300px;
  max-width: calc(100vw - 32px);
  border-radius: 4px;
}

.reset-logo {
  display: block;
  margin: 0 auto;
}

.reset-title {
  text-align: center;
  margin: 8px 0;
  font-size: 20px;
  font-weight: 550;
}

.reset-title--success {
  color: rgb(52, 199, 89);
}

.reset-text {
  text-align: center;
}

.reset-hint {
  color: grey;
  font-size: 12px;
}

.reset-state {
  text-align: center;
  padding: 24px 0;
}
</style>
