// Damage calculation system — pure functions, no side effects
import { TYPE_CHART } from '../data/types.js'
import { getStatMultiplier } from './statStages.js'

/**
 * Look up type effectiveness multiplier from the chart.
 * Returns 0, 0.5, 1, or 2.
 * @param {object} [chart] — optional custom type chart (for custom types)
 */
export function getEffectiveness(moveType, defenderType, chart) {
  const tc = chart || TYPE_CHART
  return tc[moveType]?.[defenderType] ?? 1
}

/**
 * Returns a human-readable string for effectiveness, or null for neutral.
 */
export function getEffectivenessText(multiplier) {
  if (multiplier === 0) return 'immune'
  if (multiplier < 1) return 'not very effective'
  if (multiplier > 1) return 'super effective'
  return null
}

/**
 * Hit chance after the defender's evasion stages.
 * Each evasion stage is the same 25% step as other stats: +1 evasion
 * divides accuracy by 1.25, so a sure hit becomes an 80% hit.
 * Status moves are not rolled (callers skip this).
 * @returns {number} 0–100
 */
export function getHitChance(move, defender) {
  const base = move.accuracy == null ? 100 : move.accuracy
  const evasionStage = defender?.statStages?.evasion || 0
  const evasion = getStatMultiplier(evasionStage)
  if (evasion <= 0) return 100
  return Math.max(0, Math.min(100, base / evasion))
}

/**
 * Calculate damage for one attack.
 *
 * @param {object} attacker — creature state with currentStats, type, statStages
 * @param {object} move — move definition from MOVES
 * @param {object} defender — creature state with currentStats, type, statStages
 * @param {function} [rng] — optional random function (returns 0-1) for testing
 * @param {object} [typeChart] — full chart, including Forge custom types
 * @returns {{ damage: number, effectiveness: number, stab: boolean, missed: boolean, dodged: boolean }}
 */
export function calculateDamage(attacker, move, defender, rng = Math.random, typeChart) {
  // Status moves deal no damage and do not check accuracy or evasion
  if (move.category === 'status') {
    return { damage: 0, effectiveness: 1, stab: false, missed: false, dodged: false }
  }

  // Miss check. Evasion can make even a 100% move miss.
  const hitChance = getHitChance(move, defender)
  if (hitChance < 100) {
    const hitRoll = rng() * 100
    if (hitRoll > hitChance) {
      const dodged = (defender?.statStages?.evasion || 0) > 0
      return { damage: 0, effectiveness: 1, stab: false, missed: true, dodged }
    }
  }

  // Determine which stats to use
  const atkStat = move.category === 'physical'
    ? attacker.currentStats.atk
    : attacker.currentStats.spc
  const defStat = move.category === 'physical'
    ? defender.currentStats.def
    : defender.currentStats.spc

  // STAB check
  const stab = move.type === attacker.type
  const stabMultiplier = stab ? 1.5 : 1

  // Type effectiveness
  const effectiveness = getEffectiveness(move.type, defender.type, typeChart)

  // Immune — no damage
  if (effectiveness === 0) {
    return { damage: 0, effectiveness: 0, stab, missed: false, dodged: false }
  }

  // Random factor: 0.85 to 1.0
  const random = 0.85 + rng() * 0.15

  // Stat ratio with sqrt scaling
  const ratio = atkStat / defStat
  const statRatio = Math.sqrt(ratio) * (ratio > 1 ? 1.1 : 0.95)

  // Raw damage
  const raw = (statRatio * move.power * stabMultiplier * effectiveness * random) / 3.5

  // Minimum 1 damage on hit
  const damage = Math.max(1, Math.floor(raw))

  return { damage, effectiveness, stab, missed: false, dodged: false }
}
