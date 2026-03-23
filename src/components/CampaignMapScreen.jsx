import { useState, useMemo } from 'react'
import { ZONES, getAiConfigForBattle, getBattleTeamSize } from '../data/campaign.js'
import { TYPE_COLORS } from '../data/types.js'
import { isGymUnlocked, isRivalUnlocked, getNextGymBattle, getGymProgress, getBadgeCount } from '../systems/campaignManager.js'

export default function CampaignMapScreen({ gameState, onSelectBattle, onBadges, onMoveTutor, onBack, onChangeTeam }) {
  const [expandedGym, setExpandedGym] = useState(null)
  const campaign = gameState?.campaign || {}
  const rewards = gameState?.rewards || {}
  const badgeCount = useMemo(() => getBadgeCount(campaign), [campaign])

  const handleFight = (battleInfo) => {
    onSelectBattle(battleInfo)
  }

  const handleGymFight = (gym, zone) => {
    const isComplete = campaign.completedGyms.includes(gym.id)
    const next = getNextGymBattle(campaign, gym.id)

    if (isComplete) {
      // Replay: start from first trainer
      handleFight({
        type: 'trainer', gymId: gym.id, trainerIndex: 0, zoneId: zone.id,
        aiConfig: zone.aiConfig,
        aiTeamSpec: gym.trainers[0].creatures,
        aiTeamSize: getBattleTeamSize({ type: 'trainer', zoneId: zone.id }),
        replay: true,
        trainerName: gym.trainers[0].title,
      })
      return
    }

    if (!next) return

    if (next.type === 'trainer') {
      const trainer = gym.trainers[next.trainerIndex]
      handleFight({
        type: 'trainer', gymId: gym.id, trainerIndex: next.trainerIndex, zoneId: zone.id,
        aiConfig: zone.aiConfig,
        aiTeamSpec: trainer.creatures,
        aiTeamSize: getBattleTeamSize({ type: 'trainer', zoneId: zone.id }),
        trainerName: trainer.title,
      })
    } else if (next.type === 'leader') {
      handleFight({
        type: 'leader', gymId: gym.id, trainerIndex: -1, zoneId: zone.id,
        aiConfig: zone.leaderAiConfig,
        aiTeamSpec: gym.leader.creatures,
        aiTeamSize: gym.leader.teamSize,
        leaderName: gym.leader.name,
        preBattleDialogue: gym.leader.preBattleDialogue,
        postDefeatDialogue: gym.leader.postDefeatDialogue,
        badgeName: gym.badge.name,
        badgeIcon: gym.badge.icon,
      })
    }
  }

  const handleRivalFight = (zone) => {
    const rival = zone.rival
    handleFight({
      type: 'rival', gymId: null, zoneId: zone.id,
      aiConfig: rival.aiConfig,
      aiTeamSpec: null, // dynamic rival team
      aiTeamSize: rival.teamSize,
      rivalLevel: rival.level,
      preBattleDialogue: rival.preBattleDialogue.replace(/\[Rival name\]/g, campaign.rivalName || 'Rival'),
      postDefeatDialogue: rival.postDefeatDialogue.replace(/\[Rival name\]/g, campaign.rivalName || 'Rival'),
      reward: rival.reward,
      rewardTitle: rival.rewardTitle,
      rewardDescription: rival.rewardDescription,
    })
  }

  return (
    <div className="flex-1 flex flex-col max-w-3xl mx-auto w-full px-4 py-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={onBack} className="font-ui font-bold text-slate-400 hover:text-slate-200 uppercase tracking-wider text-sm transition-colors cursor-pointer">
          &larr; Menu
        </button>
        <div className="text-center">
          <h2 className="font-game text-xl font-bold tracking-wider text-slate-100">CAMPAIGN</h2>
          {campaign.playerName && (
            <p className="font-ui text-xs text-slate-500">
              {campaign.playerName} {rewards.championTitle ? '👑 Champion' : ''}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="font-ui text-sm text-amber-400">🏅 {badgeCount}/16</span>
        </div>
      </div>

      {/* Action bar */}
      <div className="flex gap-2 mb-4 justify-center flex-wrap">
        <button onClick={onChangeTeam}
          className="px-3 py-1.5 rounded-lg text-xs font-ui font-bold uppercase bg-slate-800 hover:bg-slate-700 text-slate-400 border border-slate-700 transition-all cursor-pointer">
          Change Team
        </button>
        <button onClick={onBadges}
          className="px-3 py-1.5 rounded-lg text-xs font-ui font-bold uppercase bg-slate-800 hover:bg-slate-700 text-amber-400 border border-amber-800/30 transition-all cursor-pointer">
          🏅 Badges
        </button>
        {rewards.moveTutor && (
          <button onClick={onMoveTutor}
            className="px-3 py-1.5 rounded-lg text-xs font-ui font-bold uppercase bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-cyan-800/30 transition-all cursor-pointer">
            📚 Move Tutor
          </button>
        )}
      </div>

      {/* Zone map — scrollable, Zone 1 at top */}
      <div className="flex-1 overflow-y-auto space-y-4">
        {ZONES.map((zone, zi) => {
          const zoneUnlocked = zi === 0 || campaign.completedRivals.includes(ZONES[zi - 1].rival.id)
          const rivalUnlocked = isRivalUnlocked(campaign, zone.id)
          const rivalBeaten = campaign.completedRivals.includes(zone.rival.id)

          return (
            <div key={zone.id} className={`rounded-xl border p-4 transition-all ${
              zoneUnlocked ? 'border-slate-700/60 bg-slate-900/50' : 'border-slate-800/30 bg-slate-950/30 opacity-40'
            }`}>
              {/* Zone header */}
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-game text-sm font-bold text-slate-300 uppercase tracking-wider">
                    Zone {zi + 1} — {zone.name}
                  </h3>
                  <p className="font-ui text-[10px] text-slate-600">{zone.description}</p>
                </div>
                {!zoneUnlocked && <span className="text-lg">🔒</span>}
              </div>

              {/* Gyms */}
              <div className="grid grid-cols-2 gap-2 mb-2">
                {zone.gyms.map(gym => {
                  const unlocked = zoneUnlocked && isGymUnlocked(campaign, gym.id)
                  const progress = getGymProgress(campaign, gym.id)
                  const isComplete = progress?.complete
                  const isExpanded = expandedGym === gym.id

                  const color1 = TYPE_COLORS[gym.types[0]] || { accent: '#718096' }
                  const color2 = TYPE_COLORS[gym.types[1]] || { accent: '#718096' }

                  return (
                    <div key={gym.id}
                      className={`rounded-lg border p-2.5 transition-all ${
                        isComplete
                          ? 'border-emerald-700/40 bg-emerald-900/10'
                          : unlocked
                            ? 'border-slate-600/50 bg-slate-800/40 hover:bg-slate-800/60 cursor-pointer'
                            : 'border-slate-800/30 opacity-30'
                      }`}
                      onClick={() => unlocked && setExpandedGym(isExpanded ? null : gym.id)}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5">
                          {isComplete && <span className="text-sm">✅</span>}
                          <span className="font-ui text-xs font-bold text-slate-300">{gym.name}</span>
                        </div>
                        <span className="text-sm">{isComplete ? gym.badge.icon : unlocked ? '⚔️' : '🔒'}</span>
                      </div>

                      <div className="flex items-center gap-1 mb-1">
                        <span className="w-2 h-2 rounded-full" style={{ background: color1.accent }} />
                        <span className="w-2 h-2 rounded-full" style={{ background: color2.accent }} />
                        <span className="font-ui text-[10px] text-slate-500 ml-1">
                          {gym.types.map(t => t.charAt(0).toUpperCase() + t.slice(1)).join(' / ')}
                        </span>
                      </div>

                      {unlocked && progress && (
                        <p className="font-ui text-[10px] text-slate-600">
                          {progress.trainersBeaten}/{progress.totalTrainers} trainers
                          {progress.leaderBeaten ? ' · Leader ✓' : ''}
                        </p>
                      )}

                      {/* Expanded: fight button */}
                      {isExpanded && unlocked && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleGymFight(gym, zone) }}
                          className="mt-2 w-full py-1.5 rounded-lg text-xs font-ui font-bold uppercase
                            bg-gradient-to-r from-emerald-700 to-emerald-600 hover:from-emerald-600 hover:to-emerald-500
                            border border-emerald-500/30 text-white transition-all cursor-pointer">
                          {isComplete ? 'Replay' : 'Fight!'}
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Rival gate */}
              <div className={`rounded-lg border p-2.5 flex items-center justify-between ${
                rivalBeaten
                  ? 'border-red-700/40 bg-red-900/10'
                  : rivalUnlocked
                    ? 'border-red-600/30 bg-red-900/5'
                    : 'border-slate-800/30 opacity-30'
              }`}>
                <div className="flex items-center gap-2">
                  <span className="text-lg">{rivalBeaten ? '🏆' : rivalUnlocked ? '⚔️' : '🔒'}</span>
                  <div>
                    <p className="font-ui text-xs font-bold text-red-300">
                      {rivalBeaten ? 'Rival Defeated' : 'Rival Battle'}
                    </p>
                    <p className="font-ui text-[10px] text-slate-600">
                      {rivalBeaten ? zone.rival.rewardTitle : rivalUnlocked ? 'Clear all gyms to challenge' : 'Beat all 4 gyms first'}
                    </p>
                  </div>
                </div>
                {rivalUnlocked && !rivalBeaten && (
                  <button
                    onClick={() => handleRivalFight(zone)}
                    className="px-3 py-1.5 rounded-lg text-xs font-ui font-bold uppercase
                      bg-gradient-to-r from-red-700 to-red-600 hover:from-red-600 hover:to-red-500
                      border border-red-500/30 text-white transition-all cursor-pointer">
                    Challenge
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
