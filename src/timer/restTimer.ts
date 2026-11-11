import { useEffect, useState, useSyncExternalStore } from 'react'

// One rest timer for the whole app. It stores the END TIME (not a countdown),
// so it stays correct when the phone is locked or the app is in the background.
interface TimerState {
  endsAt: number // ms timestamp
  total: number // seconds, for the progress bar
}

const STORAGE_KEY = 'fitness_rest_timer'
const listeners = new Set<() => void>()
let state: TimerState | null = load()
let beeped = false

function load(): TimerState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const s = JSON.parse(raw) as TimerState
    return s.endsAt > Date.now() ? s : null
  } catch {
    return null
  }
}

function set(next: TimerState | null) {
  state = next
  try {
    if (next) localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    else localStorage.removeItem(STORAGE_KEY)
  } catch {
    // storage unavailable — timer still works in memory
  }
  listeners.forEach((l) => l())
}

// --- sound (best effort: iPhone only allows sound after the user touched the screen)
let audio: AudioContext | null = null
function unlockAudio() {
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctx) return
    if (!audio) audio = new Ctx()
    if (audio.state === 'suspended') void audio.resume()
  } catch {
    // no audio — the visual signal is enough
  }
}
if (typeof window !== 'undefined') {
  window.addEventListener('touchend', unlockAudio, { passive: true })
  window.addEventListener('click', unlockAudio)
}

function beep() {
  try {
    navigator.vibrate?.([200, 100, 200])
  } catch {
    // not supported
  }
  if (!audio || audio.state !== 'running') return
  const ctx = audio
  ;[0, 0.25, 0.5].forEach((offset) => {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.frequency.value = 880
    gain.gain.setValueAtTime(0.25, ctx.currentTime + offset)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + offset + 0.18)
    osc.connect(gain).connect(ctx.destination)
    osc.start(ctx.currentTime + offset)
    osc.stop(ctx.currentTime + offset + 0.2)
  })
}

export function startRest(seconds: number) {
  beeped = false
  set({ endsAt: Date.now() + seconds * 1000, total: seconds })
}

export function adjustRest(deltaSeconds: number) {
  if (!state) return
  const endsAt = Math.max(Date.now() + 1000, state.endsAt + deltaSeconds * 1000)
  beeped = false
  set({ endsAt, total: Math.max(state.total + deltaSeconds, 1) })
}

export function stopRest() {
  set(null)
}

function subscribe(l: () => void) {
  listeners.add(l)
  return () => {
    listeners.delete(l)
  }
}

const FINISHED_VISIBLE_MS = 6000

// remaining = seconds left (0 while showing "rest is over"); null = no timer
export function useRestTimer(): { remaining: number | null; total: number } {
  const s = useSyncExternalStore(subscribe, () => state)
  const [, tick] = useState(0)

  useEffect(() => {
    if (!s) return
    const id = setInterval(() => {
      const left = s.endsAt - Date.now()
      if (left <= 0 && !beeped) {
        beeped = true
        // Only make noise if it ended just now (not when reopening the app later)
        if (left > -3000) beep()
      }
      if (left <= -FINISHED_VISIBLE_MS) stopRest()
      else tick((n) => n + 1)
    }, 250)
    return () => clearInterval(id)
  }, [s])

  if (!s) return { remaining: null, total: 0 }
  return { remaining: Math.max(0, Math.ceil((s.endsAt - Date.now()) / 1000)), total: s.total }
}

export function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60)
  const sec = seconds % 60
  return `${m}:${String(sec).padStart(2, '0')}`
}
