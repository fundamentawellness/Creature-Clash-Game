// Original music and effects, made with the browser's own audio.
// Nothing here is a recording, so there is no track to license.

const NOTES = {
  map: [262, 294, 330, 392, 330, 294, 349, 392],
  battle: [220, 262, 247, 294, 220, 330, 294, 262],
  champion: [330, 392, 494, 392, 440, 523, 494, 392],
}

const TYPE_TONE = {
  fire: { freq: 320, type: 'sawtooth' },
  water: { freq: 480, type: 'sine' },
  grass: { freq: 360, type: 'triangle' },
  electric: { freq: 720, type: 'square' },
  rock: { freq: 180, type: 'square' },
  ground: { freq: 140, type: 'sawtooth' },
  poison: { freq: 240, type: 'triangle' },
  normal: { freq: 400, type: 'triangle' },
}

const state = {
  ctx: null,
  unlocked: false,
  music: 0.45,
  sfx: 0.7,
  muted: false,
  mode: 'map',
  timer: null,
  step: 0,
  lastCue: '',
}

export function defaultAudioSettings() {
  const mobile = typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)')?.matches
  return { music: mobile ? 0 : 0.45, sfx: mobile ? 0.4 : 0.7, muted: false }
}

export function audioStatus() {
  return {
    unlocked: state.unlocked,
    muted: state.muted,
    music: state.music,
    sfx: state.sfx,
    mode: state.mode,
    lastCue: state.lastCue,
    context: state.ctx?.state || 'none',
  }
}

function context() {
  if (typeof window === 'undefined') return null
  const AudioCtx = window.AudioContext || window.webkitAudioContext
  if (!AudioCtx) return null
  if (!state.ctx) state.ctx = new AudioCtx()
  return state.ctx
}

export function applyAudioSettings(settings) {
  if (!settings) return
  state.music = Number(settings.music) || 0
  state.sfx = Number(settings.sfx) || 0
  state.muted = !!settings.muted
  if (state.unlocked) startMusic(state.mode)
}

export function unlockAudio() {
  const ctx = context()
  if (!ctx) return
  if (ctx.state === 'suspended') ctx.resume()
  state.unlocked = true
  startMusic(state.mode)
}

export function installAudio() {
  if (typeof window === 'undefined' || window.__arenaAudio) return
  window.__arenaAudio = audioStatus
  const onTap = (event) => {
    unlockAudio()
    if (event.type === 'pointerdown' && event.target?.closest?.('button')) playCue('tap')
  }
  window.addEventListener('pointerdown', onTap, true)
  window.addEventListener('click', onTap, true)
}

function envGain(ctx, peak, seconds) {
  const gain = ctx.createGain()
  const now = ctx.currentTime
  gain.gain.setValueAtTime(0.0001, now)
  gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), now + 0.02)
  gain.gain.exponentialRampToValueAtTime(0.0001, now + seconds)
  gain.connect(ctx.destination)
  return gain
}

function tone({ freq = 440, seconds = 0.12, type = 'sine', peak = 0.08 }) {
  const ctx = context()
  if (!ctx || !state.unlocked || state.muted || state.sfx <= 0) return
  const osc = ctx.createOscillator()
  osc.type = type
  osc.frequency.setValueAtTime(freq, ctx.currentTime)
  osc.connect(envGain(ctx, peak * state.sfx, seconds))
  osc.start()
  osc.stop(ctx.currentTime + seconds + 0.02)
}

function noise(seconds, peak) {
  const ctx = context()
  if (!ctx || !state.unlocked || state.muted || state.sfx <= 0) return
  const length = Math.floor(ctx.sampleRate * seconds)
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / length)
  const source = ctx.createBufferSource()
  source.buffer = buffer
  source.connect(envGain(ctx, peak * state.sfx, seconds))
  source.start()
}

export function playCue(name, detail) {
  state.lastCue = name
  if (name === 'tap') return tone({ freq: 660, seconds: 0.05, type: 'square', peak: 0.03 })
  if (name === 'hit') return noise(0.08, 0.12)
  if (name === 'miss') return tone({ freq: 280, seconds: 0.14, type: 'sine', peak: 0.05 })
  if (name === 'faint') return tone({ freq: 160, seconds: 0.28, type: 'triangle', peak: 0.07 })
  if (name === 'status') return tone({ freq: 520, seconds: 0.16, type: 'square', peak: 0.04 })
  if (name === 'catch') {
    ;[523, 659, 784].forEach((freq, index) => setTimeout(() => tone({ freq, seconds: 0.12, peak: 0.07 }), index * 90))
    return
  }
  if (name === 'level') {
    ;[523, 659, 784].forEach((freq, index) => setTimeout(() => tone({ freq, seconds: 0.16, peak: 0.07 }), index * 80))
    return
  }
  if (name === 'evolve') {
    ;[392, 494, 587, 784].forEach((freq, index) => setTimeout(() => tone({ freq, seconds: 0.18, peak: 0.07 }), index * 110))
    return
  }
  if (name === 'move') {
    const toneDef = TYPE_TONE[detail] || TYPE_TONE.normal
    return tone({ freq: toneDef.freq, seconds: 0.12, type: toneDef.type, peak: 0.06 })
  }
  return tone({ freq: 440, seconds: 0.08, peak: 0.04 })
}

function musicNote() {
  const ctx = context()
  if (!ctx || !state.unlocked || state.muted || state.music <= 0) return
  const pattern = NOTES[state.mode] || NOTES.map
  const freq = pattern[state.step % pattern.length]
  state.step += 1
  const osc = ctx.createOscillator()
  osc.type = state.mode === 'battle' ? 'square' : 'triangle'
  osc.frequency.setValueAtTime(freq, ctx.currentTime)
  osc.connect(envGain(ctx, 0.05 * state.music, 0.34))
  osc.start()
  osc.stop(ctx.currentTime + 0.36)
}

export function startMusic(mode) {
  if (mode) state.mode = mode
  if (state.timer) {
    clearInterval(state.timer)
    state.timer = null
  }
  if (!state.unlocked || state.muted || state.music <= 0) return
  musicNote()
  state.timer = setInterval(musicNote, state.mode === 'battle' ? 280 : 420)
}

export function stopMusic() {
  if (state.timer) clearInterval(state.timer)
  state.timer = null
}
