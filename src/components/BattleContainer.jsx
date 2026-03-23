import { useEffect, useRef, useCallback } from 'react'
import Phaser from 'phaser'
import { BattleScene } from '../game/scenes/BattleScene.js'
import { CREATURES, CREATURE_LIST } from '../data/creatures.js'
import { createBattleCreature, executeTurn } from '../systems/battleEngine.js'
import { aiBuildTeam } from '../systems/ai.js'
import { getAllCreatures, getAllCreatureList } from '../utils/customData.js'

// Shared data store — scene reads on init
let _pendingBattleData = null

export default function BattleContainer({ gameState, selectedTeam, difficulty, onBattleEnd }) {
  const containerRef = useRef(null)
  const gameRef = useRef(null)
  const sceneRef = useRef(null)
  const playerTeamRef = useRef(null)
  const aiTeamRef = useRef(null)
  const playerActiveIdxRef = useRef(0)
  const aiActiveIdxRef = useRef(0)
  const onBattleEndRef = useRef(onBattleEnd)

  // Keep callback ref current
  useEffect(() => { onBattleEndRef.current = onBattleEnd }, [onBattleEnd])

  const handlePlayerAction = useCallback((action) => {
    const scene = sceneRef.current
    if (!scene || scene.battleOver || scene.isAnimating) return

    scene.hideMoveButtons()

    const result = executeTurn(
      action,
      playerTeamRef.current,
      playerActiveIdxRef.current,
      aiTeamRef.current,
      aiActiveIdxRef.current,
      difficulty
    )

    // Update AI index immediately (engine knows the new AI index)
    aiActiveIdxRef.current = result.aiActiveIdx

    // Only update player index if no force switch is pending
    // (force switch callback will set it via _onForceSwitch)
    const playerNeedsForceSwitch = result.events.some(
      e => e.type === 'forceSwitch' && e.data.creature === 'player' && e.data.needsSelection
    )
    if (!playerNeedsForceSwitch) {
      playerActiveIdxRef.current = result.playerActiveIdx
    }

    scene.processTurnResult(result)
  }, [difficulty])

  useEffect(() => {
    if (!containerRef.current) return

    // Build creature lookup with custom creatures
    const allCreatures = getAllCreatures(gameState)
    const allCreatureList = getAllCreatureList(gameState)

    // Build player team from save state
    const playerTeam = selectedTeam.map(id => {
      const progress = gameState.creatureProgress[id]
      return createBattleCreature(progress ? { ...progress, id } : {
        id, level: 1, wins: 0,
        currentMoves: allCreatures[id]?.movePool?.slice(0, 2) || [],
      }, allCreatures)
    }).filter(Boolean)

    // Build AI team
    const aiPool = difficulty === 'easy'
      ? allCreatureList.filter(c => gameState.unlockedCreatureIds.includes(c.id))
      : allCreatureList
    const aiIds = aiBuildTeam(aiPool, difficulty)
    const aiTeam = aiIds.map(id => {
      const level = difficulty === 'easy' ? 1 : difficulty === 'medium' ? 3 : 5
      const template = allCreatures[id]
      const moveCount = difficulty === 'easy' ? 2 : difficulty === 'medium' ? 3 : 4
      return createBattleCreature({
        id, level, wins: 0,
        currentMoves: template.movePool.slice(0, moveCount),
        learnedMoves: template.movePool.slice(0, moveCount),
        movesOffered: moveCount,
      }, allCreatures)
    }).filter(Boolean)

    playerTeamRef.current = playerTeam
    aiTeamRef.current = aiTeam
    playerActiveIdxRef.current = 0
    aiActiveIdxRef.current = 0

    _pendingBattleData = {
      playerTeam,
      aiTeam,
      difficulty,
      onPlayerAction: (action) => handlePlayerAction(action),
      onBattleEnd: (result) => onBattleEndRef.current(result),
    }

    class LiveBattleScene extends BattleScene {
      init() { super.init(_pendingBattleData || {}) }
    }

    const game = new Phaser.Game({
      type: Phaser.CANVAS,
      parent: containerRef.current,
      width: 800,
      height: 500,
      backgroundColor: '#0a0e1a',
      scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
      scene: [LiveBattleScene],
      audio: { disableWebAudio: true },
      render: { pixelArt: false, antialias: true },
    })
    gameRef.current = game

    const poll = setInterval(() => {
      const scene = game.scene.getScene('BattleScene')
      if (scene) {
        sceneRef.current = scene
        window.__battleScene = scene
        // Register callback so force switch updates our ref
        scene._onForceSwitch = (newIdx) => {
          playerActiveIdxRef.current = newIdx
        }
        clearInterval(poll)
      }
    }, 50)

    return () => {
      clearInterval(poll)
      _pendingBattleData = null
      window.__battleScene = null
      if (gameRef.current) {
        gameRef.current.destroy(true)
        gameRef.current = null
        sceneRef.current = null
      }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex-1 flex items-center justify-center p-2 md:p-4">
      <div
        ref={containerRef}
        className="rounded-xl overflow-hidden border border-slate-700/50 shadow-2xl"
        style={{ maxWidth: 800, width: '100%', aspectRatio: '800/500' }}
      />
    </div>
  )
}
