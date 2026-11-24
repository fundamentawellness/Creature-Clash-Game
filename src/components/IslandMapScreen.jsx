import { ISLANDS } from '../data/islands.js'
import { canReachIsland, travelHint, boatCount, hasFerryCreature } from '../systems/world.js'
import { getBadgeCount } from '../systems/campaignManager.js'
import { ALL_GYMS } from '../data/campaign.js'

export default function IslandMapScreen({ gameState, onOpenIsland, onBook, onBag, onTeam, onBadges, onMenu }) {
  const badges = getBadgeCount(gameState?.campaign || {})
  const coins = gameState?.coins || 0

  return (
    <div className="flex-1 flex flex-col w-full max-w-5xl mx-auto px-3 sm:px-4 py-4">
      <div className="flex items-center justify-between gap-2 mb-3">
        <button type="button" onClick={onMenu} className="font-ui font-bold text-slate-300 uppercase text-sm px-2 cursor-pointer">Menu</button>
        <div className="text-center">
          <h2 className="font-game text-xl sm:text-2xl font-bold text-slate-100">ISLANDS</h2>
          <p className="font-ui text-sm text-slate-400">{gameState?.campaign?.playerName} · {coins} coins · {badges}/{ALL_GYMS.length} badges</p>
        </div>
        <div className="w-12" />
      </div>

      <div className="flex flex-wrap gap-2 justify-center mb-4">
        <button type="button" onClick={onBook} className="px-4 py-2 rounded-xl font-ui font-bold uppercase text-sm bg-slate-800 text-cyan-200 border border-cyan-800/40 cursor-pointer">Book</button>
        <button type="button" onClick={onBag} className="px-4 py-2 rounded-xl font-ui font-bold uppercase text-sm bg-slate-800 text-amber-200 border border-amber-800/40 cursor-pointer">Bag</button>
        <button type="button" onClick={onTeam} className="px-4 py-2 rounded-xl font-ui font-bold uppercase text-sm bg-slate-800 text-slate-200 border border-slate-600 cursor-pointer">Team</button>
        <button type="button" onClick={onBadges} className="px-4 py-2 rounded-xl font-ui font-bold uppercase text-sm bg-slate-800 text-amber-300 border border-amber-800/30 cursor-pointer">Badges</button>
      </div>

      <p className="font-ui text-center text-slate-400 mb-3 text-sm">
        {hasFerryCreature(gameState)
          ? `Skiffs earned: ${boatCount(gameState?.campaign)}. A water creature can swim one extra channel.`
          : `Skiffs earned: ${boatCount(gameState?.campaign)}. Beat the first gym, or train a water creature to level 10.`}
      </p>

      <div className="flex-1 overflow-y-auto rounded-3xl border border-sky-900/60 bg-gradient-to-b from-sky-950 via-cyan-950 to-slate-950 p-3 sm:p-6">
        <div className="flex flex-col lg:flex-row lg:items-stretch gap-3 lg:gap-4">
          {ISLANDS.map((island, index) => {
            const open = canReachIsland(gameState, index)
            const locked = island.charted && !open
            return (
              <button
                key={island.id}
                type="button"
                onClick={() => open && onOpenIsland(island.id)}
                disabled={!open}
                className={`flex-1 min-h-28 rounded-2xl border px-4 py-4 text-left cursor-pointer disabled:cursor-not-allowed ${
                  open ? 'bg-slate-900/80 border-slate-500 active:brightness-125' : 'bg-slate-950/50 border-slate-800'
                }`}
                style={open ? { boxShadow: `inset 0 0 0 2px ${island.color}66` } : undefined}
              >
                <p className="font-ui text-xs uppercase tracking-wider" style={{ color: island.color }}>{island.theme}</p>
                <p className={`font-game text-xl font-bold mt-1 ${open ? 'text-slate-100' : 'text-slate-500'}`}>{island.charted ? island.name : '??? '}</p>
                <p className="font-ui text-sm text-slate-400 mt-1">
                  {open ? island.blurb : island.charted ? travelHint(gameState, index) : 'Hidden in fog.'}
                </p>
                <p className="font-ui text-sm mt-2" style={{ color: open ? island.color : '#64748b' }}>
                  {open ? 'Land here' : locked ? 'Locked' : 'Fog'}
                </p>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
