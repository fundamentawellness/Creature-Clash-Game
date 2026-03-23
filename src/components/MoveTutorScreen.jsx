import { useState, useMemo } from 'react'
import { CREATURES } from '../data/creatures.js'
import { MOVES } from '../data/moves.js'
import { TYPE_COLORS } from '../data/types.js'
import { getAllCreatures } from '../utils/customData.js'
import CreatureSprite from './CreatureSprite.jsx'

export default function MoveTutorScreen({ gameState, onUpdateGameState, onBack }) {
  const [selectedCreature, setSelectedCreature] = useState(null)
  const [swapFrom, setSwapFrom] = useState(null) // index in currentMoves to replace

  const allCreatures = useMemo(() => getAllCreatures(gameState), [gameState])
  const unlockedIds = gameState.unlockedCreatureIds || []

  const selectedProgress = selectedCreature ? gameState.creatureProgress?.[selectedCreature] : null
  const selectedTemplate = selectedCreature ? allCreatures[selectedCreature] : null

  const currentMoves = selectedProgress?.currentMoves || []
  const learnedMoves = selectedProgress?.learnedMoves || []
  // Moves that were learned but are not currently equipped
  const forgottenMoves = learnedMoves.filter(id => !currentMoves.includes(id))

  const handleSwap = (newMoveId) => {
    if (swapFrom === null || !selectedCreature) return
    onUpdateGameState(prev => {
      const progress = { ...prev.creatureProgress }
      const cp = { ...progress[selectedCreature] }
      const moves = [...cp.currentMoves]
      moves[swapFrom] = newMoveId
      cp.currentMoves = moves
      progress[selectedCreature] = cp
      return { ...prev, creatureProgress: progress }
    })
    setSwapFrom(null)
  }

  return (
    <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <button onClick={onBack} className="font-ui font-bold text-slate-400 hover:text-slate-200 uppercase tracking-wider text-sm transition-colors cursor-pointer">
          &larr; Back
        </button>
        <h2 className="font-game text-2xl font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-blue-500">
          MOVE TUTOR
        </h2>
        <div className="w-16" />
      </div>

      <p className="font-ui text-sm text-slate-500 text-center mb-4">Select a creature to re-learn forgotten moves</p>

      <div className="flex gap-4 flex-1 min-h-0">
        {/* Creature list */}
        <div className="w-48 overflow-y-auto space-y-2 shrink-0">
          {unlockedIds.map(id => {
            const template = allCreatures[id]
            if (!template) return null
            const colors = TYPE_COLORS[template.type] || { accent: '#718096', dark: '#4a5568' }
            const isActive = selectedCreature === id
            return (
              <button key={id} onClick={() => { setSelectedCreature(id); setSwapFrom(null) }}
                className={`w-full flex items-center gap-2 px-2 py-2 rounded-lg transition-all cursor-pointer ${
                  isActive ? 'ring-1 ring-cyan-400 bg-slate-800' : 'hover:bg-slate-800/50'
                }`}>
                <div className="w-8 h-8">
                  <CreatureSprite creatureId={id} type={template.type} size={32} />
                </div>
                <div className="text-left">
                  <p className="font-ui text-xs font-bold text-slate-300">{template.name}</p>
                  <p className="font-ui text-[10px]" style={{ color: colors.accent }}>{template.type.toUpperCase()}</p>
                </div>
              </button>
            )
          })}
        </div>

        {/* Move details */}
        <div className="flex-1 overflow-y-auto">
          {!selectedCreature && (
            <div className="flex items-center justify-center h-full text-slate-600 font-ui">
              Select a creature to view moves
            </div>
          )}

          {selectedCreature && selectedProgress && (
            <div className="space-y-4">
              {/* Current moves */}
              <div>
                <h4 className="font-ui text-xs text-slate-500 uppercase font-bold tracking-wider mb-2">Current Moves</h4>
                <div className="grid grid-cols-2 gap-2">
                  {currentMoves.map((moveId, idx) => {
                    const move = MOVES[moveId]
                    if (!move) return null
                    const mc = TYPE_COLORS[move.type] || { accent: '#718096', dark: '#4a5568', light: '#a0aec0' }
                    const isSwapping = swapFrom === idx
                    return (
                      <button key={idx} onClick={() => setSwapFrom(isSwapping ? null : idx)}
                        className={`text-left px-3 py-2 rounded-lg border transition-all cursor-pointer ${
                          isSwapping ? 'ring-2 ring-red-400 border-red-500/50' : 'hover:bg-slate-800'
                        }`}
                        style={{ borderColor: mc.dark + '60', background: isSwapping ? mc.dark + '30' : 'transparent' }}>
                        <p className="font-ui text-sm font-bold" style={{ color: mc.light }}>{move.name}</p>
                        <p className="font-ui text-[10px] text-slate-500">
                          {move.category === 'status' ? 'STATUS' : `PWR ${move.power}`} &middot; {move.type}
                        </p>
                        {isSwapping && <p className="font-ui text-[10px] text-red-400 mt-1">Select a move below to swap</p>}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Forgotten moves */}
              {forgottenMoves.length > 0 && (
                <div>
                  <h4 className="font-ui text-xs text-slate-500 uppercase font-bold tracking-wider mb-2">
                    Forgotten Moves {swapFrom !== null && <span className="text-cyan-400">(click to re-learn)</span>}
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {forgottenMoves.map(moveId => {
                      const move = MOVES[moveId]
                      if (!move) return null
                      const mc = TYPE_COLORS[move.type] || { accent: '#718096', dark: '#4a5568', light: '#a0aec0' }
                      return (
                        <button key={moveId}
                          onClick={() => swapFrom !== null && handleSwap(moveId)}
                          disabled={swapFrom === null}
                          className={`text-left px-3 py-2 rounded-lg border transition-all ${
                            swapFrom !== null ? 'cursor-pointer hover:ring-1 hover:ring-cyan-400' : 'opacity-50 cursor-not-allowed'
                          }`}
                          style={{ borderColor: mc.dark + '40' }}>
                          <p className="font-ui text-sm font-bold" style={{ color: mc.light }}>{move.name}</p>
                          <p className="font-ui text-[10px] text-slate-500">
                            {move.category === 'status' ? 'STATUS' : `PWR ${move.power}`} &middot; {move.type}
                          </p>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {forgottenMoves.length === 0 && (
                <p className="font-ui text-sm text-slate-600 text-center py-4">
                  This creature hasn't forgotten any moves yet.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
