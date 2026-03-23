import { useState } from 'react'
import { CREATURES } from '../data/creatures.js'
import { TYPE_COLORS } from '../data/types.js'
import CreatureSprite from './CreatureSprite.jsx'

export default function CreaturePickModal({ creatureIds, onPick, title }) {
  const [selected, setSelected] = useState(null)

  const creatures = creatureIds.map(id => CREATURES[id]).filter(Boolean)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" />
      <div className="relative w-full max-w-lg rounded-2xl border border-amber-500/30 bg-slate-900/95 p-6 backdrop-blur-sm">
        <h3 className="font-game text-xl font-bold text-center text-amber-300 tracking-wider mb-2">
          {title || 'CHOOSE A CREATURE'}
        </h3>
        <p className="font-ui text-xs text-slate-500 text-center mb-4">Select one creature to add to your roster</p>

        <div className="grid grid-cols-3 gap-3 mb-4">
          {creatures.map(creature => {
            const colors = TYPE_COLORS[creature.type] || { accent: '#718096', dark: '#4a5568', light: '#a0aec0' }
            const isSelected = selected === creature.id
            return (
              <button key={creature.id}
                onClick={() => setSelected(creature.id)}
                className={`rounded-xl border p-3 text-center transition-all cursor-pointer ${
                  isSelected
                    ? 'ring-2 ring-amber-400 scale-105'
                    : 'hover:scale-102'
                }`}
                style={{
                  borderColor: isSelected ? colors.accent : colors.dark + '60',
                  background: `linear-gradient(135deg, ${colors.dark}30, transparent)`,
                }}>
                <div className="w-16 h-16 mx-auto mb-2">
                  <CreatureSprite creatureId={creature.id} type={creature.type} size={64} />
                </div>
                <p className="font-ui text-sm font-bold" style={{ color: colors.light }}>{creature.name}</p>
                <p className="font-ui text-xs" style={{ color: colors.accent }}>
                  {creature.type.toUpperCase()} &middot; {creature.archetype.replace('_', ' ')}
                </p>
                <div className="mt-1 text-[10px] font-ui text-slate-500">
                  HP {creature.baseStats.hp} ATK {creature.baseStats.atk} DEF {creature.baseStats.def}
                </div>
              </button>
            )
          })}
        </div>

        <button onClick={() => selected && onPick(selected)}
          disabled={!selected}
          className="w-full py-3 rounded-xl font-ui font-bold uppercase tracking-wider
            bg-gradient-to-r from-amber-600 to-orange-500 hover:from-amber-500 hover:to-orange-400
            border border-amber-400/30 transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed">
          Unlock {selected ? CREATURES[selected]?.name : '...'}
        </button>
      </div>
    </div>
  )
}
