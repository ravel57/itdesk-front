import { nodeSize } from './nodeSizes'

// Выходные порты узлов, маркеры связей и позиционирование портов.

export function distributePorts(ports) {
  const count = Math.max(1, ports.length)
  return ports.map((port, index) => ({...port, yRatio: (index + 1) / (count + 1)}))
}

export function outputPorts(node) {
  const c = node.config || {}
  if (['OPERATION'].includes(node.type)) return distributePorts([{handle: 'success', label: 'Готово', tooltip: 'Шаг выполнен'}, {handle: 'error', label: 'Ошибка', tooltip: 'Обработать ошибку'}])
  if (node.type === 'FOR_EACH') return distributePorts([{handle: 'body', label: 'ЭЛЕМЕНТ', tooltip: 'Обработать каждый элемент'}, {handle: 'next', label: 'ГОТОВО', tooltip: 'Продолжить после списка'}])
  if (['LOOP_END', 'LOOP_BREAK'].includes(node.type)) return []
  if (node.type === 'END' || node.type === 'JOIN') {
    return node.type === 'JOIN' ? [{
      handle: 'next',
      label: '',
      tooltip: 'Продолжить после объединения',
      yRatio: 0.5
    }] : []
  }
  if (node.type === 'CONDITION') {
    return distributePorts([
      {handle: 'true', label: 'ДА', tooltip: 'Условие выполнено'},
      {handle: 'false', label: 'НЕТ', tooltip: 'Условие не выполнено'}
    ])
  }
  if (node.type === 'SWITCH') {
    const ports = (c.cases || []).map(item => ({
      handle: `case:${item.id}`,
      label: item.label || String(item.value || 'Вариант'),
      tooltip: `Значение: ${item.value}`
    }))
    ports.push({handle: 'default', label: 'ИНАЧЕ', tooltip: 'Ни один вариант не совпал'})
    return distributePorts(ports)
  }
  if (node.type === 'WAIT_EVENT' || node.type === 'WAIT_TASK') {
    return distributePorts([
      {handle: 'event', label: 'СОБЫТИЕ', tooltip: 'Ожидаемое событие произошло'},
      {handle: 'timeout', label: 'ТАЙМАУТ', tooltip: 'Истёк срок ожидания'}
    ])
  }
  if (node.type === 'APPROVAL') {
    return distributePorts([
      {handle: 'approved', label: 'ОДОБРЕНО', tooltip: 'Решение одобрено'},
      {handle: 'rejected', label: 'ОТКЛОНЕНО', tooltip: 'Решение отклонено'},
      {handle: 'timeout', label: 'ТАЙМАУТ', tooltip: 'Решение не принято вовремя'}
    ])
  }
  if (node.type === 'BUSINESS_HOURS') {
    return distributePorts([
      {handle: 'working', label: 'РАБОТА', tooltip: 'Сейчас рабочее время'},
      {handle: 'after_hours', label: 'НЕРАБОЧЕЕ', tooltip: 'Рабочий день, но вне часов'},
      {handle: 'weekend', label: 'ВЫХОДНОЙ', tooltip: 'Сейчас выходной день'}
    ])
  }
  if (node.type === 'ERROR_HANDLER' || node.type === 'HTTP_REQUEST' || node.type === 'SUBFLOW' || node.type === 'CREATE_TASK' || node.type === 'ESCALATE' || node.type === 'NOTIFY') {
    return distributePorts([
      {handle: 'success', label: 'УСПЕХ', tooltip: 'Шаг выполнен'},
      {handle: 'error', label: 'ОШИБКА', tooltip: 'Во время шага произошла ошибка'}
    ])
  }
  if (node.type === 'RETRY') {
    return distributePorts([
      {handle: 'success', label: 'УСПЕХ', tooltip: 'Действие выполнено'},
      {handle: 'failed', label: 'НЕ УДАЛОСЬ', tooltip: 'Попытки исчерпаны'}
    ])
  }
  if (node.type === 'THROTTLE') {
    return distributePorts([
      {handle: 'allowed', label: 'РАЗРЕШЕНО', tooltip: 'Ограничение не превышено'},
      {handle: 'blocked', label: 'БЛОК', tooltip: 'Слишком частый запуск'}
    ])
  }
  if (node.type === 'DEDUPLICATE') {
    return distributePorts([
      {handle: 'duplicate', label: 'ДУБЛЬ', tooltip: 'Похожая заявка найдена'},
      {handle: 'unique', label: 'НОВАЯ', tooltip: 'Дубликат не найден'}
    ])
  }
  if (node.type === 'FORK') {
    return distributePorts((c.branches || []).map(branch => ({
      handle: `branch:${branch.id}`,
      label: branch.label || 'Ветка',
      tooltip: branch.label || 'Параллельная ветка'
    })))
  }
  return [{handle: 'next', label: '', tooltip: 'Следующий шаг', yRatio: 0.5}]
}

export function requiredOutputHandles(node) {
  if (['END', 'LOOP_END', 'LOOP_BREAK'].includes(node.type)) return []
  if (node.type === 'FORK') return outputPorts(node).map(port => port.handle)
  return outputPorts(node).map(port => port.handle)
}

export function edgeMarker(handle) {
  const positive = ['true', 'event', 'approved', 'working', 'success', 'allowed', 'unique']
  const negative = ['false', 'timeout', 'rejected', 'after_hours', 'weekend', 'error', 'failed', 'blocked', 'duplicate']
  if (positive.includes(handle)) return 'true'
  if (negative.includes(handle)) return 'false'
  return 'default'
}

export function edgeHandleLabel(node, handle) {
  return outputPorts(node).find(port => port.handle === handle)?.label || ''
}

export function inputPortStyle(node) {
  const size = nodeSize(node)
  // Absolute port positions start inside the node border; SVG points use its outer edge.
  return {top: `calc(${size.height / 2}px - var(--flow-node-border-top))`}
}

export function outputPortStyle(node, port) {
  const size = nodeSize(node)
  return {top: `calc(${size.height * port.yRatio}px - var(--flow-node-border-top))`}
}

export function outputLabelStyle(node, port) {
  const size = nodeSize(node)
  return {top: `${size.height * port.yRatio - 10}px`}
}
