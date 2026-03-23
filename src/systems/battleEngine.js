// Battle engine — orchestrates turns, produces event arrays for rendering
// Pure functions. No DOM, no Phaser, no side effects beyond state mutation.
import { MOVES } from '../data/moves.js'
import { CREATURES } from '../data/creatures.js'
import { calculateDamage, getEffectivenessText } from './damage.js'
import { applyStatStage, resetStages, recalcCurrentStats, getEffectiveStat } from './statStages.js'
import { aiPickMove, aiShouldSwitch } from './ai.js'

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
  const playerSpd = getEffectiveStat(playerCreature, 'spd')
  const aiSpd = getEffectiveStat(aiCreature, 'spd')

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
function executeAttack(attacker, move, defender, attackerLabel) {
  const events = []
  const defenderLabel = attackerLabel === 'player' ? 'ai' : 'player'

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
  const result = calculateDamage(attacker, move, defender)

  if (result.missed) {
    events.push({
      type: 'miss',
      data: { creature: attackerLabel, name: attacker.name, move: move.name },
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

  // Apply damage
  defender.currentHp = Math.max(0, defender.currentHp - result.damage)

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
    resetStages(defender)
    events.push({
      type: 'faint',
      data: { creature: defenderLabel, name: defender.name },
    })
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
 * @param {'easy'|'medium'|'hard'} difficulty
 * @returns {{ events: object[], playerActiveIdx: number, aiActiveIdx: number, battleOver: boolean, winner: string|null }}
 */
export function executeTurn(playerAction, playerTeam, playerActiveIdx, aiTeam, aiActiveIdx, difficulty) {
  const events = []
  let newPlayerIdx = playerActiveIdx
  let newAiIdx = aiActiveIdx

  const playerCreature = playerTeam[playerActiveIdx]
  const aiCreature = aiTeam[aiActiveIdx]

  // --- Determine AI action ---
  const switchIdx = aiShouldSwitch(aiTeam, aiActiveIdx, playerCreature, difficulty)
  const aiAction = switchIdx !== null
    ? { type: 'switch', targetIndex: switchIdx }
    : { type: 'attack', moveId: aiPickMove(aiCreature, playerCreature, difficulty)?.id }

  // --- Handle switches (happen before attacks) ---

  // Player switch
  if (playerAction.type === 'switch') {
    resetStages(playerCreature)
    recalcCurrentStats(playerCreature)
    newPlayerIdx = playerAction.targetIndex
    const switchedIn = playerTeam[newPlayerIdx]
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

  // AI switch
  if (aiAction.type === 'switch') {
    resetStages(aiCreature)
    recalcCurrentStats(aiCreature)
    newAiIdx = aiAction.targetIndex
    const switchedIn = aiTeam[newAiIdx]
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
      events.push(...executeAttack(currentPlayer, playerMove, currentAi, 'player'))

      // AI attacks if not fainted
      if (!currentAi.fainted) {
        events.push(...executeAttack(currentAi, aiMove, currentPlayer, 'ai'))
      }
    } else {
      // AI attacks first
      events.push(...executeAttack(currentAi, aiMove, currentPlayer, 'ai'))

      // Player attacks if not fainted
      if (!currentPlayer.fainted) {
        events.push(...executeAttack(currentPlayer, playerMove, currentAi, 'player'))
      }
    }
  } else if (playerAttacking && !aiAttacking) {
    // Only player attacks (AI switched — player gets free attack)
    const playerMove = MOVES[playerAction.moveId]
    if (playerMove) {
      events.push(...executeAttack(currentPlayer, playerMove, currentAi, 'player'))
    }
  } else if (!playerAttacking && aiAttacking) {
    // Only AI attacks (player switched — AI gets free attack)
    const aiMove = MOVES[aiAction.moveId]
    if (aiMove) {
      events.push(...executeAttack(currentAi, aiMove, currentPlayer, 'ai'))
    }
  }
  // Both switched — no attacks, just the switch events above

  // --- Handle forced switches for fainted creatures ---
  const result = {
    events,
    playerActiveIdx: newPlayerIdx,
    aiActiveIdx: newAiIdx,
    battleOver: false,
    winner: null,
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
    // Force switch for fainted AI creature
    if (currentAi.fainted) {
      const nextAi = aiTeam.findIndex((c, i) => i !== newAiIdx && !c.fainted)
      if (nextAi !== -1) {
        result.aiActiveIdx = nextAi
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

    // Player fainted — they need to choose who to send in (handled by UI)
    if (currentPlayer.fainted) {
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
