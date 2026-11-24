import assert from 'node:assert/strict'

const memory = new Map()
globalThis.localStorage = {
  getItem: (key) => (memory.has(key) ? memory.get(key) : null),
  setItem: (key, value) => { memory.set(key, String(value)) },
  removeItem: (key) => { memory.delete(key) },
  clear: () => { memory.clear() },
}

const { catchChance, rollCatch, canReachIsland, rollWild, addCaught, hasFerryCreature } = await import('../src/systems/world.js')
const { getDefaultSave, loadProfiles, writeProfiles } = await import('../src/utils/saveManager.js')
const { createCreatureSaveState } = await import('../src/systems/progression.js')
const { ISLANDS } = await import('../src/data/islands.js')

const fresh = getDefaultSave()
assert.equal(canReachIsland(fresh, 0), true)
assert.equal(canReachIsland(fresh, 1), false, 'level 5 water starters cannot sail yet')
assert.equal(hasFerryCreature(fresh), false)

const swimmer = {
  ...fresh,
  creatureProgress: {
    ...fresh.creatureProgress,
    aquafin: { ...fresh.creatureProgress.aquafin, level: 10 },
  },
}
assert.equal(hasFerryCreature(swimmer), true)
assert.equal(canReachIsland(swimmer, 1), true)
assert.equal(canReachIsland(swimmer, 2), false)

const withSkiff = {
  ...fresh,
  campaign: { ...fresh.campaign, completedGyms: ['z1g1'] },
}
assert.equal(canReachIsland(withSkiff, 1), true)
assert.equal(canReachIsland({ ...fresh, campaign: { ...fresh.campaign, completedGyms: ['z1g1', 'z2g1'] } }, 2), true)
assert.equal(canReachIsland(withSkiff, 4), false)
assert.equal(ISLANDS[4].charted, true)

const weak = catchChance({ hpPercent: 0.05, status: 'sleep', itemId: 'sturdy_orb' })
const healthy = catchChance({ hpPercent: 1, status: null, itemId: 'lure_orb' })
assert.ok(weak > healthy)
assert.ok(weak > 0.9)
assert.ok(healthy < 0.3)

let catches = 0
for (let i = 0; i < 200; i++) {
  if (rollCatch(1, Math.random).caught) catches++
}
assert.equal(catches, 200)
assert.equal(rollCatch(0, () => 0.5).caught, false)

const area = ISLANDS[0].wilds[0]
const wild = rollWild(area, () => 0)
assert.ok(wild)
assert.ok(wild.level >= area.min && wild.level <= area.max)

const evolvedWild = rollWild({ types: ['fire'], min: 34, max: 34 }, () => 0)
assert.notEqual(evolvedWild.id, 'emberpaw')

const owned = addCaught(fresh, 'leafyn', 8)
assert.equal(owned.duplicate, true)
const newbie = addCaught(fresh, 'floravine', 9)
assert.equal(newbie.duplicate, false)
assert.ok(newbie.state.caughtIds.includes('floravine'))
assert.ok(newbie.state.seenIds.includes('floravine'))
assert.equal(newbie.state.creatureProgress.floravine.level, 9)

localStorage.clear()
const old = getDefaultSave()
old.version = 3
old.campaign.playerName = 'Sam'
old.unlockedCreatureIds = ['emberpaw', 'solmane']
old.creatureProgress.solmane = createCreatureSaveState('solmane', 40)
delete old.bag.lure_orb
const profiles = {
  version: 1,
  activeSlot: 0,
  slots: [
    { id: 'slot-1', name: 'Sam', color: '#F56565', avatar: 'emberpaw', save: old },
    { id: 'slot-2', name: 'Jamie', color: '#4299E1', avatar: 'aquafin', save: null },
    { id: 'slot-3', name: '', color: '#48BB78', avatar: 'leafyn', save: null },
    { id: 'slot-4', name: '', color: '#ECC94B', avatar: 'voltzap', save: null },
  ],
}
writeProfiles(profiles)
const loaded = loadProfiles()
assert.equal(loaded.slots[0].save.version, 6)
assert.ok(loaded.slots[0].save.caughtIds.includes('solmane'))
assert.ok(loaded.slots[0].save.seenIds.includes('emberpaw'))
assert.ok(loaded.slots[0].save.bag.lure_orb >= 5)
assert.equal(loaded.slots[1].save, null)

console.log('Phase 3 checks passed')
