import assert from 'node:assert/strict'
import { createArena, swapEvents } from '../server/battleRoom.js'

const arena = createArena()
const hostTeam = [
  { id: 'emberpaw', level: 8, currentMoves: ['scratch', 'flame_nip'] },
  { id: 'aquafin', level: 6, currentMoves: ['scratch', 'water_gun'] },
]
const guestTeam = [
  { id: 'leafyn', level: 12, currentMoves: ['scratch', 'vine_whip'] },
]

const opened = arena.create({ name: 'Alex', team: hostTeam, normalize: true })
assert.equal(opened.error, undefined)
assert.match(opened.code, /^[A-Z]{3,5}[2-9]$/)

const missing = arena.join('NOPE9', { name: 'Riley', team: guestTeam })
assert.match(missing.error, /No room/)

const joined = arena.join(opened.code, { name: 'Riley', team: guestTeam })
assert.equal(joined.seat, 'guest')
assert.equal(joined.start[0].you[0].level, 50)
assert.equal(joined.start[1].foe[0].level, 50)

const early = arena.act(opened.token, { type: 'attack', moveId: 'flame_nip' })
assert.equal(early.waiting, true)
const turns = arena.act(joined.token, { type: 'attack', moveId: 'vine_whip' })
assert.equal(turns.turns.length, 2)
const hostView = turns.turns[0].msg
const guestView = turns.turns[1].msg
const hostDamage = hostView.result.events.filter(event => event.type === 'damage').map(event => event.data.amount)
const guestDamage = guestView.result.events.filter(event => event.type === 'damage').map(event => event.data.amount)
assert.deepEqual(hostDamage, guestDamage)
assert.equal(swapEvents(hostView.result.events)[0].data.creature, guestView.result.events[0].data.creature)

const dropped = arena.drop(joined.token)
assert.equal(dropped.other, 'host')
const back = arena.resume(joined.token)
assert.equal(back.error, undefined)
assert.equal(back.needAction, true)

const closed = createArena()
const room = closed.create({ name: 'Alex', team: hostTeam, normalize: false })
closed.join(room.code, { name: 'Riley', team: guestTeam })
closed.drop(room.token)
const notes = closed.tick(Date.now() + 46 * 1000)
assert.equal(notes[0].msg.winner, 'you')
assert.equal(notes[0].seat, 'guest')

console.log('Phase 5 checks passed', opened.code)
