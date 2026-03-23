const DIFFICULTIES = [
  {
    id: 'easy',
    label: 'Easy',
    desc: 'AI picks moves semi-randomly. Never switches. Good for learning.',
    color: '#22c55e',
    gradient: 'from-emerald-700 to-emerald-600',
    hoverGradient: 'from-emerald-600 to-emerald-500',
    borderColor: 'border-emerald-500/30',
    shadowColor: 'shadow-emerald-900/30',
    totalBattles: 5,
    unlockKey: null, // Always available
  },
  {
    id: 'medium',
    label: 'Medium',
    desc: 'AI picks smart moves 75% of the time. Will switch at type disadvantage.',
    color: '#f97316',
    gradient: 'from-orange-700 to-orange-600',
    hoverGradient: 'from-orange-600 to-orange-500',
    borderColor: 'border-orange-500/30',
    shadowColor: 'shadow-orange-900/30',
    totalBattles: 7,
    unlockKey: 'easyCleared',
  },
  {
    id: 'hard',
    label: 'Hard',
    desc: 'AI always picks optimal moves. Switches strategically. Optimized teams.',
    color: '#ef4444',
    gradient: 'from-red-700 to-red-600',
    hoverGradient: 'from-red-600 to-red-500',
    borderColor: 'border-red-500/30',
    shadowColor: 'shadow-red-900/30',
    totalBattles: 10,
    unlockKey: 'mediumCleared',
  },
]

export default function DifficultySelectScreen({ gameState, onSelect, onBack }) {
  const battlesWon = gameState?.battlesWon || { easy: 0, medium: 0, hard: 0 }
  const difficulty = gameState?.difficulty || { easyCleared: false, mediumCleared: false, hardCleared: false }

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-8 max-w-2xl mx-auto w-full">
      {/* Header */}
      <div className="w-full flex items-center justify-between mb-10">
        <button
          onClick={onBack}
          className="font-ui font-bold text-slate-400 hover:text-slate-200 uppercase tracking-wider text-sm transition-colors cursor-pointer"
        >
          &larr; Back
        </button>
        <h2 className="font-game text-2xl md:text-3xl font-bold tracking-wider text-slate-100">
          DIFFICULTY
        </h2>
        <div className="w-16" />
      </div>

      {/* Difficulty cards */}
      <div className="w-full space-y-4">
        {DIFFICULTIES.map((diff) => {
          const isLocked = diff.unlockKey && !difficulty[diff.unlockKey]
          const won = battlesWon[diff.id] || 0
          const total = diff.totalBattles
          const isCleared = won >= total
          const progressPct = Math.min(100, (won / total) * 100)

          return (
            <button
              key={diff.id}
              onClick={() => !isLocked && onSelect(diff.id)}
              disabled={isLocked}
              className={`w-full text-left rounded-xl border-2 p-5 transition-all cursor-pointer
                disabled:opacity-40 disabled:cursor-not-allowed
                bg-gradient-to-r ${isLocked ? 'from-slate-800 to-slate-800' : diff.gradient}
                hover:${diff.hoverGradient}
                ${diff.borderColor} ${diff.shadowColor} shadow-lg`}
              style={{
                borderColor: isLocked ? '#334155' : diff.color + '40',
              }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <h3
                      className="font-game text-2xl font-bold tracking-wider"
                      style={{ color: isLocked ? '#475569' : diff.color }}
                    >
                      {diff.label}
                    </h3>
                    {isCleared && (
                      <span className="text-xs font-ui font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                        Cleared
                      </span>
                    )}
                    {isLocked && (
                      <span className="text-xs font-ui font-bold uppercase tracking-wider text-slate-600">
                        Locked
                      </span>
                    )}
                  </div>
                  <p className="font-ui text-sm mt-1" style={{ color: isLocked ? '#475569' : '#94a3b8' }}>
                    {isLocked ? 'Clear previous difficulty to unlock' : diff.desc}
                  </p>
                </div>
                <div className="text-right ml-4">
                  <span
                    className="font-ui font-bold text-lg"
                    style={{ color: isLocked ? '#475569' : diff.color }}
                  >
                    {won}/{total}
                  </span>
                  <p className="font-ui text-xs text-slate-500 uppercase">Wins</p>
                </div>
              </div>

              {/* Progress bar */}
              {!isLocked && (
                <div className="mt-3 h-2 bg-black/30 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${progressPct}%`,
                      background: diff.color,
                      boxShadow: `0 0 8px ${diff.color}60`,
                    }}
                  />
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
