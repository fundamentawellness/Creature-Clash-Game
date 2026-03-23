import { ZONES, ALL_GYMS } from '../data/campaign.js'

export default function BadgeCollectionScreen({ gameState, onBack }) {
  const campaign = gameState?.campaign || {}
  const badges = campaign.badges || []
  const earnedIds = new Set(badges.map(b => b.gymId))

  return (
    <div className="flex-1 flex flex-col max-w-3xl mx-auto w-full px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <button onClick={onBack} className="font-ui font-bold text-slate-400 hover:text-slate-200 uppercase tracking-wider text-sm transition-colors cursor-pointer">
          &larr; Back
        </button>
        <h2 className="font-game text-2xl font-bold tracking-wider text-slate-100">BADGE COLLECTION</h2>
        <div className="w-16" />
      </div>

      <p className="font-ui text-center text-slate-500 mb-6">
        {badges.length} / {ALL_GYMS.length} Badges Earned
      </p>

      {ZONES.map(zone => (
        <div key={zone.id} className="mb-6">
          <h3 className="font-game text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">
            {zone.name}
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {zone.gyms.map(gym => {
              const earned = earnedIds.has(gym.id)
              const badge = badges.find(b => b.gymId === gym.id)
              return (
                <div key={gym.id}
                  className={`rounded-xl border p-4 text-center transition-all ${
                    earned
                      ? 'border-amber-500/40 bg-amber-900/10'
                      : 'border-slate-700/40 bg-slate-800/30 opacity-40'
                  }`}>
                  <div className="text-3xl mb-2">{earned ? gym.badge.icon : '🔒'}</div>
                  <p className={`font-ui text-sm font-bold ${earned ? 'text-amber-300' : 'text-slate-600'}`}>
                    {earned ? gym.badge.name : '???'}
                  </p>
                  {earned && (
                    <p className="font-ui text-xs text-slate-500 mt-1">
                      Leader: {gym.leader.name}
                    </p>
                  )}
                </div>
              )
            })}
          </div>

          {/* Rival trophy */}
          {(() => {
            const rivalBeaten = campaign.completedRivals?.includes(zone.rival.id)
            return (
              <div className={`mt-3 rounded-xl border p-3 flex items-center gap-3 ${
                rivalBeaten ? 'border-red-500/40 bg-red-900/10' : 'border-slate-700/30 bg-slate-800/20 opacity-40'
              }`}>
                <div className="text-2xl">{rivalBeaten ? '🏆' : '🔒'}</div>
                <div>
                  <p className={`font-ui text-sm font-bold ${rivalBeaten ? 'text-red-300' : 'text-slate-600'}`}>
                    {rivalBeaten ? `${zone.name} Rival Defeated` : 'Rival Locked'}
                  </p>
                  {rivalBeaten && (
                    <p className="font-ui text-xs text-slate-500">{zone.rival.rewardTitle}</p>
                  )}
                </div>
              </div>
            )
          })()}
        </div>
      ))}
    </div>
  )
}
