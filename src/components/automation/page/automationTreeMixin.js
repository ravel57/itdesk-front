import axios from 'axios'
import {buildLayoutKey, buildTree, toLayoutItems} from 'src/util/automationPage/automationTree'

// Дерево автоматизаций: папки, раскладка (порядок/вложенность) и её сохранение на сервере.
// Требует в компоненте: this.store.
export default {
  data: () => ({
    dragging: true,
    folders: [],
    tree: []
  }),

  computed: {
    triggerById() {
      return Object.fromEntries(this.store.triggers.map(trigger => [trigger.id, trigger]))
    },

    folderById() {
      return Object.fromEntries(this.folders.map(folder => [folder.id, folder]))
    },

    // Ключ раскладки: меняется только когда правило/папка сменили место, а не при правке содержимого.
    layoutKey() {
      return buildLayoutKey(this.store.triggers, this.folders)
    }
  },

  watch: {
    layoutKey: {
      immediate: true,
      handler() {
        this.rebuildTree()
      }
    }
  },

  methods: {
    // Дерево отображения строится из плоских данных бэкенда: в каждом контейнере папки и правила вперемешку по displayOrder.
    rebuildTree() {
      this.tree = buildTree(this.folders, this.store.triggers)
    },

    async onTreeDragEnd() {
      this.dragging = false
      await this.saveLayout()
    },

    layoutItems(nodes = this.tree) {
      return toLayoutItems(nodes)
    },

    applyLayoutResponse(data) {
      if (!data) return
      this.folders = data.folders || []
      const placements = new Map((data.triggers || []).map(item => [item.id, item]))
      this.store.triggers.forEach(trigger => {
        const placement = placements.get(trigger.id)
        if (placement) {
          Object.assign(trigger, {
            folderId: placement.folderId,
            displayOrder: placement.displayOrder,
            orderNumber: placement.orderNumber
          })
        }
      })
      // Порядок выполнения = порядок чтения дерева; держим массив в нём же.
      this.store.triggers.sort((a, b) => (a.orderNumber ?? 0) - (b.orderNumber ?? 0))
      this.rebuildTree()
    },

    async saveLayout() {
      try {
        const response = await axios.put('/api/v1/automation/layout', {items: this.layoutItems()})
        this.applyLayoutResponse(response.data)
      } catch (e) {
        this.rebuildTree()
        this.$q.notify({message: e.response?.data?.message || 'Не удалось сохранить расположение автоматизаций', type: 'negative'})
      }
    },

    async loadFolders() {
      try {
        const response = await axios.get('/api/v1/automation/folders')
        this.folders = Array.isArray(response.data) ? response.data : []
      } catch (e) {
        console.warn('Automation folders load failed', e)
      }
    },

    folderNameDialog(title, model) {
      return this.$q.dialog({
        title,
        prompt: {model, type: 'text', outlined: true, label: 'Название папки', isValid: value => value.trim().length > 0},
        cancel: {label: 'Отмена', flat: true, noCaps: true},
        ok: {label: 'Сохранить', noCaps: true},
        persistent: true
      })
    },

    createFolder() {
      this.folderNameDialog('Новая папка', 'Новая папка').onOk(async name => {
        try {
          const response = await axios.post('/api/v1/automation/folders', {name})
          this.folders.push(response.data)
        } catch (e) {
          this.$q.notify({message: e.response?.data?.message || 'Не удалось создать папку', type: 'negative'})
        }
      })
    },

    renameFolder(folderId) {
      const folder = this.folderById[folderId]
      if (!folder) return
      this.folderNameDialog('Переименовать папку', folder.name).onOk(async name => {
        try {
          const response = await axios.patch(`/api/v1/automation/folders/${folderId}`, {name})
          Object.assign(folder, response.data)
        } catch (e) {
          this.$q.notify({message: e.response?.data?.message || 'Не удалось переименовать папку', type: 'negative'})
        }
      })
    },

    async toggleFolder(folderId) {
      const folder = this.folderById[folderId]
      if (!folder) return
      const collapsed = !folder.collapsed
      folder.collapsed = collapsed
      try {
        await axios.patch(`/api/v1/automation/folders/${folderId}`, {collapsed})
      } catch (e) {
        folder.collapsed = !collapsed
        this.$q.notify({message: 'Не удалось сохранить состояние папки', type: 'negative'})
      }
    },

    deleteFolder(folderId) {
      const folder = this.folderById[folderId]
      if (!folder) return
      this.$q.dialog({
        title: 'Удалить папку?',
        message: `Папка «${folder.name}» будет удалена, а автоматизации из неё останутся в списке на её месте.`,
        cancel: {label: 'Отмена', flat: true, noCaps: true},
        ok: {label: 'Удалить', color: 'negative', noCaps: true},
        persistent: true
      }).onOk(async () => {
        try {
          const response = await axios.delete(`/api/v1/automation/folders/${folderId}`)
          this.applyLayoutResponse(response.data)
        } catch (e) {
          this.$q.notify({message: e.response?.data?.message || 'Не удалось удалить папку', type: 'negative'})
        }
      })
    }
  }
}
