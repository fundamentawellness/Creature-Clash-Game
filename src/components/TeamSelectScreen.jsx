import { useState, useMemo } from 'react'
import { CREATURES, CREATURE_LIST } from '../data/creatures.js'
import { MOVES } from '../data/moves.js'
import { TYPE_COLORS, TYPE_EMOJIS } from '../data/types.js'
import { getAllCreatures, getAllCreatureList, getFullTypeColors } from '../utils/customData.js'
import CreatureSprite from './CreatureSprite.jsx'

const STAT_LABELS = { hp: 'HP', atk: 'ATK', def: 'DEF', spd: 'SPD', spc: 'SPC' }
const MAX_STAT = 95 // For bar scaling

function StatBar({ label, value, type }) {
  const pct = Math.min(100, (value / MAX_STAT) * 100)
  const color = TYPE_COLORS[type]?.accent || '#94a3b8'

  return (
    <div className="flex items-center gap-2 text-xs font-ui">
      <span className="w-8 text-slate-400 uppercase font-semibold">{label}</span>
      <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full bar-fill"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      <span className="w-7 text-right text-slate-300 font-bold">{value}</span>
    </div>
  )
}

function TypeBadge({ type }) {
  const colors = TYPE_COLORS[type]
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-ui font-bold uppercase tracking-wider"
      style={{
        background: colors?.dark + 'CC',
        color: colors?.light,
        border: `1px solid ${colors?.accent}50`,
      }}
    >
      {TYPE_EMOJIS[type]} {type}
    </span>
  )
}

function MoveCard({ moveId, creatureType }) {
  const move = MOVES[moveId]
  if (!move) return null

  const moveColor = TYPE_COLORS[move.type]
  const isStab = move.type === creatureType

  return (
    <div
      className="flex items-center justify-between px-2 py-1 rounded text-xs font-ui"
      style={{ background: moveColor?.dark + '30', border: `1px solid ${moveColor?.accent}20` }}
    >
      <div className="flex items-center gap-1.5">
        <span style={{ color: moveColor?.light }} className="font-bold">{move.name}</span>
        {isStab && <span className="text-amber-400 text-[10px]">STAB</span>}
      </div>
      <div className="flex items-center gap-2 text-slate-400">
        {move.category !== 'status' ? (
          <>
            <span>PWR {move.power}</span>
            <span>ACC {move.accuracy}%</span>
          </>
        ) : (
          <span className="text-purple-400">STATUS</span>
        )}
        <span className="uppercase text-[10px] text-slate-500">{move.category.slice(0, 4)}</span>
      </div>
    </div>
  )
}

