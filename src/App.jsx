import { useState, useEffect, useCallback, useRef, Component } from 'react'
import { getDefaultSave, loadProfiles, writeProfiles } from './utils/saveManager.js'
import TitleScreen from './components/TitleScreen.jsx'
import TeamSelectScreen from './components/TeamSelectScreen.jsx'
import BattleContainer from './components/BattleContainer.jsx'
import ResultScreen from './components/ResultScreen.jsx'
import SettingsMenu from './components/SettingsMenu.jsx'
import CreatureForgeScreen from './components/CreatureForgeScreen.jsx'
import NameEntryScreen from './components/NameEntryScreen.jsx'
import CampaignMapScreen from './components/CampaignMapScreen.jsx'
import BadgeCollectionScreen from './components/BadgeCollectionScreen.jsx'
import DialogueOverlay from './components/DialogueOverlay.jsx'
import { getCurrentBattle } from './systems/campaignManager.js'
import { getGymById, getZoneById } from './data/campaign.js'
import MoveTutorScreen from './components/MoveTutorScreen.jsx'
import CreaturePickModal from './components/CreaturePickModal.jsx'
import ProfilePicker from './components/ProfilePicker.jsx'
import BagScreen from './components/BagScreen.jsx'
import IslandMapScreen from './components/IslandMapScreen.jsx'
import IslandScreen from './components/IslandScreen.jsx'
import CollectionBookScreen from './components/CollectionBookScreen.jsx'
import { markSeen, buyItem } from './systems/world.js'
import { pendingScene, markSceneSeen } from './systems/story.js'
import StoryScene from './components/StoryScene.jsx'
import OverworldScreen from './components/OverworldScreen.jsx'
import OnlineMatch from './components/OnlineMatch.jsx'
import { applyAudioSettings, installAudio, startMusic } from './audio/sound.js'
import { getNextReplayBattle } from './systems/campaignManager.js'

// Error boundary to prevent crashes from losing save data
class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }
  componentDidCatch(error, info) {
    console.error('Game error:', error, info)
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center px-4">
          <h2 className="font-game text-3xl font-bold text-red-400 mb-4">SOMETHING WENT WRONG</h2>
          <p className="font-ui text-slate-400 mb-2">Your save data is safe.</p>
          <p className="font-ui text-sm text-slate-500 mb-6 max-w-md text-center">
            {this.state.error?.message || 'An unexpected error occurred.'}
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null })
              this.props.onReset?.()
            }}
            className="px-6 py-3 rounded-xl font-ui font-bold uppercase tracking-wider bg-slate-700 hover:bg-slate-600 border border-slate-500/30 transition-all cursor-pointer"
          >
            Return to Title
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

