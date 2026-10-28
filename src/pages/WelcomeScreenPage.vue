<template>
  <div class="welcome-page">
    <div class="welcome-rail">
      <div class="welcome-rail__brand">
        <login-logo style="filter: brightness(0) invert(1)"/>
      </div>

      <div class="welcome-rail__steps app-flex-column">
        <div
          v-for="(step, index) in steps"
          :key="step.key"
          class="welcome-rail__step"
        >
          <div class="welcome-rail__step-marker">
            <div
              class="welcome-rail__step-circle"
              :class="{ 'welcome-rail__step-circle--done': index < currentStep, 'welcome-rail__step-circle--active': index === currentStep }"
            >
              <q-icon v-if="index < currentStep" name="check" size="14px"/>
              <template v-else>{{ index + 1 }}</template>
            </div>
            <div
              v-if="index < steps.length - 1"
              class="welcome-rail__step-line"
            />
          </div>
          <div class="welcome-rail__step-text">
            <div class="welcome-rail__step-title">{{ step.title }}</div>
            <div class="welcome-rail__step-caption">{{ step.caption }}</div>
          </div>
        </div>
      </div>

      <div class="welcome-rail__hint">Это займёт меньше двух минут</div>
    </div>

    <div class="welcome-content">
      <template v-if="inviteState === 'checking'">
        <div class="welcome-step">
          <q-spinner color="primary" size="32px"/>
          <div class="q-mt-sm">Проверяем ссылку…</div>
        </div>
      </template>

      <template v-else-if="inviteState === 'invalid'">
        <div class="welcome-step">
          <div class="welcome-step__title">Ссылка недействительна</div>
          <div class="welcome-step__description">
            {{ inviteMessage || 'Ссылка устарела или уже использована. Обратитесь к администратору за новым приглашением.' }}
          </div>
          <q-btn color="primary" unelevated label="На страницу входа" to="/login"/>
        </div>
      </template>

      <template v-else>
      <div class="welcome-content__step-label">Шаг {{ currentStep + 1 }} из {{ steps.length }}</div>

      <div v-if="currentStep === 0" class="welcome-step">
        <div class="welcome-step__title">{{ inviteState === 'ready' ? 'Добро пожаловать в ULDESK' : 'Придумайте пароль' }}</div>
        <div class="welcome-step__description">
          {{
            inviteState === 'ready'
              ? 'Для вас создана учётная запись. Задайте пароль, чтобы войти.'
              : 'Задайте постоянный пароль для входа в систему. Это можно сделать и позже в настройках профиля.'
          }}
        </div>
        <div class="welcome-step__form">
          <q-input
            v-model="newPassword"
            label="Новый пароль"
            type="password"
            outlined
            dense
          />
          <q-input
            v-model="newPasswordRepeat"
            label="Повторите пароль"
            type="password"
            outlined
            dense
          />
        </div>
      </div>

      <div v-else-if="currentStep === 1" class="welcome-step">
        <div class="welcome-step__title">Ваша роль: {{ roleLabel }}</div>
        <div class="welcome-step__description">
          Роль и права назначает администратор. Вот что это значит для вас прямо сейчас.
        </div>
        <div class="welcome-permissions">
          <div class="welcome-permissions__col welcome-permissions__col--can">
            <div class="welcome-permissions__heading">Вы можете</div>
            <div v-for="item in allowedPermissionLabels" :key="item" class="welcome-permissions__item">
              <q-icon name="check" size="16px"/>
              <span>{{ item }}</span>
            </div>
          </div>
          <div class="welcome-permissions__col welcome-permissions__col--cannot">
            <div class="welcome-permissions__heading">Недоступно для вашей роли</div>
            <div v-for="item in deniedPermissionLabels" :key="item" class="welcome-permissions__item">
              <q-icon name="lock" size="14px"/>
              <span>{{ item }}</span>
            </div>
            <div v-if="deniedPermissionLabels.length === 0" class="welcome-permissions__item welcome-permissions__item--muted">
              Ограничений нет — у вас полный доступ
            </div>
          </div>
        </div>
      </div>

      <div v-else-if="currentStep === 2" class="welcome-step">
        <div class="welcome-step__title">Уведомления браузера</div>
        <div class="welcome-step__description">
          Покажем системное уведомление о новом сообщении или заявке, даже если вкладка свёрнута. Можно включить позже в настройках профиля.
        </div>
        <q-btn
          v-if="notificationPermission !== 'granted'"
          color="primary"
          unelevated
          label="Разрешить уведомления"
          @click="requestNotifications"
        />
        <q-badge
          v-else
          color="positive"
          outline
          label="Уведомления разрешены"
        />
      </div>

      <div v-else-if="currentStep === 3" class="welcome-step">
        <div class="welcome-step__title">Термины и обозначения</div>
        <div class="welcome-step__description">
          Коротко о сокращениях, которые встречаются в интерфейсе.
        </div>
        <div class="welcome-glossary">
          <div v-for="term in glossary" :key="term.term" class="welcome-glossary__item">
            <div class="welcome-glossary__term">{{ term.term }}</div>
            <div class="welcome-glossary__definition">{{ term.definition }}</div>
          </div>
        </div>
      </div>

      <div v-else-if="currentStep === 4" class="welcome-step welcome-step--wide">
        <div class="welcome-step__title">Карточка заявки</div>
        <div class="welcome-step__description">
          Выберите, какие поля показывать в карточке заявки, и перетащите их в удобном порядке.
        </div>
        <task-card-configurator compact/>
        <q-banner
          rounded
          dense
          class="welcome-settings-hint bg-blue-1 text-primary q-mt-sm"
        >
          <template v-slot:avatar>
            <q-icon name="info" color="primary"/>
          </template>
          Позже это можно изменить в разделе
          <b>Настройки → Мой профиль → Карточка заявки</b>.
        </q-banner>
      </div>

      <div v-else class="welcome-step">
        <div class="welcome-step__title">Обучение на страницах</div>
        <div class="welcome-step__description">
          В разделах «Заявки», «Чаты» и в карточке заявки есть короткие подсказки с выделением элементов интерфейса. Их можно пройти сейчас или отключить — включить обратно можно в любой момент в настройках профиля.
        </div>
        <div class="welcome-onboarding-choice">
          <q-btn
            :outline="onboardingWanted !== true"
            :unelevated="onboardingWanted === true"
            :color="onboardingWanted === true ? 'primary' : 'grey-6'"
            label="Нужен онбординг"
            icon="school"
            @click="onboardingWanted = true"
          />
          <q-btn
            :outline="onboardingWanted !== false"
            :unelevated="onboardingWanted === false"
            :color="onboardingWanted === false ? 'primary' : 'grey-6'"
            label="Не нужен онбординг"
            icon="block"
            @click="onboardingWanted = false"
          />
        </div>
      </div>

      <div class="welcome-step__spacer app-flex-spacer"/>

      <div class="welcome-step__actions">
        <template v-if="inviteState === 'ready'">
          <q-btn
            color="primary"
            unelevated
            label="Далее"
            :loading="inviteSubmitting"
            @click="submitInvitePassword"
          />
        </template>
        <template v-else>
          <q-btn
            color="primary"
            unelevated
            :label="isLastStep ? 'Готово' : 'Далее'"
            @click="isLastStep ? finish() : nextStep()"
          />
          <a class="welcome-step__skip" @click="skipAll">Пропустить всё</a>
        </template>
      </div>
      </template>
    </div>
  </div>
