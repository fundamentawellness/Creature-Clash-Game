// AI behavior system — move selection, switching, team building
// Pure functions, no side effects
import { MOVES } from '../data/moves.js'
import { CREATURE_LIST } from '../data/creatures.js'
import { calculateDamage, getEffectiveness } from './damage.js'

// Backward-compat: convert old difficulty strings to AI config objects
const DIFFICULTY_CONFIGS = {
  easy:   { optimalChance: 0.50, switchBehavior: 'never',       teamBuild: 'random' },
  medium: { optimalChance: 0.75, switchBehavior: 'disadvantage', teamBuild: 'typeCoverage' },
  hard:   { optimalChance: 1.0,  switchBehavior: 'strategic',   teamBuild: 'optimized' },
}

function resolveConfig(aiConfig) {
  if (typeof aiConfig === 'string') return DIFFICULTY_CONFIGS[aiConfig] || DIFFICULTY_CONFIGS.easy
  return aiConfig || DIFFICULTY_CONFIGS.easy
}

/**
 * Estimate damage a move would deal (uses average random factor).
 */
function estimateDamage(attacker, move, defender) {
  const fixedRng = () => 0.5
  const result = calculateDamage(attacker, move, defender, fixedRng)
  return result.damage
}

/**
 * Score a status move for AI decision making.
 */
function scoreStatusMove(move, creature, opponent) {
  if (!move.effect) return 0
  let score = 0

  if (move.effect.heal) {
    const maxHp = creature.currentStats.hp
    const missingHp = maxHp - creature.currentHp
    const healAmount = Math.floor(maxHp * move.effect.heal)
    score = Math.min(healAmount, missingHp) * 0.8
  }

  if (move.effect.stats) {
    for (const [stat, change] of Object.entries(move.effect.stats)) {
      if (stat === 'evasion') {
        score += change > 0 ? 8 : 0
        continue
      }
      if (move.effect.target === 'self') {
        const currentStage = creature.statStages?.[stat] || 0
        if (currentStage < 2 && change > 0) {
          score += change * 12
        } else if (change > 0) {
          score += change * 4
        }
        if (change < 0) score += change * 6
      } else {
        const oppStage = opponent.statStages?.[stat] || 0
        if (oppStage > -2 && change < 0) {
          score += Math.abs(change) * 10
        }
      }
    }
  }

  return score
}

/**
 * Pick the optimal move (highest estimated damage or best status value).
 */
function pickOptimalMove(aiCreature, playerCreature) {
  const moves = aiCreature.currentMoves.map(id => MOVES[id]).filter(Boolean)
  if (moves.length === 0) return null

  let bestMove = moves[0]
  let bestScore = -Infinity

  for (const move of moves) {
    let score
    if (move.category === 'status') {
      score = scoreStatusMove(move, aiCreature, playerCreature)
    } else {
      score = estimateDamage(aiCreature, move, playerCreature)
    }
    if (score > bestScore) {
      bestScore = score
      bestMove = move
    }
  }

  return bestMove
}

/**
 * Pick a random move from the creature's current moveset.
 */
function pickRandomMove(aiCreature) {
  const moves = aiCreature.currentMoves.map(id => MOVES[id]).filter(Boolean)
  if (moves.length === 0) return null
  return moves[Math.floor(Math.random() * moves.length)]
}

/**
 * AI picks a move based on config.
 *
 * @param {object} aiCreature — active AI creature (battle state)
 * @param {object} playerCreature — active player creature (battle state)
 * @param {object|string} aiConfig — { optimalChance } or legacy difficulty string
 * @returns {object} selected move from MOVES
 */
export function aiPickMove(aiCreature, playerCreature, aiConfig) {
  const config = resolveConfig(aiConfig)
  if (Math.random() < config.optimalChance) {
    return pickOptimalMove(aiCreature, playerCreature)
  }
  return pickRandomMove(aiCreature)
}

/**
 * Determine if AI should switch creatures.
 *
 * @param {object[]} aiTeam — full AI team (battle state)
 * @param {number} activeIdx — index of active creature in team
 * @param {object} playerCreature — active player creature
 * @param {object|string} aiConfig — { switchBehavior } or legacy difficulty string
 * @returns {number|null} index to switch to, or null to stay
 */
