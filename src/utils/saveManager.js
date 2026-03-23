// Save/load system — localStorage persistence with JSON file export/import
import { CREATURES } from '../data/creatures.js'
import { MOVES } from '../data/moves.js'

const SAVE_KEY = 'battle-arena-save'
const CURRENT_VERSION = 1

const STARTER_CREATURE_IDS = [
  'emberpaw', 'charrok', 'aquafin', 'shellguard', 'leafyn',
  'thornox', 'voltzap', 'bouldar', 'dustail', 'venomaw',
]

/**
 * Create a fresh save state for a new game.
 */
export function getDefaultSave() {
  const creatureProgress = {}
  for (const id of STARTER_CREATURE_IDS) {
    const template = CREATURES[id]
    if (!template) continue
    creatureProgress[id] = {
      level: 1,
      wins: 0,
      currentMoves: [template.movePool[0], template.movePool[1]],
      learnedMoves: [template.movePool[0], template.movePool[1]],
      movesOffered: 2,
    }
  }

  return {
    version: CURRENT_VERSION,
    unlockedCreatureIds: [...STARTER_CREATURE_IDS],
    creatureProgress,
    lastTeam: [STARTER_CREATURE_IDS[0], STARTER_CREATURE_IDS[1], STARTER_CREATURE_IDS[2]],
    battlesWon: { easy: 0, medium: 0, hard: 0 },
    totalBattlesWon: 0,
    difficulty: { easyCleared: false, mediumCleared: false, hardCleared: false },
    customCreatures: [],
    customTypes: [],
  }
}

/**
 * Validate a save data object. Checks structure, creature IDs, and move IDs.
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateSave(data) {
  const errors = []

  if (!data || typeof data !== 'object') {
    return { valid: false, errors: ['Save data is not an object'] }
  }

  if (typeof data.version !== 'number') {
    errors.push('Missing or invalid version field')
  }

  if (!Array.isArray(data.unlockedCreatureIds)) {
    errors.push('Missing unlockedCreatureIds array')
  } else {
    for (const id of data.unlockedCreatureIds) {
      if (!CREATURES[id]) {
        errors.push(`Unknown creature ID in unlockedCreatureIds: "${id}"`)
      }
    }
  }

  if (!data.creatureProgress || typeof data.creatureProgress !== 'object') {
    errors.push('Missing creatureProgress object')
  } else {
    for (const [id, progress] of Object.entries(data.creatureProgress)) {
      if (!CREATURES[id]) {
        errors.push(`Unknown creature ID in creatureProgress: "${id}"`)
        continue
      }
      if (typeof progress.level !== 'number') {
        errors.push(`${id}: missing or invalid level`)
      }
      if (typeof progress.wins !== 'number') {
        errors.push(`${id}: missing or invalid wins`)
      }
      if (!Array.isArray(progress.currentMoves)) {
        errors.push(`${id}: missing currentMoves array`)
      } else {
        for (const moveId of progress.currentMoves) {
          if (!MOVES[moveId]) {
            errors.push(`${id}: unknown move ID "${moveId}"`)
          }
        }
      }
      if (!Array.isArray(progress.learnedMoves)) {
        errors.push(`${id}: missing learnedMoves array`)
      }
    }
  }

  if (!Array.isArray(data.lastTeam)) {
    errors.push('Missing lastTeam array')
  }

  if (!data.battlesWon || typeof data.battlesWon !== 'object') {
    errors.push('Missing battlesWon object')
  }

  if (typeof data.totalBattlesWon !== 'number') {
    errors.push('Missing or invalid totalBattlesWon')
  }

  if (!data.difficulty || typeof data.difficulty !== 'object') {
    errors.push('Missing difficulty object')
  }

  return { valid: errors.length === 0, errors }
}

/**
 * Migrate save data from older versions to current.
 */
function migrateSave(data) {
  let migrated = { ...data }

  // Future version migrations go here:
  // if (migrated.version < 2) { ... migrated.version = 2 }

  // Ensure all expected fields exist with defaults
  if (!migrated.customCreatures) migrated.customCreatures = []
  if (!migrated.customTypes) migrated.customTypes = []
  if (!migrated.battlesWon) migrated.battlesWon = { easy: 0, medium: 0, hard: 0 }
  if (!migrated.difficulty) migrated.difficulty = { easyCleared: false, mediumCleared: false, hardCleared: false }
  if (typeof migrated.totalBattlesWon !== 'number') migrated.totalBattlesWon = 0

  // Ensure all unlocked creatures have progress entries
  if (migrated.unlockedCreatureIds && migrated.creatureProgress) {
    for (const id of migrated.unlockedCreatureIds) {
      if (!migrated.creatureProgress[id] && CREATURES[id]) {
        const template = CREATURES[id]
        migrated.creatureProgress[id] = {
          level: 1,
          wins: 0,
          currentMoves: [template.movePool[0], template.movePool[1]],
          learnedMoves: [template.movePool[0], template.movePool[1]],
          movesOffered: 2,
        }
      }
    }
  }

  migrated.version = CURRENT_VERSION
  return migrated
}

/**
 * Save game state to localStorage.
 */
export function saveGame(gameState) {
  try {
    const json = JSON.stringify(gameState)
    localStorage.setItem(SAVE_KEY, json)
    return true
  } catch (err) {
    console.error('Failed to save game:', err)
    return false
  }
}

/**
 * Load game state from localStorage. Returns null if no save exists.
 * Applies version migration if needed.
 */
export function loadGame() {
  try {
    const json = localStorage.getItem(SAVE_KEY)
    if (!json) return null

    let data = JSON.parse(json)

    // Migrate if needed
    if (data.version !== CURRENT_VERSION) {
      data = migrateSave(data)
      saveGame(data) // Persist the migrated version
    }

    const { valid, errors } = validateSave(data)
    if (!valid) {
      console.warn('Save data validation warnings:', errors)
    }

    return data
  } catch (err) {
    console.error('Failed to load game:', err)
    return null
  }
}

/**
 * Clear save data from localStorage.
 */
export function resetGame() {
  try {
    localStorage.removeItem(SAVE_KEY)
    return true
  } catch (err) {
    console.error('Failed to reset game:', err)
    return false
  }
}

/**
 * Export save as a downloadable JSON file.
 * Filename: battle-arena-save-YYYY-MM-DD.json
 */
export function exportSave() {
  const json = localStorage.getItem(SAVE_KEY)
  if (!json) {
    console.warn('No save data to export')
    return false
  }

  const date = new Date().toISOString().split('T')[0]
  const filename = `battle-arena-save-${date}.json`

  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)

  return true
}

/**
 * Import save from a File object. Validates before returning.
 * @param {File} file — File from <input type="file"> or drag-and-drop
 * @returns {Promise<{ success: boolean, state: object|null, errors: string[] }>}
 */
export function importSave(file) {
  return new Promise((resolve) => {
    const reader = new FileReader()

    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result)
        const { valid, errors } = validateSave(data)

        if (!valid) {
          resolve({ success: false, state: null, errors })
          return
        }

        // Migrate if needed
        const migrated = data.version !== CURRENT_VERSION ? migrateSave(data) : data

        // Save to localStorage
        saveGame(migrated)

        resolve({ success: true, state: migrated, errors: [] })
      } catch (err) {
        resolve({ success: false, state: null, errors: [`Failed to parse file: ${err.message}`] })
      }
    }

    reader.onerror = () => {
      resolve({ success: false, state: null, errors: ['Failed to read file'] })
    }

    reader.readAsText(file)
  })
}
