// Save/load system — localStorage persistence with JSON file export/import
import { CREATURES } from '../data/creatures.js'
import { MOVES } from '../data/moves.js'

const SAVE_KEY = 'battle-arena-save'
const CURRENT_VERSION = 2

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
    totalBattlesWon: 0,
    campaign: {
      playerName: '',
      rivalName: '',
      completedGyms: [],
      completedTrainers: {},
      completedRivals: [],
      badges: [],
      rivalDefeats: [],
      playerTypeCounts: {},
    },
    rewards: {
      teamPresets: false,
      fourthTeamSlot: false,
      moveTutor: false,
      creatureForge: false,
      championTitle: false,
    },
    teamSize: 3,
    teamPresets: [],
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
  }

  if (!data.creatureProgress || typeof data.creatureProgress !== 'object') {
    errors.push('Missing creatureProgress object')
  } else {
    for (const [id, progress] of Object.entries(data.creatureProgress)) {
      // Allow custom creature IDs (start with 'custom')
      if (!CREATURES[id] && !id.startsWith('custom')) {
        // Soft warning, don't fail
      }
      if (typeof progress.level !== 'number') {
        errors.push(`${id}: missing or invalid level`)
      }
      if (!Array.isArray(progress.currentMoves)) {
        errors.push(`${id}: missing currentMoves array`)
      }
    }
  }

  if (!Array.isArray(data.lastTeam)) {
    errors.push('Missing lastTeam array')
  }

  if (typeof data.totalBattlesWon !== 'number') {
    errors.push('Missing or invalid totalBattlesWon')
  }

  // Campaign structure (v2+)
  if (data.version >= 2) {
    if (!data.campaign || typeof data.campaign !== 'object') {
      errors.push('Missing campaign object')
    }
    if (!data.rewards || typeof data.rewards !== 'object') {
      errors.push('Missing rewards object')
    }
    if (typeof data.teamSize !== 'number') {
      errors.push('Missing or invalid teamSize')
    }
  }

  return { valid: errors.length === 0, errors }
}

/**
 * Migrate save data from older versions to current.
 */
function migrateSave(data) {
  let migrated = { ...data }

  // v1 → v2: Replace difficulty system with campaign
  if (!migrated.version || migrated.version < 2) {
    // Preserve creature forge unlock if player had cleared hard mode
    const hadForge = migrated.difficulty?.hardCleared === true

    migrated.campaign = {
      playerName: '',
      rivalName: '',
      completedGyms: [],
      completedTrainers: {},
      completedRivals: [],
      badges: [],
      rivalDefeats: [],
      playerTypeCounts: {},
    }

    migrated.rewards = {
      teamPresets: false,
      fourthTeamSlot: false,
      moveTutor: false,
      creatureForge: hadForge,
      championTitle: hadForge,
    }

    migrated.teamSize = 3
    migrated.teamPresets = []

    // Remove old fields
    delete migrated.battlesWon
    delete migrated.difficulty

    migrated.version = 2
  }

  // Ensure all expected fields exist with defaults
  if (!migrated.customCreatures) migrated.customCreatures = []
  if (!migrated.customTypes) migrated.customTypes = []
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

        // Migrate first, then validate
        const migrated = data.version !== CURRENT_VERSION ? migrateSave(data) : data
        const { valid, errors } = validateSave(migrated)

        if (!valid) {
          resolve({ success: false, state: null, errors })
          return
        }

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
