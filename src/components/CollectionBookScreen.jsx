import { CREATURE_LIST } from '../data/creatures.js'
import { getAbility } from '../data/abilities.js'
import CreatureSprite from './CreatureSprite.jsx'

export default function CollectionBookScreen({ gameState, onBack }) {
  const seen = new Set(gameState?.seenIds || [])
  const caught = new Set(gameState?.caughtIds || gameState?.unlockedCreatureIds || [])
  const lines = CREATURE_LIST.filter(creature => !creature.prevolution && !creature.isCustom)
  const caughtCount = lines.filter(creature => {
    const stages = [creature, ...(creature.evolutions || []).map(stage => CREATURE_LIST.find(entry => entry.id === stage.id)).filter(Boolean)]
    return stages.some(stage => caught.has(stage.id))
  }).length

  return (
    <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full px-3 sm:px-4 py-4">
      <div className="flex items-center justify-between mb-3">
        <button type="button" onClick={onBack} className="font-ui font-bold text-slate-300 uppercase text-sm px-2 cursor-pointer">Map</button>
        <h2 className="font-game text-xl font-bold text-slate-100">COLLECTION</h2>
        <p className="font-ui text-sm text-cyan-200">{caughtCount}/{lines.length}</p>
      </div>
      <p className="font-ui text-center text-slate-400 mb-4">Caught creatures are bright. Seen ones are dim. The rest are still a mystery.</p>
      <div className="flex-1 overflow-y-auto space-y-3 pb-6">
        {lines.map(base => {
          const stages = [
            base,
            ...(base.evolutions || []).map(stage => CREATURE_LIST.find(entry => entry.id === stage.id)).filter(Boolean),
          ]
          return (
            <div key={base.id} className="rounded-2xl border border-slate-700 bg-slate-900/60 p-3">
              <div className="flex gap-2 overflow-x-auto">
                {stages.map(stage => {
                  const isCaught = caught.has(stage.id)
                  const isSeen = seen.has(stage.id) || isCaught
                  return (
                    <div key={stage.id} className="min-w-24 flex flex-col items-center">
                      {isSeen ? (
                        <CreatureSprite
                          creatureId={stage.spriteId || stage.id}
                          spriteId={stage.spriteId}
                          creatureName={stage.name}
                          creatureType={stage.type}
                          size={72}
                          style={isCaught ? undefined : { filter: 'grayscale(1) brightness(0.6)' }}
                        />
                      ) : (
                        <div className="w-[72px] h-[72px] rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-game text-2xl text-slate-600">?</div>
                      )}
                      <p className="font-ui text-sm text-center text-slate-200 mt-1">{isSeen ? stage.name : '???'}</p>
                      <p className="font-ui text-xs text-slate-500">{isCaught ? 'Caught' : isSeen ? 'Seen' : 'Unknown'}</p>
                    </div>
                  )
                })}
              </div>
              {caught.has(base.id) && getAbility(base.ability) && (
                <p className="font-ui text-sm text-slate-400 mt-2">{getAbility(base.ability).name}: {getAbility(base.ability).desc}</p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
