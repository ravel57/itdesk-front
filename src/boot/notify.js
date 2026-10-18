import { boot } from 'quasar/wrappers'
import { Notify } from 'quasar'

// Единый вид всех уведомлений: правый верхний угол и кнопка «Закрыть».
// Кнопки из defaults Quasar добавляет к кнопкам вызова, поэтому в $q.notify крестик и позицию не указываем.
export default boot(() => {
  Notify.setDefaults({
    position: 'top-right',
    actions: [{ icon: 'close', color: 'white', round: true, dense: true, 'aria-label': 'Закрыть' }]
  })
})
