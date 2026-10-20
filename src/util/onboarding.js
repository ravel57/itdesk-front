import { ref } from 'vue'
import axios from 'axios'

const ONBOARDING_PREFERENCE_KEY = 'onboarding-preference'

// Предпочтение задаётся на велком-скрине. Если пользователь его не указывал,
// считаем, что обучение нужно — так ведёт себя приложение по умолчанию.
export function wantsOnboarding () {
  try {
    return localStorage.getItem(ONBOARDING_PREFERENCE_KEY) !== 'false'
  } catch (e) {
    return true
  }
}

export function setOnboardingPreference (wanted) {
  try {
    localStorage.setItem(ONBOARDING_PREFERENCE_KEY, wanted ? 'true' : 'false')
  } catch (e) {
    // localStorage недоступен — просто не сохраняем предпочтение
  }
}

// Какие тур-подсказки на отдельных страницах (заявки, карточка заявки, чаты и т.д.) уже пройдены
// или пропущены: ключ тура → 'done'/'skipped'/'true' (значение — на усмотрение конкретной страницы).
// Раньше каждая страница хранила свой ключ в localStorage, теперь единая карта в БД
// (User.onboardingProgress), подтягивается при входе — см. stores/auth.js.
export const onboardingProgress = ref({})

// Значение "уже показан", которое проверяет каждая страница — у них исторически разные строки.
// Источник правды для кнопки "Пропустить всё" на велком-экране: если завести новый тур,
// достаточно добавить его сюда.
export const ALL_ONBOARDING_TOURS = {
  'tasks-page-onboarding-v1': 'done',
  'task-dialog-onboarding-v1': 'done',
  'chat-page-onboarding-v1': 'done',
  'clients-chats-onboarding-v3': 'skipped',
  'my-tasks-page-onboarding-v1': 'true'
}

export function hydrateOnboardingProgress (serverProgress) {
  onboardingProgress.value = serverProgress && typeof serverProgress === 'object' ? serverProgress : {}
}

export function getOnboardingStatus (key) {
  return onboardingProgress.value[key] || null
}

function persistOnboardingProgress (updates) {
  onboardingProgress.value = { ...onboardingProgress.value, ...updates }
  axios.patch('/api/v1/user/onboarding-progress', updates).catch(() => {
    // Сеть недоступна — тур(ы) могут показаться повторно в следующий раз, на сервере останется прежним
  })
}

export function setOnboardingStatus (key, status) {
  persistOnboardingProgress({ [key]: status })
}

// "Пропустить всё" на велком-экране: все известные туры одним запросом — без гонки между
// несколькими параллельными PATCH по одному туру за раз.
export function markAllOnboardingToursPassed () {
  persistOnboardingProgress(ALL_ONBOARDING_TOURS)
}
