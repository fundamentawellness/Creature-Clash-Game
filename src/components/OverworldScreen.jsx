import { useEffect, useRef, useState } from 'react'
import Phaser from 'phaser'
import { OverworldScene } from '../game/scenes/OverworldScene.js'
import { GREENRIDGE, zoneNameAt } from '../data/greenridgeMap.js'
import { SHOP } from '../data/islands.js'
import { ITEMS } from '../data/items.js'
import { buyItem } from '../systems/world.js'
import {
  collectItem, dotBattle, ENCOUNTER_GRACE, fieldTrainerBattle, grantStarters, gymDoorBattle,
  livingCount, rivalDoorBattle, signText, talkToPip, wakeAtClinic, wildBattleInfo,
} from '../systems/field.js'
import StarterPickScreen from './StarterPickScreen.jsx'
import DialogueOverlay from './DialogueOverlay.jsx'

export default function OverworldScreen({ gameState, onUpdate, onBattle, onBag, onTeam, onBook, onIslands, storyOpen, onMeetStory }) {
  const hostRef = useRef(null)
  const sceneRef = useRef(null)
  const stateRef = useRef(gameState)
  const [zone, setZone] = useState(() => zoneNameAt(
    gameState?.overworld?.x ?? GREENRIDGE.spawn.x,
    gameState?.overworld?.y ?? GREENRIDGE.spawn.y,
  ))
  const [note, setNote] = useState('')
  const [lines, setLines] = useState(null)
  const [shop, setShop] = useState(false)
  const [booting] = useState(() => ({ blackout: !!gameState?.overworld?.blackout }))
  const [needStarter, setNeedStarter] = useState(() => !gameState?.startersChosen)

  useEffect(() => { stateRef.current = gameState }, [gameState])
  useEffect(() => {
    sceneRef.current?.setLiving(livingCount(gameState))
  }, [gameState])

  useEffect(() => {
    if (!booting.blackout) return
    onUpdate(prev => (prev?.overworld?.blackout ? wakeAtClinic(prev) : prev))
    setLines({
      name: 'Nurse Nia',
      queue: ['Your whole team fainted. I patched everyone up. The road is still there when you are ready.'],
    })
  }, [booting.blackout, onUpdate])

  useEffect(() => {
    const host = hostRef.current
    if (!host || !gameState) return undefined
    const people = GREENRIDGE.people.filter(person => {
      if (person.id === 'dot' && !gameState.story?.seen?.includes('greenridge') && !gameState.story?.defeated?.includes('dot')) return false
      return true
    })
    const picked = new Set(gameState.field?.picked || [])
    const boot = {
      x: booting.blackout ? GREENRIDGE.clinic.x : (gameState.overworld?.x ?? GREENRIDGE.spawn.x),
      y: booting.blackout ? GREENRIDGE.clinic.y : (gameState.overworld?.y ?? GREENRIDGE.spawn.y),
      facing: booting.blackout ? 'up' : (gameState.overworld?.facing || 'down'),
      calm: booting.blackout || !!gameState.overworld?.calm,
      locked: booting.blackout || needStarter,
      people,
      items: GREENRIDGE.items.filter(item => !picked.has(item.id)),
      beaten: gameState.field?.beaten || [],
      living: livingCount(gameState),
      onPosition: (pos) => {
        setZone(zoneNameAt(pos.x, pos.y))
        onUpdate(prev => ({
          ...prev,
          overworld: { ...(prev.overworld || {}), ...pos, map: 'greenridge', calm: false },
        }))
      },
      onWild: (roll) => onBattle(wildBattleInfo(roll)),
      onTrainer: (trainer) => onBattle(fieldTrainerBattle(trainer)),
      onPickup: (item) => {
        const label = item.kind === 'shell' ? 'You found a lucky white shell.' : `Found ${ITEMS[item.itemId]?.name || 'something'}.`
        setNote(label)
        onUpdate(prev => collectItem(prev, item).state)
      },
      onInteract: (person) => openPerson(person),
      onWiped: () => {
        setLines({ name: 'Nurse Nia', queue: ['Your team cannot battle. Come back to the healing center.'] })
      },
    }

    class LiveMap extends OverworldScene {
      init() { super.init(boot) }
    }

    const rect = host.getBoundingClientRect()
    const game = new Phaser.Game({
      type: Phaser.CANVAS,
      parent: host,
      width: Math.max(320, Math.floor(rect.width || 480)),
      height: Math.max(240, Math.floor(rect.height || 320)),
      backgroundColor: '#14301f',
      pixelArt: true,
      scale: { mode: Phaser.Scale.RESIZE },
      scene: [LiveMap],
      audio: { disableWebAudio: true },
      render: { pixelArt: true, antialias: false },
    })

    const poll = setInterval(() => {
      const scene = game.scene.getScene('OverworldScene')
      if (scene) {
        sceneRef.current = scene
        clearInterval(poll)
      }
    }, 40)

    return () => {
      clearInterval(poll)
      sceneRef.current = null
      game.destroy(true)
    }
    // Mount once. Later saves must not rebuild the map under the player.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const lock = (value) => sceneRef.current?.setLocked(value)

  const openPerson = (person) => {
    const state = stateRef.current
    lock(true)
    if (person.kind === 'nurse') {
      onUpdate(prev => wakeAtClinic({ ...prev, overworld: { ...prev.overworld, x: person.x, y: person.y + 1, facing: 'up' } }))
      sceneRef.current?.setGrace(ENCOUNTER_GRACE)
      setLines({ name: person.name, queue: ['Welcome in. Everyone is rested, and every bruise is gone.'] })
      return
    }
    if (person.kind === 'professor') {
      if (!state.startersChosen) return
      setLines({
        name: person.name,
        queue: ['The meadow, the forest, the beach, and the cave each hide different creatures. One in each place is rare.', 'When the whole team faints, Nurse Nia will be waiting.'],
      })
      return
    }
    if (person.kind === 'quest') {
      const result = talkToPip(state)
      onUpdate(() => result.state)
      setLines({ name: person.name, queue: result.lines })
      return
    }
    if (person.kind === 'shop') {
      setShop(true)
      return
    }
    if (person.kind === 'sail') {
      setLines({
        name: person.name,
        queue: ['The skiff can reach any island you have earned. I will open the chart.'],
        then: onIslands,
      })
      return
    }
    if (person.kind === 'sign') {
      setLines({ name: person.name, queue: [signText(person.id)] })
      return
    }
    if (person.kind === 'gym') {
      if (livingCount(state) <= 0) {
        setLines({ name: 'Nurse Nia', queue: ['Heal your team before a gym battle.'] })
        return
      }
      const result = gymDoorBattle(state, person.gymId)
      if (result.battle) onBattle(result.battle)
      else setLines({ name: person.name, queue: [result.line] })
      return
    }
    if (person.kind === 'rival') {
      const result = rivalDoorBattle(state)
      if (result.battle) {
        if (livingCount(state) <= 0) {
          setLines({ name: 'Nurse Nia', queue: ['Heal your team before you take that challenge.'] })
          return
        }
        onBattle(result.battle)
      } else setLines({ name: state.campaign?.rivalName || 'Rival', queue: [result.line] })
      return
    }
    if (person.kind === 'crew') {
      const result = dotBattle(state)
      if (result.battle) onBattle(result.battle)
      else setLines({ name: person.name, queue: [result.line] })
      return
    }
    if (person.kind === 'trainer') {
      const beaten = state.field?.beaten?.includes(person.id)
      if (beaten) setLines({ name: person.name, queue: [person.after] })
      else if (livingCount(state) <= 0) setLines({ name: person.name, queue: ['You look worn out. Visit the healing center.'] })
      else onBattle(fieldTrainerBattle(person))
    }
  }

  const dismiss = () => {
    const next = lines?.then
    const meet = lines?.meet
    setLines(null)
    if (meet) onMeetStory?.()
    if (next) next()
    else if (!meet) lock(false)
  }

  useEffect(() => {
    if (storyOpen) sceneRef.current?.setLocked(true)
    else if (!needStarter && !lines) sceneRef.current?.setLocked(false)
  }, [storyOpen, needStarter, lines])

  const stick = (x, y) => sceneRef.current?.setStick(x, y)

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-slate-950">
      <div className="flex items-center justify-between gap-2 px-3 pt-[max(0.5rem,env(safe-area-inset-top))] pb-2">
        <div>
          <p className="font-game text-lg text-emerald-200">{zone}</p>
          <p className="font-ui text-sm text-slate-400">{gameState?.campaign?.playerName} · {gameState?.coins || 0} coins</p>
        </div>
        <div className="flex flex-wrap gap-2 justify-end pr-12">
          <HudButton onClick={onBag}>Bag</HudButton>
          <HudButton onClick={onTeam}>Team</HudButton>
          <HudButton onClick={onBook}>Book</HudButton>
          <HudButton onClick={onIslands}>Islands</HudButton>
        </div>
      </div>
      {note && <p className="font-ui text-center text-amber-200 px-3">{note}</p>}
      <div ref={hostRef} className="flex-1 w-full min-h-[240px]" />
      <div className="pointer-events-none absolute inset-0">
        <div className="pointer-events-auto absolute left-3 bottom-[max(1rem,env(safe-area-inset-bottom))] grid grid-cols-3 gap-1 w-36">
          <span />
          <Pad onDown={() => stick(0, -1)} onUp={() => stick(0, 0)}>↑</Pad>
          <span />
          <Pad onDown={() => stick(-1, 0)} onUp={() => stick(0, 0)}>←</Pad>
          <span />
          <Pad onDown={() => stick(1, 0)} onUp={() => stick(0, 0)}>→</Pad>
          <span />
          <Pad onDown={() => stick(0, 1)} onUp={() => stick(0, 0)}>↓</Pad>
          <span />
        </div>
        <button
          type="button"
          onPointerDown={(event) => { event.preventDefault(); sceneRef.current?.interact() }}
          className="pointer-events-auto absolute right-4 bottom-[max(1.5rem,env(safe-area-inset-bottom))] w-20 h-20 rounded-full bg-amber-500 text-slate-950 font-game text-2xl shadow-lg"
        >
          A
        </button>
      </div>
      {needStarter && (
        <StarterPickScreen onConfirm={(ids) => {
          onUpdate(prev => grantStarters(prev, ids))
          setNeedStarter(false)
          setLines({
            name: 'Professor Fern',
            meet: true,
            queue: ['Those three are yours. I packed potions and a few Lure Orbs. Catch the rest yourself.'],
          })
        }} />
      )}
      {lines && (
        <LineBox key={lines.queue[0]} lines={lines} onDone={dismiss} />
      )}
      {shop && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-3 bg-black/60">
          <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-amber-700/40 p-4">
            <h3 className="font-game text-2xl text-amber-200">Mina's shop</h3>
            <p className="font-ui text-slate-400 mb-3">{gameState?.coins || 0} coins</p>
            <div className="space-y-2">
              {SHOP.map(entry => {
                const item = ITEMS[entry.id]
                const afford = (gameState?.coins || 0) >= entry.price
                return (
                  <button
                    key={entry.id}
                    type="button"
                    disabled={!afford}
                    onClick={() => onUpdate(prev => buyItem(prev, entry.id, entry.price))}
                    className="w-full min-h-14 rounded-2xl border border-slate-600 px-3 text-left cursor-pointer disabled:opacity-40"
                  >
                    <span className="font-ui font-bold text-slate-100">{item.name}</span>
                    <span className="font-ui text-amber-300"> · {entry.price} coins</span>
                    <span className="block font-ui text-sm text-slate-400">{item.desc}</span>
                  </button>
                )
              })}
            </div>
            <button type="button" className="mt-3 font-ui font-bold text-slate-300" onClick={() => { setShop(false); lock(false) }}>Close</button>
          </div>
        </div>
      )}
    </div>
  )
}

function HudButton({ children, onClick }) {
  return (
    <button type="button" onClick={onClick} className="min-h-10 px-3 rounded-xl bg-slate-800 border border-slate-600 font-ui font-bold text-sm text-slate-100 cursor-pointer">
      {children}
    </button>
  )
}

function Pad({ children, onDown, onUp }) {
  return (
    <button
      type="button"
      onPointerDown={(event) => { event.preventDefault(); onDown() }}
      onPointerUp={onUp}
      onPointerLeave={onUp}
      className="w-11 h-11 rounded-xl bg-slate-800/90 border border-slate-500 text-slate-100 font-ui text-lg"
      style={{ touchAction: 'none' }}
    >
      {children}
    </button>
  )
}

function LineBox({ lines, onDone }) {
  const [index, setIndex] = useState(0)
  const text = lines.queue[index]
  const last = index >= lines.queue.length - 1
  return (
    <DialogueOverlay
      speakerName={lines.name}
      text={text}
      onDismiss={() => {
        if (last) onDone()
        else setIndex(index + 1)
      }}
    />
  )
}
