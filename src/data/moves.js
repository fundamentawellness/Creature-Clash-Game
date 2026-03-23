// All move definitions — organized by category
// Each move: { id, name, type, power, accuracy, category, effect }

// ============================================================
// STAB Moves — Weak tier (35 power)
// ============================================================
const flameNip =     { id: 'flame_nip',     name: 'Flame Nip',     type: 'fire',     power: 35, accuracy: 100, category: 'physical', effect: null }
const waterSplash =  { id: 'water_splash',  name: 'Water Splash',  type: 'water',    power: 35, accuracy: 100, category: 'special',  effect: null }
const vineWhip =     { id: 'vine_whip',     name: 'Vine Whip',     type: 'grass',    power: 35, accuracy: 100, category: 'physical', effect: null }
const spark =        { id: 'spark',         name: 'Spark',         type: 'electric', power: 35, accuracy: 100, category: 'physical', effect: null }
const pebbleToss =   { id: 'pebble_toss',   name: 'Pebble Toss',   type: 'rock',     power: 35, accuracy: 100, category: 'physical', effect: null }
const mudSlap =      { id: 'mud_slap',      name: 'Mud Slap',      type: 'ground',   power: 35, accuracy: 100, category: 'special',  effect: null }
const poisonSting =  { id: 'poison_sting',  name: 'Poison Sting',  type: 'poison',   power: 35, accuracy: 100, category: 'physical', effect: null }

// ============================================================
// STAB Moves — Medium tier (55 power)
// ============================================================
const fireFang =     { id: 'fire_fang',     name: 'Fire Fang',     type: 'fire',     power: 55, accuracy: 95, category: 'physical', effect: null }
const aquaJet =      { id: 'aqua_jet',      name: 'Aqua Jet',      type: 'water',    power: 55, accuracy: 95, category: 'physical', effect: null }
const leafBlade =    { id: 'leaf_blade',    name: 'Leaf Blade',    type: 'grass',    power: 55, accuracy: 95, category: 'physical', effect: null }
const thunderFang =  { id: 'thunder_fang',  name: 'Thunder Fang',  type: 'electric', power: 55, accuracy: 95, category: 'physical', effect: null }
const rockSmash =    { id: 'rock_smash',    name: 'Rock Smash',    type: 'rock',     power: 55, accuracy: 95, category: 'physical', effect: null }
const earthPound =   { id: 'earth_pound',   name: 'Earth Pound',   type: 'ground',   power: 55, accuracy: 95, category: 'physical', effect: null }
const toxicBite =    { id: 'toxic_bite',    name: 'Toxic Bite',    type: 'poison',   power: 55, accuracy: 95, category: 'physical', effect: null }

// ============================================================
// STAB Moves — Strong tier (85 power)
// ============================================================
const inferno =      { id: 'inferno',       name: 'Inferno',       type: 'fire',     power: 85, accuracy: 90, category: 'special',  effect: null }
const hydroCannon =  { id: 'hydro_cannon',  name: 'Hydro Cannon',  type: 'water',    power: 85, accuracy: 90, category: 'special',  effect: null }
const naturesWrath = { id: 'natures_wrath', name: "Nature's Wrath", type: 'grass',   power: 85, accuracy: 90, category: 'special',  effect: null }
const stormStrike =  { id: 'storm_strike',  name: 'Storm Strike',  type: 'electric', power: 85, accuracy: 90, category: 'special',  effect: null }
const avalanche =    { id: 'avalanche',     name: 'Avalanche',     type: 'rock',     power: 85, accuracy: 90, category: 'physical', effect: null }
const earthquake =   { id: 'earthquake',    name: 'Earthquake',    type: 'ground',   power: 85, accuracy: 90, category: 'physical', effect: null }
const plagueStrike = { id: 'plague_strike', name: 'Plague Strike', type: 'poison',   power: 85, accuracy: 90, category: 'special',  effect: null }

// ============================================================
// Normal Damage Moves
// ============================================================
const tackle =  { id: 'tackle',  name: 'Tackle',  type: 'normal', power: 40, accuracy: 100, category: 'physical', effect: null }
const scratch = { id: 'scratch', name: 'Scratch', type: 'normal', power: 40, accuracy: 100, category: 'physical', effect: null }
const strike =  { id: 'strike',  name: 'Strike',  type: 'normal', power: 40, accuracy: 100, category: 'special',  effect: null }
const slam =    { id: 'slam',    name: 'Slam',    type: 'normal', power: 45, accuracy: 95,  category: 'physical', effect: null }

