import { getMessageFileSizeError } from 'src/util/messageFileUpload'
import {
  formatClipboardFileDate,
  getFileExtensionByType,
  getFilesFromClipboard,
  normalizePastedFile,
  splitFilesBySize
} from 'src/util/chatComposer/clipboardFiles'

// Вложения сообщения: список прикреплённых файлов, вставка из буфера обмена, drag-n-drop.
// Требует в компоненте: this.$q.
export default {
  data: () => ({
    attachedFiles: [],
    fileUploadError: '',
    showListPinedFiles: false
  }),

  methods: {
    handlePaste (event) {
      const files = this.getFilesFromClipboard(event)
      if (files.length === 0) {
        return
      }
      event.preventDefault()
      const { allowedFiles, rejectedFiles } = splitFilesBySize(files)
      if (rejectedFiles.length > 0) {
        this.fileUploadError = getMessageFileSizeError(rejectedFiles)
        this.$q.notify({
          message: this.fileUploadError,
          type: 'negative'
        })
        this.showListPinedFiles = true
      }
      if (allowedFiles.length === 0) {
        return
      }
      this.attachedFiles = [
        ...this.attachedFiles,
        ...allowedFiles
      ]
      this.$q.notify({
        message: `Добавлено из буфера: ${allowedFiles.length}`,
        type: 'positive'
      })
      this.showListPinedFiles = true
    },

    // Вызывается родительским контейнером чата (его границы — реальная область окна чата)
    // при drop файлов через drag-n-drop, т.к. корневые узлы этого компонента — фрагменты
    // без общего оборачивающего блока на весь экран чата.
    addDroppedFiles (files) {
      if (!Array.isArray(files) || files.length === 0) {
        return
      }
      const { allowedFiles, rejectedFiles } = splitFilesBySize(files)
      if (rejectedFiles.length > 0) {
        this.fileUploadError = getMessageFileSizeError(rejectedFiles)
        this.$q.notify({
          message: this.fileUploadError,
          type: 'negative'
        })
      }
      if (allowedFiles.length === 0) {
        return
      }
      this.attachedFiles = [
        ...this.attachedFiles,
        ...allowedFiles
      ]
    },

    getFilesFromClipboard (event) {
      return getFilesFromClipboard(event)
    },

    normalizePastedFile (file) {
      return normalizePastedFile(file)
    },

    getFileExtensionByType (type) {
      return getFileExtensionByType(type)
    },

    formatClipboardFileDate () {
      return formatClipboardFileDate()
    }
  }
}
