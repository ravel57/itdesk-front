import {collectExecutorNames} from 'src/util/tasks/taskGrouping'

// Справочники значений для фильтров и группировки страницы заявок (computed на основе store и загруженных заявок).
// Требует на странице: this.store, currentExecutorLabel / unassignedExecutorLabel.
export default {
  computed: {
    executors() {
      return [
        this.currentExecutorLabel,
        ...collectExecutorNames(this.store.getTaskPageTasks, this.store.users, this.unassignedExecutorLabel),
        this.unassignedExecutorLabel,
      ]
    },

    groupExecutors() {
      return [
        this.unassignedExecutorLabel,
        ...collectExecutorNames(this.store.getTaskPageTasks, this.store.users, this.unassignedExecutorLabel),
      ]
    },

    services() {
      const names = (this.store.services || [])
        .filter(service => service && service.active !== false)
        .map(service => {
          const code = String(service.code || '').trim()
          const name = String(service.name || '').trim()
          return code && name ? `${code} · ${name}` : (name || code)
        })
        .filter(Boolean)
      return [...new Set([...names, 'Без сервиса'])].sort((a, b) => a.localeCompare(b, 'ru'))
    },

    supportLines() {
      const names = (this.store.supportLines || [])
        .filter(line => line && line.active !== false)
        .map(line => String(line.name || '').trim())
        .filter(Boolean)
      return [...new Set([...names, 'Без линии'])].sort((a, b) => a.localeCompare(b, 'ru'))
    },

    supportLineLevels() {
      const levels = (this.store.supportLines || [])
        .filter(line => line && line.active !== false)
        .map(line => Number(line.level))
        .filter(level => Number.isFinite(level) && level > 0)
        .sort((a, b) => a - b)
        .map(level => `L${level}`)
      return [...new Set([...levels, 'Без уровня'])]
    },

    tags() {
      return this.store.tags.map(tag => tag.name)
    },

    priorities() {
      return this.store.priorities.map(priority => priority.name)
    },

    organizations() {
      return this.store.organizations.map(organization => organization.name)
    },

    statuses() {
      return this.store.statuses.map(status => status.name)
    },

    clients() {
      return this.store.clients.map(client => `${client.lastname} ${client.firstname}`)
    },

    taskTypes() {
      return (this.store.taskTypes || [])
        .map(taskType => taskType?.type || taskType?.name || '')
        .filter(type => type)
        .sort((a, b) => a.localeCompare(b, 'ru'))
    },

    taskTypeOptions() {
      return (this.store.taskTypes || [])
        .filter(type => type && type.id != null)
        .sort((a, b) => String(a.type || '').localeCompare(String(b.type || ''), 'ru'))
    }
  }
}
