// Campaign data — 4 zones, 16 gyms, 68 total battles
// All gym names, leader names, type pairings, dialogue, and trainer compositions

// Trainer name pool
const NAMES = ['Alex','Brin','Cole','Dana','Eli','Faye','Gus','Hana','Ivy','Jace','Kit','Luna','Max','Nina','Oro','Pip','Quinn','Reva','Sam','Tess']

// Title by primary type
const TYPE_TITLES = {
  fire: 'Fire Breather', water: 'Swimmer', grass: 'Ranger',
  electric: 'Engineer', rock: 'Hiker', ground: 'Excavator', poison: 'Chemist',
}

let _nameIdx = 0
function trainerName(type) {
  const name = NAMES[_nameIdx % NAMES.length]
  _nameIdx++
  return { name, title: `${TYPE_TITLES[type]} ${name}` }
}

// Helper to build a trainer object
function trainer(primaryType, creatures) {
  const { name, title } = trainerName(primaryType)
  return { name, title, creatures, teamSize: 3 }
}

// ============================================================
// ZONE 1 — GREENRIDGE
// ============================================================
const ZONE_1 = {
  id: 'zone1',
  name: 'Greenridge',
  description: 'Teaches basics, simple type matchups',
  levelRange: [1, 3],
  trainersPerGym: 2,
  aiConfig: { optimalChance: 0.50, switchBehavior: 'never', teamBuild: 'random' },
  leaderAiConfig: { optimalChance: 0.65, switchBehavior: 'never', teamBuild: 'typeCoverage' },
  maxTeamSize: 3,
  gyms: [
    {
      id: 'z1g1', name: 'Thornridge Gym', zone: 'zone1',
      types: ['grass', 'rock'],
      badge: { name: 'Thornridge Badge', icon: '🌿' },
      trainers: [
        trainer('grass', [{ id: 'leafyn', level: 1 }, { id: 'mossback', level: 1 }]),
        trainer('rock', [{ id: 'pebblit', level: 1 }, { id: 'bouldar', level: 2 }]),
      ],
      leader: {
        name: 'Marcus', types: ['grass', 'rock'],
        creatures: [{ id: 'leafyn', level: 2 }, { id: 'thornox', level: 3 }, { id: 'bouldar', level: 3 }],
        preBattleDialogue: 'The forest teaches patience. Let\'s see if you\'ve learned.',
        postDefeatDialogue: 'Hmm. The forest chose well with you.',
        teamSize: 3,
      },
    },
    {
      id: 'z1g2', name: 'Ember Hollow Gym', zone: 'zone1',
      types: ['fire', 'ground'],
      badge: { name: 'Ember Badge', icon: '🔥' },
      trainers: [
        trainer('fire', [{ id: 'emberpaw', level: 1 }, { id: 'charrok', level: 2 }]),
        trainer('ground', [{ id: 'dustail', level: 1 }, { id: 'mudhide', level: 2 }]),
      ],
      leader: {
        name: 'Sera', types: ['fire', 'ground'],
        creatures: [{ id: 'emberpaw', level: 2 }, { id: 'ignox', level: 3 }, { id: 'terrox', level: 3 }],
        preBattleDialogue: 'Fire and earth — nothing survives both.',
        postDefeatDialogue: 'You walked through the flames. Impressive.',
        teamSize: 3,
      },
    },
    {
      id: 'z1g3', name: 'Tidemarsh Gym', zone: 'zone1',
      types: ['water', 'poison'],
      badge: { name: 'Tidemarsh Badge', icon: '🌊' },
      trainers: [
        trainer('water', [{ id: 'aquafin', level: 1 }, { id: 'shellguard', level: 2 }]),
        trainer('poison', [{ id: 'toxifin', level: 1 }, { id: 'sludgekin', level: 2 }]),
      ],
      leader: {
        name: 'Kai', types: ['water', 'poison'],
        creatures: [{ id: 'aquafin', level: 2 }, { id: 'tidalon', level: 3 }, { id: 'venomaw', level: 3 }],
        preBattleDialogue: 'The tide waits for no one. Neither do I.',
        postDefeatDialogue: 'You swim against the current well.',
        teamSize: 3,
      },
    },
    {
      id: 'z1g4', name: 'Sparkstone Gym', zone: 'zone1',
      types: ['electric', 'rock'],
      badge: { name: 'Sparkstone Badge', icon: '⚡' },
      trainers: [
        trainer('electric', [{ id: 'voltzap', level: 1 }, { id: 'ampshell', level: 2 }]),
        trainer('rock', [{ id: 'cragmaw', level: 2 }, { id: 'geolith', level: 2 }]),
      ],
      leader: {
        name: 'Lina', types: ['electric', 'rock'],
        creatures: [{ id: 'voltzap', level: 2 }, { id: 'zaphorn', level: 3 }, { id: 'geolith', level: 3 }],
        preBattleDialogue: 'Sparks and stone. Try not to get crushed.',
        postDefeatDialogue: 'Okay, you\'ve got real spark. Take this badge.',
        teamSize: 3,
      },
    },
  ],
  rival: {
    id: 'rival1', zone: 'zone1', level: 4, teamSize: 3,
    aiConfig: { optimalChance: 0.50, switchBehavior: 'never', teamBuild: 'typeCoverage' },
    preBattleDialogue: 'You actually think you can beat me? This\'ll be quick.',
    postDefeatDialogue: 'Lucky. Enjoy it while it lasts.',
    reward: 'teamPresets',
    rewardTitle: 'TEAM PRESETS UNLOCKED',
    rewardDescription: 'Save multiple team loadouts from the Team Select screen.',
  },
}

