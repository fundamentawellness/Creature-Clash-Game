import { useState, useEffect } from 'react'
import { CREATURES } from '../data/creatures.js'
import { TYPE_COLORS } from '../data/types.js'
import { addWin, applyLevelUp, getAvailableNewMove, learnMove, skipMove } from '../systems/progression.js'
import { advanceCampaign, trackPlayerTypes, applyRivalReward } from '../systems/campaignManager.js'
import { getGymById, getRivalByZone } from '../data/campaign.js'
import { getAllCreatures } from '../utils/customData.js'
import MoveLearnModal from './MoveLearnModal.jsx'
import CreatureSprite from './CreatureSprite.jsx'

export default function ResultScreen({ result, gameState, selectedTeam, battleInfo, onUpdateGameState, onBattleAgain, onChangeTeam, onMainMenu, onShowDialogue, onShowCreaturePick, onShowRewardSplash }) {
  const [processedResults, setProcessedResults] = useState(null)
  const [moveLearnQueue, setMoveLearnQueue] = useState([])
  const [currentLearn, setCurrentLearn] = useState(null)
  const [unlockedCreature, setUnlockedCreature] = useState(null)
  const [badgeEarned, setBadgeEarned] = useState(null)
  const [processed, setProcessed] = useState(false)

  const won = result?.won
  const allCreatures = getAllCreatures(gameState)

  useEffect(() => {
    if (processed || !gameState) return
    setProcessed(true)

    if (!won) {
      setProcessedResults(selectedTeam.map(id => {
        const template = allCreatures[id]
        return {
          id, name: template?.name, type: template?.type,
          winsGained: 0, leveledUp: false,
          oldLevel: gameState.creatureProgress[id]?.level || 1,
          newLevel: gameState.creatureProgress[id]?.level || 1,
          wins: gameState.creatureProgress[id]?.wins || 0,
        }
      }))
      return
    }

    // Victory — process progression
    const results = []
    let updatedState = { ...gameState }
    updatedState.creatureProgress = { ...gameState.creatureProgress }
    updatedState.campaign = { ...gameState.campaign }
    updatedState.rewards = { ...gameState.rewards }

    // Record total battle win
    updatedState.totalBattlesWon = (updatedState.totalBattlesWon || 0) + 1

    // Track player types for rival adaptation
    const playerCreatures = selectedTeam.map(id => allCreatures[id]).filter(Boolean)
    updatedState.campaign = trackPlayerTypes(updatedState.campaign, playerCreatures)

    // Advance campaign (mark trainer/leader/rival as beaten)
    if (battleInfo && !battleInfo.replay) {
      updatedState.campaign = advanceCampaign(updatedState.campaign, battleInfo)
    }

    // Process each creature's XP/levels
    const learnQueue = []
    for (const creatureId of selectedTeam) {
      const progress = updatedState.creatureProgress[creatureId]
      if (!progress) continue

      const { state: afterWin, leveledUp } = addWin({ ...progress, id: creatureId })
      let updated = afterWin

      const template = allCreatures[creatureId]
      const creatureResult = {
        id: creatureId, name: template?.name, type: template?.type,
        winsGained: 1, leveledUp: false,
        oldLevel: progress.level, newLevel: progress.level,
        wins: updated.wins,
      }

      if (leveledUp) {
        updated = applyLevelUp(updated)
        creatureResult.leveledUp = true
        creatureResult.newLevel = updated.level
        const newMove = getAvailableNewMove(updated)
        if (newMove) {
          learnQueue.push({
            creatureId, creatureName: template?.name, creatureType: template?.type,
            currentMoves: [...updated.currentMoves], newMoveId: newMove,
          })
        }
      }

      updatedState.creatureProgress[creatureId] = updated
      results.push(creatureResult)
    }

    // Badge earned for gym leaders
    if (battleInfo?.type === 'leader' && !battleInfo.replay) {
      const gym = getGymById(battleInfo.gymId)
      if (gym) {
        setBadgeEarned({ name: gym.badge.name, icon: gym.badge.icon, leaderName: gym.leader.name })
      }

      // Leader creature pick — show modal after processing
      // Find 3 creatures the player doesn't have yet
      const lockedCreatures = Object.keys(CREATURES).filter(id => !updatedState.unlockedCreatureIds.includes(id))
      if (lockedCreatures.length > 0 && onShowCreaturePick) {
        const pickPool = lockedCreatures.sort(() => Math.random() - 0.5).slice(0, Math.min(3, lockedCreatures.length))
        setTimeout(() => {
          onShowCreaturePick({
            creatureIds: pickPool,
            title: `${gym.leader.name} rewards your victory!`,
            onPick: (pickedId) => {
              onUpdateGameState(prev => {
                const next = { ...prev, unlockedCreatureIds: [...prev.unlockedCreatureIds, pickedId] }
                const template = CREATURES[pickedId]
                if (template) {
                  next.creatureProgress = { ...next.creatureProgress }
                  next.creatureProgress[pickedId] = {
                    level: 1, wins: 0,
                    currentMoves: [template.movePool[0], template.movePool[1]],
                    learnedMoves: [template.movePool[0], template.movePool[1]],
                    movesOffered: 2,
                  }
                }
                return next
              })
            },
          })
        }, 500)
      }

      // Post-battle dialogue for leaders
      if (battleInfo.postDefeatDialogue && onShowDialogue) {
        setTimeout(() => {
          onShowDialogue({
            speakerName: battleInfo.leaderName || 'Leader',
            text: battleInfo.postDefeatDialogue,
            onDismiss: () => onShowDialogue(null),
          })
        }, 1200)
      }
    }

    // Rival reward
    if (battleInfo?.type === 'rival' && !battleInfo.replay) {
      const rival = getRivalByZone(battleInfo.zoneId)
      if (rival) {
        updatedState = applyRivalReward(updatedState, rival.reward)

        // Rival 1 and 2 also give a creature pick
        const givesCreaturePick = battleInfo.zoneId === 'zone1' || battleInfo.zoneId === 'zone2'
        if (givesCreaturePick) {
          const lockedCreatures = Object.keys(CREATURES).filter(id => !updatedState.unlockedCreatureIds.includes(id))
          if (lockedCreatures.length > 0 && onShowCreaturePick) {
            const pickPool = lockedCreatures.sort(() => Math.random() - 0.5).slice(0, Math.min(3, lockedCreatures.length))
            const rivalName = gameState.campaign?.rivalName || 'Rival'
            setTimeout(() => {
              onShowCreaturePick({
                creatureIds: pickPool,
                title: `${rivalName} grudgingly acknowledges your strength!`,
                onPick: (pickedId) => {
                  onUpdateGameState(prev => {
                    const next = { ...prev, unlockedCreatureIds: [...prev.unlockedCreatureIds, pickedId] }
                    const template = CREATURES[pickedId]
                    if (template) {
                      next.creatureProgress = { ...next.creatureProgress }
                      next.creatureProgress[pickedId] = {
                        level: 1, wins: 0,
                        currentMoves: [template.movePool[0], template.movePool[1]],
                        learnedMoves: [template.movePool[0], template.movePool[1]],
                        movesOffered: 2,
                      }
                    }
                    return next
                  })
                },
              })
            }, 1800) // After dialogue + reward splash
          }
        }

        // Post-battle dialogue
        if (battleInfo.postDefeatDialogue && onShowDialogue) {
          setTimeout(() => {
            onShowDialogue({
              speakerName: gameState.campaign?.rivalName || 'Rival',
              text: battleInfo.postDefeatDialogue,
              onDismiss: () => {
                onShowDialogue(null)
                // Show reward splash after dialogue
                if (onShowRewardSplash) {
                  onShowRewardSplash({
                    title: rival.rewardTitle || 'REWARD UNLOCKED',
                    description: rival.rewardDescription || '',
                  })
                }
              },
            })
          }, 800)
        }
      }
    }

    setProcessedResults(results)
    setMoveLearnQueue(learnQueue)
    if (learnQueue.length > 0) {
      setCurrentLearn(learnQueue[0])
    }

    onUpdateGameState(updatedState)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleLearnMove = (forgetIndex) => {
    if (!currentLearn) return
    onUpdateGameState(prev => {
      const updated = { ...prev, creatureProgress: { ...prev.creatureProgress } }
      updated.creatureProgress[currentLearn.creatureId] = learnMove(updated.creatureProgress[currentLearn.creatureId], currentLearn.newMoveId, forgetIndex)
      return updated
    })
    advanceLearnQueue()
  }

  const handleSkipMove = () => {
    if (!currentLearn) return
    onUpdateGameState(prev => {
      const updated = { ...prev, creatureProgress: { ...prev.creatureProgress } }
      updated.creatureProgress[currentLearn.creatureId] = skipMove(updated.creatureProgress[currentLearn.creatureId])
      return updated
    })
    advanceLearnQueue()
  }

  const advanceLearnQueue = () => {
    const remaining = moveLearnQueue.slice(1)
    setMoveLearnQueue(remaining)
    setCurrentLearn(remaining.length > 0 ? remaining[0] : null)
  }

  // Battle label
  const getBattleLabel = () => {
    if (!battleInfo) return ''
    if (battleInfo.type === 'trainer') return `vs ${battleInfo.trainerName || 'Trainer'}`
    if (battleInfo.type === 'leader') return `vs Leader ${battleInfo.leaderName || ''}`
    if (battleInfo.type === 'rival') return `vs Rival ${gameState?.campaign?.rivalName || ''}`
    return ''
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
      {currentLearn && (
        <MoveLearnModal
          creatureName={currentLearn.creatureName}
          creatureType={currentLearn.creatureType}
          currentMoves={currentLearn.currentMoves}
          newMoveId={currentLearn.newMoveId}
          onLearn={handleLearnMove}
          onSkip={handleSkipMove}
        />
      )}

      {/* Result header */}
      <div className="text-center slide-up mb-2">
        <h2 className={`font-game text-5xl md:text-7xl font-black tracking-wider ${
          won ? 'text-transparent bg-clip-text bg-gradient-to-b from-amber-300 to-orange-500' : 'text-red-500'
        }`}>
          {won ? 'VICTORY' : 'DEFEAT'}
        </h2>
        <p className="font-ui text-sm text-slate-500 mt-1">{getBattleLabel()}</p>
      </div>

      {/* Badge earned */}
      {badgeEarned && (
        <div className="mt-2 mb-4 slide-up text-center" style={{ animationDelay: '0.1s' }}>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-amber-500/40 bg-amber-900/20">
            <span className="text-2xl">{badgeEarned.icon}</span>
            <div className="text-left">
              <p className="font-game text-xs text-amber-400 uppercase tracking-wider">Badge Earned!</p>
              <p className="font-ui text-sm font-bold text-amber-200">{badgeEarned.name}</p>
            </div>
          </div>
        </div>
      )}

      {/* Creature results */}
      {processedResults && (
        <div className="w-full max-w-md space-y-3 slide-up" style={{ animationDelay: '0.15s' }}>
          {processedResults.map((cr) => {
            const colors = TYPE_COLORS[cr.type]
            return (
              <div key={cr.id} className="rounded-xl border p-4 flex items-center justify-between"
                style={{ borderColor: colors?.dark + '60', background: `linear-gradient(135deg, ${colors?.dark}15, transparent)` }}>
                <div className="flex items-center gap-3">
                  <CreatureSprite creatureId={cr.id} creatureType={cr.type} creatureName={cr.name} size={48} />
                  <div>
                    <p className="font-ui font-bold" style={{ color: colors?.light }}>{cr.name}</p>
                    {won ? (
                      <p className="font-ui text-xs text-slate-500">
                        +1 Win ({cr.wins} total — {cr.wins % 2 === 0 ? 'leveled!' : `${2 - (cr.wins % 2)} more to level`})
                      </p>
                    ) : (
                      <p className="font-ui text-xs text-slate-500">No XP from defeat</p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  {cr.leveledUp ? (
                    <div>
                      <span className="font-game text-sm font-bold text-amber-400">LEVEL UP!</span>
                      <p className="font-ui text-xs text-slate-400">Lv {cr.oldLevel} &rarr; Lv {cr.newLevel}</p>
                    </div>
                  ) : (
                    <span className="font-ui text-sm text-slate-500">Lv {cr.oldLevel}</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Creature unlock */}
      {unlockedCreature && (
        <div className="mt-6 slide-up" style={{ animationDelay: '0.3s' }}>
          <div className="rounded-xl border-2 p-4 text-center"
            style={{
              borderColor: TYPE_COLORS[CREATURES[unlockedCreature]?.type]?.accent + '60',
              background: `linear-gradient(135deg, ${TYPE_COLORS[CREATURES[unlockedCreature]?.type]?.dark}20, transparent)`,
            }}>
            <p className="font-game text-sm font-bold text-amber-400 uppercase tracking-wider mb-2">New Creature Unlocked!</p>
            <div className="flex justify-center mb-2">
              <CreatureSprite creatureId={unlockedCreature} creatureType={CREATURES[unlockedCreature]?.type} creatureName={CREATURES[unlockedCreature]?.name} size={120} />
            </div>
            <p className="font-ui text-xl font-bold" style={{ color: TYPE_COLORS[CREATURES[unlockedCreature]?.type]?.light }}>
              {CREATURES[unlockedCreature]?.name}
            </p>
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row gap-3 mt-8 slide-up" style={{ animationDelay: '0.4s' }}>
        {won && battleInfo?.type === 'trainer' && !battleInfo?.replay && (
          <button onClick={onBattleAgain}
            className="px-8 py-3 rounded-xl font-ui font-bold text-base uppercase tracking-wider
              bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400
              border border-emerald-400/30 transition-all cursor-pointer">
            Next Battle
          </button>
        )}
        <button onClick={onChangeTeam}
          className="px-8 py-3 rounded-xl font-ui font-bold text-base uppercase tracking-wider
            bg-gradient-to-r from-slate-700 to-slate-600 hover:from-slate-600 hover:to-slate-500
            border border-slate-500/30 transition-all cursor-pointer">
          Change Team
        </button>
        <button onClick={onMainMenu}
          className="px-8 py-3 rounded-xl font-ui font-bold text-base uppercase tracking-wider
            bg-slate-800 hover:bg-slate-700 border border-slate-600/30
            text-slate-400 hover:text-slate-300 transition-all cursor-pointer">
          Campaign Map
        </button>
      </div>
    </div>
  )
}
