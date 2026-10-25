// Зоны SLA по оставшемуся времени. Границы задаются в процентах и общие для всех SLA (Настройки → Общие):
// зелёная — остаётся больше orangeStartPercent, оранжевая — от redStartPercent (не включая) до orangeStartPercent,
// красная — redStartPercent и меньше; просроченный SLA всегда красный.

export const DEFAULT_SLA_ZONES = Object.freeze({orangeStartPercent: 50, redStartPercent: 25})

export function isValidSlaZones(orange, red) {
  return Number.isInteger(orange) && Number.isInteger(red) && red >= 1 && red < orange && orange <= 99
}

export function normalizeSlaZones(value) {
  const orange = Number(value?.orangeStartPercent ?? value?.slaOrangeStartPercent)
  const red = Number(value?.redStartPercent ?? value?.slaRedStartPercent)
  return isValidSlaZones(orange, red)
    ? {orangeStartPercent: orange, redStartPercent: red}
    : {...DEFAULT_SLA_ZONES}
}

/** Зона по доле оставшегося времени (0..1): 'green' | 'orange' | 'red'. null — SLA неизвестен. */
export function slaZone(fraction, zones = DEFAULT_SLA_ZONES) {
  if (fraction === null || fraction === undefined || !Number.isFinite(fraction)) return null
  const {orangeStartPercent, redStartPercent} = normalizeSlaZones(zones)
  const percent = fraction * 100
  if (percent > orangeStartPercent) return 'green'
  if (percent > redStartPercent) return 'orange'
  return 'red'
}

/** Показывать ли SLA «в тревожной зоне»: оранжевая, красная или просрочено. */
export function isSlaAlertZone(fraction, zones = DEFAULT_SLA_ZONES) {
  const zone = slaZone(fraction, zones)
  return zone === 'orange' || zone === 'red'
}