// ============================================================
// ZONE 2 — CRAGMOOR
// ============================================================
const ZONE_2 = {
  id: 'zone2',
  name: 'Cragmoor',
  description: 'Types start countering each other within gyms',
  levelRange: [3, 6],
  trainersPerGym: 3,
  aiConfig: { optimalChance: 0.65, switchBehavior: 'disadvantage', teamBuild: 'typeCoverage' },
  leaderAiConfig: { optimalChance: 0.80, switchBehavior: 'disadvantage', teamBuild: 'typeCoverage' },
  maxTeamSize: 3,
  gyms: [
    {
      id: 'z2g1', name: 'Mirevine Gym', zone: 'zone2',
      types: ['poison', 'grass'],
      badge: { name: 'Mirevine Badge', icon: '☠️' },
      trainers: [
        trainer('poison', [{ id: 'toxifin', level: 3 }, { id: 'sludgekin', level: 3 }]),
        trainer('grass', [{ id: 'floravine', level: 3 }, { id: 'mossback', level: 4 }]),
        trainer('poison', [{ id: 'blightor', level: 4 }, { id: 'leafyn', level: 4 }]),
      ],
      leader: {
        name: 'Thorn', types: ['poison', 'grass'],
        creatures: [{ id: 'venomaw', level: 5 }, { id: 'thornox', level: 5 }, { id: 'blightor', level: 6 }],
        preBattleDialogue: 'Venom and vine. One poisons, the other holds you still.',
        postDefeatDialogue: 'You cut through... I didn\'t expect that.',
        teamSize: 3,
      },
    },
    {
      id: 'z2g2', name: 'Deepcharge Gym', zone: 'zone2',
      types: ['ground', 'electric'],
      badge: { name: 'Deepcharge Badge', icon: '🔌' },
      trainers: [
        trainer('ground', [{ id: 'dustail', level: 3 }, { id: 'mudhide', level: 4 }]),
        trainer('electric', [{ id: 'strixion', level: 3 }, { id: 'ampshell', level: 4 }]),
        trainer('ground', [{ id: 'quakern', level: 4 }, { id: 'voltzap', level: 4 }]),
      ],
      leader: {
        name: 'Volt', types: ['ground', 'electric'],
        creatures: [{ id: 'terrox', level: 5 }, { id: 'zaphorn', level: 5 }, { id: 'quakern', level: 6 }],
        preBattleDialogue: 'The ground channels what the sky sends down.',
        postDefeatDialogue: 'Grounded and electric. You\'re full of contradictions.',
        teamSize: 3,
      },
    },
    {
      id: 'z2g3', name: 'Scorchrock Gym', zone: 'zone2',
      types: ['fire', 'rock'],
      badge: { name: 'Scorchrock Badge', icon: '🪨' },
      trainers: [
        trainer('fire', [{ id: 'blazicor', level: 3 }, { id: 'charrok', level: 4 }]),
        trainer('rock', [{ id: 'bouldar', level: 4 }, { id: 'geolith', level: 4 }]),
        trainer('fire', [{ id: 'ignox', level: 4 }, { id: 'pebblit', level: 4 }]),
      ],
      leader: {
        name: 'Blaze', types: ['fire', 'rock'],
        creatures: [{ id: 'ignox', level: 5 }, { id: 'cragmaw', level: 5 }, { id: 'blazicor', level: 6 }],
        preBattleDialogue: 'Molten rock. Can\'t dodge what fills the whole arena.',
        postDefeatDialogue: 'You found a way through the fire. Respect.',
        teamSize: 3,
      },
    },
    {
      id: 'z2g4', name: 'Murkshore Gym', zone: 'zone2',
      types: ['water', 'ground'],
      badge: { name: 'Murkshore Badge', icon: '💧' },
      trainers: [
        trainer('water', [{ id: 'torrentis', level: 4 }, { id: 'shellguard', level: 4 }]),
        trainer('ground', [{ id: 'mudhide', level: 4 }, { id: 'terrox', level: 5 }]),
        trainer('water', [{ id: 'tidalon', level: 4 }, { id: 'dustail', level: 5 }]),
      ],
      leader: {
        name: 'Marina', types: ['water', 'ground'],
        creatures: [{ id: 'tidalon', level: 5 }, { id: 'mudhide', level: 5 }, { id: 'torrentis', level: 6 }],
        preBattleDialogue: 'Mud swallows, waves crash. Pick your problem.',
        postDefeatDialogue: 'You stayed afloat. Not many do.',
        teamSize: 3,
      },
    },
  ],
  rival: {
    id: 'rival2', zone: 'zone2', level: 7, teamSize: 3,
    aiConfig: { optimalChance: 0.75, switchBehavior: 'disadvantage', teamBuild: 'typeCoverage' },
    preBattleDialogue: 'I\'ve been training. You\'re not ready for this.',
    postDefeatDialogue: 'Okay... you\'re decent. But the next region will break you.',
    reward: 'fourthTeamSlot',
    rewardTitle: 'TEAM EXPANDED!',
    rewardDescription: 'You can now bring 4 creatures into battle.',
  },
}

