// Checks the Phase 1 battle and save fixes without a browser.
// Run: npm run verify
import assert from 'node:assert/strict'

const memory = new Map()
globalThis.localStorage = {
  getItem: (key) => (memory.has(key) ? memory.get(key) : null),
  setItem: (key, value) => { memory.set(key, String(value)) },
  removeItem: (key) => { memory.delete(key) },
  clear: () => { memory.clear() },
}

const { calculateDamage, getHitChance } = await import('../src/systems/damage.js')
const { executeTurn, createBattleCreature } = await import('../src/systems/battleEngine.js')
const { getFullTypeChart } = await import('../src/utils/customData.js')
const { CREATURES } = await import('../src/data/creatures.js')
const {
  getDefaultSave, loadProfiles, writeProfiles, createEmptyProfiles, profilesFromLegacySave,
} = await import('../src/utils/saveManager.js')
const { ZONES } = await import('../src/data/campaign.js')
const { buildGymBattleInfo, getNextReplayBattle } = await import('../src/systems/campaignManager.js')

function fighter(type, evasion = 0) {
  return {
    type,
    currentStats: { hp: 100, atk: 60, def: 50, spd: 50, spc: 50 },
    statStages: { atk: 0, def: 0, spd: 0, spc: 0, evasion },
  }
}

const sureHit = { category: 'physical', type: 'normal', power: 40, accuracy: 100 }
const status = { category: 'status', type: 'normal', power: 0, accuracy: null }

// Evasion does nothing when the stage is 0, including on a 100% move.
assert.equal(getHitChance(sureHit, fighter('normal', 0)), 100)
for (let i = 0; i < 200; i++) {
  const result = calculateDamage(fighter('normal'), sureHit, fighter('normal', 0), () => 0.99)
  assert.equal(result.missed, false)
  assert.ok(result.damage >= 1)
}

// +1 evasion is a 25% step: 100 / 1.25 = 80. A high roll misses and is called a dodge.
assert.equal(getHitChance(sureHit, fighter('normal', 1)), 80)
const dodged = calculateDamage(fighter('normal'), sureHit, fighter('normal', 1), () => 0.9)
assert.equal(dodged.missed, true)
assert.equal(dodged.dodged, true)
assert.equal(dodged.damage, 0)
const landed = calculateDamage(fighter('normal'), sureHit, fighter('normal', 1), () => 0.5)
assert.equal(landed.missed, false)
assert.ok(landed.damage >= 1)

// +3 evasion should make misses common, not impossible.
let misses = 0
const trials = 2000
for (let i = 0; i < trials; i++) {
  if (calculateDamage(fighter('normal'), sureHit, fighter('normal', 3), Math.random).missed) misses++
}
const rate = misses / trials
assert.ok(rate > 0.3 && rate < 0.55, `expected ~43% misses at +3 evasion, got ${rate}`)

// Status moves still ignore evasion.
const healed = calculateDamage(fighter('normal'), status, fighter('normal', 3), () => 0.99)
assert.equal(healed.missed, false)
assert.equal(healed.damage, 0)

// A low-accuracy move can still miss with no evasion, and that is a miss, not a dodge.
const shaky = { category: 'physical', type: 'normal', power: 40, accuracy: 50 }
const plainMiss = calculateDamage(fighter('normal'), shaky, fighter('normal', 0), () => 0.8)
assert.equal(plainMiss.missed, true)
assert.equal(plainMiss.dodged, false)

// Custom types change battle damage. Shadow is immune to fire and weak to water.
const shadow = {
  id: 'type_shadow',
  name: 'Shadow',
  attackVs: { fire: 2, water: 1, grass: 1, electric: 1, rock: 1, ground: 1, poison: 1, normal: 1 },
  defenseVs: { fire: 0, water: 2, grass: 1, electric: 1, rock: 1, ground: 1, poison: 1, normal: 1 },
}
const chart = getFullTypeChart({ customTypes: [shadow] })
const always = () => 0
const fireMove = { category: 'physical', type: 'fire', power: 40, accuracy: 100 }
const waterMove = { category: 'physical', type: 'water', power: 40, accuracy: 100 }
const defender = fighter('type_shadow')
const immune = calculateDamage(fighter('fire'), fireMove, defender, always, chart)
assert.equal(immune.effectiveness, 0)
assert.equal(immune.damage, 0)
const weak = calculateDamage(fighter('water'), waterMove, defender, always, chart)
const neutral = calculateDamage(fighter('water'), waterMove, defender, always)
assert.equal(weak.effectiveness, 2)
assert.ok(weak.damage > neutral.damage)

