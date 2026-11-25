// Greenridge, the first walkable island. Tiles are original pixel art (docs/TILES.md).
// Other islands stay on the chart screen until they are converted.

export const MAP_W = 42
export const MAP_H = 30

const SOLID = new Set(['#', '*', '~', '|', 'b', 'k', 'x'])

export const ENCOUNTER_TILES = {
  ',': 'route',
  ';': 'forest',
  c: 'cave',
  s: 'beach',
}

function blank() {
  return Array.from({ length: MAP_H }, () => Array(MAP_W).fill('#'))
}

function fill(rows, x, y, w, h, tile) {
  for (let yy = y; yy < y + h; yy++) {
    for (let xx = x; xx < x + w; xx++) {
      if (rows[yy]?.[xx] !== undefined) rows[yy][xx] = tile
    }
  }
}

function building(rows, x, y, w, h, doorX, doorY) {
  fill(rows, x, y, w, h, '|')
  fill(rows, x + 1, y + 1, w - 2, h - 2, 'o')
  rows[doorY][doorX] = 'd'
}

export function buildGreenridge() {
  const rows = blank()
  fill(rows, 1, 1, MAP_W - 2, MAP_H - 2, '.')

  // Forest canopy in the north.
  fill(rows, 1, 1, 17, 7, ';')
  for (let y = 1; y <= 6; y++) {
    for (let x = 1; x <= 16; x++) {
      if (x >= 6 && x <= 10) continue
      if ((x * 3 + y) % 5 === 0) rows[y][x] = '*'
    }
  }

  // Re-stamp the enclosed tonic after the forest fill. Neighbors are border, bush, bush.
  rows[2][2] = '.'

  // Cave in the east.
  fill(rows, 31, 3, 10, 9, 'x')
  fill(rows, 32, 4, 8, 7, 'c')
  rows[8][31] = 'd'

  // Beach and sea.
  fill(rows, 1, 21, 40, 3, '=')
  fill(rows, 1, 24, 40, 5, '~')
  for (let x = 14; x <= 28; x++) {
    if (x !== 20) rows[22][x] = 's'
  }

  // Paths.
  for (let y = 1; y <= 13; y++) rows[y][8] = '+'
  for (let x = 2; x <= 30; x++) rows[13][x] = '+'
  for (let y = 8; y <= 23; y++) rows[y][22] = '+'
  for (let y = 14; y <= 23; y++) rows[y][17] = '+'
  for (let x = 22; x <= 31; x++) rows[8][x] = '+'
  for (let y = 14; y <= 15; y++) rows[y][8] = '+'

  // Route grass on either side of the east path, skipping the cross street.
  for (let y = 9; y <= 18; y++) {
    if (y === 13) continue
    for (let x = 19; x <= 27; x++) {
      if (x === 22) continue
      rows[y][x] = ','
    }
  }

  // Buildings. Doors open onto a path.
  building(rows, 2, 8, 5, 5, 4, 12)
  building(rows, 10, 8, 6, 5, 12, 12)
  building(rows, 2, 15, 14, 5, 8, 15)

  // Boulder for a future Rock Smash, off the cave path.
  rows[13][34] = 'k'

  // Forest potion is on an open forest tile. The hedge tonic stays boxed in.
  rows[4][5] = ';'
  rows[4][6] = ';'
  rows[5][5] = ';'
  rows[3][4] = ';'
  rows[2][2] = '.'
  rows[1][2] = 'b'
  rows[2][1] = 'b'
  rows[2][3] = 'b'
  rows[3][2] = 'b'

  const tileAt = (x, y) => rows[y]?.[x] || '#'

  return {
    rows: rows.map(row => row.join('')),
    tileAt,
    spawn: { x: 12, y: 13, facing: 'up' },
    clinic: { x: 4, y: 13, facing: 'up' },
    people: [
      { id: 'nurse', kind: 'nurse', name: 'Nurse Nia', x: 4, y: 10, color: '#f687b3' },
      { id: 'professor', kind: 'professor', name: 'Professor Fern', x: 12, y: 10, color: '#68d391' },
      { id: 'pip', kind: 'quest', name: 'Pip', x: 5, y: 14, color: '#f6e05e' },
      { id: 'shop', kind: 'shop', name: 'Mina', x: 16, y: 12, color: '#fbd38d' },
      { id: 'sailor', kind: 'sail', name: 'Skipper Bram', x: 8, y: 23, color: '#63b3ed' },
      { id: 'guide', kind: 'sign', name: 'Gym sign', x: 8, y: 16, color: '#e2e8f0', solid: false },
      { id: 'gym-thorn', kind: 'gym', name: 'Leader Marcus', gymId: 'z1g1', x: 4, y: 17, color: '#48bb78' },
      { id: 'gym-ember', kind: 'gym', name: 'Leader Sera', gymId: 'z1g2', x: 7, y: 17, color: '#fc8181' },
      { id: 'gym-tide', kind: 'gym', name: 'Leader Kai', gymId: 'z1g3', x: 10, y: 17, color: '#4299e1' },
      { id: 'gym-spark', kind: 'gym', name: 'Leader Lina', gymId: 'z1g4', x: 13, y: 17, color: '#ecc94b' },
      { id: 'dot', kind: 'crew', name: 'Digger Dot', x: 20, y: 16, color: '#ecc94b' },
      { id: 'rival', kind: 'rival', name: 'Rival', x: 24, y: 16, color: '#fc8181' },
      { id: 'cut-sign', kind: 'sign', name: 'Hedge', x: 4, y: 3, color: '#9ae6b4' },
      { id: 'surf-sign', kind: 'sign', name: 'Shore sign', x: 10, y: 23, color: '#90cdf4' },
      { id: 'smash-sign', kind: 'sign', name: 'Boulder sign', x: 33, y: 13, color: '#cbd5e0' },
      { id: 'moss', kind: 'trainer', name: 'Ranger Moss', x: 24, y: 11, facing: 'left', sight: 3, color: '#68d391',
        before: 'The meadow is my favorite path. Battle me!',
        after: 'You know the grass well. Nice fight.',
        team: [{ id: 'leafyn', level: 5 }, { id: 'mossback', level: 6 }] },
      { id: 'brook', kind: 'trainer', name: 'Swimmer Brook', x: 19, y: 22, facing: 'left', sight: 4, color: '#63b3ed',
        before: 'Shoes off! Well, after this battle.',
        after: 'The tide likes you.',
        team: [{ id: 'aquafin', level: 5 }, { id: 'shellguard', level: 6 }] },
      { id: 'flint', kind: 'trainer', name: 'Hiker Flint', x: 28, y: 7, facing: 'down', sight: 2, color: '#a8895a',
        before: 'That cave echoes. Want to practice first?',
        after: 'Go on in. Watch your step.',
        team: [{ id: 'pebblit', level: 6 }, { id: 'bouldar', level: 7 }] },
    ],
    items: [
      { id: 'forest-potion', x: 5, y: 4, kind: 'item', itemId: 'potion', count: 1 },
      { id: 'cave-orb', x: 34, y: 6, kind: 'item', itemId: 'lure_orb', count: 2 },
      { id: 'lucky-shell', x: 20, y: 22, kind: 'shell' },
      { id: 'hedge-tonic', x: 2, y: 2, kind: 'item', itemId: 'tonic', count: 1 },
    ],
  }
}

