import Phaser from 'phaser'
import { TYPE_COLORS } from '../../data/types.js'
import { MOVES } from '../../data/moves.js'
import { executeTurn, createBattleCreature, isBattleOver } from '../../systems/battleEngine.js'

// Layout constants
const W = 800
const H = 500
const PLAYER_X = 200
const PLAYER_Y = 300
const ENEMY_X = 600
const ENEMY_Y = 160
const CREATURE_SIZE = 60
const ENEMY_SCALE = 0.8

// HP bar color thresholds
function hpColor(pct) {
  if (pct > 0.5) return 0x48bb78
  if (pct > 0.25) return 0xecc94b
  return 0xf56565
}

function hexToNum(hex) {
  return parseInt(hex.replace('#', ''), 16)
}

// Draw a procedural creature shape
function drawCreature(graphics, shape, color, size) {
  const c = hexToNum(color)
  const darkC = Phaser.Display.Color.IntegerToColor(c).darken(30).color
  graphics.clear()

  switch (shape) {
    case 'wolf': case 'fox':
      // Body
      graphics.fillStyle(c, 1)
      graphics.fillEllipse(0, 0, size * 1.3, size * 0.9)
      // Head
      graphics.fillEllipse(size * 0.5, -size * 0.2, size * 0.6, size * 0.5)
      // Ears
      graphics.fillTriangle(size * 0.55, -size * 0.55, size * 0.35, -size * 0.2, size * 0.7, -size * 0.25)
      graphics.fillTriangle(size * 0.75, -size * 0.5, size * 0.55, -size * 0.15, size * 0.9, -size * 0.2)
      // Tail
      graphics.fillStyle(darkC, 1)
      graphics.fillEllipse(-size * 0.65, -size * 0.15, size * 0.5, size * 0.2)
      // Eye
      graphics.fillStyle(0xffffff, 1)
      graphics.fillCircle(size * 0.6, -size * 0.25, 4)
      graphics.fillStyle(0x000000, 1)
      graphics.fillCircle(size * 0.62, -size * 0.25, 2)
      break

    case 'tortoise':
      // Shell
      graphics.fillStyle(darkC, 1)
      graphics.fillEllipse(0, -size * 0.1, size * 1.4, size * 1.1)
      // Shell highlight
      graphics.fillStyle(c, 1)
      graphics.fillEllipse(0, -size * 0.15, size * 1.1, size * 0.8)
      // Head
      graphics.fillEllipse(size * 0.6, size * 0.05, size * 0.4, size * 0.35)
      // Legs
      graphics.fillStyle(darkC, 1)
      graphics.fillEllipse(-size * 0.4, size * 0.35, size * 0.25, size * 0.2)
      graphics.fillEllipse(size * 0.3, size * 0.35, size * 0.25, size * 0.2)
      // Eye
      graphics.fillStyle(0xffffff, 1)
      graphics.fillCircle(size * 0.7, -size * 0.02, 3)
      graphics.fillStyle(0x000000, 1)
      graphics.fillCircle(size * 0.72, -size * 0.02, 1.5)
      break

    case 'hawk': case 'owl': case 'moth':
      // Body
      graphics.fillStyle(c, 1)
      graphics.fillEllipse(0, size * 0.1, size * 0.7, size * 0.9)
      // Wings
      graphics.fillStyle(darkC, 1)
      graphics.fillTriangle(-size * 0.35, 0, -size * 0.9, -size * 0.4, -size * 0.2, size * 0.3)
      graphics.fillTriangle(size * 0.35, 0, size * 0.9, -size * 0.4, size * 0.2, size * 0.3)
      // Head
      graphics.fillStyle(c, 1)
      graphics.fillCircle(0, -size * 0.35, size * 0.3)
      // Beak
      graphics.fillStyle(0xf6e05e, 1)
      graphics.fillTriangle(0, -size * 0.25, -size * 0.08, -size * 0.35, size * 0.08, -size * 0.35)
      // Eyes
      graphics.fillStyle(0xffffff, 1)
      graphics.fillCircle(-size * 0.1, -size * 0.38, 3)
      graphics.fillCircle(size * 0.1, -size * 0.38, 3)
      graphics.fillStyle(0x000000, 1)
      graphics.fillCircle(-size * 0.09, -size * 0.38, 1.5)
      graphics.fillCircle(size * 0.11, -size * 0.38, 1.5)
      break

    case 'dolphin': case 'serpent':
      // Body curve
      graphics.fillStyle(c, 1)
      graphics.fillEllipse(0, 0, size * 1.5, size * 0.6)
      // Head
      graphics.fillEllipse(size * 0.6, -size * 0.05, size * 0.5, size * 0.4)
      // Tail fin
      graphics.fillStyle(darkC, 1)
      graphics.fillTriangle(-size * 0.75, 0, -size * 1.0, -size * 0.3, -size * 1.0, size * 0.3)
      // Dorsal fin
      graphics.fillTriangle(0, -size * 0.3, -size * 0.15, 0, size * 0.15, 0)
      // Eye
      graphics.fillStyle(0xffffff, 1)
      graphics.fillCircle(size * 0.7, -size * 0.1, 3)
      graphics.fillStyle(0x000000, 1)
      graphics.fillCircle(size * 0.72, -size * 0.1, 1.5)
      break

    case 'crab':
      // Body
      graphics.fillStyle(c, 1)
      graphics.fillEllipse(0, 0, size * 1.2, size * 0.8)
      // Claws
      graphics.fillStyle(darkC, 1)
      graphics.fillCircle(-size * 0.7, -size * 0.15, size * 0.22)
      graphics.fillCircle(size * 0.7, -size * 0.15, size * 0.22)
      // Legs
      for (let i = 0; i < 3; i++) {
        const ly = size * 0.1 + i * size * 0.15
        graphics.fillRect(-size * 0.7, ly, size * 0.3, 3)
        graphics.fillRect(size * 0.4, ly, size * 0.3, 3)
      }
      // Eyes
      graphics.fillStyle(0xffffff, 1)
      graphics.fillCircle(-size * 0.2, -size * 0.25, 4)
      graphics.fillCircle(size * 0.2, -size * 0.25, 4)
      graphics.fillStyle(0x000000, 1)
      graphics.fillCircle(-size * 0.18, -size * 0.25, 2)
      graphics.fillCircle(size * 0.22, -size * 0.25, 2)
      break

    case 'bull': case 'rhino': case 'ram':
      // Body
      graphics.fillStyle(c, 1)
      graphics.fillEllipse(0, size * 0.05, size * 1.4, size * 0.9)
      // Head
      graphics.fillEllipse(size * 0.55, -size * 0.1, size * 0.55, size * 0.5)
      // Horns
      graphics.fillStyle(0xcbd5e0, 1)
      graphics.fillTriangle(size * 0.5, -size * 0.4, size * 0.35, -size * 0.65, size * 0.6, -size * 0.3)
      graphics.fillTriangle(size * 0.7, -size * 0.35, size * 0.85, -size * 0.6, size * 0.8, -size * 0.25)
      // Legs
      graphics.fillStyle(darkC, 1)
      graphics.fillRect(-size * 0.35, size * 0.3, size * 0.15, size * 0.25)
      graphics.fillRect(size * 0.2, size * 0.3, size * 0.15, size * 0.25)
      // Eye
      graphics.fillStyle(0xffffff, 1)
      graphics.fillCircle(size * 0.65, -size * 0.15, 4)
      graphics.fillStyle(0x000000, 1)
      graphics.fillCircle(size * 0.67, -size * 0.15, 2)
      break

    case 'ferret':
      // Long body
      graphics.fillStyle(c, 1)
      graphics.fillEllipse(0, 0, size * 1.6, size * 0.5)
      // Head
      graphics.fillCircle(size * 0.65, -size * 0.05, size * 0.25)
      // Tail
      graphics.fillStyle(darkC, 1)
      graphics.fillEllipse(-size * 0.8, -size * 0.1, size * 0.35, size * 0.15)
      // Eye
      graphics.fillStyle(0xffffff, 1)
      graphics.fillCircle(size * 0.72, -size * 0.1, 3)
      graphics.fillStyle(0x000000, 1)
      graphics.fillCircle(size * 0.74, -size * 0.1, 1.5)
      break

    case 'boulder': case 'golem': case 'titan':
      // Main body rock
      graphics.fillStyle(darkC, 1)
      graphics.fillRoundedRect(-size * 0.55, -size * 0.5, size * 1.1, size * 1.0, size * 0.2)
      // Highlight facets
      graphics.fillStyle(c, 1)
      graphics.fillRoundedRect(-size * 0.4, -size * 0.4, size * 0.8, size * 0.7, size * 0.15)
      // Cracks
      graphics.lineStyle(2, 0x1a202c, 0.5)
      graphics.lineBetween(-size * 0.2, -size * 0.3, size * 0.1, size * 0.2)
      graphics.lineBetween(size * 0.1, -size * 0.2, -size * 0.15, size * 0.1)
      // Eyes
      graphics.fillStyle(0xffffff, 1)
      graphics.fillCircle(-size * 0.15, -size * 0.15, 5)
      graphics.fillCircle(size * 0.15, -size * 0.15, 5)
      graphics.fillStyle(0x000000, 1)
      graphics.fillCircle(-size * 0.13, -size * 0.15, 2.5)
      graphics.fillCircle(size * 0.17, -size * 0.15, 2.5)
      break

    case 'blob':
      // Blobby shape
      graphics.fillStyle(c, 0.8)
      graphics.fillCircle(0, 0, size * 0.55)
      graphics.fillEllipse(-size * 0.2, size * 0.15, size * 0.4, size * 0.3)
      graphics.fillEllipse(size * 0.25, size * 0.1, size * 0.3, size * 0.25)
      // Drips
      graphics.fillStyle(darkC, 0.6)
      graphics.fillEllipse(-size * 0.3, size * 0.35, size * 0.15, size * 0.2)
      graphics.fillEllipse(size * 0.15, size * 0.4, size * 0.12, size * 0.18)
      // Eyes
      graphics.fillStyle(0xffffff, 1)
      graphics.fillCircle(-size * 0.12, -size * 0.1, 5)
      graphics.fillCircle(size * 0.12, -size * 0.1, 5)
      graphics.fillStyle(0x000000, 1)
      graphics.fillCircle(-size * 0.1, -size * 0.1, 2.5)
      graphics.fillCircle(size * 0.14, -size * 0.1, 2.5)
      break

    case 'frog':
      // Body
      graphics.fillStyle(c, 1)
      graphics.fillEllipse(0, size * 0.05, size * 0.9, size * 0.7)
      // Head
      graphics.fillEllipse(0, -size * 0.25, size * 0.7, size * 0.45)
      // Legs tucked
      graphics.fillStyle(darkC, 1)
      graphics.fillEllipse(-size * 0.4, size * 0.2, size * 0.3, size * 0.2)
      graphics.fillEllipse(size * 0.4, size * 0.2, size * 0.3, size * 0.2)
      // Eyes (big frog eyes)
      graphics.fillStyle(0xffffff, 1)
      graphics.fillCircle(-size * 0.18, -size * 0.35, 6)
      graphics.fillCircle(size * 0.18, -size * 0.35, 6)
      graphics.fillStyle(0x000000, 1)
      graphics.fillCircle(-size * 0.16, -size * 0.35, 3)
      graphics.fillCircle(size * 0.2, -size * 0.35, 3)
      break

    case 'jaw':
      // Body
      graphics.fillStyle(c, 1)
      graphics.fillRoundedRect(-size * 0.45, -size * 0.3, size * 0.9, size * 0.7, size * 0.1)
      // Upper jaw
      graphics.fillStyle(darkC, 1)
      graphics.fillTriangle(-size * 0.45, -size * 0.1, size * 0.45, -size * 0.1, 0, -size * 0.55)
      // Teeth
      graphics.fillStyle(0xffffff, 1)
      for (let i = -2; i <= 2; i++) {
        graphics.fillTriangle(i * size * 0.15, -size * 0.1, i * size * 0.15 - 4, -size * 0.22, i * size * 0.15 + 4, -size * 0.22)
      }
      // Eyes
      graphics.fillCircle(-size * 0.15, -size * 0.2, 4)
      graphics.fillCircle(size * 0.15, -size * 0.2, 4)
      graphics.fillStyle(0xff0000, 1)
      graphics.fillCircle(-size * 0.13, -size * 0.2, 2)
      graphics.fillCircle(size * 0.17, -size * 0.2, 2)
      break

    case 'armadillo':
      // Shell bands
      graphics.fillStyle(darkC, 1)
      graphics.fillEllipse(0, 0, size * 1.2, size * 0.85)
      graphics.fillStyle(c, 1)
      for (let i = -2; i <= 2; i++) {
        graphics.fillRect(-size * 0.5, i * size * 0.12 - size * 0.04, size * 1.0, size * 0.06)
      }
      // Head poking out
      graphics.fillEllipse(size * 0.55, size * 0.05, size * 0.35, size * 0.3)
      // Eye
      graphics.fillStyle(0xffffff, 1)
      graphics.fillCircle(size * 0.62, -size * 0.02, 3)
      graphics.fillStyle(0x000000, 1)
      graphics.fillCircle(size * 0.64, -size * 0.02, 1.5)
      break

    case 'mole':
      // Body
      graphics.fillStyle(c, 1)
      graphics.fillEllipse(0, size * 0.05, size * 1.0, size * 0.7)
      // Snout
      graphics.fillEllipse(size * 0.4, size * 0.1, size * 0.35, size * 0.25)
      // Nose
      graphics.fillStyle(0xfc8181, 1)
      graphics.fillCircle(size * 0.55, size * 0.08, 4)
      // Claws
      graphics.fillStyle(darkC, 1)
      graphics.fillEllipse(-size * 0.35, size * 0.25, size * 0.3, size * 0.15)
      graphics.fillEllipse(size * 0.1, size * 0.25, size * 0.3, size * 0.15)
      // Eyes (tiny)
      graphics.fillStyle(0x000000, 1)
      graphics.fillCircle(size * 0.3, -size * 0.02, 2)
      break

    case 'bear':
      // Body
      graphics.fillStyle(c, 1)
      graphics.fillEllipse(0, size * 0.05, size * 1.2, size * 1.0)
      // Head
      graphics.fillCircle(0, -size * 0.4, size * 0.35)
      // Ears
      graphics.fillStyle(darkC, 1)
      graphics.fillCircle(-size * 0.25, -size * 0.6, size * 0.12)
      graphics.fillCircle(size * 0.25, -size * 0.6, size * 0.12)
      // Snout
      graphics.fillStyle(0xcbd5e0, 0.4)
      graphics.fillEllipse(0, -size * 0.32, size * 0.2, size * 0.13)
      // Eyes
      graphics.fillStyle(0xffffff, 1)
      graphics.fillCircle(-size * 0.12, -size * 0.45, 4)
      graphics.fillCircle(size * 0.12, -size * 0.45, 4)
      graphics.fillStyle(0x000000, 1)
      graphics.fillCircle(-size * 0.1, -size * 0.45, 2)
      graphics.fillCircle(size * 0.14, -size * 0.45, 2)
      break

    case 'sprite': case 'vine':
    default:
      // Generic magical creature
      graphics.fillStyle(c, 1)
      graphics.fillCircle(0, 0, size * 0.4)
      // Floating wisps
      graphics.fillStyle(c, 0.5)
      graphics.fillCircle(-size * 0.3, -size * 0.25, size * 0.15)
      graphics.fillCircle(size * 0.35, -size * 0.2, size * 0.12)
      graphics.fillCircle(-size * 0.15, size * 0.3, size * 0.1)
      // Eyes
      graphics.fillStyle(0xffffff, 1)
      graphics.fillCircle(-size * 0.1, -size * 0.05, 4)
      graphics.fillCircle(size * 0.1, -size * 0.05, 4)
      graphics.fillStyle(0x000000, 1)
      graphics.fillCircle(-size * 0.08, -size * 0.05, 2)
      graphics.fillCircle(size * 0.12, -size * 0.05, 2)
      break

    case 'viper':
      // Coiled body
      graphics.fillStyle(c, 1)
      graphics.fillEllipse(0, size * 0.1, size * 1.0, size * 0.6)
      // Head raised
      graphics.fillStyle(c, 1)
      graphics.fillEllipse(size * 0.3, -size * 0.25, size * 0.4, size * 0.3)
      // Fangs
      graphics.fillStyle(0xffffff, 1)
      graphics.fillTriangle(size * 0.4, -size * 0.1, size * 0.37, -size * 0.02, size * 0.43, -size * 0.02)
      graphics.fillTriangle(size * 0.5, -size * 0.1, size * 0.47, -size * 0.02, size * 0.53, -size * 0.02)
      // Pattern
      graphics.fillStyle(darkC, 1)
      graphics.fillCircle(-size * 0.15, size * 0.1, size * 0.08)
      graphics.fillCircle(size * 0.05, size * 0.15, size * 0.06)
      graphics.fillCircle(-size * 0.3, size * 0.05, size * 0.06)
      // Eyes
      graphics.fillStyle(0xffffff, 1)
      graphics.fillCircle(size * 0.35, -size * 0.3, 3)
      graphics.fillStyle(0xff0000, 1)
      graphics.fillCircle(size * 0.37, -size * 0.3, 1.5)
      break

    case 'beast':
      // Stocky quadruped
      graphics.fillStyle(c, 1)
      graphics.fillEllipse(0, 0, size * 1.3, size * 0.8)
      // Head
      graphics.fillEllipse(size * 0.5, -size * 0.15, size * 0.5, size * 0.4)
      // Legs
      graphics.fillStyle(darkC, 1)
      graphics.fillRect(-size * 0.4, size * 0.25, size * 0.15, size * 0.25)
      graphics.fillRect(-size * 0.1, size * 0.25, size * 0.15, size * 0.25)
      graphics.fillRect(size * 0.15, size * 0.25, size * 0.15, size * 0.25)
      graphics.fillRect(size * 0.35, size * 0.25, size * 0.15, size * 0.25)
      // Eye
      graphics.fillStyle(0xffffff, 1)
      graphics.fillCircle(size * 0.6, -size * 0.2, 4)
      graphics.fillStyle(0x000000, 1)
      graphics.fillCircle(size * 0.62, -size * 0.2, 2)
      break
  }
}

