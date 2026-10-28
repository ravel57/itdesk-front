// Шаги обучения страницы «Мои заявки» и расчёт положения подсветки/подсказки для текущего шага.

export const MY_TASKS_ONBOARDING_STORAGE_KEY = 'my-tasks-page-onboarding-v1'

// Пользователь, уже прошедший обучение на странице «Заявки», знает карточки заявок — тогда не повторяем
export const TASKS_PAGE_ONBOARDING_STORAGE_KEY = 'tasks-page-onboarding-v1'

export function createMyTasksOnboardingSteps () {
  return [
    {
      selector: '[data-my-tasks-tour="search"]',
      title: 'Поиск по вашим заявкам',
      text: 'Здесь можно быстро найти свою активную заявку по номеру, названию, статусу или приоритету.',
      placement: 'bottom'
    },
    {
      selector: '[data-my-tasks-tour="task-list"]',
      title: 'Список назначенных заявок',
      text: 'На этом экране собраны заявки, где вы назначены исполнителем. Во время обучения показаны тестовые заявки, после завершения вернутся реальные данные.',
      placement: 'bottom'
    },
    {
      selector: '[data-my-tasks-tour="task-card"]',
      title: 'Карточка заявки',
      text: 'Каждое поле подписано и говорит само за себя. Задержите курсор на названии поля (например, SLA) или на значке в углу карточки — появится короткая подсказка с деталями.',
      placement: 'right'
    },
    {
      selector: '[data-my-tasks-tour="second-task-card"]',
      title: 'Разные состояния заявок',
      text: 'Тестовые карточки специально отличаются: одна срочная, другая обычная. Так проще понять, как выглядит очередь в реальной работе.',
      placement: 'right'
    },
  ]
}

// Положение подсветки и подсказки. target — найденный DOM-элемент шага или null (тогда подсказка по центру).
export function computeMyTasksOnboardingPosition (step, target) {
  if (!target) {
    return {
      highlightStyle: {
        display: 'none'
      },
      tooltipStyle: {
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)'
      }
    }
  }

  const rect = target.getBoundingClientRect()
  const padding = 6
  const tooltipWidth = Math.min(360, window.innerWidth - 32)
  const tooltipHeight = 190
  const gap = 14

  const highlightStyle = {
    left: `${Math.max(8, rect.left - padding)}px`,
    top: `${Math.max(8, rect.top - padding)}px`,
    width: `${Math.min(window.innerWidth - 16, rect.width + padding * 2)}px`,
    height: `${rect.height + padding * 2}px`
  }

  const preferredPlacement = step.placement || 'bottom'
  let left = rect.left
  let top = rect.bottom + gap

  if (preferredPlacement === 'right') {
    left = rect.right + gap
    top = rect.top
  }
  if (preferredPlacement === 'left') {
    left = rect.left - tooltipWidth - gap
    top = rect.top
  }
  if (preferredPlacement === 'top') {
    left = rect.left
    top = rect.top - tooltipHeight - gap
  }

  if (left + tooltipWidth > window.innerWidth - 16) {
    left = window.innerWidth - tooltipWidth - 16
  }
  if (left < 16) {
    left = 16
  }
  if (top + tooltipHeight > window.innerHeight - 16) {
    top = Math.max(16, rect.top - tooltipHeight - gap)
  }
  if (top < 16) {
    top = 16
  }

  const tooltipStyle = {
    left: `${left}px`,
    top: `${top}px`,
    width: `${tooltipWidth}px`
  }

  return { highlightStyle, tooltipStyle }
}
