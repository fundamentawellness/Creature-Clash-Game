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

export default function TeamSelectScreen({ gameState, lastTeam, onConfirm, onBack }) {
  const [selected, setSelected] = useState(() => {
    // Pre-select last team if valid
    if (lastTeam?.length === 3 && lastTeam.every(id => gameState?.unlockedCreatureIds?.includes(id))) {
      return [...lastTeam]
    }
    return []
  })
  const [expandedId, setExpandedId] = useState(null)

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
      if (prev.length >= 3) return prev
      return [...prev, id]
    })
  }

  const handleToggleExpand = (id) => {
    setExpandedId(prev => prev === id ? null : id)
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
        {[0, 1, 2].map(slot => {
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

      {/* Enter Battle button */}
      <div className="mt-6 flex justify-center">
        <button
          onClick={() => onConfirm(selected)}
          disabled={selected.length !== 3}
          className="px-10 py-4 rounded-xl font-game text-xl font-bold uppercase tracking-wider
            transition-all cursor-pointer
            disabled:opacity-30 disabled:cursor-not-allowed
            bg-gradient-to-r from-amber-600 to-orange-500 hover:from-amber-500 hover:to-orange-400
            border border-amber-400/30 hover:border-amber-400/60
            shadow-lg shadow-amber-900/30 hover:shadow-amber-800/50"
        >
          {selected.length === 3 ? 'Enter Battle' : `Select ${3 - selected.length} more`}
        </button>
      </div>
    </div>
  )
}
