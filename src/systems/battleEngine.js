// Battle engine — orchestrates turns, produces event arrays for rendering
// Pure functions. No DOM, no Phaser, no side effects beyond state mutation.
import { MOVES } from '../data/moves.js'
import { CREATURES } from '../data/creatures.js'
import { calculateDamage, getEffectivenessText } from './damage.js'
import { applyStatStage, resetStages, recalcCurrentStats, getEffectiveStat } from './statStages.js'
import { aiChooseAction } from './ai.js'
import { canBeStatused, makeStatus, STATUSES } from '../data/statuses.js'
import { ITEMS } from '../data/items.js'
import { getAbility } from '../data/abilities.js'
import { battleSpeed, endureHit } from './battleMods.js'

/**
 * Create a battle-ready creature from save state.
 * Populates currentStats, currentHp, statStages, etc.
 */
export function createBattleCreature(saveState, creaturesLookup) {
  const template = (creaturesLookup || CREATURES)[saveState.id]
  if (!template) return null

  const creature = {
    ...template,
    level: saveState.level || 1,
    currentMoves: saveState.currentMoves || [template.movePool[0], template.movePool[1]],
    statStages: { atk: 0, def: 0, spd: 0, spc: 0, evasion: 0 },
    baseStats: { ...template.baseStats },
    currentStats: {},
    currentHp: 0,
    fainted: false,
    status: null,
    ability: template.ability || null,
    heldItem: saveState.heldItem || null,
    endured: false,
  }

  recalcCurrentStats(creature)
  creature.currentHp = creature.currentStats.hp

  return creature
}

/**
 * Determine turn order based on speed. Higher speed goes first.
 * Returns 'player' or 'ai'.
 */
export function determineTurnOrder(playerCreature, aiCreature) {
  const playerSpd = battleSpeed(playerCreature) || getEffectiveStat(playerCreature, 'spd')
  const aiSpd = battleSpeed(aiCreature) || getEffectiveStat(aiCreature, 'spd')

  if (playerSpd > aiSpd) return 'player'
  if (aiSpd > playerSpd) return 'ai'
  // Speed tie: random
  return Math.random() < 0.5 ? 'player' : 'ai'
}

/**
 * Apply a status move effect. Returns events describing what happened.
 */
function applyStatusEffect(move, user, target, userLabel) {
  const events = []

  if (!move.effect) return events

  // Healing
  if (move.effect.heal) {
    const maxHp = user.currentStats.hp
    const healAmount = Math.floor(maxHp * move.effect.heal)
    const actualHeal = Math.min(healAmount, maxHp - user.currentHp)
    user.currentHp = Math.min(maxHp, user.currentHp + healAmount)
    events.push({
      type: 'heal',
      data: { creature: userLabel, name: user.name, amount: actualHeal, newHp: user.currentHp, maxHp },
    })
  }

  if (move.effect.status && canBeStatused(target, move.effect.status)) {
    target.status = makeStatus(move.effect.status)
    const info = STATUSES[move.effect.status]
    events.push({
      type: 'status',
      data: {
        creature: move.effect.target === 'self' ? userLabel : (userLabel === 'player' ? 'ai' : 'player'),
        name: target.name,
        status: move.effect.status,
        label: `${target.name} is ${info?.name?.toLowerCase() || move.effect.status}!`,
      },
    })
  }

  // Stat changes
  if (move.effect.stats) {
    const affectedCreature = move.effect.target === 'self' ? user : target
    const affectedLabel = move.effect.target === 'self' ? userLabel : (userLabel === 'player' ? 'ai' : 'player')

    for (const [stat, change] of Object.entries(move.effect.stats)) {
      const actualChange = applyStatStage(affectedCreature, stat, change)
      recalcCurrentStats(affectedCreature)

      events.push({
        type: 'statChange',
        data: {
          creature: affectedLabel,
          name: affectedCreature.name,
          stat,
          change: actualChange,
          requestedChange: change,
          newStage: affectedCreature.statStages[stat],
        },
      })
    }
  }

  return events
}

/**
 * Execute one side's attack action. Returns events.
 */
