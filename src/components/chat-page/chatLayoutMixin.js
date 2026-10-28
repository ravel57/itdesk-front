import { calculateColumnsByRatios } from 'src/util/chatPage/columns'

// Раскладка страницы чата: перетаскивание файлов на окно чата, показ/скрытие
// помощника и изменяемая ширина колонок.
export default {
  data: () => ({
    isDraggingFilesOverChat: false,
    chatDragCounter: 0,
    helperAiQueryFromMessage: '',
    helperAiQueryVersion: 0,

    chatColumnWidth: 0,
    helperColumnWidth: 0,
    tasksColumnWidth: 0,

    columnResizeStorageKey: 'chatPage.columnWidthRatios',
    columnWidthRatios: {
      chat: 0.56,
      helper: 0.22,
      tasks: 0.22
    },

    minChatColumnWidth: 420,
    minHelperColumnWidth: 260,
    minTasksColumnWidth: 452,

    resizingColumn: null,
    resizeStartX: 0,
    resizeStartLeftWidth: 0,
    resizeStartRightWidth: 0
  }),

  computed: {
    isHelperVisible() {
      return this.isShowHelper && this.$can('CHAT_REPLY')
    },

    desktopGridStyle() {
      if (this.isMobile) {
        return ''
      }
      const chatWidth = Math.max(this.chatColumnWidth, this.minChatColumnWidth)
      const helperWidth = Math.max(this.helperColumnWidth, this.minHelperColumnWidth)
      const tasksWidth = Math.max(this.tasksColumnWidth, this.minTasksColumnWidth)
      if (this.isHelperVisible) {
        return {
          height: '100vh',
          gridTemplateColumns: `minmax(${this.minChatColumnWidth}px, ${chatWidth}px) 8px minmax(${this.minHelperColumnWidth}px, ${helperWidth}px) 8px minmax(${this.minTasksColumnWidth}px, ${tasksWidth}px)`
        }
      }
      return {
        height: '100vh',
        gridTemplateColumns: `minmax(${this.minChatColumnWidth}px, ${chatWidth}px) 8px minmax(${this.minTasksColumnWidth}px, ${tasksWidth}px)`
      }
    },
  },

  methods: {
    // Drag-n-drop работает по всей области окна чата (эта колонка), а не только
    // в диалоге «Добавить файлы» за скрепкой — ChatDialog передаёт файлы себе же
    // через публичный метод addDroppedFiles, т.к. его собственные корневые узлы
    // не образуют единый контейнер на весь экран чата.
    onChatDragEnter(event) {
      if (!Array.from(event.dataTransfer?.types || []).includes('Files')) {
        return
      }
      this.chatDragCounter++
      this.isDraggingFilesOverChat = true
    },

    onChatDragLeave() {
      this.chatDragCounter = Math.max(0, this.chatDragCounter - 1)
      if (this.chatDragCounter === 0) {
        this.isDraggingFilesOverChat = false
      }
    },

    onChatFilesDropped(event) {
      this.chatDragCounter = 0
      this.isDraggingFilesOverChat = false
      const files = Array.from(event.dataTransfer?.files || [])
      this.$refs.chatDialogRef?.addDroppedFiles(files)
    },

    showHelper() {
      this.isShowHelper = true
      localStorage.setItem('isShowHelper', 'true')
    },

    hideHelper() {
      this.isShowHelper = false
      this.tab = 'tab1'
      localStorage.setItem('isShowHelper', 'false')
      this.$nextTick(() => {
        this.applyColumnWidthsFromRatios()
      })
    },

    findInKnowledgeBase(text) {
      const query = String(text || '').trim()
      if (!query) {
        return
      }
      this.helperAiQueryFromMessage = query
      this.helperAiQueryVersion += 1
      this.isShowHelper = true
      localStorage.setItem('isShowHelper', 'true')
      if (this.isMobile) {
        this.tab = 'tab2'
      }
      this.$nextTick(() => {
        this.applyColumnWidthsFromRatios()
      })
    },

    initColumnWidths() {
      if (this.isMobile || !this.$refs.chatPageLayout) {
        return
      }

      const savedRatios = localStorage.getItem(this.columnResizeStorageKey)

      if (savedRatios) {
        try {
          const parsedRatios = JSON.parse(savedRatios)

          if (
            Number(parsedRatios.chat) > 0 &&
            Number(parsedRatios.helper) > 0 &&
            Number(parsedRatios.tasks) > 0
          ) {
            this.columnWidthRatios = {
              chat: Number(parsedRatios.chat),
              helper: Number(parsedRatios.helper),
              tasks: Number(parsedRatios.tasks)
            }
          }
        } catch (e) {
          localStorage.removeItem(this.columnResizeStorageKey)
        }
      }

      this.applyColumnWidthsFromRatios()
    },

    startColumnResize(resizeType, event) {
      if (this.isMobile) {
        return
      }
      this.resizingColumn = resizeType
      this.resizeStartX = event.clientX
      if (resizeType === 'chat-helper') {
        this.resizeStartLeftWidth = this.chatColumnWidth
        this.resizeStartRightWidth = this.helperColumnWidth
      }
      if (resizeType === 'helper-tasks') {
        this.resizeStartLeftWidth = this.helperColumnWidth
        this.resizeStartRightWidth = this.tasksColumnWidth
      }
      if (resizeType === 'chat-tasks') {
        this.resizeStartLeftWidth = this.chatColumnWidth
        this.resizeStartRightWidth = this.tasksColumnWidth
      }
      document.body.style.userSelect = 'none'
      document.body.style.cursor = 'col-resize'
      window.addEventListener('mousemove', this.resizeColumns)
      window.addEventListener('mouseup', this.stopColumnResize)
    },

    resizeColumns(event) {
      if (!this.resizingColumn) {
        return
      }
      const delta = event.clientX - this.resizeStartX
      const minChatWidth = this.minChatColumnWidth
      const minHelperWidth = this.minHelperColumnWidth
      const minTasksWidth = this.minTasksColumnWidth
      if (this.resizingColumn === 'chat-helper') {
        const totalWidth = this.resizeStartLeftWidth + this.resizeStartRightWidth
        let nextChatWidth = this.resizeStartLeftWidth + delta
        let nextHelperWidth = this.resizeStartRightWidth - delta
        if (nextChatWidth < minChatWidth) {
          nextChatWidth = minChatWidth
          nextHelperWidth = totalWidth - nextChatWidth
        }
        if (nextHelperWidth < minHelperWidth) {
          nextHelperWidth = minHelperWidth
          nextChatWidth = totalWidth - nextHelperWidth
        }
        this.chatColumnWidth = nextChatWidth
        this.helperColumnWidth = nextHelperWidth
      }
      if (this.resizingColumn === 'helper-tasks') {
        const totalWidth = this.resizeStartLeftWidth + this.resizeStartRightWidth
        let nextHelperWidth = this.resizeStartLeftWidth + delta
        let nextTasksWidth = this.resizeStartRightWidth - delta
        if (nextHelperWidth < minHelperWidth) {
          nextHelperWidth = minHelperWidth
          nextTasksWidth = totalWidth - nextHelperWidth
        }
        if (nextTasksWidth < minTasksWidth) {
          nextTasksWidth = minTasksWidth
          nextHelperWidth = totalWidth - nextTasksWidth
        }
        this.helperColumnWidth = nextHelperWidth
        this.tasksColumnWidth = nextTasksWidth
      }
      if (this.resizingColumn === 'chat-tasks') {
        const totalWidth = this.resizeStartLeftWidth + this.resizeStartRightWidth
        let nextChatWidth = this.resizeStartLeftWidth + delta
        let nextTasksWidth = this.resizeStartRightWidth - delta
        if (nextChatWidth < minChatWidth) {
          nextChatWidth = minChatWidth
          nextTasksWidth = totalWidth - nextChatWidth
        }
        if (nextTasksWidth < minTasksWidth) {
          nextTasksWidth = minTasksWidth
          nextChatWidth = totalWidth - nextTasksWidth
        }
        this.chatColumnWidth = nextChatWidth
        this.tasksColumnWidth = nextTasksWidth
      }
    },

    stopColumnResize() {
      if (this.resizingColumn) {
        this.saveColumnWidths()
      }

      this.resizingColumn = null

      document.body.style.userSelect = ''
      document.body.style.cursor = ''

      window.removeEventListener('mousemove', this.resizeColumns)
      window.removeEventListener('mouseup', this.stopColumnResize)
    },

    saveColumnWidths() {
      if (this.isHelperVisible) {
        const totalWidth = this.chatColumnWidth + this.helperColumnWidth + this.tasksColumnWidth
        if (totalWidth <= 0) {
          return
        }
        this.columnWidthRatios = {
          chat: this.chatColumnWidth / totalWidth,
          helper: this.helperColumnWidth / totalWidth,
          tasks: this.tasksColumnWidth / totalWidth
        }
      } else {
        const totalWidth = this.chatColumnWidth + this.tasksColumnWidth
        if (totalWidth <= 0) {
          return
        }
        const helperRatio = this.columnWidthRatios.helper || 0.22
        const availableRatio = 1 - helperRatio
        this.columnWidthRatios = {
          chat: availableRatio * (this.chatColumnWidth / totalWidth),
          helper: helperRatio,
          tasks: availableRatio * (this.tasksColumnWidth / totalWidth)
        }
      }
      localStorage.setItem(
        this.columnResizeStorageKey,
        JSON.stringify(this.columnWidthRatios)
      )
    },

    applyColumnWidthsFromRatios() {
      if (this.isMobile || !this.$refs.chatPageLayout) {
        return
      }
      const layoutWidth = this.$refs.chatPageLayout.clientWidth
      const resizersWidth = this.isHelperVisible ? 16 : 8
      const availableWidth = layoutWidth - resizersWidth
      if (availableWidth <= 0) {
        return
      }
      if (this.isHelperVisible) {
        const widths = calculateColumnsByRatios(
          this.columnWidthRatios,
          availableWidth,
          ['chat', 'helper', 'tasks'],
          {
            chat: this.minChatColumnWidth,
            helper: this.minHelperColumnWidth,
            tasks: this.minTasksColumnWidth
          }
        )
        this.chatColumnWidth = widths.chat
        this.helperColumnWidth = widths.helper
        this.tasksColumnWidth = widths.tasks
      } else {
        const widths = calculateColumnsByRatios(
          this.columnWidthRatios,
          availableWidth,
          ['chat', 'tasks'],
          {
            chat: this.minChatColumnWidth,
            tasks: this.minTasksColumnWidth
          }
        )
        this.chatColumnWidth = widths.chat
        this.tasksColumnWidth = widths.tasks
      }
    },

    handleWindowResize() {
      if (this.resizingColumn) {
        return
      }
      this.applyColumnWidthsFromRatios()
    },
  },
}
