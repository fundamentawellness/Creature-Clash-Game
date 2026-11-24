// Evolution lines. Existing creatures stay the first form.
// Speedsters and glass cannons grow twice (levels 16 and 34).
// Tanks and bruisers grow once (level 18).

const LINES = {
  emberpaw: [
    { level: 16, id: 'emberfang', name: 'Emberfang', desc: 'A longer-legged fire wolf' },
    { level: 34, id: 'solmane', name: 'Solmane', desc: 'A sun-maned fire wolf', spriteId: 'blazant' },
  ],
  charrok: [
    { level: 18, id: 'charforge', name: 'Charforge', desc: 'A furnace-shelled tortoise' },
  ],
  blazicor: [
    { level: 16, id: 'blazewing', name: 'Blazewing', desc: 'A fire hawk with wider wings' },
    { level: 34, id: 'pyrexis', name: 'Pyrexis', desc: 'A comet-tailed fire hawk', spriteId: 'cindrake' },
  ],
  ignox: [
    { level: 18, id: 'ignarok', name: 'Ignarok', desc: 'A charging fire bull' },
  ],
  aquafin: [
    { level: 16, id: 'aquadash', name: 'Aquadash', desc: 'A streaking water dolphin' },
    { level: 34, id: 'tidewyrm', name: 'Tidewyrm', desc: 'A cresting sea serpent', spriteId: 'abysseel' },
  ],
  shellguard: [
    { level: 18, id: 'shellbastion', name: 'Shellbastion', desc: 'A fortress crab', spriteId: 'glacishell' },
  ],
  torrentis: [
    { level: 16, id: 'torrenthel', name: 'Torrenthel', desc: 'A coiling water serpent' },
    { level: 34, id: 'maelvon', name: 'Maelvon', desc: 'A storm-tide serpent', spriteId: 'riptooth' },
  ],
  tidalon: [
    { level: 18, id: 'tidalking', name: 'Tidalking', desc: 'A wave-shouldered bear' },
  ],
  leafyn: [
    { level: 16, id: 'leafrunner', name: 'Leafrunner', desc: 'A darting thicket sprite' },
    { level: 34, id: 'verdwisp', name: 'Verdwisp', desc: 'A glowing grove spirit', spriteId: 'elkroot' },
  ],
  mossback: [
    { level: 18, id: 'mossbulwark', name: 'Mossbulwark', desc: 'A living garden tortoise' },
  ],
  floravine: [
    { level: 16, id: 'florascourge', name: 'Florascourge', desc: 'A lashing flower vine' },
    { level: 34, id: 'bloomreaver', name: 'Bloomreaver', desc: 'A thorned bloom serpent', spriteId: 'serpentvine' },
  ],
  thornox: [
    { level: 18, id: 'thornram', name: 'Thornram', desc: 'A briar-crowned ram' },
  ],
  voltzap: [
    { level: 16, id: 'voltstreak', name: 'Voltstreak', desc: 'A lightning-quick ferret' },
    { level: 34, id: 'stormlash', name: 'Stormlash', desc: 'A crackling storm weasel', spriteId: 'zappadillo' },
  ],
  ampshell: [
    { level: 18, id: 'ampfort', name: 'Ampfort', desc: 'A charged iron armadillo' },
  ],
  strixion: [
    { level: 16, id: 'strixbolt', name: 'Strixbolt', desc: 'A thunder-eyed owl' },
    { level: 34, id: 'nyxbolt', name: 'Nyxbolt', desc: 'A night-storm owl', spriteId: 'stormhawk' },
  ],
  zaphorn: [
    { level: 18, id: 'zapcharger', name: 'Zapcharger', desc: 'A thunder-horn rhino' },
  ],
  pebblit: [
    { level: 16, id: 'pebbleap', name: 'Pebbleap', desc: 'A bounding stone runner' },
    { level: 34, id: 'cragracer', name: 'Cragracer', desc: 'A cliff-leaping boulder beast', spriteId: 'granitusk' },
  ],
  bouldar: [
    { level: 18, id: 'bouldkeep', name: 'Bouldkeep', desc: 'A walking stone keep' },
  ],
  cragmaw: [
    { level: 16, id: 'cragrip', name: 'Cragrip', desc: 'A snapping cliff jaw' },
    { level: 34, id: 'quarrion', name: 'Quarrion', desc: 'A quarry-born jaw beast', spriteId: 'crystajaw' },
  ],
  geolith: [
    { level: 18, id: 'geomight', name: 'Geomight', desc: 'A towering stone golem' },
  ],
  dustail: [
    { level: 16, id: 'dunewind', name: 'Dunewind', desc: 'A dune-skimming fox' },
    { level: 34, id: 'sandreign', name: 'Sandreign', desc: 'A desert storm fox', spriteId: 'dunewyrm' },
  ],
  mudhide: [
    { level: 18, id: 'mudrampart', name: 'Mudrampart', desc: 'A wall of living clay', spriteId: 'claymander' },
  ],
  quakern: [
    { level: 16, id: 'quakeburrow', name: 'Quakeburrow', desc: 'A deeper seismic mole' },
    { level: 34, id: 'seismole', name: 'Seismole', desc: 'A fault-line mole', spriteId: 'burrowl' },
  ],
  terrox: [
    { level: 18, id: 'terravault', name: 'Terravault', desc: 'A mountain-backed titan' },
  ],
  toxifin: [
    { level: 16, id: 'toxiflash', name: 'Toxiflash', desc: 'A venom-bright frog' },
    { level: 34, id: 'venomdash', name: 'Venomdash', desc: 'A streaking poison frog', spriteId: 'miasmorph' },
  ],
  sludgekin: [
    { level: 18, id: 'sludgewall', name: 'Sludgewall', desc: 'A towering ooze' },
  ],
  blightor: [
    { level: 16, id: 'blightwing', name: 'Blightwing', desc: 'A wider toxic moth' },
    { level: 34, id: 'plaguemoth', name: 'Plaguemoth', desc: 'A plague-winged moth', spriteId: 'scorplague' },
  ],
  venomaw: [
    { level: 18, id: 'venomjaw', name: 'Venomjaw', desc: 'A heavy-fanged viper', spriteId: 'rotbat' },
  ],
}

