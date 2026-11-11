import { useLiveQuery } from 'dexie-react-hooks'
import { useNavigate, useParams } from 'react-router-dom'
import { db } from '../db'
import { useCurrentUser } from '../hooks/useCurrentUser'
import { sessionProgram, useProgram } from '../hooks/useProgram'

export default function WeekPage() {
  const { weekId } = useParams<{ weekId: string }>()
  const navigate = useNavigate()
  const { userId } = useCurrentUser()

  const week = useLiveQuery(() => db.weeks.get(Number(weekId)), [weekId])
  const program = useProgram()
  const sessions = useLiveQuery(
    async () =>
      program
        ? (await db.sessions.where('weekId').equals(Number(weekId)).sortBy('sessionNumber')).filter(
            (s) => sessionProgram(s) === program
          )
        : undefined,
    [weekId, program]
  )
  const exercises = useLiveQuery(() => db.exercises.toArray())
  const setLogs = useLiveQuery(
    () => (userId ? db.setLogs.where('userId').equals(userId).toArray() : []),
    [userId]
  )

  if (!week || !sessions || !exercises || !setLogs) return null

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

  return (
    <div className="pb-24">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-6 pb-4">
        <button onClick={() => navigate(-1)} className="text-gray-400 p-1">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <h1 className="text-teal-400 text-lg font-bold">שבוע {week.weekNumber}</h1>
        <div className="w-8" />
      </div>

      {/* Session cards */}
      <div className="px-4 flex flex-col gap-4">
        {sessions.map((session) => {
          const pct = sessionCompletion(session.id)
          const exs = exercises.filter((e) => e.sessionId === session.id)
          const totalSets = exs.reduce((a, e) => a + e.targetSets, 0)

          return (
            <button
              key={session.id}
              onClick={() => navigate(`/sessions/${session.id}`)}
              className="w-full bg-[#1e1e1e] rounded-2xl p-4 text-right border border-[#2a2a2a] active:scale-95 transition-transform"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex flex-col gap-1">
                  {pct === 100 && (
                    <span className="text-teal-400 text-xs font-semibold">✓ הושלם</span>
                  )}
                  <span className="text-white font-bold text-base">{session.name}</span>
                  {session.focus && <span className="text-teal-400 text-sm">{session.focus}</span>}
                  <span className="text-gray-400 text-sm">
                    {exs.length} תרגילים · {totalSets} סטים · {session.estimatedMinutes} דקות
                  </span>
                </div>
                <svg
                  width="20" height="20" viewBox="0 0 24 24" fill="none"
                  stroke={pct === 100 ? '#2dd4bf' : '#555'} strokeWidth="2"
                  className="flex-shrink-0 mt-1"
                >
                  <path d="M9 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>

              {/* Progress bar */}
              {pct > 0 && pct < 100 && (
                <div className="mt-3 h-1 bg-[#333] rounded-full overflow-hidden">
                  <div className="h-full bg-teal-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
