// Payload обновления OLA линии. Возвращает null, если изменение отправлять не нужно.
export function buildOlaLinePayload(currentLine, patch) {
  const changesOlaEnabled = Object.prototype.hasOwnProperty.call(patch, 'olaEnabled')
  const changesOlaValue = Object.prototype.hasOwnProperty.call(patch, 'olaValue')
  const olaEnabled = changesOlaEnabled
    ? patch.olaEnabled === true
    : currentLine.olaEnabled === true

  let olaValue = Number(changesOlaValue ? patch.olaValue : currentLine.olaValue)
  if (olaEnabled && (!Number.isFinite(olaValue) || olaValue <= 0)) {
    // Enabling OLA with an empty legacy value should still be possible.
    // A zero/empty duration edit is not sent while OLA is active, because
    // the backend correctly rejects such a configuration.
    if (changesOlaEnabled && patch.olaEnabled === true) {
      olaValue = 1
    } else {
      return null
    }
  }

  return {
    ...currentLine,
    ...patch,
    olaEnabled,
    olaValue: olaEnabled ? Math.max(1, Math.trunc(olaValue)) : null
  }
}
