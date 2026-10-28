// Уведомления страницы «Плагины» (страница и диалог доступов показывают их одинаково).
export default {
  methods: {
    notifyPositive(message) {
      this.$q.notify({
        type: 'positive',
        message
      })
    },

    notifyNegative(message) {
      this.$q.notify({
        type: 'negative',
        message
      })
    }
  }
}
