// The room server address. Production has a default. A local test can pass ?arena=.

const DEFAULT_URL = 'https://battle-arena-rooms.onrender.com'

export function arenaHttpUrl() {
  if (typeof window !== 'undefined') {
    const fromQuery = new URLSearchParams(window.location.search).get('arena')
    if (fromQuery) return fromQuery.replace(/\/$/, '')
  }
  const configured = import.meta.env.VITE_BATTLE_SERVER_URL || DEFAULT_URL
  return String(configured).replace(/\/$/, '')
}

export function arenaWsUrl() {
  const http = arenaHttpUrl()
  if (http.startsWith('https://')) return `wss://${http.slice('https://'.length)}`
  if (http.startsWith('http://')) return `ws://${http.slice('http://'.length)}`
  return http
}