// Particle colors per type
const PARTICLE_COLORS = {
  fire: [0xf56565, 0xfc8181, 0xfeb2b2, 0xf6e05e],
  water: [0x4299e1, 0x63b3ed, 0xbee3f8, 0x90cdf4],
  grass: [0x48bb78, 0x68d391, 0xc6f6d5, 0x9ae6b4],
  electric: [0xecc94b, 0xf6e05e, 0xfefcbf, 0xfaf089],
  rock: [0xa8895a, 0xc4a87a, 0xe8d5b5, 0x8b7355],
  ground: [0xc08a30, 0xd4a54a, 0xf0d89a, 0xa67c2e],
  poison: [0x9f7aea, 0xb794f4, 0xe9d8fd, 0xd6bcfa],
  normal: [0x718096, 0xa0aec0, 0xcbd5e0, 0xe2e8f0],
}

export class BattleScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BattleScene' })
  }

  init(data) {
    this.battleData = data
    this.playerTeam = data.playerTeam || []
    this.aiTeam = data.aiTeam || []
    this.difficulty = data.difficulty || 'easy'
    this.onPlayerAction = data.onPlayerAction || (() => {})
    this.onBattleEnd = data.onBattleEnd || (() => {})
    this.playerActiveIdx = 0
    this.aiActiveIdx = 0
    this.isAnimating = false
    this.battleOver = false
    this.logLines = []
  }

  create() {
    // Background gradient
    this.drawBackground()

    // Create containers for creatures
    this.playerContainer = this.add.container(PLAYER_X, PLAYER_Y)
    this.enemyContainer = this.add.container(ENEMY_X, ENEMY_Y)

    // Draw initial creatures
    this.drawPlayerCreature()
    this.drawEnemyCreature()

    // Info panels
    this.createInfoPanels()

    // Battle log
    this.createBattleLog()

    // Move buttons (hidden initially, shown after setup)
    this.createMoveButtons()

    // Platform shadows
    this.drawPlatforms()

    // Start idle animations
    this.startIdleAnimations()

    // Initial log
    this.addLogLine(`Battle start! Go, ${this.getPlayerCreature().name}!`)
    this.addLogLine(`Enemy sends out ${this.getAiCreature().name}!`)

    // Show buttons after a short delay
    this._delayTimer = setTimeout(() => {
      if (!this.battleOver) this.showMoveButtons()
    }, 800)
  }

  drawBackground() {
    // Battlefield gradient
    const bg = this.add.graphics()
    bg.fillGradientStyle(0x0f172a, 0x0f172a, 0x1e293b, 0x1e293b, 1)
    bg.fillRect(0, 0, W, H)

    // Ground line
    bg.fillStyle(0x1a202c, 1)
    bg.fillRect(0, H * 0.72, W, H * 0.28)

    // Subtle grid on ground
    bg.lineStyle(1, 0x2d3748, 0.15)
    for (let x = 0; x < W; x += 40) {
      bg.lineBetween(x, H * 0.72, x, H)
    }
    for (let y = H * 0.72; y < H; y += 20) {
      bg.lineBetween(0, y, W, y)
    }
  }

  drawPlatforms() {
    const pg = this.add.graphics()
    // Player platform
    pg.fillStyle(0x2d3748, 0.6)
    pg.fillEllipse(PLAYER_X, PLAYER_Y + CREATURE_SIZE * 0.5, CREATURE_SIZE * 2, CREATURE_SIZE * 0.4)
    // Enemy platform
    pg.fillStyle(0x2d3748, 0.6)
    pg.fillEllipse(ENEMY_X, ENEMY_Y + CREATURE_SIZE * ENEMY_SCALE * 0.5, CREATURE_SIZE * 1.6, CREATURE_SIZE * 0.3)
  }

  getPlayerCreature() { return this.playerTeam[this.playerActiveIdx] }
  getAiCreature() { return this.aiTeam[this.aiActiveIdx] }

  drawPlayerCreature() {
    this.playerContainer.removeAll(true)
    const creature = this.getPlayerCreature()
    if (!creature || creature.fainted) return

    const g = this.add.graphics()
    drawCreature(g, creature.shape, TYPE_COLORS[creature.type]?.accent || '#718096', CREATURE_SIZE)
    this.playerContainer.add(g)
    this.playerContainer.setScale(1)
    this.playerContainer.setAlpha(1)

    // Glow
    const glow = this.add.graphics()
    glow.fillStyle(hexToNum(TYPE_COLORS[creature.type]?.accent || '#718096'), 0.15)
    glow.fillCircle(0, 0, CREATURE_SIZE * 0.8)
    this.playerContainer.addAt(glow, 0)
    this.playerGlow = glow
  }

  drawEnemyCreature() {
    this.enemyContainer.removeAll(true)
    const creature = this.getAiCreature()
    if (!creature || creature.fainted) return

    const g = this.add.graphics()
    drawCreature(g, creature.shape, TYPE_COLORS[creature.type]?.accent || '#718096', CREATURE_SIZE * ENEMY_SCALE)
    g.setScale(-1, 1) // Mirror enemy
    this.enemyContainer.add(g)
    this.enemyContainer.setScale(1)
    this.enemyContainer.setAlpha(1)

    // Glow
    const glow = this.add.graphics()
    glow.fillStyle(hexToNum(TYPE_COLORS[creature.type]?.accent || '#718096'), 0.15)
    glow.fillCircle(0, 0, CREATURE_SIZE * ENEMY_SCALE * 0.8)
    this.enemyContainer.addAt(glow, 0)
    this.enemyGlow = glow
  }

  startIdleAnimations() {
    // Player creature bob
    this.tweens.add({
      targets: this.playerContainer,
      y: PLAYER_Y - 4,
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    })
    // Enemy creature bob
    this.tweens.add({
      targets: this.enemyContainer,
      y: ENEMY_Y - 3,
      duration: 1800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    })
    // Glow pulse
    if (this.playerGlow) {
      this.tweens.add({
        targets: this.playerGlow,
        alpha: 0.08,
        duration: 1200,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      })
    }
    if (this.enemyGlow) {
      this.tweens.add({
        targets: this.enemyGlow,
        alpha: 0.08,
        duration: 1400,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      })
    }
  }

  // ===================== INFO PANELS =====================

  createInfoPanels() {
    // Enemy info — upper left
    this.enemyInfoBg = this.add.graphics()
    this.drawInfoPanel(this.enemyInfoBg, 20, 20, 220, 65, 'ai')
    this.enemyNameText = this.add.text(30, 28, '', { fontSize: '15px', fontFamily: 'Rajdhani', fontStyle: 'bold', color: '#e2e8f0' })
    this.enemyLevelText = this.add.text(200, 28, '', { fontSize: '13px', fontFamily: 'Rajdhani', fontStyle: 'bold', color: '#94a3b8', align: 'right' })
    this.enemyHpBarBg = this.add.graphics()
    this.enemyHpBar = this.add.graphics()
    this.enemyHpText = this.add.text(30, 63, '', { fontSize: '11px', fontFamily: 'Rajdhani', color: '#64748b' })
    this.enemyTypeBadge = this.add.text(30, 48, '', { fontSize: '11px', fontFamily: 'Rajdhani', fontStyle: 'bold', color: '#94a3b8' })

    // Player info — lower right
    this.playerInfoBg = this.add.graphics()
    this.drawInfoPanel(this.playerInfoBg, W - 245, H - 155, 225, 70, 'player')
    this.playerNameText = this.add.text(W - 235, H - 148, '', { fontSize: '15px', fontFamily: 'Rajdhani', fontStyle: 'bold', color: '#e2e8f0' })
    this.playerLevelText = this.add.text(W - 60, H - 148, '', { fontSize: '13px', fontFamily: 'Rajdhani', fontStyle: 'bold', color: '#94a3b8', align: 'right' })
    this.playerHpBarBg = this.add.graphics()
    this.playerHpBar = this.add.graphics()
    this.playerHpText = this.add.text(W - 235, H - 100, '', { fontSize: '11px', fontFamily: 'Rajdhani', color: '#64748b' })
    this.playerTypeBadge = this.add.text(W - 235, H - 115, '', { fontSize: '11px', fontFamily: 'Rajdhani', fontStyle: 'bold', color: '#94a3b8' })

    this.updateInfoPanels()
  }

  drawInfoPanel(g, x, y, w, h, side) {
    g.clear()
    g.fillStyle(0x1e293b, 0.9)
    g.fillRoundedRect(x, y, w, h, 8)
    g.lineStyle(1, 0x334155, 0.8)
    g.strokeRoundedRect(x, y, w, h, 8)
  }

  updateInfoPanels() {
    const player = this.getPlayerCreature()
    const enemy = this.getAiCreature()

    if (player) {
      this.playerNameText.setText(player.name)
      this.playerLevelText.setText(`Lv${player.level}`)
      this.playerTypeBadge.setText(player.type.toUpperCase())
      this.playerTypeBadge.setColor(TYPE_COLORS[player.type]?.light || '#94a3b8')
      this.updateHpBar('player', player)
    }

    if (enemy) {
      this.enemyNameText.setText(enemy.name)
      this.enemyLevelText.setText(`Lv${enemy.level}`)
      this.enemyTypeBadge.setText(enemy.type.toUpperCase())
      this.enemyTypeBadge.setColor(TYPE_COLORS[enemy.type]?.light || '#94a3b8')
      this.updateHpBar('ai', enemy)
    }
  }

  updateHpBar(side, creature) {
    const maxHp = creature.currentStats.hp
    const curHp = Math.max(0, creature.currentHp)
    const pct = curHp / maxHp

    if (side === 'player') {
      const x = W - 235
      const y = H - 128
      const barW = 200
      this.playerHpBarBg.clear()
      this.playerHpBarBg.fillStyle(0x1a202c, 1)
      this.playerHpBarBg.fillRoundedRect(x, y, barW, 10, 3)
      this.playerHpBar.clear()
      this.playerHpBar.fillStyle(hpColor(pct), 1)
      this.playerHpBar.fillRoundedRect(x, y, barW * pct, 10, 3)
      this.playerHpText.setText(`${curHp} / ${maxHp}`)
    } else {
      const x = 30
      const y = 58
      const barW = 195
      this.enemyHpBarBg.clear()
      this.enemyHpBarBg.fillStyle(0x1a202c, 1)
      this.enemyHpBarBg.fillRoundedRect(x, y, barW, 8, 3)
      this.enemyHpBar.clear()
      this.enemyHpBar.fillStyle(hpColor(pct), 1)
      this.enemyHpBar.fillRoundedRect(x, y, barW * pct, 8, 3)
      this.enemyHpText.setText(`${curHp} / ${maxHp}`)
    }
  }

  // ===================== BATTLE LOG =====================

  createBattleLog() {
    this.logBg = this.add.graphics()
    this.logBg.fillStyle(0x0f172a, 0.92)
    this.logBg.fillRoundedRect(10, H - 78, W - 20, 38, 6)
    this.logBg.lineStyle(1, 0x334155, 0.5)
    this.logBg.strokeRoundedRect(10, H - 78, W - 20, 38, 6)

    this.logText = this.add.text(20, H - 72, '', {
      fontSize: '13px',
      fontFamily: 'Rajdhani',
      color: '#94a3b8',
      wordWrap: { width: W - 50 },
      lineSpacing: 2,
    })
  }

  addLogLine(text) {
    this.logLines.push(text)
    if (this.logLines.length > 3) this.logLines.shift()
    if (this.logText) {
      this.logText.setText(this.logLines.join('\n'))
    }
  }

  // ===================== MOVE BUTTONS =====================

  createMoveButtons() {
    this.moveButtonContainer = this.add.container(0, 0)
    this.moveButtonContainer.setVisible(false)
    this.switchButton = null
  }

  showMoveButtons() {
    if (this.battleOver || this.isAnimating) return
    this.moveButtonContainer.removeAll(true)

    const creature = this.getPlayerCreature()
    if (!creature || creature.fainted) return

    const moves = creature.currentMoves.map(id => MOVES[id]).filter(Boolean)
    const btnW = 175
    const btnH = 48
    const gap = 8
    const totalW = moves.length * btnW + (moves.length - 1) * gap
    const startX = (W - totalW) / 2
    const btnY = H - 75

    // Background panel
    const panelBg = this.add.graphics()
    panelBg.fillStyle(0x0f172a, 0.95)
    panelBg.fillRoundedRect(startX - 12, btnY - 8, totalW + 24, btnH + 16, 8)
    panelBg.lineStyle(1, 0x334155, 0.6)
    panelBg.strokeRoundedRect(startX - 12, btnY - 8, totalW + 24, btnH + 16, 8)
    this.moveButtonContainer.add(panelBg)

    moves.forEach((move, i) => {
      const x = startX + i * (btnW + gap)
      const colors = TYPE_COLORS[move.type]
      const bgColor = hexToNum(colors?.dark || '#334155')
      const borderColor = hexToNum(colors?.accent || '#94a3b8')

      const btn = this.add.graphics()
      btn.fillStyle(bgColor, 0.9)
      btn.fillRoundedRect(x, btnY, btnW, btnH, 6)
      btn.lineStyle(1.5, borderColor, 0.7)
      btn.strokeRoundedRect(x, btnY, btnW, btnH, 6)

      const nameText = this.add.text(x + 8, btnY + 5, move.name, {
        fontSize: '13px', fontFamily: 'Rajdhani', fontStyle: 'bold', color: colors?.light || '#e2e8f0',
      })

      let detailStr = move.category === 'status' ? 'STATUS' : `PWR ${move.power}  ACC ${move.accuracy}%`
      const catStr = move.category.charAt(0).toUpperCase() + move.category.slice(1, 4)
      const detailText = this.add.text(x + 8, btnY + 24, `${detailStr}  ${catStr}`, {
        fontSize: '10px', fontFamily: 'Rajdhani', color: '#94a3b8',
      })

      // STAB indicator
      if (move.type === creature.type) {
        const stabText = this.add.text(x + btnW - 35, btnY + 6, 'STAB', {
          fontSize: '9px', fontFamily: 'Rajdhani', fontStyle: 'bold', color: '#fbbf24',
        })
        this.moveButtonContainer.add(stabText)
      }

      // Hit zone
      const hitZone = this.add.zone(x + btnW / 2, btnY + btnH / 2, btnW, btnH).setInteractive({ useHandCursor: true })
      hitZone.on('pointerover', () => {
        btn.clear()
        btn.fillStyle(bgColor, 1)
        btn.fillRoundedRect(x, btnY, btnW, btnH, 6)
        btn.lineStyle(2, borderColor, 1)
        btn.strokeRoundedRect(x, btnY, btnW, btnH, 6)
      })
      hitZone.on('pointerout', () => {
        btn.clear()
        btn.fillStyle(bgColor, 0.9)
        btn.fillRoundedRect(x, btnY, btnW, btnH, 6)
        btn.lineStyle(1.5, borderColor, 0.7)
        btn.strokeRoundedRect(x, btnY, btnW, btnH, 6)
      })
      hitZone.on('pointerdown', () => {
        if (this.isAnimating) return
        this.hideMoveButtons()
        this.onPlayerAction({ type: 'attack', moveId: move.id })
      })

      this.moveButtonContainer.add([btn, nameText, detailText, hitZone])
    })

    // Switch button
    const switchX = startX + totalW + gap + 12
    const switchW = 70
    if (switchX + switchW < W - 10) {
      const switchBg = this.add.graphics()
      switchBg.fillStyle(0x334155, 0.9)
      switchBg.fillRoundedRect(switchX, btnY, switchW, btnH, 6)
      switchBg.lineStyle(1, 0x4a5568, 0.7)
      switchBg.strokeRoundedRect(switchX, btnY, switchW, btnH, 6)

      const switchText = this.add.text(switchX + 10, btnY + 14, 'SWITCH', {
        fontSize: '12px', fontFamily: 'Rajdhani', fontStyle: 'bold', color: '#94a3b8',
      })

      const switchZone = this.add.zone(switchX + switchW / 2, btnY + btnH / 2, switchW, btnH).setInteractive({ useHandCursor: true })
      switchZone.on('pointerdown', () => {
        if (this.isAnimating) return
        this.showSwitchPanel()
      })

      this.moveButtonContainer.add([switchBg, switchText, switchZone])
    }

    this.moveButtonContainer.setVisible(true)

    // Hide the log bg overlap by raising buttons
    this.logBg.setVisible(false)
    this.logText.setVisible(false)
  }

  hideMoveButtons() {
    this.moveButtonContainer.setVisible(false)
    this.logBg.setVisible(true)
    this.logText.setVisible(true)
  }

  showSwitchPanel() {
    this.hideMoveButtons()

    const panel = this.add.container(0, 0)
    const panelBg = this.add.graphics()
    panelBg.fillStyle(0x0f172a, 0.95)
    panelBg.fillRoundedRect(W / 2 - 200, H / 2 - 80, 400, 160, 10)
    panelBg.lineStyle(1, 0x334155, 0.8)
    panelBg.strokeRoundedRect(W / 2 - 200, H / 2 - 80, 400, 160, 10)
    panel.add(panelBg)

    const title = this.add.text(W / 2, H / 2 - 65, 'SWITCH CREATURE', {
      fontSize: '14px', fontFamily: 'Orbitron', fontStyle: 'bold', color: '#e2e8f0', align: 'center',
    }).setOrigin(0.5)
    panel.add(title)

    let col = 0
    this.playerTeam.forEach((creature, idx) => {
      if (idx === this.playerActiveIdx || creature.fainted) return

      const x = W / 2 - 160 + col * 170
      const y = H / 2 - 30
      const colors = TYPE_COLORS[creature.type]

      const cardBg = this.add.graphics()
      cardBg.fillStyle(hexToNum(colors?.dark || '#334155'), 0.7)
      cardBg.fillRoundedRect(x, y, 150, 80, 6)
      cardBg.lineStyle(1, hexToNum(colors?.accent || '#94a3b8'), 0.6)
      cardBg.strokeRoundedRect(x, y, 150, 80, 6)

      const nameT = this.add.text(x + 10, y + 8, creature.name, {
        fontSize: '14px', fontFamily: 'Rajdhani', fontStyle: 'bold', color: colors?.light || '#e2e8f0',
      })
      const hpPct = creature.currentHp / creature.currentStats.hp
      const hpT = this.add.text(x + 10, y + 28, `HP: ${creature.currentHp}/${creature.currentStats.hp}`, {
        fontSize: '11px', fontFamily: 'Rajdhani', color: '#94a3b8',
      })
      const typeT = this.add.text(x + 10, y + 46, creature.type.toUpperCase(), {
        fontSize: '10px', fontFamily: 'Rajdhani', fontStyle: 'bold', color: colors?.accent || '#94a3b8',
      })

      const zone = this.add.zone(x + 75, y + 40, 150, 80).setInteractive({ useHandCursor: true })
      zone.on('pointerdown', () => {
        panel.destroy(true)
        this.onPlayerAction({ type: 'switch', targetIndex: idx })
      })

      panel.add([cardBg, nameT, hpT, typeT, zone])
      col++
    })

    // Cancel button
    const cancelT = this.add.text(W / 2, H / 2 + 60, 'CANCEL', {
      fontSize: '12px', fontFamily: 'Rajdhani', fontStyle: 'bold', color: '#64748b',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })
    cancelT.on('pointerdown', () => {
      panel.destroy(true)
      this.showMoveButtons()
    })
    panel.add(cancelT)
  }

  // ===================== FORCE SWITCH (after faint) =====================

  showForceSwitchPanel() {
    const panel = this.add.container(0, 0)
    const panelBg = this.add.graphics()
    panelBg.fillStyle(0x0f172a, 0.95)
    panelBg.fillRoundedRect(W / 2 - 200, H / 2 - 80, 400, 160, 10)
    panelBg.lineStyle(1, 0xf56565, 0.5)
    panelBg.strokeRoundedRect(W / 2 - 200, H / 2 - 80, 400, 160, 10)
    panel.add(panelBg)

    const title = this.add.text(W / 2, H / 2 - 65, 'CHOOSE NEXT CREATURE', {
      fontSize: '14px', fontFamily: 'Orbitron', fontStyle: 'bold', color: '#fc8181', align: 'center',
    }).setOrigin(0.5)
    panel.add(title)

    let col = 0
    this.playerTeam.forEach((creature, idx) => {
      if (creature.fainted) return

      const x = W / 2 - 160 + col * 170
      const y = H / 2 - 30
      const colors = TYPE_COLORS[creature.type]

      const cardBg = this.add.graphics()
      cardBg.fillStyle(hexToNum(colors?.dark || '#334155'), 0.7)
      cardBg.fillRoundedRect(x, y, 150, 80, 6)
      cardBg.lineStyle(1, hexToNum(colors?.accent || '#94a3b8'), 0.6)
      cardBg.strokeRoundedRect(x, y, 150, 80, 6)

      const nameT = this.add.text(x + 10, y + 8, creature.name, {
        fontSize: '14px', fontFamily: 'Rajdhani', fontStyle: 'bold', color: colors?.light || '#e2e8f0',
      })
      const hpT = this.add.text(x + 10, y + 28, `HP: ${creature.currentHp}/${creature.currentStats.hp}`, {
        fontSize: '11px', fontFamily: 'Rajdhani', color: '#94a3b8',
      })
      const typeT = this.add.text(x + 10, y + 46, creature.type.toUpperCase(), {
        fontSize: '10px', fontFamily: 'Rajdhani', fontStyle: 'bold', color: colors?.accent || '#94a3b8',
      })

      const zone = this.add.zone(x + 75, y + 40, 150, 80).setInteractive({ useHandCursor: true })
      zone.on('pointerdown', () => {
        panel.destroy(true)
        this.playerActiveIdx = idx
        this.drawPlayerCreature()
        this.updateInfoPanels()
        this.startIdleAnimations()
        this.addLogLine(`Go, ${this.getPlayerCreature().name}!`)
        setTimeout(() => this.showMoveButtons(), 500)
      })

      panel.add([cardBg, nameT, hpT, typeT, zone])
      col++
    })
  }

  // ===================== ANIMATIONS =====================

  animateEvents(events, onComplete) {
    this.isAnimating = true
    let idx = 0

    const next = () => {
      if (idx >= events.length) {
        this.isAnimating = false
        onComplete()
        return
      }
      const event = events[idx++]
      this.animateEvent(event, next)
    }
    next()
  }

  animateEvent(event, originalDone) {
    // Safety: ensure onDone always fires even if a tween gets stuck
    let done = false
    const onDone = () => {
      if (done) return
      done = true
      clearTimeout(safetyTimer)
      originalDone()
    }
    const safetyTimer = setTimeout(onDone, 3000)

    const delay = (ms) => setTimeout(onDone, ms)

    switch (event.type) {
      case 'attack': {
        const isPlayer = event.data.creature === 'player'
        const container = isPlayer ? this.playerContainer : this.enemyContainer
        const origX = isPlayer ? PLAYER_X : ENEMY_X
        const lungeX = isPlayer ? origX + 40 : origX - 40

        this.addLogLine(`${event.data.name} used ${event.data.move}!`)

        // Spawn attack particles
        this.spawnAttackParticles(isPlayer, event.data.moveType)

        this.tweens.add({
          targets: container,
          x: lungeX,
          duration: 150,
          yoyo: true,
          ease: 'Power2',
          onComplete: () => delay(200),
        })
        break
      }

      case 'damage': {
        const isPlayer = event.data.creature === 'player'
        const container = isPlayer ? this.playerContainer : this.enemyContainer

        // Flash white
        this.tweens.add({
          targets: container,
          alpha: 0.3,
          duration: 80,
          yoyo: true,
          repeat: 2,
        })

        // Shake
        const origX = container.x
        this.tweens.add({
          targets: container,
          x: origX + 6,
          duration: 40,
          yoyo: true,
          repeat: 3,
          onComplete: () => { container.x = origX },
        })

        // Animate HP bar
        const creature = isPlayer ? this.getPlayerCreature() : this.getAiCreature()
        this.tweenHpBar(isPlayer ? 'player' : 'ai', creature, () => delay(300))
        break
      }

      case 'effectiveness': {
        let text = ''
        let color = '#e2e8f0'
        if (event.data.multiplier > 1) { text = "Super effective!"; color = '#48bb78' }
        else if (event.data.multiplier < 1 && event.data.multiplier > 0) { text = "Not very effective..."; color = '#ecc94b' }
        else if (event.data.multiplier === 0) { text = "No effect!"; color = '#f56565' }

        if (text) {
          this.addLogLine(text)
          const popup = this.add.text(W / 2, H / 2 - 20, text, {
            fontSize: '20px', fontFamily: 'Orbitron', fontStyle: 'bold', color,
          }).setOrigin(0.5).setAlpha(0)

          this.tweens.add({
            targets: popup,
            alpha: 1,
            y: H / 2 - 40,
            duration: 300,
            hold: 600,
            yoyo: true,
            onComplete: () => { popup.destroy(); onDone() },
          })

          // Screen shake on super effective
          if (event.data.multiplier > 1) {
            this.cameras.main.shake(200, 0.01)
          }
        } else {
          onDone()
        }
        break
      }

      case 'stab': {
        const isPlayer = event.data.creature === 'player'
        const container = isPlayer ? this.playerContainer : this.enemyContainer
        this.tweens.add({
          targets: container,
          scaleX: 1.1,
          scaleY: 1.1,
          duration: 150,
          yoyo: true,
          ease: 'Power2',
          onComplete: () => onDone(),
        })
        break
      }

      case 'miss': {
        this.addLogLine(`${event.data.name}'s attack missed!`)
        const popup = this.add.text(W / 2, H / 2, 'MISSED!', {
          fontSize: '18px', fontFamily: 'Orbitron', fontStyle: 'bold', color: '#94a3b8',
        }).setOrigin(0.5).setAlpha(0)

        this.tweens.add({
          targets: popup,
          alpha: 1,
          y: H / 2 - 20,
          duration: 200,
          hold: 500,
          yoyo: true,
          onComplete: () => { popup.destroy(); onDone() },
        })
        break
      }

      case 'faint': {
        const isPlayer = event.data.creature === 'player'
        const container = isPlayer ? this.playerContainer : this.enemyContainer
        this.addLogLine(`${event.data.name} fainted!`)

        this.tweens.add({
          targets: container,
          scaleX: 0,
          scaleY: 0,
          alpha: 0,
          duration: 500,
          ease: 'Power2',
          onComplete: () => delay(300),
        })
        break
      }

      case 'switch': {
        const isPlayer = event.data.creature === 'player'
        const container = isPlayer ? this.playerContainer : this.enemyContainer

        this.addLogLine(`${event.data.fromName} withdrew! Go, ${event.data.toName}!`)

        // Fade out old
        this.tweens.add({
          targets: container,
          alpha: 0,
          scaleX: 0.5,
          scaleY: 0.5,
          duration: 300,
          onComplete: () => {
            if (isPlayer) {
              this.playerActiveIdx = event.data.newIndex
              this.drawPlayerCreature()
            } else {
              this.aiActiveIdx = event.data.newIndex
              this.drawEnemyCreature()
            }
            this.updateInfoPanels()

            // Grow in new
            container.setScale(0.3)
            container.setAlpha(0)
            this.tweens.add({
              targets: container,
              alpha: 1,
              scaleX: 1,
              scaleY: 1,
              duration: 400,
              ease: 'Back.easeOut',
              onComplete: () => {
                this.startIdleAnimations()
                delay(200)
              },
            })
          },
        })
        break
      }

      case 'forceSwitch': {
        const isPlayer = event.data.creature === 'player'
        if (isPlayer && event.data.needsSelection) {
          // Player needs to choose — show panel after a short delay
          setTimeout(() => {
            this.showForceSwitchPanel()
          }, 300)
          // Don't call onDone — the panel callback handles flow
          return
        }
        if (!isPlayer && event.data.newIndex !== null) {
          this.aiActiveIdx = event.data.newIndex
          this.addLogLine(`Enemy sends out ${event.data.toName}!`)
          this.drawEnemyCreature()
          this.updateInfoPanels()

          this.enemyContainer.setScale(0.3).setAlpha(0)
          this.tweens.add({
            targets: this.enemyContainer,
            alpha: 1,
            scaleX: 1,
            scaleY: 1,
            duration: 400,
            ease: 'Back.easeOut',
            onComplete: () => {
              this.startIdleAnimations()
              delay(300)
            },
          })
        } else {
          onDone()
        }
        break
      }

      case 'statChange': {
        const isPlayer = event.data.creature === 'player'
        const container = isPlayer ? this.playerContainer : this.enemyContainer
        const change = event.data.change
        if (change === 0) { onDone(); break }

        const up = change > 0
        const arrowText = up ? '\u25B2' : '\u25BC'
        const arrowColor = up ? '#48bb78' : '#f56565'
        const statLabel = event.data.stat.toUpperCase()
        const desc = `${event.data.name}'s ${statLabel} ${up ? 'rose' : 'fell'}!`
        this.addLogLine(desc)

        const arrow = this.add.text(container.x, container.y - 40, `${arrowText} ${statLabel}`, {
          fontSize: '14px', fontFamily: 'Rajdhani', fontStyle: 'bold', color: arrowColor,
        }).setOrigin(0.5).setAlpha(0)

        this.tweens.add({
          targets: arrow,
          alpha: 1,
          y: container.y - 65,
          duration: 400,
          hold: 400,
          yoyo: true,
          onComplete: () => { arrow.destroy(); onDone() },
        })
        break
      }

      case 'heal': {
        const isPlayer = event.data.creature === 'player'
        this.addLogLine(`${event.data.name} recovered ${event.data.amount} HP!`)
        const creature = isPlayer ? this.getPlayerCreature() : this.getAiCreature()
        this.tweenHpBar(isPlayer ? 'player' : 'ai', creature, () => delay(300))
        break
      }

      default:
        onDone()
    }
  }

  tweenHpBar(side, creature, onDone) {
    // Directly update HP bar with a visual tween feel
    this.updateHpBar(side, creature)
    if (onDone) setTimeout(onDone, 250)
  }

  spawnAttackParticles(isPlayer, moveType) {
    const colors = PARTICLE_COLORS[moveType] || PARTICLE_COLORS.normal
    const targetX = isPlayer ? ENEMY_X : PLAYER_X
    const targetY = isPlayer ? ENEMY_Y : PLAYER_Y
    const sourceX = isPlayer ? PLAYER_X + 30 : ENEMY_X - 30
    const sourceY = isPlayer ? PLAYER_Y - 10 : ENEMY_Y + 10

    for (let i = 0; i < 8; i++) {
      const color = colors[Math.floor(Math.random() * colors.length)]
      const particle = this.add.graphics()
      particle.fillStyle(color, 1)
      const size = 3 + Math.random() * 4
      particle.fillCircle(0, 0, size)
      particle.setPosition(sourceX, sourceY)
      particle.setAlpha(0.9)

      this.tweens.add({
        targets: particle,
        x: targetX + (Math.random() - 0.5) * 50,
        y: targetY + (Math.random() - 0.5) * 40,
        alpha: 0,
        scaleX: 0.3,
        scaleY: 0.3,
        duration: 350 + Math.random() * 200,
        delay: i * 30,
        ease: 'Power2',
        onComplete: () => particle.destroy(),
      })
    }
  }

  // ===================== TURN PROCESSING =====================

  processTurnResult(result) {
    if (this.battleOver) return

    this.animateEvents(result.events, () => {
      this.playerActiveIdx = result.playerActiveIdx
      this.aiActiveIdx = result.aiActiveIdx
      this.updateInfoPanels()

      if (result.battleOver) {
        this.battleOver = true
        setTimeout(() => {
          this.onBattleEnd({ won: result.winner === 'player' })
        }, 800)
        return
      }

      // Check if player needs forced switch
      const playerNeedsSwitch = result.events.some(
        e => e.type === 'forceSwitch' && e.data.creature === 'player' && e.data.needsSelection
      )

      if (!playerNeedsSwitch) {
        setTimeout(() => this.showMoveButtons(), 400)
      }
    })
  }
}