function tryInflict(defender, statusId, defenderLabel, events, chance = 1) {
  if (!statusId || Math.random() > chance) return
  if (!canBeStatused(defender, statusId)) return
  defender.status = makeStatus(statusId)
  const info = STATUSES[statusId]
  events.push({
    type: 'status',
    data: { creature: defenderLabel, name: defender.name, status: statusId, label: info?.name || statusId },
  })
}

function blockedAction(attacker, attackerLabel) {
  const status = attacker.status
  if (!status) return null
  if (status.id === 'sleep') {
    const extra = getAbility(attacker.ability)?.earlyRiser ? 1 : 0
    status.turns = (status.turns || 1) - 1 - extra
    if (status.turns <= 0) {
      attacker.status = null
      return { woke: true }
    }
    return { text: `${attacker.name} is fast asleep!`, creature: attackerLabel }
  }
  if (status.id === 'freeze') {
    if (Math.random() < 0.3) {
      attacker.status = null
      return { woke: true, text: `${attacker.name} thawed out!` }
    }
    return { text: `${attacker.name} is frozen solid!`, creature: attackerLabel }
  }
  if (status.id === 'paralysis' && Math.random() < 0.25) {
    return { text: `${attacker.name} is too numb to move!`, creature: attackerLabel }
  }
  return null
}

function executeAttack(attacker, move, defender, attackerLabel, typeChart) {
  const events = []
  const defenderLabel = attackerLabel === 'player' ? 'ai' : 'player'

  const block = blockedAction(attacker, attackerLabel)
  if (block?.woke && block.text) {
    events.push({ type: 'status', data: { creature: attackerLabel, name: attacker.name, status: null, label: block.text } })
  }
  if (block && !block.woke) {
    events.push({ type: 'statusBlock', data: { creature: attackerLabel, name: attacker.name, text: block.text } })
    return events
  }

  events.push({
    type: 'attack',
    data: { creature: attackerLabel, name: attacker.name, move: move.name, moveType: move.type },
  })

  // Status moves
  if (move.category === 'status') {
    const statusEvents = applyStatusEffect(move, attacker, defender, attackerLabel)
    events.push(...statusEvents)
    return events
  }

  // Damage moves
  const result = calculateDamage(attacker, move, defender, Math.random, typeChart)

  if (result.missed) {
    events.push({
      type: 'miss',
      data: { creature: attackerLabel, name: attacker.name, move: move.name, dodged: !!result.dodged },
    })
    return events
  }

  if (result.stab) {
    events.push({
      type: 'stab',
      data: { creature: attackerLabel, name: attacker.name },
    })
  }

  const effText = getEffectivenessText(result.effectiveness)
  if (effText) {
    events.push({
      type: 'effectiveness',
      data: { text: effText, multiplier: result.effectiveness, creature: defenderLabel },
    })
  }

  if (result.effectiveness === 0) {
    return events
  }

  let damage = result.damage
  const endure = endureHit(defender, damage)
  if (endure) {
    damage = defender.currentHp - 1
    defender.endured = true
    events.push({
      type: 'endure',
      data: { creature: defenderLabel, name: defender.name, source: endure },
    })
  }

  // Apply damage
  defender.currentHp = Math.max(0, defender.currentHp - damage)
  result.damage = damage

  events.push({
    type: 'damage',
    data: {
      creature: defenderLabel,
      name: defender.name,
      damage: result.damage,
      newHp: defender.currentHp,
      maxHp: defender.currentStats.hp,
    },
  })

  // Check faint
  if (defender.currentHp <= 0) {
    defender.fainted = true
    defender.status = null
    resetStages(defender)
    events.push({
      type: 'faint',
      data: { creature: defenderLabel, name: defender.name },
    })
  } else if (move.type === 'fire' && defender.status?.id === 'freeze') {
    defender.status = null
    events.push({
      type: 'status',
      data: { creature: defenderLabel, name: defender.name, status: null, label: `${defender.name} thawed out!` },
    })
  } else if (move.statusOnHit) {
    tryInflict(defender, move.statusOnHit.id, defenderLabel, events, move.statusOnHit.chance)
  }

  if (!defender.fainted && move.category === 'physical') {
    const contact = getAbility(defender.ability)?.contact
    if (contact) tryInflict(attacker, contact, attackerLabel, events, 0.3)
  }

  return events
}

