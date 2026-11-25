// Music and effects. Effects are short tones. The two songs are original
// loops written for this game (see docs/AUDIO.md). Music and effects use
// separate volume controls, and a song keeps playing through sound effects.

const TYPE_TONE = {
  fire: { freq: 320, type: 'triangle' },
  water: { freq: 480, type: 'sine' },
  grass: { freq: 360, type: 'triangle' },
  electric: { freq: 640, type: 'square' },
  rock: { freq: 180, type: 'triangle' },
  ground: { freq: 140, type: 'sine' },
  poison: { freq: 240, type: 'triangle' },
  normal: { freq: 400, type: 'sine' },
}

const state = {
  ctx: null,
  musicGain: null,
  sfxGain: null,
  unlocked: false,
  music: 0.32,
  sfx: 0.7,
  muted: false,
  mode: 'map',
  playingTrack: null,
  musicSource: null,
  musicVoice: null,
  buffers: {},
  lastCue: '',
}

export function musicTrackFor(mode) {
  if (mode === 'battle' || mode === 'champion') return 'clash'
  return 'voyage'
}

export function shouldKeepMusic(playingTrack, mode, isPlaying) {
  return !!isPlaying && playingTrack === musicTrackFor(mode)
}

export function defaultAudioSettings() {
  const mobile = typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)')?.matches
  return { music: mobile ? 0 : 0.32, sfx: mobile ? 0.4 : 0.7, muted: false }
}

export function audioStatus() {
  return {
    unlocked: state.unlocked,
    muted: state.muted,
    music: state.music,
    sfx: state.sfx,
    mode: state.mode,
    track: state.playingTrack,
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

function ensureGraph() {
  const ctx = context()
  if (!ctx || state.musicGain) return ctx
  state.musicGain = ctx.createGain()
  state.sfxGain = ctx.createGain()
  state.musicGain.connect(ctx.destination)
  state.sfxGain.connect(ctx.destination)
  state.musicGain.gain.value = 0
  state.sfxGain.gain.value = 0
  return ctx
}

function updateBuses() {
  const ctx = ensureGraph()
  if (!ctx) return
  const now = ctx.currentTime
  const musicLevel = state.unlocked && !state.muted ? state.music * 0.2 : 0
  const sfxLevel = state.unlocked && !state.muted ? state.sfx : 0
  state.musicGain.gain.cancelScheduledValues(now)
  state.sfxGain.gain.cancelScheduledValues(now)
  state.musicGain.gain.setValueAtTime(state.musicGain.gain.value, now)
  state.sfxGain.gain.setValueAtTime(state.sfxGain.gain.value, now)
  state.musicGain.gain.linearRampToValueAtTime(musicLevel, now + 0.08)
  state.sfxGain.gain.linearRampToValueAtTime(sfxLevel, now + 0.05)
}

export function applyAudioSettings(settings) {
  if (!settings) return
  state.music = Number.isFinite(Number(settings.music)) ? Number(settings.music) : state.music
  state.sfx = Number.isFinite(Number(settings.sfx)) ? Number(settings.sfx) : state.sfx
  state.muted = !!settings.muted
  updateBuses()
  if (state.unlocked && !state.muted && state.music > 0 && !state.musicSource) startMusic(state.mode)
}

export function unlockAudio() {
  const ctx = ensureGraph()
  if (!ctx) return
  if (ctx.state === 'suspended') ctx.resume()
  const was = state.unlocked
  state.unlocked = true
  updateBuses()
  if (!was || !state.musicSource) startMusic(state.mode)
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

function envGain(peak, seconds) {
  const ctx = context()
  const gain = ctx.createGain()
  const now = ctx.currentTime
  gain.gain.setValueAtTime(0.0001, now)
  gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), now + 0.02)
  gain.gain.exponentialRampToValueAtTime(0.0001, now + seconds)
  gain.connect(state.sfxGain)
  return gain
}

function tone({ freq = 440, seconds = 0.12, type = 'sine', peak = 0.08 }) {
  const ctx = ensureGraph()
  if (!ctx || !state.unlocked || state.muted || state.sfx <= 0) return
  const osc = ctx.createOscillator()
  osc.type = type
  osc.frequency.setValueAtTime(freq, ctx.currentTime)
  osc.connect(envGain(peak * state.sfx, seconds))
  osc.start()
  osc.stop(ctx.currentTime + seconds + 0.02)
}

function noise(seconds, peak) {
  const ctx = ensureGraph()
  if (!ctx || !state.unlocked || state.muted || state.sfx <= 0) return
  const length = Math.floor(ctx.sampleRate * seconds)
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / length)
  const source = ctx.createBufferSource()
  source.buffer = buffer
  source.connect(envGain(peak * state.sfx, seconds))
  source.start()
}