</template>

<script>
import { setWelcomeInviteActive } from 'src/router/publicPages'
import axios from 'axios'
import { useStore } from 'stores/store'
import LoginLogo from 'components/LoginLogo.vue'
import TaskCardConfigurator from 'components/TaskCardConfigurator.vue'
import { roleLabel } from 'src/util/access'
import { useSystemNotifications } from 'src/composables/useSystemNotifications'
import { setOnboardingPreference, markAllOnboardingToursPassed } from 'src/util/onboarding'
import { getCsrfToken } from 'src/boot/axios'

const MAX_PASSWORD_BYTES = 72

// Описания прав для шага «Роль и права» — то же деление, что проверяет бэкенд (store.permissions)
const PERMISSION_LABELS = {
  TASK_VIEW: 'Просматривать заявки',
  TASK_EDIT: 'Брать заявки в работу и менять статус',
  CHAT_VIEW: 'Открывать переписку с клиентами',
  CHAT_REPLY: 'Отвечать клиентам в чате',
  CLIENT_EDIT: 'Редактировать данные клиентов',
  USER_MANAGE: 'Управлять пользователями и ролями',
  SETTINGS_MANAGE: 'Изменять общие настройки системы',
  AUTOMATION_MANAGE: 'Настраивать автоматизации',
  SECURITY_AUDIT_VIEW: 'Просматривать журнал безопасности',
  ANALYTICS_VIEW: 'Смотреть аналитику',
  ORGANIZATION_MANAGE: 'Управлять организациями',
  INCIDENT_VIEW: 'Работать с инцидентами'
}

