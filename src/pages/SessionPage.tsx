import { useLiveQuery } from 'dexie-react-hooks'
import { useNavigate, useParams } from 'react-router-dom'
import { db } from '../db'
import { useCurrentUser } from '../hooks/useCurrentUser'

export default function SessionPage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const navigate = useNavigate()
  const { userId } = useCurrentUser()

  const session = useLiveQuery(() => db.sessions.get(Number(sessionId)), [sessionId])
  const exercises = useLiveQuery(
    () =>
      db.exercises
        .where('sessionId')
        .equals(Number(sessionId))
        .sortBy('orderIndex'),
    [sessionId]
  )
  const setLogs = useLiveQuery(
    () => (userId ? db.setLogs.where('userId').equals(userId).toArray() : []),
    [userId]
  )

  if (!session || !exercises || !setLogs) return null

  const loggedSet = new Set(setLogs.map((s) => `${s.exerciseId}-${s.setNumber}`))

  function isExerciseDone(exId: number, targetSets: number) {
    for (let i = 1; i <= targetSets; i++) {
      if (!loggedSet.has(`${exId}-${i}`)) return false
    }
    return true
  }

  const totalSets = exercises.reduce((a, e) => a + e.targetSets, 0)
  const doneSets = exercises.filter((e) => isExerciseDone(e.id, e.targetSets)).length

  return (
    <div className="pb-24">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-6 pb-2">
        <button onClick={() => navigate(-1)} className="text-gray-400 p-1">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <h1 className="text-teal-400 text-lg font-bold">{session.name}</h1>
        <div className="w-8" />
      </div>

      {/* Summary card */}
      <div className="mx-4 mb-4 bg-[#1e1e1e] rounded-2xl p-4 text-right border border-[#2a2a2a]">
        <p className="text-white font-bold text-base">{session.name}</p>
        {session.focus && <p className="text-teal-400 text-sm mt-0.5">{session.focus}</p>}
        <p className="text-gray-400 text-sm mt-1">
          {exercises.length} תרגילים · {totalSets} סטים · {session.estimatedMinutes} דקות
        </p>
        <p className="text-teal-400 text-sm mt-1 font-semibold">
          {doneSets}/{exercises.length} תרגילים הושלמו
        </p>
      </div>

      {/* Exercise list */}
      <div className="px-4 flex flex-col gap-3">
        {exercises.map((ex) => {
          const done = isExerciseDone(ex.id, ex.targetSets)
          return (
            <button
              key={ex.id}
              onClick={() => navigate(`/exercises/${ex.id}`)}
              className="w-full bg-[#1e1e1e] rounded-2xl p-4 border border-[#2a2a2a] active:scale-95 transition-transform"
            >
              <div className="flex items-center justify-between gap-3">
                {/* Left: back arrow */}
                <svg
                  width="18" height="18" viewBox="0 0 24 24" fill="none"
                  stroke={done ? '#2dd4bf' : '#555'} strokeWidth="2"
                  className="flex-shrink-0"
                >
                  <path d="M9 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>

                {/* Middle: exercise image */}
                <div className="w-14 h-10 rounded-lg bg-[#2a2a2a] flex-shrink-0 overflow-hidden flex items-center justify-center">
                  {ex.imageUrl ? (
                    <img src={ex.imageUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={done ? '#2dd4bf' : '#555'} strokeWidth="1.5">
                      <circle cx="12" cy="8" r="4" />
                      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                    </svg>
                  )}
                </div>

                {/* Right: text */}
                <div className="flex-1 text-right">
                  <p className={`font-semibold text-sm leading-tight ${done ? 'text-teal-400' : 'text-white'}`}>
                    {ex.name}
                  </p>
                  <p className="text-gray-500 text-xs mt-0.5">
                    {ex.targetSets} סטים
                    {ex.repMin ? ` · ⁦${ex.repMin}–${ex.targetReps}⁩ חזרות` : ''} · {ex.muscleGroup}
                  </p>
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
