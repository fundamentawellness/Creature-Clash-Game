import { useEffect, useRef, useCallback, useState } from 'react'
import Phaser from 'phaser'
import { BattleScene } from '../game/scenes/BattleScene.js'
import { createBattleCreature, executeTurn } from '../systems/battleEngine.js'
import { getAllCreatures, getAllCreatureList, getFullTypeChart, getFullTypeColors, getTypeNames } from '../utils/customData.js'
import { buildRivalTeam } from '../data/campaign.js'
import { MOVE_LEARN_LEVELS } from '../systems/progression.js'
import BattleControls from './BattleControls.jsx'

// Shared data store — scene reads on init
let _pendingBattleData = null

/**
 * Determine how many moves a creature at a given level should know.
 * Levels correspond to MOVE_LEARN_LEVELS: level 1→2 moves, level 2→3, level 4→4, etc.
 */
function moveCountForLevel(level) {
  let count = 2 // starter moves (slots 0 and 1, both at level 1)
  // Slots 2-7 unlock at levels defined in MOVE_LEARN_LEVELS
  for (let i = 2; i <= 7; i++) {
    if (MOVE_LEARN_LEVELS[i] !== undefined && level >= MOVE_LEARN_LEVELS[i]) count++
    else break
  }
  return Math.min(count, 8)
}

export default function BattleContainer({ gameState, selectedTeam, battleInfo, onBattleEnd }) {
  const containerRef = useRef(null)
  const gameRef = useRef(null)
  const sceneRef = useRef(null)
  const playerTeamRef = useRef(null)
  const aiTeamRef = useRef(null)
  const playerActiveIdxRef = useRef(0)
  const aiActiveIdxRef = useRef(0)
  const cooldownsRef = useRef({ player: 0, ai: 0 })
  const onBattleEndRef = useRef(onBattleEnd)
  const aiConfigRef = useRef(battleInfo?.aiConfig || { optimalChance: 0.5, switchBehavior: 'never', teamBuild: 'random' })
  const typeChartRef = useRef(null)
  const [controls, setControls] = useState(null)
  const [logLines, setLogLines] = useState([])

  useEffect(() => { onBattleEndRef.current = onBattleEnd }, [onBattleEnd])

  const handlePlayerAction = useCallback((action) => {
    const scene = sceneRef.current
    if (!scene || scene.battleOver || scene.isAnimating) return

    scene.isAnimating = true
    scene.hideMoveButtons()

    const result = executeTurn(
      action,
      playerTeamRef.current,
      playerActiveIdxRef.current,
      aiTeamRef.current,
      aiActiveIdxRef.current,
      aiConfigRef.current,
      cooldownsRef.current,
      typeChartRef.current
    )

    // Update cooldowns from engine result
    cooldownsRef.current = result.cooldowns || { player: 0, ai: 0 }

    aiActiveIdxRef.current = result.aiActiveIdx

    const playerNeedsForceSwitch = result.events.some(
      e => e.type === 'forceSwitch' && e.data.creature === 'player' && e.data.needsSelection
    )
    if (!playerNeedsForceSwitch) {
      playerActiveIdxRef.current = result.playerActiveIdx
    }

    // Pass cooldown to scene so it can update switch button state
    scene.playerSwitchCooldown = cooldownsRef.current.player
    scene.processTurnResult(result)
  }, [])

  useEffect(() => {
    if (!containerRef.current || !battleInfo) return

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

    // Build AI team based on battleInfo
    let aiTeam
    if (battleInfo.aiTeamSpec) {
      // Predefined team (trainers/leaders)
      aiTeam = battleInfo.aiTeamSpec.map(spec => {
        const template = allCreatures[spec.id]
        if (!template) return null
        const mc = moveCountForLevel(spec.level)
        return createBattleCreature({
          id: spec.id, level: spec.level, wins: 0,
          currentMoves: template.movePool.slice(0, Math.min(mc, 4)),
          learnedMoves: template.movePool.slice(0, mc),
          movesOffered: mc,
        }, allCreatures)
      }).filter(Boolean)
    } else {
      // Dynamic team (rivals)
      const rivalSpecs = buildRivalTeam(
        gameState.campaign?.playerTypeCounts,
        battleInfo.rivalLevel || 4,
        battleInfo.aiTeamSize || 3,
        allCreatureList
      )
      aiTeam = rivalSpecs.map(spec => {
        const template = allCreatures[spec.id]
        if (!template) return null
        const mc = moveCountForLevel(spec.level)
        return createBattleCreature({
          id: spec.id, level: spec.level, wins: 0,
          currentMoves: template.movePool.slice(0, Math.min(mc, 4)),
          learnedMoves: template.movePool.slice(0, mc),
          movesOffered: mc,
        }, allCreatures)
      }).filter(Boolean)
    }

    aiConfigRef.current = battleInfo.aiConfig || { optimalChance: 0.5, switchBehavior: 'never', teamBuild: 'random' }
    const typeChart = getFullTypeChart(gameState)
    const typeColors = getFullTypeColors(gameState)
    const typeNames = getTypeNames(gameState)
    typeChartRef.current = typeChart

    playerTeamRef.current = playerTeam
    aiTeamRef.current = aiTeam
    playerActiveIdxRef.current = 0
    aiActiveIdxRef.current = 0

    _pendingBattleData = {
      playerTeam,
      aiTeam,
      difficulty: 'campaign', // legacy field, not used for logic
      onPlayerAction: (action) => handlePlayerAction(action),
      onBattleEnd: (result) => onBattleEndRef.current(result),
      onControlsChange: (state) => setControls(state),
      onLogChange: (lines) => setLogLines(lines),
      typeColors,
      typeNames,
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
        scene._onForceSwitch = (newIdx) => {
          playerActiveIdxRef.current = newIdx
        }
        clearInterval(poll)
      }
    }, 50)

    const refresh = () => game.scale?.refresh()
    const raf = requestAnimationFrame(refresh)
    const observer = new ResizeObserver(refresh)
    if (containerRef.current) observer.observe(containerRef.current)

    return () => {
      cancelAnimationFrame(raf)
      observer.disconnect()
      clearInterval(poll)
      _pendingBattleData = null
      window.__battleScene = null
      setControls(null)
      if (gameRef.current) {
        gameRef.current.destroy(true)
        gameRef.current = null
        sceneRef.current = null
      }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const typeColors = getFullTypeColors(gameState)
  const typeNames = getTypeNames(gameState)

  return (
    <div className="flex-1 w-full max-w-6xl mx-auto px-2 py-2 sm:px-4 sm:py-4 flex flex-col lg:flex-row lg:items-start gap-3">
      <div className="w-full lg:flex-1 flex justify-center">
        <div
          ref={containerRef}
          className="w-full max-w-[800px] rounded-xl overflow-hidden border border-slate-700/50 shadow-2xl bg-[#0a0e1a]"
          style={{ aspectRatio: '8 / 5' }}
        />
      </div>
      <div className="w-full lg:w-96 shrink-0 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        <BattleControls
          controls={controls}
          logLines={logLines}
          typeColors={typeColors}
          typeNames={typeNames}
          onAttack={(moveId) => handlePlayerAction({ type: 'attack', moveId })}
          onRequestSwitch={() => sceneRef.current?.showSwitchPanel()}
          onCancelSwitch={() => sceneRef.current?.cancelSwitch()}
          onPickCreature={(index) => {
            const scene = sceneRef.current
            if (!scene) return
            if (scene.controlMode === 'force') scene.confirmForceSwitch(index)
            else handlePlayerAction({ type: 'switch', targetIndex: index })
          }}
        />
      </div>
    </div>
  )
}
