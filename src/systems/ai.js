// AI behavior system — move selection, switching, team building
// Pure functions, no side effects
import { MOVES } from '../data/moves.js'
import { CREATURE_LIST } from '../data/creatures.js'
import { calculateDamage, getEffectiveness } from './damage.js'

/**
 * Estimate damage a move would deal (uses average random factor).
 */
function estimateDamage(attacker, move, defender) {
  const fixedRng = () => 0.5 // Midpoint for estimation
  const result = calculateDamage(attacker, move, defender, fixedRng)
  return result.damage
}

/**
 * Score a status move for AI decision making.
 * Returns a pseudo-damage score so status moves can compete with attacks.
 */
function scoreStatusMove(move, creature, opponent) {
  if (!move.effect) return 0
  let score = 0

  if (move.effect.heal) {
    // Healing is more valuable when HP is low
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
        // Diminishing returns at high stages
        if (currentStage < 2 && change > 0) {
          score += change * 12
        } else if (change > 0) {
          score += change * 4
        }
        // Self-debuff penalty (Power Surge)
        if (change < 0) score += change * 6
      } else {
        // Opponent debuffs
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
 * AI picks a move based on difficulty level.
 *
 * @param {object} aiCreature — active AI creature (battle state)
 * @param {object} playerCreature — active player creature (battle state)
 * @param {'easy'|'medium'|'hard'} difficulty
 * @returns {object} selected move from MOVES
 */
export function aiPickMove(aiCreature, playerCreature, difficulty) {
  switch (difficulty) {
    case 'easy': {
      // 50% optimal, 50% random
      if (Math.random() < 0.5) {
        return pickOptimalMove(aiCreature, playerCreature)
      }
      return pickRandomMove(aiCreature)
    }
    case 'medium': {
      // 75% optimal, 25% random
      if (Math.random() < 0.75) {
        return pickOptimalMove(aiCreature, playerCreature)
      }
      return pickRandomMove(aiCreature)
    }
    case 'hard': {
      // Always optimal — also considers stat moves strategically
      return pickOptimalMove(aiCreature, playerCreature)
    }
    default:
      return pickRandomMove(aiCreature)
  }
}

/**
 * Determine if AI should switch creatures.
 *
 * @param {object[]} aiTeam — full AI team (battle state)
 * @param {number} activeIdx — index of active creature in team
 * @param {object} playerCreature — active player creature
 * @param {'easy'|'medium'|'hard'} difficulty
 * @returns {number|null} index to switch to, or null to stay
 */
export function aiShouldSwitch(aiTeam, activeIdx, playerCreature, difficulty) {
  // Easy AI never switches
  if (difficulty === 'easy') return null

  const active = aiTeam[activeIdx]
  if (!active || active.currentHp <= 0) return null

  // Find alive alternatives
  const alternatives = aiTeam
    .map((c, i) => ({ creature: c, index: i }))
    .filter(({ creature, index }) => index !== activeIdx && creature.currentHp > 0)

  if (alternatives.length === 0) return null

  if (difficulty === 'medium') {
    // Switch when at severe type disadvantage (any of opponent's STAB moves is 2x)
    const incomingMoves = playerCreature.currentMoves
      .map(id => MOVES[id])
      .filter(m => m && m.category !== 'status')

    const severeDisadvantage = incomingMoves.some(m => {
      const eff = getEffectiveness(m.type, active.type)
      const stab = m.type === playerCreature.type ? 1.5 : 1
      return eff * stab >= 3 // 2x effectiveness with STAB
    })

    if (!severeDisadvantage) return null

    // Find best alternative by type matchup
    let bestAlt = null
    let bestScore = -Infinity
    for (const alt of alternatives) {
      let score = 0
      for (const m of incomingMoves) {
        const eff = getEffectiveness(m.type, alt.creature.type)
        score -= eff // Lower effectiveness against us = better
      }
      // Bonus for having super effective STAB against player
      const ourStabEff = getEffectiveness(alt.creature.type, playerCreature.type)
      score += ourStabEff * 2

      if (score > bestScore) {
        bestScore = score
        bestAlt = alt.index
      }
    }
    return bestAlt
  }

  if (difficulty === 'hard') {
    // Strategic switching:
    // 1. Switch if at type disadvantage
    // 2. Switch if low HP and a better matchup exists
    // 3. Preserve weakened creatures

    const incomingMoves = playerCreature.currentMoves
      .map(id => MOVES[id])
      .filter(m => m && m.category !== 'status')

    // Check worst-case incoming damage
    const worstIncoming = incomingMoves.reduce((max, m) => {
      const eff = getEffectiveness(m.type, active.type)
      const stab = m.type === playerCreature.type ? 1.5 : 1
      return Math.max(max, eff * stab)
    }, 0)

    const hpPercent = active.currentHp / active.currentStats.hp

    // Switch if taking super effective hits, or low HP with disadvantage
    const shouldConsiderSwitch = worstIncoming >= 3 || (worstIncoming >= 2 && hpPercent < 0.4)
    if (!shouldConsiderSwitch) return null

    // Score alternatives
    let bestAlt = null
    let bestScore = -Infinity
    for (const alt of alternatives) {
      let score = 0

      // Defensive: how well do we resist incoming?
      for (const m of incomingMoves) {
        const eff = getEffectiveness(m.type, alt.creature.type)
        score -= eff * 3
      }

      // Offensive: can we hit them super effectively?
      const ourStabEff = getEffectiveness(alt.creature.type, playerCreature.type)
      score += ourStabEff * 4

      // HP preservation: prefer healthier creatures
      const altHpPct = alt.creature.currentHp / alt.creature.currentStats.hp
      score += altHpPct * 2

      if (score > bestScore) {
        bestScore = score
        bestAlt = alt.index
      }
    }

    return bestAlt
  }

  return null
}

/**
 * Build an AI team of 3 creatures.
 *
 * @param {object[]} availableCreatures — pool to select from
 * @param {'easy'|'medium'|'hard'} difficulty
 * @returns {string[]} array of 3 creature IDs
 */
export function aiBuildTeam(availableCreatures, difficulty) {
  if (availableCreatures.length <= 3) {
    return availableCreatures.map(c => c.id)
  }

  if (difficulty === 'easy') {
    // Random selection
    const shuffled = [...availableCreatures].sort(() => Math.random() - 0.5)
    return shuffled.slice(0, 3).map(c => c.id)
  }

  if (difficulty === 'medium') {
    // Decent type coverage — try to pick 3 different types
    const shuffled = [...availableCreatures].sort(() => Math.random() - 0.5)
    const team = [shuffled[0]]
    const usedTypes = new Set([shuffled[0].type])

    for (const creature of shuffled.slice(1)) {
      if (team.length >= 3) break
      if (!usedTypes.has(creature.type)) {
        team.push(creature)
        usedTypes.add(creature.type)
      }
    }
    // Fill remaining slots if needed
    for (const creature of shuffled) {
      if (team.length >= 3) break
      if (!team.includes(creature)) {
        team.push(creature)
      }
    }
    return team.map(c => c.id)
  }

  if (difficulty === 'hard') {
    // Optimized: pick creatures with best offensive coverage and type synergy
    const allTypes = ['fire', 'water', 'grass', 'electric', 'rock', 'ground', 'poison']
    let bestTeam = null
    let bestCoverage = -1

    // Try multiple random combinations and pick the best
    for (let attempt = 0; attempt < 50; attempt++) {
      const shuffled = [...availableCreatures].sort(() => Math.random() - 0.5)
      const candidate = shuffled.slice(0, 3)

      // Score: how many types can this team hit super effectively?
      const coveredTypes = new Set()
      for (const creature of candidate) {
        for (const targetType of allTypes) {
          const eff = getEffectiveness(creature.type, targetType)
          if (eff >= 2) coveredTypes.add(targetType)
        }
      }

      // Bonus for type diversity within the team
      const uniqueTypes = new Set(candidate.map(c => c.type)).size
      const score = coveredTypes.size * 3 + uniqueTypes * 2

      // Prefer higher base stat totals
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

  // Fallback
  return availableCreatures.slice(0, 3).map(c => c.id)
}
