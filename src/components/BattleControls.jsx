import { MOVES } from '../data/moves.js'
import { TYPE_COLORS } from '../data/types.js'
import CreatureSprite from './CreatureSprite.jsx'

function colorsFor(type, typeColors) {
  return typeColors?.[type] || TYPE_COLORS[type] || {
    accent: '#718096', light: '#e2e8f0', dark: '#334155', bg: '#1e293b',
  }
}

function labelFor(type, typeNames) {
  return typeNames?.[type] || type || ''
}

export default function BattleControls({
  controls,
  logLines = [],
  typeColors,
  typeNames,
  onAttack,
  onRequestSwitch,
  onCancelSwitch,
  onPickCreature,
}) {
  const mode = controls?.mode || null
  const activeType = controls?.activeType

  return (
    <div className="rounded-2xl border border-slate-700 bg-slate-900/90 p-3 sm:p-4 flex flex-col gap-3 shadow-xl">
      <div className="rounded-xl bg-slate-950/70 px-3 py-2 min-h-[4.5rem]" aria-live="polite">
        {(logLines.length ? logLines : ['Get ready...']).map((line, i) => (
          <p key={`${i}-${line}`} className="font-ui text-base text-slate-200 leading-snug">{line}</p>
        ))}
      </div>

      {mode === 'move' && (
        <>
          <div className="grid grid-cols-2 gap-2">
            {(controls.moves || []).map((moveId) => {
              const move = MOVES[moveId]
              if (!move) return null
              const colors = colorsFor(move.type, typeColors)
              const stab = move.type === activeType
              return (
                <button
                  key={moveId}
                  type="button"
                  onClick={() => onAttack(moveId)}
                  className="min-h-16 rounded-xl px-3 py-2 text-left cursor-pointer active:brightness-125"
                  style={{ background: colors.dark, border: `2px solid ${colors.accent}` }}
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="font-ui text-base font-bold leading-tight" style={{ color: colors.light }}>{move.name}</span>
                    {stab && <span className="font-ui text-xs font-bold text-amber-300 shrink-0">STAB</span>}
                  </span>
                  <span className="block font-ui text-sm text-slate-300 mt-0.5">
                    {move.category === 'status' ? 'Status' : `Power ${move.power} · ${move.accuracy}%`}
                    {' · '}{labelFor(move.type, typeNames)}
                  </span>
                </button>
              )
            })}
          </div>
          {controls.team?.some((c, i) => i !== controls.activeIndex && !c.fainted) && (
            <button
              type="button"
              disabled={!controls.canSwitch}
              onClick={() => controls.canSwitch && onRequestSwitch()}
              className="w-full min-h-12 rounded-xl font-ui text-base font-bold uppercase tracking-wider border border-slate-600 bg-slate-800 text-slate-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:bg-slate-700"
            >
              {controls.canSwitch
                ? 'Switch creature'
                : `Switch in ${controls.cooldown} turn${controls.cooldown === 1 ? '' : 's'}`}
            </button>
          )}
        </>
      )}

      {(mode === 'switch' || mode === 'force') && (
        <div className="flex flex-col gap-2">
          <p className="font-ui text-sm font-bold uppercase tracking-wider text-slate-400">
            {mode === 'force' ? 'Choose who goes in' : 'Switch to'}
          </p>
          {(controls.team || []).filter((c) => !c.fainted && (mode === 'force' || c.index !== controls.activeIndex)).map((creature) => {
            const colors = colorsFor(creature.type, typeColors)
            const pct = Math.max(0, Math.min(1, creature.currentHp / (creature.maxHp || 1)))
            return (
              <button
                key={creature.index}
                type="button"
                onClick={() => onPickCreature(creature.index)}
                className="flex items-center gap-3 rounded-xl px-3 py-2 text-left cursor-pointer active:brightness-125 min-h-16"
                style={{ background: colors.dark + 'cc', border: `2px solid ${colors.accent}` }}
              >
                <CreatureSprite
                  creatureId={creature.id}
                  spriteId={creature.spriteId}
                  creatureType={creature.type}
                  creatureName={creature.name}
                  size={52}
                />
                <span className="flex-1 min-w-0">
                  <span className="block font-ui text-base font-bold truncate" style={{ color: colors.light }}>{creature.name}</span>
                  <span className="mt-1 block h-2 rounded-full bg-slate-950 overflow-hidden">
                    <span className="block h-full bg-emerald-400" style={{ width: `${pct * 100}%` }} />
                  </span>
                  <span className="font-ui text-sm text-slate-300">{creature.currentHp}/{creature.maxHp} HP · {labelFor(creature.type, typeNames)}</span>
                </span>
              </button>
            )
          })}
          {mode === 'switch' && (
            <button
              type="button"
              onClick={onCancelSwitch}
              className="w-full min-h-12 rounded-xl font-ui font-bold uppercase tracking-wider border border-slate-600 bg-slate-800 text-slate-300 cursor-pointer active:bg-slate-700"
            >
              Back to moves
            </button>
          )}
        </div>
      )}

      {!mode && (
        <p className="font-ui text-center text-slate-500 py-4">Watch the battle...</p>
      )}
    </div>
  )
}
