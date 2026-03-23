import { useState } from 'react'
import { MOVES } from '../data/moves.js'
import { TYPE_COLORS, TYPE_EMOJIS } from '../data/types.js'

function MoveDetail({ moveId, creatureType, isNew, isSelected, onClick }) {
  const move = MOVES[moveId]
  if (!move) return null

  const colors = TYPE_COLORS[move.type]
  const isStab = move.type === creatureType

  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-lg p-3 border-2 transition-all cursor-pointer ${
        isSelected ? 'ring-2 ring-red-400 ring-offset-2 ring-offset-slate-950' : ''
      }`}
      style={{
        borderColor: isNew ? '#22c55e80' : (isSelected ? '#ef444480' : colors.dark + '60'),
        background: isNew
          ? `linear-gradient(135deg, ${colors.dark}30, #22c55e10)`
          : `linear-gradient(135deg, ${colors.dark}20, transparent)`,
      }}
    >
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <span className="font-ui font-bold" style={{ color: colors.light }}>
            {move.name}
          </span>
          {isNew && (
            <span className="text-[10px] font-ui font-bold uppercase px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              New
            </span>
          )}
          {isStab && (
            <span className="text-[10px] font-ui font-bold uppercase px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400">
              STAB
            </span>
          )}
          {isSelected && (
            <span className="text-[10px] font-ui font-bold uppercase px-1.5 py-0.5 rounded bg-red-500/20 text-red-400">
              Forget
            </span>
          )}
        </div>
        <span
          className="text-xs font-ui font-bold uppercase px-2 py-0.5 rounded-full"
          style={{ background: colors.dark + '80', color: colors.light }}
        >
          {TYPE_EMOJIS[move.type]} {move.type}
        </span>
      </div>

      <div className="flex items-center gap-4 text-xs font-ui text-slate-400">
        <span className="uppercase font-semibold text-slate-500">{move.category}</span>
        {move.category !== 'status' ? (
          <>
            <span>Power: <b className="text-slate-300">{move.power}</b></span>
            <span>Accuracy: <b className="text-slate-300">{move.accuracy}%</b></span>
          </>
        ) : (
          <span className="text-purple-400">{formatEffect(move.effect)}</span>
        )}
      </div>
    </button>
  )
}

function formatEffect(effect) {
  if (!effect) return 'No effect'

  const parts = []
  if (effect.heal) {
    parts.push(`Heal ${Math.round(effect.heal * 100)}% HP`)
  }
  if (effect.stats) {
    for (const [stat, change] of Object.entries(effect.stats)) {
      const sign = change > 0 ? '+' : ''
      const target = effect.target === 'self' ? 'own' : "foe's"
      parts.push(`${sign}${change} ${target} ${stat.toUpperCase()}`)
    }
  }
  return parts.join(', ') || 'No effect'
}

export default function MoveLearnModal({ creatureName, creatureType, currentMoves, newMoveId, onLearn, onSkip }) {
  const [forgetIndex, setForgetIndex] = useState(null)
  const needsForget = currentMoves.length >= 4

  const handleConfirm = () => {
    if (needsForget && forgetIndex === null) return
    onLearn(forgetIndex)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-md w-full mx-4 slide-up shadow-2xl">
        <h3 className="font-game text-xl font-bold text-center tracking-wider text-slate-100 mb-1">
          NEW MOVE
        </h3>
        <p className="font-ui text-center text-slate-400 text-sm mb-4">
          {creatureName} can learn a new move!
        </p>

        {/* New move */}
        <div className="mb-4">
          <MoveDetail moveId={newMoveId} creatureType={creatureType} isNew />
        </div>

        {needsForget && (
          <>
            <p className="font-ui text-xs text-slate-500 uppercase font-bold tracking-wider mb-2 text-center">
              Choose a move to forget
            </p>
            <div className="space-y-2 mb-4">
              {currentMoves.map((moveId, idx) => (
                <MoveDetail
                  key={moveId}
                  moveId={moveId}
                  creatureType={creatureType}
                  isSelected={forgetIndex === idx}
                  onClick={() => setForgetIndex(prev => prev === idx ? null : idx)}
                />
              ))}
            </div>
          </>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleConfirm}
            disabled={needsForget && forgetIndex === null}
            className="flex-1 py-3 rounded-xl font-ui font-bold text-base uppercase tracking-wider
              bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400
              border border-emerald-400/30
              transition-all cursor-pointer
              disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {needsForget ? 'Forget & Learn' : 'Learn Move'}
          </button>
          <button
            onClick={onSkip}
            className="px-6 py-3 rounded-xl font-ui font-bold text-base uppercase tracking-wider
              bg-slate-800 hover:bg-slate-700
              border border-slate-600/30
              text-slate-400 hover:text-slate-300
              transition-all cursor-pointer"
          >
            Skip
          </button>
        </div>
      </div>
    </div>
  )
}