// ============================================================
// Status Moves — Speedster
// ============================================================
const speedSurge = { id: 'speed_surge', name: 'Speed Surge', type: 'normal', power: 0, accuracy: null, category: 'status', effect: { target: 'self', stats: { spd: 1 } } }
const quickDodge = { id: 'quick_dodge', name: 'Quick Dodge', type: 'normal', power: 0, accuracy: null, category: 'status', effect: { target: 'self', stats: { evasion: 1 } } }
const agility =    { id: 'agility',    name: 'Agility',    type: 'normal', power: 0, accuracy: null, category: 'status', effect: { target: 'self', stats: { spd: 2 } } }

// ============================================================
// Status Moves — Tank
// ============================================================
const ironWall = { id: 'iron_wall', name: 'Iron Wall', type: 'normal', power: 0, accuracy: null, category: 'status', effect: { target: 'self', stats: { def: 1 } } }
const recover =  { id: 'recover',  name: 'Recover',  type: 'normal', power: 0, accuracy: null, category: 'status', effect: { target: 'self', heal: 0.3 } }
const fortify =  { id: 'fortify',  name: 'Fortify',  type: 'normal', power: 0, accuracy: null, category: 'status', effect: { target: 'self', stats: { def: 1, spc: 1 } } }

// ============================================================
// Status Moves — Glass Cannon
// ============================================================
const focusEnergy = { id: 'focus_energy', name: 'Focus Energy', type: 'normal', power: 0, accuracy: null, category: 'status', effect: { target: 'self', stats: { atk: 1 } } }
const mindSharpen = { id: 'mind_sharpen', name: 'Mind Sharpen', type: 'normal', power: 0, accuracy: null, category: 'status', effect: { target: 'self', stats: { spc: 1 } } }
const powerSurge =  { id: 'power_surge',  name: 'Power Surge',  type: 'normal', power: 0, accuracy: null, category: 'status', effect: { target: 'self', stats: { atk: 1, spc: 1, def: -1 } } }

// ============================================================
// Status Moves — Bruiser
// ============================================================
const warCry =     { id: 'war_cry',    name: 'War Cry',    type: 'normal', power: 0, accuracy: 100, category: 'status', effect: { target: 'opponent', stats: { def: -1 } } }
const bulkUp =     { id: 'bulk_up',    name: 'Bulk Up',    type: 'normal', power: 0, accuracy: null, category: 'status', effect: { target: 'self', stats: { atk: 1, def: 1 } } }
const intimidate = { id: 'intimidate', name: 'Intimidate', type: 'normal', power: 0, accuracy: 100, category: 'status', effect: { target: 'opponent', stats: { atk: -1 } } }

