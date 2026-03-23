import { useState, useRef } from 'react'
import { exportSave, importSave, resetGame } from '../utils/saveManager.js'

export default function SettingsMenu({ gameState, onClose, onImport, onReset }) {
  const [confirmReset, setConfirmReset] = useState(false)
  const [importError, setImportError] = useState(null)
  const [importSuccess, setImportSuccess] = useState(false)
  const fileRef = useRef(null)

  const handleExport = () => {
    exportSave()
  }

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setImportError(null)
    setImportSuccess(false)

    const result = await importSave(file)
    if (result.success) {
      setImportSuccess(true)
      setTimeout(() => {
        onImport(result.state)
        onClose()
      }, 800)
    } else {
      setImportError(result.errors.join(', '))
    }
    if (fileRef.current) fileRef.current.value = ''
  }

  const handleReset = () => {
    resetGame()
    onReset()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 fade-in" onClick={onClose}>
      <div
        className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-sm w-full mx-4 slide-up shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-game text-xl font-bold tracking-wider text-slate-100">SETTINGS</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
          >
            &times;
          </button>
        </div>

        <div className="space-y-3">
          {/* Export */}
          <button
            onClick={handleExport}
            disabled={!gameState}
            className="w-full py-3 px-4 rounded-xl font-ui font-bold text-sm uppercase tracking-wider text-left
              bg-slate-800 hover:bg-slate-700
              border border-slate-600/30 hover:border-slate-500/50
              text-slate-300 hover:text-slate-100
              transition-all cursor-pointer
              disabled:opacity-40 disabled:cursor-not-allowed
              flex items-center gap-3"
          >
            <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export Save File
          </button>

          {/* Import */}
          <button
            onClick={() => fileRef.current?.click()}
            className="w-full py-3 px-4 rounded-xl font-ui font-bold text-sm uppercase tracking-wider text-left
              bg-slate-800 hover:bg-slate-700
              border border-slate-600/30 hover:border-slate-500/50
              text-slate-300 hover:text-slate-100
              transition-all cursor-pointer
              flex items-center gap-3"
          >
            <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Import Save File
          </button>

          <input
            ref={fileRef}
            type="file"
            accept=".json"
            onChange={handleFileChange}
            className="hidden"
          />

          {importError && (
            <p className="text-red-400 text-xs font-ui px-1">{importError}</p>
          )}
          {importSuccess && (
            <p className="text-emerald-400 text-xs font-ui px-1">Save imported successfully!</p>
          )}

          {/* Divider */}
          <div className="border-t border-slate-800 my-2" />

          {/* Reset */}
          {!confirmReset ? (
            <button
              onClick={() => setConfirmReset(true)}
              className="w-full py-3 px-4 rounded-xl font-ui font-bold text-sm uppercase tracking-wider text-left
                bg-slate-800 hover:bg-red-900/30
                border border-slate-600/30 hover:border-red-500/30
                text-slate-500 hover:text-red-400
                transition-all cursor-pointer
                flex items-center gap-3"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Reset Game
            </button>
          ) : (
            <div className="bg-red-950/30 border border-red-500/30 rounded-xl p-4">
              <p className="font-ui text-sm text-red-300 mb-3">
                This will delete ALL progress. Are you sure?
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleReset}
                  className="flex-1 py-2 rounded-lg font-ui font-bold text-sm uppercase
                    bg-red-600 hover:bg-red-500 text-white
                    transition-all cursor-pointer"
                >
                  Yes, Reset
                </button>
                <button
                  onClick={() => setConfirmReset(false)}
                  className="flex-1 py-2 rounded-lg font-ui font-bold text-sm uppercase
                    bg-slate-700 hover:bg-slate-600 text-slate-300
                    transition-all cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Game info */}
        {gameState && (
          <div className="mt-6 pt-4 border-t border-slate-800">
            <div className="grid grid-cols-2 gap-2 text-xs font-ui text-slate-500">
              <span>Creatures: {gameState.unlockedCreatureIds?.length || 0}/28</span>
              <span>Total wins: {gameState.totalBattlesWon || 0}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
