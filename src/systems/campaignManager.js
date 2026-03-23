// Campaign state management — pure functions, no side effects
import { ZONES, ALL_GYMS, getGymById, getZoneById, getRivalByZone } from '../data/campaign.js'

/**
 * Check if a gym is unlocked for the player.
 * A gym is unlocked if:
 * - It's the first gym in Zone 1, OR
 * - The previous gym in the same zone is completed, OR
 * - It's the first gym in a zone and the previous zone's rival is beaten
 */
export function isGymUnlocked(campaign, gymId) {
  if (campaign.completedGyms.includes(gymId)) return true

  for (let zi = 0; zi < ZONES.length; zi++) {
    const zone = ZONES[zi]
    const gymIdx = zone.gyms.findIndex(g => g.id === gymId)
    if (gymIdx === -1) continue

    // First gym in zone 1 — always unlocked
    if (zi === 0 && gymIdx === 0) return true

    // First gym in zone 2+ — requires previous zone's rival beaten
    if (gymIdx === 0) {
      const prevZone = ZONES[zi - 1]
      return campaign.completedRivals.includes(prevZone.rival.id)
    }

    // Not first gym — previous gym in same zone must be completed
    const prevGym = zone.gyms[gymIdx - 1]
    return campaign.completedGyms.includes(prevGym.id)
  }

  return false
}

/**
 * Check if a zone's rival is unlocked.
 * All 4 gyms in the zone must be completed.
 */
export function isRivalUnlocked(campaign, zoneId) {
  const zone = getZoneById(zoneId)
  if (!zone) return false
  if (campaign.completedRivals.includes(zone.rival.id)) return true
  return zone.gyms.every(g => campaign.completedGyms.includes(g.id))
}

/**
 * Get what battle the player should fight next in a gym.
 * Returns { type: 'trainer'|'leader', trainerIndex } or null if gym is complete.
 */
export function getNextGymBattle(campaign, gymId) {
  const gym = getGymById(gymId)
  if (!gym) return null

  // If gym is completed (leader beaten), return null
  if (campaign.completedGyms.includes(gymId)) return null

  // Find first unbeaten trainer
  const completedTrainers = campaign.completedTrainers[gymId] || []
  for (let i = 0; i < gym.trainers.length; i++) {
    if (!completedTrainers.includes(i)) {
      return { type: 'trainer', trainerIndex: i }
    }
  }

  // All trainers beaten — leader fight
  return { type: 'leader', trainerIndex: -1 }
}

/**
 * Get the overall next battle the player should face in the campaign.
 */
export function getCurrentBattle(campaign) {
  for (const zone of ZONES) {
    // Check if this zone's rival is already beaten
    if (campaign.completedRivals.includes(zone.rival.id)) continue

    // Check each gym in order
    for (const gym of zone.gyms) {
      if (!campaign.completedGyms.includes(gym.id)) {
        if (!isGymUnlocked(campaign, gym.id)) return null // locked
        const next = getNextGymBattle(campaign, gym.id)
        if (next) return { ...next, gymId: gym.id, zoneId: zone.id }
      }
    }

    // All gyms done — rival
    if (isRivalUnlocked(campaign, zone.id)) {
      return { type: 'rival', gymId: null, zoneId: zone.id }
    }
  }

  // All zones complete
  return null
}

/**
 * Advance the campaign after winning a battle.
 * Returns the updated campaign object (shallow copy).
 */
export function advanceCampaign(campaign, battleInfo) {
  const updated = {
    ...campaign,
    completedGyms: [...campaign.completedGyms],
    completedTrainers: { ...campaign.completedTrainers },
    completedRivals: [...campaign.completedRivals],
    badges: [...campaign.badges],
    rivalDefeats: [...campaign.rivalDefeats],
  }

  if (battleInfo.type === 'trainer') {
    // Mark trainer as completed
    const gymTrainers = updated.completedTrainers[battleInfo.gymId] || []
    if (!gymTrainers.includes(battleInfo.trainerIndex)) {
      updated.completedTrainers[battleInfo.gymId] = [...gymTrainers, battleInfo.trainerIndex]
    }
  } else if (battleInfo.type === 'leader') {
    // Mark gym as completed, earn badge
    if (!updated.completedGyms.includes(battleInfo.gymId)) {
      updated.completedGyms.push(battleInfo.gymId)
      const gym = getGymById(battleInfo.gymId)
      if (gym) {
        updated.badges.push({
          gymId: battleInfo.gymId,
          badgeName: gym.badge.name,
          badgeIcon: gym.badge.icon,
          leaderName: gym.leader.name,
          types: gym.types,
          timestamp: Date.now(),
        })
      }
    }
  } else if (battleInfo.type === 'rival') {
    const rival = getRivalByZone(battleInfo.zoneId)
    if (rival && !updated.completedRivals.includes(rival.id)) {
      updated.completedRivals.push(rival.id)
      updated.rivalDefeats.push({
        rivalId: rival.id,
        reward: rival.reward,
        timestamp: Date.now(),
      })
    }
  }

  return updated
}

/**
 * Apply a rival reward to the game state.
 * Returns updated gameState.
 */
export function applyRivalReward(gameState, rewardKey) {
  const updated = {
    ...gameState,
    rewards: { ...gameState.rewards, [rewardKey]: true },
  }

  if (rewardKey === 'fourthTeamSlot') {
    updated.teamSize = 4
  }
  if (rewardKey === 'creatureForge') {
    updated.rewards.championTitle = true
  }

  return updated
}

/**
 * Track which types the player used in battle.
 * Updates playerTypeCounts in campaign.
 */
export function trackPlayerTypes(campaign, playerTeam) {
  const counts = { ...campaign.playerTypeCounts }
  for (const creature of playerTeam) {
    if (creature?.type) {
      counts[creature.type] = (counts[creature.type] || 0) + 1
    }
  }
  return { ...campaign, playerTypeCounts: counts }
}

/**
 * Check if a gym can be replayed (already completed).
 */
export function canReplayGym(campaign, gymId) {
  return campaign.completedGyms.includes(gymId)
}

/**
 * Get gym trainer/leader progress summary for UI.
 */
export function getGymProgress(campaign, gymId) {
  const gym = getGymById(gymId)
  if (!gym) return null

  const completedTrainers = campaign.completedTrainers[gymId] || []
  const totalTrainers = gym.trainers.length
  const trainersBeaten = completedTrainers.length
  const leaderBeaten = campaign.completedGyms.includes(gymId)

  return {
    trainersBeaten,
    totalTrainers,
    leaderBeaten,
    complete: leaderBeaten,
  }
}

/**
 * Count total badges earned.
 */
export function getBadgeCount(campaign) {
  return campaign.badges.length
}

/**
 * Get campaign completion percentage.
 */
export function getCampaignProgress(campaign) {
  const totalGyms = 16
  const totalRivals = 4
  return {
    gymsCompleted: campaign.completedGyms.length,
    totalGyms,
    rivalsCompleted: campaign.completedRivals.length,
    totalRivals,
    percentage: Math.round(((campaign.completedGyms.length + campaign.completedRivals.length) / (totalGyms + totalRivals)) * 100),
  }
}
