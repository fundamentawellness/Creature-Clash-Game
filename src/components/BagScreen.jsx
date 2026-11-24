import { ITEMS } from '../data/items.js'
import { getAllCreatures } from '../utils/customData.js'

export default function BagScreen({ gameState, onUpdateGameState, onBack }) {
  const bag = gameState?.bag || {}
  const creatures = getAllCreatures(gameState)
  const team = (gameState?.lastTeam || []).map(id => creatures[id]).filter(Boolean)
  const entries = Object.entries(bag).filter(([, count]) => count > 0)

  const giveHeld = (itemId, creatureId) => {
    onUpdateGameState(prev => {
      const progress = { ...prev.creatureProgress }
      const current = { ...(progress[creatureId] || {}) }
      const previous = current.heldItem
      const nextBag = { ...(prev.bag || {}) }
      nextBag[itemId] = (nextBag[itemId] || 0) - 1
      if (nextBag[itemId] <= 0) delete nextBag[itemId]
      if (previous) nextBag[previous] = (nextBag[previous] || 0) + 1
      current.heldItem = itemId
      progress[creatureId] = current
      return { ...prev, bag: nextBag, creatureProgress: progress }
    })
  }

  const clearHeld = (creatureId) => {
    onUpdateGameState(prev => {
      const progress = { ...prev.creatureProgress }
      const current = { ...(progress[creatureId] || {}) }
      if (!current.heldItem) return prev
      const nextBag = { ...(prev.bag || {}) }
      nextBag[current.heldItem] = (nextBag[current.heldItem] || 0) + 1
      current.heldItem = null
      progress[creatureId] = current
      return { ...prev, bag: nextBag, creatureProgress: progress }
    })
  }

  return (
    <div className="flex-1 flex flex-col max-w-3xl mx-auto w-full px-4 py-4">
      <div className="flex items-center justify-between mb-4">
        <button type="button" onClick={onBack} className="font-ui font-bold text-slate-300 uppercase tracking-wider text-sm px-2 cursor-pointer">← Back</button>
        <h2 className="font-game text-xl font-bold text-slate-100">BAG</h2>
        <div className="w-16" />
      </div>
      <p className="font-ui text-base text-slate-400 mb-4 text-center">Healing items are used in battle. Held items stay on a creature.</p>

      {entries.length === 0 && (
        <p className="font-ui text-center text-slate-500 py-8">The bag is empty. Win battles to find more.</p>
      )}

      <div className="space-y-3 overflow-y-auto pb-6">
        {entries.map(([id, count]) => {
          const item = ITEMS[id]
          if (!item) return null
          return (
            <div key={id} className="rounded-2xl border border-slate-700 bg-slate-900/70 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-ui text-lg font-bold text-slate-100">{item.name} <span className="text-amber-300">×{count}</span></p>
                  <p className="font-ui text-base text-slate-400">{item.desc}</p>
                </div>
                <span className="font-ui text-xs uppercase tracking-wider text-slate-500">{item.kind === 'held' ? 'Hold' : 'Battle'}</span>
              </div>
              {item.kind === 'held' && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {team.map(creature => (
                    <button
                      key={creature.id}
                      type="button"
                      onClick={() => giveHeld(id, creature.id)}
                      className="rounded-xl px-3 py-2 font-ui font-bold text-sm bg-slate-800 text-slate-200 cursor-pointer active:bg-slate-700"
                    >
                      Give to {creature.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )
        })}

        {team.some(creature => gameState.creatureProgress?.[creature.id]?.heldItem) && (
          <div className="rounded-2xl border border-slate-700 p-4">
            <p className="font-ui text-sm font-bold uppercase text-slate-500 mb-2">Being held</p>
            {team.map(creature => {
              const held = gameState.creatureProgress?.[creature.id]?.heldItem
              if (!held) return null
              return (
                <div key={creature.id} className="flex items-center justify-between gap-2 py-1">
                  <p className="font-ui text-base text-slate-200">{creature.name}: {ITEMS[held]?.name || held}</p>
                  <button type="button" onClick={() => clearHeld(creature.id)} className="font-ui font-bold text-sm text-slate-300 px-3 cursor-pointer">Take off</button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