function CreatureCard({ creatureId, progress, isUnlocked, isSelected, isExpanded, onToggleExpand, onToggleSelect, creaturesMap }) {
  const template = (creaturesMap || CREATURES)[creatureId]
  if (!template) return null

  const colors = TYPE_COLORS[template.type]
  const level = progress?.level || 1
  const currentMoves = progress?.currentMoves || [template.movePool[0], template.movePool[1]]

  // Apply level bonus to stats for display
  const displayStats = {}
  for (const [stat, base] of Object.entries(template.baseStats)) {
    displayStats[stat] = base + (level - 1) * 2
  }

  if (!isUnlocked) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 opacity-50">
        <div className="flex items-center gap-3">
          <CreatureSprite
            creatureId={creatureId}
            creatureType={template.type}
            creatureName={template.name}
            size={48}
            locked={true}
          />
          <div>
            <p className="font-ui font-bold text-slate-600 text-lg">???</p>
            <p className="font-ui text-xs text-slate-700 uppercase">Locked</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className={`rounded-xl border-2 transition-all cursor-pointer card-hover ${
        isSelected ? 'ring-2 ring-offset-2 ring-offset-slate-950' : ''
      }`}
      style={{
        borderColor: isSelected ? colors.accent : colors.dark + '60',
        background: isSelected
          ? `linear-gradient(135deg, ${colors.dark}30, ${colors.bg}20)`
          : `linear-gradient(135deg, ${colors.dark}15, transparent)`,
        boxShadow: isSelected ? `0 0 24px ${colors.accent}30` : 'none',
        ringColor: colors.accent,
      }}
      onClick={() => onToggleExpand(creatureId)}
    >
      {/* Header */}
      <div className="p-3 pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <CreatureSprite
              creatureId={creatureId}
              creatureType={template.type}
              creatureName={template.name}
              size={48}
              locked={!isUnlocked}
            />
            <div>
              <p className="font-ui font-bold text-lg leading-tight" style={{ color: colors.light }}>
                {template.name}
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                <TypeBadge type={template.type} />
                <span className="text-xs font-ui text-slate-500 uppercase">{template.archetype.replace('_', ' ')}</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className="font-ui font-bold text-sm text-slate-400">
              LV {level}
            </span>
            <button
              onClick={(e) => { e.stopPropagation(); onToggleSelect(creatureId) }}
              className={`px-3 py-1 rounded-lg text-xs font-ui font-bold uppercase tracking-wider transition-all ${
                isSelected
                  ? 'text-white'
                  : 'bg-slate-700 hover:bg-slate-600 text-slate-300 border border-slate-600'
              }`}
              style={isSelected ? {
                background: colors.accent,
                boxShadow: `0 0 12px ${colors.accent}40`,
              } : {}}
            >
              {isSelected ? 'Selected' : 'Select'}
            </button>
          </div>
        </div>

        {/* Mini stat bars (always visible) */}
        <div className="mt-2 space-y-0.5">
          {Object.entries(STAT_LABELS).map(([stat, label]) => (
            <StatBar key={stat} label={label} value={displayStats[stat]} type={template.type} />
          ))}
        </div>
      </div>

      {/* Expanded: moves */}
      {isExpanded && (
        <div className="px-3 pb-3 pt-1 border-t fade-in" style={{ borderColor: colors.dark + '40' }}>
          <p className="font-ui text-xs text-slate-500 uppercase font-bold mb-1.5 tracking-wider">
            Moves ({currentMoves.length}/4)
          </p>
          <div className="space-y-1">
            {currentMoves.map(moveId => (
              <MoveCard key={moveId} moveId={moveId} creatureType={template.type} />
            ))}
          </div>
          <p className="text-xs text-slate-600 font-ui mt-2 italic">
            {template.desc} — {progress?.wins || 0} wins
          </p>
        </div>
      )}
    </div>
  )
}

