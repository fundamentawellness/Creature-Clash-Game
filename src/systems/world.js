// Sailing, wild encounters, and catching. Pure functions.
import { CREATURES, CREATURE_LIST } from '../data/creatures.js'
import { ISLANDS, BOAT_GYMS } from '../data/islands.js'
import { formIdForLevel } from '../data/evolutions.js'
import { createCreatureSaveState } from './progression.js'

const FERRY_LEVEL = 10

export function boatCount(campaign) {
  const done = campaign?.completedGyms || []
  return BOAT_GYMS.filter(id => done.includes(id)).length
}

export function hasFerryCreature(gameState) {
  const progress = gameState?.creatureProgress || {}
  return Object.entries(progress).some(([id, entry]) => {
    const creature = CREATURES[id]
    return creature?.type === 'water' && (entry?.level || 1) >= FERRY_LEVEL
  })
}

/** How many islands past home you can reach. */
export function passageCount(gameState) {
  return boatCount(gameState?.campaign) + (hasFerryCreature(gameState) ? 1 : 0)
}

export function canReachIsland(gameState, islandIndex) {
  const island = ISLANDS[islandIndex]
  if (!island || !island.charted) return false
  if (islandIndex <= 0) return true
  return islandIndex <= passageCount(gameState)
}

export function travelHint(gameState, islandIndex) {
  const island = ISLANDS[islandIndex]
  if (!island?.charted) return 'Still uncharted.'
  if (canReachIsland(gameState, islandIndex)) return 'Ready to sail.'
  const need = islandIndex
  const have = passageCount(gameState)
  if (have + 1 === need && !hasFerryCreature(gameState)) {
    return 'Beat the first gym for a skiff, or raise a water creature to level 10.'
  }
  return 'Sail farther by clearing the first gym on each island you can reach.'
}

export function rollWild(area, rng = Math.random) {
  const bases = CREATURE_LIST.filter(creature => !creature.prevolution && !creature.isCustom && area.types.includes(creature.type))
  const base = bases[Math.floor(rng() * bases.length)]
  if (!base) return null
  const span = Math.max(0, area.max - area.min)
  const level = area.min + Math.floor(rng() * (span + 1))
  const id = formIdForLevel(base.id, level)
  return { id, level, name: CREATURES[id]?.name || base.name }
}

/**
 * Odds a throw succeeds. Low HP and sleep or freeze help. Sturdy Orb is the better throw.
 * Returns a number from 0.04 to 0.95.
 */
export function catchChance({ hpPercent, status, itemId }) {
  const statusBonus = { sleep: 1.9, freeze: 1.9, paralysis: 1.45, poison: 1.4, burn: 1.35 }[status] || 1
  const itemBonus = itemId === 'sturdy_orb' ? 1.65 : 1
  const hp = Math.min(1, Math.max(0, hpPercent))
  const chance = (0.22 + 0.58 * (1 - hp)) * statusBonus * itemBonus
  return Math.max(0.04, Math.min(0.95, chance))
}

export function rollCatch(chance, rng = Math.random) {
  const caught = rng() < chance
  const shakes = caught ? 3 : Math.floor(rng() * 3)
  return { caught, shakes }
}

export function markSeen(gameState, ids) {
  const seen = new Set(gameState?.seenIds || [])
  for (const id of ids || []) {
    let cursor = id
    const guard = new Set()
    while (cursor && CREATURES[cursor] && !guard.has(cursor)) {
      guard.add(cursor)
      seen.add(cursor)
      cursor = CREATURES[cursor].prevolution
    }
  }
  return { ...gameState, seenIds: [...seen] }
}

export function addCaught(gameState, id, level) {
  if (!CREATURES[id]) return { state: gameState, duplicate: false }
  const caught = new Set(gameState.caughtIds || gameState.unlockedCreatureIds || [])
  if (caught.has(id) || gameState.creatureProgress?.[id]) {
    return {
      state: { ...gameState, coins: (gameState.coins || 0) + 25 },
      duplicate: true,
    }
  }
  caught.add(id)
  const unlocked = new Set(gameState.unlockedCreatureIds || [])
  unlocked.add(id)
  const progress = createCreatureSaveState(id, level)
  const next = markSeen({
    ...gameState,
    caughtIds: [...caught],
    unlockedCreatureIds: [...unlocked],
    creatureProgress: { ...(gameState.creatureProgress || {}), [id]: progress },
  }, [id])
  return { state: next, duplicate: false }
}

export function coinsForWin(battleInfo, caught) {
  if (!battleInfo) return 0
  if (battleInfo.type === 'wild') return caught ? 8 : 15
  if (battleInfo.type === 'leader') return 80
  if (battleInfo.type === 'rival') return 120
  if (battleInfo.type === 'trainer') return 30
  if (battleInfo.type === 'crew') return 40
  if (battleInfo.type === 'elite') return 100
  if (battleInfo.type === 'champion') return battleInfo.rematch ? 40 : 200
  return 0
}

export function buyItem(gameState, itemId, price) {
  if ((gameState.coins || 0) < price) return gameState
  const bag = { ...(gameState.bag || {}) }
  bag[itemId] = (bag[itemId] || 0) + 1
  return { ...gameState, coins: gameState.coins - price, bag }
}
