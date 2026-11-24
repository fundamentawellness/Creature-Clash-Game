import CreatureSprite from './CreatureSprite.jsx'
import { TYPE_COLORS } from '../data/types.js'

export default function EvolutionModal({ evolution, onDone }) {
  if (!evolution) return null
  const colors = TYPE_COLORS[evolution.type] || { accent: '#f6ad55', light: '#fbd38d' }

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-4" onClick={onDone} role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/75" />
      <div
        className="relative w-full max-w-md rounded-3xl border px-5 py-6 text-center slide-up"
        style={{ borderColor: colors.accent, background: '#0f172a' }}
        onClick={(event) => event.stopPropagation()}
      >
        <p className="font-game text-sm tracking-[0.25em] text-amber-300 mb-2">EVOLUTION</p>
        <h2 className="font-game text-3xl font-black text-slate-100 mb-4">What?</h2>
        <div className="flex items-center justify-center gap-3">
          <div>
            <CreatureSprite creatureId={evolution.fromSprite} spriteId={evolution.fromSprite} creatureName={evolution.fromName} creatureType={evolution.type} size={96} />
            <p className="font-ui text-sm text-slate-400 mt-1">{evolution.fromName}</p>
          </div>
          <span className="font-game text-3xl text-amber-300">→</span>
          <div>
            <CreatureSprite creatureId={evolution.toSprite} spriteId={evolution.toSprite} creatureName={evolution.toName} creatureType={evolution.type} size={120} />
            <p className="font-ui text-lg font-bold mt-1" style={{ color: colors.light }}>{evolution.toName}</p>
          </div>
        </div>
        <p className="font-ui text-lg text-slate-200 mt-4">
          {evolution.fromName} grew into {evolution.toName}!
        </p>
        <button
          type="button"
          onClick={onDone}
          className="mt-5 w-full rounded-xl py-3 font-ui text-lg font-bold uppercase tracking-wider bg-amber-500 text-slate-950 cursor-pointer active:bg-amber-400"
        >
          Amazing!
        </button>
      </div>
    </div>
  )
}
