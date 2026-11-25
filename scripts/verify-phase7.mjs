import assert from 'node:assert/strict'

const memory = new Map()
globalThis.localStorage = {
  getItem: (key) => (memory.has(key) ? memory.get(key) : null),
  setItem: (key, value) => { memory.set(key, String(value)) },
  removeItem: (key) => { memory.delete(key) },
  clear: () => { memory.clear() },
}

const { getDefaultSave, loadProfiles, writeProfiles } = await import('../src/utils/saveManager.js')
const { createBattleCreature } = await import('../src/systems/battleEngine.js')
const { CREATURES } = await import('../src/data/creatures.js')
const {
  grantStarters, rollFromTable, rememberParty, applyMedicine, livingCount, wakeAtClinic, WILD_TABLES,
} = await import('../src/systems/field.js')
const { STARTER_IDS, validStarterPick } = await import('../src/data/starters.js')
const { reachableTiles, GREENRIDGE, trainerSees } = await import('../src/data/greenridgeMap.js')

const fresh = getDefaultSave()
assert.equal(fresh.version, 7)
assert.equal(fresh.startersChosen, false)
assert.deepEqual(fresh.lastTeam, [])
assert.equal(fresh.unlockedCreatureIds.length, 0)
assert.equal(typeof fresh.overworld.x, 'number')

assert.equal(validStarterPick(STARTER_IDS.slice(0, 3)), true)
assert.equal(validStarterPick(['emberpaw', 'emberpaw', 'aquafin']), false)
const picked = grantStarters(fresh, ['emberpaw', 'aquafin', 'leafyn'])
assert.equal(picked.startersChosen, true)
assert.deepEqual(picked.lastTeam, ['emberpaw', 'aquafin', 'leafyn'])
assert.equal(grantStarters(picked, ['voltzap', 'pebblit', 'dustail']), picked)
assert.ok((picked.bag.potion || 0) >= 2)

for (const [zoneId, zone] of Object.entries(WILD_TABLES)) {
  assert.equal(zone.table.filter(entry => entry.rare).length, 1, zoneId)
  const rolls = new Set()
  for (let i = 0; i < 40; i++) {
    const roll = rollFromTable(zoneId, () => 0.01)
    assert.ok(roll)
    rolls.add(roll.id)
  }
  assert.ok(rolls.size >= 1)
}

const hurt = createBattleCreature({ id: 'emberpaw', level: 5, currentMoves: CREATURES.emberpaw.movePool.slice(0, 2), currentHp: 11, status: 'burn' }, CREATURES)
assert.equal(hurt.currentHp, 11)
assert.equal(hurt.status.id, 'burn')
assert.equal(hurt.fainted, false)
const full = createBattleCreature({ id: 'emberpaw', level: 5, currentMoves: CREATURES.emberpaw.movePool.slice(0, 2) }, CREATURES)
assert.equal(full.currentHp, full.currentStats.hp)

let state = rememberParty(picked, [{ id: 'emberpaw', hp: 10, maxHp: full.currentStats.hp, status: 'burn' }])
assert.equal(state.vitals.emberpaw.hp, 10)
assert.equal(state.vitals.emberpaw.status, 'burn')
assert.equal(livingCount(state), 3)
const healed = applyMedicine(state, 'potion', 'emberpaw')
assert.ok(healed.state.vitals.emberpaw.hp > 10)
assert.ok((healed.state.bag.potion || 0) < (state.bag.potion || 0))
const down = rememberParty(state, [
  { id: 'emberpaw', hp: 0, maxHp: 40 },
  { id: 'aquafin', hp: 0, maxHp: 40 },
  { id: 'leafyn', hp: 0, maxHp: 40 },
])
assert.equal(livingCount(down), 0)
const clinic = wakeAtClinic(down)
assert.equal(clinic.overworld.blackout, false)
assert.equal(clinic.overworld.x, GREENRIDGE.clinic.x)
assert.equal(livingCount(clinic), 3)

const blocked = GREENRIDGE.people.filter(person => person.solid !== false)
const seen = reachableTiles(blocked)
assert.equal(seen.has('5,4'), true)
assert.equal(seen.has('34,6'), true)
assert.equal(seen.has('20,22'), true)
assert.equal(seen.has('2,2'), false)
assert.equal(trainerSees(GREENRIDGE.people.find(person => person.id === 'moss'), 22, 11), true)

const veteran = getDefaultSave()
veteran.version = 6
veteran.unlockedCreatureIds = ['emberpaw', 'aquafin', 'leafyn', 'voltzap', 'bouldar']
veteran.lastTeam = ['emberpaw', 'aquafin', 'leafyn']
veteran.creatureProgress = { emberpaw: { level: 12, currentMoves: ['flame_nip'] } }
veteran.startersChosen = undefined
const profiles = {
  version: 1,
  activeSlot: 0,
  slots: [
    { id: 'slot-1', name: 'Sam', color: '#F56565', avatar: 'emberpaw', save: veteran },
    { id: 'slot-2', name: '', color: '#4299E1', avatar: 'aquafin', save: null },
    { id: 'slot-3', name: '', color: '#48BB78', avatar: 'leafyn', save: null },
    { id: 'slot-4', name: '', color: '#ECC94B', avatar: 'voltzap', save: null },
  ],
}
writeProfiles(profiles)
const loaded = loadProfiles()
assert.equal(loaded.slots[0].save.version, 7)
assert.equal(loaded.slots[0].save.startersChosen, true)
assert.ok(loaded.slots[0].save.unlockedCreatureIds.includes('emberpaw'))
assert.deepEqual(loaded.slots[0].save.lastTeam, ['emberpaw', 'aquafin', 'leafyn'])
assert.equal(loaded.slots[0].save.overworld.map, 'greenridge')
assert.equal(loaded.slots[1].save, null)

console.log('Phase 7 checks passed')
