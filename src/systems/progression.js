// Progression system — leveling, move learning, creature unlocking
// Pure functions operating on creature save state
import { CREATURES, CREATURE_LIST } from '../data/creatures.js'

// Move learn schedule: move pool index → level required.
// Spread across the climb to level 50 so new moves keep showing up.
// Index 8 is the evolution signature, offered from the mid levels on.
export const MOVE_LEARN_LEVELS = {
  0: 1,
  1: 1,
  2: 6,
  3: 12,
  4: 18,
  5: 24,
  6: 32,
  7: 40,
  8: 16,
}

export const LEVEL_CAP = 50
const MAX_HELD_MOVES = 4

/** XP needed to go from this level to the next. A fair fight is about one win. */
export function xpToNext(level) {
  if (level >= LEVEL_CAP) return Infinity
  return 8 + level * 2
}

export function xpToReachLevel(level) {
  let total = 0
  for (let l = 1; l < level; l++) total += xpToNext(l)
  return total
}

export function levelFromXp(xp) {
  let level = 1
  let remaining = Math.max(0, xp || 0)
  while (level < LEVEL_CAP) {
    const need = xpToNext(level)
    if (remaining < need) break
    remaining -= need
    level++
  }
  return level
}

/** XP from beating a foe around this level. Weaker foes pay less. */
export function xpFromFoe(foeLevel) {
  return 6 + Math.max(1, foeLevel || 1) * 2
}

/**
 * Old saves used levels 1–12 as the whole game. Stretch those onto the new climb
 * so a finished team arrives near the end, and a new team stays near the start.
 */
export function mapLegacyLevel(level) {
  const table = { 1: 5, 2: 8, 3: 12, 4: 15, 5: 18, 6: 22, 7: 26, 8: 30, 9: 33, 10: 36, 11: 39, 12: 42 }
  if (table[level]) return table[level]
  return Math.min(LEVEL_CAP, Math.max(1, level || 1))
}

/** A creature won from a gym should join near the player's climb, not at level 1. */
export function levelForNewUnlock(campaign) {
  const badges = campaign?.badges?.length || 0
  return Math.min(36, Math.max(5, 5 + badges * 2))
}

/**
 * Create initial save state for a creature.
 */
export function movesKnownAtLevel(template, level) {
  const known = []
  template.movePool.forEach((moveId, index) => {
    const need = MOVE_LEARN_LEVELS[index] ?? 99
    if (level >= need) known.push(moveId)
  })
  return known.length ? known : template.movePool.slice(0, 2)
}

export function createCreatureSaveState(creatureId, level = 1) {
  const template = CREATURES[creatureId]
  if (!template) return null
  const safeLevel = Math.min(LEVEL_CAP, Math.max(1, level))
  const known = movesKnownAtLevel(template, safeLevel)
  const held = known.slice(0, 4)

  return {
    id: creatureId,
    level: safeLevel,
    xp: xpToReachLevel(safeLevel),
    wins: 0,
    currentMoves: held,
    learnedMoves: [...known],
    movesOffered: known.length,
    heldItem: null,
  }
}

/**
 * Add battle XP. Level is derived from total XP, capped at 50.
 * Also counts a win, for the old "wins" line on the card.
 */
export function addXp(creatureState, amount) {
  const xp = (creatureState.xp || 0) + Math.max(0, amount || 0)
  const level = levelFromXp(xp)
  const leveledUp = level > (creatureState.level || 1)
  return {
    state: {
      ...creatureState,
      xp,
      level,
      wins: (creatureState.wins || 0) + 1,
    },
    leveledUp,
    levelsGained: level - (creatureState.level || 1),
  }
}

/** @deprecated use addXp. Kept so older call sites still grant a small reward. */
export function addWin(creatureState) {
  return addXp(creatureState, xpFromFoe(creatureState.level || 1))
}

export function checkLevelUp(creatureState) {
  return levelFromXp(creatureState.xp || 0) > (creatureState.level || 1)
}

export function applyLevelUp(creatureState) {
  return { ...creatureState, level: levelFromXp(creatureState.xp || 0) }
}

/**
 * Check if a new move should be offered at the current level.
 * Returns the move ID if available, or null.
 */
export function getAvailableNewMove(creatureState) {
  const template = CREATURES[creatureState.id]
  if (!template) return null

  const learned = new Set(creatureState.learnedMoves || [])
  for (let i = 0; i < template.movePool.length; i++) {
    const moveId = template.movePool[i]
    if (learned.has(moveId)) continue
    const requiredLevel = MOVE_LEARN_LEVELS[i] ?? 99
    if ((creatureState.level || 1) >= requiredLevel) return moveId
  }
  return null
}

/**
 * Learn a new move. If at max moves, must specify which to forget.
 *
 * @param {object} creatureState — save state
 * @param {string} newMoveId — the new move to learn
 * @param {number|null} forgetIndex — index in currentMoves to replace, or null to add
 * @returns {object} updated state
 */
export function learnMove(creatureState, newMoveId, forgetIndex = null) {
  const newState = { ...creatureState }
  newState.learnedMoves = [...creatureState.learnedMoves, newMoveId]
  newState.movesOffered = creatureState.movesOffered + 1

  if (creatureState.currentMoves.length < MAX_HELD_MOVES) {
    // Room to add
    newState.currentMoves = [...creatureState.currentMoves, newMoveId]
  } else if (forgetIndex !== null && forgetIndex >= 0 && forgetIndex < MAX_HELD_MOVES) {
    // Replace the move at forgetIndex
    newState.currentMoves = [...creatureState.currentMoves]
    newState.currentMoves[forgetIndex] = newMoveId
  } else {
    // Declined to learn — still mark as offered
    newState.currentMoves = [...creatureState.currentMoves]
  }

  return newState
}

/**
 * Skip learning a move (player chose not to learn it).
 */
export function skipMove(creatureState) {
  return { ...creatureState, movesOffered: creatureState.movesOffered + 1 }
}

// checkCreatureUnlock removed — creatures now only unlock from gym leaders and rival 1/2 victories

/**
 * Get the starting 10 creatures for a new game.
 * Picks a balanced spread: at least 1 from each of the main 4 types,
 * then fills remaining slots.
 */
export function getStartingCreatures() {
  // Ensure coverage: 1 fire, 1 water, 1 grass, 1 electric, then 6 more random
  const guaranteed = ['fire', 'water', 'grass', 'electric']
  const selected = []
  const usedIds = new Set()

  // Pick one random creature from each guaranteed type
  for (const type of guaranteed) {
    const ofType = CREATURE_LIST.filter(c => c.type === type && !c.prevolution)
    const pick = ofType[Math.floor(Math.random() * ofType.length)]
    selected.push(pick.id)
    usedIds.add(pick.id)
  }

  // Fill remaining 6 slots randomly from unused creatures
  const remaining = CREATURE_LIST.filter(c => !usedIds.has(c.id) && !c.prevolution)
  const shuffled = [...remaining].sort(() => Math.random() - 0.5)
  for (const creature of shuffled) {
    if (selected.length >= 10) break
    selected.push(creature.id)
  }

  return selected
}
