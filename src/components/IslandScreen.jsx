import { useState } from 'react'
import { getZoneById } from '../data/campaign.js'
import { islandById, SHOP } from '../data/islands.js'
import { ITEMS } from '../data/items.js'
import { rollWild } from '../systems/world.js'
import { isGymUnlocked, isRivalUnlocked, getNextGymBattle, getGymProgress, buildGymBattleInfo } from '../systems/campaignManager.js'

export default function IslandScreen({ islandId, gameState, onWild, onSelectBattle, onBack, onShopBuy }) {
  const island = islandById(islandId)
  const zone = island.zoneId ? getZoneById(island.zoneId) : null
  const campaign = gameState?.campaign || {}
  const [note, setNote] = useState('')

  const fightGym = (gym) => {
    const complete = campaign.completedGyms?.includes(gym.id)
    if (complete) {
      const replay = buildGymBattleInfo(gym, zone, { type: 'trainer', trainerIndex: 0 }, { replay: true })
      if (replay) onSelectBattle(replay)
      return
    }
    const next = getNextGymBattle(campaign, gym.id)
    const battle = buildGymBattleInfo(gym, zone, next, { replay: false })
    if (battle) onSelectBattle(battle)
  }

  const fightRival = () => {
    const rival = zone.rival
    const rivalName = campaign.rivalName || 'Rival'
    onSelectBattle({
      type: 'rival',
      gymId: null,
      zoneId: zone.id,
      aiConfig: rival.aiConfig,
      aiTeamSpec: null,
      aiTeamSize: rival.teamSize,
      rivalLevel: rival.level,
      preBattleDialogue: rival.preBattleDialogue.replace(/\[Rival name\]/g, rivalName),
      postDefeatDialogue: rival.postDefeatDialogue.replace(/\[Rival name\]/g, rivalName),
      reward: rival.reward,
      rewardTitle: rival.rewardTitle,
      rewardDescription: rival.rewardDescription,
    })
  }

  const searchWild = (area) => {
    const wild = rollWild(area)
    if (!wild) return
    onWild({
      type: 'wild',
      wild: true,
      zoneId: island.zoneId,
      areaName: area.name,
      aiConfig: { optimalChance: 0.45, switchBehavior: 'never', items: [] },
      aiTeamSpec: [{ id: wild.id, level: wild.level }],
      aiTeamSize: 1,
      creatureName: wild.name,
    })
  }

  return (
    <div className="flex-1 flex flex-col max-w-3xl mx-auto w-full px-3 sm:px-4 py-4">
      <div className="flex items-center justify-between mb-3">
        <button type="button" onClick={onBack} className="font-ui font-bold text-slate-300 uppercase text-sm px-2 cursor-pointer">Map</button>
        <div className="text-center">
          <h2 className="font-game text-xl font-bold" style={{ color: island.color }}>{island.name}</h2>
          <p className="font-ui text-sm text-slate-400">{gameState?.coins || 0} coins</p>
        </div>
        <div className="w-12" />
      </div>
      <p className="font-ui text-center text-slate-400 mb-4">{island.blurb}</p>
      {note && <p className="font-ui text-center text-amber-300 mb-3">{note}</p>}

      <div className="space-y-4 overflow-y-auto pb-6">
        <section>
          <h3 className="font-ui text-sm font-bold uppercase tracking-wider text-slate-500 mb-2">Wild areas</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {island.wilds.map(area => (
              <button
                key={area.id}
                type="button"
                onClick={() => searchWild(area)}
                className="min-h-16 rounded-2xl border border-emerald-800/40 bg-emerald-950/30 px-4 py-3 text-left cursor-pointer active:bg-emerald-900/40"
              >
                <p className="font-ui text-lg font-bold text-emerald-100">{area.name}</p>
                <p className="font-ui text-sm text-emerald-200/70">Lv {area.min}–{area.max} · {area.types.join(', ')}</p>
              </button>
            ))}
          </div>
        </section>

        {zone && (
          <section>
            <h3 className="font-ui text-sm font-bold uppercase tracking-wider text-slate-500 mb-2">Gyms</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {zone.gyms.map(gym => {
                const unlocked = isGymUnlocked(campaign, gym.id)
                const progress = getGymProgress(campaign, gym.id)
                return (
                  <button
                    key={gym.id}
                    type="button"
                    disabled={!unlocked}
                    onClick={() => fightGym(gym)}
                    className="min-h-16 rounded-2xl border border-slate-700 bg-slate-900/70 px-4 py-3 text-left cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed active:bg-slate-800"
                  >
                    <p className="font-ui text-lg font-bold text-slate-100">{progress?.complete ? '✓ ' : ''}{gym.name}</p>
                    <p className="font-ui text-sm text-slate-400">
                      {unlocked ? (progress?.complete ? 'Replay the gym' : `${progress?.trainersBeaten || 0}/${progress?.totalTrainers || gym.trainers.length} trainers`) : 'Locked'}
                    </p>
                  </button>
                )
              })}
            </div>
            <button
              type="button"
              disabled={!isRivalUnlocked(campaign, zone.id) || campaign.completedRivals?.includes(zone.rival.id)}
              onClick={fightRival}
              className="mt-2 w-full min-h-14 rounded-2xl border border-red-800/40 bg-red-950/30 px-4 py-3 text-left cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <p className="font-ui text-lg font-bold text-red-200">
                {campaign.completedRivals?.includes(zone.rival.id) ? 'Rival already beaten' : 'Rival battle'}
              </p>
              <p className="font-ui text-sm text-red-200/70">Clear this island's gyms first.</p>
            </button>
          </section>
        )}

        <section>
          <h3 className="font-ui text-sm font-bold uppercase tracking-wider text-slate-500 mb-2">Shop</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {SHOP.map(entry => {
              const item = ITEMS[entry.id]
              const afford = (gameState?.coins || 0) >= entry.price
              return (
                <button
                  key={entry.id}
                  type="button"
                  disabled={!afford}
                  onClick={() => {
                    onShopBuy(entry.id, entry.price)
                    setNote(`Bought ${item.name}.`)
                  }}
                  className="min-h-16 rounded-2xl border border-amber-900/40 bg-slate-900/80 px-4 py-3 text-left cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed active:bg-slate-800"
                >
                  <p className="font-ui text-lg font-bold text-amber-100">{item.name}</p>
                  <p className="font-ui text-sm text-slate-400">{entry.price} coins · {item.desc}</p>
                </button>
              )
            })}
          </div>
        </section>
      </div>
    </div>
  )
}