// ============================================================
// ZONE 3 — STORMREACH
// ============================================================
const ZONE_3 = {
  id: 'zone3',
  name: 'Stormreach',
  description: 'Tricky pairings, punishes one-dimensional teams',
  levelRange: [6, 9],
  trainersPerGym: 3,
  aiConfig: { optimalChance: 0.80, switchBehavior: 'strategic', teamBuild: 'typeCoverage' },
  leaderAiConfig: { optimalChance: 0.90, switchBehavior: 'strategic', teamBuild: 'optimized' },
  maxTeamSize: 4,
  gyms: [
    {
      id: 'z3g1', name: 'Surgevault Gym', zone: 'zone3',
      types: ['electric', 'water'],
      badge: { name: 'Surgevault Badge', icon: '🌩️' },
      trainers: [
        trainer('electric', [{ id: 'voltzap', level: 6 }, { id: 'ampshell', level: 6 }, { id: 'strixion', level: 7 }]),
        trainer('water', [{ id: 'aquafin', level: 6 }, { id: 'shellguard', level: 7 }, { id: 'torrentis', level: 7 }]),
        trainer('electric', [{ id: 'zaphorn', level: 7 }, { id: 'strixion', level: 7 }, { id: 'tidalon', level: 7 }]),
      ],
      leader: {
        name: 'Rai', types: ['electric', 'water'],
        creatures: [{ id: 'zaphorn', level: 8 }, { id: 'tidalon', level: 8 }, { id: 'ampshell', level: 8 }, { id: 'torrentis', level: 9 }],
        preBattleDialogue: 'Water conducts. One wrong move and everything lights up.',
        postDefeatDialogue: 'You read the current perfectly. Well played.',
        teamSize: 4,
      },
    },
    {
      id: 'z3g2', name: 'Blightmoor Gym', zone: 'zone3',
      types: ['poison', 'ground'],
      badge: { name: 'Blightmoor Badge', icon: '🧪' },
      trainers: [
        trainer('poison', [{ id: 'toxifin', level: 6 }, { id: 'sludgekin', level: 7 }, { id: 'blightor', level: 7 }]),
        trainer('ground', [{ id: 'dustail', level: 6 }, { id: 'mudhide', level: 7 }, { id: 'quakern', level: 7 }]),
        trainer('poison', [{ id: 'venomaw', level: 7 }, { id: 'blightor', level: 7 }, { id: 'terrox', level: 7 }]),
      ],
      leader: {
        name: 'Nyx', types: ['poison', 'ground'],
        creatures: [{ id: 'venomaw', level: 8 }, { id: 'terrox', level: 8 }, { id: 'sludgekin', level: 8 }, { id: 'quakern', level: 9 }],
        preBattleDialogue: 'The earth absorbs poison. Together they consume everything.',
        postDefeatDialogue: 'You purified what I thought was unbeatable.',
        teamSize: 4,
      },
    },
    {
      id: 'z3g3', name: 'Wildfire Gym', zone: 'zone3',
      types: ['grass', 'fire'],
      badge: { name: 'Wildfire Badge', icon: '🍃' },
      trainers: [
        trainer('grass', [{ id: 'leafyn', level: 6 }, { id: 'mossback', level: 7 }, { id: 'floravine', level: 7 }]),
        trainer('fire', [{ id: 'emberpaw', level: 6 }, { id: 'charrok', level: 7 }, { id: 'blazicor', level: 7 }]),
        trainer('grass', [{ id: 'thornox', level: 7 }, { id: 'floravine', level: 7 }, { id: 'ignox', level: 7 }]),
      ],
      leader: {
        name: 'Ashe', types: ['grass', 'fire'],
        creatures: [{ id: 'thornox', level: 8 }, { id: 'blazicor', level: 8 }, { id: 'mossback', level: 8 }, { id: 'ignox', level: 9 }],
        preBattleDialogue: 'Fire burns the forest. The forest grows back stronger.',
        postDefeatDialogue: 'You understood the cycle better than I did.',
        teamSize: 4,
      },
    },
    {
      id: 'z3g4', name: 'Coralcrag Gym', zone: 'zone3',
      types: ['rock', 'water'],
      badge: { name: 'Coralcrag Badge', icon: '🪸' },
      trainers: [
        trainer('rock', [{ id: 'pebblit', level: 6 }, { id: 'bouldar', level: 7 }, { id: 'cragmaw', level: 7 }]),
        trainer('water', [{ id: 'aquafin', level: 7 }, { id: 'shellguard', level: 7 }, { id: 'tidalon', level: 7 }]),
        trainer('rock', [{ id: 'geolith', level: 7 }, { id: 'cragmaw', level: 7 }, { id: 'torrentis', level: 7 }]),
      ],
      leader: {
        name: 'Reed', types: ['rock', 'water'],
        creatures: [{ id: 'geolith', level: 8 }, { id: 'tidalon', level: 8 }, { id: 'cragmaw', level: 8 }, { id: 'shellguard', level: 9 }],
        preBattleDialogue: 'Coral is rock shaped by water. Patience made lethal.',
        postDefeatDialogue: 'You shattered what took me years to build.',
        teamSize: 4,
      },
    },
  ],
  rival: {
    id: 'rival3', zone: 'zone3', level: 10, teamSize: 4,
    aiConfig: { optimalChance: 1.0, switchBehavior: 'strategic', teamBuild: 'optimized' },
    preBattleDialogue: 'I rebuilt my entire team just to beat YOU.',
    postDefeatDialogue: '...Fine. One more shot. The Elite Region. Everything I\'ve got.',
    reward: 'moveTutor',
    rewardTitle: 'MOVE TUTOR UNLOCKED',
    rewardDescription: 'Re-learn forgotten moves from the main menu.',
  },
}

