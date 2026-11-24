// Which story beat is ready, and how a win moves the tale forward.
import { SCENES, CREW, ELITES, CHAMPION } from '../data/story.js'

export function emptyStory(story) {
  return {
    seen: story?.seen || [],
    defeated: story?.defeated || [],
    elitesBeaten: story?.elitesBeaten || [],
    champion: !!story?.champion,
    rematch: !!story?.rematch,
  }
}

function seen(state, id) {
  return !!state?.story?.seen?.includes(id)
}

export function sceneReady(state, scene) {
  if (!scene || seen(state, scene.id)) return false
  if (scene.afterScene && !seen(state, scene.afterScene)) return false
  if (scene.afterGym && !state?.campaign?.completedGyms?.includes(scene.afterGym)) return false
  if (scene.afterCrew && !state?.story?.defeated?.includes(scene.afterCrew)) return false
  if (scene.afterRival && !state?.campaign?.completedRivals?.includes(scene.afterRival)) return false
  if (scene.afterChampion && !state?.story?.champion) return false
  return true
}

export function pendingScene(state, place) {
  return SCENES.find(scene => scene.place === place && sceneReady(state, scene)) || null
}

export function markSceneSeen(state, id) {
  const story = emptyStory(state?.story)
  if (story.seen.includes(id)) return state
  return { ...state, story: { ...story, seen: [...story.seen, id] } }
}

export function crewForIsland(state, islandId) {
  return CREW.filter(member => {
    if (member.island !== islandId) return false
    if (state?.story?.defeated?.includes(member.id)) return false
    if (member.afterScene && !seen(state, member.afterScene)) return false
    return true
  })
}

export function crewBattleInfo(member) {
  return {
    type: 'crew',
    crewId: member.id,
    storyBattle: true,
    trainerName: member.name,
    aiConfig: member.ai,
    aiTeamSpec: member.team,
    aiTeamSize: member.team.length,
  }
}

export function markCrewDefeated(state, id) {
  const story = emptyStory(state?.story)
  if (story.defeated.includes(id)) return state
  return { ...state, story: { ...story, defeated: [...story.defeated, id] } }
}

export function nextElite(state) {
  return ELITES.find(elite => !state?.story?.elitesBeaten?.includes(elite.id)) || null
}

export function championReady(state) {
  return !state?.story?.champion && !nextElite(state) && !!state?.story?.defeated?.includes('scoop') && !!state?.campaign?.completedRivals?.includes('rival6')
}

export function eliteBattleInfo(elite) {
  return {
    type: 'elite',
    eliteId: elite.id,
    storyBattle: true,
    trainerName: elite.name,
    aiConfig: { optimalChance: 0.95, switchBehavior: 'proactive' },
    aiTeamSpec: elite.team,
    aiTeamSize: elite.team.length,
  }
}

export function championBattleInfo(rematch) {
  return {
    type: 'champion',
    champion: true,
    rematch: !!rematch,
    storyBattle: true,
    trainerName: rematch ? 'Champion Lumen (rematch)' : CHAMPION.name,
    aiConfig: { optimalChance: 1, switchBehavior: 'proactive' },
    aiTeamSpec: CHAMPION.team,
    aiTeamSize: CHAMPION.team.length,
  }
}

export function markEliteBeaten(state, id) {
  const story = emptyStory(state?.story)
  if (story.elitesBeaten.includes(id)) return state
  return { ...state, story: { ...story, elitesBeaten: [...story.elitesBeaten, id] } }
}

export function markChampion(state, rematch) {
  const story = emptyStory(state?.story)
  return {
    ...state,
    story: { ...story, champion: true, rematch: story.rematch || !!rematch },
    rewards: { ...(state.rewards || {}), islandChampion: true },
  }
}
