import { useState, useMemo } from 'react'
import { MOVES } from '../data/moves.js'
import { TYPE_COLORS, TYPES } from '../data/types.js'

const STAT_BUDGET = 310
const STAT_MIN = 20
const STAT_MAX = 100
const STATS = ['hp', 'atk', 'def', 'spd', 'spc']
const STAT_LABELS = { hp: 'HP', atk: 'ATK', def: 'DEF', spd: 'SPD', spc: 'SPC' }
const ARCHETYPES = ['speedster', 'tank', 'glass_cannon', 'bruiser']
const ARCHETYPE_LABELS = { speedster: 'Speedster', tank: 'Tank', glass_cannon: 'Glass Cannon', bruiser: 'Bruiser' }
const ARCHETYPE_GUIDES = {
  speedster: { hp: 55, atk: 62, def: 45, spd: 88, spc: 60 },
  tank: { hp: 88, atk: 50, def: 85, spd: 25, spc: 50 },
  glass_cannon: { hp: 40, atk: 65, def: 32, spd: 68, spc: 85 },
  bruiser: { hp: 78, atk: 78, def: 58, spd: 32, spc: 55 },
}
const SHAPES = ['wolf', 'tortoise', 'hawk', 'dolphin', 'crab', 'bull', 'ferret', 'boulder', 'fox', 'viper', 'sprite', 'frog', 'owl', 'blob', 'bear', 'serpent', 'moth', 'mole', 'armadillo', 'golem', 'ram', 'rhino', 'beast', 'jaw', 'titan', 'vine']

