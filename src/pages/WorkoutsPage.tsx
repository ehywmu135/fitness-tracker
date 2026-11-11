import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useNavigate } from 'react-router-dom'
import { db, createNewWeek } from '../db'
import { useCurrentUser } from '../hooks/useCurrentUser'
import { sessionProgram, useProgram } from '../hooks/useProgram'
import BodyCard from '../components/BodyCard'

function CompletionCircle({ pct }: { pct: number }) {
  const r = 20
  const circ = 2 * Math.PI * r
  const dash = (pct / 100) * circ
  return (
    <svg width="52" height="52" viewBox="0 0 52 52">
      <circle cx="26" cy="26" r={r} fill="none" stroke="#2a2a2a" strokeWidth="3" />
      <circle
        cx="26" cy="26" r={r} fill="none" stroke="#2dd4bf" strokeWidth="3"
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        transform="rotate(-90 26 26)"
      />
      <text x="26" y="31" textAnchor="middle" fill="white" fontSize="11" fontWeight="600">
        {pct}%
      </text>
    </svg>
  )
}

export default function WorkoutsPage() {
  const { userId } = useCurrentUser()
  const navigate = useNavigate()
  const [adding, setAdding] = useState(false)

  const weeks = useLiveQuery(() =>
    db.weeks.toArray().then((ws) => ws.sort((a, b) => a.weekNumber - b.weekNumber))
  )
  const program = useProgram()
  // Each user sees only the sessions of their own program
  const sessions = useLiveQuery(
    async () => (program ? db.sessions.filter((s) => sessionProgram(s) === program).toArray() : undefined),
    [program]
  )
  const exercises = useLiveQuery(() => db.exercises.toArray())
  const setLogs = useLiveQuery(
    () => (userId ? db.setLogs.where('userId').equals(userId).toArray() : []),
    [userId]
  )

  if (!weeks || !sessions || !exercises || !setLogs) return null

  const loggedSet = new Set(setLogs.map((s) => `${s.exerciseId}-${s.setNumber}`))

  function isExerciseDone(exId: number, targetSets: number) {
    for (let i = 1; i <= targetSets; i++) {
      if (!loggedSet.has(`${exId}-${i}`)) return false
    }
    return true
  }

  function sessionCompletion(sessionId: number) {
    const exs = exercises!.filter((e) => e.sessionId === sessionId)
    if (!exs.length) return 0
    const done = exs.filter((e) => isExerciseDone(e.id, e.targetSets)).length
    return Math.round((done / exs.length) * 100)
  }

  function weekCompletion(weekId: number) {
    const sess = sessions!.filter((s) => s.weekId === weekId)
    if (!sess.length) return 0
    const pcts = sess.map((s) => sessionCompletion(s.id))
    return Math.round(pcts.reduce((a, b) => a + b, 0) / pcts.length)
  }

  async function handleAddWeek() {
    setAdding(true)
    await createNewWeek()
    setAdding(false)
  }

  return (
    <div className="pb-24">
      <div className="px-4 pt-6 pb-4">
        <h1 className="text-teal-400 text-xl font-bold text-center">תוכנית האימונים</h1>
      </div>

      {program === 'ohad' && userId && <BodyCard userId={userId} />}

      {/* Vertical timeline + week cards */}
      <div className="relative px-4 flex flex-col gap-4">
        {/* Timeline line */}
        <div className="absolute left-[25px] top-2 bottom-2 w-0.5 bg-[#2a2a2a]" />

        {weeks.map((week) => {
          const weekSessions = sessions.filter((s) => s.weekId === week.id)
          const pct = weekCompletion(week.id)
          const allDone = pct === 100

          return (
            <div key={week.id} className="flex items-center gap-3">
              {/* Timeline dot */}
              <div className={`relative z-10 ml-auto flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center
                ${allDone ? 'bg-teal-400 border-teal-400' : 'bg-[#121212] border-[#555]'}`}
                style={{ order: 2 }}
              >
                {allDone && (
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M2 5l2.5 2.5L8 2.5" stroke="black" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>

              {/* Week card */}
              <button
                onClick={() => navigate(`/workouts/${week.id}`)}
                className="flex-1 bg-[#1e1e1e] rounded-2xl p-4 text-right active:scale-95 transition-transform border border-[#2a2a2a]"
                style={{ order: 1 }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex flex-col items-start gap-2">
                    <span className="text-white font-bold text-base">שבוע {week.weekNumber}</span>
                    <div className="flex gap-2">
                      {weekSessions.map((sess) => {
                        const sp = sessionCompletion(sess.id)
                        return (
                          <div key={sess.id} className={`w-6 h-6 rounded-full border-2 flex items-center justify-center
                            ${sp === 100 ? 'bg-teal-400 border-teal-400' : 'bg-transparent border-[#444]'}`}>
                            {sp === 100 && (
                              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                                <path d="M2 5l2.5 2.5L8 2.5" stroke="black" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                  <CompletionCircle pct={pct} />
                </div>
              </button>
            </div>
          )
        })}
      </div>

      {/* Add new week button */}
      <div className="px-4 mt-6">
        <button
          onClick={handleAddWeek}
          disabled={adding}
          className="w-full py-4 border-2 border-dashed border-[#2a2a2a] rounded-2xl text-gray-400 text-sm font-semibold flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-50"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14" strokeLinecap="round" />
          </svg>
          {adding ? 'יוצר שבוע...' : 'הוסף שבוע חדש'}
        </button>
      </div>
    </div>
  )
}
