import { useState } from 'react'
import { TYPES, TYPE_COLORS } from '../data/types.js'

const EFFECTIVENESS_OPTIONS = [
  { value: 0, label: '0x', color: '#64748b', desc: 'Immune' },
  { value: 0.5, label: '0.5x', color: '#f56565', desc: 'Resists' },
  { value: 1, label: '1x', color: '#94a3b8', desc: 'Neutral' },
  { value: 2, label: '2x', color: '#48bb78', desc: 'Weak to' },
]

const COLOR_PALETTE = [
  { id: 'crimson', label: 'Crimson', accent: '#DC2626', light: '#FCA5A5', dark: '#7F1D1D', bg: '#991B1B', glow: '#FECACA' },
  { id: 'cyan', label: 'Cyan', accent: '#06B6D4', light: '#67E8F9', dark: '#164E63', bg: '#0E7490', glow: '#CFFAFE' },
  { id: 'pink', label: 'Pink', accent: '#EC4899', light: '#F9A8D4', dark: '#831843', bg: '#BE185D', glow: '#FCE7F3' },
  { id: 'lime', label: 'Lime', accent: '#84CC16', light: '#BEF264', dark: '#365314', bg: '#4D7C0F', glow: '#ECFCCB' },
  { id: 'indigo', label: 'Indigo', accent: '#6366F1', light: '#A5B4FC', dark: '#312E81', bg: '#4338CA', glow: '#E0E7FF' },
  { id: 'teal', label: 'Teal', accent: '#14B8A6', light: '#5EEAD4', dark: '#134E4A', bg: '#0F766E', glow: '#CCFBF1' },
  { id: 'orange', label: 'Orange', accent: '#F97316', light: '#FDBA74', dark: '#7C2D12', bg: '#C2410C', glow: '#FED7AA' },
  { id: 'rose', label: 'Rose', accent: '#F43F5E', light: '#FDA4AF', dark: '#881337', bg: '#BE123C', glow: '#FFE4E6' },
]

const BASE_TYPES = TYPES.filter(t => t !== 'normal')