// ============================================================
// ZONE 4 — IRONSPIRE
// ============================================================
const ZONE_4 = {
  id: 'zone4',
  name: 'Ironspire',
  description: 'Elite difficulty, AI plays at maximum',
  levelRange: [9, 12],
  trainersPerGym: 4,
  aiConfig: { optimalChance: 0.90, switchBehavior: 'strategic', teamBuild: 'optimized' },
  leaderAiConfig: { optimalChance: 0.95, switchBehavior: 'proactive', teamBuild: 'optimized' },
  maxTeamSize: 4,
  gyms: [
    {
      id: 'z4g1', name: 'Venomcore Gym', zone: 'zone4',
      types: ['ground', 'poison'],
      badge: { name: 'Venomcore Badge', icon: '💀' },
      trainers: [
        trainer('ground', [{ id: 'dustail', level: 9 }, { id: 'mudhide', level: 9 }, { id: 'terrox', level: 10 }]),
        trainer('poison', [{ id: 'toxifin', level: 9 }, { id: 'sludgekin', level: 10 }, { id: 'blightor', level: 10 }]),
        trainer('ground', [{ id: 'quakern', level: 10 }, { id: 'venomaw', level: 10 }, { id: 'mudhide', level: 10 }]),
        trainer('poison', [{ id: 'blightor', level: 10 }, { id: 'terrox', level: 10 }, { id: 'venomaw', level: 10 }]),
      ],
      leader: {
        name: 'Vex', types: ['ground', 'poison'],
        creatures: [{ id: 'terrox', level: 11 }, { id: 'venomaw', level: 11 }, { id: 'quakern', level: 11 }, { id: 'blightor', level: 12 }],
        preBattleDialogue: 'Toxic ground. Every step is a mistake waiting to happen.',
        postDefeatDialogue: 'You walked the poison path without flinching.',
        teamSize: 4,
      },
    },
    {
      id: 'z4g2', name: 'Thunderforge Gym', zone: 'zone4',
      types: ['fire', 'electric'],
      badge: { name: 'Thunderforge Badge', icon: '⚔️' },
      trainers: [
        trainer('fire', [{ id: 'emberpaw', level: 9 }, { id: 'charrok', level: 10 }, { id: 'blazicor', level: 10 }]),
        trainer('electric', [{ id: 'voltzap', level: 9 }, { id: 'ampshell', level: 10 }, { id: 'strixion', level: 10 }]),
        trainer('fire', [{ id: 'ignox', level: 10 }, { id: 'blazicor', level: 10 }, { id: 'zaphorn', level: 10 }]),
        trainer('electric', [{ id: 'strixion', level: 10 }, { id: 'charrok', level: 10 }, { id: 'ampshell', level: 10 }]),
      ],
      leader: {
        name: 'Kira', types: ['fire', 'electric'],
        creatures: [{ id: 'ignox', level: 11 }, { id: 'zaphorn', level: 11 }, { id: 'blazicor', level: 11 }, { id: 'strixion', level: 12 }],
        preBattleDialogue: 'Lightning strikes twice when I\'m around. Fire finishes what\'s left.',
        postDefeatDialogue: 'I threw everything. You\'re still standing.',
        teamSize: 4,
      },
    },
    {
      id: 'z4g3', name: 'Rootsea Gym', zone: 'zone4',
      types: ['water', 'grass'],
      badge: { name: 'Rootsea Badge', icon: '🌱' },
      trainers: [
        trainer('water', [{ id: 'aquafin', level: 9 }, { id: 'shellguard', level: 10 }, { id: 'torrentis', level: 10 }]),
        trainer('grass', [{ id: 'leafyn', level: 9 }, { id: 'mossback', level: 10 }, { id: 'floravine', level: 10 }]),
        trainer('water', [{ id: 'tidalon', level: 10 }, { id: 'torrentis', level: 10 }, { id: 'thornox', level: 10 }]),
        trainer('grass', [{ id: 'floravine', level: 10 }, { id: 'shellguard', level: 10 }, { id: 'mossback', level: 10 }]),
      ],
      leader: {
        name: 'Coral', types: ['water', 'grass'],
        creatures: [{ id: 'tidalon', level: 11 }, { id: 'thornox', level: 11 }, { id: 'torrentis', level: 11 }, { id: 'floravine', level: 12 }],
        preBattleDialogue: 'The deep forest meets the deep ocean. There\'s no air here.',
        postDefeatDialogue: 'You found oxygen where there was none.',
        teamSize: 4,
      },
    },
    {
      id: 'z4g4', name: 'Obsidian Spire Gym', zone: 'zone4',
      types: ['rock', 'poison'],
      badge: { name: 'Obsidian Badge', icon: '🏔️' },
      trainers: [
        trainer('rock', [{ id: 'pebblit', level: 9 }, { id: 'bouldar', level: 10 }, { id: 'cragmaw', level: 10 }]),
        trainer('poison', [{ id: 'toxifin', level: 10 }, { id: 'sludgekin', level: 10 }, { id: 'blightor', level: 10 }]),
        trainer('rock', [{ id: 'geolith', level: 10 }, { id: 'cragmaw', level: 10 }, { id: 'venomaw', level: 10 }]),
        trainer('poison', [{ id: 'blightor', level: 10 }, { id: 'bouldar', level: 10 }, { id: 'sludgekin', level: 11 }]),
      ],
      leader: {
        name: 'Slade', types: ['rock', 'poison'],
        creatures: [{ id: 'geolith', level: 11 }, { id: 'venomaw', level: 11 }, { id: 'cragmaw', level: 11 }, { id: 'blightor', level: 12 }],
        preBattleDialogue: 'Obsidian and venom. The last gym for a reason.',
        postDefeatDialogue: 'No one\'s beaten me this season. Until now.',
        teamSize: 4,
      },
    },
  ],
  rival: {
    id: 'rival4', zone: 'zone4', level: 12, teamSize: 4,
    aiConfig: { optimalChance: 1.0, switchBehavior: 'proactive', teamBuild: 'optimized' },
    preBattleDialogue: 'This ends now. No excuses. Winner takes all.',
    postDefeatDialogue: '...You actually did it. I hate admitting it, but you\'re the best.',
    reward: 'creatureForge',
    rewardTitle: 'CHAMPION',
    rewardDescription: 'Creature Forge unlocked! Design your own creatures from the art bank.',
  },
}

