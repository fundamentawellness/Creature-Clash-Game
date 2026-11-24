// The island chain. The first four islands are the old gym zones.
// Later islands stay on the chart, fogged, until a future story.

export const ISLANDS = [
  {
    id: 'greenridge',
    zoneId: 'zone1',
    name: 'Greenridge',
    blurb: 'Quiet meadows and the first gyms.',
    theme: 'Home island',
    color: '#48bb78',
    charted: true,
    wilds: [
      { id: 'meadow', name: 'Sunny Meadow', types: ['grass'], min: 5, max: 10 },
      { id: 'rocks', name: 'Pebble Trail', types: ['rock'], min: 6, max: 11 },
    ],
  },
  {
    id: 'cragmoor',
    zoneId: 'zone2',
    name: 'Cragmoor',
    blurb: 'Cliffs, clay, and a sharp rival.',
    theme: 'Cliff island',
    color: '#c08a30',
    charted: true,
    wilds: [
      { id: 'cliffs', name: 'Cliff Path', types: ['rock', 'ground'], min: 12, max: 20 },
      { id: 'marsh', name: 'Murk Marsh', types: ['poison', 'water'], min: 14, max: 22 },
    ],
  },
  {
    id: 'stormreach',
    zoneId: 'zone3',
    name: 'Stormreach',
    blurb: 'Storm coast. Electric skies, hard gyms.',
    theme: 'Storm island',
    color: '#63b3ed',
    charted: true,
    wilds: [
      { id: 'shore', name: 'Thunder Shore', types: ['electric', 'water'], min: 22, max: 32 },
      { id: 'grove', name: 'Wind Grove', types: ['grass', 'electric'], min: 24, max: 32 },
    ],
  },
  {
    id: 'ironspire',
    zoneId: 'zone4',
    name: 'Ironspire',
    blurb: 'The last charted peak. Champion is close.',
    theme: 'Peak island',
    color: '#fc8181',
    charted: true,
    wilds: [
      { id: 'caldera', name: 'Caldera', types: ['fire', 'ground'], min: 32, max: 42 },
      { id: 'vein', name: 'Ore Vein', types: ['rock', 'poison'], min: 34, max: 42 },
    ],
  },
  {
    id: 'mistveil',
    zoneId: null,
    name: 'Mistveil',
    blurb: 'Fog on the chart. Nobody has sailed this far.',
    theme: 'Uncharted',
    color: '#94a3b8',
    charted: false,
    wilds: [],
  },
  {
    id: 'ashwake',
    zoneId: null,
    name: 'Ashwake',
    blurb: 'A rumor of fire beyond the fog.',
    theme: 'Uncharted',
    color: '#64748b',
    charted: false,
    wilds: [],
  },
]

export const SHOP = [
  { id: 'lure_orb', price: 30 },
  { id: 'sturdy_orb', price: 80 },
  { id: 'potion', price: 40 },
  { id: 'tonic', price: 50 },
]

/** Beating these gyms, in order, earns the boat to the next island. */
export const BOAT_GYMS = ['z1g1', 'z2g1', 'z3g1']

export function islandById(id) {
  return ISLANDS.find(island => island.id === id) || ISLANDS[0]
}