export const GREENRIDGE = buildGreenridge()

export function tileAt(x, y) {
  if (x < 0 || y < 0 || x >= MAP_W || y >= MAP_H) return '#'
  return GREENRIDGE.rows[y][x] || '#'
}

export function isSolid(x, y) {
  return SOLID.has(tileAt(x, y))
}

export function isWalkable(x, y) {
  return !isSolid(x, y)
}

const DIRS = {
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
}

export function trainerSees(trainer, px, py) {
  const dir = DIRS[trainer.facing]
  if (!dir) return false
  for (let step = 1; step <= trainer.sight; step++) {
    const x = trainer.x + dir.x * step
    const y = trainer.y + dir.y * step
    if (isSolid(x, y)) return false
    if (x === px && y === py) return true
  }
  return false
}

export function zoneNameAt(x, y) {
  const tile = tileAt(x, y)
  if (tile === ',' ) return 'Meadow Route'
  if (tile === ';') return 'Fern Forest'
  if (tile === 'c' || tile === 'x') return 'Pebble Cave'
  if (tile === 's' || tile === '=' || tile === '~') return 'Shell Beach'
  if (tile === 'o' || tile === 'd' || tile === '|') {
    if (y >= 15) return 'Greenridge Gym'
    if (x < 9) return 'Healing Center'
    return 'Professor Fern\'s Lab'
  }
  if (y <= 7 && x <= 17) return 'Fern Forest'
  if (y >= 21) return 'Shell Beach'
  if (x >= 30) return 'Pebble Cave'
  if (x >= 18) return 'Meadow Route'
  return 'Greenridge Town'
}

export function reachableTiles(extraBlocked = []) {
  const blocked = new Set(extraBlocked.map(p => `${p.x},${p.y}`))
  const start = GREENRIDGE.spawn
  const seen = new Set([`${start.x},${start.y}`])
  const queue = [{ ...start }]
  const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]]
  while (queue.length) {
    const current = queue.shift()
    for (const [dx, dy] of dirs) {
      const x = current.x + dx
      const y = current.y + dy
      const key = `${x},${y}`
      if (seen.has(key) || blocked.has(key) || !isWalkable(x, y)) continue
      seen.add(key)
      queue.push({ x, y })
    }
  }
  return seen
}