// Глоссарий — по умолчанию; в будущем можно вынести в настройки, которые заполняет администратор
const DEFAULT_GLOSSARY = [
  {term: 'SLA', definition: 'Срок, к которому заявка должна быть закрыта по договору с клиентом.'},
  {term: 'OLA', definition: 'Внутренний срок реакции между линиями поддержки.'},
  {term: 'Линия поддержки', definition: 'Группа специалистов, отвечающая за определённый тип заявок.'},
  {term: 'Эскалация', definition: 'Передача заявки на следующую линию, если её не удаётся решить.'},
  {term: 'Фриз', definition: 'Временная приостановка срока SLA, пока заявка ждёт ответа клиента.'},
]

export default {
  name: 'WelcomeScreenPage',

  components: {LoginLogo, TaskCardConfigurator},

  setup () {
    const {permission, requestPermission} = useSystemNotifications()
    return {
      requestNotificationPermission: requestPermission,
      getNotificationPermission: permission
    }
  },

  data: () => ({
    currentStep: 0,
    newPassword: '',
    newPasswordRepeat: '',
    notificationPermission: 'default',
    glossary: DEFAULT_GLOSSARY,
    onboardingWanted: true,
    // Приглашение (?token=) открывает эту страницу ещё не авторизованному пользователю:
    // 'none' — обычный онбординг после входа; иначе — мастер задания пароля по ссылке
    inviteToken: '',
    inviteState: 'none',
    inviteMessage: '',
    inviteSubmitting: false,
    steps: [
      {key: 'password', title: 'Пароль', caption: 'Придумайте новый пароль'},
      {key: 'role', title: 'Роль и права', caption: 'Что вы можете делать в системе'},
      {key: 'notifications', title: 'Уведомления', caption: 'По желанию, можно пропустить'},
      {key: 'glossary', title: 'Термины и обозначения', caption: 'Настроены администратором'},
      {key: 'task-card', title: 'Карточка заявки', caption: 'Какие поля показывать'},
      {key: 'onboarding', title: 'Обучение на страницах', caption: 'Подсказки по интерфейсу'}
    ]
  }),

  computed: {
    store () {
      return useStore()
    },

    isLastStep () {
      return this.currentStep === this.steps.length - 1
    },

    roleLabel () {
      const role = this.store.currentUser?.authorities?.[0]
      return roleLabel(role) || 'Сотрудник'
    },

    allowedPermissionLabels () {
      const permissions = Array.isArray(this.store.permissions) ? this.store.permissions : []
      return Object.keys(PERMISSION_LABELS)
        .filter(code => permissions.includes(code))
        .map(code => PERMISSION_LABELS[code])
        .slice(0, 6)
    },

    deniedPermissionLabels () {
      const permissions = Array.isArray(this.store.permissions) ? this.store.permissions : []
      return Object.keys(PERMISSION_LABELS)
        .filter(code => !permissions.includes(code))
        .map(code => PERMISSION_LABELS[code])
        .slice(0, 6)
    }
  },

  created () {
    this.notificationPermission = this.getNotificationPermission()
    this.initInviteFlow()
  },

  methods: {
    async initInviteFlow () {
      const url = new URL(window.location.href)
      const token = url.searchParams.get('token') || ''
      if (!token) {
        // After invitation confirmation the user has already set their password.
        // Authenticated onboarding starts with their role and permissions.
        this.currentStep = 1
        return
      }
      this.inviteToken = token
      setWelcomeInviteActive(true)
      // Токен не оставляем в адресной строке и истории браузера
      if (url.searchParams.has('token')) {
        url.searchParams.delete('token')
        window.history.replaceState(window.history.state, document.title, `${url.pathname}${url.search}${url.hash}`)
      }
      this.inviteState = 'checking'
      try {
        const { data } = await axios.post('/api/v1/support/reset-password/verify', { token })
        this.inviteState = data?.valid && data?.purpose === 'INVITE' ? 'ready' : 'invalid'
      } catch (error) {
        this.inviteState = 'invalid'
        this.inviteMessage = error?.response?.status === 429
          ? 'Слишком много попыток. Попробуйте через 15 минут.'
          : 'Не удалось проверить ссылку. Попробуйте позже.'
      }
    },

    invitePasswordRule (value) {
      if (!value || value.length < 8) return 'Минимум 8 символов'
      if (new TextEncoder().encode(value).length > MAX_PASSWORD_BYTES) return 'Слишком длинный пароль'
      return true
    },

    async submitInvitePassword () {
      const rule = this.invitePasswordRule(this.newPassword)
      if (rule !== true) {
        this.$q.notify({message: rule, type: 'negative'})
        return
      }
      if (this.newPassword !== this.newPasswordRepeat) {
        this.$q.notify({message: 'Пароли не совпадают', type: 'negative'})
        return
      }
      this.inviteSubmitting = true
      try {
        const {data} = await axios.post('/api/v1/support/reset-password/confirm', {
          token: this.inviteToken,
          password: this.newPassword
        })
        this.autoLogin(data?.email, this.newPassword)
      } catch (error) {
        const status = error?.response?.status
        const message = error?.response?.data?.message
        if (status === 400) {
          this.$q.notify({type: 'negative', message: message || 'Пароль не подходит'})
        } else if (status === 429) {
          this.$q.notify({type: 'negative', message: 'Слишком много попыток. Попробуйте через 15 минут'})
        } else {
          this.inviteState = 'invalid'
          this.inviteMessage = message || ''
        }
        this.inviteSubmitting = false
      }
    },

    // Пользователь только что сам задал этот пароль по приглашению — отправляем тем же
    // нативным POST-входом, что и обычная форма логина, чтобы дальше работала вся обычная
    // проверка (сессии, 2FA) без повторного ввода.
    autoLogin (username, password) {
      if (!username) {
        this.inviteSubmitting = false
        this.$router.push('/login')
        return
      }
      const form = document.createElement('form')
      form.method = 'post'
      form.action = '/perform_login'
      form.style.display = 'none'
      const fields = {_csrf: getCsrfToken(), username, password}
      Object.entries(fields).forEach(([name, value]) => {
        const input = document.createElement('input')
        input.type = 'hidden'
        input.name = name
        input.value = value
        form.appendChild(input)
      })
      document.body.appendChild(form)
      form.submit()
    },

    nextStep () {
      this.currentStep = Math.min(this.currentStep + 1, this.steps.length - 1)
    },

    async requestNotifications () {
      this.notificationPermission = await this.requestNotificationPermission()
    },

    finish () {
      axios.post('/api/v1/user/welcome-seen').catch(() => {
        // Сеть недоступна — экран откроется повторно при следующем входе, не критично
      })
      if (this.store.currentUser) {
        this.store.currentUser.welcomeSeen = true
      }
      setOnboardingPreference(this.onboardingWanted)
      this.$router.push('/')
    },

    // "Пропустить всё": пользователь мог уйти раньше шага с выбором онбординга — считаем
    // пройденными не только общее предпочтение (finish() сохранит onboardingWanted как есть
    // ниже), но и все туры по отдельным страницам, чтобы они не всплывали потом по одному.
    skipAll () {
      this.onboardingWanted = false
      markAllOnboardingToursPassed()
      this.finish()
    }
  }
}
</script>

