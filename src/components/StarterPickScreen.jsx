import { useState } from 'react'
import { CREATURES } from '../data/creatures.js'
import { STARTER_CHOICES, STARTER_LEVEL, STARTER_PICK } from '../data/starters.js'
import { TYPE_COLORS, TYPE_EMOJIS } from '../data/types.js'
import CreatureSprite from './CreatureSprite.jsx'

export default function StarterPickScreen({ onConfirm }) {
  const [picked, setPicked] = useState([])

  const toggle = (id) => {
    setPicked(prev => {
      if (prev.includes(id)) return prev.filter(item => item !== id)
      if (prev.length >= STARTER_PICK) return prev
      return [...prev, id]
    })
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-3 bg-slate-950/80">
      <div className="w-full max-w-3xl rounded-3xl border border-emerald-700/50 bg-slate-900 p-4 sm:p-6 max-h-[92vh] overflow-y-auto">
        <p className="font-ui text-sm uppercase tracking-wider text-emerald-300">Professor Fern</p>
        <h2 className="font-game text-2xl sm:text-3xl text-slate-100 mt-1">Choose three friends</h2>
        <p className="font-ui text-slate-300 mt-2">
          A new journey starts with three creatures, one for each kind of path you like. Everyone else is still out in the grass, waiting to be caught. Pick {STARTER_PICK}. They join you at level {STARTER_LEVEL}.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-4">
          {STARTER_CHOICES.map(choice => {
            const creature = CREATURES[choice.id]
            const colors = TYPE_COLORS[creature.type]
            const on = picked.includes(choice.id)
            return (
              <button
                key={choice.id}
                type="button"
                onClick={() => toggle(choice.id)}
                className="rounded-2xl border px-3 py-3 text-left cursor-pointer min-h-28"
                style={{
                  borderColor: on ? colors.accent : '#334155',
                  background: on ? colors.dark : '#0f172a',
                }}
              >
                <div className="flex items-center gap-2">
                  <CreatureSprite creatureId={choice.id} creatureType={creature.type} creatureName={creature.name} size={56} />
                  <div>
                    <p className="font-ui font-bold text-slate-100">{creature.name}</p>
                    <p className="font-ui text-sm" style={{ color: colors.light }}>{TYPE_EMOJIS[creature.type]} {creature.type}</p>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
        <button
          type="button"
          disabled={picked.length !== STARTER_PICK}
          onClick={() => onConfirm(picked)}
          className="mt-4 w-full min-h-14 rounded-2xl font-ui font-bold uppercase tracking-wider text-lg bg-emerald-600 text-white disabled:opacity-40 cursor-pointer"
        >
          {picked.length === STARTER_PICK ? 'Take these three' : `Choose ${STARTER_PICK - picked.length} more`}
        </button>
      </div>
    </div>
  )
}
