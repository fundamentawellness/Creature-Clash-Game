// All 28 creature definitions
// Each creature: { id, name, type, archetype, desc, shape, baseStats, movePool }
// movePool is an array of 8 move IDs in learn order (slots 1-8)
// Speedster stats use buffed values per design specification

export const CREATURES = {
  // ============================================================
  // FIRE TYPE
  // ============================================================
  emberpaw: {
    id: 'emberpaw',
    name: 'Emberpaw',
    type: 'fire',
    archetype: 'speedster',
    desc: 'Swift fire wolf',
    shape: 'wolf',
    baseStats: { hp: 62, atk: 68, def: 48, spd: 82, spc: 58 },
    movePool: ['flame_nip', 'scratch', 'speed_surge', 'fire_fang', 'rock_fang', 'quick_dodge', 'inferno', 'agility'],
  },
  charrok: {
    id: 'charrok',
    name: 'Charrok',
    type: 'fire',
    archetype: 'tank',
    desc: 'Armored fire tortoise',
    shape: 'tortoise',
    baseStats: { hp: 85, atk: 55, def: 80, spd: 30, spc: 50 },
    movePool: ['flame_nip', 'tackle', 'iron_wall', 'fire_fang', 'earth_stomp', 'recover', 'inferno', 'fortify'],
  },
  blazicor: {
    id: 'blazicor',
    name: 'Blazicor',
    type: 'fire',
    archetype: 'glass_cannon',
    desc: 'Blazing fire hawk',
    shape: 'hawk',
    baseStats: { hp: 40, atk: 50, def: 35, spd: 70, spc: 85 },
    movePool: ['flame_nip', 'strike', 'mind_sharpen', 'fire_fang', 'poison_talon', 'focus_energy', 'inferno', 'power_surge'],
  },
  ignox: {
    id: 'ignox',
    name: 'Ignox',
    type: 'fire',
    archetype: 'bruiser',
    desc: 'Charging fire bull',
    shape: 'bull',
    baseStats: { hp: 75, atk: 80, def: 55, spd: 35, spc: 55 },
    movePool: ['flame_nip', 'slam', 'war_cry', 'fire_fang', 'rock_charge', 'bulk_up', 'inferno', 'intimidate'],
  },

  // ============================================================
  // WATER TYPE
  // ============================================================
  aquafin: {
    id: 'aquafin',
    name: 'Aquafin',
    type: 'water',
    archetype: 'speedster',
    desc: 'Sleek water dolphin',
    shape: 'dolphin',
    baseStats: { hp: 62, atk: 60, def: 48, spd: 82, spc: 68 },
    movePool: ['water_splash', 'scratch', 'speed_surge', 'aqua_jet', 'poison_spray', 'quick_dodge', 'hydro_cannon', 'agility'],
  },
  shellguard: {
    id: 'shellguard',
    name: 'Shellguard',
    type: 'water',
    archetype: 'tank',
    desc: 'Massive water crab',
    shape: 'crab',
    baseStats: { hp: 90, atk: 50, def: 85, spd: 25, spc: 50 },
    movePool: ['water_splash', 'tackle', 'iron_wall', 'aqua_jet', 'rock_shell', 'recover', 'hydro_cannon', 'fortify'],
  },
  torrentis: {
    id: 'torrentis',
    name: 'Torrentis',
    type: 'water',
    archetype: 'glass_cannon',
    desc: 'Surging water serpent',
    shape: 'serpent',
    baseStats: { hp: 40, atk: 45, def: 35, spd: 65, spc: 90 },
    movePool: ['water_splash', 'strike', 'mind_sharpen', 'aqua_jet', 'electric_surge', 'focus_energy', 'hydro_cannon', 'power_surge'],
  },
  tidalon: {
    id: 'tidalon',
    name: 'Tidalon',
    type: 'water',
    archetype: 'bruiser',
    desc: 'Powerful water bear',
    shape: 'bear',
    baseStats: { hp: 80, atk: 75, def: 55, spd: 35, spc: 55 },
    movePool: ['water_splash', 'slam', 'war_cry', 'aqua_jet', 'ground_pound', 'bulk_up', 'hydro_cannon', 'intimidate'],
  },

  // ============================================================
  // GRASS TYPE
  // ============================================================
  leafyn: {
    id: 'leafyn',
    name: 'Leafyn',
    type: 'grass',
    archetype: 'speedster',
    desc: 'Darting grass sprite',
    shape: 'sprite',
    baseStats: { hp: 60, atk: 62, def: 46, spd: 88, spc: 65 },
    movePool: ['vine_whip', 'scratch', 'speed_surge', 'leaf_blade', 'electric_seed', 'quick_dodge', 'natures_wrath', 'agility'],
  },
  mossback: {
    id: 'mossback',
    name: 'Mossback',
    type: 'grass',
    archetype: 'tank',
    desc: 'Overgrown tortoise',
    shape: 'tortoise',
    baseStats: { hp: 90, atk: 50, def: 85, spd: 25, spc: 45 },
    movePool: ['vine_whip', 'tackle', 'iron_wall', 'leaf_blade', 'ground_root', 'recover', 'natures_wrath', 'fortify'],
  },
  floravine: {
    id: 'floravine',
    name: 'Floravine',
    type: 'grass',
    archetype: 'glass_cannon',
    desc: 'Whipping vine creature',
    shape: 'vine',
    baseStats: { hp: 40, atk: 85, def: 30, spd: 65, spc: 55 },
    movePool: ['vine_whip', 'strike', 'focus_energy', 'leaf_blade', 'poison_lash', 'mind_sharpen', 'natures_wrath', 'power_surge'],
  },
  thornox: {
    id: 'thornox',
    name: 'Thornox',
    type: 'grass',
    archetype: 'bruiser',
    desc: 'Thorny ram',
    shape: 'ram',
    baseStats: { hp: 80, atk: 75, def: 60, spd: 30, spc: 55 },
    movePool: ['vine_whip', 'slam', 'war_cry', 'leaf_blade', 'rock_thorn', 'bulk_up', 'natures_wrath', 'intimidate'],
  },

  // ============================================================
  // ELECTRIC TYPE
  // ============================================================
  voltzap: {
    id: 'voltzap',
    name: 'Voltzap',
    type: 'electric',
    archetype: 'speedster',
    desc: 'Crackling electric ferret',
    shape: 'ferret',
    baseStats: { hp: 58, atk: 62, def: 44, spd: 92, spc: 68 },
    movePool: ['spark', 'scratch', 'speed_surge', 'thunder_fang', 'grass_surge', 'quick_dodge', 'storm_strike', 'agility'],
  },
  ampshell: {
    id: 'ampshell',
    name: 'Ampshell',
    type: 'electric',
    archetype: 'tank',
    desc: 'Electric armadillo',
    shape: 'armadillo',
    baseStats: { hp: 85, atk: 50, def: 85, spd: 25, spc: 50 },
    movePool: ['spark', 'tackle', 'iron_wall', 'thunder_fang', 'rock_armor', 'recover', 'storm_strike', 'fortify'],
  },
  strixion: {
    id: 'strixion',
    name: 'Strixion',
    type: 'electric',
    archetype: 'glass_cannon',
    desc: 'Storming owl',
    shape: 'owl',
    baseStats: { hp: 40, atk: 45, def: 30, spd: 70, spc: 90 },
    movePool: ['spark', 'strike', 'mind_sharpen', 'thunder_fang', 'fire_spark', 'focus_energy', 'storm_strike', 'power_surge'],
  },
  zaphorn: {
    id: 'zaphorn',
    name: 'Zaphorn',
    type: 'electric',
    archetype: 'bruiser',
    desc: 'Electric rhino',
    shape: 'rhino',
    baseStats: { hp: 80, atk: 80, def: 55, spd: 30, spc: 55 },
    movePool: ['spark', 'slam', 'war_cry', 'thunder_fang', 'ground_stomp', 'bulk_up', 'storm_strike', 'intimidate'],
  },

  // ============================================================
  // ROCK TYPE
  // ============================================================
  pebblit: {
    id: 'pebblit',
    name: 'Pebblit',
    type: 'rock',
    archetype: 'speedster',
    desc: 'Rolling rock creature',
    shape: 'boulder',
    baseStats: { hp: 60, atk: 65, def: 50, spd: 78, spc: 52 },
    movePool: ['pebble_toss', 'scratch', 'speed_surge', 'rock_smash', 'ground_roll', 'quick_dodge', 'avalanche', 'agility'],
  },
  bouldar: {
    id: 'bouldar',
    name: 'Bouldar',
    type: 'rock',
    archetype: 'tank',
    desc: 'Living boulder',
    shape: 'boulder',
    baseStats: { hp: 85, atk: 55, def: 90, spd: 20, spc: 45 },
    movePool: ['pebble_toss', 'tackle', 'iron_wall', 'rock_smash', 'water_seep', 'recover', 'avalanche', 'fortify'],
  },
  cragmaw: {
    id: 'cragmaw',
    name: 'Cragmaw',
    type: 'rock',
    archetype: 'glass_cannon',
    desc: 'Jagged rock jaw',
    shape: 'jaw',
    baseStats: { hp: 40, atk: 90, def: 35, spd: 60, spc: 50 },
    movePool: ['pebble_toss', 'strike', 'focus_energy', 'rock_smash', 'fire_crunch', 'mind_sharpen', 'avalanche', 'power_surge'],
  },
  geolith: {
    id: 'geolith',
    name: 'Geolith',
    type: 'rock',
    archetype: 'bruiser',
    desc: 'Stone golem',
    shape: 'golem',
    baseStats: { hp: 80, atk: 80, def: 60, spd: 25, spc: 55 },
    movePool: ['pebble_toss', 'slam', 'war_cry', 'rock_smash', 'grass_crush', 'bulk_up', 'avalanche', 'intimidate'],
  },

  // ============================================================
  // GROUND TYPE
  // ============================================================
  dustail: {
    id: 'dustail',
    name: 'Dustail',
    type: 'ground',
    archetype: 'speedster',
    desc: 'Burrowing sand fox',
    shape: 'fox',
    baseStats: { hp: 62, atk: 68, def: 48, spd: 82, spc: 58 },
    movePool: ['mud_slap', 'scratch', 'speed_surge', 'earth_pound', 'poison_dust', 'quick_dodge', 'earthquake', 'agility'],
  },
  mudhide: {
    id: 'mudhide',
    name: 'Mudhide',
    type: 'ground',
    archetype: 'tank',
    desc: 'Clay armored beast',
    shape: 'beast',
    baseStats: { hp: 85, atk: 50, def: 85, spd: 25, spc: 50 },
    movePool: ['mud_slap', 'tackle', 'iron_wall', 'earth_pound', 'rock_skin', 'recover', 'earthquake', 'fortify'],
  },
  quakern: {
    id: 'quakern',
    name: 'Quakern',
    type: 'ground',
    archetype: 'glass_cannon',
    desc: 'Seismic mole',
    shape: 'mole',
    baseStats: { hp: 40, atk: 85, def: 30, spd: 65, spc: 55 },
    movePool: ['mud_slap', 'strike', 'focus_energy', 'earth_pound', 'grass_burrow', 'mind_sharpen', 'earthquake', 'power_surge'],
  },
  terrox: {
    id: 'terrox',
    name: 'Terrox',
    type: 'ground',
    archetype: 'bruiser',
    desc: 'Earth titan',
    shape: 'titan',
    baseStats: { hp: 80, atk: 80, def: 60, spd: 30, spc: 55 },
    movePool: ['mud_slap', 'slam', 'war_cry', 'earth_pound', 'fire_stomp', 'bulk_up', 'earthquake', 'intimidate'],
  },

  // ============================================================
  // POISON TYPE
  // ============================================================
  toxifin: {
    id: 'toxifin',
    name: 'Toxifin',
    type: 'poison',
    archetype: 'speedster',
    desc: 'Poison dart frog',
    shape: 'frog',
    baseStats: { hp: 58, atk: 62, def: 44, spd: 88, spc: 65 },
    movePool: ['poison_sting', 'scratch', 'speed_surge', 'toxic_bite', 'water_venom', 'quick_dodge', 'plague_strike', 'agility'],
  },
  sludgekin: {
    id: 'sludgekin',
    name: 'Sludgekin',
    type: 'poison',
    archetype: 'tank',
    desc: 'Oozing slime blob',
    shape: 'blob',
    baseStats: { hp: 90, atk: 45, def: 80, spd: 25, spc: 55 },
    movePool: ['poison_sting', 'tackle', 'iron_wall', 'toxic_bite', 'ground_ooze', 'recover', 'plague_strike', 'fortify'],
  },
  blightor: {
    id: 'blightor',
    name: 'Blightor',
    type: 'poison',
    archetype: 'glass_cannon',
    desc: 'Toxic moth',
    shape: 'moth',
    baseStats: { hp: 40, atk: 45, def: 30, spd: 70, spc: 90 },
    movePool: ['poison_sting', 'strike', 'mind_sharpen', 'toxic_bite', 'grass_spore', 'focus_energy', 'plague_strike', 'power_surge'],
  },
  venomaw: {
    id: 'venomaw',
    name: 'Venomaw',
    type: 'poison',
    archetype: 'bruiser',
    desc: 'Fanged viper',
    shape: 'viper',
    baseStats: { hp: 75, atk: 80, def: 55, spd: 35, spc: 55 },
    movePool: ['poison_sting', 'slam', 'war_cry', 'toxic_bite', 'fire_venom', 'bulk_up', 'plague_strike', 'intimidate'],
  },
}

// Array form for iteration
export const CREATURE_LIST = Object.values(CREATURES)
