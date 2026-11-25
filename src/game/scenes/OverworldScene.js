import Phaser from 'phaser'
import { GREENRIDGE, MAP_W, MAP_H, isSolid, tileAt, trainerSees } from '../../data/greenridgeMap.js'
import { ENCOUNTER_GRACE, encounterOnStep } from '../../systems/field.js'
import { paintTiles, tileKey, heroKey } from '../tileset.js'

const TILE = 16

export class OverworldScene extends Phaser.Scene {
  constructor() {
    super({ key: 'OverworldScene' })
  }

  init(data) {
    this.boot = data || {}
    this.tx = data.x
    this.ty = data.y
    this.facing = data.facing || 'down'
    this.busy = !!data.locked
    // Fresh map, a heal, or the walk back from a battle. Not checked until a real step.
    this.grace = ENCOUNTER_GRACE
    this.lastStepKey = `${this.tx},${this.ty}`
    this.stick = { x: 0, y: 0 }
    this.people = data.people || []
    this.items = data.items || []
    this.beaten = new Set(data.beaten || [])
    this.living = data.living ?? 1
    this.onPosition = data.onPosition || (() => {})
    this.onWild = data.onWild || (() => {})
    this.onTrainer = data.onTrainer || (() => {})
    this.onPickup = data.onPickup || (() => {})
    this.onInteract = data.onInteract || (() => {})
    this.onWiped = data.onWiped || (() => {})
  }

  create() {
    paintTiles(this)
    const width = MAP_W * TILE
    const height = MAP_H * TILE
    for (let y = 0; y < MAP_H; y++) {
      for (let x = 0; x < MAP_W; x++) {
        this.add.image(x * TILE, y * TILE, tileKey(tileAt(x, y))).setOrigin(0, 0).setDepth(0)
      }
    }

    this.itemSprites = {}
    for (const item of this.items) {
      const gem = this.add.circle(item.x * TILE + 8, item.y * TILE + 6, 3, 0xf6e05e).setDepth(2)
      this.tweens.add({ targets: gem, y: gem.y - 3, duration: 500, yoyo: true, repeat: -1 })
      this.itemSprites[item.id] = gem
    }

    this.personSprites = {}
    for (const person of this.people) {
      const sprite = this.add.sprite(person.x * TILE + 8, person.y * TILE + 8, 'hero-npc').setDepth(3)
      sprite.setTint(Phaser.Display.Color.HexStringToColor(person.color || '#cbd5e0').color)
      this.personSprites[person.id] = sprite
    }

    this.player = this.add.sprite(this.tx * TILE + 8, this.ty * TILE + 8, heroKey(this.facing)).setDepth(4)
    if (this.facing === 'left') this.player.setFlipX(true)

    this.cameras.main.setBounds(0, 0, width, height)
    this.cameras.main.startFollow(this.player, true, 0.18, 0.18)
    this.cameras.main.setZoom(2)
    this.cameras.main.setRoundPixels(true)

    const hour = new Date().getHours()
    const night = hour >= 20 || hour < 6
    const evening = hour >= 17 && hour < 20
    if (night || evening) {
      this.add.rectangle(0, 0, 2000, 2000, night ? 0x0b1b4a : 0xff9944, night ? 0.28 : 0.14)
        .setOrigin(0, 0)
        .setScrollFactor(0)
        .setDepth(20)
    }

    const keys = this.input.keyboard
    if (keys) {
      this.cursors = keys.createCursorKeys()
      this.wasd = keys.addKeys('W,A,S,D,SPACE,ENTER,E')
      this.wasd.SPACE.on('down', () => this.interact())
      this.wasd.ENTER.on('down', () => this.interact())
      this.wasd.E.on('down', () => this.interact())
    }

    this.scale.on('resize', () => this.cameras.main?.setZoom(2))
  }

  setStick(x, y) {
    this.stick = { x, y }
  }

  setLocked(locked) {
    this.busy = !!locked
    this.stick = { x: 0, y: 0 }
  }

  setLiving(count) {
    this.living = count
  }

  setGrace(steps = ENCOUNTER_GRACE) {
    this.grace = steps
  }

  hideItem(id) {
    this.itemSprites[id]?.destroy()
    delete this.itemSprites[id]
    this.items = this.items.filter(item => item.id !== id)
  }

  markBeaten(id) {
    this.beaten.add(id)
  }

  interact() {
    if (this.moving) return
    const dir = this.directionVector(this.facing)
    const ahead = this.personAt(this.tx + dir.x, this.ty + dir.y)
    const here = this.itemAt(this.tx, this.ty)
    if (ahead) this.onInteract(ahead)
    else if (here) this.takeItem(here)
  }

