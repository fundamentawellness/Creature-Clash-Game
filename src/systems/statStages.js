// Stat stage system — stages range from -3 to +3, each stage = 25%
// Pure functions, no side effects

const MIN_STAGE = -3
const MAX_STAGE = 3

/**
 * Get the multiplier for a given stat stage.
 * +1 = 1.25x, +2 = 1.5x, +3 = 1.75x
 * -1 = 0.75x, -2 = 0.5x, -3 = 0.25x
 */
export function getStatMultiplier(stage) {
  const clamped = Math.max(MIN_STAGE, Math.min(MAX_STAGE, stage))
  return 1 + clamped * 0.25
}

/**
 * Apply stat stage changes to a creature. Mutates creature.statStages in place.
 * Returns the actual change applied (after clamping).
 *
 * @param {object} creature — must have creature.statStages object
 * @param {string} stat — 'atk', 'def', 'spd', 'spc', or 'evasion'
 * @param {number} stages — positive to raise, negative to lower
 * @returns {number} the actual change applied
 */
export function applyStatStage(creature, stat, stages) {
  if (!creature.statStages) {
    creature.statStages = { atk: 0, def: 0, spd: 0, spc: 0, evasion: 0 }
  }

  const current = creature.statStages[stat] || 0
  const newValue = Math.max(MIN_STAGE, Math.min(MAX_STAGE, current + stages))
  const actualChange = newValue - current
  creature.statStages[stat] = newValue
  return actualChange
}

/**
 * Get the effective stat value after applying level bonuses and stage multipliers.
 *
 * @param {object} creature — needs baseStats, level, statStages
 * @param {string} statName — 'hp', 'atk', 'def', 'spd', 'spc'
 * @returns {number} the effective stat value (floored to integer)
 */
export function getEffectiveStat(creature, statName) {
  const base = creature.baseStats[statName]
  const level = creature.level || 1
  // 8% of base per level, minimum +1 per level
  const perLevel = Math.max(1, Math.floor(base * 0.08))
  const levelBonus = (level - 1) * perLevel

  // HP is not affected by stat stages
  if (statName === 'hp') {
    return base + levelBonus
  }

  const stage = creature.statStages?.[statName] || 0
  const multiplier = getStatMultiplier(stage)
  return Math.floor((base + levelBonus) * multiplier)
}

/**
 * Reset all stat stages to 0. Called on switch out or faint.
 */
export function resetStages(creature) {
  creature.statStages = { atk: 0, def: 0, spd: 0, spc: 0, evasion: 0 }
}

/**
 * Recalculate all currentStats from base stats, level, and stages.
 * Call after level up, stage change, or switch in.
 */
export function recalcCurrentStats(creature) {
  creature.currentStats = {
    hp: getEffectiveStat(creature, 'hp'),
    atk: getEffectiveStat(creature, 'atk'),
    def: getEffectiveStat(creature, 'def'),
    spd: getEffectiveStat(creature, 'spd'),
    spc: getEffectiveStat(creature, 'spc'),
  }
}
