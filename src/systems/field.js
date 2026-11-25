// Overworld rules: starters, encounters, HP between fights, items, and the clinic.
import { CREATURES } from '../data/creatures.js'
import { ENCOUNTER_TILES, GREENRIDGE } from '../data/greenridgeMap.js'
import { STARTER_LEVEL, validStarterPick } from '../data/starters.js'
import { ITEMS, addItem } from '../data/items.js'
import { formIdForLevel } from '../data/evolutions.js'
import { createCreatureSaveState } from './progression.js'
import { getEffectiveStat } from './statStages.js'
import { getGymById, getZoneById } from '../data/campaign.js'
import { isGymUnlocked, getNextGymBattle, buildGymBattleInfo, isRivalUnlocked } from './campaignManager.js'
import { crewForIsland, crewBattleInfo } from './story.js'

export const WILD_TABLES = {
  route: {
    name: 'Meadow Route',
    rate: 0.16,
    table: [
      { id: 'leafyn', min: 3, max: 6, weight: 28 },
      { id: 'mossback', min: 4, max: 7, weight: 22 },
      { id: 'pebblit', min: 4, max: 7, weight: 18 },
      { id: 'dustail', min: 5, max: 8, weight: 16 },
      { id: 'thornox', min: 6, max: 9, weight: 12 },
      { id: 'voltzap', min: 7, max: 9, weight: 4, rare: true },
    ],
  },
  forest: {
    name: 'Fern Forest',
    rate: 0.15,
    table: [
      { id: 'leafyn', min: 4, max: 7, weight: 24 },
      { id: 'mossback', min: 5, max: 8, weight: 22 },
      { id: 'floravine', min: 6, max: 9, weight: 16 },
      { id: 'thornox', min: 6, max: 9, weight: 14 },
      { id: 'venomaw', min: 7, max: 10, weight: 8 },
      { id: 'blightor', min: 8, max: 10, weight: 4, rare: true },
    ],
  },
  beach: {
    name: 'Shell Beach',
    rate: 0.14,
    table: [
      { id: 'aquafin', min: 4, max: 7, weight: 26 },
      { id: 'shellguard', min: 5, max: 8, weight: 20 },
      { id: 'toxifin', min: 5, max: 8, weight: 18 },
      { id: 'tidalon', min: 6, max: 9, weight: 12 },
      { id: 'torrentis', min: 7, max: 10, weight: 4, rare: true },
    ],
  },
  cave: {
    name: 'Pebble Cave',
    rate: 0.2,
    table: [
      { id: 'pebblit', min: 5, max: 8, weight: 26 },
      { id: 'bouldar', min: 6, max: 9, weight: 20 },
      { id: 'dustail', min: 5, max: 8, weight: 16 },
      { id: 'geolith', min: 7, max: 10, weight: 14 },
      { id: 'cragmaw', min: 8, max: 11, weight: 4, rare: true },
    ],
  },
}

export function emptyField(field) {
  return {
    beaten: field?.beaten || [],
    picked: field?.picked || [],
    quest: field?.quest || 'ask',
  }
}

export function emptyOverworld(overworld) {
  return {
    map: 'greenridge',
    x: overworld?.x ?? GREENRIDGE.spawn.x,
    y: overworld?.y ?? GREENRIDGE.spawn.y,
    facing: overworld?.facing || GREENRIDGE.spawn.facing,
    calm: !!overworld?.calm,
    blackout: !!overworld?.blackout,
  }
}

export function maxHpOf(creatureId, level) {
  const template = CREATURES[creatureId]
  if (!template) return 1
  return getEffectiveStat({ ...template, level: level || 1, statStages: {} }, 'hp')
}

export function livingCount(state) {
  const team = state?.lastTeam || []
  return team.filter(id => {
    const vital = state?.vitals?.[id]
    if (!vital || !Number.isFinite(vital.hp)) return true
    return vital.hp > 0
  }).length
}

export function grantStarters(state, ids) {
  if (!state || state.startersChosen || !validStarterPick(ids)) return state
  const creatureProgress = { ...(state.creatureProgress || {}) }
  const unlocked = new Set(state.unlockedCreatureIds || [])
  const caught = new Set(state.caughtIds || [])
  const seen = new Set(state.seenIds || [])
  for (const id of ids) {
    creatureProgress[id] = createCreatureSaveState(id, STARTER_LEVEL)
    unlocked.add(id)
    caught.add(id)
    seen.add(id)
  }
  return {
    ...state,
    startersChosen: true,
    lastTeam: [...ids],
    creatureProgress,
    unlockedCreatureIds: [...unlocked],
    caughtIds: [...caught],
    seenIds: [...seen],
    bag: addItem(addItem(state.bag || {}, 'potion', 2), 'lure_orb', 3),
  }
}

