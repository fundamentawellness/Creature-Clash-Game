// Private battle rooms. One short code, two kids, no accounts.
import http from 'node:http'
import { WebSocketServer } from 'ws'
import { createArena, normalizeCode } from './battleRoom.js'

const PORT = Number(process.env.PORT) || 8787
const ALLOWED = (process.env.ALLOWED_ORIGINS || [
  'https://creature-clash.onrender.com',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:4173',
  'http://127.0.0.1:4173',
].join(',')).split(',').map(origin => origin.trim()).filter(Boolean)

const arena = createArena()
const sockets = new Map()

function originOk(origin) {
  if (!origin) return false
  return ALLOWED.includes(origin)
}

function send(socket, msg) {
  if (socket?.readyState === 1) socket.send(JSON.stringify(msg))
}

function attach(code, seat, socket) {
  socket.roomCode = code
  socket.seat = seat
  const key = `${code}:${seat}`
  const previous = sockets.get(key)
  if (previous && previous !== socket) {
    previous.replaced = true
    previous.close()
  }
  sockets.set(key, socket)
}

function emit(code, seat, msg) {
  send(sockets.get(`${code}:${seat}`), msg)
}

const server = http.createServer((req, res) => {
  const origin = req.headers.origin
  if (origin && originOk(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin)
    res.setHeader('Vary', 'Origin')
  }
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
    res.statusCode = 204
    res.end()
    return
  }
  if (req.url === '/' || req.url === '/health') {
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ ok: true }))
    return
  }
  res.statusCode = 404
  res.end('Not found')
})

server.on('error', (error) => console.error('Room server error', error))
process.on('unhandledRejection', (error) => console.error('Room server rejection', error))

const wss = new WebSocketServer({ server })

function handleMessage(socket, msg) {
  if (msg.t === 'create') {
    const opened = arena.create({ name: msg.name, team: msg.team, normalize: !!msg.normalize })
    if (opened.error) return send(socket, { t: 'error', text: opened.error })
    socket.token = opened.token
    attach(opened.code, 'host', socket)
    send(socket, { t: 'room', code: opened.code, token: opened.token, seat: 'host' })
    return
  }
  if (msg.t === 'join') {
    const joined = arena.join(msg.code, { name: msg.name, team: msg.team })
    if (joined.error) return send(socket, { t: 'error', text: joined.error })
    socket.token = joined.token
    attach(joined.code, 'guest', socket)
    send(socket, { t: 'room', code: joined.code, token: joined.token, seat: 'guest' })
    for (const start of joined.start) emit(joined.code, start.seat, start)
    return
  }
  if (msg.t === 'reconnect') {
    const back = arena.resume(msg.token)
    if (back.error) return send(socket, { t: 'error', text: back.error })
    socket.token = msg.token
    attach(back.start?.code || normalizeCode(msg.code), back.seat, socket)
    send(socket, { t: 'back', ...back })
    const other = back.seat === 'host' ? 'guest' : 'host'
    emit(socket.roomCode, other, { t: 'resumed', text: 'Your friend is back.' })
    return
  }
  if (msg.t === 'action') {
    const acted = arena.act(socket.token, msg.action)
    if (acted?.error) return send(socket, { t: 'error', text: acted.error })
    for (const note of acted?.turns || []) emit(socket.roomCode, note.seat, note.msg)
  }
}

wss.on('connection', (socket, req) => {
  if (!originOk(req.headers.origin)) {
    socket.close(4003, 'origin')
    return
  }
  socket.on('error', () => {})
  socket.on('message', (raw) => {
    let msg
    try { msg = JSON.parse(raw.toString()) } catch { return }
    try {
      handleMessage(socket, msg)
    } catch (error) {
      console.error('Room message failed', error)
      send(socket, { t: 'error', text: 'The arena hit a snag. Try the room again.' })
    }
  })

  socket.on('close', () => {
    if (socket.replaced || !socket.token) return
    const dropped = arena.drop(socket.token)
    if (!dropped) return
    sockets.delete(`${dropped.code}:${socket.seat}`)
    emit(dropped.code, dropped.other, {
      t: 'paused',
      text: 'Your friend dropped. Waiting for them to come back.',
    })
  })
})

setInterval(() => {
  for (const note of arena.tick()) emit(note.code, note.seat, note.msg)
}, 1000)

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Battle rooms listening on ${PORT}`)
})
