// Снимок состояния редактора для определения несохранённых изменений.
// Порядок ключей объекта может измениться после нормализации или undo без изменения графа — поэтому сортируем.
export function buildEditorSnapshot({name, description, enabled, stopProcessing, mode, definition}) {
  return JSON.stringify({
    name: name || '',
    description: description || '',
    enabled,
    stopProcessing,
    mode,
    definition
  }, (_key, value) => value && typeof value === 'object' && !Array.isArray(value)
    ? Object.fromEntries(Object.keys(value).sort().map(key => [key, value[key]]))
    : value)
}
