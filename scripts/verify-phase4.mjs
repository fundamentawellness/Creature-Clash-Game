import assert from 'node:assert/strict'

const memory = new Map()
globalThis.localStorage = {
  getItem: (key) => (memory.has(key) ? memory.get(key) : null),
  setItem: (key, value) => { memory.set(key, String(value)) },
  removeItem: (key) => { memory.delete(key) },
  clear: () => { memory.clear() },
}

const { getDefaultSave, loadProfiles, writeProfiles } = await import('../src/utils/saveManager.js')
const { canReachIsland } = await import('../src/systems/world.js')
const { ISLANDS } = await import('../src/data/islands.js')
const { CREATURES } = await import('../src/data/creatures.js')
const { isGymUnlocked } = await import('../src/systems/campaignManager.js')
const { LEGENDS, CREW, ELITES, CHAMPION, SCENES } = await import('../src/data/story.js')
const {
  pendingScene, markSceneSeen, crewForIsland, nextElite, championReady, markCrewDefeated, markEliteBeaten, markChampion,
} = await import('../src/systems/story.js')

assert.equal(LEGENDS.length, 3)
assert.ok(LEGENDS.every(legend => legend.name && legend.hint && legend.where))

const usedIds = [
  ...CREW.flatMap(member => member.team.map(creature => creature.id)),
  ...ELITES.flatMap(elite => elite.team.map(creature => creature.id)),
  ...CHAMPION.team.map(creature => creature.id),
]
for (const id of usedIds) assert.ok(CREATURES[id], id)
assert.ok(Math.max(...CHAMPION.team.map(creature => creature.level)) >= 50)

let state = getDefaultSave()
state.campaign.playerName = 'Alex'
state.campaign.rivalName = 'Riley'
assert.equal(pendingScene(state, 'map')?.id, 'harbor')
state = markSceneSeen(state, 'harbor')
assert.equal(pendingScene(state, 'map'), null)
assert.equal(pendingScene(state, 'greenridge')?.id, 'greenridge')
state = markSceneSeen(state, 'greenridge')
assert.equal(crewForIsland(state, 'greenridge')[0]?.id, 'dot')

const boats = ['z1g1', 'z2g1', 'z3g1', 'z4g1', 'z5g1', 'z6g1']
const rivals = ['rival1', 'rival2', 'rival3', 'rival4', 'rival5', 'rival6']
for (let i = 0; i < boats.length; i++) {
  assert.equal(canReachIsland(state, i + 1), false, ISLANDS[i + 1].name)
  state = {
    ...state,
    campaign: {
      ...state.campaign,
      completedGyms: [...boats.slice(0, i + 1)],
      completedRivals: rivals.slice(0, i),
    },
  }
  assert.equal(canReachIsland(state, i + 1), true, ISLANDS[i + 1].name)
  if (i < boats.length - 1) {
    assert.equal(isGymUnlocked(state.campaign, boats[i + 1]), i === 0 ? false : state.campaign.completedRivals.includes(rivals[i]))
  }
}

assert.equal(ISLANDS.map(island => island.id).join(','), 'greenridge,cragmoor,stormreach,ironspire,mistveil,ashwake,crownrest')
assert.ok(ISLANDS.every(island => island.charted))
assert.ok(ISLANDS.find(island => island.id === 'mistveil').wilds.length > 0)
assert.ok(ISLANDS.find(island => island.id === 'ashwake').wilds[0].max >= 49)

state = markCrewDefeated(state, 'dot')
state = markSceneSeen(state, 'cragmoor')
state = markSceneSeen(state, 'stormreach')
state = markCrewDefeated(state, 'sid')
state = markSceneSeen(state, 'ironspire')
state = markSceneSeen(state, 'mistveil')
state = markSceneSeen(state, 'ashwake')
assert.equal(crewForIsland(state, 'ashwake')[0]?.id, 'scoop')
assert.equal(championReady(state), false)
state = {
  ...state,
  campaign: { ...state.campaign, completedRivals: rivals },
}
state = markCrewDefeated(state, 'scoop')
assert.equal(nextElite(state)?.id, 'brine')
for (const elite of ELITES) {
  assert.equal(championReady(state), false)
  state = markEliteBeaten(state, elite.id)
}
assert.equal(championReady(state), true)
state = markChampion(state, false)
assert.equal(state.story.champion, true)
assert.equal(state.rewards.islandChampion, true)
assert.equal(pendingScene(state, 'map')?.id, 'ending')
assert.equal(SCENES.length >= 8, true)

localStorage.clear()
const old = getDefaultSave()
old.version = 4
delete old.story
old.campaign.playerName = 'Sam'
old.unlockedCreatureIds = ['emberpaw']
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
assert.deepEqual(loaded.slots[0].save.story.defeated, [])
assert.ok(loaded.slots[0].save.unlockedCreatureIds.includes('emberpaw'))
assert.equal(loaded.slots[1].save, null)

console.log('Phase 4 checks passed')
