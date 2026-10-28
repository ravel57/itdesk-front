// Размеры поля ввода и элементы чата, высоту которых подгоняет composer

// Корневой элемент чата (во всплывающем окне заявки — другой)
export function getChatDialogElement (isDialog) {
  return document.getElementById(isDialog ? 'chat-dialog-pop-up' : 'chat-dialog')
}

export function getTextareaMaxHeight ({ editing, isMobile, isDialog }) {
  // При редактировании длинного сообщения не даём composer'у
  // занимать большую часть экрана: текст прокручивается внутри textarea,
  // а кнопка отправки остаётся доступной.
  if (editing) {
    if (isMobile) {
      return 120
    }
    return isDialog ? 160 : 220
  }

  return isDialog ? 300 : 400
}
