import assert from 'node:assert/strict'

const memory = new Map()
globalThis.localStorage = {
  getItem: (key) => (memory.has(key) ? memory.get(key) : null),
  setItem: (key, value) => { memory.set(key, String(value)) },
  removeItem: (key) => { memory.delete(key) },
  clear: () => { memory.clear() },
}

const { CREATURES } = await import('../src/data/creatures.js')
const { LEGEND_SLOTS, isLegendReady, readyLegends, legendBattle } = await import('../src/data/legendaries.js')
const { getDefaultSave, loadProfiles, writeProfiles } = await import('../src/utils/saveManager.js')
const { playCue, defaultAudioSettings } = await import('../src/audio/sound.js')
const { DEFAULT_ARENA_URL, toWebSocketUrl } = await import('../src/online/arenaUrl.js')

assert.equal(DEFAULT_ARENA_URL, 'https://creature-clash-rooms.onrender.com')
assert.equal(toWebSocketUrl(DEFAULT_ARENA_URL), 'wss://creature-clash-rooms.onrender.com')
assert.equal(toWebSocketUrl('http://127.0.0.1:8787/'), 'ws://127.0.0.1:8787')

assert.equal(LEGEND_SLOTS.length, 3)
assert.deepEqual(readyLegends(), [])
for (const slot of LEGEND_SLOTS) {
  assert.equal(isLegendReady(slot), false)
  assert.equal(CREATURES[slot.id], undefined)
  assert.equal(legendBattle(slot), null)
  assert.ok(slot.where && slot.encounter && slot.moves.length >= 2)
}

const fresh = getDefaultSave()
assert.equal(fresh.version, 7)
assert.equal(typeof fresh.settings.music, 'number')
assert.equal(fresh.settings.muted, false)
assert.equal(fresh.lastTeam.length, 0)
assert.equal(fresh.startersChosen, false)
playCue('tap')

const sample = {
  ...LEGEND_SLOTS[0],
  ready: true,
}
assert.equal(isLegendReady(sample), true)
assert.equal(legendBattle(sample).type, 'wild')
assert.equal(isLegendReady({ ...sample, ready: false }), false)

localStorage.clear()
const old = getDefaultSave()
old.version = 5
delete old.settings
old.campaign.playerName = 'Sam'
const profiles = {
  version: 1,
  activeSlot: 0,
  slots: [
    { id: 'slot-1', name: 'Sam', color: '#F56565', avatar: 'emberpaw', save: old },
    { id: 'slot-2', name: '', color: '#4299E1', avatar: 'aquafin', save: null },
    { id: 'slot-3', name: '', color: '#48BB78', avatar: 'leafyn', save: null },
    { id: 'slot-4', name: '', color: '#ECC94B', avatar: 'voltzap', save: null },
  ],
}
writeProfiles(profiles)
const loaded = loadProfiles()
assert.equal(loaded.slots[0].save.version, 7)
assert.equal(typeof loaded.slots[0].save.settings.sfx, 'number')
assert.ok(loaded.slots[0].save.story)
assert.equal(loaded.slots[1].save, null)
assert.equal(defaultAudioSettings().muted, false)

console.log('Phase 6 checks passed')