export function playCue(name, detail) {
  state.lastCue = name
  if (name === 'tap') return tone({ freq: 660, seconds: 0.05, type: 'square', peak: 0.03 })
  if (name === 'hit') return noise(0.08, 0.1)
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
    return tone({ freq: toneDef.freq, seconds: 0.1, type: toneDef.type, peak: 0.05 })
  }
  return tone({ freq: 440, seconds: 0.08, peak: 0.04 })
}

function addTone(data, rate, start, dur, freq, amp) {
  const n = Math.floor(dur * rate)
  const s0 = Math.floor(start * rate)
  for (let i = 0; i < n && s0 + i < data.length; i++) {
    const t = i / rate
    const attack = Math.min(1, i / (rate * 0.03))
    const release = Math.min(1, (n - i) / (rate * 0.08))
    data[s0 + i] += Math.sin(2 * Math.PI * freq * t) * amp * attack * release
  }
}

function renderSong(rate, song) {
  const beat = 60 / song.bpm
  const seconds = song.bars * 4 * beat
  const length = Math.floor(rate * seconds)
  const data = new Float32Array(length)
  song.chords.forEach((chord, index) => {
    const start = index * beat * 4
    chord.forEach((freq) => addTone(data, rate, start, beat * 4 * 0.98, freq, 0.045))
  })
  song.bass.forEach((freq, index) => {
    if (!freq) return
    addTone(data, rate, index * beat, beat * 0.9, freq, 0.07)
  })
  song.melody.forEach((note, index) => {
    if (!note) return
    addTone(data, rate, index * (beat / 2), beat * 0.42, note, 0.05)
  })
  const edge = Math.floor(rate * 0.02)
  for (let i = 0; i < edge; i++) {
    const g = i / edge
    data[i] *= g
    data[length - 1 - i] *= g
  }
  return { rate, data, seconds }
}

const SONGS = {
  voyage: {
    bpm: 104,
    bars: 4,
    chords: [
      [262, 330, 392],
      [196, 247, 294],
      [220, 262, 330],
      [175, 220, 262],
    ],
    bass: [131, 0, 131, 0, 98, 0, 98, 0, 110, 0, 110, 0, 87, 0, 131, 0],
    melody: [523, 0, 659, 784, 659, 523, 587, 0, 494, 0, 587, 659, 587, 523, 494, 0, 523, 659, 784, 880, 784, 659, 587, 523, 494, 440, 494, 523, 587, 523, 494, 0],
  },
  clash: {
    bpm: 120,
    bars: 4,
    chords: [
      [196, 247, 294],
      [147, 220, 294],
      [165, 208, 247],
      [131, 196, 262],
    ],
    bass: [98, 98, 0, 147, 73, 73, 0, 110, 82, 82, 0, 123, 65, 98, 131, 98],
    melody: [392, 494, 587, 494, 440, 392, 440, 494, 370, 440, 494, 587, 494, 440, 392, 0, 330, 392, 494, 587, 659, 587, 494, 440, 392, 370, 392, 440, 494, 392, 330, 0],
  },
}

function songBuffer(ctx, track) {
  if (state.buffers[track]) return state.buffers[track]
  const rendered = renderSong(ctx.sampleRate, SONGS[track] || SONGS.voyage)
  const buffer = ctx.createBuffer(1, rendered.data.length, rendered.rate)
  buffer.getChannelData(0).set(rendered.data)
  state.buffers[track] = buffer
  return buffer
}

function crossfadeTo(track) {
  const ctx = state.ctx
  const now = ctx.currentTime
  const voice = ctx.createGain()
  voice.gain.setValueAtTime(0.0001, now)
  voice.connect(state.musicGain)
  const source = ctx.createBufferSource()
  source.buffer = songBuffer(ctx, track)
  source.loop = true
  source.connect(voice)
  source.start()
  voice.gain.linearRampToValueAtTime(1, now + 0.45)
  if (state.musicSource && state.musicVoice) {
    const oldVoice = state.musicVoice
    const oldSource = state.musicSource
    oldVoice.gain.cancelScheduledValues(now)
    oldVoice.gain.setValueAtTime(oldVoice.gain.value, now)
    oldVoice.gain.linearRampToValueAtTime(0.0001, now + 0.4)
    oldSource.stop(now + 0.45)
  }
  state.musicSource = source
  state.musicVoice = voice
  state.playingTrack = track
}

export function startMusic(mode) {
  if (mode) state.mode = mode
  const track = musicTrackFor(state.mode)
  if (!state.unlocked || state.muted || state.music <= 0) return
  ensureGraph()
  updateBuses()
  if (shouldKeepMusic(state.playingTrack, state.mode, !!state.musicSource)) return
  crossfadeTo(track)
}

export function stopMusic() {
  if (!state.musicSource) return
  const now = state.ctx?.currentTime || 0
  try { state.musicSource.stop(now + 0.05) } catch { /* already stopped */ }
  state.musicSource = null
  state.musicVoice = null
  state.playingTrack = null
}
