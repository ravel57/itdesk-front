// Геометрия обучения: позиция карточки подсказки и рамки-подсветки вокруг целевого элемента.
// Чистая функция: rect — результат getBoundingClientRect() цели, placement — из шага обучения.

export function computeOnboardingPosition (rect, placement) {
  const gap = 12
  const padding = 8
  const cardWidth = Math.min(360, window.innerWidth - 24)
  let top = rect.bottom + gap
  let left = rect.left

  if (placement === 'right') {
    top = rect.top + rect.height / 2 - 90
    left = rect.right + gap
  }

  if (placement === 'left') {
    top = rect.top + rect.height / 2 - 90
    left = rect.left - cardWidth - gap
  }

  if (placement === 'top') {
    top = rect.top - 190
    left = rect.left
  }

  if (left + cardWidth + 12 > window.innerWidth) {
    left = window.innerWidth - cardWidth - 12
  }
  if (left < 12) {
    left = 12
  }
  if (top < 12) {
    top = rect.bottom + gap
  }
  if (top > window.innerHeight - 210) {
    top = Math.max(12, window.innerHeight - 210)
  }

  return {
    cardStyle: {
      top: `${top}px`,
      left: `${left}px`,
      width: `${cardWidth}px`
    },
    highlightStyle: {
      top: `${Math.max(4, rect.top - padding)}px`,
      left: `${Math.max(4, rect.left - padding)}px`,
      width: `${rect.width + padding * 2}px`,
      height: `${rect.height + padding * 2}px`
    }
  }
}