function applyItemUse(team, action, label, bag) {
  const events = []
  const item = ITEMS[action.itemId]
  if (!item || !bag || (bag[action.itemId] || 0) <= 0) {
    events.push({ type: 'item', data: { creature: label, text: 'The bag is empty!' } })
    return events
  }
  const target = team[action.targetIndex ?? 0]
  if (!target || target.fainted) return events
  bag[action.itemId] -= 1
  if (bag[action.itemId] <= 0) delete bag[action.itemId]

  if (item.cure) target.status = null
  let healed = 0
  if (item.heal) {
    const amount = Math.max(1, Math.floor(target.currentStats.hp * item.heal))
    healed = Math.min(amount, target.currentStats.hp - target.currentHp)
    target.currentHp = Math.min(target.currentStats.hp, target.currentHp + amount)
  }
  const bits = []
  if (healed > 0) bits.push(`healed ${healed} HP`)
  if (item.cure) bits.push('cleared the status')
  events.push({
    type: 'item',
    data: {
      creature: label,
      name: target.name,
      item: item.name,
      text: `${target.name} used ${item.name}${bits.length ? ' — ' + bits.join(' and ') : ''}!`,
      newHp: target.currentHp,
      maxHp: target.currentStats.hp,
    },
  })
  return events
}

function endOfTurn(creature, label) {
  const events = []
  if (!creature || creature.fainted) return events
  const max = creature.currentStats.hp
  if (creature.status?.id === 'burn') {
    const amount = Math.max(1, Math.floor(max / 16))
    creature.currentHp = Math.max(0, creature.currentHp - amount)
    events.push({ type: 'statusHurt', data: { creature: label, name: creature.name, amount, text: `${creature.name} is hurt by its burn!`, newHp: creature.currentHp, maxHp: max } })
  } else if (creature.status?.id === 'poison') {
    if (getAbility(creature.ability)?.poisonSip) {
      const amount = Math.max(1, Math.floor(max / 8))
      const healed = Math.min(amount, max - creature.currentHp)
      creature.currentHp = Math.min(max, creature.currentHp + amount)
      events.push({ type: 'heal', data: { creature: label, name: creature.name, amount: healed, newHp: creature.currentHp, maxHp: max, text: `${creature.name} drinks in the poison!` } })
    } else {
      const amount = Math.max(1, Math.floor(max / 8))
      creature.currentHp = Math.max(0, creature.currentHp - amount)
      events.push({ type: 'statusHurt', data: { creature: label, name: creature.name, amount, text: `${creature.name} is hurt by poison!`, newHp: creature.currentHp, maxHp: max } })
    }
  }
  if (!creature.fainted && creature.heldItem === 'snack_berry' && creature.currentHp < max && creature.currentHp > 0) {
    const amount = Math.max(1, Math.floor(max / 16))
    const healed = Math.min(amount, max - creature.currentHp)
    creature.currentHp = Math.min(max, creature.currentHp + amount)
    events.push({ type: 'heal', data: { creature: label, name: creature.name, amount: healed, newHp: creature.currentHp, maxHp: max, text: `${creature.name}'s Snack Berry restored HP!` } })
  }
  if (creature.currentHp <= 0) {
    creature.fainted = true
    creature.status = null
    resetStages(creature)
    events.push({ type: 'faint', data: { creature: label, name: creature.name } })
  }
  return events
}

/**
 * Execute a full battle turn.
 *
 * @param {object} playerAction — { type: 'attack', moveId } or { type: 'switch', targetIndex }
 * @param {object[]} playerTeam — player's team of battle creatures
 * @param {number} playerActiveIdx — index of player's active creature
 * @param {object[]} aiTeam — AI's team of battle creatures
 * @param {number} aiActiveIdx — index of AI's active creature
 * @param {object|string} aiConfig — AI config object { optimalChance, switchBehavior } or legacy difficulty string
 * @param {object} [typeChart] — effectiveness chart, including Forge custom types
 * @returns {{ events: object[], playerActiveIdx: number, aiActiveIdx: number, battleOver: boolean, winner: string|null }}
 */