const ABILITY_BY_BASE = {
  emberpaw: 'ember_heart',
  charrok: 'sturdy',
  blazicor: 'ember_heart',
  ignox: 'guts',
  aquafin: 'tidewell',
  shellguard: 'stone_skin',
  torrentis: 'tidewell',
  tidalon: 'guts',
  leafyn: 'deep_roots',
  mossback: 'regrowth',
  floravine: 'deep_roots',
  thornox: 'guts',
  voltzap: 'quick_paws',
  ampshell: 'spark_hide',
  strixion: 'storm_cell',
  zaphorn: 'guts',
  pebblit: 'quick_paws',
  bouldar: 'sturdy',
  cragmaw: 'stone_skin',
  geolith: 'stone_skin',
  dustail: 'quick_paws',
  mudhide: 'mud_armor',
  quakern: 'hover',
  terrox: 'sturdy',
  toxifin: 'toxic_hide',
  sludgekin: 'poison_sip',
  blightor: 'toxic_hide',
  venomaw: 'guts',
}

const SIGNATURE_BY_TYPE = {
  fire: 'searing_snap',
  water: 'glacier_jet',
  grass: 'drowse',
  electric: 'static_jolt',
  rock: 'boulder_rush',
  ground: 'quake_slam',
  poison: 'venom_spit',
}

const STAGE_STAT_BONUS = [1, 1.12, 1.26]

function scaledStats(baseStats, stageIndex) {
  const mult = STAGE_STAT_BONUS[stageIndex] || 1
  const stats = {}
  for (const [key, value] of Object.entries(baseStats)) {
    stats[key] = Math.max(1, Math.round(value * mult))
  }
  return stats
}

export function evolutionLineOf(creatureId, creatures) {
  const creature = creatures?.[creatureId]
  const baseId = creature?.baseId || creatureId
  return { baseId, stages: LINES[baseId] || [] }
}

export function nextEvolution(creatureId, creatures) {
  const { stages } = evolutionLineOf(creatureId, creatures)
  const creature = creatures?.[creatureId]
  const index = creature?.stageIndex || 0
  return stages[index] || null
}

/** The form this line should be at a given level. */
export function formIdForLevel(baseId, level) {
  const stages = LINES[baseId] || []
  let id = baseId
  for (const stage of stages) {
    if (level >= stage.level) id = stage.id
    else break
  }
  return id
}

export function attachEvolutions(creatures) {
  for (const [baseId, stages] of Object.entries(LINES)) {
    const base = creatures[baseId]
    if (!base) continue
    base.ability = ABILITY_BY_BASE[baseId] || 'sturdy'
    base.baseId = baseId
    base.stageIndex = 0
    base.evolutions = stages.map(stage => ({ level: stage.level, id: stage.id, name: stage.name }))

    stages.forEach((stage, index) => {
      const stageIndex = index + 1
      const signature = SIGNATURE_BY_TYPE[base.type]
      const movePool = signature && !base.movePool.includes(signature)
        ? [...base.movePool, signature]
        : [...base.movePool]
      creatures[stage.id] = {
        id: stage.id,
        name: stage.name,
        type: base.type,
        archetype: base.archetype,
        desc: stage.desc,
        shape: base.shape,
        baseStats: scaledStats(base.baseStats, stageIndex),
        movePool,
        ability: base.ability,
        baseId,
        prevolution: index === 0 ? baseId : stages[index - 1].id,
        stageIndex,
        spriteId: stage.spriteId || baseId,
        evolutions: stages.slice(index + 1).map(next => ({ level: next.level, id: next.id, name: next.name })),
      }
    })
  }
}
