// Ability, held item, and status tweaks on top of the raw damage roll.
import { getAbility } from '../data/abilities.js'
import { ITEMS } from '../data/items.js'

export function hpRatio(creature) {
  const max = creature?.currentStats?.hp || 1
  return (creature?.currentHp || 0) / max
}

export function battleSpeed(creature) {
  let speed = creature?.currentStats?.spd || 1
  const ability = getAbility(creature?.ability)
  if (ability?.speed) speed *= ability.speed
  if (creature?.heldItem === 'quick_charm') speed *= 1.12
  if (creature?.status?.id === 'paralysis') speed *= 0.5
  return speed
}

/**
 * Adjust a landed hit. Returns the new damage and notes for the log.
 */
export function modifyLandedDamage(damage, attacker, defender, move) {
  let next = damage
  const notes = []
  const atkAbility = getAbility(attacker?.ability)
  const defAbility = getAbility(defender?.ability)

  if (move?.type === 'ground' && defAbility?.hover) {
    return { damage: 0, immune: true, notes: ['Hover'] }
  }

  if (atkAbility?.pinch && move?.type === atkAbility.pinch && hpRatio(attacker) <= 0.33) {
    next = Math.floor(next * 1.5)
    notes.push(atkAbility.name)
  }

  if (atkAbility?.guts && attacker?.status && move?.category === 'physical') {
    next = Math.floor(next * 1.5)
    notes.push('Guts')
  } else if (attacker?.status?.id === 'burn' && move?.category === 'physical') {
    next = Math.floor(next * 0.75)
  }

  if (attacker?.heldItem === 'power_band' && move?.category === 'physical') {
    next = Math.floor(next * 1.15)
  }

  if (defAbility?.guard === move?.category) {
    next = Math.floor(next * 0.85)
    notes.push(defAbility.name)
  }
  if (defender?.heldItem === 'guard_charm') {
    next = Math.floor(next * 0.9)
  }

  if (ITEMS[defender?.heldItem]?.kind === 'held' && next < 1 && damage > 0) next = 1
  return { damage: Math.max(0, next), immune: false, notes }
}

export function endureHit(defender, damage) {
  if (!defender || defender.fainted) return null
  if (defender.currentHp <= 1) return null
  if (defender.currentHp - damage > 0) return null
  if (defender.endured) return null
  const ability = getAbility(defender.ability)
  if (ability?.endure || defender.heldItem === 'focus_ribbon') {
    return ability?.endure ? ability.name : 'Focus Ribbon'
  }
  return null
}
