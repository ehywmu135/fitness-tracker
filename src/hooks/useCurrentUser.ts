import { useSyncExternalStore } from 'react'

const STORAGE_KEY = 'fitness_current_user_id'

// One shared value for the whole app. Every screen reads the same thing, so a
// screen that mounts early can never overwrite the choice made on another one.
const listeners = new Set<() => void>()

function read(): number | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? Number(stored) : null
  } catch {
    return null
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  window.addEventListener('storage', listener)
  return () => {
    listeners.delete(listener)
    window.removeEventListener('storage', listener)
  }
}

function setUserId(id: number | null) {
  try {
    if (id === null) localStorage.removeItem(STORAGE_KEY)
    else localStorage.setItem(STORAGE_KEY, String(id))
  } catch {
    // storage unavailable — nothing to persist
  }
  listeners.forEach((l) => l())
}

export function useCurrentUser() {
  const userId = useSyncExternalStore(subscribe, read)
  return { userId, setUserId }
}
