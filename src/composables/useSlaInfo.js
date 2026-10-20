import { getCurrentInstance, onBeforeUnmount } from 'vue'
import { slaInfoBatcher } from 'src/util/slaInfoBatcher'

/**
 * Доступ к общему батчеру SLA из компонента (вызывать в setup()).
 * Запросы компонента привязаны к его жизненному циклу: после размонтирования
 * ещё не отправленные запросы снимаются, а ответы для него игнорируются.
 *
 * const sla = useSlaInfo()
 * const info = await sla.load(taskId)            // из кэша/батча
 * const fresh = await sla.load(taskId, { force: true })
 * sla.set(taskId, infoFromPauseResponse)
 */
export function useSlaInfo () {
  const scope = slaInfoBatcher.createScope()
  if (getCurrentInstance()) {
    onBeforeUnmount(() => scope.dispose())
  }
  return scope
}
