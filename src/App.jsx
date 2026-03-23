import { useState, useEffect, useCallback, Component } from 'react'
import { loadGame, saveGame, getDefaultSave } from './utils/saveManager.js'
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
import MoveTutorScreen from './components/MoveTutorScreen.jsx'
import CreaturePickModal from './components/CreaturePickModal.jsx'

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
  const [screen, setScreen] = useState('title')
  const [gameState, setGameState] = useState(null)
  const [battleResult, setBattleResult] = useState(null)
  const [selectedTeam, setSelectedTeam] = useState([])
  const [currentBattleInfo, setCurrentBattleInfo] = useState(null)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [battleKey, setBattleKey] = useState(0)
  const [transitioning, setTransitioning] = useState(false)
  const [dialogue, setDialogue] = useState(null) // { speakerName, text, onDismiss }
  const [creaturePick, setCreaturePick] = useState(null) // { creatureIds, onPick }
  const [rewardSplash, setRewardSplash] = useState(null) // { title, description }

  // Load save on mount
  useEffect(() => {
    const saved = loadGame()
    if (saved) setGameState(saved)
  }, [])

  // Auto-save when game state changes
  useEffect(() => {
    if (gameState) saveGame(gameState)
  }, [gameState])

  const transitionTo = useCallback((nextScreen) => {
    setTransitioning(true)
    setTimeout(() => {
      setScreen(nextScreen)
      setTransitioning(false)
    }, 200)
  }, [])

  // ===== TITLE SCREEN HANDLERS =====

  const handleNewGame = useCallback(() => {
    const fresh = getDefaultSave()
    setGameState(fresh)
    transitionTo('teamSelect')
  }, [transitionTo])

  const handleContinue = useCallback(() => {
    // Restore last team from save
    if (gameState?.lastTeam?.length > 0) {
      setSelectedTeam(gameState.lastTeam)
    }
    if (gameState?.campaign?.playerName) {
      transitionTo('campaignMap')
    } else {
      transitionTo('teamSelect')
    }
  }, [transitionTo, gameState])

  const handleImportComplete = useCallback((imported) => {
    setGameState(imported)
    if (imported?.lastTeam?.length > 0) {
      setSelectedTeam(imported.lastTeam)
    }
    if (imported?.campaign?.playerName) {
      transitionTo('campaignMap')
    } else {
      transitionTo('teamSelect')
    }
  }, [transitionTo])

  // ===== TEAM / NAME ENTRY =====

  const handleTeamConfirm = useCallback((team) => {
    setSelectedTeam(team)
    setGameState(prev => ({ ...prev, lastTeam: team }))
    // If names not set yet (new game), go to name entry
    if (!gameState?.campaign?.playerName) {
      transitionTo('nameEntry')
    } else {
      transitionTo('campaignMap')
    }
  }, [transitionTo, gameState])

  const handleNameConfirm = useCallback((playerName, rivalName) => {
    setGameState(prev => ({
      ...prev,
      campaign: { ...prev.campaign, playerName, rivalName },
    }))
    transitionTo('campaignMap')
  }, [transitionTo])

  // ===== CAMPAIGN MAP =====

  const handleSelectBattle = useCallback((battleInfo) => {
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

  const handleBattleAgain = useCallback(() => {
    setBattleResult(null)
    setBattleKey(k => k + 1)
    transitionTo('battle')
  }, [transitionTo])

  // ===== GAME STATE UPDATE =====

  const handleUpdateGameState = useCallback((updater) => {
    setGameState(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater
      return next
    })
  }, [])

  const handleResetGame = useCallback(() => {
    setGameState(null)
    setBattleResult(null)
    setSelectedTeam([])
    setCurrentBattleInfo(null)
    setDialogue(null)
    setCreaturePick(null)
    setRewardSplash(null)
    setScreen('title')
  }, [])

  // ===== RENDER =====

  const renderScreen = () => {
    switch (screen) {
      case 'title':
        return (
          <TitleScreen
            hasSave={!!gameState}
            forgeUnlocked={!!gameState?.rewards?.creatureForge}
            onNewGame={handleNewGame}
            onContinue={handleContinue}
            onImport={handleImportComplete}
            onForge={() => transitionTo('forge')}
          />
        )
      case 'teamSelect':
        return (
          <TeamSelectScreen
            gameState={gameState}
            lastTeam={gameState?.lastTeam || []}
            teamSize={gameState?.teamSize || 3}
            onConfirm={handleTeamConfirm}
            onBack={() => gameState?.campaign?.playerName ? transitionTo('campaignMap') : transitionTo('title')}
            onUpdateGameState={handleUpdateGameState}
          />
        )
      case 'nameEntry':
        return (
          <NameEntryScreen
            onConfirm={handleNameConfirm}
            onBack={() => transitionTo('teamSelect')}
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
          />
        )
      case 'badges':
        return (
          <BadgeCollectionScreen
            gameState={gameState}
            onBack={() => transitionTo('campaignMap')}
          />
        )
      case 'moveTutor':
        return (
          <MoveTutorScreen
            gameState={gameState}
            onUpdateGameState={handleUpdateGameState}
            onBack={() => transitionTo('campaignMap')}
          />
        )
      case 'battle':
        return (
          <BattleContainer
            key={battleKey}
            gameState={gameState}
            selectedTeam={selectedTeam}
            battleInfo={currentBattleInfo}
            onBattleEnd={handleBattleEnd}
          />
        )
      case 'result':
        return (
          <ResultScreen
            result={battleResult}
            gameState={gameState}
            selectedTeam={selectedTeam}
            battleInfo={currentBattleInfo}
            onUpdateGameState={handleUpdateGameState}
            onBattleAgain={handleBattleAgain}
            onChangeTeam={() => transitionTo('teamSelect')}
            onMainMenu={() => transitionTo('campaignMap')}
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
        {screen !== 'battle' && (
          <button
            onClick={() => setSettingsOpen(true)}
            className="fixed top-4 right-4 z-50 w-10 h-10 flex items-center justify-center rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700 hover:border-slate-500 transition-all cursor-pointer"
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
        {rewardSplash && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setRewardSplash(null)}>
            <div className="absolute inset-0 bg-black/70" />
            <div className="relative text-center slide-up">
              <h2 className="font-game text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-orange-500 mb-4">
                {rewardSplash.title}
              </h2>
              <p className="font-ui text-lg text-slate-300 mb-6">{rewardSplash.description}</p>
              <p className="font-ui text-sm text-slate-500 animate-pulse">Click to continue</p>
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
