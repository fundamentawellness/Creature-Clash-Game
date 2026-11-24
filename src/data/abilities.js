// One passive ability per creature. Short enough to read on a phone.

export const ABILITIES = {
  ember_heart: { id: 'ember_heart', name: 'Ember Heart', desc: 'Fire moves hit harder when HP is low.', pinch: 'fire' },
  tidewell: { id: 'tidewell', name: 'Tidewell', desc: 'Water moves hit harder when HP is low. From level 10, can swim you to the next island.', pinch: 'water', ferries: true },
  deep_roots: { id: 'deep_roots', name: 'Deep Roots', desc: 'Grass moves hit harder when HP is low.', pinch: 'grass' },
  storm_cell: { id: 'storm_cell', name: 'Storm Cell', desc: 'Electric moves hit harder when HP is low.', pinch: 'electric' },
  stone_skin: { id: 'stone_skin', name: 'Stone Skin', desc: 'Takes less damage from physical hits.', guard: 'physical' },
  mud_armor: { id: 'mud_armor', name: 'Mud Armor', desc: 'Takes less damage from special hits.', guard: 'special' },
  toxic_hide: { id: 'toxic_hide', name: 'Toxic Hide', desc: 'May poison a foe that hits it.', contact: 'poison' },
  spark_hide: { id: 'spark_hide', name: 'Spark Hide', desc: 'May numb a foe that hits it.', contact: 'paralysis' },
  flame_hide: { id: 'flame_hide', name: 'Flame Hide', desc: 'May burn a foe that hits it.', contact: 'burn' },
  quick_paws: { id: 'quick_paws', name: 'Quick Paws', desc: 'A little faster than it looks.', speed: 1.15 },
  sturdy: { id: 'sturdy', name: 'Sturdy', desc: 'Survives one knock-out hit each battle with 1 HP.', endure: true },
  regrowth: { id: 'regrowth', name: 'Regrowth', desc: 'Heals a little when switched out.', healOnSwitch: 0.15 },
  guts: { id: 'guts', name: 'Guts', desc: 'Hits harder while hurt by a status.', guts: true },
  early_riser: { id: 'early_riser', name: 'Early Riser', desc: 'Wakes up faster from sleep.', earlyRiser: true },
  hover: { id: 'hover', name: 'Hover', desc: 'Ground moves miss this creature.', hover: true },
  poison_sip: { id: 'poison_sip', name: 'Poison Sip', desc: 'Poison heals this creature instead of hurting it.', poisonSip: true },
}

export function getAbility(id) {
  return ABILITIES[id] || null
}
