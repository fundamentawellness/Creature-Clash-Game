import assert from 'node:assert/strict'
import { musicTrackFor, shouldKeepMusic } from '../src/audio/sound.js'

assert.equal(musicTrackFor('map'), 'voyage')
assert.equal(musicTrackFor('overworld'), 'voyage')
assert.equal(musicTrackFor('profiles'), 'voyage')
assert.equal(musicTrackFor('battle'), 'clash')
assert.equal(musicTrackFor('champion'), 'clash')

assert.equal(shouldKeepMusic('voyage', 'map', true), true)
assert.equal(shouldKeepMusic('clash', 'battle', true), true)
assert.equal(shouldKeepMusic('clash', 'champion', true), true)
assert.equal(shouldKeepMusic('voyage', 'battle', true), false)
assert.equal(shouldKeepMusic('voyage', 'map', false), false)
assert.equal(shouldKeepMusic(null, 'map', true), false)

console.log('Music checks passed')