export function aiShouldSwitch(aiTeam, activeIdx, playerCreature, aiConfig) {
  const config = resolveConfig(aiConfig)
  const behavior = config.switchBehavior || 'never'

  if (behavior === 'never') return null

  const active = aiTeam[activeIdx]
  if (!active || active.currentHp <= 0) return null

  const alternatives = aiTeam
    .map((c, i) => ({ creature: c, index: i }))
    .filter(({ creature, index }) => index !== activeIdx && creature.currentHp > 0)

  if (alternatives.length === 0) return null

  const incomingMoves = playerCreature.currentMoves
    .map(id => MOVES[id])
    .filter(m => m && m.category !== 'status')

  if (behavior === 'disadvantage') {
    // Switch only at severe type disadvantage
    const severeDisadvantage = incomingMoves.some(m => {
      const eff = getEffectiveness(m.type, active.type)
      const stab = m.type === playerCreature.type ? 1.5 : 1
      return eff * stab >= 3
    })

    if (!severeDisadvantage) return null
    return findBestSwitch(alternatives, incomingMoves, playerCreature)
  }

  if (behavior === 'strategic') {
    const worstIncoming = incomingMoves.reduce((max, m) => {
      const eff = getEffectiveness(m.type, active.type)
      const stab = m.type === playerCreature.type ? 1.5 : 1
      return Math.max(max, eff * stab)
    }, 0)

    const hpPercent = active.currentHp / active.currentStats.hp
    const shouldConsiderSwitch = worstIncoming >= 3 || (worstIncoming >= 2 && hpPercent < 0.4)
    if (!shouldConsiderSwitch) return null

    return findBestSwitch(alternatives, incomingMoves, playerCreature)
  }

  if (behavior === 'proactive') {
    // All strategic logic plus: proactively switch when a much better matchup exists
    const worstIncoming = incomingMoves.reduce((max, m) => {
      const eff = getEffectiveness(m.type, active.type)
      const stab = m.type === playerCreature.type ? 1.5 : 1
      return Math.max(max, eff * stab)
    }, 0)

    const hpPercent = active.currentHp / active.currentStats.hp

    // Score current active
    const currentScore = scoreMatchup(active, incomingMoves, playerCreature)

    // Check if any alternative is significantly better
    let bestAlt = null
    let bestAltScore = -Infinity
    for (const alt of alternatives) {
      const score = scoreMatchup(alt.creature, incomingMoves, playerCreature)
      if (score > bestAltScore) {
        bestAltScore = score
        bestAlt = alt.index
      }
    }

    // Switch if at disadvantage OR if alternative is significantly better
    const shouldSwitch = worstIncoming >= 3 || (worstIncoming >= 2 && hpPercent < 0.4) || (bestAltScore > currentScore + 4)
    if (!shouldSwitch) return null

    return bestAlt
  }

  return null
}

function scoreMatchup(creature, incomingMoves, opponent) {
  let score = 0
  for (const m of incomingMoves) {
    score -= getEffectiveness(m.type, creature.type) * 3
  }
  score += getEffectiveness(creature.type, opponent.type) * 4
  score += (creature.currentHp / creature.currentStats.hp) * 2
  return score
}

function findBestSwitch(alternatives, incomingMoves, playerCreature) {
  let bestAlt = null
  let bestScore = -Infinity
  for (const alt of alternatives) {
    const score = scoreMatchup(alt.creature, incomingMoves, playerCreature)
    if (score > bestScore) {
      bestScore = score
      bestAlt = alt.index
    }
  }
  return bestAlt
}

/**
 * Build an AI team from a pool.
 *
 * @param {object[]} availableCreatures — pool to select from
 * @param {object|string} aiConfig — { teamBuild } or legacy difficulty string
 * @param {number} [teamSize=3] — number of creatures to pick
 * @returns {string[]} array of creature IDs
 */
export function aiBuildTeam(availableCreatures, aiConfig, teamSize = 3) {
  const config = resolveConfig(aiConfig)
  const strategy = config.teamBuild || 'random'

  if (availableCreatures.length <= teamSize) {
    return availableCreatures.map(c => c.id)
  }

  if (strategy === 'random') {
    const shuffled = [...availableCreatures].sort(() => Math.random() - 0.5)
    return shuffled.slice(0, teamSize).map(c => c.id)
  }

  if (strategy === 'typeCoverage') {
    const shuffled = [...availableCreatures].sort(() => Math.random() - 0.5)
    const team = [shuffled[0]]
    const usedTypes = new Set([shuffled[0].type])

    for (const creature of shuffled.slice(1)) {
      if (team.length >= teamSize) break
      if (!usedTypes.has(creature.type)) {
        team.push(creature)
        usedTypes.add(creature.type)
      }
    }
    for (const creature of shuffled) {
      if (team.length >= teamSize) break
      if (!team.includes(creature)) {
        team.push(creature)
      }
    }
    return team.map(c => c.id)
  }

  if (strategy === 'optimized') {
    const allTypes = ['fire', 'water', 'grass', 'electric', 'rock', 'ground', 'poison']
    let bestTeam = null
    let bestCoverage = -1

    for (let attempt = 0; attempt < 50; attempt++) {
      const shuffled = [...availableCreatures].sort(() => Math.random() - 0.5)
      const candidate = shuffled.slice(0, teamSize)

      const coveredTypes = new Set()
      for (const creature of candidate) {
        for (const targetType of allTypes) {
          const eff = getEffectiveness(creature.type, targetType)
          if (eff >= 2) coveredTypes.add(targetType)
        }
      }

      const uniqueTypes = new Set(candidate.map(c => c.type)).size
      const score = coveredTypes.size * 3 + uniqueTypes * 2

      const statTotal = candidate.reduce((sum, c) => {
        const s = c.baseStats
        return sum + s.hp + s.atk + s.def + s.spd + s.spc
      }, 0)

      const finalScore = score + statTotal / 100

      if (finalScore > bestCoverage) {
        bestCoverage = finalScore
        bestTeam = candidate
      }
    }

    return bestTeam.map(c => c.id)
  }

  return availableCreatures.slice(0, teamSize).map(c => c.id)
}
