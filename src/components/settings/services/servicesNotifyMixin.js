// Уведомления страницы «Сервисы и мониторинг» (страница и диалоги показывают их одинаково).
export default {
  methods: {
    required: value => Boolean(value && String(value).trim()) || 'Обязательное поле',
    notifyError(error) {
      this.$q.notify({
        type: 'negative',
        message: error?.response?.data?.message || error?.response?.data || error?.message || 'Операция не выполнена'
      })
    },

    notifyOk(message) {
      this.$q.notify({type: 'positive', message})
    }
  }
}
