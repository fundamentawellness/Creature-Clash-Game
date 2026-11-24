// Private rooms. The server runs the same turn function the story uses,
// once, then tells each kid what they should see.
import { CREATURES } from '../src/data/creatures.js'
import { MOVES } from '../src/data/moves.js'
import { createBattleCreature, executeTurn } from '../src/systems/battleEngine.js'
import { movesKnownAtLevel } from '../src/systems/progression.js'

const WORDS = ['TIDE', 'LEAF', 'BOLT', 'ROCK', 'MIST', 'ASH', 'REEF', 'WAVE', 'STAR', 'MOON', 'PINE', 'FERN', 'GLOW', 'CORAL', 'DUST', 'NEST']
const WAIT_MS = 10 * 60 * 1000
const TURN_MS = 60 * 1000
const REJOIN_MS = 45 * 1000

export function normalizeCode(raw) {
  return String(raw || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5)
}

function token() {
  return Math.random().toString(16).slice(2, 10) + Math.random().toString(16).slice(2, 10)
}

export function teamSpec(entries, normalize) {
  if (!Array.isArray(entries) || entries.length < 1 || entries.length > 4) {
    return { error: 'Bring 1 to 4 creatures.' }
  }
  const specs = []
  for (const entry of entries) {
    const template = CREATURES[entry?.id]
    if (!template || template.isCustom) {
      return { error: 'Friend battles use creatures from the collection.' }
    }
    const level = normalize ? 50 : Math.max(1, Math.min(50, entry.level || 1))
    const known = movesKnownAtLevel(template, level)
    const brought = (entry.currentMoves || []).filter(id => MOVES[id])
    specs.push({
      id: template.id,
      level,
      currentMoves: (brought.length ? brought : known).slice(0, 4),
      heldItem: entry.heldItem || null,
    })
  }
  return { specs }
}

function summon(specs) {
  return specs.map(spec => createBattleCreature({
    id: spec.id,
    level: spec.level,
    wins: 0,
    currentMoves: spec.currentMoves,
    heldItem: spec.heldItem,
  }, CREATURES)).filter(Boolean)
}

function swapSide(side) {
  if (side === 'player') return 'ai'
  if (side === 'ai') return 'player'
  return side
}

export function swapEvents(events) {
  return (events || []).map(event => ({
    ...event,
    data: event.data ? {
      ...event.data,
      creature: swapSide(event.data.creature),
      attacker: swapSide(event.data.attacker),
      defender: swapSide(event.data.defender),
    } : event.data,
  }))
}

function swapWinner(winner) {
  if (winner === 'player') return 'ai'
  if (winner === 'ai') return 'player'
  return winner
}

function syncList(team) {
  return team.map(creature => ({
    currentHp: creature.currentHp,
    fainted: !!creature.fainted,
    status: creature.status?.id || null,
  }))
}

function view(result, seat, hostTeam, guestTeam) {
  const host = seat === 'host'
  return {
    t: 'turn',
    result: {
      events: host ? result.events : swapEvents(result.events),
      playerActiveIdx: host ? result.playerActiveIdx : result.aiActiveIdx,
      aiActiveIdx: host ? result.aiActiveIdx : result.playerActiveIdx,
      battleOver: result.battleOver,
      winner: host ? result.winner : swapWinner(result.winner),
      cooldowns: host ? result.cooldowns : { player: result.cooldowns.ai, ai: result.cooldowns.player },
    },
    you: syncList(host ? hostTeam : guestTeam),
    foe: syncList(host ? guestTeam : hostTeam),
  }
}

function firstMove(team, index) {
  const creature = team[index]
  const moveId = creature?.currentMoves?.find(id => MOVES[id])
  return moveId ? { type: 'attack', moveId } : null
}

