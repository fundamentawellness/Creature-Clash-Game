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
    blurb: 'A hot peak with a sealed door.',
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
    zoneId: 'zone5',
    name: 'Mistveil',
    blurb: 'Fog, ruins, and a clue in the stones.',
    theme: 'Ruin island',
    color: '#9f7aea',
    charted: true,
    wilds: [
      { id: 'veil-pool', name: 'Veil Pools', types: ['water', 'poison'], min: 40, max: 46 },
      { id: 'ruin-walk', name: 'Ruin Walk', types: ['grass', 'water'], min: 42, max: 46 },
    ],
  },
  {
    id: 'ashwake',
    zoneId: 'zone6',
    name: 'Ashwake',
    blurb: 'Warm ash. The digging crew makes its stand.',
    theme: 'Ash island',
    color: '#ed8936',
    charted: true,
    wilds: [
      { id: 'ash-field', name: 'Ash Field', types: ['fire', 'ground'], min: 44, max: 49 },
      { id: 'spark-dunes', name: 'Spark Dunes', types: ['electric', 'fire'], min: 46, max: 50 },
    ],
  },
  {
    id: 'crownrest',
    zoneId: null,
    name: 'Crownrest',
    blurb: 'The champion, and three empty pedestals.',
    theme: 'Champion island',
    color: '#f6e05e',
    charted: true,
    champion: true,
    wilds: [
      { id: 'crown-green', name: 'Champion Green', types: ['grass', 'electric'], min: 46, max: 50 },
    ],
  },
]

export const SHOP = [
  { id: 'lure_orb', price: 30 },
  { id: 'sturdy_orb', price: 80 },
  { id: 'potion', price: 40 },
  { id: 'tonic', price: 50 },
]

/** Beating these gyms, in order, earns the boat to the next island. */
export const BOAT_GYMS = ['z1g1', 'z2g1', 'z3g1', 'z4g1', 'z5g1', 'z6g1']

export function islandById(id) {
  return ISLANDS.find(island => island.id === id) || ISLANDS[0]
}
