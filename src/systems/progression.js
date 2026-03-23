// Progression system — leveling, move learning, creature unlocking
// Pure functions operating on creature save state
import { CREATURES, CREATURE_LIST } from '../data/creatures.js'

// Move learn schedule: move pool index → level required
// Slots 1-2 are starters (level 1), then new move every other level
export const MOVE_LEARN_LEVELS = {
  0: 1,  // Slot 1: starter (weak STAB)
  1: 1,  // Slot 2: starter (normal damage)
  2: 2,  // Slot 3: level 2
  3: 4,  // Slot 4: level 4
  4: 6,  // Slot 5: level 6 — first forget choice
  5: 8,  // Slot 6: level 8
  6: 10, // Slot 7: level 10
  7: 12, // Slot 8: level 12
}

const MAX_HELD_MOVES = 4
const WINS_PER_LEVEL = 2

/**
 * Create initial save state for a creature.
 */
export function createCreatureSaveState(creatureId) {
  const template = CREATURES[creatureId]
  if (!template) return null

  return {
    id: creatureId,
    level: 1,
    wins: 0,
    currentMoves: [template.movePool[0], template.movePool[1]], // Start with 2 moves
    learnedMoves: [template.movePool[0], template.movePool[1]],
    movesOffered: 2, // How many moves from the pool have been offered
  }
}

/**
 * Record a win for a creature. Returns updated state and whether a level up occurred.
 */
export function addWin(creatureState) {
  const newState = { ...creatureState, wins: creatureState.wins + 1 }
  const leveledUp = checkLevelUp(newState)
  return { state: newState, leveledUp }
}

/**
 * Check if creature should level up based on win count.
 * Level = floor(wins / 2) + 1, capped at 12.
 */
export function checkLevelUp(creatureState) {
  const expectedLevel = Math.min(12, Math.floor(creatureState.wins / WINS_PER_LEVEL) + 1)
  return expectedLevel > creatureState.level
}

/**
 * Apply level up — increment level, stats go up by +2 each on recalc.
 * Returns new state with updated level.
 */
export function applyLevelUp(creatureState) {
  const expectedLevel = Math.min(12, Math.floor(creatureState.wins / WINS_PER_LEVEL) + 1)
  return { ...creatureState, level: expectedLevel }
}

/**
 * Check if a new move should be offered at the current level.
 * Returns the move ID if available, or null.
 */
export function getAvailableNewMove(creatureState) {
  const template = CREATURES[creatureState.id]
  if (!template) return null

  const nextMoveIdx = creatureState.movesOffered
  if (nextMoveIdx >= template.movePool.length) return null

  const requiredLevel = MOVE_LEARN_LEVELS[nextMoveIdx]
  if (creatureState.level >= requiredLevel) {
    return template.movePool[nextMoveIdx]
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

/**
 * Check if a new creature should be unlocked based on total battles won.
 * Every 2nd battle won = 1 new creature.
 *
 * @param {number} totalBattlesWon — total across all battles
 * @param {string[]} unlockedIds — currently unlocked creature IDs
 * @returns {string|null} creature ID to unlock, or null
 */
export function checkCreatureUnlock(totalBattlesWon, unlockedIds) {
  // Unlock every 2 wins
  const expectedUnlocks = Math.floor(totalBattlesWon / 2)
  const currentExtra = unlockedIds.length - 10 // Started with 10

  if (currentExtra >= expectedUnlocks) return null
  if (unlockedIds.length >= CREATURE_LIST.length) return null

  // Pick a random locked creature
  const locked = CREATURE_LIST.filter(c => !unlockedIds.includes(c.id))
  if (locked.length === 0) return null

  return locked[Math.floor(Math.random() * locked.length)].id
}

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
    const ofType = CREATURE_LIST.filter(c => c.type === type)
    const pick = ofType[Math.floor(Math.random() * ofType.length)]
    selected.push(pick.id)
    usedIds.add(pick.id)
  }

  // Fill remaining 6 slots randomly from unused creatures
  const remaining = CREATURE_LIST.filter(c => !usedIds.has(c.id))
  const shuffled = [...remaining].sort(() => Math.random() - 0.5)
  for (const creature of shuffled) {
    if (selected.length >= 10) break
    selected.push(creature.id)
  }

  return selected
}