export function createArena() {
  const rooms = new Map()

  function freshCode() {
    for (let i = 0; i < 20; i++) {
      const code = WORDS[Math.floor(Math.random() * WORDS.length)] + (2 + Math.floor(Math.random() * 8))
      if (!rooms.has(code)) return code
    }
    return null
  }

  function pack(room, seat) {
    return {
      t: 'start',
      code: room.code,
      seat,
      opponentName: seat === 'host' ? room.guest.name : room.host.name,
      normalize: room.normalize,
      you: seat === 'host' ? room.host.specs : room.guest.specs,
      foe: seat === 'host' ? room.guest.specs : room.host.specs,
    }
  }

  function create({ name, team, normalize }) {
    if (rooms.size > 100) return { error: 'The arena is full. Try again in a little bit.' }
    const built = teamSpec(team, !!normalize)
    if (built.error) return built
    const code = freshCode()
    if (!code) return { error: 'Could not open a room. Try again.' }
    const seatToken = token()
    const room = {
      code,
      normalize: !!normalize,
      createdAt: Date.now(),
      host: { name: String(name || 'Friend').slice(0, 16), specs: built.specs, token: seatToken, connected: true, action: null },
      guest: null,
      hostTeam: null,
      guestTeam: null,
      hostActive: 0,
      guestActive: 0,
      cooldowns: { player: 0, ai: 0 },
      phase: 'waiting',
      over: false,
      disconnect: null,
    }
    rooms.set(code, room)
    return { code, token: seatToken, seat: 'host' }
  }

  function join(rawCode, { name, team }) {
    const code = normalizeCode(rawCode)
    const room = rooms.get(code)
    if (!room || room.over) return { error: 'No room with that code. Ask your friend to read it again.' }
    if (room.guest) return { error: 'That room already has two players.' }
    const built = teamSpec(team, room.normalize)
    if (built.error) return built
    const seatToken = token()
    room.guest = { name: String(name || 'Friend').slice(0, 16), specs: built.specs, token: seatToken, connected: true, action: null }
    room.hostTeam = summon(room.host.specs)
    room.guestTeam = summon(room.guest.specs)
    room.phase = 'choose'
    room.turnDeadline = Date.now() + TURN_MS
    return {
      code,
      token: seatToken,
      seat: 'guest',
      start: [pack(room, 'host'), pack(room, 'guest')],
    }
  }

  function seatOf(room, seatToken) {
    if (room.host?.token === seatToken) return 'host'
    if (room.guest?.token === seatToken) return 'guest'
    return null
  }

  function findToken(seatToken) {
    for (const room of rooms.values()) {
      const seat = seatOf(room, seatToken)
      if (seat) return { room, seat }
    }
    return null
  }

  function act(seatToken, action) {
    const found = findToken(seatToken)
    if (!found) return { error: 'That room is closed.' }
    const { room, seat } = found
    if (room.phase !== 'choose' || room.over) return { error: 'Wait for the battle to catch up.' }
    if (room.disconnect) return { error: 'Waiting for your friend to come back.' }
    const who = room[seat]
    if (who.action) return { error: 'You already chose.' }
    if (!action || (action.type !== 'attack' && action.type !== 'switch')) {
      return { error: 'Pick a move or a creature.' }
    }
    const mine = seat === 'host' ? room.hostTeam : room.guestTeam
    const index = seat === 'host' ? room.hostActive : room.guestActive
    const cooldown = seat === 'host' ? room.cooldowns.player : room.cooldowns.ai
    if (action.type === 'switch') {
      if (cooldown > 0) return { error: 'Switch is not ready yet.' }
      const next = mine[action.targetIndex]
      if (!next || next.fainted || action.targetIndex === index) return { error: 'That creature cannot switch in.' }
    } else if (!mine[index]?.currentMoves?.includes(action.moveId)) {
      return { error: 'That move is not ready.' }
    }
    who.action = action.type === 'attack' ? { type: 'attack', moveId: action.moveId } : { type: 'switch', targetIndex: action.targetIndex }
    if (room.host.action && room.guest.action) return { turns: resolve(room) }
    return { waiting: true, seat }
  }

  function resolve(room) {
    const result = executeTurn(
      room.host.action,
      room.hostTeam,
      room.hostActive,
      room.guestTeam,
      room.guestActive,
      { opponentAction: room.guest.action, pvp: true, optimalChance: 0, switchBehavior: 'never' },
      room.cooldowns,
      null,
    )
    room.host.action = null
    room.guest.action = null
    room.hostActive = result.playerActiveIdx
    room.guestActive = result.aiActiveIdx
    room.cooldowns = result.cooldowns || { player: 0, ai: 0 }
    const messages = [
      { seat: 'host', msg: view(result, 'host', room.hostTeam, room.guestTeam) },
      { seat: 'guest', msg: view(result, 'guest', room.hostTeam, room.guestTeam) },
    ]
    if (result.battleOver) {
      room.over = true
      room.phase = 'over'
    } else {
      room.phase = 'choose'
      room.turnDeadline = Date.now() + TURN_MS
    }
    return messages
  }

  function drop(seatToken) {
    const found = findToken(seatToken)
    if (!found || found.room.over) return null
    const { room, seat } = found
    room[seat].connected = false
    room.disconnect = { seat, until: Date.now() + REJOIN_MS }
    const other = seat === 'host' ? 'guest' : 'host'
    return { code: room.code, other, until: room.disconnect.until }
  }

  function resume(seatToken) {
    const found = findToken(seatToken)
    if (!found) return { error: 'That room closed.' }
    const { room, seat } = found
    room[seat].connected = true
    if (room.disconnect?.seat === seat) room.disconnect = null
    room.turnDeadline = Date.now() + TURN_MS
    const other = seat === 'host' ? 'guest' : 'host'
    return {
      seat,
      start: room.guest ? pack(room, seat) : null,
      waiting: room.phase === 'waiting',
      needAction: room.phase === 'choose' && !room[seat].action,
      otherConnected: !!room[other]?.connected,
      you: room.guest ? syncList(seat === 'host' ? room.hostTeam : room.guestTeam) : null,
      foe: room.guest ? syncList(seat === 'host' ? room.guestTeam : room.hostTeam) : null,
      playerActiveIdx: seat === 'host' ? room.hostActive : room.guestActive,
      aiActiveIdx: seat === 'host' ? room.guestActive : room.hostActive,
    }
  }

  function tick(now = Date.now()) {
    const notes = []
    for (const room of rooms.values()) {
      if (room.phase === 'waiting' && now - room.createdAt > WAIT_MS) {
        rooms.delete(room.code)
        notes.push({ code: room.code, seat: 'host', msg: { t: 'over', text: 'Nobody joined. The room closed.' } })
      } else if (room.disconnect && now > room.disconnect.until) {
        const winner = room.disconnect.seat === 'host' ? 'guest' : 'host'
        room.over = true
        room.phase = 'over'
        notes.push({
          code: room.code,
          seat: winner,
          msg: { t: 'over', winner: 'you', text: 'Your friend did not come back. The battle is over.' },
        })
        rooms.delete(room.code)
      } else if (room.phase === 'choose' && !room.disconnect && room.turnDeadline && now > room.turnDeadline) {
        if (!room.host.action) room.host.action = firstMove(room.hostTeam, room.hostActive)
        if (!room.guest.action) room.guest.action = firstMove(room.guestTeam, room.guestActive)
        if (room.host.action && room.guest.action) {
          notes.push(...resolve(room).map(entry => ({ ...entry, code: room.code })))
        }
      }
    }
    return notes
  }

  return { create, join, act, drop, resume, tick, rooms, findToken }
}
