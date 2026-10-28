// Текст ошибки для уведомления на странице SLA и OLA.
export function getSlaErrorMessage(e) {
  return e?.response?.data?.message || e.message
}
