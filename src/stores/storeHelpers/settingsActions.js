import axios from 'axios'
import {normalizeAnswerWaitingSettings} from 'src/util/answerWaiting'
import {normalizeSlaZones} from 'src/util/slaZones'

export const settingsActions = {
  fetchGeneralSettings() {
    return axios.get('/api/v1/settings/general')
      .then(response => {
        this.generalSettings = {
          timezone: response.data?.timezone ?? 'Europe/Moscow',
          workingTimeEnabled: response.data?.workingTimeEnabled ?? true,
          workdayStart: response.data?.workdayStart ?? '09:00',
          workdayEnd: response.data?.workdayEnd ?? '18:00',
          mondayEnabled: response.data?.mondayEnabled ?? true,
          tuesdayEnabled: response.data?.tuesdayEnabled ?? true,
          wednesdayEnabled: response.data?.wednesdayEnabled ?? true,
          thursdayEnabled: response.data?.thursdayEnabled ?? true,
          fridayEnabled: response.data?.fridayEnabled ?? true,
          saturdayEnabled: response.data?.saturdayEnabled ?? false,
          sundayEnabled: response.data?.sundayEnabled ?? false,
          supportLineAccessMode: response.data?.supportLineAccessMode ?? 'HYBRID',
          answerWaitingWorkingTimeEnabled: response.data?.answerWaitingWorkingTimeEnabled ?? false,
          slaOrangeStartPercent: response.data?.slaOrangeStartPercent ?? 50,
          slaRedStartPercent: response.data?.slaRedStartPercent ?? 25,
        }

        return this.generalSettings
      })
  },

  saveGeneralSettings(settings) {
    return axios.patch('/api/v1/settings/general', settings)
      .then(response => {
        this.generalSettings = {
          ...this.generalSettings,
          ...(response.data || settings),
          supportLineAccessMode: response.data?.supportLineAccessMode
            ?? settings?.supportLineAccessMode
            ?? this.generalSettings.supportLineAccessMode
            ?? 'HYBRID'
        }
        // Рабочий календарь или флаг «Требует ответа» могли измениться — список чатов подхватывает без перезагрузки
        this.fetchAnswerWaitingSettings().catch(() => {})
        // Зоны SLA тоже могли измениться — цвета таймеров обновляются без перезагрузки
        this.slaZones = normalizeSlaZones(this.generalSettings)
        return this.generalSettings
      })
  },

  fetchSlaZones() {
    return axios.get('/api/v1/settings/sla-zones')
      .then(response => {
        this.slaZones = normalizeSlaZones(response.data)
        return this.slaZones
      })
  },

  fetchAnswerWaitingSettings() {
    return axios.get('/api/v1/settings/answer-waiting')
      .then(response => {
        this.answerWaitingSettings = normalizeAnswerWaitingSettings(response.data)
        return this.answerWaitingSettings
      })
  }
}
