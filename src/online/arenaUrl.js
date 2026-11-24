// The room server. The static site does not need a build-time env var.
// A local test can still pass ?arena=http://127.0.0.1:8787

export const DEFAULT_ARENA_URL = 'https://creature-clash-rooms.onrender.com'

export function toWebSocketUrl(httpUrl) {
  const http = String(httpUrl || '').replace(/\/$/, '')
  if (http.startsWith('https://')) return `wss://${http.slice('https://'.length)}`
  if (http.startsWith('http://')) return `ws://${http.slice('http://'.length)}`
  return http
}

export function arenaHttpUrl() {
  if (typeof window !== 'undefined') {
    const fromQuery = new URLSearchParams(window.location.search).get('arena')
    if (fromQuery) return fromQuery.replace(/\/$/, '')
  }
  const configured = import.meta.env?.VITE_BATTLE_SERVER_URL
  return String(configured || DEFAULT_ARENA_URL).replace(/\/$/, '')
}

export function arenaWsUrl() {
  return toWebSocketUrl(arenaHttpUrl())
}
