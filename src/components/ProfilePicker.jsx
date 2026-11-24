import { useState } from 'react'
import CreatureSprite from './CreatureSprite.jsx'
import { SLOT_COLORS, SLOT_AVATARS } from '../utils/saveManager.js'

function slotSummary(slot) {
  if (!slot?.save) return 'Empty — tap to start'
  const badges = slot.save.campaign?.badges?.length || 0
  const wins = slot.save.totalBattlesWon || 0
  if (slot.save.rewards?.championTitle) return `Champion · ${badges} badges`
  if (badges > 0) return `${badges} badge${badges === 1 ? '' : 's'}`
  if (wins > 0) return `${wins} win${wins === 1 ? '' : 's'}`
  if (slot.save.campaign?.playerName) return 'Journey started'
  return 'Ready to battle'
}

function SlotForm({ title, initial, confirmLabel, onSave, onCancel }) {
  const [name, setName] = useState(initial?.name || '')
  const [color, setColor] = useState(initial?.color || SLOT_COLORS[0].hex)
  const [avatar, setAvatar] = useState(initial?.avatar || SLOT_AVATARS[0])
  const trimmed = name.trim()
  const canSave = trimmed.length >= 1 && trimmed.length <= 12

  return (
    <form
      className="w-full max-w-lg mx-auto rounded-2xl border border-slate-700 bg-slate-900/80 p-4 sm:p-6 space-y-5"
      onSubmit={(e) => {
        e.preventDefault()
        if (canSave) onSave({ name: trimmed, color, avatar })
      }}
    >
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-game text-lg font-bold text-slate-100">{title}</h3>
        <button type="button" onClick={onCancel} className="font-ui font-bold text-slate-400 px-3 rounded-lg">
          Back
        </button>
      </div>

      <div className="flex items-center gap-4">
        <div className="rounded-full p-1" style={{ background: color }}>
          <div className="rounded-full bg-slate-950">
            <CreatureSprite creatureId={avatar} creatureType="normal" creatureName={trimmed || 'Player'} size={72} />
          </div>
        </div>
        <div className="flex-1">
          <label className="font-ui text-xs uppercase tracking-wider text-slate-400 font-bold" htmlFor="player-slot-name">
            Player name
          </label>
          <input
            id="player-slot-name"
            value={name}
            onChange={(e) => setName(e.target.value.slice(0, 12))}
            placeholder="Who is playing?"
            autoFocus
            className="mt-1 w-full rounded-xl bg-slate-800 border border-slate-600 px-3 py-3 text-slate-100 font-ui text-lg focus:border-amber-400 focus:outline-none"
          />
          <p className="font-ui text-xs text-slate-500 mt-1 text-right">{name.length}/12</p>
        </div>
      </div>

      <div>
        <p className="font-ui text-xs uppercase tracking-wider text-slate-400 font-bold mb-2">Color</p>
        <div className="flex flex-wrap gap-2">
          {SLOT_COLORS.map((swatch) => (
            <button
              key={swatch.id}
              type="button"
              aria-label={swatch.label}
              onClick={() => setColor(swatch.hex)}
              className={`h-12 w-12 rounded-full border-2 cursor-pointer ${color === swatch.hex ? 'border-white scale-110' : 'border-transparent'}`}
              style={{ background: swatch.hex }}
            />
          ))}
        </div>
      </div>

      <div>
        <p className="font-ui text-xs uppercase tracking-wider text-slate-400 font-bold mb-2">Picture</p>
        <div className="grid grid-cols-4 gap-2">
          {SLOT_AVATARS.map((id) => (
            <button
              key={id}
              type="button"
              aria-label={id}
              onClick={() => setAvatar(id)}
              className={`rounded-xl border-2 p-1 cursor-pointer bg-slate-800 ${avatar === id ? 'border-amber-400' : 'border-slate-700'}`}
            >
              <CreatureSprite creatureId={id} creatureName={id} size={64} />
            </button>
          ))}
        </div>
      </div>

      <button
        type="submit"
        disabled={!canSave}
        className="w-full rounded-xl py-3 font-ui text-lg font-bold uppercase tracking-wider bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {confirmLabel}
      </button>
    </form>
  )
}

export default function ProfilePicker({ profiles, onPlay, onCreate, onUpdate }) {
  const [draft, setDraft] = useState(null)

  if (draft) {
    const slot = profiles.slots[draft.index]
    const isNew = draft.mode === 'new'
    return (
      <div className="flex-1 flex flex-col px-4 py-6">
        <SlotForm
          title={isNew ? 'New player' : 'Edit player'}
          initial={isNew ? { color: slot.color, avatar: slot.avatar, name: '' } : slot}
          confirmLabel={isNew ? "Let's go" : 'Save'}
          onCancel={() => setDraft(null)}
          onSave={(meta) => {
            if (isNew) onCreate(draft.index, meta)
            else onUpdate(draft.index, meta)
            setDraft(null)
          }}
        />
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col w-full max-w-5xl mx-auto px-4 py-6 sm:py-10">
      <div className="text-center mb-6 sm:mb-8">
        <h1 className="font-game text-3xl sm:text-5xl font-black tracking-wide text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-400">
          WHO'S PLAYING?
        </h1>
        <p className="font-ui text-base sm:text-lg text-slate-400 mt-2">
          Each player keeps their own creatures, badges, and wins.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {profiles.slots.map((slot, index) => {
          const filled = !!slot.save || !!slot.name
          if (!filled) {
            return (
              <button
                key={slot.id}
                type="button"
                onClick={() => setDraft({ index, mode: 'new' })}
                className="min-h-40 rounded-2xl border-2 border-dashed border-slate-600 bg-slate-900/40 px-4 py-6 text-slate-400 font-ui text-lg font-bold cursor-pointer active:border-amber-400 active:text-amber-300"
              >
                + New player
              </button>
            )
          }
          return (
            <div
              key={slot.id}
              className="rounded-2xl border border-slate-700 bg-slate-900/70 p-4 flex flex-col gap-3"
              style={{ boxShadow: `inset 0 0 0 2px ${slot.color}55` }}
            >
              <button
                type="button"
                onClick={() => {
                  if (slot.save) onPlay(index)
                  else onCreate(index, { name: slot.name, color: slot.color, avatar: slot.avatar })
                }}
                className="flex flex-col items-center gap-2 cursor-pointer rounded-xl px-2 py-2 active:bg-slate-800"
              >
                <div className="rounded-full p-1" style={{ background: slot.color }}>
                  <div className="rounded-full bg-slate-950">
                    <CreatureSprite creatureId={slot.avatar} creatureName={slot.name || 'Player'} size={72} />
                  </div>
                </div>
                <p className="font-game text-lg font-bold text-slate-100">{slot.name || 'Player'}</p>
                <p className="font-ui text-sm text-slate-400 text-center">{slotSummary(slot)}</p>
              </button>
              <button
                type="button"
                onClick={() => setDraft({ index, mode: slot.save ? 'edit' : 'new' })}
                className="rounded-xl border border-slate-600 bg-slate-800 font-ui font-bold text-slate-300 cursor-pointer active:bg-slate-700"
              >
                {slot.save ? 'Edit name' : 'Set up'}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
