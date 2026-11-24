import { useEffect, useRef, useCallback, useState } from 'react'
import Phaser from 'phaser'
import { BattleScene } from '../game/scenes/BattleScene.js'
import { createBattleCreature, executeTurn } from '../systems/battleEngine.js'
import { STATUSES } from '../data/statuses.js'

function applyRemote(team, rows) {
  (rows || []).forEach((row, index) => {
    const creature = team?.[index]
    if (!creature || !row) return
    creature.currentHp = row.currentHp
    creature.fainted = !!row.fainted
    creature.status = row.status ? { id: row.status, name: STATUSES[row.status]?.name || row.status } : null
  })
}
import { getAllCreatures, getAllCreatureList, getFullTypeChart, getFullTypeColors, getTypeNames } from '../utils/customData.js'
import { buildRivalTeam } from '../data/campaign.js'
import { movesKnownAtLevel } from '../systems/progression.js'
import BattleControls from './BattleControls.jsx'

// Shared data store — scene reads on init
let _pendingBattleData = null

export default function BattleContainer({ gameState, selectedTeam, battleInfo, onBattleEnd, onUpdateGameState, onMarkSeen, link }) {
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
  const bagRef = useRef({ ...(gameState?.bag || {}) })
  const onBagRef = useRef(onUpdateGameState)
  const onSeenRef = useRef(onMarkSeen)
  const linkRef = useRef(link)
  useEffect(() => { linkRef.current = link }, [link])
  const [controls, setControls] = useState(null)
  const [logLines, setLogLines] = useState([])
  const [bag, setBag] = useState(() => ({ ...(gameState?.bag || {}) }))

  useEffect(() => { onBattleEndRef.current = onBattleEnd }, [onBattleEnd])
  useEffect(() => { onBagRef.current = onUpdateGameState }, [onUpdateGameState])
  useEffect(() => { onSeenRef.current = onMarkSeen }, [onMarkSeen])

  const handlePlayerAction = useCallback((action) => {
    const scene = sceneRef.current
    if (!scene || scene.battleOver || scene.isAnimating || linkRef.current?.locked) return

    scene.isAnimating = true
    scene.hideMoveButtons()

    if (linkRef.current) {
      scene.isAnimating = true
      scene.hideMoveButtons()
      linkRef.current.sendAction(action)
      return
    }

    const turnAction = action.type === 'item' || action.type === 'catch' ? { ...action, bag: bagRef.current } : action
    const result = executeTurn(
      turnAction,
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
    if (turnAction.type === 'item' || turnAction.type === 'catch') {
      const nextBag = { ...bagRef.current }
      setBag(nextBag)
      onBagRef.current?.(prev => prev ? { ...prev, bag: nextBag } : prev)
    }
    scene.processTurnResult(result)
  }, [])

  useEffect(() => {
    if (!containerRef.current || !battleInfo) return

    const allCreatures = getAllCreatures(gameState)
    const allCreatureList = getAllCreatureList(gameState)

    // Build player team from save state
    const playerTeam = (battleInfo.playerSpecs || selectedTeam.map(id => {
      const progress = gameState.creatureProgress[id]
      return progress ? { ...progress, id } : {
        id, level: 1, wins: 0,
        currentMoves: allCreatures[id]?.movePool?.slice(0, 2) || [],
      }
    })).map(spec => {
      return createBattleCreature(spec.id ? spec : {
        id: spec, level: 1, wins: 0,
        currentMoves: allCreatures[spec]?.movePool?.slice(0, 2) || [],
      }, allCreatures)
    }).filter(Boolean)

    // Build AI team based on battleInfo
    let aiTeam
    if (battleInfo.online) {
      aiTeam = battleInfo.aiTeamSpec.map(spec => createBattleCreature({
        id: spec.id, level: spec.level, wins: 0,
        currentMoves: spec.currentMoves, heldItem: spec.heldItem,
      }, allCreatures)).filter(Boolean)
    } else if (battleInfo.aiTeamSpec) {
      // Predefined team (trainers/leaders)
      aiTeam = battleInfo.aiTeamSpec.map(spec => {
        const template = allCreatures[spec.id]
        if (!template) return null
        const known = movesKnownAtLevel(template, spec.level)
        return createBattleCreature({
          id: spec.id, level: spec.level, wins: 0,
          currentMoves: known.slice(0, 4),
          learnedMoves: known,
          movesOffered: known.length,
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
        const known = movesKnownAtLevel(template, spec.level)
        return createBattleCreature({
          id: spec.id, level: spec.level, wins: 0,
          currentMoves: known.slice(0, 4),
          learnedMoves: known,
          movesOffered: known.length,
        }, allCreatures)
      }).filter(Boolean)
    }

    const aiItems = []
    if (battleInfo.type === 'leader' || battleInfo.type === 'rival') aiItems.push('super_potion')
    else if (battleInfo.zoneId === 'zone3' || battleInfo.zoneId === 'zone4') aiItems.push('potion')
    if (battleInfo.syncYou) {
      battleInfo.syncYou.forEach((row, index) => {
        if (!playerTeam[index] || !row) return
        playerTeam[index].currentHp = row.currentHp
        playerTeam[index].fainted = !!row.fainted
      })
    }
    if (battleInfo.syncFoe) {
      battleInfo.syncFoe.forEach((row, index) => {
        if (!aiTeam[index] || !row) return
        aiTeam[index].currentHp = row.currentHp
        aiTeam[index].fainted = !!row.fainted
      })
    }

    onSeenRef.current?.([...playerTeam, ...aiTeam].map(creature => creature.id))

    aiConfigRef.current = {
      ...(battleInfo.aiConfig || { optimalChance: 0.5, switchBehavior: 'never', teamBuild: 'random' }),
      items: aiItems,
    }
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
        linkRef.current?.onReady?.({
          play(msg) {
            applyRemote(playerTeamRef.current, msg.you)
            applyRemote(aiTeamRef.current, msg.foe)
            playerActiveIdxRef.current = msg.result.playerActiveIdx
            aiActiveIdxRef.current = msg.result.aiActiveIdx
            scene.playerActiveIdx = msg.result.playerActiveIdx
            scene.aiActiveIdx = msg.result.aiActiveIdx
            scene.isAnimating = true
            scene.processTurnResult(msg.result)
          },
        })
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
          bag={bag}
          wild={!!battleInfo?.wild}
          hideItems={!!link}
          onAttack={(moveId) => handlePlayerAction({ type: 'attack', moveId })}
          onCatch={(itemId) => handlePlayerAction({ type: 'catch', itemId })}
          onUseItem={(itemId, targetIndex) => handlePlayerAction({ type: 'item', itemId, targetIndex })}
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
