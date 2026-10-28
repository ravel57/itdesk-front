import {defineStore} from 'pinia'
import {normalizeAnswerWaitingSettings} from 'src/util/answerWaiting'
import {normalizeSlaZones} from 'src/util/slaZones'
import {createAnalyticsState} from 'src/stores/storeHelpers/analyticsState'
import {chatActions} from 'src/stores/storeHelpers/chatActions'
import {taskPageActions} from 'src/stores/storeHelpers/taskPageActions'
import {dataActions} from 'src/stores/storeHelpers/dataActions'
import {analyticsActions} from 'src/stores/storeHelpers/analyticsActions'
import {sessionActions} from 'src/stores/storeHelpers/sessionActions'
import {notificationActions} from 'src/stores/storeHelpers/notificationActions'
import {settingsActions} from 'src/stores/storeHelpers/settingsActions'

export const useStore = defineStore('store', {
  state: () => ({
    clients: [
      {
        id: 0,
        tasks: [],
        messages: [],
        typingUsers: [],
        typingMessageText: [],
        watchingUsers: [],
        unreadPingMessages: []
      }
    ],

    tags: [],
    organizations: [],
    users: [],
    roles: [],
    statuses: [],
    priorities: [],
    taskTypes: [],
    services: [],
    supportLines: [],
    templates: [],
    knowledgeBase: [],
    triggers: [],
    // События автоматизаций с названиями: [{ value, label, group }] из GET /api/v1/trigger-types/options
    triggerTypeOptions: [],
    usersOnline: [],
    currentClient: {},
    currentChatMessageData: {
      messages: [],
      isEnd: false
    },
    checkedTasks: [],
    taskPage: {
      tasks: [],
      page: 0,
      size: 10,
      totalElements: 0,
      totalPages: 0,
      isEnd: false
    },
    supportMessages: [],
    ...createAnalyticsState(),

    currentSessionId: null,
    currentUser: null,
    // Права текущего пользователя (Permission с бэкенда): проверяются через can() из util/access
    permissions: [],

    miniState: false,
    globalAlertMessage: [],

    userNotifications: [],
    userNotificationsUnreadCount: 0,
    userNotificationsPage: 1,
    userNotificationsTotalPages: 0,
    userNotificationsEnd: true,
    userNotificationsLoading: false,

    generalSettings: {
      timezone: 'Europe/Moscow',
      workingTimeEnabled: true,
      workdayStart: '09:00',
      workdayEnd: '18:00',
      mondayEnabled: true,
      tuesdayEnabled: true,
      wednesdayEnabled: true,
      thursdayEnabled: true,
      fridayEnabled: true,
      saturdayEnabled: false,
      sundayEnabled: false,
      supportLineAccessMode: 'HYBRID',
      answerWaitingWorkingTimeEnabled: false,
      slaOrangeStartPercent: 50,
      slaRedStartPercent: 25,
    },

    // Границы оранжевой и красной зон SLA (общие). Доступны всем, кто видит заявки, в отличие от generalSettings
    slaZones: normalizeSlaZones(),

    // Как считать «Требует ответа» (календарное/рабочее время). Доступно всем, кто видит чаты — в отличие от generalSettings
    answerWaitingSettings: normalizeAnswerWaitingSettings(),
  }),

  getters: {
    triggerTypes: state => state.triggerTypeOptions.map(option => option.value),
    triggerTypeLabels: state => Object.fromEntries(state.triggerTypeOptions.map(option => [option.value, option.label])),
    getTasks: state => state.taskPage.tasks,
    getTaskPageTasks: state => state.taskPage.tasks
  },

  actions: {
    ...chatActions,
    ...taskPageActions,
    ...dataActions,
    ...analyticsActions,
    ...sessionActions,
    ...notificationActions,
    ...settingsActions
  }
})
