import { getAnswerWaitingMs } from 'src/util/answerWaiting'
import {
  getAnswerRequiredMessageId,
  getClientMessages,
  getLastAnswerRequiredUnansweredMessageDate,
  isIncomingMessage,
  isOutgoingOperatorMessage
} from 'src/util/clientsChats/clientMessages'
import { formatAnswerRequiredTimer, getAnswerRequiredTimerTitle } from 'src/util/clientsChats/clientRowFormat'

// «Требует ответа»: поиск неотвеченного сообщения клиента, время ожидания и его текст.
// Требует в компоненте: this.store, this.nowTs (SLA-миксин).
export default {
  data: () => ({
    answerWaitingSettingsTimer: null
  }),

  methods: {
    loadAnswerWaitingSettings () {
      this.store.fetchAnswerWaitingSettings().catch(() => {})
    },

    hasAnswerRequiredUnansweredMessages (client) {
      return !!this.getLastAnswerRequiredUnansweredMessageDate(client)
    },

    getAnswerRequiredTimerText (client) {
      return formatAnswerRequiredTimer(this.getAnswerRequiredWait(client), this.store.answerWaitingSettings)
    },

    getAnswerRequiredTimerTitle () {
      return getAnswerRequiredTimerTitle(this.store.answerWaitingSettings)
    },

    getClientMessages (client) {
      return getClientMessages(client)
    },

    isIncomingMessage (message) {
      return isIncomingMessage(message)
    },

    isOutgoingOperatorMessage (message) {
      return isOutgoingOperatorMessage(message)
    },

    getAnswerRequiredMessageId (client) {
      return getAnswerRequiredMessageId(client)
    },

    getLastAnswerRequiredUnansweredMessageDate (client) {
      return getLastAnswerRequiredUnansweredMessageDate(client)
    },

    // Миллисекунды ожидания ответа (календарные или рабочие — по настройке); null, если ответа не ждут
    getAnswerRequiredWait (client) {
      const date = this.getLastAnswerRequiredUnansweredMessageDate(client)
      if (!date) {
        return null
      }
      const startMs = new Date(date).getTime()
      if (!Number.isFinite(startMs)) {
        return null
      }
      return getAnswerWaitingMs(startMs, this.nowTs, this.store.answerWaitingSettings)
    },

    getAnswerRequiredStartMs (client) {
      const startMs = new Date(this.getLastAnswerRequiredUnansweredMessageDate(client)).getTime()
      return Number.isFinite(startMs) ? startMs : 0
    }
  }
}
