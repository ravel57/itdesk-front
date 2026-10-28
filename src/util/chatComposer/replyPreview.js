// Подпись вложения в превью ответа, когда у сообщения нет текста
export function getAttachmentKindLabel (fileType) {
  if (fileType.startsWith('video/')) {
    return 'Видео'
  } else if (fileType.startsWith('image/')) {
    return 'Изображение'
  } else if (fileType.startsWith('audio/')) {
    return 'Аудио'
  } else {
    return 'Файл'
  }
}
