// Phase 2: evolution, XP, status, abilities, items, and save migration.
import assert from 'node:assert/strict'

const memory = new Map()
globalThis.localStorage = {
  getItem: (key) => (memory.has(key) ? memory.get(key) : null),
  setItem: (key, value) => { memory.set(key, String(value)) },
  removeItem: (key) => { memory.delete(key) },
  clear: () => { memory.clear() },
}

const { CREATURES } = await import('../src/data/creatures.js')
const { formIdForLevel, nextEvolution } = await import('../src/data/evolutions.js')
const {
  addXp, xpFromFoe, xpToNext, levelFromXp, LEVEL_CAP, mapLegacyLevel, levelForNewUnlock, createCreatureSaveState,
} = await import('../src/systems/progression.js')
const { evolveIfReady, replaceCreatureId } = await import('../src/systems/evolution.js')
const { createBattleCreature, executeTurn } = await import('../src/systems/battleEngine.js')
const { calculateDamage } = await import('../src/systems/damage.js')
const { getDefaultSave, loadProfiles, writeProfiles } = await import('../src/utils/saveManager.js')
const { ZONES } = await import('../src/data/campaign.js')

const lines = Object.values(CREATURES).filter(creature => !creature.prevolution)
assert.equal(lines.length, 28)
for (const base of lines) {
  assert.ok(base.ability, base.id)
  const next = nextEvolution(base.id, CREATURES)
  assert.ok(next, `${base.id} should evolve`)
  assert.ok(next.level === 16 || next.level === 18, base.id)
  const finalId = formIdForLevel(base.id, 50)
  assert.notEqual(finalId, base.id)
  assert.ok(CREATURES[finalId].spriteId || CREATURES[finalId].id)
}

assert.equal(formIdForLevel('emberpaw', 15), 'emberpaw')
assert.equal(formIdForLevel('emberpaw', 16), 'emberfang')
assert.equal(formIdForLevel('emberpaw', 34), 'solmane')
assert.equal(formIdForLevel('charrok', 50), 'charforge')
assert.equal(LEVEL_CAP, 50)
assert.equal(levelFromXp(0), 1)
assert.ok(levelFromXp(99999) <= 50)

// A matched fight is about one level, not a grind and not a skip.
const sample = createCreatureSaveState('emberpaw', 10)
const gain = xpFromFoe(10)
const once = addXp(sample, gain)
assert.ok(once.levelsGained === 1 || once.levelsGained === 0)
const twice = addXp(once.state, gain)
assert.ok(twice.state.level >= sample.level + 1)
assert.ok(twice.state.level < sample.level + 4)

const at15 = createCreatureSaveState('emberpaw', 15)
const grew = addXp(at15, xpToNext(15))
assert.equal(grew.state.level, 16)
const evo = evolveIfReady(grew.state)
assert.equal(evo.evolved.toId, 'emberfang')
assert.equal(evo.evolved.toName, 'Emberfang')

// Burn hurts at the end of the turn. Sleep skips the action.
const burner = createBattleCreature({ id: 'blazicor', level: 20, currentMoves: ['inferno', 'strike', 'focus_energy', 'power_surge'] })
const target = createBattleCreature({ id: 'leafyn', level: 20, currentMoves: ['vine_whip', 'scratch', 'speed_surge', 'leaf_blade'] })
target.status = { id: 'burn' }
const before = target.currentHp
const burned = executeTurn(
  { type: 'attack', moveId: 'scratch' },
  [createBattleCreature({ id: 'bouldar', level: 10, currentMoves: ['tackle', 'pebble_toss', 'iron_wall', 'recover'] })],
  0,
  [target],
  0,
  { optimalChance: 0, switchBehavior: 'never', items: [] },
  { player: 0, ai: 0 },
)
assert.ok(burned.events.some(event => event.type === 'statusHurt' && event.data.text.includes('burn')))
assert.ok(target.currentHp < before)

const sleeper = createBattleCreature({ id: 'emberpaw', level: 20, currentMoves: ['flame_nip', 'scratch', 'speed_surge', 'fire_fang'] })
sleeper.status = { id: 'sleep', turns: 2 }
const foe = createBattleCreature({ id: 'bouldar', level: 5, currentMoves: ['tackle', 'pebble_toss', 'iron_wall', 'recover'] })
const slept = executeTurn(
  { type: 'attack', moveId: 'inferno' },
  [sleeper], 0, [foe], 0,
  { optimalChance: 0, switchBehavior: 'never', items: [] },
  { player: 0, ai: 0 },
)
assert.ok(slept.events.some(event => event.type === 'statusBlock'))
assert.equal(foe.currentHp, foe.currentStats.hp)

