// Merge custom creatures and types into game data for use in systems
import { CREATURES, CREATURE_LIST } from '../data/creatures.js'
import { TYPE_CHART, TYPE_COLORS, TYPES } from '../data/types.js'

/**
 * Get all creatures including custom ones from save state.
 */
export function getAllCreatures(gameState) {
  const all = { ...CREATURES }
  for (const custom of (gameState?.customCreatures || [])) {
    all[custom.id] = custom
  }
  return all
}

/**
 * Get creature list including customs.
 */
export function getAllCreatureList(gameState) {
  return [...CREATURE_LIST, ...(gameState?.customCreatures || [])]
}

/**
 * Get the full type chart including custom types.
 */
export function getFullTypeChart(gameState) {
  const chart = {}
  // Copy base chart
  for (const [atk, defs] of Object.entries(TYPE_CHART)) {
    chart[atk] = { ...defs }
  }

  // Add custom types
  for (const customType of (gameState?.customTypes || [])) {
    // This custom type attacking others
    chart[customType.id] = { ...customType.attackVs }
    // Also set how this type attacks normal
    chart[customType.id].normal = chart[customType.id].normal ?? 1

    // Others attacking this custom type — update existing rows
    for (const [existingType, effectiveness] of Object.entries(customType.defenseVs)) {
      if (chart[existingType]) {
        chart[existingType][customType.id] = effectiveness
      }
    }
    // Normal vs custom type
    if (chart.normal) {
      chart.normal[customType.id] = customType.defenseVs?.normal ?? 1
    }

    // Custom type vs custom type (self) — default neutral
    chart[customType.id][customType.id] = customType.attackVs?.[customType.id] ?? 1
  }

  return chart
}

/**
 * Get all type colors including custom types.
 */
export function getFullTypeColors(gameState) {
  const colors = { ...TYPE_COLORS }
  for (const customType of (gameState?.customTypes || [])) {
    if (customType.colors) {
      colors[customType.id] = customType.colors
    }
  }
  return colors
}

/**
 * Get all type IDs including custom ones.
 */
export function getAllTypes(gameState) {
  const custom = (gameState?.customTypes || []).map(t => t.id)
  return [...TYPES, ...custom]
}