export function rollFromTable(zoneId, rng = Math.random) {
  const zone = WILD_TABLES[zoneId]
  if (!zone) return null
  if (rng() > zone.rate) return null
  const total = zone.table.reduce((sum, entry) => sum + entry.weight, 0)
  let cursor = rng() * total
  let chosen = zone.table[0]
  for (const entry of zone.table) {
    cursor -= entry.weight
    if (cursor <= 0) {
      chosen = entry
      break
    }
  }
  const span = Math.max(0, chosen.max - chosen.min)
  const level = chosen.min + Math.floor(rng() * (span + 1))
  const id = formIdForLevel(chosen.id, level)
  return {
    id,
    level,
    name: CREATURES[id]?.name || chosen.id,
    rare: !!chosen.rare,
    zoneName: zone.name,
  }
}

export function rollEncounter(tile, rng = Math.random) {
  const zoneId = ENCOUNTER_TILES[tile]
  if (!zoneId) return null
  return rollFromTable(zoneId, rng)
}

export function wildBattleInfo(roll) {
  if (!roll) return null
  return {
    type: 'wild',
    wild: true,
    fromOverworld: true,
    zoneId: 'zone1',
    areaName: roll.zoneName,
    aiConfig: { optimalChance: 0.4, switchBehavior: 'never', items: [] },
    aiTeamSpec: [{ id: roll.id, level: roll.level }],
    aiTeamSize: 1,
    creatureName: roll.name,
    rare: !!roll.rare,
  }
}

export function fieldTrainerBattle(trainer) {
  return {
    type: 'field',
    field: true,
    fieldId: trainer.id,
    fromOverworld: true,
    wild: false,
    zoneId: 'zone1',
    trainerName: trainer.name,
    aiConfig: { optimalChance: 0.5, switchBehavior: 'never', items: [] },
    aiTeamSpec: trainer.team,
    aiTeamSize: trainer.team.length,
    preBattleDialogue: trainer.before,
  }
}

export function markFieldTrainer(state, id) {
  const field = emptyField(state?.field)
  if (!id || field.beaten.includes(id)) return state
  return { ...state, field: { ...field, beaten: [...field.beaten, id] } }
}

export function rememberParty(state, party) {
  const vitals = { ...(state?.vitals || {}) }
  for (const row of party || []) {
    const id = row?.id
    const progress = state?.creatureProgress?.[id]
    const template = CREATURES[id]
    if (!id || !progress || !template) continue
    const max = maxHpOf(id, progress.level)
    const oldMax = row.maxHp || max
    let hp = Number.isFinite(row.hp) ? row.hp : max
    if (hp > 0 && max > oldMax) hp += max - oldMax
    hp = Math.max(0, Math.min(max, Math.round(hp)))
    const status = hp <= 0 ? null : (row.status || null)
    if (hp >= max && !status) delete vitals[id]
    else vitals[id] = { hp, status }
  }
  return { ...state, vitals }
}

export function healParty(state) {
  return { ...state, vitals: {} }
}

export function wakeAtClinic(state) {
  const healed = healParty(state)
  return {
    ...healed,
    overworld: {
      ...emptyOverworld(state?.overworld),
      ...GREENRIDGE.clinic,
      calm: true,
      blackout: false,
    },
  }
}

export function noteBlackout(state, party) {
  const rows = party || []
  if (!rows.length || rows.some(row => (row.hp || 0) > 0)) return state
  return {
    ...state,
    overworld: { ...emptyOverworld(state?.overworld), ...(state?.overworld || {}), blackout: true },
  }
}

export function applyMedicine(state, itemId, creatureId) {
  const item = ITEMS[itemId]
  const count = state?.bag?.[itemId] || 0
  const template = CREATURES[creatureId]
  const progress = state?.creatureProgress?.[creatureId]
  if (!item || count <= 0 || !template || !progress) return { state, note: 'That cannot be used.' }
  if (item.kind !== 'heal' && item.kind !== 'cure') return { state, note: 'Save that for a battle.' }
  const max = maxHpOf(creatureId, progress.level)
  const vital = state.vitals?.[creatureId] || { hp: max, status: null }
  let hp = Number.isFinite(vital.hp) ? vital.hp : max
  let status = vital.status || null
  if (hp <= 0) return { state, note: `${template.name} needs the healing center.` }
  if (item.kind === 'cure') {
    if (!status) return { state, note: `${template.name} feels fine.` }
    status = null
  } else {
    const amount = item.heal >= 1 ? max - hp : Math.max(1, Math.floor(max * item.heal))
    if (amount <= 0 && !(item.cure && status)) return { state, note: `${template.name} is already full of energy.` }
    hp = Math.min(max, hp + amount)
    if (item.cure) status = null
  }
  const bag = { ...(state.bag || {}) }
  bag[itemId] = count - 1
  if (bag[itemId] <= 0) delete bag[itemId]
  const vitals = { ...(state.vitals || {}) }
  if (hp >= max && !status) delete vitals[creatureId]
  else vitals[creatureId] = { hp, status }
  return { state: { ...state, bag, vitals }, note: `${template.name} looks better.` }
}

