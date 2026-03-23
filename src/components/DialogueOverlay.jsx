import { useState, useEffect } from 'react'

export default function DialogueOverlay({ speakerName, text, onDismiss }) {
  const [displayedText, setDisplayedText] = useState('')
  const [complete, setComplete] = useState(false)

  useEffect(() => {
    setDisplayedText('')
    setComplete(false)
    let idx = 0
    const interval = setInterval(() => {
      idx++
      if (idx >= text.length) {
        setDisplayedText(text)
        setComplete(true)
        clearInterval(interval)
      } else {
        setDisplayedText(text.slice(0, idx))
      }
    }, 25)
    return () => clearInterval(interval)
  }, [text])

  const handleClick = () => {
    if (!complete) {
      setDisplayedText(text)
      setComplete(true)
    } else {
      onDismiss()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={handleClick}>
      <div className="absolute inset-0 bg-black/40" />
      <div className="relative w-full max-w-2xl mx-4 mb-6 rounded-xl border border-slate-600/50 bg-slate-900/95 p-5 backdrop-blur-sm">
        <p className="font-game text-sm font-bold text-amber-400 uppercase tracking-wider mb-2">{speakerName}</p>
        <p className="font-ui text-base text-slate-200 leading-relaxed min-h-[3rem]">{displayedText}</p>
        {complete && (
          <p className="font-ui text-xs text-slate-500 mt-3 text-right animate-pulse">Click to continue ▸</p>
        )}
      </div>
    </div>
  )
}