export default function CreatureCreator({ existingCreature, allTypes, customTypes, onSave, onCancel }) {
  const defaults = existingCreature || {
    name: '', type: 'fire', archetype: 'speedster', desc: '', shape: 'wolf',
    baseStats: { hp: 62, atk: 62, def: 62, spd: 62, spc: 62 },
    movePool: [],
  }

  const [name, setName] = useState(defaults.name)
  const [type, setType] = useState(defaults.type)
  const [archetype, setArchetype] = useState(defaults.archetype)
  const [desc, setDesc] = useState(defaults.desc)
  const [shape, setShape] = useState(defaults.shape)
  const [stats, setStats] = useState({ ...defaults.baseStats })
  const [selectedMoves, setSelectedMoves] = useState(defaults.movePool || [])

  const totalStats = Object.values(stats).reduce((a, b) => a + b, 0)
  const remaining = STAT_BUDGET - totalStats

  const allMoves = useMemo(() => Object.values(MOVES).sort((a, b) => {
    if (a.type !== b.type) return a.type.localeCompare(b.type)
    if (a.category !== b.category) return a.category.localeCompare(b.category)
    return (b.power || 0) - (a.power || 0)
  }), [])

  const handleStatChange = (stat, value) => {
    const newVal = Math.max(STAT_MIN, Math.min(STAT_MAX, Number(value)))
    const newStats = { ...stats, [stat]: newVal }
    setStats(newStats)
  }

  const handleApplyArchetype = () => {
    const guide = ARCHETYPE_GUIDES[archetype]
    if (guide) setStats({ ...guide })
  }

  const toggleMove = (moveId) => {
    setSelectedMoves(prev => {
      if (prev.includes(moveId)) return prev.filter(m => m !== moveId)
      if (prev.length >= 8) return prev
      return [...prev, moveId]
    })
  }

  const isValid = name.trim().length >= 2 && name.length <= 12 && selectedMoves.length === 8 && Math.abs(remaining) <= 5

  const handleSave = () => {
    if (!isValid) return
    const id = existingCreature?.id || 'custom_' + name.trim().toLowerCase().replace(/\s+/g, '_') + '_' + Date.now()
    onSave({
      id, name: name.trim(), type, archetype, desc: desc.trim(), shape,
      baseStats: { ...stats }, movePool: [...selectedMoves], isCustom: true,
    })
  }

  const getTypeColors = (t) => TYPE_COLORS[t] || customTypes?.find(ct => ct.id === t)?.colors || { accent: '#718096', light: '#a0aec0', dark: '#4a5568', bg: '#5a6072', glow: '#cbd5e0' }

  return (
    <div className="space-y-6 slide-up">
      <div className="flex items-center justify-between">
        <h3 className="font-game text-lg font-bold tracking-wider text-slate-100">
          {existingCreature ? 'EDIT CREATURE' : 'NEW CREATURE'}
        </h3>
        <button onClick={onCancel} className="font-ui text-sm text-slate-500 hover:text-slate-300 cursor-pointer">Cancel</button>
      </div>

      {/* Name & Description */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="font-ui text-xs text-slate-500 uppercase font-bold tracking-wider">Name</label>
          <input value={name} onChange={e => setName(e.target.value.slice(0, 12))}
            className="w-full mt-1 px-3 py-2 rounded-lg bg-slate-800 border border-slate-600 text-slate-100 font-ui focus:border-amber-500 focus:outline-none" placeholder="Creature name..." />
          <p className="font-ui text-xs text-slate-600 mt-1">{name.length}/12</p>
        </div>
        <div>
          <label className="font-ui text-xs text-slate-500 uppercase font-bold tracking-wider">Description</label>
          <input value={desc} onChange={e => setDesc(e.target.value.slice(0, 40))}
            className="w-full mt-1 px-3 py-2 rounded-lg bg-slate-800 border border-slate-600 text-slate-100 font-ui focus:border-amber-500 focus:outline-none" placeholder="Short description..." />
        </div>
      </div>

      {/* Type, Archetype, Shape */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="font-ui text-xs text-slate-500 uppercase font-bold tracking-wider">Type</label>
          <select value={type} onChange={e => setType(e.target.value)}
            className="w-full mt-1 px-3 py-2 rounded-lg bg-slate-800 border border-slate-600 text-slate-100 font-ui focus:border-amber-500 focus:outline-none cursor-pointer">
            {allTypes.filter(t => t !== 'normal').map(t => (
              <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="font-ui text-xs text-slate-500 uppercase font-bold tracking-wider">Archetype</label>
          <select value={archetype} onChange={e => setArchetype(e.target.value)}
            className="w-full mt-1 px-3 py-2 rounded-lg bg-slate-800 border border-slate-600 text-slate-100 font-ui focus:border-amber-500 focus:outline-none cursor-pointer">
            {ARCHETYPES.map(a => <option key={a} value={a}>{ARCHETYPE_LABELS[a]}</option>)}
          </select>
        </div>
        <div>
          <label className="font-ui text-xs text-slate-500 uppercase font-bold tracking-wider">Shape</label>
          <select value={shape} onChange={e => setShape(e.target.value)}
            className="w-full mt-1 px-3 py-2 rounded-lg bg-slate-800 border border-slate-600 text-slate-100 font-ui focus:border-amber-500 focus:outline-none cursor-pointer">
            {SHAPES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="rounded-xl border border-slate-700 p-4 bg-slate-900/50">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-ui text-sm font-bold text-slate-300 uppercase tracking-wider">Stats</h4>
          <div className="flex items-center gap-3">
            <span className={`font-ui text-sm font-bold ${Math.abs(remaining) <= 5 ? 'text-emerald-400' : 'text-red-400'}`}>
              {remaining > 0 ? `${remaining} remaining` : remaining < 0 ? `${Math.abs(remaining)} over!` : 'Perfect!'}
            </span>
            <button onClick={handleApplyArchetype}
              className="px-3 py-1 rounded text-xs font-ui font-bold bg-slate-700 hover:bg-slate-600 text-slate-300 cursor-pointer transition-all">
              Apply {ARCHETYPE_LABELS[archetype]} Template
            </button>
          </div>
        </div>

        <div className="space-y-2">
          {STATS.map(stat => {
            const guide = ARCHETYPE_GUIDES[archetype]?.[stat] || 62
            const colors = getTypeColors(type)
            return (
              <div key={stat} className="flex items-center gap-3">
                <span className="w-10 font-ui text-xs text-slate-400 uppercase font-bold">{STAT_LABELS[stat]}</span>
                <input type="range" min={STAT_MIN} max={STAT_MAX} value={stats[stat]}
                  onChange={e => handleStatChange(stat, e.target.value)}
                  className="flex-1 h-2 rounded-full appearance-none cursor-pointer"
                  style={{ accentColor: colors.accent }} />
                <span className="w-8 text-right font-ui text-sm font-bold text-slate-200">{stats[stat]}</span>
                <span className="w-8 text-right font-ui text-xs text-slate-600">({guide})</span>
              </div>
            )
          })}
        </div>
        <p className="font-ui text-xs text-slate-600 mt-2">Budget: {STAT_BUDGET} total. Guide values shown in parentheses.</p>
      </div>

      {/* Move Pool */}
      <div className="rounded-xl border border-slate-700 p-4 bg-slate-900/50">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-ui text-sm font-bold text-slate-300 uppercase tracking-wider">Move Pool ({selectedMoves.length}/8)</h4>
        </div>

        {/* Selected moves */}
        {selectedMoves.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {selectedMoves.map((moveId, i) => {
              const move = MOVES[moveId]
              if (!move) return null
              const mc = getTypeColors(move.type)
              return (
                <button key={moveId} onClick={() => toggleMove(moveId)}
                  className="px-2 py-1 rounded text-xs font-ui font-bold cursor-pointer transition-all"
                  style={{ background: mc.dark + 'AA', color: mc.light, border: `1px solid ${mc.accent}50` }}>
                  {i + 1}. {move.name} &times;
                </button>
              )
            })}
          </div>
        )}

        {/* Available moves grid */}
        <div className="max-h-48 overflow-y-auto space-y-1">
          {allMoves.map(move => {
            const isSelected = selectedMoves.includes(move.id)
            const mc = getTypeColors(move.type)
            return (
              <button key={move.id} onClick={() => toggleMove(move.id)}
                disabled={!isSelected && selectedMoves.length >= 8}
                className={`w-full text-left px-2 py-1 rounded text-xs font-ui flex items-center justify-between cursor-pointer transition-all disabled:opacity-30 disabled:cursor-not-allowed ${
                  isSelected ? 'ring-1 ring-amber-400' : 'hover:bg-slate-800'
                }`}
                style={{ background: isSelected ? mc.dark + '40' : 'transparent' }}>
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ background: mc.accent }} />
                  <span style={{ color: isSelected ? mc.light : '#94a3b8' }}>{move.name}</span>
                  {move.type === type && <span className="text-amber-400 text-[9px]">STAB</span>}
                </span>
                <span className="text-slate-500">
                  {move.category === 'status' ? 'STATUS' : `PWR ${move.power}`} &middot; {move.type}
                </span>
              </button>
            )
          })}
        </div>
        <p className="font-ui text-xs text-slate-600 mt-2">
          Recommended: 2-3 same-type (STAB), 1 off-type, 1 normal, 3 status moves matching archetype.
        </p>
      </div>

      {/* Save */}
      <div className="flex gap-3 justify-end">
        <button onClick={onCancel}
          className="px-6 py-3 rounded-xl font-ui font-bold uppercase tracking-wider bg-slate-800 hover:bg-slate-700 text-slate-400 border border-slate-600/30 transition-all cursor-pointer">
          Cancel
        </button>
        <button onClick={handleSave} disabled={!isValid}
          className="px-6 py-3 rounded-xl font-ui font-bold uppercase tracking-wider bg-gradient-to-r from-amber-600 to-orange-500 hover:from-amber-500 hover:to-orange-400 border border-amber-400/30 transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed">
          {existingCreature ? 'Save Changes' : 'Create Creature'}
        </button>
      </div>

      {!isValid && (
        <p className="font-ui text-xs text-red-400 text-center">
          {name.trim().length < 2 ? 'Name must be at least 2 characters. ' : ''}
          {selectedMoves.length !== 8 ? `Select exactly 8 moves (have ${selectedMoves.length}). ` : ''}
          {Math.abs(remaining) > 5 ? `Stats must be within 5 of budget (${remaining > 0 ? remaining + ' remaining' : Math.abs(remaining) + ' over'}). ` : ''}
        </p>
      )}
    </div>
  )
}
