// Save/load system — localStorage persistence with JSON file export/import
import { CREATURES } from '../data/creatures.js'
import { MOVES } from '../data/moves.js'
import { emptyBag } from '../data/items.js'
import { mapLegacyLevel, xpToReachLevel, movesKnownAtLevel } from '../systems/progression.js'
import { evolveIfReady, replaceCreatureId } from '../systems/evolution.js'
import { defaultAudioSettings } from '../audio/sound.js'
import { GREENRIDGE } from '../data/greenridgeMap.js'

const LEGACY_SAVE_KEY = 'battle-arena-save'
const PROFILE_KEY = 'battle-arena-profiles'
const CURRENT_VERSION = 7
const PROFILE_VERSION = 1

export const SLOT_COUNT = 4

export const SLOT_COLORS = [
  { id: 'ember', hex: '#F56565', label: 'Ember' },
  { id: 'tide', hex: '#4299E1', label: 'Tide' },
  { id: 'leaf', hex: '#48BB78', label: 'Leaf' },
  { id: 'spark', hex: '#ECC94B', label: 'Spark' },
  { id: 'stone', hex: '#A8895A', label: 'Stone' },
  { id: 'venom', hex: '#9F7AEA', label: 'Venom' },
  { id: 'sunset', hex: '#ED8936', label: 'Sunset' },
  { id: 'rose', hex: '#ED64A6', label: 'Rose' },
]

export const SLOT_AVATARS = [
  'emberpaw', 'aquafin', 'leafyn', 'voltzap',
  'bouldar', 'dustail', 'venomaw', 'charrok',
]

/**
 * Create a fresh save state for a new game.
 * A new player starts in town with no creatures until they choose three.
 */
