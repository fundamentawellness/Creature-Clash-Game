import { useState, useEffect } from 'react'
import { CREATURES } from '../data/creatures.js'
import { TYPE_COLORS } from '../data/types.js'
import { addWin, applyLevelUp, getAvailableNewMove, learnMove, skipMove, checkCreatureUnlock } from '../systems/progression.js'
import MoveLearnModal from './MoveLearnModal.jsx'

export default function ResultScreen({ result, gameState, selectedTeam, difficulty, onUpdateGameState, onBattleAgain, onChangeTeam, onMainMenu }) {
  const [processedResults, setProcessedResults] = useState(null)
  const [moveLearnQueue, setMoveLearnQueue] = useState([])
  const [currentLearn, setCurrentLearn] = useState(null)
  const [unlockedCreature, setUnlockedCreature] = useState(null)
  const [processed, setProcessed] = useState(false)

  const won = result?.won

  // Process results once on mount
  useEffect(() => {
    if (processed || !gameState) return
    setProcessed(true)

    if (!won) {
      // Defeat — no progression, just show the result
      setProcessedResults(selectedTeam.map(id => ({
        id,
        name: CREATURES[id]?.name,
        type: CREATURES[id]?.type,
        winsGained: 0,
        leveledUp: false,
        oldLevel: gameState.creatureProgress[id]?.level || 1,
        newLevel: gameState.creatureProgress[id]?.level || 1,
        wins: gameState.creatureProgress[id]?.wins || 0,
      })))
      return
    }

    // Victory — process progression
    const results = []
    let updatedState = { ...gameState }
    updatedState.creatureProgress = { ...gameState.creatureProgress }
    updatedState.battlesWon = { ...gameState.battlesWon }
    updatedState.difficulty = { ...gameState.difficulty }

    // Record battle win
    updatedState.totalBattlesWon = (updatedState.totalBattlesWon || 0) + 1
    updatedState.battlesWon[difficulty] = (updatedState.battlesWon[difficulty] || 0) + 1

    // Check difficulty clear
    const thresholds = { easy: 5, medium: 7, hard: 10 }
    if (updatedState.battlesWon[difficulty] >= thresholds[difficulty]) {
      updatedState.difficulty[difficulty + 'Cleared'] = true
    }

    // Process each creature
    const learnQueue = []
    for (const creatureId of selectedTeam) {
      const progress = updatedState.creatureProgress[creatureId]
      if (!progress) continue

      const { state: afterWin, leveledUp } = addWin({ ...progress, id: creatureId })
      let updated = afterWin

      const creatureResult = {
        id: creatureId,
        name: CREATURES[creatureId]?.name,
        type: CREATURES[creatureId]?.type,
        winsGained: 1,
        leveledUp: false,
        oldLevel: progress.level,
        newLevel: progress.level,
        wins: updated.wins,
      }

      if (leveledUp) {
        updated = applyLevelUp(updated)
        creatureResult.leveledUp = true
        creatureResult.newLevel = updated.level

        const newMove = getAvailableNewMove(updated)
        if (newMove) {
          learnQueue.push({
            creatureId,
            creatureName: CREATURES[creatureId]?.name,
            creatureType: CREATURES[creatureId]?.type,
            currentMoves: [...updated.currentMoves],
            newMoveId: newMove,
          })
        }
      }

      updatedState.creatureProgress[creatureId] = updated
      results.push(creatureResult)
    }

    // Check creature unlock
    const unlockId = checkCreatureUnlock(updatedState.totalBattlesWon, updatedState.unlockedCreatureIds)
    if (unlockId) {
      updatedState.unlockedCreatureIds = [...updatedState.unlockedCreatureIds, unlockId]
      const template = CREATURES[unlockId]
      if (template) {
        updatedState.creatureProgress[unlockId] = {
          level: 1, wins: 0,
          currentMoves: [template.movePool[0], template.movePool[1]],
          learnedMoves: [template.movePool[0], template.movePool[1]],
          movesOffered: 2,
        }
      }
      setUnlockedCreature(unlockId)
    }

    setProcessedResults(results)
    setMoveLearnQueue(learnQueue)
    if (learnQueue.length > 0) {
      console.log('[ResultScreen] Move learn queue:', learnQueue.length, learnQueue.map(l => `${l.creatureName}: ${l.newMoveId}`))
      setCurrentLearn(learnQueue[0])
    }

    onUpdateGameState(updatedState)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleLearnMove = (forgetIndex) => {
    if (!currentLearn) return
    onUpdateGameState(prev => {
      const updated = { ...prev, creatureProgress: { ...prev.creatureProgress } }
      const progress = updated.creatureProgress[currentLearn.creatureId]
      updated.creatureProgress[currentLearn.creatureId] = learnMove(progress, currentLearn.newMoveId, forgetIndex)
      return updated
    })
    advanceLearnQueue()
  }

  const handleSkipMove = () => {
    if (!currentLearn) return
    onUpdateGameState(prev => {
      const updated = { ...prev, creatureProgress: { ...prev.creatureProgress } }
      const progress = updated.creatureProgress[currentLearn.creatureId]
      updated.creatureProgress[currentLearn.creatureId] = skipMove(progress)
      return updated
    })
    advanceLearnQueue()
  }

  const advanceLearnQueue = () => {
    const remaining = moveLearnQueue.slice(1)
    setMoveLearnQueue(remaining)
    setCurrentLearn(remaining.length > 0 ? remaining[0] : null)
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
      {/* Move learn modal */}
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
      <div className="text-center slide-up mb-8">
        <h2
          className={`font-game text-5xl md:text-7xl font-black tracking-wider ${
            won ? 'text-transparent bg-clip-text bg-gradient-to-b from-amber-300 to-orange-500' : 'text-red-500'
          }`}
        >
          {won ? 'VICTORY' : 'DEFEAT'}
        </h2>
        <p className="font-ui text-lg text-slate-400 mt-2 uppercase tracking-wider">
          {won ? 'Your team dominated the battlefield!' : 'Your creatures were defeated...'}
        </p>
      </div>

      {/* Creature results */}
      {processedResults && (
        <div className="w-full max-w-md space-y-3 slide-up" style={{ animationDelay: '0.15s' }}>
          {processedResults.map((cr) => {
            const colors = TYPE_COLORS[cr.type]
            return (
              <div
                key={cr.id}
                className="rounded-xl border p-4 flex items-center justify-between"
                style={{
                  borderColor: colors?.dark + '60',
                  background: `linear-gradient(135deg, ${colors?.dark}15, transparent)`,
                }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ background: colors?.dark + '60' }}
                  >
                    <div className="w-6 h-6 rounded-full" style={{ background: colors?.accent }} />
                  </div>
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
                      <p className="font-ui text-xs text-slate-400">
                        Lv {cr.oldLevel} &rarr; Lv {cr.newLevel}
                      </p>
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
          <div
            className="rounded-xl border-2 p-4 text-center"
            style={{
              borderColor: TYPE_COLORS[CREATURES[unlockedCreature]?.type]?.accent + '60',
              background: `linear-gradient(135deg, ${TYPE_COLORS[CREATURES[unlockedCreature]?.type]?.dark}20, transparent)`,
              boxShadow: `0 0 30px ${TYPE_COLORS[CREATURES[unlockedCreature]?.type]?.accent}20`,
            }}
          >
            <p className="font-game text-sm font-bold text-amber-400 uppercase tracking-wider mb-1">
              New Creature Unlocked!
            </p>
            <p className="font-ui text-xl font-bold" style={{ color: TYPE_COLORS[CREATURES[unlockedCreature]?.type]?.light }}>
              {CREATURES[unlockedCreature]?.name}
            </p>
            <p className="font-ui text-xs text-slate-500 mt-1">
              {CREATURES[unlockedCreature]?.desc}
            </p>
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row gap-3 mt-10 slide-up" style={{ animationDelay: '0.4s' }}>
        <button
          onClick={onBattleAgain}
          className="px-8 py-3 rounded-xl font-ui font-bold text-base uppercase tracking-wider
            bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400
            border border-emerald-400/30 transition-all cursor-pointer"
        >
          Battle Again
        </button>
        <button
          onClick={onChangeTeam}
          className="px-8 py-3 rounded-xl font-ui font-bold text-base uppercase tracking-wider
            bg-gradient-to-r from-slate-700 to-slate-600 hover:from-slate-600 hover:to-slate-500
            border border-slate-500/30 transition-all cursor-pointer"
        >
          Change Team
        </button>
        <button
          onClick={onMainMenu}
          className="px-8 py-3 rounded-xl font-ui font-bold text-base uppercase tracking-wider
            bg-slate-800 hover:bg-slate-700 border border-slate-600/30
            text-slate-400 hover:text-slate-300 transition-all cursor-pointer"
        >
          Main Menu
        </button>
      </div>
    </div>
  )
}