// Hover makes Ground miss. Ember Heart boosts a low-HP fire move.
const flyer = createBattleCreature({ id: 'quakern', level: 20, currentMoves: ['mud_slap', 'strike', 'focus_energy', 'earth_pound'] })
assert.equal(flyer.ability, 'hover')
const quake = { category: 'physical', type: 'ground', power: 40, accuracy: 100 }
const immune = calculateDamage(
  { type: 'ground', currentStats: { atk: 80, def: 40, spc: 40, hp: 80 }, statStages: {}, ability: null },
  quake,
  flyer,
  () => 0,
)
assert.equal(immune.effectiveness, 0)

const pinch = createBattleCreature({ id: 'emberpaw', level: 20, currentMoves: ['inferno', 'flame_nip', 'scratch', 'fire_fang'] })
pinch.currentHp = 1
const healthy = createBattleCreature({ id: 'emberpaw', level: 20, currentMoves: ['inferno', 'flame_nip', 'scratch', 'fire_fang'] })
const move = { category: 'special', type: 'fire', power: 40, accuracy: 100 }
const low = calculateDamage(pinch, move, foe, () => 0)
const high = calculateDamage(healthy, move, foe, () => 0)
assert.ok(low.damage > high.damage)

// A potion heals and leaves the bag.
const bag = { potion: 1 }
const patient = createBattleCreature(createCreatureSaveState('mossback', 10))
patient.currentHp = 10
const healed = executeTurn(
  { type: 'item', itemId: 'potion', targetIndex: 0, bag },
  [patient], 0,
  [createBattleCreature(createCreatureSaveState('pebblit', 5))], 0,
  { optimalChance: 0, switchBehavior: 'never', items: [] },
  { player: 0, ai: 0 },
)
assert.ok(patient.currentHp > 10)
assert.equal(bag.potion, undefined)
assert.ok(healed.events.some(event => event.type === 'item'))

// An old maxed save becomes a high-level evolved form in slot 1, and slot 2 stays put.
localStorage.clear()
const veteran = getDefaultSave()
veteran.version = 2
veteran.campaign.playerName = 'Sam'
veteran.creatureProgress.emberpaw.level = 12
veteran.creatureProgress.emberpaw.wins = 22
const other = getDefaultSave()
other.version = 2
other.totalBattlesWon = 3
const profiles = {
  version: 1,
  activeSlot: 0,
  slots: [
    { id: 'slot-1', name: 'Sam', color: '#F56565', avatar: 'emberpaw', save: veteran },
    { id: 'slot-2', name: 'Jamie', color: '#4299E1', avatar: 'aquafin', save: other },
    { id: 'slot-3', name: '', color: '#48BB78', avatar: 'leafyn', save: null },
    { id: 'slot-4', name: '', color: '#ECC94B', avatar: 'voltzap', save: null },
  ],
}
writeProfiles(profiles)
const loaded = loadProfiles()
assert.equal(loaded.slots[0].save.version, 6)
const samEmber = Object.values(loaded.slots[0].save.creatureProgress).find(progress => progress.level === mapLegacyLevel(12) || CREATURES[progress.id]?.baseId === 'emberpaw')
const emberProgress = loaded.slots[0].save.creatureProgress.solmane || loaded.slots[0].save.creatureProgress.emberfang || loaded.slots[0].save.creatureProgress.emberpaw
assert.ok(emberProgress)
assert.equal(emberProgress.level, 42)
assert.equal(emberProgress.id || 'solmane', 'solmane')
assert.equal(loaded.slots[0].save.creatureProgress.solmane.id, 'solmane')
assert.ok(loaded.slots[0].save.growthNotes.some(note => note.includes('Solmane')))
assert.equal(loaded.slots[1].save.totalBattlesWon, 3)
assert.equal(loaded.slots[1].name, 'Jamie')
assert.equal(mapLegacyLevel(1), 5)
assert.equal(levelForNewUnlock({ badges: [] }), 5)
assert.equal(levelForNewUnlock({ badges: new Array(8) }), 21)

// Gyms sit on the new climb, not the old 1–12 cap.
const first = ZONES[0].gyms[0].trainers[0].creatures[0].level
const last = ZONES[3].gyms[3].leader.creatures.at(-1).level
assert.ok(first >= 6 && first <= 12, first)
assert.ok(last >= 36 && last <= 45, last)

console.log('Phase 2 checks passed', { samEmber: samEmber?.id, first, last })