function App() {
  const [screen, setScreen] = useState('profiles')
  const [profiles, setProfiles] = useState(() => loadProfiles())
  const [activeSlot, setActiveSlot] = useState(null)
  const [gameState, setGameState] = useState(null)
  const [battleResult, setBattleResult] = useState(null)
  const [currentBattleInfo, setCurrentBattleInfo] = useState(null)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [battleKey, setBattleKey] = useState(0)
  const [transitioning, setTransitioning] = useState(false)
  const [dialogue, setDialogue] = useState(null) // { speakerName, text, onDismiss }
  const [creaturePick, setCreaturePick] = useState(null) // { creatureIds, onPick }
  const [rewardSplash, setRewardSplash] = useState(null)
  const [currentIsland, setCurrentIsland] = useState('greenridge')
  const afterTeam = useRef(null) // { title, description }
  const menuHome = useRef('world')
  const [meetStory, setMeetStory] = useState(false)

  // Write the active player's latest game into their slot. This only touches
  // storage; React state is updated by the handlers that change the game.
  useEffect(() => { installAudio() }, [])
  useEffect(() => {
    if (gameState?.settings) applyAudioSettings(gameState.settings)
  }, [gameState?.settings])
  const musicMode = screen === 'battle'
    ? (currentBattleInfo?.type === 'champion' ? 'champion' : 'battle')
    : (screen === 'island' && currentIsland === 'crownrest' ? 'champion' : 'map')
  useEffect(() => {
    // Voyage on the island, the chart, and menus. Clash in every battle,
    // including wild fights and trainers. The same song keeps playing
    // through steps and sound effects.
    startMusic(musicMode)
  }, [musicMode])

  useEffect(() => {
    if (!profiles || activeSlot == null || !gameState) return
    const slots = profiles.slots.map((slot, i) => i === activeSlot ? { ...slot, save: gameState } : slot)
    writeProfiles({ ...profiles, activeSlot, slots })
  }, [profiles, gameState, activeSlot])

  const commitProfiles = useCallback((updater) => {
    setProfiles(prev => {
      if (!prev) return prev
      const next = typeof updater === 'function' ? updater(prev) : updater
      writeProfiles(next)
      return next
    })
  }, [])

  const transitionTo = useCallback((nextScreen) => {
    setTransitioning(true)
    setTimeout(() => {
      setScreen(nextScreen)
      setTransitioning(false)
    }, 200)
  }, [])

  // ===== TITLE SCREEN HANDLERS =====

  const handleNewGame = useCallback(() => {
    setGameState(getDefaultSave())
    setMeetStory(false)
    transitionTo('nameEntry')
  }, [transitionTo])

  const handlePlaySlot = useCallback((index) => {
    const save = profiles?.slots[index]?.save
    if (!save) return
    setActiveSlot(index)
    setGameState(save)
    commitProfiles(prev => ({ ...prev, activeSlot: index }))
    setScreen('title')
  }, [profiles, commitProfiles])

  const handleCreateSlot = useCallback((index, meta) => {
    commitProfiles(prev => {
      const slots = prev.slots.map((slot, i) => i === index ? { ...slot, ...meta, save: slot.save } : slot)
      return { ...prev, activeSlot: index, slots }
    })
    setActiveSlot(index)
    setGameState(getDefaultSave())
    setMeetStory(false)
    setScreen('nameEntry')
  }, [commitProfiles])

  const handleUpdateSlot = useCallback((index, meta) => {
    commitProfiles(prev => ({
      ...prev,
      slots: prev.slots.map((slot, i) => i === index ? { ...slot, ...meta } : slot),
    }))
  }, [commitProfiles])

  const handleSwitchPlayer = useCallback(() => {
    if (activeSlot != null && gameState) {
      commitProfiles(prev => {
        const slots = prev.slots.map((slot, i) => i === activeSlot ? { ...slot, save: gameState } : slot)
        return { ...prev, activeSlot, slots }
      })
    }
    setSettingsOpen(false)
    transitionTo('profiles')
  }, [activeSlot, gameState, commitProfiles, transitionTo])

  const handleContinue = useCallback(() => {
    if (gameState?.campaign?.playerName) {
      if (gameState.startersChosen) setMeetStory(true)
      transitionTo('overworld')
    } else {
      transitionTo('nameEntry')
    }
  }, [transitionTo, gameState])

  const handleImportComplete = useCallback((imported) => {
    setGameState(imported)
    if (imported?.campaign?.playerName) {
      transitionTo('overworld')
    } else {
      transitionTo('nameEntry')
    }
  }, [transitionTo])

  // ===== TEAM / NAME ENTRY =====

  const handleTeamConfirm = useCallback((team) => {
    setGameState(prev => ({ ...prev, lastTeam: team }))
    // If names not set yet (new game), go to name entry
    if (!gameState?.campaign?.playerName) {
      transitionTo('nameEntry')
    } else if (afterTeam.current) {
      const next = afterTeam.current
      afterTeam.current = null
      transitionTo(next)
    } else {
      transitionTo(menuHome.current || 'world')
    }
  }, [transitionTo, gameState])

  const handleNameConfirm = useCallback((playerName, rivalName) => {
    setGameState(prev => ({
      ...prev,
      campaign: { ...prev.campaign, playerName, rivalName },
    }))
    transitionTo('overworld')
  }, [transitionTo])

  // ===== CAMPAIGN MAP =====

  const handleSelectBattle = useCallback((battleInfo) => {
    setGameState(prev => markSeen(prev, [
      ...(prev?.lastTeam || []),
      ...(battleInfo?.aiTeamSpec || []).map(spec => spec.id),
    ]))
    setCurrentBattleInfo(battleInfo)
    setBattleResult(null)
    setBattleKey(k => k + 1)

    // Show pre-battle dialogue for leaders/rivals
    if (battleInfo.preBattleDialogue) {
      const speaker = battleInfo.type === 'rival'
        ? (gameState?.campaign?.rivalName || 'Rival')
        : (battleInfo.leaderName || 'Leader')
      setDialogue({
        speakerName: speaker,
        text: battleInfo.preBattleDialogue,
        onDismiss: () => {
          setDialogue(null)
          transitionTo('battle')
        },
      })
    } else {
      transitionTo('battle')
    }
  }, [transitionTo, gameState])

  // ===== BATTLE =====

  const handleBattleEnd = useCallback((result) => {
    setBattleResult(result)
    transitionTo('result')
  }, [transitionTo])

  const beginBattle = useCallback((battleInfo) => {
    setCurrentBattleInfo(battleInfo)
    setBattleKey(k => k + 1)
    if (battleInfo.preBattleDialogue) {
      const speaker = battleInfo.type === 'rival'
        ? (gameState?.campaign?.rivalName || 'Rival')
        : (battleInfo.leaderName || 'Leader')
      setDialogue({
        speakerName: speaker,
        text: battleInfo.preBattleDialogue,
        onDismiss: () => {
          setDialogue(null)
          transitionTo('battle')
        },
      })
    } else {
      transitionTo('battle')
    }
  }, [gameState, transitionTo])

  const handleBattleAgain = useCallback(() => {
    setBattleResult(null)
    const home = currentBattleInfo?.fromOverworld ? 'overworld' : 'world'

    // A gym replay walks every trainer, then the leader, and does not jump
    // back to the unfinished campaign fight.
    if (currentBattleInfo?.replay) {
      const nextReplay = getNextReplayBattle(currentBattleInfo)
      if (!nextReplay) {
        transitionTo(home)
        return
      }
      beginBattle({ ...nextReplay, fromOverworld: !!currentBattleInfo?.fromOverworld })
      return
    }

    // Get the next battle from the updated campaign state
    const campaign = gameState?.campaign
    if (!campaign) {
      transitionTo(home)
      return
    }

    const next = getCurrentBattle(campaign)

    if (!next) {
      // Campaign complete or no next battle
      transitionTo(home)
      return
    }

    // Build the battleInfo for the next fight
    let battleInfo = null

    if (next.type === 'trainer' && next.gymId) {
      const gym = getGymById(next.gymId)
      const zone = getZoneById(next.zoneId)
      if (gym && zone) {
        const trainer = gym.trainers[next.trainerIndex]
        battleInfo = {
          type: 'trainer', gymId: next.gymId, trainerIndex: next.trainerIndex, zoneId: next.zoneId,
          aiConfig: zone.aiConfig,
          aiTeamSpec: trainer.creatures,
          aiTeamSize: trainer.teamSize || 3,
          trainerName: trainer.title,
        }
      }
    } else if (next.type === 'leader' && next.gymId) {
      const gym = getGymById(next.gymId)
      const zone = getZoneById(next.zoneId)
      if (gym && zone) {
        battleInfo = {
          type: 'leader', gymId: next.gymId, trainerIndex: -1, zoneId: next.zoneId,
          aiConfig: zone.leaderAiConfig,
          aiTeamSpec: gym.leader.creatures,
          aiTeamSize: gym.leader.teamSize,
          leaderName: gym.leader.name,
          preBattleDialogue: gym.leader.preBattleDialogue,
          postDefeatDialogue: gym.leader.postDefeatDialogue,
          badgeName: gym.badge?.name,
          badgeIcon: gym.badge?.icon,
        }
      }
    } else if (next.type === 'rival') {
      const zone = getZoneById(next.zoneId)
      if (zone) {
        const rival = zone.rival
        const rivalName = campaign.rivalName || 'Rival'
        battleInfo = {
          type: 'rival', gymId: null, zoneId: next.zoneId,
          aiConfig: rival.aiConfig,
          aiTeamSpec: null,
          aiTeamSize: rival.teamSize,
          rivalLevel: rival.level,
          preBattleDialogue: rival.preBattleDialogue?.replace(/\[Rival name\]/g, rivalName),
          postDefeatDialogue: rival.postDefeatDialogue?.replace(/\[Rival name\]/g, rivalName),
          reward: rival.reward,
          rewardTitle: rival.rewardTitle,
          rewardDescription: rival.rewardDescription,
        }
      }
    }

    if (!battleInfo) {
      transitionTo(home)
      return
    }

    beginBattle({ ...battleInfo, fromOverworld: !!currentBattleInfo?.fromOverworld })
  }, [transitionTo, gameState, currentBattleInfo, beginBattle])

  // ===== GAME STATE UPDATE =====

  const handleUpdateGameState = useCallback((updater) => {
    setGameState(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater
      return next
    })
  }, [])

  const handleResetGame = useCallback(() => {
    if (activeSlot != null) {
      commitProfiles(prev => ({
        ...prev,
        slots: prev.slots.map((slot, i) => i === activeSlot ? { ...slot, save: null } : slot),
      }))
    }
    setGameState(null)
    setBattleResult(null)
    setCurrentBattleInfo(null)
    setDialogue(null)
    setCreaturePick(null)
    setRewardSplash(null)
    setScreen('title')
  }, [activeSlot, commitProfiles])

  // ===== RENDER =====

  const renderScreen = () => {
    switch (screen) {
      case 'profiles':
        return profiles ? (
          <ProfilePicker
            profiles={profiles}
            onPlay={handlePlaySlot}
            onCreate={handleCreateSlot}
            onUpdate={handleUpdateSlot}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center font-ui text-slate-400">Loading players...</div>
        )
      case 'title':
        return (
          <TitleScreen
            hasSave={!!gameState}
            forgeUnlocked={!!gameState?.rewards?.creatureForge}
            profileName={profiles?.slots?.[activeSlot]?.name || ''}
            profileColor={profiles?.slots?.[activeSlot]?.color}
            onNewGame={handleNewGame}
            onContinue={handleContinue}
            onImport={handleImportComplete}
            onForge={() => transitionTo('forge')}
            onSwitchPlayer={handleSwitchPlayer}
            onLink={() => transitionTo('link')}
          />
        )
      case 'link':
        return (
          <OnlineMatch
            gameState={gameState}
            onExit={() => transitionTo('title')}
            onChangeTeam={() => { afterTeam.current = 'link'; transitionTo('teamSelect') }}
          />
        )
      case 'teamSelect':
        return (
          <TeamSelectScreen
            gameState={gameState}
            lastTeam={gameState?.lastTeam || []}
            teamSize={gameState?.teamSize || 3}
            onConfirm={handleTeamConfirm}
            onBack={() => transitionTo(gameState?.campaign?.playerName ? (menuHome.current || 'world') : 'title')}
            onUpdateGameState={handleUpdateGameState}
          />
        )
      case 'nameEntry':
        return (
          <NameEntryScreen
            initialPlayerName={profiles?.slots?.[activeSlot]?.name || ''}
            onConfirm={handleNameConfirm}
            onBack={() => transitionTo('title')}
          />
        )
      case 'world': {
        const mapScene = pendingScene(gameState, 'map')
        if (mapScene) {
          return (
            <StoryScene
              scene={mapScene}
              playerName={gameState?.campaign?.playerName}
              rivalName={gameState?.campaign?.rivalName}
              onDone={() => handleUpdateGameState(prev => markSceneSeen(prev, mapScene.id))}
            />
          )
        }
        return (
          <IslandMapScreen
            gameState={gameState}
            onOpenIsland={(id) => {
              if (id === 'greenridge') {
                if (gameState?.startersChosen) setMeetStory(true)
                transitionTo('overworld')
                return
              }
              setCurrentIsland(id)
              transitionTo('island')
            }}
            onBook={() => { menuHome.current = 'world'; transitionTo('book') }}
            onBag={() => { menuHome.current = 'world'; transitionTo('bag') }}
            onTeam={() => { menuHome.current = 'world'; transitionTo('teamSelect') }}
            onBadges={() => transitionTo('badges')}
            onMenu={() => transitionTo('title')}
          />
        )
      }
      case 'island': {
        const islandScene = pendingScene(gameState, currentIsland)
        if (islandScene) {
          return (
            <StoryScene
              scene={islandScene}
              playerName={gameState?.campaign?.playerName}
              rivalName={gameState?.campaign?.rivalName}
              onDone={() => handleUpdateGameState(prev => markSceneSeen(prev, islandScene.id))}
            />
          )
        }
        return (
          <IslandScreen
            islandId={currentIsland}
            gameState={gameState}
            onWild={(info) => { setGameState(prev => markSeen(prev, (info.aiTeamSpec || []).map(spec => spec.id))); handleSelectBattle(info) }}
            onSelectBattle={handleSelectBattle}
            onBack={() => transitionTo('world')}
            onShopBuy={(itemId, price) => handleUpdateGameState(prev => buyItem(prev, itemId, price))}
          />
        )
      }
      case 'overworld':
        return (
          <OverworldScreen
            key={gameState?.story?.seen?.includes('greenridge') ? 'dot' : 'town'}
            gameState={gameState}
            onUpdate={handleUpdateGameState}
            onBattle={handleSelectBattle}
            onBag={() => { menuHome.current = 'overworld'; transitionTo('bag') }}
            onTeam={() => { menuHome.current = 'overworld'; transitionTo('teamSelect') }}
            onBook={() => { menuHome.current = 'overworld'; transitionTo('book') }}
            onIslands={() => transitionTo('world')}
            storyOpen={meetStory && !!(pendingScene(gameState, 'map') || pendingScene(gameState, 'greenridge'))}
            onMeetStory={() => setMeetStory(true)}
          />
        )
      case 'book':
        return (
          <CollectionBookScreen
            gameState={gameState}
            onBack={() => transitionTo(menuHome.current || 'world')}
          />
        )
      case 'campaignMap':
        return (
          <CampaignMapScreen
            gameState={gameState}
            onSelectBattle={handleSelectBattle}
            onBadges={() => transitionTo('badges')}
            onMoveTutor={() => transitionTo('moveTutor')}
            onBack={() => transitionTo('title')}
            onChangeTeam={() => transitionTo('teamSelect')}
            onBag={() => transitionTo('bag')}
          />
        )
      case 'bag':
        return (
          <BagScreen
            gameState={gameState}
            onUpdateGameState={handleUpdateGameState}
            onBack={() => transitionTo(menuHome.current || 'world')}
          />
        )
      case 'badges':
        return (
          <BadgeCollectionScreen
            gameState={gameState}
            onBack={() => transitionTo('world')}
          />
        )
      case 'moveTutor':
        return (
          <MoveTutorScreen
            gameState={gameState}
            onUpdateGameState={handleUpdateGameState}
            onBack={() => transitionTo('world')}
          />
        )
      case 'battle':
        return (
          <BattleContainer
            key={battleKey}
            gameState={gameState}
            selectedTeam={gameState?.lastTeam || []}
            battleInfo={currentBattleInfo}
            onBattleEnd={handleBattleEnd}
            onUpdateGameState={handleUpdateGameState}
            onMarkSeen={(ids) => handleUpdateGameState(prev => markSeen(prev, ids))}
          />
        )
      case 'result':
        return (
          <ResultScreen
            result={battleResult}
            gameState={gameState}
            selectedTeam={gameState?.lastTeam || []}
            battleInfo={currentBattleInfo}
            onUpdateGameState={handleUpdateGameState}
            onBattleAgain={handleBattleAgain}
            onChangeTeam={() => transitionTo('teamSelect')}
            onMainMenu={() => transitionTo((gameState?.overworld?.blackout || currentBattleInfo?.fromOverworld) ? 'overworld' : 'world')}
            onShowDialogue={(d) => setDialogue(d)}
            onShowCreaturePick={(p) => setCreaturePick(p)}
            onShowRewardSplash={(r) => setRewardSplash(r)}
          />
        )
      case 'forge':
        return (
          <CreatureForgeScreen
            gameState={gameState}
            onUpdateGameState={handleUpdateGameState}
            onBack={() => transitionTo('title')}
          />
        )
      default:
        return null
    }
  }

  return (
    <ErrorBoundary onReset={handleResetGame}>
      <div className="min-h-screen flex flex-col relative overflow-x-hidden">
        {/* Settings gear */}
        {screen !== 'battle' && screen !== 'profiles' && (
          <button
            onClick={() => setSettingsOpen(true)}
            className="fixed top-[max(0.75rem,env(safe-area-inset-top))] right-3 z-50 w-12 h-12 flex items-center justify-center rounded-xl bg-slate-800/90 hover:bg-slate-700 border border-slate-600 transition-all cursor-pointer"
            title="Settings"
          >
            <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        )}

        {settingsOpen && (
          <SettingsMenu
            gameState={gameState}
            onClose={() => setSettingsOpen(false)}
            onImport={handleImportComplete}
            onReset={handleResetGame}
            slotName={profiles?.slots?.[activeSlot]?.name || ''}
            onAudio={(settings) => handleUpdateGameState(prev => prev ? { ...prev, settings } : prev)}
          />
        )}

        {/* Dialogue overlay */}
        {dialogue && (
          <DialogueOverlay
            speakerName={dialogue.speakerName}
            text={dialogue.text}
            onDismiss={dialogue.onDismiss}
          />
        )}

        {screen === 'overworld' && meetStory && gameState?.startersChosen && (pendingScene(gameState, 'map') || pendingScene(gameState, 'greenridge')) && (
          <div className="fixed inset-0 z-[80] bg-slate-950 overflow-y-auto">
            <StoryScene
              scene={pendingScene(gameState, 'map') || pendingScene(gameState, 'greenridge')}
              playerName={gameState?.campaign?.playerName}
              rivalName={gameState?.campaign?.rivalName}
              onDone={() => {
                const scene = pendingScene(gameState, 'map') || pendingScene(gameState, 'greenridge')
                if (scene) handleUpdateGameState(prev => markSceneSeen(prev, scene.id))
              }}
            />
          </div>
        )}

        {/* Creature pick modal */}
        {creaturePick && (
          <CreaturePickModal
            creatureIds={creaturePick.creatureIds}
            onPick={(id) => {
              creaturePick.onPick(id)
              setCreaturePick(null)
            }}
            title={creaturePick.title}
          />
        )}

        {/* Reward splash */}
        {gameState?.growthNotes?.length > 0 && screen !== 'battle' && screen !== 'profiles' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => handleUpdateGameState(prev => ({ ...prev, growthNotes: [] }))}>
            <div className="absolute inset-0 bg-black/70" />
            <div className="relative max-w-md w-full rounded-2xl bg-slate-900 border border-amber-500/40 p-6 text-center">
              <h2 className="font-game text-2xl text-amber-300 mb-3">Your team grew!</h2>
              <ul className="font-ui text-lg text-slate-200 space-y-2 mb-4">
                {gameState.growthNotes.map(note => <li key={note}>{note}</li>)}
              </ul>
              <p className="font-ui text-sm text-slate-500">Tap to continue</p>
            </div>
          </div>
        )}

        {rewardSplash && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setRewardSplash(null)}>
            <div className="absolute inset-0 bg-black/70" />
            <div className="relative text-center slide-up">
              <h2 className="font-game text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-orange-500 mb-4">
                {rewardSplash.title}
              </h2>
              <p className="font-ui text-lg text-slate-300 mb-6">{rewardSplash.description}</p>
              <p className="font-ui text-sm text-slate-500 animate-pulse">Tap to continue</p>
            </div>
          </div>
        )}

        <div className={`flex-1 flex flex-col transition-opacity duration-200 ${transitioning ? 'opacity-0' : 'opacity-100'}`}>
          {renderScreen()}
        </div>
      </div>
    </ErrorBoundary>
  )
}

export default App