export default function TeamSelectScreen({ gameState, lastTeam, teamSize = 3, onConfirm, onBack, onUpdateGameState }) {
  const maxTeam = teamSize || 3
  const [selected, setSelected] = useState(() => {
    // Pre-select last team if valid
    if (lastTeam?.length >= 1 && lastTeam.length <= maxTeam && lastTeam.every(id => gameState?.unlockedCreatureIds?.includes(id))) {
      return [...lastTeam]
    }
    return []
  })
  const [expandedId, setExpandedId] = useState(null)
  const [showSaveInput, setShowSaveInput] = useState(false)
  const [presetName, setPresetName] = useState('')
  const [presetWarning, setPresetWarning] = useState(null)

  const presetsUnlocked = gameState?.rewards?.teamPresets === true
  const presets = gameState?.teamPresets || []
  const MAX_PRESETS = 5

  const unlocked = useMemo(() => new Set(gameState?.unlockedCreatureIds || []), [gameState])

  // Sort: unlocked first (by type), locked last
  const allCreaturesList = useMemo(() => getAllCreatureList(gameState), [gameState])
  const allCreaturesMap = useMemo(() => getAllCreatures(gameState), [gameState])

  const sortedCreatures = useMemo(() => {
    const all = allCreaturesList.map(c => c.id)
    const unlockedList = all.filter(id => unlocked.has(id))
    const lockedList = all.filter(id => !unlocked.has(id))
    return [...unlockedList, ...lockedList]
  }, [unlocked, allCreaturesList])

  const handleToggleSelect = (id) => {
    setSelected(prev => {
      if (prev.includes(id)) {
        return prev.filter(x => x !== id)
      }
      if (prev.length >= maxTeam) return prev
      return [...prev, id]
    })
  }

  const handleToggleExpand = (id) => {
    setExpandedId(prev => prev === id ? null : id)
  }

  const handleSavePreset = () => {
    const name = presetName.trim()
    if (!name || selected.length !== maxTeam) return
    if (onUpdateGameState) {
      onUpdateGameState(prev => {
        const existing = prev.teamPresets || []
        if (existing.length >= MAX_PRESETS) return prev
        // Don't allow duplicate names
        if (existing.some(p => p.name === name)) return prev
        return { ...prev, teamPresets: [...existing, { name, creatureIds: [...selected] }] }
      })
    }
    setPresetName('')
    setShowSaveInput(false)
  }

  const handleLoadPreset = (preset) => {
    setPresetWarning(null)
    const validIds = preset.creatureIds.filter(id => unlocked.has(id))
    if (validIds.length < preset.creatureIds.length) {
      setPresetWarning(`"${preset.name}" has ${preset.creatureIds.length - validIds.length} invalid creature(s) — skipped.`)
    }
    setSelected(validIds.slice(0, maxTeam))
  }

  const handleDeletePreset = (name) => {
    if (onUpdateGameState) {
      onUpdateGameState(prev => ({
        ...prev,
        teamPresets: (prev.teamPresets || []).filter(p => p.name !== name),
      }))
    }
  }

  return (
    <div className="flex-1 flex flex-col max-w-5xl mx-auto w-full px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onBack}
          className="font-ui font-bold text-slate-400 hover:text-slate-200 uppercase tracking-wider text-sm transition-colors cursor-pointer"
        >
          &larr; Back
        </button>
        <h2 className="font-game text-2xl md:text-3xl font-bold tracking-wider text-slate-100">
          SELECT TEAM
        </h2>
        <div className="w-16" /> {/* Spacer */}
      </div>

      {/* Team preview slots */}
      <div className="flex gap-3 justify-center mb-6">
        {Array.from({ length: maxTeam }, (_, i) => i).map(slot => {
          const id = selected[slot]
          const template = id ? (allCreaturesMap[id] || CREATURES[id]) : null
          const colors = template ? TYPE_COLORS[template.type] : null

          return (
            <div
              key={slot}
              className="w-28 h-20 rounded-xl border-2 border-dashed flex flex-col items-center justify-center transition-all"
              style={{
                borderColor: colors ? colors.accent + '80' : '#334155',
                background: colors ? colors.dark + '20' : 'transparent',
                boxShadow: colors ? `0 0 16px ${colors.accent}20` : 'none',
              }}
            >
              {template ? (
                <>
                  <CreatureSprite
                    creatureId={id}
                    creatureType={template.type}
                    creatureName={template.name}
                    size={48}
                  />
                  <span className="font-ui text-xs font-bold mt-0.5" style={{ color: colors.light }}>
                    {template.name}
                  </span>
                </>
              ) : (
                <span className="text-slate-600 font-ui text-xs uppercase">Slot {slot + 1}</span>
              )}
            </div>
          )
        })}
      </div>

      {/* Saved Teams presets */}
      {presetsUnlocked && (
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-ui text-xs text-slate-500 uppercase font-bold tracking-wider">Saved Teams</span>
            <span className="font-ui text-[10px] text-slate-600">({presets.length}/{MAX_PRESETS})</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {presets.map(preset => (
              <div key={preset.name} className="flex items-center gap-0 group">
                <button
                  onClick={() => handleLoadPreset(preset)}
                  className="px-3 py-1.5 rounded-l-lg text-xs font-ui font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-600/50 border-r-0 transition-all cursor-pointer"
                >
                  {preset.name}
                  <span className="ml-1.5 text-slate-500 font-normal">({preset.creatureIds.length})</span>
                </button>
                <button
                  onClick={() => handleDeletePreset(preset.name)}
                  className="px-1.5 py-1.5 rounded-r-lg text-xs font-ui font-bold bg-slate-800 hover:bg-red-900/50 text-slate-600 hover:text-red-400 border border-slate-600/50 border-l-0 transition-all cursor-pointer"
                >
                  ✕
                </button>
              </div>
            ))}
            {presets.length === 0 && (
              <span className="text-xs font-ui text-slate-600 italic">No saved teams yet</span>
            )}
          </div>
          {presetWarning && (
            <p className="font-ui text-xs text-amber-400 mt-1">{presetWarning}</p>
          )}
        </div>
      )}

      {/* Creature grid */}
      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {sortedCreatures.map(id => (
            <CreatureCard
              key={id}
              creatureId={id}
              progress={gameState?.creatureProgress?.[id]}
              isUnlocked={unlocked.has(id)}
              isSelected={selected.includes(id)}
              isExpanded={expandedId === id}
              onToggleExpand={handleToggleExpand}
              onToggleSelect={handleToggleSelect}
              creaturesMap={allCreaturesMap}
            />
          ))}
        </div>
      </div>

      {/* Enter Battle + Save Team buttons */}
      <div className="mt-6 flex justify-center items-center gap-3">
        {presetsUnlocked && selected.length === maxTeam && !showSaveInput && presets.length < MAX_PRESETS && (
          <button
            onClick={() => { setShowSaveInput(true); setPresetName('') }}
            className="px-5 py-4 rounded-xl font-ui text-sm font-bold uppercase tracking-wider
              transition-all cursor-pointer
              bg-slate-800 hover:bg-slate-700
              border border-slate-600/50 hover:border-slate-500
              text-slate-400 hover:text-slate-200"
          >
            Save Team
          </button>
        )}
        {showSaveInput && (
          <div className="flex items-center gap-2">
            <input
              value={presetName}
              onChange={e => setPresetName(e.target.value.slice(0, 12))}
              placeholder="Preset name..."
              autoFocus
              onKeyDown={e => { if (e.key === 'Enter') handleSavePreset(); if (e.key === 'Escape') setShowSaveInput(false) }}
              className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-600 text-slate-100 font-ui text-sm focus:border-amber-500 focus:outline-none w-36"
            />
            <button
              onClick={handleSavePreset}
              disabled={!presetName.trim()}
              className="px-3 py-2 rounded-lg text-xs font-ui font-bold bg-emerald-700/60 hover:bg-emerald-600/80 text-emerald-200 border border-emerald-500/30 transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Save
            </button>
            <button
              onClick={() => setShowSaveInput(false)}
              className="px-3 py-2 rounded-lg text-xs font-ui font-bold bg-slate-800 hover:bg-slate-700 text-slate-400 border border-slate-600/30 transition-all cursor-pointer"
            >
              Cancel
            </button>
          </div>
        )}
        <button
          onClick={() => onConfirm(selected)}
          disabled={selected.length !== maxTeam}
          className="px-10 py-4 rounded-xl font-game text-xl font-bold uppercase tracking-wider
            transition-all cursor-pointer
            disabled:opacity-30 disabled:cursor-not-allowed
            bg-gradient-to-r from-amber-600 to-orange-500 hover:from-amber-500 hover:to-orange-400
            border border-amber-400/30 hover:border-amber-400/60
            shadow-lg shadow-amber-900/30 hover:shadow-amber-800/50"
        >
          {selected.length === maxTeam ? 'Enter Battle' : `Select ${maxTeam - selected.length} more`}
        </button>
      </div>
    </div>
  )
}
