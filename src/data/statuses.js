// Lasting battle conditions. One at a time. Cleared on switch or faint.

export const STATUSES = {
  burn: {
    id: 'burn',
    name: 'Burned',
    short: 'Burn',
    hint: 'Loses a little HP each turn and hits softer.',
    color: '#fc8181',
  },
  poison: {
    id: 'poison',
    name: 'Poisoned',
    short: 'Poison',
    hint: 'Loses HP each turn. It hurts more than a burn.',
    color: '#b794f4',
  },
  paralysis: {
    id: 'paralysis',
    name: 'Numb',
    short: 'Numb',
    hint: 'Might not move. Slower.',
    color: '#f6e05e',
  },
  sleep: {
    id: 'sleep',
    name: 'Asleep',
    short: 'Sleep',
    hint: 'Cannot move until it wakes.',
    color: '#90cdf4',
  },
  freeze: {
    id: 'freeze',
    name: 'Frozen',
    short: 'Frozen',
    hint: 'Stuck solid. A fire hit can thaw it.',
    color: '#e0f2fe',
  },
}

const IMMUNE = {
  burn: new Set(['fire']),
  poison: new Set(['poison']),
  paralysis: new Set(['electric']),
  freeze: new Set(['fire']),
  sleep: new Set(),
}

export function canBeStatused(creature, statusId) {
  if (!creature || creature.fainted) return false
  if (creature.status) return false
  const immune = IMMUNE[statusId]
  if (immune?.has(creature.type)) return false
  return !!STATUSES[statusId]
}

export function makeStatus(statusId, rng = Math.random) {
  const base = { id: statusId }
  if (statusId === 'sleep') {
    // 1 to 3 turns, counted down at the start of the creature's action.
    base.turns = 1 + Math.floor(rng() * 3)
  }
  return base
}

export function statusLabel(status) {
  if (!status) return ''
  return STATUSES[status.id]?.short || status.id
}
