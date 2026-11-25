import { CREATURES } from '../data/creatures.js'
import { formIdForLevel } from '../data/evolutions.js'

export function evolveIfReady(progress) {
  const current = CREATURES[progress?.id]
  if (!current || current.isCustom) return { progress, evolved: null }
  const baseId = current.baseId || progress.id
  const nextId = formIdForLevel(baseId, progress.level || 1)
  if (!nextId || nextId === progress.id || !CREATURES[nextId]) return { progress, evolved: null }
  return {
    progress: { ...progress, id: nextId },
    evolved: {
      fromId: progress.id,
      toId: nextId,
      fromName: current.name,
      toName: CREATURES[nextId].name,
      fromSprite: current.spriteId || progress.id,
      toSprite: CREATURES[nextId].spriteId || nextId,
      type: current.type,
    },
  }
}

export function replaceCreatureId(gameState, fromId, toId, progress) {
  const creatureProgress = { ...(gameState.creatureProgress || {}) }
  delete creatureProgress[fromId]
  creatureProgress[toId] = { ...progress, id: toId }
  const swap = (id) => (id === fromId ? toId : id)
  const vitals = { ...(gameState.vitals || {}) }
  if (vitals[fromId]) {
    vitals[toId] = vitals[fromId]
    delete vitals[fromId]
  }
  return {
    ...gameState,
    vitals,
    creatureProgress,
    unlockedCreatureIds: (gameState.unlockedCreatureIds || []).map(swap),
    lastTeam: (gameState.lastTeam || []).map(swap),
    teamPresets: (gameState.teamPresets || []).map(preset => ({
      ...preset,
      creatureIds: (preset.creatureIds || []).map(swap),
    })),
  }
}