  personAt(x, y) {
    return this.people.find(person => person.x === x && person.y === y) || null
  }

  itemAt(x, y) {
    return this.items.find(item => item.x === x && item.y === y) || null
  }

  blocked(x, y) {
    if (isSolid(x, y)) return true
    const person = this.personAt(x, y)
    return !!(person && person.solid !== false)
  }

  directionVector(name) {
    if (name === 'left') return { x: -1, y: 0 }
    if (name === 'right') return { x: 1, y: 0 }
    if (name === 'up') return { x: 0, y: -1 }
    return { x: 0, y: 1 }
  }

  readMove() {
    const pad = this.stick || { x: 0, y: 0 }
    if (pad.x || pad.y) return { ...pad, fromPad: true }
    const c = this.cursors
    const w = this.wasd
    if (!c) return null
    if (c.left.isDown || w?.A?.isDown) return { x: -1, y: 0, name: 'left' }
    if (c.right.isDown || w?.D?.isDown) return { x: 1, y: 0, name: 'right' }
    if (c.up.isDown || w?.W?.isDown) return { x: 0, y: -1, name: 'up' }
    if (c.down.isDown || w?.S?.isDown) return { x: 0, y: 1, name: 'down' }
    return null
  }

  face(name) {
    this.facing = name
    this.player.setTexture(heroKey(name))
    this.player.setFlipX(name === 'left')
  }

  update() {
    // Held keys and the D-pad only change a tile after the previous step finishes.
    // Bumping a wall or standing still never rolls an encounter.
    if (this.busy || this.moving) return
    const move = this.readMove()
    if (!move) return
    const name = move.name || (move.x < 0 ? 'left' : move.x > 0 ? 'right' : move.y < 0 ? 'up' : 'down')
    this.face(name)
    const nx = this.tx + (move.x || 0)
    const ny = this.ty + (move.y || 0)
    if (move.x === 0 && move.y === 0) return
    if (nx === this.tx && ny === this.ty) return
    if (this.blocked(nx, ny)) return
    this.stepTo(nx, ny)
  }

  stepTo(x, y) {
    this.moving = true
    this.tweens.add({
      targets: this.player,
      x: x * TILE + 8,
      y: y * TILE + 8,
      duration: 150,
      onComplete: () => {
        this.tx = x
        this.ty = y
        this.moving = false
        this.afterStep()
      },
    })
  }

  afterStep() {
    const key = `${this.tx},${this.ty}`
    if (key === this.lastStepKey) return
    this.lastStepKey = key
    this.onPosition({ x: this.tx, y: this.ty, facing: this.facing })
    const found = this.itemAt(this.tx, this.ty)
    if (found) this.takeItem(found)
    if (this.living <= 0) {
      this.onWiped()
      return
    }
    const trainer = this.people.find(person => (
      person.kind === 'trainer' && !this.beaten.has(person.id) && trainerSees(person, this.tx, this.ty)
    ))
    if (trainer) {
      this.approach(trainer)
      return
    }
    const step = encounterOnStep({
      tile: tileAt(this.tx, this.ty),
      moved: true,
      grace: this.grace,
    })
    this.grace = step.grace
    if (step.encounter) this.startWild(step.encounter)
  }

  takeItem(item) {
    this.hideItem(item.id)
    this.onPickup(item)
  }

  approach(trainer) {
    this.busy = true
    const sprite = this.personSprites[trainer.id]
    const bang = this.add.text(trainer.x * TILE + 4, trainer.y * TILE - 10, '!', {
      fontFamily: 'sans-serif', fontSize: '12px', color: '#f6e05e',
    }).setDepth(6)
    const steps = []
    let x = trainer.x
    let y = trainer.y
    let guard = 0
    while (Math.abs(this.tx - x) + Math.abs(this.ty - y) > 1 && guard < 6) {
      if (this.tx !== x) x += Math.sign(this.tx - x)
      else if (this.ty !== y) y += Math.sign(this.ty - y)
      else break
      if (isSolid(x, y)) break
      steps.push({ x, y })
      guard += 1
    }
    const go = (index) => {
      if (!steps[index]) {
        bang.destroy()
        this.onTrainer(trainer)
        return
      }
      this.tweens.add({
        targets: sprite,
        x: steps[index].x * TILE + 8,
        y: steps[index].y * TILE + 8,
        duration: 140,
        onComplete: () => go(index + 1),
      })
    }
    go(0)
  }

  startWild(roll) {
    this.busy = true
    this.cameras.main.flash(160, 240, 250, 255)
    this.time.delayedCall(200, () => this.onWild(roll))
  }
}
