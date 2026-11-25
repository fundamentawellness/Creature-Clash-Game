import assert from 'node:assert/strict'
import { artId, indexAfterSwitch, shownArtId, tagArt } from '../src/game/activeCreature.js'

const ember = { id: 'emberpaw', name: 'Emberpaw', spriteId: null }
const aqua = { id: 'aquafin', name: 'Aquafin', spriteId: 'abysseel' }

assert.equal(artId(ember), 'emberpaw')
assert.equal(artId(aqua), 'abysseel')

const events = [
  { type: 'attack', data: { creature: 'ai', name: 'Emberpaw' } },
  { type: 'damage', data: { creature: 'player' } },
  { type: 'faint', data: { creature: 'ai', name: 'Emberpaw' } },
  { type: 'forceSwitch', data: { creature: 'ai', newIndex: 1, toName: 'Aquafin' } },
]

let shown = 0
for (const event of events) {
  const next = indexAfterSwitch(event, 'ai', shown)
  if (event.type === 'attack') {
    assert.equal(next, shown, 'an attack must not change who is on screen')
  }
  shown = next
}
assert.equal(shown, 1)

let player = 0
player = indexAfterSwitch({
  type: 'forceSwitch',
  data: { creature: 'player', needsSelection: true, newIndex: null },
}, 'player', player)
assert.equal(player, 0, 'waiting for the player to choose does not move the picture')
player = indexAfterSwitch({
  type: 'switch',
  data: { creature: 'player', newIndex: 2, toName: 'Leafyn' },
}, 'player', player)
assert.equal(player, 2)

const sprite = {
  data: {},
  setData(key, value) { this.data[key] = value },
  getData(key) { return this.data[key] },
}
tagArt(sprite, aqua)
assert.equal(shownArtId(sprite), 'abysseel')
assert.notEqual(shownArtId(sprite), artId(ember))

console.log('Sprite sync checks passed')
