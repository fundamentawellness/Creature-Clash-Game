import { useState, useRef } from 'react'
import { importSave } from '../utils/saveManager.js'
import { TYPE_COLORS } from '../data/types.js'

const FLOATING_TYPES = ['fire', 'water', 'grass', 'electric', 'rock', 'ground', 'poison']

export default function TitleScreen({ hasSave, forgeUnlocked, onNewGame, onContinue, onImport, onForge }) {
  const [importing, setImporting] = useState(false)
  const [importError, setImportError] = useState(null)
  const fileRef = useRef(null)

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setImporting(true)
    setImportError(null)

    const result = await importSave(file)
    if (result.success) {
      onImport(result.state)
    } else {
      setImportError(result.errors.join(', '))
    }
    setImporting(false)
    // Reset file input
    if (fileRef.current) fileRef.current.value = ''
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 relative overflow-hidden">
      {/* Floating type orbs background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {FLOATING_TYPES.map((type, i) => (
          <div
            key={type}
            className="absolute rounded-full opacity-20 glow-pulse"
            style={{
              width: 60 + i * 15 + 'px',
              height: 60 + i * 15 + 'px',
              background: `radial-gradient(circle, ${TYPE_COLORS[type].accent}, transparent)`,
              left: `${10 + i * 13}%`,
              top: `${15 + (i % 3) * 20}%`,
              animationDelay: `${i * 0.3}s`,
            }}
          />
        ))}
      </div>

      {/* Title */}
      <div className="relative z-10 text-center slide-up">
        <h1 className="font-game text-6xl md:text-8xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-b from-white via-slate-200 to-slate-500 leading-tight">
          BATTLE
        </h1>
        <h1 className="font-game text-6xl md:text-8xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-b from-amber-300 via-orange-400 to-red-500 leading-tight -mt-2">
          ARENA
        </h1>
        <p className="font-ui text-lg md:text-xl text-slate-400 tracking-[0.3em] uppercase mt-4">
          Creature Battle Simulator
        </p>
      </div>

      {/* Creature placeholder strip */}
      <div className="relative z-10 flex gap-3 mt-10 slide-up" style={{ animationDelay: '0.15s' }}>
        {FLOATING_TYPES.map((type) => (
          <div
            key={type}
            className="w-10 h-10 md:w-12 md:h-12 rounded-lg border-2 flex items-center justify-center"
            style={{
              borderColor: TYPE_COLORS[type].accent,
              background: TYPE_COLORS[type].dark + '40',
              boxShadow: `0 0 12px ${TYPE_COLORS[type].accent}40`,
            }}
          >
            <div
              className="w-5 h-5 md:w-6 md:h-6 rounded-full"
              style={{ background: TYPE_COLORS[type].accent }}
            />
          </div>
        ))}
      </div>

      {/* Menu buttons */}
      <div className="relative z-10 flex flex-col gap-3 mt-12 w-full max-w-xs slide-up" style={{ animationDelay: '0.3s' }}>
        {hasSave && (
          <button
            onClick={onContinue}
            className="w-full py-4 px-6 rounded-xl font-ui font-bold text-xl uppercase tracking-wider
              bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400
              border border-emerald-400/30 hover:border-emerald-400/60
              shadow-lg shadow-emerald-900/30 hover:shadow-emerald-800/50
              transition-all cursor-pointer"
          >
            Continue
          </button>
        )}

        <button
          onClick={onNewGame}
          className="w-full py-4 px-6 rounded-xl font-ui font-bold text-xl uppercase tracking-wider
            bg-gradient-to-r from-slate-700 to-slate-600 hover:from-slate-600 hover:to-slate-500
            border border-slate-500/30 hover:border-slate-400/60
            shadow-lg shadow-slate-900/30
            transition-all cursor-pointer"
        >
          New Game
        </button>

        <button
          onClick={() => fileRef.current?.click()}
          disabled={importing}
          className="w-full py-3 px-6 rounded-xl font-ui font-semibold text-base uppercase tracking-wider
            bg-slate-800/60 hover:bg-slate-700/80
            border border-slate-600/30 hover:border-slate-500/50
            text-slate-400 hover:text-slate-300
            transition-all cursor-pointer disabled:opacity-50"
        >
          {importing ? 'Importing...' : 'Import Save'}
        </button>

        <input
          ref={fileRef}
          type="file"
          accept=".json"
          onChange={handleFileChange}
          className="hidden"
        />

        {importError && (
          <p className="text-red-400 text-sm text-center font-ui mt-1">{importError}</p>
        )}

        {forgeUnlocked && (
          <button
            onClick={onForge}
            className="w-full py-3 px-6 rounded-xl font-ui font-bold text-base uppercase tracking-wider
              bg-gradient-to-r from-amber-700/80 to-orange-600/80 hover:from-amber-600 hover:to-orange-500
              border border-amber-500/30 hover:border-amber-400/60
              text-amber-200 hover:text-white
              shadow-lg shadow-amber-900/20
              transition-all cursor-pointer"
          >
            Creature Forge
          </button>
        )}
      </div>

      {/* Footer */}
      <p className="relative z-10 text-slate-600 text-sm font-ui mt-auto pb-6 pt-12">
        v1.0 — A creature battle game
      </p>
    </div>
  )
}