function TypeEditor({ type, onSave, onCancel, existingTypes }) {
  const [name, setName] = useState(type?.name || '')
  const [colorId, setColorId] = useState(type?.colorId || COLOR_PALETTE[0].id)
  // What this type does TO others
  const [attackVs, setAttackVs] = useState(() => {
    const defaults = {}
    BASE_TYPES.forEach(t => { defaults[t] = type?.attackVs?.[t] ?? 1 })
    existingTypes.forEach(t => { defaults[t.id] = type?.attackVs?.[t.id] ?? 1 })
    defaults.normal = 1
    return defaults
  })
  // What others do TO this type
  const [defenseVs, setDefenseVs] = useState(() => {
    const defaults = {}
    BASE_TYPES.forEach(t => { defaults[t] = type?.defenseVs?.[t] ?? 1 })
    existingTypes.forEach(t => { defaults[t.id] = type?.defenseVs?.[t.id] ?? 1 })
    defaults.normal = 1
    return defaults
  })

  const selectedColor = COLOR_PALETTE.find(c => c.id === colorId) || COLOR_PALETTE[0]
  const allMatchupTypes = [...BASE_TYPES, ...existingTypes.filter(t => t.id !== type?.id).map(t => t.id)]

  const isValid = name.trim().length >= 2 && name.length <= 10

  const handleSave = () => {
    if (!isValid) return
    const id = type?.id || 'type_' + name.trim().toLowerCase().replace(/\s+/g, '_')
    onSave({
      id, name: name.trim(), colorId,
      colors: { ...selectedColor },
      attackVs: { ...attackVs },
      defenseVs: { ...defenseVs },
    })
  }

  const getColors = (t) => TYPE_COLORS[t] || existingTypes.find(ct => ct.id === t)?.colors || { accent: '#718096' }

  return (
    <div className="space-y-5 slide-up">
      <div className="flex items-center justify-between">
        <h3 className="font-game text-lg font-bold tracking-wider text-slate-100">
          {type ? 'EDIT TYPE' : 'NEW TYPE'}
        </h3>
        <button onClick={onCancel} className="font-ui text-sm text-slate-500 hover:text-slate-300 cursor-pointer">Cancel</button>
      </div>

      {/* Name */}
      <div>
        <label className="font-ui text-xs text-slate-500 uppercase font-bold tracking-wider">Type Name</label>
        <input value={name} onChange={e => setName(e.target.value.slice(0, 10))}
          className="w-full mt-1 px-3 py-2 rounded-lg bg-slate-800 border border-slate-600 text-slate-100 font-ui focus:border-amber-500 focus:outline-none"
          placeholder="e.g. Ice, Shadow, Light..." />
      </div>

      {/* Color */}
      <div>
        <label className="font-ui text-xs text-slate-500 uppercase font-bold tracking-wider mb-2 block">Color</label>
        <div className="flex flex-wrap gap-2">
          {COLOR_PALETTE.map(c => (
            <button key={c.id} onClick={() => setColorId(c.id)}
              className={`w-10 h-10 rounded-lg border-2 transition-all cursor-pointer ${colorId === c.id ? 'ring-2 ring-amber-400 ring-offset-2 ring-offset-slate-950 scale-110' : ''}`}
              style={{ background: c.accent, borderColor: colorId === c.id ? c.accent : c.dark }}
              title={c.label} />
          ))}
        </div>
      </div>

      {/* Matchup Chart */}
      <div className="rounded-xl border border-slate-700 p-4 bg-slate-900/50">
        <h4 className="font-ui text-sm font-bold text-slate-300 uppercase tracking-wider mb-3">Type Matchups</h4>

        {/* Offensive: this type attacking others */}
        <p className="font-ui text-xs text-slate-500 mb-2">
          <span style={{ color: selectedColor.accent }}>{name || '???'}</span> attacking others:
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
          {allMatchupTypes.map(t => {
            const tc = getColors(t)
            return (
              <div key={`atk-${t}`} className="flex items-center gap-2 px-2 py-1 rounded bg-slate-800/50">
                <span className="w-2 h-2 rounded-full" style={{ background: tc.accent }} />
                <span className="font-ui text-xs text-slate-400 flex-1">{t}</span>
                <select value={attackVs[t] ?? 1} onChange={e => setAttackVs(prev => ({ ...prev, [t]: Number(e.target.value) }))}
                  className="bg-slate-700 text-xs font-ui font-bold rounded px-1 py-0.5 cursor-pointer border-none focus:outline-none"
                  style={{ color: EFFECTIVENESS_OPTIONS.find(o => o.value === (attackVs[t] ?? 1))?.color }}>
                  {EFFECTIVENESS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            )
          })}
        </div>

        {/* Defensive: others attacking this type */}
        <p className="font-ui text-xs text-slate-500 mb-2">
          Others attacking <span style={{ color: selectedColor.accent }}>{name || '???'}</span>:
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {allMatchupTypes.map(t => {
            const tc = getColors(t)
            return (
              <div key={`def-${t}`} className="flex items-center gap-2 px-2 py-1 rounded bg-slate-800/50">
                <span className="w-2 h-2 rounded-full" style={{ background: tc.accent }} />
                <span className="font-ui text-xs text-slate-400 flex-1">{t}</span>
                <select value={defenseVs[t] ?? 1} onChange={e => setDefenseVs(prev => ({ ...prev, [t]: Number(e.target.value) }))}
                  className="bg-slate-700 text-xs font-ui font-bold rounded px-1 py-0.5 cursor-pointer border-none focus:outline-none"
                  style={{ color: EFFECTIVENESS_OPTIONS.find(o => o.value === (defenseVs[t] ?? 1))?.color }}>
                  {EFFECTIVENESS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            )
          })}
        </div>
      </div>

      {/* Save */}
      <div className="flex gap-3 justify-end">
        <button onClick={onCancel}
          className="px-6 py-3 rounded-xl font-ui font-bold uppercase tracking-wider bg-slate-800 hover:bg-slate-700 text-slate-400 border border-slate-600/30 transition-all cursor-pointer">
          Cancel
        </button>
        <button onClick={handleSave} disabled={!isValid}
          className="px-6 py-3 rounded-xl font-ui font-bold uppercase tracking-wider bg-gradient-to-r from-amber-600 to-orange-500 hover:from-amber-500 hover:to-orange-400 border border-amber-400/30 transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed">
          {type ? 'Save Type' : 'Create Type'}
        </button>
      </div>
    </div>
  )
}

export default function TypeCreator({ customTypes, maxTypes, onSave, onDelete }) {
  const [editing, setEditing] = useState(null) // null, 'new', or type id

  if (editing) {
    const existingType = editing !== 'new' ? customTypes.find(t => t.id === editing) : null
    return (
      <TypeEditor
        type={existingType}
        existingTypes={customTypes.filter(t => t.id !== editing)}
        onSave={(type) => { onSave(type); setEditing(null) }}
        onCancel={() => setEditing(null)}
      />
    )
  }

  return (
    <div className="space-y-4">
      {customTypes.map(type => {
        const colors = type.colors || COLOR_PALETTE[0]
        return (
          <div key={type.id} className="rounded-xl border p-4 flex items-center justify-between"
            style={{ borderColor: colors.accent + '40', background: `linear-gradient(135deg, ${colors.dark}20, transparent)` }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg" style={{ background: colors.accent }} />
              <div>
                <p className="font-ui font-bold" style={{ color: colors.light }}>{type.name}</p>
                <p className="font-ui text-xs text-slate-500">Custom Type</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setEditing(type.id)}
                className="px-3 py-1 rounded-lg text-xs font-ui font-bold uppercase bg-slate-700 hover:bg-slate-600 text-slate-300 transition-all cursor-pointer">
                Edit
              </button>
              <button onClick={() => onDelete(type.id)}
                className="px-3 py-1 rounded-lg text-xs font-ui font-bold uppercase bg-red-900/30 hover:bg-red-800/50 text-red-400 transition-all cursor-pointer">
                Delete
              </button>
            </div>
          </div>
        )
      })}

      {customTypes.length < maxTypes && (
        <button onClick={() => setEditing('new')}
          className="w-full py-4 rounded-xl border-2 border-dashed border-slate-600 hover:border-amber-500/50 text-slate-500 hover:text-amber-400 font-ui font-bold uppercase tracking-wider transition-all cursor-pointer">
          + Create New Type
        </button>
      )}
    </div>
  )
}
