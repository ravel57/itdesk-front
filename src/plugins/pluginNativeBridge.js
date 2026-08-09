import axios from 'axios'
import { getByPath } from './pluginUtils'

export const pluginNativeBridge = {
  async execute (action, context) {
    if (!action) {
      return null
    }

    if (action.type !== 'hook') {
      return null
    }

    const payload = resolvePayload(action.payload || {}, context)

    return axios.post('/api/v1/plugins/native-hook/execute', {
      hook: action.name,
      entityType: context.entityType,
      entityId: context.entity?.id,
      payload
    })
  }
}

function resolvePayload (payloadConfig, context) {
  const result = {}

  Object.entries(payloadConfig || {}).forEach(([key, value]) => {
    if (value && typeof value === 'object' && value.path) {
      result[key] = getByPath(context, value.path)
    } else {
      result[key] = value
    }
  })

  return result
}