// ============================================================
// EXPORTS
// ============================================================

export const ZONES = [ZONE_1, ZONE_2, ZONE_3, ZONE_4]

export const ALL_GYMS = ZONES.flatMap(z => z.gyms)

export const ALL_RIVALS = ZONES.map(z => z.rival)

export const CAMPAIGN_REWARDS = {
  teamPresets: { title: 'Team Presets', description: 'Save and load team loadouts' },
  fourthTeamSlot: { title: '4th Team Slot', description: 'Bring 4 creatures into battle' },
  moveTutor: { title: 'Move Tutor', description: 'Re-learn forgotten moves' },
  creatureForge: { title: 'Creature Forge', description: 'Design custom creatures' },
  championTitle: { title: 'Champion', description: 'You are the champion!' },
}

/** Look up a gym by its ID */
export function getGymById(gymId) {
  return ALL_GYMS.find(g => g.id === gymId) || null
}

/** Find which zone a gym belongs to */
export function getZoneByGymId(gymId) {
  return ZONES.find(z => z.gyms.some(g => g.id === gymId)) || null
}

/** Get zone by ID */
export function getZoneById(zoneId) {
  return ZONES.find(z => z.id === zoneId) || null
}

/** Get rival for a zone */
export function getRivalByZone(zoneId) {
  return ZONES.find(z => z.id === zoneId)?.rival || null
}

