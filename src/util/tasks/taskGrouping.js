import {
  getExecutorGroupName,
  getOrganizationName,
  getServiceName,
  getSupportLineLevelLabel,
  getSupportLineName,
  getTaskTypeName,
  isCurrentUserExecutor
} from 'src/util/tasks/taskFields'

// Чистые функции группировки заявок для карточного режима страницы заявок:
// доступные типы группировки, колонки карточек, фильтрация по «области» (мои / мои линии), группы.

export const GROUP_TYPE_STORAGE_KEY = 'GroupType'

// Имена computed-справочников страницы, из которых pickGroupSource берёт значения
export const GROUP_SOURCE_NAMES = [
  'groupExecutors', 'supportLines', 'supportLineLevels', 'tags', 'priorities',
  'taskTypes', 'services', 'organizations', 'statuses', 'clients'
]

// Типы группировки: фильтры без дат/дедлайна; для наблюдателя — урезанный список
// getOrganizationsCount — функция (число организаций читается лениво, только для наблюдателя)
export function getAvailableGroupTypes (filterTypes, isObserverUser, getOrganizationsCount) {
  const groupTypes = filterTypes.filter(filter =>
    !['deadline', 'createdAt', 'lastActivity'].includes(filter.slug)
  )

  if (!isObserverUser) {
    return groupTypes
  }

  const observerGroupSlugs = new Set([
    'status',
    'priority',
    'type',
    'service',
    'client',
    'tag'
  ])

  if (getOrganizationsCount() > 1) {
    observerGroupSlugs.add('organization')
  }

  return groupTypes.filter(filter => observerGroupSlugs.has(filter.slug))
}

// Сохранённый в localStorage тип группировки (JSON) -> объект из filterTypes или null, если не найден.
// Бросает исключение на битом JSON (вызывающий код чистит localStorage).
export function resolveSavedGroupType (raw, filterTypes) {
  const parsedGroupType = JSON.parse(raw)
  return filterTypes.find(type =>
    type.slug === parsedGroupType?.slug && type.label === parsedGroupType?.label
  ) || null
}

// Справочник значений для группировки по slug.
// sources: {groupExecutors, supportLines, supportLineLevels, tags, priorities, taskTypes, services, organizations, statuses, clients}
export function pickGroupSource (slug, sources) {
  switch (slug) {
    case 'executor':
      return sources.groupExecutors
    case 'supportLine':
      return sources.supportLines
    case 'supportLineLevel':
      return sources.supportLineLevels
    case 'tag':
      return sources.tags
    case 'priority':
      return sources.priorities
    case 'type':
      return sources.taskTypes
    case 'service':
      return sources.services
    case 'organization':
      return sources.organizations
    case 'status':
      return sources.statuses
    case 'client':
      return sources.clients
    default:
      return []
  }
}

export function buildCardTaskColumnFilter (slug, label, value) {
  return {
    label: label || '',
    slug,
    selectedOptions: [value],
    isBeforeDeadline: false
  }
}

// Колонки карточного режима: по одной на значение справочника
export function buildCardTaskColumnDefinitions (slug, label, source) {
  return [...new Set(source)]
    .map(value => String(value || '').trim())
    .filter(value => value.length > 0)
    .map(value => ({
      key: `${slug}:${value}`,
      slug,
      title: value,
      requiredFilterChain: [buildCardTaskColumnFilter(slug, label, value)]
    }))
}

// Имена исполнителей: справочник пользователей (без наблюдателей) + исполнители загруженных заявок
export function collectExecutorNames (tasks, users, unassignedExecutorLabel) {
  const loadedExecutors = (tasks || [])
    .map(task => getExecutorGroupName(task, unassignedExecutorLabel))
    .filter(name => name && name !== unassignedExecutorLabel)
  const directoryExecutors = (users || [])
    .filter(user => user !== null)
    .filter(user => user.roles !== 'OBSERVER')
    .map(user => `${user.firstname} ${user.lastname}`)
  return [...new Set([...directoryExecutors, ...loadedExecutors])]
}

// Идентификаторы линий поддержки, в которых участвует пользователь
export function buildUserLineIds (supportLines, userId) {
  const currentUserId = Number(userId)
  const result = new Set()
  if (!Number.isFinite(currentUserId)) {
    return result
  }
  ;(supportLines || []).forEach(line => {
    const relatedUsers = [
      line?.responsible,
      ...(Array.isArray(line?.members) ? line.members : []),
      ...(Array.isArray(line?.observers) ? line.observers : [])
    ]
    if (relatedUsers.some(user => Number(user?.id) === currentUserId)) {
      result.add(Number(line.id))
    }
  })
  return result
}

