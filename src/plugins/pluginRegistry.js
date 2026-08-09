import axios from 'axios'

export const pluginRegistry = {
  extensions: [],

  async load () {
    const response = await axios.get('/api/v1/plugins/frontend-schema')

    this.extensions = response.data?.extensions || []
  },

  registerExtensions (extensions) {
    this.extensions.push(...(extensions || []))
  },

  getExtensions (point, entityType) {
    return this.extensions.filter(extension => {
      return extension.point === point && extension.entityType === entityType
    })
  },

  clear () {
    this.extensions = []
  }
}