/**
 * Get the AI config for a specific battle.
 * Leaders and rivals have their own config; trainers use zone defaults.
 */
export function getAiConfigForBattle(battleInfo) {
  if (battleInfo.type === 'rival') {
    const rival = getRivalByZone(battleInfo.zoneId)
    return rival?.aiConfig || { optimalChance: 0.5, switchBehavior: 'never', teamBuild: 'random' }
  }
  const zone = battleInfo.zoneId ? getZoneById(battleInfo.zoneId) : getZoneByGymId(battleInfo.gymId)
  if (!zone) return { optimalChance: 0.5, switchBehavior: 'never', teamBuild: 'random' }
  if (battleInfo.type === 'leader') return zone.leaderAiConfig
  return zone.aiConfig
}

/**
 * Get the max team size for a battle (enforced for both sides).
 * Zone 1-2: always 3. Zone 3-4 leaders/rivals: 4. Zone 3-4 trainers: 3.
 */
export function getBattleTeamSize(battleInfo) {
  const zone = battleInfo.zoneId ? getZoneById(battleInfo.zoneId) : getZoneByGymId(battleInfo.gymId)
  if (!zone) return 3
  if (zone.maxTeamSize <= 3) return 3
  // Zone 3-4: leaders and rivals get 4, trainers get 3
  if (battleInfo.type === 'leader' || battleInfo.type === 'rival') return 4
  return 3
}