export function collectItem(state, item) {
  const field = emptyField(state?.field)
  if (!item || field.picked.includes(item.id)) return { state, note: '' }
  const picked = [...field.picked, item.id]
  let nextField = { ...field, picked }
  let next = { ...state, field: nextField }
  if (item.kind === 'shell') {
    if (nextField.quest !== 'done') nextField = { ...nextField, quest: 'have' }
    return { state: { ...next, field: nextField }, note: 'You found a lucky white shell.' }
  }
  const bag = addItem(state.bag, item.itemId, item.count || 1)
  const name = ITEMS[item.itemId]?.name || 'something'
  return { state: { ...next, bag }, note: `Found ${name}.` }
}

export function talkToPip(state) {
  const field = emptyField(state?.field)
  if (field.quest === 'done') {
    return { state, lines: ['The beach feels lucky again. Thank you!'] }
  }
  if (field.quest === 'have') {
    const bag = addItem(addItem(state.bag, 'potion', 3), 'tonic', 1)
    return {
      state: {
        ...state,
        coins: (state.coins || 0) + 40,
        bag,
        field: { ...field, quest: 'done' },
      },
      lines: [
        'My shell! I knew the beach was keeping it safe.',
        'Take these potions. Out here, bruises stay until you heal them.',
      ],
    }
  }
  return {
    state: { ...state, field: { ...field, quest: 'hunt' } },
    lines: [
      'I dropped my lucky shell on the beach. It is white and sparkly.',
      'Could you look along the sand? I will wait right here.',
    ],
  }
}

export function signText(id) {
  if (id === 'cut-sign') return 'A thick hedge. One day a Cut skill will open a path through hedges like this.'
  if (id === 'surf-sign') return 'The water past the sand is deep. Surf will let you ride it. Not yet.'
  if (id === 'smash-sign') return 'A cracked boulder. Rock Smash will break these later.'
  if (id === 'guide') return 'Four gym leaders share this hall. Talk to one when your team is ready. The first leader is always happy to battle.'
  return 'The sign is faded.'
}

export function gymDoorBattle(state, gymId) {
  const gym = getGymById(gymId)
  const zone = getZoneById('zone1')
  const campaign = state?.campaign || {}
  if (!gym || !isGymUnlocked(campaign, gymId)) {
    return { locked: true, line: 'This leader is waiting until you are further along.' }
  }
  const complete = campaign.completedGyms?.includes(gymId)
  const step = complete ? { type: 'trainer', trainerIndex: 0 } : getNextGymBattle(campaign, gymId)
  const battle = buildGymBattleInfo(gym, zone, step, { replay: complete })
  if (!battle) return { locked: true, line: 'Come back when you are ready.' }
  return { battle: { ...battle, fromOverworld: true } }
}

export function rivalDoorBattle(state) {
  const zone = getZoneById('zone1')
  const campaign = state?.campaign || {}
  const rivalName = campaign.rivalName || 'Rival'
  if (campaign.completedRivals?.includes(zone.rival.id)) {
    return { line: `${rivalName} grins. "You already beat me here. I will be on the next island."` }
  }
  if (!isRivalUnlocked(campaign, zone.id)) {
    return { line: `${rivalName} says, "Beat the Greenridge gyms. Then I will battle you for real."` }
  }
  const rival = zone.rival
  return {
    battle: {
      type: 'rival',
      fromOverworld: true,
      gymId: null,
      zoneId: zone.id,
      aiConfig: rival.aiConfig,
      aiTeamSpec: null,
      aiTeamSize: rival.teamSize,
      rivalLevel: rival.level,
      preBattleDialogue: rival.preBattleDialogue.replace(/\[Rival name\]/g, rivalName),
      postDefeatDialogue: rival.postDefeatDialogue.replace(/\[Rival name\]/g, rivalName),
      reward: rival.reward,
      rewardTitle: rival.rewardTitle,
      rewardDescription: rival.rewardDescription,
    },
  }
}

export function dotBattle(state) {
  const ready = crewForIsland(state, 'greenridge').find(member => member.id === 'dot')
  if (ready) return { battle: { ...crewBattleInfo(ready), fromOverworld: true } }
  if (state?.story?.defeated?.includes('dot')) {
    return { line: 'Digger Dot waves. "I am done digging this meadow. The humming is further on."' }
  }
  return { line: 'The meadow is quiet. Digger Dot has not arrived yet.' }
}

export function applyVitals(creature, vital) {
  if (!creature || !vital || !Number.isFinite(vital.hp)) return creature
  const max = creature.currentStats?.hp || creature.currentHp || 1
  creature.currentHp = Math.max(0, Math.min(max, vital.hp))
  creature.fainted = creature.currentHp <= 0
  return creature
}
