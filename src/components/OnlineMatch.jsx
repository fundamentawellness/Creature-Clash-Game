import { useEffect, useRef, useState } from 'react'
import BattleContainer from './BattleContainer.jsx'
import { arenaHttpUrl, arenaWsUrl } from '../online/arenaUrl.js'

function teamPayload(gameState, ids) {
  return (ids || []).map(id => {
    const progress = gameState?.creatureProgress?.[id]
    return {
      id,
      level: progress?.level || 1,
      currentMoves: progress?.currentMoves || [],
      heldItem: progress?.heldItem || null,
    }
  })
}

export default function OnlineMatch({ gameState, onExit, onChangeTeam }) {
  const team = gameState?.lastTeam || []
  const name = gameState?.campaign?.playerName || 'Friend'
  const [phase, setPhase] = useState('lobby')
  const [status, setStatus] = useState('')
  const [code, setCode] = useState('')
  const [typed, setTyped] = useState('')
  const [normalize, setNormalize] = useState(true)
  const [battle, setBattle] = useState(null)
  const [banner, setBanner] = useState('')
  const [outcome, setOutcome] = useState('')
  const socketRef = useRef(null)
  const playRef = useRef(null)
  const tokenRef = useRef('')
  const codeRef = useRef('')
  const wantClose = useRef(false)
  const phaseRef = useRef('lobby')
  const retries = useRef(0)
  useEffect(() => { phaseRef.current = phase }, [phase])

  const finish = (text) => {
    setOutcome(text)
    setPhase('done')
    setBanner('')
  }

  const handleMessage = (msg) => {
    if (msg.t === 'room') {
      tokenRef.current = msg.token
      codeRef.current = msg.code
      setCode(msg.code)
      setPhase('waiting')
      setStatus('')
      try { sessionStorage.setItem('arena-seat', JSON.stringify({ code: msg.code, token: msg.token })) } catch { /* private mode */ }
    } else if (msg.t === 'start') {
      setBattle({
        you: msg.you,
        foe: msg.foe,
        opponentName: msg.opponentName,
        normalize: msg.normalize,
      })
      setPhase('battle')
      setBanner('')
    } else if (msg.t === 'turn') {
      setBanner('')
      playRef.current?.(msg)
    } else if (msg.t === 'paused') {
      setBanner(msg.text)
    } else if (msg.t === 'resumed') {
      setBanner('')
    } else if (msg.t === 'back') {
      tokenRef.current = msg.token || tokenRef.current
      retries.current = 0
      if (phaseRef.current === 'battle') {
        setBanner(msg.otherConnected ? '' : 'Waiting for your friend to come back.')
      } else if (msg.waiting) setPhase('waiting')
      else if (msg.start) {
        setBattle({
          you: msg.start.you,
          foe: msg.start.foe,
          opponentName: msg.start.opponentName,
          normalize: msg.start.normalize,
          syncYou: msg.you,
          syncFoe: msg.foe,
        })
        setPhase('battle')
        setBanner(msg.otherConnected ? '' : 'Waiting for your friend to come back.')
      }
    } else if (msg.t === 'over') {
      finish(msg.text || 'The battle is over.')
    } else if (msg.t === 'error') {
      setStatus(msg.text)
      if (phaseRef.current === 'battle') setBanner(msg.text)
      if (phaseRef.current === 'waking') setPhase('lobby')
    }
  }

  const connect = (onOpen) => {
    wantClose.current = false
    const reconnecting = !!tokenRef.current && phaseRef.current === 'battle'
    if (!reconnecting) {
      setPhase(current => (current === 'battle' ? current : 'waking'))
      setStatus('Waking up the arena. The free room server sleeps when nobody is playing, so the first hello can take a minute.')
    }
    let opened = false
    const openSocket = () => {
      if (opened || wantClose.current) return
      opened = true
      const socket = new WebSocket(arenaWsUrl())
      socketRef.current = socket
      socket.onopen = () => onOpen(socket)
      socket.onmessage = (event) => {
        try { handleMessage(JSON.parse(event.data)) } catch { /* ignore */ }
      }
      socket.onerror = () => setStatus('The arena did not answer. You can still play the island story on this device.')
      socket.onclose = () => {
        if (wantClose.current) return
        retries.current += 1
        if (!tokenRef.current || retries.current > 8) {
          setPhase('lobby')
          setStatus('The arena did not answer. You can still play the island story on this device.')
          return
        }
        setBanner('Reconnecting...')
        setTimeout(() => {
          if (wantClose.current) return
          connect((next) => {
            next.send(JSON.stringify({ t: 'reconnect', token: tokenRef.current, code: codeRef.current }))
          })
        }, 1500)
      }
    }
    if (reconnecting) {
      openSocket()
      return
    }
    const timer = setTimeout(openSocket, 55000)
    fetch(`${arenaHttpUrl()}/health`, { signal: AbortSignal.timeout(55000) })
      .catch(() => null)
      .finally(() => {
        clearTimeout(timer)
        openSocket()
      })
  }

  useEffect(() => {
    return () => {
      wantClose.current = true
      socketRef.current?.close()
    }
  }, [])

  const sendTeam = (kind) => {
    if (team.length < 1) {
      setStatus('Pick a team first.')
      return
    }
    connect((socket) => {
      setStatus('')
      socket.send(JSON.stringify({
        t: kind,
        name,
        normalize,
        code: typed,
        team: teamPayload(gameState, team),
      }))
    })
  }

  const sendAction = (action) => {
    const socket = socketRef.current
    if (!socket || socket.readyState !== 1) {
      setBanner('The link is not ready.')
      return
    }
    socket.send(JSON.stringify({ t: 'action', action }))
  }

  const leave = () => {
    wantClose.current = true
    socketRef.current?.close()
    try { sessionStorage.removeItem('arena-seat') } catch { /* ignore */ }
    onExit()
  }

  return (
    <div className="flex-1 flex flex-col w-full max-w-3xl mx-auto px-3 py-4">
      <div className="flex items-center justify-between mb-3">
        <button type="button" onClick={leave} className="font-ui font-bold uppercase text-sm text-slate-300 px-2 cursor-pointer">Back</button>
        <h2 className="font-game text-xl text-slate-100">FRIEND BATTLE</h2>
        <div className="w-12" />
      </div>

      {phase === 'lobby' && (
        <div className="space-y-4">
          <p className="font-ui text-slate-300 text-center">A private room for two devices. No accounts, no public list.</p>
          <label className="flex items-center gap-3 rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 font-ui text-slate-200">
            <input type="checkbox" checked={normalize} onChange={(event) => setNormalize(event.target.checked)} className="w-5 h-5" />
            Make both teams level 50, so a fair fight is possible
          </label>
          {team.length < 1 && (
            <button type="button" onClick={onChangeTeam} className="w-full min-h-12 rounded-xl bg-slate-800 text-slate-100 font-ui font-bold cursor-pointer">Pick a team</button>
          )}
          <button type="button" onClick={() => sendTeam('create')} className="w-full min-h-14 rounded-2xl bg-emerald-600 text-white font-ui font-bold uppercase cursor-pointer">Create a room</button>
          <div className="flex gap-2">
            <input
              value={typed}
              onChange={(event) => setTyped(event.target.value.toUpperCase())}
              placeholder="TIDE4"
              maxLength={6}
              className="flex-1 min-h-14 rounded-2xl bg-slate-900 border border-slate-600 px-4 font-game text-2xl tracking-widest text-center text-slate-100"
            />
            <button type="button" onClick={() => sendTeam('join')} className="min-h-14 px-5 rounded-2xl bg-cyan-700 text-white font-ui font-bold uppercase cursor-pointer">Join</button>
          </div>
          {status && <p className="font-ui text-amber-200 text-center">{status}</p>}
        </div>
      )}

      {phase === 'waking' && (
        <div className="text-center mt-10">
          <p className="font-game text-2xl text-cyan-200 mb-3">Waking up the arena</p>
          <p className="font-ui text-slate-300">{status}</p>
        </div>
      )}

      {phase === 'waiting' && (
        <div className="text-center mt-8">
          <p className="font-ui text-slate-400 mb-2">Tell your friend this code</p>
          <p className="font-game text-5xl sm:text-6xl tracking-widest text-amber-300">{code}</p>
          <p className="font-ui text-slate-400 mt-4">Only share it with the person you want to battle. Rooms are not listed.</p>
          {normalize && <p className="font-ui text-slate-300 mt-3">Both teams will fight at level 50.</p>}
        </div>
      )}

      {phase === 'battle' && battle && (
        <div className="flex-1 flex flex-col">
          <p className="font-ui text-center text-slate-300 mb-2">
            Versus {battle.opponentName}{battle.normalize ? ' · level 50' : ''}
          </p>
          {banner && <p className="font-ui text-center text-amber-200 mb-2">{banner}</p>}
          <BattleContainer
            gameState={gameState}
            selectedTeam={battle.you.map(spec => spec.id)}
            battleInfo={{
              type: 'link',
              online: true,
              playerSpecs: battle.you,
              aiTeamSpec: battle.foe,
              aiConfig: { optimalChance: 0, switchBehavior: 'never' },
              syncYou: battle.syncYou,
              syncFoe: battle.syncFoe,
            }}
            onBattleEnd={({ won }) => finish(won ? 'You won the battle!' : 'Your friend won this one.')}
            link={{
              locked: !!banner,
              sendAction,
              onReady: (api) => { playRef.current = api.play },
            }}
          />
        </div>
      )}

      {phase === 'done' && (
        <div className="text-center mt-10">
          <p className="font-game text-3xl text-amber-300 mb-4">{outcome}</p>
          <p className="font-ui text-slate-400 mb-6">Nothing was saved from this fight. Your island story is unchanged.</p>
          <button type="button" onClick={leave} className="min-h-12 px-6 rounded-xl bg-slate-700 text-white font-ui font-bold uppercase cursor-pointer">Back to title</button>
        </div>
      )}
    </div>
  )
}