<style scoped>
.welcome-page {
  display: flex;
  min-height: 100vh;
  background: var(--app-surface, #fff);
}

.welcome-rail {
  width: 320px;
  flex-shrink: 0;
  background: var(--q-primary);
  color: #fff;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 40px;
  box-sizing: border-box;
}

.welcome-rail__step {
  display: flex;
  gap: 14px;
}

.welcome-rail__step-marker {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.welcome-rail__step-circle {
  width: 26px;
  height: 26px;
  border-radius: 13px;
  border: 1.5px solid rgba(255, 255, 255, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.85);
  flex-shrink: 0;
}

.welcome-rail__step-circle--done,
.welcome-rail__step-circle--active {
  background: var(--app-surface, #fff);
  color: var(--q-primary);
  border-color: #fff;
}

.welcome-rail__step-line {
  width: 2px;
  flex: 1;
  min-height: 24px;
  background: rgba(255, 255, 255, 0.35);
  margin: 4px 0;
}

.welcome-rail__step-text {
  padding-bottom: 28px;
}

.welcome-rail__step-title {
  font-size: 14px;
  font-weight: 700;
}

.welcome-rail__step-caption {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.75);
  margin-top: 2px;
}

.welcome-rail__hint {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
}

.welcome-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 56px;
  box-sizing: border-box;
  max-width: 960px;
}

.welcome-content__step-label {
  font-size: 12px;
  font-weight: 700;
  color: var(--app-text-muted, #a9a9b2);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 8px;
}

.welcome-step__title {
  font-size: 24px;
  font-weight: 800;
  margin-bottom: 8px;
}

.welcome-step__description {
  font-size: 14px;
  color: var(--app-text-muted, #6a6a70);
  margin-bottom: 24px;
}

.welcome-step__form {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-width: 360px;
}

.welcome-permissions {
  display: flex;
  gap: 20px;
}

.welcome-permissions__col {
  flex: 1;
  border-radius: 12px;
  padding: 16px;
}

.welcome-permissions__col--can {
  background: var(--app-surface, #f3fbf5);
  border: 1px solid var(--app-border, #d8f0dc);
}

.welcome-permissions__col--cannot {
  background: var(--app-surface, #fafafb);
  border: 1px solid var(--app-border, #ececef);
}

.welcome-permissions__heading {
  font-size: 12px;
  font-weight: 700;
  margin-bottom: 10px;
}

.welcome-permissions__col--can .welcome-permissions__heading {
  color: var(--app-success-text, #1e8e3e);
}

.welcome-permissions__col--cannot .welcome-permissions__heading {
  color: var(--app-text-muted, #8a8a90);
}

.welcome-permissions__item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 5px 0;
  font-size: 13px;
  color: var(--app-text, #4a4a4f);
}

.welcome-permissions__col--can .welcome-permissions__item {
  color: var(--app-success-text, #1e8e3e);
}

.welcome-permissions__col--cannot .welcome-permissions__item {
  color: var(--app-text-muted, #8a8a90);
}

.welcome-permissions__item--muted {
  font-style: italic;
}

.welcome-glossary__item {
  padding: 10px 0;
  border-bottom: 1px solid var(--app-border, #f0f0f2);
}

.welcome-glossary__term {
  font-size: 13px;
  font-weight: 700;
}

.welcome-glossary__definition {
  font-size: 13px;
  color: var(--app-text-muted, #6a6a70);
  margin-top: 2px;
}

.welcome-step--wide .welcome-step__description {
  margin-bottom: 12px;
}

.welcome-onboarding-choice {
  display: flex;
  gap: 12px;
}

.welcome-step__actions {
  display: flex;
  align-items: center;
  gap: 20px;
  padding-top: 24px;
}

.welcome-step__skip {
  font-size: 13px;
  color: var(--app-text-muted, #8a8a90);
  font-weight: 600;
  cursor: pointer;
}
@media (max-width: 720px) {
  .welcome-page {
    flex-direction: column;
  }

  .welcome-rail {
    width: 100%;
  }

  .welcome-content {
    max-width: 100%;
  }

  .welcome-permissions {
    flex-direction: column;
  }
}
</style>
