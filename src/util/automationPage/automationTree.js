// Дерево отображения автоматизаций (папки и правила вперемешку) и его преобразования.

// Ключ раскладки: меняется только когда правило/папка сменили место, а не при правке содержимого.
export function buildLayoutKey(triggers, folders) {
  return JSON.stringify([
    triggers.map(t => [t.id, t.folderId ?? null, t.displayOrder ?? 0]),
    folders.map(f => [f.id, f.displayOrder ?? 0, f.parentId ?? null])
  ])
}

// Дерево отображения строится из плоских данных бэкенда: в каждом контейнере папки и правила вперемешку по displayOrder.
export function buildTree(folders, triggers) {
  const byPosition = (a, b) => (a.position - b.position) || (a.sort - b.sort)
  const folderIds = new Set(folders.map(folder => folder.id))
  const containerOf = folder => (folder.parentId != null && folderIds.has(folder.parentId) ? folder.parentId : null)
  const build = containerId => {
    const nodes = []
    folders.filter(folder => containerOf(folder) === containerId).forEach(folder => nodes.push({
      key: `folder-${folder.id}`,
      type: 'folder',
      id: folder.id,
      position: folder.displayOrder ?? 0,
      sort: -1,
      children: build(folder.id)
    }))
    triggers
      .filter(trigger => (trigger.folderId != null && folderIds.has(trigger.folderId) ? trigger.folderId : null) === containerId)
      .forEach(trigger => nodes.push({
        key: `trigger-${trigger.id}`,
        type: 'trigger',
        id: trigger.id,
        position: trigger.displayOrder ?? 0,
        sort: trigger.orderNumber ?? 0
      }))
    return nodes.sort(byPosition)
  }
  return build(null)
}

export function toLayoutItems(nodes) {
  return nodes.map(node => node.type === 'folder'
    ? {type: 'FOLDER', id: node.id, items: toLayoutItems(node.children)}
    : {type: 'TRIGGER', id: node.id})
}

// Вставляет node сразу после узла-правила с id = triggerId (в любой папке); true, если нашёл место.
export function placeAfter(nodes, triggerId, node) {
  const index = nodes.findIndex(item => item.type === 'trigger' && item.id === triggerId)
  if (index >= 0) {
    nodes.splice(index + 1, 0, node)
    return true
  }
  return nodes.some(item => item.type === 'folder' && placeAfter(item.children, triggerId, node))
}
