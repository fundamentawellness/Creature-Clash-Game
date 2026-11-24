// The three pedestals. They stay hidden until a kid's creature is filled in.
// A parent walks through this file with the kids in docs/ADD_A_CREATURE.md.
//
// To wake a pedestal:
// 1. Replace the example fields with the creature the kids invented.
// 2. Set ready to true.
// 3. Leave the id alone so the pedestal stays the same place in the story.
//
// Until ready is true, the creature cannot be found or caught.

export const LEGEND_SLOTS = [
  {
    id: 'heart-of-the-chain',
    ready: false,
    name: 'Heart of the Chain',
    type: 'grass',
    ability: 'deep_roots',
    desc: 'Waiting for a kid to invent this creature.',
    stats: { hp: 96, atk: 84, def: 86, spd: 72, spc: 96 },
    moves: ['vine_whip', 'leaf_blade', 'natures_wrath', 'recover'],
    art: null,
    level: 50,
    where: 'Crownrest',
    hint: 'The sleeping heart under the islands. A kid still gets to decide what it looks like.',
    encounter: 'After you are champion, the Crownrest pedestal wakes up and can be caught.',
  },
  {
    id: 'sleeper-in-the-fog',
    ready: false,
    name: 'The Sleeper',
    type: 'water',
    ability: 'tidewell',
    desc: 'Waiting for a kid to invent this creature.',
    stats: { hp: 100, atk: 78, def: 90, spd: 68, spc: 88 },
    moves: ['water_splash', 'aqua_jet', 'glacier_jet', 'iron_wall'],
    art: null,
    level: 50,
    where: 'Mistveil',
    hint: 'Something in the deep fog has not woken up. Its name and picture are still open.',
    encounter: 'After you are champion, the Mistveil pedestal wakes up and can be caught.',
  },
  {
    id: 'last-spark',
    ready: false,
    name: "Ashwake's Last Spark",
    type: 'fire',
    ability: 'ember_heart',
    desc: 'Waiting for a kid to invent this creature.',
    stats: { hp: 88, atk: 98, def: 74, spd: 90, spc: 92 },
    moves: ['flame_nip', 'fire_fang', 'inferno', 'agility'],
    art: null,
    level: 50,
    where: 'Ashwake',
    hint: 'A spark that never went out in the ash. Waiting for a kid to invent the creature.',
    encounter: 'After you are champion, the Ashwake pedestal wakes up and can be caught.',
  },
]

export function isLegendReady(slot) {
  if (!slot || slot.ready !== true) return false
  if (!slot.name || !slot.type || !slot.ability) return false
  if (!slot.stats?.hp || !Array.isArray(slot.moves) || slot.moves.length < 2) return false
  return true
}

export function readyLegends() {
  return LEGEND_SLOTS.filter(isLegendReady)
}

export function registerLegends(creatures) {
  for (const slot of readyLegends()) {
    creatures[slot.id] = {
      id: slot.id,
      name: slot.name,
      type: slot.type,
      archetype: 'legendary',
      desc: slot.desc || slot.hint,
      shape: 'legend',
      baseStats: { ...slot.stats },
      movePool: slot.moves,
      ability: slot.ability,
      spriteId: slot.art || null,
      legendary: true,
    }
  }
}

export function legendBattle(slot) {
  if (!isLegendReady(slot)) return null
  return {
    type: 'wild',
    wild: true,
    legend: true,
    aiConfig: { optimalChance: 0.75, switchBehavior: 'never', items: [] },
    aiTeamSpec: [{ id: slot.id, level: slot.level || 50 }],
    aiTeamSize: 1,
    creatureName: slot.name,
  }
}
