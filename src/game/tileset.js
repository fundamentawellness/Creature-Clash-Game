// Original 16×16 tiles and the player. Drawn in code, not taken from a pack.
// See docs/TILES.md.

const TILES = {
  grass: (g) => {
    g.fillStyle(0x3d9148); g.fillRect(0, 0, 16, 16)
    g.fillStyle(0x63b36a); g.fillRect(2, 3, 2, 3); g.fillRect(11, 9, 2, 3)
    g.fillStyle(0x2f7038); g.fillRect(7, 12, 2, 2)
  },
  tall: (g) => {
    g.fillStyle(0x2f7a3a); g.fillRect(0, 0, 16, 16)
    g.fillStyle(0x8fd18a)
    for (let x = 1; x < 16; x += 3) g.fillRect(x, 2, 1, 12)
    g.fillStyle(0x1f5a28); g.fillRect(0, 14, 16, 2)
  },
  forest: (g) => {
    g.fillStyle(0x245c32); g.fillRect(0, 0, 16, 16)
    g.fillStyle(0x1b4426); g.fillRect(0, 0, 16, 3)
    g.fillStyle(0x6aaa62); g.fillRect(4, 8, 2, 4); g.fillRect(12, 5, 2, 3)
  },
  tree: (g) => {
    g.fillStyle(0x245c32); g.fillRect(0, 0, 16, 16)
    g.fillStyle(0x8b5a2b); g.fillRect(7, 9, 2, 6)
    g.fillStyle(0x1e7a34); g.fillCircle(8, 6, 6)
    g.fillStyle(0x46a04a); g.fillCircle(6, 5, 3)
  },
  path: (g) => {
    g.fillStyle(0xc4a36a); g.fillRect(0, 0, 16, 16)
    g.fillStyle(0xddc48a); g.fillRect(1, 2, 4, 2); g.fillRect(9, 10, 5, 2)
    g.fillStyle(0xa68448); g.fillRect(6, 6, 3, 2)
  },
  sand: (g) => {
    g.fillStyle(0xe6cc88); g.fillRect(0, 0, 16, 16)
    g.fillStyle(0xf3e2b0); g.fillRect(3, 4, 2, 1); g.fillRect(11, 11, 3, 1)
  },
  shore: (g) => {
    g.fillStyle(0xe6cc88); g.fillRect(0, 0, 16, 16)
    g.fillStyle(0x49a35a); g.fillRect(2, 0, 2, 16); g.fillRect(8, 0, 2, 16); g.fillRect(13, 0, 2, 16)
  },
  water: (g) => {
    g.fillStyle(0x2b6cb0); g.fillRect(0, 0, 16, 16)
    g.fillStyle(0x63b3ed); g.fillRect(1, 4, 8, 2); g.fillRect(6, 11, 8, 2)
  },
  wall: (g) => {
    g.fillStyle(0x8d6a45); g.fillRect(0, 0, 16, 16)
    g.fillStyle(0xc4a36a); g.fillRect(1, 1, 14, 6); g.fillRect(1, 9, 14, 6)
    g.fillStyle(0x6b4f32); g.fillRect(0, 7, 16, 2)
  },
  floor: (g) => {
    g.fillStyle(0xd7c4a3); g.fillRect(0, 0, 16, 16)
    g.fillStyle(0xc2aa84); g.fillRect(0, 0, 16, 1); g.fillRect(0, 8, 16, 1)
  },
  door: (g) => {
    g.fillStyle(0x8d6a45); g.fillRect(0, 0, 16, 16)
    g.fillStyle(0xf6e05e); g.fillRect(3, 2, 10, 12)
    g.fillStyle(0x744210); g.fillRect(10, 7, 2, 2)
  },
  cave: (g) => {
    g.fillStyle(0x4a5568); g.fillRect(0, 0, 16, 16)
    g.fillStyle(0x2d3748); g.fillRect(0, 0, 16, 2)
    g.fillStyle(0x718096); g.fillRect(3, 6, 3, 2); g.fillRect(10, 11, 4, 2)
  },
  rock: (g) => {
    g.fillStyle(0x2d3748); g.fillRect(0, 0, 16, 16)
    g.fillStyle(0x1a202c); g.fillRect(0, 0, 16, 4)
    g.fillStyle(0x4a5568); g.fillRect(2, 5, 5, 4)
  },
  bush: (g) => {
    g.fillStyle(0x245c32); g.fillRect(0, 0, 16, 16)
    g.fillStyle(0x38a169); g.fillCircle(5, 8, 5); g.fillCircle(11, 8, 5)
    g.fillStyle(0x9ae6b4); g.fillCircle(8, 6, 3)
  },
  boulder: (g) => {
    g.fillStyle(0x3d9148); g.fillRect(0, 0, 16, 16)
    g.fillStyle(0x718096); g.fillCircle(8, 9, 6)
    g.fillStyle(0xa0aec0); g.fillCircle(6, 7, 2)
    g.fillStyle(0x4a5568); g.fillRect(4, 10, 7, 2)
  },
  border: (g) => {
    g.fillStyle(0x1a3320); g.fillRect(0, 0, 16, 16)
  },
}

const KEY_FOR = {
  '.': 'grass',
  ',': 'tall',
  ';': 'forest',
  '*': 'tree',
  '+': 'path',
  '=': 'sand',
  s: 'shore',
  '~': 'water',
  '|': 'wall',
  o: 'floor',
  d: 'door',
  c: 'cave',
  x: 'rock',
  b: 'bush',
  k: 'boulder',
  '#': 'border',
}

function hero(g, facing, shirt, cap) {
  g.clear()
  g.fillStyle(shirt)
  g.fillRect(4, 9, 8, 4)
  g.fillStyle(0xf6d7b0); g.fillRect(5, 4, 6, 5)
  g.fillStyle(0x8b5a2b)
  if (facing === 'up') g.fillRect(4, 1, 8, 4)
  else g.fillRect(4, 2, 8, 4)
  if (cap) {
    g.fillStyle(cap)
    g.fillRect(4, 1, 8, 3)
  }
  g.fillStyle(0x1a365d); g.fillRect(5, 13, 2, 2); g.fillRect(9, 13, 2, 2)
  if (facing === 'left' || facing === 'side') {
    g.fillStyle(0x2d3748); g.fillRect(5, 6, 2, 1)
  } else if (facing === 'down') {
    g.fillStyle(0x2d3748); g.fillRect(6, 6, 1, 1); g.fillRect(9, 6, 1, 1)
  }
}

export function tileKey(tile) {
  return `tile-${KEY_FOR[tile] || 'border'}`
}

export function paintTiles(scene) {
  const g = scene.make.graphics({ x: 0, y: 0, add: false })
  const draw = (key, fn) => {
    g.clear()
    fn(g)
    g.generateTexture(key, 16, 16)
  }
  for (const [name, fn] of Object.entries(TILES)) draw(`tile-${name}`, fn)
  draw('hero-down', (pen) => hero(pen, 'down', 0x2b6cb0, 0xf6e05e))
  draw('hero-up', (pen) => hero(pen, 'up', 0x2b6cb0, 0xf6e05e))
  draw('hero-side', (pen) => hero(pen, 'side', 0x2b6cb0, 0xf6e05e))
  draw('hero-npc', (pen) => hero(pen, 'down', 0xf7fafc, null))
  g.destroy()
}

export function heroKey(facing) {
  if (facing === 'up') return 'hero-up'
  if (facing === 'down') return 'hero-down'
  return 'hero-side'
}