// ============================================================
// Off-Type Coverage Moves
// ============================================================
const rockFang =      { id: 'rock_fang',      name: 'Rock Fang',      type: 'rock',     power: 50, accuracy: 95, category: 'physical', effect: null }
const earthStomp =    { id: 'earth_stomp',    name: 'Earth Stomp',    type: 'ground',   power: 50, accuracy: 95, category: 'physical', effect: null }
const poisonTalon =   { id: 'poison_talon',   name: 'Poison Talon',   type: 'poison',   power: 50, accuracy: 95, category: 'physical', effect: null }
const rockCharge =    { id: 'rock_charge',    name: 'Rock Charge',    type: 'rock',     power: 55, accuracy: 90, category: 'physical', effect: null }
const poisonSpray =   { id: 'poison_spray',   name: 'Poison Spray',   type: 'poison',   power: 50, accuracy: 95, category: 'special',  effect: null }
const rockShell =     { id: 'rock_shell',     name: 'Rock Shell',     type: 'rock',     power: 50, accuracy: 95, category: 'physical', effect: null }
const electricSurge = { id: 'electric_surge', name: 'Electric Surge', type: 'electric', power: 50, accuracy: 95, category: 'special',  effect: null }
const groundPound =   { id: 'ground_pound',   name: 'Ground Pound',   type: 'ground',   power: 55, accuracy: 90, category: 'physical', effect: null }
const electricSeed =  { id: 'electric_seed',  name: 'Electric Seed',  type: 'electric', power: 50, accuracy: 95, category: 'special',  effect: null }
const groundRoot =    { id: 'ground_root',    name: 'Ground Root',    type: 'ground',   power: 50, accuracy: 95, category: 'physical', effect: null }
const poisonLash =    { id: 'poison_lash',    name: 'Poison Lash',    type: 'poison',   power: 50, accuracy: 95, category: 'physical', effect: null }
const rockThorn =     { id: 'rock_thorn',     name: 'Rock Thorn',     type: 'rock',     power: 55, accuracy: 90, category: 'physical', effect: null }
const grassSurge =    { id: 'grass_surge',    name: 'Grass Surge',    type: 'grass',    power: 50, accuracy: 95, category: 'special',  effect: null }
const rockArmor =     { id: 'rock_armor',     name: 'Rock Armor',     type: 'rock',     power: 50, accuracy: 95, category: 'physical', effect: null }
const fireSpark =     { id: 'fire_spark',     name: 'Fire Spark',     type: 'fire',     power: 50, accuracy: 95, category: 'special',  effect: null }
const groundStomp =   { id: 'ground_stomp',   name: 'Ground Stomp',   type: 'ground',   power: 55, accuracy: 90, category: 'physical', effect: null }
const groundRoll =    { id: 'ground_roll',    name: 'Ground Roll',    type: 'ground',   power: 50, accuracy: 95, category: 'physical', effect: null }
const waterSeep =     { id: 'water_seep',     name: 'Water Seep',     type: 'water',    power: 50, accuracy: 95, category: 'special',  effect: null }
const fireCrunch =    { id: 'fire_crunch',    name: 'Fire Crunch',    type: 'fire',     power: 50, accuracy: 95, category: 'physical', effect: null }
const grassCrush =    { id: 'grass_crush',    name: 'Grass Crush',    type: 'grass',    power: 55, accuracy: 90, category: 'physical', effect: null }
const poisonDust =    { id: 'poison_dust',    name: 'Poison Dust',    type: 'poison',   power: 50, accuracy: 95, category: 'special',  effect: null }
const rockSkin =      { id: 'rock_skin',      name: 'Rock Skin',      type: 'rock',     power: 50, accuracy: 95, category: 'physical', effect: null }
const grassBurrow =   { id: 'grass_burrow',   name: 'Grass Burrow',   type: 'grass',    power: 50, accuracy: 95, category: 'special',  effect: null }
const fireStomp =     { id: 'fire_stomp',     name: 'Fire Stomp',     type: 'fire',     power: 55, accuracy: 90, category: 'physical', effect: null }
const waterVenom =    { id: 'water_venom',    name: 'Water Venom',    type: 'water',    power: 50, accuracy: 95, category: 'special',  effect: null }
const groundOoze =    { id: 'ground_ooze',    name: 'Ground Ooze',    type: 'ground',   power: 50, accuracy: 95, category: 'special',  effect: null }
const grassSpore =    { id: 'grass_spore',    name: 'Grass Spore',    type: 'grass',    power: 50, accuracy: 95, category: 'special',  effect: null }
const fireVenom =     { id: 'fire_venom',     name: 'Fire Venom',     type: 'fire',     power: 55, accuracy: 90, category: 'physical', effect: null }

// ============================================================
// Master moves lookup by ID
// ============================================================
export const MOVES = {
  // STAB weak
  flame_nip: flameNip,
  water_splash: waterSplash,
  vine_whip: vineWhip,
  spark,
  pebble_toss: pebbleToss,
  mud_slap: mudSlap,
  poison_sting: poisonSting,

  // STAB medium
  fire_fang: fireFang,
  aqua_jet: aquaJet,
  leaf_blade: leafBlade,
  thunder_fang: thunderFang,
  rock_smash: rockSmash,
  earth_pound: earthPound,
  toxic_bite: toxicBite,

  // STAB strong
  inferno,
  hydro_cannon: hydroCannon,
  natures_wrath: naturesWrath,
  storm_strike: stormStrike,
  avalanche,
  earthquake,
  plague_strike: plagueStrike,

  // Normal damage
  tackle,
  scratch,
  strike,
  slam,

  // Status — Speedster
  speed_surge: speedSurge,
  quick_dodge: quickDodge,
  agility,

  // Status — Tank
  iron_wall: ironWall,
  recover,
  fortify,

  // Status — Glass Cannon
  focus_energy: focusEnergy,
  mind_sharpen: mindSharpen,
  power_surge: powerSurge,

  // Status — Bruiser
  war_cry: warCry,
  bulk_up: bulkUp,
  intimidate,

  // Off-type coverage
  rock_fang: rockFang,
  earth_stomp: earthStomp,
  poison_talon: poisonTalon,
  rock_charge: rockCharge,
  poison_spray: poisonSpray,
  rock_shell: rockShell,
  electric_surge: electricSurge,
  ground_pound: groundPound,
  electric_seed: electricSeed,
  ground_root: groundRoot,
  poison_lash: poisonLash,
  rock_thorn: rockThorn,
  grass_surge: grassSurge,
  rock_armor: rockArmor,
  fire_spark: fireSpark,
  ground_stomp: groundStomp,
  ground_roll: groundRoll,
  water_seep: waterSeep,
  fire_crunch: fireCrunch,
  grass_crush: grassCrush,
  poison_dust: poisonDust,
  rock_skin: rockSkin,
  grass_burrow: grassBurrow,
  fire_stomp: fireStomp,
  water_venom: waterVenom,
  ground_ooze: groundOoze,
  grass_spore: grassSpore,
  fire_venom: fireVenom,
}
