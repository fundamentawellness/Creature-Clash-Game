import { useState } from 'react'

export default function NameEntryScreen({ onConfirm, onBack }) {
  const [playerName, setPlayerName] = useState('')
  const [rivalName, setRivalName] = useState('')

  const isValid = playerName.trim().length >= 1 && rivalName.trim().length >= 1

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h2 className="font-game text-3xl font-bold tracking-wider text-slate-100 mb-2">BEGIN YOUR JOURNEY</h2>
          <p className="font-ui text-slate-500">Before you begin, introduce yourself.</p>
        </div>

        <div className="space-y-6">
          <div>
            <label className="font-ui text-xs text-slate-400 uppercase font-bold tracking-wider block mb-2">Your Name</label>
            <input
              value={playerName}
              onChange={e => setPlayerName(e.target.value.slice(0, 12))}
              className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-600 text-slate-100 font-ui text-lg focus:border-emerald-500 focus:outline-none transition-colors"
              placeholder="Enter your name..."
              autoFocus
            />
            <p className="font-ui text-xs text-slate-600 mt-1 text-right">{playerName.length}/12</p>
          </div>

          <div>
            <label className="font-ui text-xs text-slate-400 uppercase font-bold tracking-wider block mb-2">Name Your Rival</label>
            <input
              value={rivalName}
              onChange={e => setRivalName(e.target.value.slice(0, 12))}
              className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-600 text-slate-100 font-ui text-lg focus:border-red-500 focus:outline-none transition-colors"
              placeholder="Name your rival..."
            />
            <p className="font-ui text-xs text-slate-600 mt-1 text-right">{rivalName.length}/12</p>
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <button onClick={onBack}
            className="px-6 py-3 rounded-xl font-ui font-bold uppercase tracking-wider bg-slate-800 hover:bg-slate-700 text-slate-400 border border-slate-600/30 transition-all cursor-pointer">
            Back
          </button>
          <button onClick={() => isValid && onConfirm(playerName.trim(), rivalName.trim())}
            disabled={!isValid}
            className="flex-1 py-3 rounded-xl font-ui font-bold text-lg uppercase tracking-wider
              bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400
              border border-emerald-400/30 transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed">
            Start Campaign
          </button>
        </div>
      </div>
    </div>
  )
}