/**
 * Build a rival team that counter-picks the player's most-used types.
 * Returns array of { id, level } specs.
 */
export function buildRivalTeam(playerTypeCounts, rivalLevel, rivalTeamSize, allCreaturesList) {
  // Find player's top types
  const sorted = Object.entries(playerTypeCounts || {}).sort((a, b) => b[1] - a[1])
  const topTypes = sorted.slice(0, 2).map(([t]) => t)

  // Type effectiveness: find types that are strong against the player's top types
  const TYPE_COUNTERS = {
    fire: ['water', 'ground', 'rock'],
    water: ['grass', 'electric'],
    grass: ['fire', 'poison', 'rock'],
    electric: ['ground'],
    rock: ['water', 'grass', 'ground'],
    ground: ['water', 'grass'],
    poison: ['ground'],
  }

  const counterTypes = new Set()
  for (const t of topTypes) {
    for (const c of (TYPE_COUNTERS[t] || [])) {
      counterTypes.add(c)
    }
  }

  // Pick creatures from counter types
  const counterCreatures = allCreaturesList.filter(c => counterTypes.has(c.type))
  const otherCreatures = allCreaturesList.filter(c => !counterTypes.has(c.type))

  const team = []
  const usedIds = new Set()
  const archetypes = ['speedster', 'tank', 'glass_cannon', 'bruiser']

  // Try to fill with counter creatures first, then others
  const pool = [...counterCreatures, ...otherCreatures]
  for (const creature of pool) {
    if (team.length >= rivalTeamSize) break
    if (usedIds.has(creature.id)) continue
    // For rival 4, try to get different archetypes
    if (rivalTeamSize >= 4 && team.length < 4) {
      const usedArchetypes = team.map(t => allCreaturesList.find(c => c.id === t.id)?.archetype)
      if (usedArchetypes.includes(creature.archetype) && pool.filter(c => !usedIds.has(c.id)).length > rivalTeamSize - team.length) continue
    }
    team.push({ id: creature.id, level: rivalLevel })
    usedIds.add(creature.id)
  }

  // Fill remaining slots if needed
  while (team.length < rivalTeamSize) {
    const remaining = allCreaturesList.find(c => !usedIds.has(c.id))
    if (!remaining) break
    team.push({ id: remaining.id, level: rivalLevel })
    usedIds.add(remaining.id)
  }

  return team
}
