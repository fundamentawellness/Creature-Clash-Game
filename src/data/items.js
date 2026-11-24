// Bag items (used on your turn) and held items (passive, one per creature).

export const ITEMS = {
  potion: {
    id: 'potion', name: 'Potion', kind: 'heal', heal: 0.3,
    desc: 'Heals about a third of HP.',
  },
  super_potion: {
    id: 'super_potion', name: 'Super Potion', kind: 'heal', heal: 0.6,
    desc: 'Heals about two thirds of HP.',
  },
  remedy: {
    id: 'remedy', name: 'Remedy', kind: 'heal', heal: 1, cure: true,
    desc: 'Fully heals and clears status.',
  },
  tonic: {
    id: 'tonic', name: 'Tonic', kind: 'cure', cure: true,
    desc: 'Clears burn, poison, numb, sleep, or freeze.',
  },
  snack_berry: {
    id: 'snack_berry', name: 'Snack Berry', kind: 'held',
    desc: 'Heals a little HP at the end of each turn.',
  },
  power_band: {
    id: 'power_band', name: 'Power Band', kind: 'held',
    desc: 'Physical moves hit a bit harder.',
  },
  guard_charm: {
    id: 'guard_charm', name: 'Guard Charm', kind: 'held',
    desc: 'Takes a little less damage.',
  },
  quick_charm: {
    id: 'quick_charm', name: 'Quick Charm', kind: 'held',
    desc: 'A bit faster.',
  },
  focus_ribbon: {
    id: 'focus_ribbon', name: 'Focus Ribbon', kind: 'held',
    desc: 'Once each battle, survive a knock-out hit with 1 HP.',
  },
}

export const ITEM_LIST = Object.values(ITEMS)

export function isHeldItem(itemId) {
  return ITEMS[itemId]?.kind === 'held'
}

export function emptyBag() {
  return { potion: 2, tonic: 1 }
}

/** Story wins hand out a useful item. Replays still drop a potion sometimes. */
export function itemRewardForBattle(battleInfo, rng = Math.random) {
  if (!battleInfo) return null
  if (battleInfo.replay) return rng() < 0.35 ? 'potion' : null
  if (battleInfo.type === 'rival') {
    const byZone = { zone1: 'snack_berry', zone2: 'power_band', zone3: 'guard_charm', zone4: 'focus_ribbon' }
    return byZone[battleInfo.zoneId] || 'remedy'
  }
  if (battleInfo.type === 'leader') return rng() < 0.5 ? 'super_potion' : 'tonic'
  if (battleInfo.type === 'trainer') return rng() < 0.55 ? 'potion' : null
  return null
}

export function addItem(bag, itemId, count = 1) {
  const next = { ...(bag || {}) }
  next[itemId] = (next[itemId] || 0) + count
  return next
}
