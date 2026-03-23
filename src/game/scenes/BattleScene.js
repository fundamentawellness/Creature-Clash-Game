import Phaser from 'phaser'
import { TYPE_COLORS } from '../../data/types.js'
import { MOVES } from '../../data/moves.js'
import { CREATURE_SPRITES } from '../../data/creatureAssets.js'

// Layout constants
const W = 800
const H = 500
const PLAYER_X = 200
const PLAYER_Y = 300
const ENEMY_X = 600
const ENEMY_Y = 160
const PLAYER_SPRITE_SIZE = 220 // display size for player creature
const ENEMY_SPRITE_SIZE = 190  // slightly smaller for enemy (farther away)

// HP bar color thresholds
function hpColor(pct) {
  if (pct > 0.5) return 0x48bb78
  if (pct > 0.25) return 0xecc94b
  return 0xf56565
}

function hexToNum(hex) {
  return parseInt(hex.replace('#', ''), 16)
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
    this.awaitingInput = false  // true only when move buttons are showing and player can act
    this.battleOver = false
    this.logLines = []
  }

  preload() {
    // Load sprites for all creatures in both teams
    const allCreatures = [...this.playerTeam, ...this.aiTeam]
    for (const creature of allCreatures) {
      if (!creature) continue
      const sprites = CREATURE_SPRITES[creature.id]
      if (sprites?.idle) {
        this.load.image(`${creature.id}-idle`, sprites.idle)
      }
      if (sprites?.attack) {
        this.load.image(`${creature.id}-attack`, sprites.attack)
      }
    }
  }

  create() {
    this.drawBackground()

    // Type-colored shadows beneath creatures (drawn before sprites)
    this.playerShadow = this.add.graphics()
    this.enemyShadow = this.add.graphics()

    // Creature sprites (not containers with Graphics — real Phaser.Image objects)
    this.playerSprite = null
    this.enemySprite = null

    // Draw initial creatures
    this.drawPlayerCreature()
    this.drawEnemyCreature()

    // Info panels
    this.createInfoPanels()

    // Battle log
    this.createBattleLog()

    // Move buttons
    this.createMoveButtons()

    // Initial log
    this.addLogLine(`Battle start! Go, ${this.getPlayerCreature().name}!`)
    this.addLogLine(`Enemy sends out ${this.getAiCreature().name}!`)

    // Show buttons after a short delay
    this._delayTimer = setTimeout(() => {
      if (!this.battleOver) this.showMoveButtons()
    }, 800)
  }

  drawBackground() {
    const bg = this.add.graphics()
    bg.fillGradientStyle(0x0f172a, 0x0f172a, 0x1e293b, 0x1e293b, 1)
    bg.fillRect(0, 0, W, H)

    // Ground plane
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

  getPlayerCreature() { return this.playerTeam[this.playerActiveIdx] }
  getAiCreature() { return this.aiTeam[this.aiActiveIdx] }

  // ===================== CREATURE SPRITE RENDERING =====================

  drawShadow(gfx, x, y, spriteWidth, typeColor) {
    gfx.clear()
    const color = hexToNum(typeColor || '#334155')
    gfx.fillStyle(color, 0.2)
    gfx.fillEllipse(x, y + 10, spriteWidth * 0.6, spriteWidth * 0.12)
  }

  drawFallbackCreature(x, y, size, creature) {
    // Colored circle with first letter — for custom creatures without art
    console.warn(`Missing sprite for ${creature.id}, using fallback`)
    const colors = TYPE_COLORS[creature.type] || { accent: '#718096', dark: '#4a5568' }
    const gfx = this.add.graphics()
    gfx.fillStyle(hexToNum(colors.dark), 1)
    gfx.fillCircle(0, 0, size * 0.35)
    gfx.fillStyle(hexToNum(colors.accent), 0.8)
    gfx.fillCircle(0, 0, size * 0.28)
    gfx.setPosition(x, y)

    const letter = this.add.text(x, y, creature.name.charAt(0).toUpperCase(), {
      fontSize: `${Math.round(size * 0.3)}px`, fontFamily: 'Rajdhani', fontStyle: 'bold', color: '#ffffff',
    }).setOrigin(0.5)

    // Return a container so it can be tweened like a sprite
    const container = this.add.container(x, y, [gfx, letter])
    gfx.setPosition(0, 0)
    letter.setPosition(0, 0)
    container.setSize(size, size)
    return container
  }

  drawPlayerCreature() {
    // Clean up old sprite
    if (this.playerSprite) {
      this.playerSprite.destroy()
      this.playerSprite = null
    }

    const creature = this.getPlayerCreature()
    if (!creature || creature.fainted) return

    const hasSprite = this.textures.exists(`${creature.id}-idle`)
    const colors = TYPE_COLORS[creature.type] || { accent: '#718096' }

    if (hasSprite) {
      this.playerSprite = this.add.image(PLAYER_X, PLAYER_Y, `${creature.id}-idle`)
      this.playerSprite.setDisplaySize(PLAYER_SPRITE_SIZE, PLAYER_SPRITE_SIZE)
      this.playerSprite.setOrigin(0.5, 0.7) // anchor lower so shadow sits right
    } else {
      this.playerSprite = this.drawFallbackCreature(PLAYER_X, PLAYER_Y, PLAYER_SPRITE_SIZE, creature)
    }

    // Shadow
    this.drawShadow(this.playerShadow, PLAYER_X, PLAYER_Y + PLAYER_SPRITE_SIZE * 0.15, PLAYER_SPRITE_SIZE, colors.accent)

    // Start idle bob
    this.startIdleBob(this.playerSprite, PLAYER_Y, 3, 2000)
  }

  drawEnemyCreature() {
    if (this.enemySprite) {
      this.enemySprite.destroy()
      this.enemySprite = null
    }

    const creature = this.getAiCreature()
    if (!creature || creature.fainted) return

    const hasSprite = this.textures.exists(`${creature.id}-idle`)
    const colors = TYPE_COLORS[creature.type] || { accent: '#718096' }

    if (hasSprite) {
      this.enemySprite = this.add.image(ENEMY_X, ENEMY_Y, `${creature.id}-idle`)
      this.enemySprite.setDisplaySize(ENEMY_SPRITE_SIZE, ENEMY_SPRITE_SIZE)
      this.enemySprite.setOrigin(0.5, 0.7)
      this.enemySprite.setFlipX(true) // Enemy faces left
    } else {
      this.enemySprite = this.drawFallbackCreature(ENEMY_X, ENEMY_Y, ENEMY_SPRITE_SIZE, creature)
    }

    // Shadow
    this.drawShadow(this.enemyShadow, ENEMY_X, ENEMY_Y + ENEMY_SPRITE_SIZE * 0.1, ENEMY_SPRITE_SIZE, colors.accent)

    // Idle bob
    this.startIdleBob(this.enemySprite, ENEMY_Y, 3, 2400)
  }

  startIdleBob(target, baseY, amplitude, duration) {
    if (!target) return
    this.tweens.add({
      targets: target,
      y: baseY - amplitude,
      duration: duration,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    })
  }

  // ===================== INFO PANELS =====================

  createInfoPanels() {
    // Enemy info — upper left
    this.enemyInfoBg = this.add.graphics()
    this.drawInfoPanel(this.enemyInfoBg, 20, 20, 220, 65)
    this.enemyNameText = this.add.text(30, 28, '', { fontSize: '15px', fontFamily: 'Rajdhani', fontStyle: 'bold', color: '#e2e8f0' })
    this.enemyLevelText = this.add.text(200, 28, '', { fontSize: '13px', fontFamily: 'Rajdhani', fontStyle: 'bold', color: '#94a3b8', align: 'right' })
    this.enemyHpBarBg = this.add.graphics()
    this.enemyHpBar = this.add.graphics()
    this.enemyHpText = this.add.text(30, 63, '', { fontSize: '11px', fontFamily: 'Rajdhani', color: '#64748b' })
    this.enemyTypeBadge = this.add.text(30, 48, '', { fontSize: '11px', fontFamily: 'Rajdhani', fontStyle: 'bold', color: '#94a3b8' })

    // Player info — lower right
    this.playerInfoBg = this.add.graphics()
    this.drawInfoPanel(this.playerInfoBg, W - 245, H - 155, 225, 70)
    this.playerNameText = this.add.text(W - 235, H - 148, '', { fontSize: '15px', fontFamily: 'Rajdhani', fontStyle: 'bold', color: '#e2e8f0' })
    this.playerLevelText = this.add.text(W - 60, H - 148, '', { fontSize: '13px', fontFamily: 'Rajdhani', fontStyle: 'bold', color: '#94a3b8', align: 'right' })
    this.playerHpBarBg = this.add.graphics()
    this.playerHpBar = this.add.graphics()
    this.playerHpText = this.add.text(W - 235, H - 100, '', { fontSize: '11px', fontFamily: 'Rajdhani', color: '#64748b' })
    this.playerTypeBadge = this.add.text(W - 235, H - 115, '', { fontSize: '11px', fontFamily: 'Rajdhani', fontStyle: 'bold', color: '#94a3b8' })

    this.updateInfoPanels()
  }

  drawInfoPanel(g, x, y, w, h) {
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
      const x = W - 235, y = H - 128, barW = 200
      this.playerHpBarBg.clear()
      this.playerHpBarBg.fillStyle(0x1a202c, 1)
      this.playerHpBarBg.fillRoundedRect(x, y, barW, 10, 3)
      this.playerHpBar.clear()
      this.playerHpBar.fillStyle(hpColor(pct), 1)
      this.playerHpBar.fillRoundedRect(x, y, barW * pct, 10, 3)
      this.playerHpText.setText(`${curHp} / ${maxHp}`)
    } else {
      const x = 30, y = 58, barW = 195
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
      fontSize: '13px', fontFamily: 'Rajdhani', color: '#94a3b8',
      wordWrap: { width: W - 50 }, lineSpacing: 2,
    })
  }

  addLogLine(text) {
    this.logLines.push(text)
    if (this.logLines.length > 3) this.logLines.shift()
    if (this.logText) this.logText.setText(this.logLines.join('\n'))
  }

  // ===================== MOVE BUTTONS =====================

  createMoveButtons() {
    this.moveButtonContainer = this.add.container(0, 0)
    this.moveButtonContainer.setVisible(false)
    this.switchButton = null
  }

  showMoveButtons() {
    if (this.battleOver || this.isAnimating) return

    // Clean up any lingering panels
    if (this._forceSwitchPanel) {
      this._forceSwitchPanel.destroy(true)
      this._forceSwitchPanel = null
    }

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
        if (!this.awaitingInput) return
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
        if (!this.awaitingInput) return
        this.showSwitchPanel()
      })

      this.moveButtonContainer.add([switchBg, switchText, switchZone])
    }

    this.moveButtonContainer.setVisible(true)
    this.awaitingInput = true
    this.logBg.setVisible(false)
    this.logText.setVisible(false)
  }

  hideMoveButtons() {
    this.moveButtonContainer.setVisible(false)
    this.awaitingInput = false
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

      // Mini sprite in card
      const hasMiniSprite = this.textures.exists(`${creature.id}-idle`)
      if (hasMiniSprite) {
        const mini = this.add.image(x + 125, y + 40, `${creature.id}-idle`)
        mini.setDisplaySize(40, 40)
        panel.add(mini)
      }

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

  showForceSwitchPanel(onSwitchComplete) {
    // Clean up any existing panel first
    if (this._forceSwitchPanel) {
      this._forceSwitchPanel.destroy(true)
      this._forceSwitchPanel = null
    }

    // Check if any alive creatures remain — if not, this is a defeat
    const alive = this.playerTeam.filter(c => !c.fainted)
    if (alive.length === 0) {
      // No creatures left — defeat handled by battleOver in processTurnResult
      if (onSwitchComplete) onSwitchComplete()
      return
    }

    const panel = this.add.container(0, 0)
    this._forceSwitchPanel = panel
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

      // Mini sprite
      if (this.textures.exists(`${creature.id}-idle`)) {
        const mini = this.add.image(x + 125, y + 40, `${creature.id}-idle`)
        mini.setDisplaySize(40, 40)
        panel.add(mini)
      }

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
        this._forceSwitchPanel = null
        this.playerActiveIdx = idx
        // Sync back to BattleContainer via callback
        if (this._onForceSwitch) this._onForceSwitch(idx)
        this.drawPlayerCreature()
        this.updateInfoPanels()
        this.addLogLine(`Go, ${this.getPlayerCreature().name}!`)

        // Animate switch-in, then continue the event chain or show buttons
        const newSprite = this.playerSprite
        if (newSprite) {
          const fsx = newSprite.scaleX
          const fsy = newSprite.scaleY
          newSprite.setAlpha(0)
          newSprite.scaleX = fsx * 0.5
          newSprite.scaleY = fsy * 0.5
          this.tweens.add({
            targets: newSprite,
            alpha: 1, scaleX: fsx, scaleY: fsy,
            duration: 400, ease: 'Back.easeOut',
            onComplete: () => {
              if (onSwitchComplete) {
                onSwitchComplete()
              } else {
                this.isAnimating = false
                if (!this.battleOver) this.showMoveButtons()
              }
            },
          })
        } else {
          if (onSwitchComplete) {
            onSwitchComplete()
          } else {
            this.isAnimating = false
            if (!this.battleOver) this.showMoveButtons()
          }
        }
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
    let done = false
    const onDone = () => {
      if (done) return
      done = true
      clearTimeout(safetyTimer)
      originalDone()
    }
    // Safety timer: 8 seconds to handle long animation chains
    // (effectiveness popup + damage flash + faint can exceed 3s)
    const safetyTimer = setTimeout(onDone, 8000)
    const delay = (ms) => setTimeout(onDone, ms)

    switch (event.type) {
      case 'attack': {
        const isPlayer = event.data.creature === 'player'
        const sprite = isPlayer ? this.playerSprite : this.enemySprite
        if (!sprite) { onDone(); break }

        const origX = isPlayer ? PLAYER_X : ENEMY_X
        const lungeX = isPlayer ? origX + 40 : origX - 40
        const creatureObj = isPlayer ? this.getPlayerCreature() : this.getAiCreature()

        this.addLogLine(`${event.data.name} used ${event.data.move}!`)

        // Swap to attack sprite
        const attackKey = `${creatureObj.id}-attack`
        const idleKey = `${creatureObj.id}-idle`
        const hasAttackSprite = this.textures.exists(attackKey)
        if (hasAttackSprite && sprite.setTexture) {
          sprite.setTexture(attackKey)
        }

        // Attack particles
        this.spawnAttackParticles(isPlayer, event.data.moveType)

        // Lunge forward
        this.tweens.add({
          targets: sprite,
          x: lungeX,
          duration: 200,
          ease: 'Power2',
          onComplete: () => {
            // Hold attack frame 300ms, then slide back and swap to idle
            setTimeout(() => {
              this.tweens.add({
                targets: sprite,
                x: origX,
                duration: 200,
                ease: 'Power2',
                onComplete: () => {
                  if (hasAttackSprite && sprite.setTexture && this.textures.exists(idleKey)) {
                    sprite.setTexture(idleKey)
                  }
                  delay(100)
                },
              })
            }, 300)
          },
        })
        break
      }

      case 'damage': {
        const isPlayer = event.data.creature === 'player'
        const sprite = isPlayer ? this.playerSprite : this.enemySprite
        if (!sprite) { onDone(); break }

        const origX = sprite.x

        // Flash white (tint) 3 times
        let flashCount = 0
        const flashInterval = setInterval(() => {
          if (sprite.setTint) {
            sprite.setTint(0xffffff)
            setTimeout(() => { if (sprite.clearTint) sprite.clearTint() }, 80)
          } else {
            // Fallback for containers: alpha flash
            sprite.setAlpha(0.3)
            setTimeout(() => sprite.setAlpha(1), 80)
          }
          flashCount++
          if (flashCount >= 3) clearInterval(flashInterval)
        }, 150)

        // Shake
        this.tweens.add({
          targets: sprite,
          x: origX + 6,
          duration: 40,
          yoyo: true,
          repeat: 3,
          onComplete: () => { sprite.x = origX },
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
            alpha: 1, y: H / 2 - 40,
            duration: 300, hold: 600, yoyo: true,
            onComplete: () => { popup.destroy(); onDone() },
          })

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
        const sprite = isPlayer ? this.playerSprite : this.enemySprite
        if (!sprite) { onDone(); break }

        this.tweens.add({
          targets: sprite,
          scaleX: sprite.scaleX * 1.1,
          scaleY: sprite.scaleY * 1.1,
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
          alpha: 1, y: H / 2 - 20,
          duration: 200, hold: 500, yoyo: true,
          onComplete: () => { popup.destroy(); onDone() },
        })
        break
      }

      case 'faint': {
        const isPlayer = event.data.creature === 'player'
        const sprite = isPlayer ? this.playerSprite : this.enemySprite
        const shadow = isPlayer ? this.playerShadow : this.enemyShadow
        if (!sprite) { onDone(); break }

        this.addLogLine(`${event.data.name} fainted!`)

        this.tweens.add({
          targets: sprite,
          alpha: 0,
          scaleY: 0,
          duration: 500,
          ease: 'Power2',
          onComplete: () => {
            shadow.clear()
            delay(300)
          },
        })
        break
      }

      case 'switch': {
        const isPlayer = event.data.creature === 'player'
        const sprite = isPlayer ? this.playerSprite : this.enemySprite

        this.addLogLine(`${event.data.fromName} withdrew! Go, ${event.data.toName}!`)

        const fadeOut = () => {
          if (!sprite) {
            doSwitch()
            return
          }
          this.tweens.add({
            targets: sprite,
            alpha: 0, scaleX: 0.5, scaleY: 0.5,
            duration: 300,
            onComplete: doSwitch,
          })
        }

        const doSwitch = () => {
          if (isPlayer) {
            this.playerActiveIdx = event.data.newIndex
            this.drawPlayerCreature()
          } else {
            this.aiActiveIdx = event.data.newIndex
            this.drawEnemyCreature()
          }
          this.updateInfoPanels()

          const newSprite = isPlayer ? this.playerSprite : this.enemySprite
          if (newSprite) {
            // Save the correct final scale set by setDisplaySize, then animate from half
            const finalScaleX = newSprite.scaleX
            const finalScaleY = newSprite.scaleY
            newSprite.setAlpha(0)
            newSprite.scaleX = finalScaleX * 0.5
            newSprite.scaleY = finalScaleY * 0.5
            this.tweens.add({
              targets: newSprite,
              alpha: 1, scaleX: finalScaleX, scaleY: finalScaleY,
              duration: 400,
              ease: 'Back.easeOut',
              onComplete: () => delay(200),
            })
          } else {
            delay(200)
          }
        }

        fadeOut()
        break
      }

      case 'forceSwitch': {
        const isPlayer = event.data.creature === 'player'
        if (isPlayer && event.data.needsSelection) {
          // Cancel safety timer — this event waits for player input indefinitely
          clearTimeout(safetyTimer)
          // Show the panel, passing onDone so the event chain continues after selection
          setTimeout(() => this.showForceSwitchPanel(onDone), 300)
          break // onDone will be called by the panel's selection handler
        }
        if (!isPlayer && event.data.newIndex !== null) {
          this.aiActiveIdx = event.data.newIndex
          this.addLogLine(`Enemy sends out ${event.data.toName}!`)
          this.drawEnemyCreature()
          this.updateInfoPanels()

          if (this.enemySprite) {
            const fsx = this.enemySprite.scaleX
            const fsy = this.enemySprite.scaleY
            this.enemySprite.setAlpha(0)
            this.enemySprite.scaleX = fsx * 0.5
            this.enemySprite.scaleY = fsy * 0.5
            this.tweens.add({
              targets: this.enemySprite,
              alpha: 1,
              scaleX: fsx,
              scaleY: fsy,
              duration: 400,
              ease: 'Back.easeOut',
              onComplete: () => delay(300),
            })
          } else {
            delay(300)
          }
        } else {
          onDone()
        }
        break
      }

      case 'statChange': {
        const isPlayer = event.data.creature === 'player'
        const sprite = isPlayer ? this.playerSprite : this.enemySprite
        const change = event.data.change
        if (change === 0) { onDone(); break }

        const up = change > 0
        const arrowText = up ? '\u25B2' : '\u25BC'
        const arrowColor = up ? '#48bb78' : '#f56565'
        const statLabel = event.data.stat.toUpperCase()
        const desc = `${event.data.name}'s ${statLabel} ${up ? 'rose' : 'fell'}!`
        this.addLogLine(desc)

        const sx = sprite ? sprite.x : (isPlayer ? PLAYER_X : ENEMY_X)
        const sy = sprite ? sprite.y : (isPlayer ? PLAYER_Y : ENEMY_Y)

        const arrow = this.add.text(sx, sy - 40, `${arrowText} ${statLabel}`, {
          fontSize: '14px', fontFamily: 'Rajdhani', fontStyle: 'bold', color: arrowColor,
        }).setOrigin(0.5).setAlpha(0)

        this.tweens.add({
          targets: arrow,
          alpha: 1, y: sy - 65,
          duration: 400, hold: 400, yoyo: true,
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
        alpha: 0, scaleX: 0.3, scaleY: 0.3,
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

    // Sync AI active index for non-faint switches (these happen before attacks)
    // Player/AI faint switches are handled by forceSwitch events during animation
    this.aiActiveIdx = result.aiActiveIdx

    this.animateEvents(result.events, () => {
      // After all animations (including force switch selections), sync final state
      this.updateInfoPanels()

      if (result.battleOver) {
        this.battleOver = true
        setTimeout(() => {
          this.onBattleEnd({ won: result.winner === 'player' })
        }, 800)
        return
      }

      // If we reach here, all force switches have been handled (their onDone was called)
      // Now show move buttons for the current active creature
      setTimeout(() => {
        if (!this.battleOver) this.showMoveButtons()
      }, 400)
    })
  }
}
