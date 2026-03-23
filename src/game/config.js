import Phaser from 'phaser'
import { BattleScene } from './scenes/BattleScene.js'

export function createGameConfig(parent) {
  return {
    type: Phaser.CANVAS,
    parent,
    width: 800,
    height: 500,
    backgroundColor: '#0a0e1a',
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    scene: [BattleScene],
    audio: { disableWebAudio: true },
    render: { pixelArt: false, antialias: true },
  }
}
