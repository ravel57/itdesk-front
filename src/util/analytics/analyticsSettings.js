import {PERIOD_PRESETS, GROUP_BY_OPTIONS} from './analyticsPeriod'
import {BREAKDOWN_BY_OPTIONS} from './analyticsAccess'
import {getDefaultAnalyticsFilters, normalizeSelectedIds} from './analyticsFilters'

// Сериализация, чтение и нормализация настроек страницы аналитики в localStorage.

export const ANALYTICS_SETTINGS_STORAGE_KEY = 'uldesk.analytics.page.settings'

// state: {periodPreset, fromDate, toDate, groupBy, breakdownBy, analyticsFilters}
export function buildAnalyticsSettingsForStorage(state) {
  return {
    periodPreset: state.periodPreset,
    fromDate: state.fromDate,
    toDate: state.toDate,
    groupBy: state.groupBy,
    breakdownBy: state.breakdownBy,
    analyticsFilters: {
      typeIds: normalizeSelectedIds(state.analyticsFilters.typeIds),
      priorityIds: normalizeSelectedIds(state.analyticsFilters.priorityIds),
      executorIds: normalizeSelectedIds(state.analyticsFilters.executorIds),
      tagIds: normalizeSelectedIds(state.analyticsFilters.tagIds),
      supportLineIds: normalizeSelectedIds(state.analyticsFilters.supportLineIds),
    }
  }
}

export function saveAnalyticsSettings(state) {
  try {
    localStorage.setItem(
      ANALYTICS_SETTINGS_STORAGE_KEY,
      JSON.stringify(buildAnalyticsSettingsForStorage(state))
    )
  } catch (e) {
    console.warn('Не удалось сохранить настройки аналитики', e)
  }
}

// Возвращает объект сохранённых настроек или null (нет записи / ошибка чтения / не объект).
export function readAnalyticsSettings() {
  let settings = null
  try {
    const rawSettings = localStorage.getItem(ANALYTICS_SETTINGS_STORAGE_KEY)
    if (!rawSettings) {
      return null
    }
    settings = JSON.parse(rawSettings)
  } catch (e) {
    console.warn('Не удалось прочитать настройки аналитики', e)
    return null
  }
  if (!settings || typeof settings !== 'object') {
    return null
  }
  return settings
}

// Приводит сохранённые настройки к допустимым значениям (даты не трогает).
export function normalizeStoredAnalyticsSettings(settings) {
  return {
    periodPreset: PERIOD_PRESETS.includes(settings.periodPreset)
      ? settings.periodPreset
      : '7',
    groupBy: GROUP_BY_OPTIONS.some(option => option.value === settings.groupBy)
      ? settings.groupBy
      : 'DAY',
    breakdownBy: BREAKDOWN_BY_OPTIONS.some(option => option.value === settings.breakdownBy)
      ? settings.breakdownBy
      : 'type',
    analyticsFilters: {
      ...getDefaultAnalyticsFilters(),
      typeIds: normalizeSelectedIds(settings.analyticsFilters?.typeIds),
      priorityIds: normalizeSelectedIds(settings.analyticsFilters?.priorityIds),
      executorIds: normalizeSelectedIds(settings.analyticsFilters?.executorIds),
      tagIds: normalizeSelectedIds(settings.analyticsFilters?.tagIds),
      supportLineIds: normalizeSelectedIds(settings.analyticsFilters?.supportLineIds),
    }
  }
}
