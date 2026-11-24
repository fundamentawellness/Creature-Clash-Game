import { useState } from 'react'

export default function StoryScene({ scene, playerName, rivalName, onDone }) {
  const [index, setIndex] = useState(0)
  const line = scene.lines[index]
  const last = index >= scene.lines.length - 1
  const name = line.who === 'you' ? (playerName || 'You') : line.who === 'rival' ? (rivalName || 'Rival') : line.name

  return (
    <div className="flex-1 flex flex-col items-center justify-center w-full max-w-xl mx-auto px-4 py-6">
      <div
        className="w-24 h-24 sm:w-28 sm:h-28 rounded-full flex items-center justify-center text-5xl border-4 mb-4"
        style={{ borderColor: line.color, background: '#0f172a' }}
      >
        {line.face}
      </div>
      <p className="font-ui text-sm uppercase tracking-wider mb-3" style={{ color: line.color }}>{name}</p>
      <p className="font-ui text-lg sm:text-xl text-slate-100 text-center leading-relaxed min-h-24">{line.text}</p>
      <div className="flex gap-3 mt-6 w-full">
        {!last && (
          <button type="button" onClick={onDone} className="flex-1 min-h-12 rounded-xl font-ui font-bold uppercase bg-slate-800 text-slate-300 cursor-pointer">
            Skip
          </button>
        )}
        <button
          type="button"
          onClick={() => (last ? onDone() : setIndex(index + 1))}
          className="flex-1 min-h-12 rounded-xl font-ui font-bold uppercase bg-cyan-700 text-white cursor-pointer"
        >
          {last ? 'Continue' : 'Next'}
        </button>
      </div>
    </div>
  )
}
