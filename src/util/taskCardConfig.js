import { ref } from 'vue'
import axios from 'axios'

export const TASK_CARD_FIELDS = [
  { key: 'description', label: 'Описание', sample: 'Принтер на 3 этаже не печатает' },
  { key: 'type', label: 'Тип', sample: 'Инцидент' },
  { key: 'service', label: 'Сервис', sample: 'Печать и сканирование' },
  { key: 'checklist', label: 'Чек-лист', sample: '2 / 4' },
  { key: 'tags', label: 'Теги', sample: 'Принтер, Срочно' },
  { key: 'supportLine', label: 'Линия', sample: '1-я линия' },
  { key: 'priority', label: 'Приоритет', sample: 'Высокий' },
  { key: 'executor', label: 'Исполнитель', sample: 'Петров Иван' },
  { key: 'createdAt', label: 'Создана', sample: '18.10.2026, 10:15' },
  { key: 'deadline', label: 'Дедлайн', sample: '19.10.2026, 10:15' },
  { key: 'closeReason', label: 'Причина закрытия', sample: 'Проблема решена' },
  { key: 'sla', label: 'SLA осталось', sample: '1 ч. 59 м.' },
  { key: 'lastActivity', label: 'Последнее действие', sample: '18.10.2026, 12:40' }
]

// Порядок и состав по умолчанию (до первой настройки пользователем)
const DEFAULT_CARD_LAYOUT = [
  { key: 'description', enabled: false },
  { key: 'priority', enabled: true },
  { key: 'supportLine', enabled: false },
  { key: 'executor', enabled: true },
  { key: 'type', enabled: false },
  { key: 'service', enabled: false },
  { key: 'checklist', enabled: true },
  { key: 'tags', enabled: false },
  { key: 'deadline', enabled: true },
  { key: 'createdAt', enabled: false },
  { key: 'sla', enabled: true },
  { key: 'closeReason', enabled: true },
  { key: 'lastActivity', enabled: false }
]

function defaultConfig () {
  return DEFAULT_CARD_LAYOUT.map(field => ({ ...field }))
}

// Сохранённый порядок + новые поля, которых в нём ещё нет (добавляются в конец включёнными)
function normalizeConfig (stored) {
  if (!Array.isArray(stored) || stored.length === 0) {
    return defaultConfig()
  }
  const knownKeys = new Set(TASK_CARD_FIELDS.map(field => field.key))
  const result = []
  const seen = new Set()
  for (const item of Array.isArray(stored) ? stored : []) {
    if (item && knownKeys.has(item.key) && !seen.has(item.key)) {
      seen.add(item.key)
      result.push({ key: item.key, enabled: item.enabled !== false })
    }
  }
  for (const field of TASK_CARD_FIELDS) {
    if (!seen.has(field.key)) {
      result.push({ key: field.key, enabled: true })
    }
  }
  return result
}

export const taskCardConfig = ref(defaultConfig())

// Настройка хранится в БД (User.taskCardFieldsConfig) и подтягивается при входе — см. stores/auth.js.
// До первой гидратации показываем конфигурацию по умолчанию.
export function hydrateTaskCardConfig (serverConfig) {
  taskCardConfig.value = normalizeConfig(serverConfig)
}

export function saveTaskCardConfig (config) {
  taskCardConfig.value = normalizeConfig(config)
  axios.patch('/api/v1/user/task-card-config', taskCardConfig.value).catch(() => {
    // Сеть недоступна — настройка действует до перезагрузки страницы, на сервере останется прежней
  })
}

export function resetTaskCardConfig () {
  saveTaskCardConfig(defaultConfig())
}
