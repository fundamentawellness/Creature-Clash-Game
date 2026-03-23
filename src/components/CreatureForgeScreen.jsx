import { useState } from 'react'
import { CREATURES } from '../data/creatures.js'
import { MOVES } from '../data/moves.js'
import { TYPES, TYPE_COLORS, TYPE_CHART } from '../data/types.js'
import CreatureCreator from './CreatureCreator.jsx'
import TypeCreator from './TypeCreator.jsx'

const MAX_CUSTOM_CREATURES = 5
const MAX_CUSTOM_TYPES = 2

export default function CreatureForgeScreen({ gameState, onUpdateGameState, onBack }) {
  const [tab, setTab] = useState('creatures') // 'creatures' | 'types'
  const [editingCreature, setEditingCreature] = useState(null) // index or 'new'

  const customCreatures = gameState.customCreatures || []
  const customTypes = gameState.customTypes || []
  const allTypes = [...TYPES.filter(t => t !== 'normal'), ...customTypes.map(t => t.id), 'normal']

  const handleSaveCreature = (creature) => {
    onUpdateGameState(prev => {
      const customs = [...(prev.customCreatures || [])]
      const existing = customs.findIndex(c => c.id === creature.id)
      if (existing >= 0) {
        customs[existing] = creature
      } else {
        customs.push(creature)
      }

      // Add to unlocked and create progress if new
      const unlocked = prev.unlockedCreatureIds.includes(creature.id)
        ? prev.unlockedCreatureIds
        : [...prev.unlockedCreatureIds, creature.id]

      const progress = { ...prev.creatureProgress }
      if (!progress[creature.id]) {
        progress[creature.id] = {
          level: 1, wins: 0,
          currentMoves: creature.movePool.slice(0, 2),
          learnedMoves: creature.movePool.slice(0, 2),
          movesOffered: 2,
        }
      }

      return { ...prev, customCreatures: customs, unlockedCreatureIds: unlocked, creatureProgress: progress }
    })
    setEditingCreature(null)
  }

  const handleDeleteCreature = (id) => {
    onUpdateGameState(prev => {
      const customs = (prev.customCreatures || []).filter(c => c.id !== id)
      const unlocked = prev.unlockedCreatureIds.filter(uid => uid !== id)
      const progress = { ...prev.creatureProgress }
      delete progress[id]
      const lastTeam = prev.lastTeam.filter(tid => tid !== id)
      return { ...prev, customCreatures: customs, unlockedCreatureIds: unlocked, creatureProgress: progress, lastTeam }
    })
  }

  const handleSaveType = (type) => {
    onUpdateGameState(prev => {
      const customs = [...(prev.customTypes || [])]
      const existing = customs.findIndex(t => t.id === type.id)
      if (existing >= 0) {
        customs[existing] = type
      } else {
        customs.push(type)
      }
      return { ...prev, customTypes: customs }
    })
  }

  const handleDeleteType = (id) => {
    onUpdateGameState(prev => {
      const customs = (prev.customTypes || []).filter(t => t.id !== id)
      return { ...prev, customTypes: customs }
    })
  }

  return (
    <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button onClick={onBack} className="font-ui font-bold text-slate-400 hover:text-slate-200 uppercase tracking-wider text-sm transition-colors cursor-pointer">
          &larr; Back
        </button>
        <h2 className="font-game text-2xl md:text-3xl font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-orange-500">
          CREATURE FORGE
        </h2>
        <div className="w-16" />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 justify-center">
        {['creatures', 'types'].map(t => (
          <button
            key={t}
            onClick={() => { setTab(t); setEditingCreature(null) }}
            className={`px-6 py-2 rounded-lg font-ui font-bold uppercase tracking-wider text-sm transition-all cursor-pointer ${
              tab === t
                ? 'bg-amber-600/80 text-white border border-amber-400/40'
                : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700'
            }`}
          >
            {t === 'creatures' ? `Creatures (${customCreatures.length}/${MAX_CUSTOM_CREATURES})` : `Types (${customTypes.length}/${MAX_CUSTOM_TYPES})`}
          </button>
        ))}
      </div>

      {/* Creature Creator Tab */}
      {tab === 'creatures' && !editingCreature && (
        <div className="space-y-4">
          {/* Existing custom creatures */}
          {customCreatures.map((creature, i) => {
            const colors = TYPE_COLORS[creature.type] || { accent: '#718096', light: '#a0aec0', dark: '#4a5568' }
            return (
              <div key={creature.id} className="rounded-xl border p-4 flex items-center justify-between"
                style={{ borderColor: colors.dark + '60', background: `linear-gradient(135deg, ${colors.dark}15, transparent)` }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: colors.dark + '60' }}>
                    <div className="w-6 h-6 rounded-full" style={{ background: colors.accent }} />
                  </div>
                  <div>
                    <p className="font-ui font-bold" style={{ color: colors.light }}>{creature.name}</p>
                    <p className="font-ui text-xs text-slate-500">{creature.type.toUpperCase()} {creature.archetype.replace('_', ' ').toUpperCase()}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setEditingCreature(creature.id)}
                    className="px-3 py-1 rounded-lg text-xs font-ui font-bold uppercase bg-slate-700 hover:bg-slate-600 text-slate-300 transition-all cursor-pointer">
                    Edit
                  </button>
                  <button onClick={() => handleDeleteCreature(creature.id)}
                    className="px-3 py-1 rounded-lg text-xs font-ui font-bold uppercase bg-red-900/30 hover:bg-red-800/50 text-red-400 transition-all cursor-pointer">
                    Delete
                  </button>
                </div>
              </div>
            )
          })}

          {customCreatures.length < MAX_CUSTOM_CREATURES && (
            <button onClick={() => setEditingCreature('new')}
              className="w-full py-4 rounded-xl border-2 border-dashed border-slate-600 hover:border-amber-500/50 text-slate-500 hover:text-amber-400 font-ui font-bold uppercase tracking-wider transition-all cursor-pointer">
              + Create New Creature
            </button>
          )}
        </div>
      )}

      {tab === 'creatures' && editingCreature && (
        <CreatureCreator
          existingCreature={editingCreature !== 'new' ? customCreatures.find(c => c.id === editingCreature) : null}
          allTypes={allTypes}
          customTypes={customTypes}
          onSave={handleSaveCreature}
          onCancel={() => setEditingCreature(null)}
        />
      )}

      {/* Type Creator Tab */}
      {tab === 'types' && (
        <TypeCreator
          customTypes={customTypes}
          maxTypes={MAX_CUSTOM_TYPES}
          onSave={handleSaveType}
          onDelete={handleDeleteType}
        />
      )}
    </div>
  )
}
