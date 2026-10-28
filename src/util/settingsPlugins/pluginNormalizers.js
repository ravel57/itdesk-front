// Нормализация ответов /api/v1/plugins* и сообщений об ошибках для страницы «Плагины».

export function cleanBackendString(value) {
  if (value === null || value === undefined) {
    return null
  }

  const normalized = String(value).trim()
  if (!normalized || normalized.toLowerCase() === 'null') {
    return null
  }

  return normalized
}

export function getErrorMessage(e, fallback) {
  return e?.response?.data?.message ||
    e?.response?.data?.error ||
    e?.message ||
    fallback
}

export function normalizePluginPermissions(data) {
  const source = Array.isArray(data) ? data : data?.permissions || []

  return source.map(item => {
    if (typeof item === 'string') {
      return {
        permission: item,
        description: item,
        approved: false,
        approvedAt: null,
        approvedBy: null
      }
    }

    return {
      permission: item?.permission || item?.name || '',
      description: cleanBackendString(item?.description),
      approved: item?.approved === true,
      approvedAt: cleanBackendString(item?.approvedAt),
      approvedBy: cleanBackendString(item?.approvedBy)
    }
  }).filter(item => item.permission)
}

export function normalizePluginSecrets(data) {
  const source = Array.isArray(data) ? data : data?.secrets || []

  return source.map(secret => ({
    name: cleanBackendString(secret?.name) || '',
    title: cleanBackendString(secret?.title),
    description: cleanBackendString(secret?.description),
    sendTo: Array.isArray(secret?.sendTo) ? secret.sendTo.filter(Boolean) : [],
    configured: secret?.configured === true
  })).filter(secret => secret.name)
}

export function resolveRuntime(plugin, manifest) {
  if (plugin.runtime && typeof plugin.runtime === 'string') {
    return plugin.runtime
  }

  if (plugin.runtime?.type) {
    return plugin.runtime.type
  }

  if (manifest.runtime?.type) {
    return manifest.runtime.type
  }

  return 'frontend-only'
}

export function resolveExtensionPoints(plugin, manifest) {
  const points = []

  const fromPlugin = plugin.extensionPoints || []
  const fromManifest = manifest.extensionPoints || []

  ;[...fromPlugin, ...fromManifest].forEach(point => {
    if (typeof point === 'string') {
      points.push(point)
    } else if (point?.point) {
      points.push(point.point)
    }
  })

  return [...new Set(points)]
}

export function normalizePlugins(data) {
  const source = Array.isArray(data)
    ? data
    : data?.plugins || data?.items || []

  return source.map(plugin => {
    const manifest = plugin.manifest || plugin
    const pluginInfo = manifest.plugin || plugin.plugin || {}

    const extensionPoints = resolveExtensionPoints(plugin, manifest)

    return {
      key: plugin.key || pluginInfo.key || manifest.key,
      name: plugin.name || pluginInfo.name || manifest.name,
      description: plugin.description || pluginInfo.description || manifest.description,
      version: plugin.version || pluginInfo.version || manifest.version,
      author: plugin.author || pluginInfo.author || manifest.author,
      enabled: plugin.enabled !== false,
      runtime: resolveRuntime(plugin, manifest),
      extensionPoints
    }
  }).filter(plugin => plugin.key)
}
