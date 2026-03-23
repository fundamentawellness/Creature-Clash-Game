import { useState, useEffect, useCallback, Component } from 'react'
import { loadGame, saveGame, getDefaultSave } from './utils/saveManager.js'
import TitleScreen from './components/TitleScreen.jsx'
import TeamSelectScreen from './components/TeamSelectScreen.jsx'
import DifficultySelectScreen from './components/DifficultySelectScreen.jsx'
import BattleContainer from './components/BattleContainer.jsx'
import ResultScreen from './components/ResultScreen.jsx'
import SettingsMenu from './components/SettingsMenu.jsx'
import CreatureForgeScreen from './components/CreatureForgeScreen.jsx'

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
  const [selectedDifficulty, setSelectedDifficulty] = useState('easy')
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [battleKey, setBattleKey] = useState(0) // Force remount on new battle
  const [transitioning, setTransitioning] = useState(false)

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

  const handleNewGame = useCallback(() => {
    const fresh = getDefaultSave()
    setGameState(fresh)
    transitionTo('teamSelect')
  }, [transitionTo])

  const handleContinue = useCallback(() => {
    transitionTo('teamSelect')
  }, [transitionTo])

  const handleImportComplete = useCallback((imported) => {
    setGameState(imported)
    transitionTo('teamSelect')
  }, [transitionTo])

  const handleTeamConfirm = useCallback((team) => {
    setSelectedTeam(team)
    setGameState(prev => ({ ...prev, lastTeam: team }))
    transitionTo('difficultySelect')
  }, [transitionTo])

  const handleDifficultySelect = useCallback((difficulty) => {
    setSelectedDifficulty(difficulty)
    setBattleResult(null)
    setBattleKey(k => k + 1)
    transitionTo('battle')
  }, [transitionTo])

  const handleBattleEnd = useCallback((result) => {
    setBattleResult(result)
    transitionTo('result')
  }, [transitionTo])

  const handleBattleAgain = useCallback(() => {
    setBattleResult(null)
    setBattleKey(k => k + 1)
    transitionTo('battle')
  }, [transitionTo])

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
    setScreen('title')
  }, [])

  const renderScreen = () => {
    switch (screen) {
      case 'title':
        return (
          <TitleScreen
            hasSave={!!gameState}
            forgeUnlocked={!!gameState?.difficulty?.hardCleared}
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
            onConfirm={handleTeamConfirm}
            onBack={() => transitionTo('title')}
          />
        )
      case 'difficultySelect':
        return (
          <DifficultySelectScreen
            gameState={gameState}
            onSelect={handleDifficultySelect}
            onBack={() => transitionTo('teamSelect')}
          />
        )
      case 'battle':
        return (
          <BattleContainer
            key={battleKey}
            gameState={gameState}
            selectedTeam={selectedTeam}
            difficulty={selectedDifficulty}
            onBattleEnd={handleBattleEnd}
          />
        )
      case 'result':
        return (
          <ResultScreen
            result={battleResult}
            gameState={gameState}
            selectedTeam={selectedTeam}
            difficulty={selectedDifficulty}
            onUpdateGameState={handleUpdateGameState}
            onBattleAgain={handleBattleAgain}
            onChangeTeam={() => transitionTo('teamSelect')}
            onMainMenu={() => transitionTo('title')}
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

        <div className={`flex-1 flex flex-col transition-opacity duration-200 ${transitioning ? 'opacity-0' : 'opacity-100'}`}>
          {renderScreen()}
        </div>
      </div>
    </ErrorBoundary>
  )
}

export default App
