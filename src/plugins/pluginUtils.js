export function getByPath (source, path) {
  if (!source || !path) {
    return undefined
  }

  return path.split('.').reduce((current, part) => {
    if (current === null || current === undefined) {
      return undefined
    }

    return current[part]
  }, source)
}

export function resolveValue (config, context) {
  if (config === null || config === undefined) {
    return ''
  }

  if (typeof config !== 'object') {
    return config
  }

  if (config.path) {
    const value = getByPath(context, config.path)

    if (value !== null && value !== undefined && value !== '') {
      return value
    }

    return config.fallback !== undefined ? config.fallback : ''
  }

  if (config.template) {
    return resolveTemplate(config.template, context)
  }

  return config
}

export function resolveTemplate (template, context) {
  if (!template) {
    return ''
  }

  return template.replace(/\$\{([^}]+)}/g, (_, path) => {
    const value = getByPath(context, path.trim())
    return value !== null && value !== undefined ? value : ''
  })
}

export function evaluateVisible (visibleConfig, context) {
  if (!visibleConfig) {
    return true
  }

  if (visibleConfig.path) {
    return Boolean(getByPath(context, visibleConfig.path))
  }

  if (visibleConfig.notEmpty) {
    const value = getByPath(context, visibleConfig.notEmpty)
    return value !== null && value !== undefined && value !== ''
  }

  if (visibleConfig.equals) {
    const left = getByPath(context, visibleConfig.equals.path)
    return left === visibleConfig.equals.value
  }

  if (visibleConfig.notEquals) {
    const left = getByPath(context, visibleConfig.notEquals.path)
    return left !== visibleConfig.notEquals.value
  }

  if (visibleConfig.any) {
    return visibleConfig.any.some(condition => evaluateVisible(condition, context))
  }

  if (visibleConfig.all) {
    return visibleConfig.all.every(condition => evaluateVisible(condition, context))
  }

  return true
}