// Заявки текущей «области»: мои / мои линии / все
// scope.lineIds читается лениво (только в области «мои линии»)
export function filterTasksByScope (tasks, scope) {
  if (scope.isMyTasksScope) {
    return tasks.filter(task => isCurrentUserExecutor(task, scope.currentUser))
  }
  if (!scope.isMyLinesScope) {
    return tasks
  }
  const lineIds = scope.lineIds
  return tasks.filter(task => task?.supportLine?.id != null && lineIds.has(Number(task.supportLine.id)))
}

// Группы карточек. sources — как в pickGroupSource, unassignedExecutorLabel — метка «Без исполнителя».
export function groupTasks (tasks, slug, sources, unassignedExecutorLabel) {
  let options
  let source = pickGroupSource(slug, sources)
  const groupedCards = []
  switch (slug) {
    case 'executor': {
      options = Object.groupBy(tasks, task => getExecutorGroupName(task, unassignedExecutorLabel))
      break
    }
    case 'supportLine': {
      options = Object.groupBy(tasks, task => getSupportLineName(task))
      break
    }
    case 'supportLineLevel': {
      options = Object.groupBy(tasks, task => getSupportLineLevelLabel(task))
      break
    }
    case 'tag': {
      options = Object.groupBy(tasks, ({tags}) => tags.map(tag => tag.name).join(','))
      break
    }
    case 'priority': {
      options = Object.groupBy(tasks, ({priority}) => priority.name)
      break
    }
    case 'type': {
      options = Object.groupBy(tasks, task => getTaskTypeName(task))
      break
    }
    case 'service': {
      options = Object.groupBy(tasks, task => getServiceName(task))
      break
    }
    case 'organization': {
      options = Object.groupBy(tasks, ({organization}) => {
        if (organization) {
          return organization.name
        } else {
          return ''
        }
      })
      break
    }
    case 'status': {
      options = Object.groupBy(tasks, ({status}) => status.name)
      break
    }
    case 'client': {
      options = Object.groupBy(tasks, ({client}) => client ? `${client.lastname} ${client.firstname}` : 'Без клиента')
      break
    }
  }

  if (slug === 'tag') {
    for (const [keys, value] of Object.entries(options)) {
      for (const key of keys.split(',')) {
        const existingCard = groupedCards.find(card => card.title === key)
        if (existingCard) {
          existingCard.taskCards.push(value[0])
        } else {
          groupedCards.push({
            groupKey: `${slug}:${key || '__ungrouped__'}`,
            title: key,
            taskCards: [...value]
          })
        }
      }
    }
    groupedCards.forEach(it => {
      it.title = `${it.title ? it.title : 'Не сгрупированны'} (${it.taskCards.length})`
    })
  } else if (slug === 'organization') {
    if (options['']) {
      options[''].forEach(task => {
        const existingCard = groupedCards.find(card => card.title === getOrganizationName(task))
        if (existingCard) {
          existingCard.taskCards.push(task)
        } else {
          const groupName = getOrganizationName(task)
          groupedCards.push({
            groupKey: `${slug}:${groupName || '__ungrouped__'}`,
            title: groupName,
            taskCards: [task]
          })
        }
      })
    }
    groupedCards.forEach(it => {
      it.title = `${it.title ? it.title : 'Не сгрупированны'} (${it.taskCards.length})`
    })
  } else {
    // Справочники могут быть урезаны по роли или временно не загружены.
    // Никогда не скрываем из-за этого уже полученные с backend группы заявок.
    source = [...new Set([...(source || []), ...Object.keys(options || {})])]
    source.forEach(el => {
      const taskCards = options[el] || []
      if (taskCards.length === 0) {
        return
      }
      groupedCards.push({
        groupKey: `${slug}:${el}`,
        title: `${el} (${taskCards.length})`,
        taskCards
      })
    })
  }
  return groupedCards
}

// Объект-«справочники» со значениями, читаемыми лениво с компонента: свойство обращается к vm[name] только при чтении,
// поэтому computed-свойства, которые используют его, подписываются лишь на реально нужные справочники.
export function createLazySources (vm, names) {
  const sources = {}
  names.forEach(name => {
    Object.defineProperty(sources, name, {
      get: () => vm[name],
      enumerable: true
    })
  })
  return sources
}