export function executeTurn(playerAction, playerTeam, playerActiveIdx, aiTeam, aiActiveIdx, aiConfig, cooldowns, typeChart) {
  const events = []
  let newPlayerIdx = playerActiveIdx
  let newAiIdx = aiActiveIdx
  let playerCooldown = cooldowns?.player || 0
  let aiCooldown = cooldowns?.ai || 0

  const playerCreature = playerTeam[playerActiveIdx]
  const aiCreature = aiTeam[aiActiveIdx]

  // --- Determine AI action (respects cooldown, items, and status) ---
  const aiItems = aiConfig?.items || []
  const aiAction = aiChooseAction(aiCreature, playerCreature, aiTeam, aiActiveIdx, aiConfig, typeChart, aiItems, aiCooldown)

  // --- Handle switches (happen before attacks) ---

  // Player switch (voluntary — triggers cooldown)
  if (playerAction.type === 'switch') {
    const heal = Math.floor((playerCreature.currentStats?.hp || 0) * (getAbility(playerCreature.ability)?.healOnSwitch || 0))
    if (heal > 0 && !playerCreature.fainted) {
      playerCreature.currentHp = Math.min(playerCreature.currentStats.hp, playerCreature.currentHp + heal)
    }
    playerCreature.status = null
    resetStages(playerCreature)
    recalcCurrentStats(playerCreature)
    newPlayerIdx = playerAction.targetIndex
    const switchedIn = playerTeam[newPlayerIdx]
    playerCooldown = 3
    events.push({
      type: 'switch',
      data: {
        creature: 'player',
        fromName: playerCreature.name,
        toName: switchedIn.name,
        newIndex: newPlayerIdx,
      },
    })
  }

  // AI switch (voluntary — triggers cooldown)
  if (aiAction.type === 'switch') {
    const heal = Math.floor((aiCreature.currentStats?.hp || 0) * (getAbility(aiCreature.ability)?.healOnSwitch || 0))
    if (heal > 0 && !aiCreature.fainted) {
      aiCreature.currentHp = Math.min(aiCreature.currentStats.hp, aiCreature.currentHp + heal)
    }
    aiCreature.status = null
    resetStages(aiCreature)
    recalcCurrentStats(aiCreature)
    newAiIdx = aiAction.targetIndex
    const switchedIn = aiTeam[newAiIdx]
    aiCooldown = 3
    events.push({
      type: 'switch',
      data: {
        creature: 'ai',
        fromName: aiCreature.name,
        toName: switchedIn.name,
        newIndex: newAiIdx,
      },
    })
  }

  // --- Resolve attacks ---
  const currentPlayer = playerTeam[newPlayerIdx]
  const currentAi = aiTeam[newAiIdx]

  const playerBag = playerAction.bag
  if (playerAction.type === 'item') {
    events.push(...applyItemUse(playerTeam, playerAction, 'player', playerBag))
  }
  if (aiAction.type === 'item') {
    const aiBag = {}
    for (const id of aiItems) aiBag[id] = (aiBag[id] || 0) + 1
    events.push(...applyItemUse(aiTeam, aiAction, 'ai', aiBag))
    const idx = aiItems.indexOf(aiAction.itemId)
    if (idx >= 0) aiItems.splice(idx, 1)
  }

  const playerAttacking = playerAction.type === 'attack'
  const aiAttacking = aiAction.type === 'attack'

  if (playerAttacking && aiAttacking) {
    // Both attack — speed determines order
    const playerMove = MOVES[playerAction.moveId]
    const aiMove = MOVES[aiAction.moveId]

    if (!playerMove || !aiMove) {
      return { events, playerActiveIdx: newPlayerIdx, aiActiveIdx: newAiIdx, battleOver: false, winner: null }
    }

    const first = determineTurnOrder(currentPlayer, currentAi)

    if (first === 'player') {
      // Player attacks first
      events.push(...executeAttack(currentPlayer, playerMove, currentAi, 'player', typeChart))

      // AI attacks if not fainted
      if (!currentAi.fainted) {
        events.push(...executeAttack(currentAi, aiMove, currentPlayer, 'ai', typeChart))
      }
    } else {
      // AI attacks first
      events.push(...executeAttack(currentAi, aiMove, currentPlayer, 'ai', typeChart))

      // Player attacks if not fainted
      if (!currentPlayer.fainted) {
        events.push(...executeAttack(currentPlayer, playerMove, currentAi, 'player', typeChart))
      }
    }
  } else if (playerAttacking && !aiAttacking) {
    // Only player attacks (AI switched — player gets free attack)
    const playerMove = MOVES[playerAction.moveId]
    if (playerMove) {
      events.push(...executeAttack(currentPlayer, playerMove, currentAi, 'player', typeChart))
    }
  } else if (!playerAttacking && aiAttacking) {
    // Only AI attacks (player switched — AI gets free attack)
    const aiMove = MOVES[aiAction.moveId]
    if (aiMove) {
      events.push(...executeAttack(currentAi, aiMove, currentPlayer, 'ai', typeChart))
    }
  }
  // Both switched or used items — no attacks, just the events above

  // Lingering status and held berries, then faint checks.
  if (!playerTeam[newPlayerIdx]?.fainted) {
    events.push(...endOfTurn(playerTeam[newPlayerIdx], 'player'))
  }
  if (!aiTeam[newAiIdx]?.fainted) {
    events.push(...endOfTurn(aiTeam[newAiIdx], 'ai'))
  }

  // --- Decrement cooldowns at end of turn (min 0) ---
  playerCooldown = Math.max(0, playerCooldown - 1)
  aiCooldown = Math.max(0, aiCooldown - 1)

  // --- Handle forced switches for fainted creatures ---
  const result = {
    events,
    playerActiveIdx: newPlayerIdx,
    aiActiveIdx: newAiIdx,
    battleOver: false,
    winner: null,
    cooldowns: { player: playerCooldown, ai: aiCooldown },
  }

  // Check for faints and battle end
  const playerAlive = playerTeam.filter(c => !c.fainted)
  const aiAlive = aiTeam.filter(c => !c.fainted)

  if (playerAlive.length === 0) {
    result.battleOver = true
    result.winner = 'ai'
  } else if (aiAlive.length === 0) {
    result.battleOver = true
    result.winner = 'player'
  } else {
    // Force switch for fainted AI creature — resets AI cooldown
    if (currentAi.fainted) {
      const nextAi = aiTeam.findIndex((c, i) => i !== newAiIdx && !c.fainted)
      if (nextAi !== -1) {
        result.aiActiveIdx = nextAi
        result.cooldowns.ai = 0
        events.push({
          type: 'forceSwitch',
          data: {
            creature: 'ai',
            fromName: currentAi.name,
            toName: aiTeam[nextAi].name,
            newIndex: nextAi,
          },
        })
      }
    }

    // Player fainted — resets player cooldown, they choose who to send in
    if (currentPlayer.fainted) {
      result.cooldowns.player = 0
      events.push({
        type: 'forceSwitch',
        data: {
          creature: 'player',
          fromName: currentPlayer.name,
          toName: null, // Player must choose
          newIndex: null,
          needsSelection: true,
        },
      })
    }
  }

  return result
}

/**
 * Apply a forced switch (after faint). No turn cost.
 */
export function applyForceSwitch(team, newIndex) {
  return newIndex
}

/**
 * Check if a battle is over.
 */
export function isBattleOver(playerTeam, aiTeam) {
  const playerAlive = playerTeam.some(c => !c.fainted)
  const aiAlive = aiTeam.some(c => !c.fainted)

  if (!playerAlive) return { over: true, winner: 'ai' }
  if (!aiAlive) return { over: true, winner: 'player' }
  return { over: false, winner: null }
}
