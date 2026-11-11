import { adjustRest, formatTime, startRest, stopRest, useRestTimer } from './restTimer'

function ClockIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="13" r="8" />
      <path d="M12 9v4l2.5 2M9 2h6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// Shown under the sets: starts the rest manually (it also starts by itself when a set is completed)
export function RestStartButton({ seconds }: { seconds: number }) {
  const { remaining } = useRestTimer()
  if (remaining !== null) return null
  return (
    <button
      onClick={() => startRest(seconds)}
      className="mx-4 mt-3 py-3 rounded-2xl border border-[#2a2a2a] bg-[#1e1e1e] text-gray-300 text-sm font-semibold flex items-center justify-center gap-2 active:scale-95 transition-transform"
    >
      <ClockIcon />
      <span>טיימר מנוחה · {formatTime(seconds)}</span>
    </button>
  )
}

// Floating countdown at the bottom of the exercise screen
export function RestTimerBar() {
  const { remaining, total } = useRestTimer()
  if (remaining === null) return null

  const done = remaining === 0
  const pct = total > 0 ? Math.min(100, (remaining / total) * 100) : 0

  return (
    <div
      className="fixed bottom-0 inset-x-0 max-w-[430px] mx-auto px-3 z-50"
      style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 12px)' }}
    >
      <div
        className={`rounded-2xl border shadow-2xl overflow-hidden ${
          done ? 'bg-teal-400 border-teal-400 text-black' : 'bg-[#1a1a1a] border-[#333] text-white'
        }`}
      >
        {done ? (
          <button onClick={stopRest} className="w-full py-4 font-bold text-base">
            המנוחה הסתיימה — לסט הבא 💪
          </button>
        ) : (
          <>
            <div className="flex items-center justify-between gap-2 px-3 py-3">
              <button
                onClick={stopRest}
                className="px-3 py-2 rounded-xl bg-[#2a2a2a] text-gray-300 text-sm font-semibold"
              >
                דלג
              </button>
              <div className="flex flex-col items-center">
                <span className="text-gray-500 text-[11px] leading-none">מנוחה</span>
                <span className="text-teal-400 text-3xl font-bold tabular-nums leading-tight" dir="ltr">
                  {formatTime(remaining)}
                </span>
              </div>
              <div className="flex gap-1.5" dir="ltr">
                <button
                  onClick={() => adjustRest(-15)}
                  className="px-3 py-2 rounded-xl bg-[#2a2a2a] text-gray-300 text-sm font-semibold tabular-nums"
                >
                  −15
                </button>
                <button
                  onClick={() => adjustRest(30)}
                  className="px-3 py-2 rounded-xl bg-[#2a2a2a] text-gray-300 text-sm font-semibold tabular-nums"
                >
                  +30
                </button>
              </div>
            </div>
            <div className="h-1 bg-[#2a2a2a]" dir="ltr">
              <div className="h-full bg-teal-400 transition-[width] duration-300" style={{ width: `${pct}%` }} />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
