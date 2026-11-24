// Sprite asset map — maps creature IDs to idle/attack sprite imports
// Uses Vite's import.meta.glob for production-safe bundling

// Eagerly import all sprite PNGs from Character Art directories
const idleModules = import.meta.glob('../Character Art/**/*-idle.png', { eager: true, import: 'default' })
const attackModules = import.meta.glob('../Character Art/**/*-attack.png', { eager: true, import: 'default' })

// Build lookup: creatureId → { idle: resolvedUrl, attack: resolvedUrl }
function buildSpriteMap(idleMods, attackMods) {
  const map = {}

  for (const [path, url] of Object.entries(idleMods)) {
    // path like "../Character Art/fire-type-sprites/emberpaw-idle.png"
    const filename = path.split('/').pop() // "emberpaw-idle.png"
    const id = filename.replace('-idle.png', '')
    if (!map[id]) map[id] = {}
    map[id].idle = url
  }

  for (const [path, url] of Object.entries(attackMods)) {
    const filename = path.split('/').pop()
    const id = filename.replace('-attack.png', '')
    if (!map[id]) map[id] = {}
    map[id].attack = url
  }

  return map
}

export const CREATURE_SPRITES = buildSpriteMap(idleModules, attackModules)

/**
 * Get sprite URLs for a creature. Returns { idle, attack } or null if missing.
 */
export function getCreatureSprites(creatureId) {
  return CREATURE_SPRITES[creatureId] || null
}

/**
 * Get the idle sprite URL for a creature, or null if missing.
 */
export function getIdleSprite(creatureId) {
  return CREATURE_SPRITES[creatureId]?.idle || null
}

/**
 * Get the attack sprite URL for a creature, or null if missing.
 */
export function getAttackSprite(creatureId) {
  return CREATURE_SPRITES[creatureId]?.attack || null
}

/**
 * Art-bank sprites (the extra pictures that are not tied to an official creature).
 * Each entry is { id, name, idle, attack }.
 */
export function getBankSprites() {
  const entries = []
  for (const [path, url] of Object.entries(idleModules)) {
    if (!path.includes('creature-forge-bank-sprites')) continue
    const filename = path.split('/').pop()
    const id = filename.replace('-idle.png', '')
    entries.push({
      id,
      name: id.charAt(0).toUpperCase() + id.slice(1),
      idle: url,
      attack: CREATURE_SPRITES[id]?.attack || null,
    })
  }
  entries.sort((a, b) => a.name.localeCompare(b.name))
  return entries
}

/** Picture id used in battle and menus. Bank art wins over the creature id. */
export function resolveSpriteId(creature) {
  return creature?.spriteId || creature?.id || null
}