// The battle engine has to pass that chart through, or the immunity never happens.
const custom = {
  id: 'custom_shade',
  name: 'Shade',
  type: 'type_shadow',
  baseStats: { hp: 200, atk: 40, def: 40, spd: 10, spc: 40 },
  movePool: ['tackle', 'scratch', 'slam', 'strike', 'tackle', 'scratch', 'slam', 'strike'],
  spriteId: 'blazant',
}
const lookup = { ...CREATURES, custom_shade: custom }
const player = createBattleCreature({
  id: 'emberpaw', level: 5,
  currentMoves: ['flame_nip', 'tackle', 'scratch', 'slam'],
}, lookup)
const enemy = createBattleCreature({
  id: 'custom_shade', level: 1,
  currentMoves: ['tackle', 'scratch', 'slam', 'strike'],
}, lookup)
assert.equal(enemy.spriteId, 'blazant')
const turn = executeTurn(
  { type: 'attack', moveId: 'flame_nip' },
  [player], 0,
  [enemy], 0,
  { optimalChance: 0, switchBehavior: 'never' },
  { player: 0, ai: 0 },
  chart,
)
assert.ok(
  turn.events.some(event => event.type === 'effectiveness' && event.data.multiplier === 0),
  'fire should be immune against the custom type inside a real turn',
)
const withoutChart = executeTurn(
  { type: 'attack', moveId: 'flame_nip' },
  [createBattleCreature({ id: 'emberpaw', level: 5, currentMoves: ['flame_nip', 'tackle', 'scratch', 'slam'] }, lookup)],
  0,
  [createBattleCreature({ id: 'custom_shade', level: 1, currentMoves: ['tackle', 'scratch', 'slam', 'strike'] }, lookup)],
  0,
  { optimalChance: 0, switchBehavior: 'never' },
  { player: 0, ai: 0 },
)
assert.equal(
  withoutChart.events.some(event => event.type === 'effectiveness' && event.data.multiplier === 0),
  false,
)

// Replaying a gym walks every trainer, then the leader.
for (const zone of ZONES) {
  for (const gym of zone.gyms) {
    let info = buildGymBattleInfo(gym, zone, { type: 'trainer', trainerIndex: 0 }, { replay: true })
    const steps = []
    let guard = 0
    while (info && guard < 8) {
      steps.push(info)
      info = getNextReplayBattle(info)
      guard++
    }
    assert.equal(steps.length, gym.trainers.length + 1, gym.id)
    steps.forEach((step, index) => {
      assert.equal(step.replay, true)
      assert.equal(step.gymId, gym.id)
      if (index < gym.trainers.length) {
        assert.equal(step.type, 'trainer')
        assert.equal(step.trainerIndex, index)
        assert.equal(step.trainerName, gym.trainers[index].title)
      } else {
        assert.equal(step.type, 'leader')
        assert.equal(step.leaderName, gym.leader.name)
      }
    })
    assert.equal(info, null)
  }
}

// An old single save lands in slot 1 and is not copied again.
localStorage.clear()
const legacy = getDefaultSave()
legacy.campaign.playerName = 'Sam'
legacy.campaign.badges = [{ gymId: 'z1g1', badgeName: 'Thornridge Badge' }]
legacy.totalBattlesWon = 6
localStorage.setItem('battle-arena-save', JSON.stringify(legacy))
const migrated = loadProfiles()
assert.equal(migrated.slots[0].name, 'Sam')
assert.equal(migrated.slots[0].save.totalBattlesWon, 6)
assert.equal(migrated.slots[0].save.campaign.badges.length, 1)
assert.equal(migrated.slots[1].save, null)
assert.equal(migrated.slots[2].save, null)
assert.equal(migrated.slots[3].save, null)
assert.equal(localStorage.getItem('battle-arena-save'), null)

const again = loadProfiles()
assert.equal(again.slots[0].save.totalBattlesWon, 6)
assert.equal(again.slots[1].save, null)

// A v1 hard-clear save still unlocks the forge, and it stays in slot 1.
localStorage.clear()
localStorage.setItem('battle-arena-save', JSON.stringify({
  version: 1,
  unlockedCreatureIds: ['emberpaw'],
  creatureProgress: {
    emberpaw: {
      level: 4, wins: 6,
      currentMoves: ['flame_nip', 'tackle'],
      learnedMoves: ['flame_nip', 'tackle'],
      movesOffered: 2,
    },
  },
  lastTeam: ['emberpaw'],
  difficulty: { hardCleared: true },
  battlesWon: 9,
}))
const fromV1 = loadProfiles()
assert.equal(fromV1.slots[0].save.version, 4)
assert.equal(fromV1.slots[0].save.rewards.creatureForge, true)
assert.equal(fromV1.slots[0].name, 'Player 1')
assert.equal(fromV1.slots[1].save, null)

// Overwriting one slot leaves the others alone.
const family = createEmptyProfiles()
family.slots[0].name = 'Alex'
family.slots[0].save = getDefaultSave()
family.slots[1].name = 'Jamie'
const jamie = getDefaultSave()
jamie.totalBattlesWon = 4
family.slots[1].save = jamie
writeProfiles(family)
const loaded = loadProfiles()
loaded.slots[0].save = getDefaultSave()
loaded.slots[0].save.totalBattlesWon = 0
writeProfiles(loaded)
const after = loadProfiles()
assert.equal(after.slots[0].name, 'Alex')
assert.equal(after.slots[0].save.totalBattlesWon, 0)
assert.equal(after.slots[1].name, 'Jamie')
assert.equal(after.slots[1].save.totalBattlesWon, 4)

// A broken old file does not throw or invent a save.
localStorage.clear()
localStorage.setItem('battle-arena-save', '{')
const broken = profilesFromLegacySave(null)
assert.equal(broken.slots[0].save, null)
const loadedBroken = loadProfiles()
assert.equal(loadedBroken.slots[0].save, null)

console.log('Phase 1 checks passed')