export function getDefaultSave() {
  return {
    version: CURRENT_VERSION,
    unlockedCreatureIds: [],
    creatureProgress: {},
    lastTeam: [],
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
    bag: { lure_orb: 2 },
    coins: 0,
    caughtIds: [],
    seenIds: [],
    startersChosen: false,
    vitals: {},
    field: { beaten: [], picked: [], quest: 'ask' },
    overworld: {
      map: 'greenridge',
      x: GREENRIDGE.spawn.x,
      y: GREENRIDGE.spawn.y,
      facing: GREENRIDGE.spawn.facing,
      calm: false,
      blackout: false,
    },
    currentIsland: 'greenridge',
    story: { seen: [], defeated: [], elitesBeaten: [], champion: false, rematch: false },
    settings: defaultAudioSettings(),
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

  // Core fields required in all versions
  if (!Array.isArray(data.unlockedCreatureIds)) {
    errors.push('Missing unlockedCreatureIds array')
  }

  if (!data.creatureProgress || typeof data.creatureProgress !== 'object') {
    errors.push('Missing creatureProgress object')
  } else {
    for (const [id, progress] of Object.entries(data.creatureProgress)) {
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

  // v2 campaign fields — only warn, migration will fill these in
  if (data.version >= 2) {
    if (!data.campaign || typeof data.campaign !== 'object') {
      console.warn('Save missing campaign object — will be filled by migration')
    }
    if (!data.rewards || typeof data.rewards !== 'object') {
      console.warn('Save missing rewards object — will be filled by migration')
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

  // v2 → v3: higher level cap, XP, evolution, bag
  if (!migrated.version || migrated.version < 3) {
    const notes = []
    let state = migrated
    const ids = Object.keys(state.creatureProgress || {})
    for (const id of ids) {
      const progress = state.creatureProgress?.[id]
      if (!progress) continue
      const template = CREATURES[progress.id || id] || CREATURES[id]
      if (!template || template.isCustom) continue
      const level = mapLegacyLevel(progress.level || 1)
      const known = movesKnownAtLevel(template, level)
      const learned = [...new Set([...(progress.learnedMoves || []), ...known])]
      const kept = (progress.currentMoves || []).filter(moveId => learned.includes(moveId))
      const nextProgress = {
        ...progress,
        id,
        level,
        xp: xpToReachLevel(level),
        heldItem: progress.heldItem || null,
        learnedMoves: learned,
        currentMoves: (kept.length ? kept : known.slice(0, 2)).slice(0, 4),
        movesOffered: learned.length,
      }
      state = {
        ...state,
        creatureProgress: { ...state.creatureProgress, [id]: nextProgress },
      }
      const evolved = evolveIfReady(nextProgress)
      if (evolved.evolved) {
        notes.push(`${evolved.evolved.fromName} grew into ${evolved.evolved.toName}`)
        state = replaceCreatureId(state, id, evolved.evolved.toId, evolved.progress)
      }
    }
    if (!state.bag) state.bag = emptyBag()
    if (notes.length) state.growthNotes = notes
    migrated = state
  }

  // v3 → v4: the roster you already own is caught, and you can sail
  if (!migrated.version || migrated.version < 4) {
    const unlocked = migrated.unlockedCreatureIds || []
    const seen = new Set(unlocked)
    for (const id of unlocked) {
      let cursor = CREATURES[id]?.prevolution
      const guard = new Set()
      while (cursor && !guard.has(cursor)) {
        guard.add(cursor)
        seen.add(cursor)
        cursor = CREATURES[cursor]?.prevolution
      }
    }
    migrated.caughtIds = [...unlocked]
    migrated.seenIds = [...seen]
    migrated.coins = typeof migrated.coins === 'number' ? migrated.coins : (migrated.campaign?.badges?.length || 0) * 40
    migrated.currentIsland = migrated.currentIsland || 'greenridge'
    if (!migrated.bag) migrated.bag = emptyBag()
    else if (!migrated.bag.lure_orb) migrated.bag = { ...migrated.bag, lure_orb: 5 }
  }

  if (!migrated.version || migrated.version < 5) {
    const story = migrated.story || {}
    migrated.story = {
      seen: story.seen || [],
      defeated: story.defeated || [],
      elitesBeaten: story.elitesBeaten || [],
      champion: !!story.champion,
      rematch: !!story.rematch,
    }
  }

  if (!migrated.version || migrated.version < 6) {
    if (!migrated.settings) migrated.settings = defaultAudioSettings()
  }

  if (!migrated.version || migrated.version < 7) {
    const owned = migrated.unlockedCreatureIds || []
    if (typeof migrated.startersChosen !== 'boolean') migrated.startersChosen = owned.length > 0
    if (!migrated.vitals) migrated.vitals = {}
    if (!migrated.field) migrated.field = { beaten: [], picked: [], quest: 'ask' }
    if (!migrated.overworld) {
      migrated.overworld = {
        map: 'greenridge',
        x: GREENRIDGE.spawn.x,
        y: GREENRIDGE.spawn.y,
        facing: 'down',
        calm: true,
        blackout: false,
      }
    }
  }

  // Ensure all expected fields exist with defaults
  if (!migrated.customCreatures) migrated.customCreatures = []
  if (!migrated.customTypes) migrated.customTypes = []
  if (typeof migrated.totalBattlesWon !== 'number') migrated.totalBattlesWon = 0
  if (!migrated.bag) migrated.bag = emptyBag()

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
 * A blank profile file: four named slots, none of them holding a game yet.
 */
export function createEmptyProfiles() {
  return {
    version: PROFILE_VERSION,
    activeSlot: null,
    slots: Array.from({ length: SLOT_COUNT }, (_, index) => ({
      id: `slot-${index + 1}`,
      name: '',
      color: SLOT_COLORS[index % SLOT_COLORS.length].hex,
      avatar: SLOT_AVATARS[index % SLOT_AVATARS.length],
      save: null,
    })),
  }
}

function prepareSave(data) {
  if (!data || typeof data !== 'object') return null
  let save = data
  if (save.version !== CURRENT_VERSION) {
    save = migrateSave(save)
  }
  const { valid, errors } = validateSave(save)
  if (!valid) {
    console.warn('Save data validation warnings:', errors)
  }
  return save
}

/**
 * Fill missing slot fields and migrate any old game save sitting inside a slot.
 */
export function normalizeProfiles(data) {
  const base = createEmptyProfiles()
  const incomingSlots = Array.isArray(data?.slots) ? data.slots : []
  const slots = base.slots.map((empty, index) => {
    const incoming = incomingSlots[index] || {}
    return {
      id: typeof incoming.id === 'string' ? incoming.id : empty.id,
      name: typeof incoming.name === 'string' ? incoming.name : '',
      color: typeof incoming.color === 'string' ? incoming.color : empty.color,
      avatar: typeof incoming.avatar === 'string' ? incoming.avatar : empty.avatar,
      save: incoming.save ? prepareSave(incoming.save) : null,
    }
  })
  const activeSlot = Number.isInteger(data?.activeSlot) && data.activeSlot >= 0 && data.activeSlot < SLOT_COUNT
    ? data.activeSlot
    : null
  return { version: PROFILE_VERSION, activeSlot, slots }
}

/**
 * Copy a single old save into slot 1. Other slots stay empty.
 * Returns a new profiles object. Does not touch storage.
 */
export function profilesFromLegacySave(legacySave) {
  const profiles = createEmptyProfiles()
  const save = prepareSave(legacySave)
  if (!save) return profiles
  const name = save.campaign?.playerName?.trim() || 'Player 1'
  profiles.slots[0] = { ...profiles.slots[0], name, save }
  return profiles
}

export function writeProfiles(profiles) {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profiles))
    return true
  } catch (err) {
    console.error('Failed to save profiles:', err)
    return false
  }
}

function readLegacySave() {
  try {
    const json = localStorage.getItem(LEGACY_SAVE_KEY)
    if (!json) return null
    return JSON.parse(json)
  } catch (err) {
    console.error('Failed to read old save:', err)
    return null
  }
}

/**
 * Load the family profile file.
 * If the device still has the old single save and no profile file, that save
 * is copied into slot 1 and the old key is removed so it cannot be lost or
 * applied twice.
 */
export function loadProfiles() {
  try {
    const raw = localStorage.getItem(PROFILE_KEY)
    if (raw) {
      const profiles = normalizeProfiles(JSON.parse(raw))
      writeProfiles(profiles)
      if (localStorage.getItem(LEGACY_SAVE_KEY)) {
        localStorage.removeItem(LEGACY_SAVE_KEY)
      }
      return profiles
    }
  } catch (err) {
    console.error('Failed to load profiles:', err)
  }

  const legacy = readLegacySave()
  const profiles = legacy ? profilesFromLegacySave(legacy) : createEmptyProfiles()
  if (legacy && writeProfiles(profiles)) {
    try { localStorage.removeItem(LEGACY_SAVE_KEY) } catch { /* the copy is already in the profile file */ }
  }
  return profiles
}

/**
 * Save one slot's game. Pass the whole profiles object from React when you
 * already have it; otherwise this reads, updates one slot, and writes.
 */
export function saveGame(gameState, slotIndex = 0) {
  try {
    const profiles = loadProfiles()
    if (!profiles.slots[slotIndex]) return false
    profiles.slots[slotIndex] = { ...profiles.slots[slotIndex], save: gameState }
    profiles.activeSlot = slotIndex
    return writeProfiles(profiles)
  } catch (err) {
    console.error('Failed to save game:', err)
    return false
  }
}

/**
 * Load one slot's game, or null if that slot is empty.
 */
export function loadGame(slotIndex = 0) {
  const profiles = loadProfiles()
  return profiles.slots[slotIndex]?.save || null
}

/**
 * Clear one player's game, but keep their name, color, and avatar.
 * With no index, clears every slot (used by older callers).
 */
export function resetGame(slotIndex) {
  try {
    if (slotIndex == null) {
      localStorage.removeItem(PROFILE_KEY)
      localStorage.removeItem(LEGACY_SAVE_KEY)
      return true
    }
    const profiles = loadProfiles()
    if (!profiles.slots[slotIndex]) return false
    profiles.slots[slotIndex] = { ...profiles.slots[slotIndex], save: null }
    return writeProfiles(profiles)
  } catch (err) {
    console.error('Failed to reset game:', err)
    return false
  }
}

function slugify(label) {
  const slug = String(label || 'save').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  return slug || 'save'
}

/**
 * Export one player's save as a downloadable JSON file.
 * The file is the game itself (not the whole family profile), so an older
 * import still works.
 */
export function exportSave(gameState, label) {
  if (!gameState) {
    console.warn('No save data to export')
    return false
  }

  const date = new Date().toISOString().split('T')[0]
  const filename = `battle-arena-${slugify(label)}-${date}.json`
  const json = JSON.stringify(gameState, null, 2)

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

        // Migrate first, then validate. The caller stores it in the active slot.
        const migrated = prepareSave(data)
        const { valid, errors } = validateSave(migrated)

        if (!migrated || !valid) {
          resolve({ success: false, state: null, errors: errors.length ? errors : ['Save file could not be read'] })
          return
        }

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
