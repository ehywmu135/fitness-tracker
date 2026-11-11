import { useEffect, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useNavigate, useParams } from 'react-router-dom'
import { db, type SetLog } from '../db'
import { useCurrentUser } from '../hooks/useCurrentUser'
import { sessionProgram } from '../hooks/useProgram'
import { RestStartButton, RestTimerBar } from '../timer/RestTimerBar'
import { startRest } from '../timer/restTimer'

interface SetRowProps {
  setNumber: number
  log: SetLog | undefined
  prevLog: SetLog | undefined
  targetReps: number
  onSave: (field: 'weightKg' | 'reps' | 'rir', value: string) => void
}

function SetRow({ setNumber, log, prevLog, targetReps, onSave }: SetRowProps) {
  const [weight, setWeight] = useState(log?.weightKg != null ? String(log.weightKg) : '')
  const [reps, setReps] = useState(log?.reps != null ? String(log.reps) : '')
  const [rir, setRir] = useState(log?.rir != null ? String(log.rir) : '')

  // Sync local state only when the log is first created (undefined → id)
  useEffect(() => {
    setWeight(log?.weightKg != null ? String(log.weightKg) : '')
    setReps(log?.reps != null ? String(log.reps) : '')
    setRir(log?.rir != null ? String(log.rir) : '')
  }, [log?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const isComplete = log?.weightKg != null && log?.reps != null && log?.rir != null
  const prevWeight = prevLog?.weightKg != null ? String(prevLog.weightKg) : undefined

  return (
    <div className="flex items-center gap-2 py-3 border-b border-[#2a2a2a] last:border-0">
      {/* Set circle — fills with checkmark when all 3 fields are saved */}
      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
        ${isComplete ? 'bg-teal-400 text-black' : 'border-2 border-teal-400 text-teal-400 bg-transparent'}`}>
        {isComplete ? (
          <svg width="12" height="12" viewBox="0 0 10 10" fill="none">
            <path d="M2 5l2.5 2.5L8 2.5" stroke="black" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : setNumber}
      </div>

      {/* Weight — saves to DB on blur */}
      <div className="flex-1 flex flex-col items-center">
        <input
          type="number"
          inputMode="decimal"
          value={weight}
          placeholder={prevWeight ?? '—'}
          onChange={(e) => setWeight(e.target.value)}
          onBlur={() => onSave('weightKg', weight)}
          className="w-full text-center bg-[#2a2a2a] rounded-lg py-2 text-white text-sm font-semibold outline-none focus:ring-1 focus:ring-teal-400 placeholder:text-[#555]"
        />
        <span className="text-gray-500 text-xs mt-1">ק"ג</span>
      </div>

      {/* Reps */}
      <div className="flex-1 flex flex-col items-center">
        <input
          type="number"
          inputMode="numeric"
          value={reps}
          placeholder={String(targetReps)}
          onChange={(e) => setReps(e.target.value)}
          onBlur={() => onSave('reps', reps)}
          className="w-full text-center bg-[#2a2a2a] rounded-lg py-2 text-white text-sm font-semibold outline-none focus:ring-1 focus:ring-teal-400 placeholder:text-[#555]"
        />
        <span className="text-gray-500 text-xs mt-1">חזרות</span>
      </div>

      {/* RIR */}
      <div className="flex-1 flex flex-col items-center">
        <input
          type="number"
          inputMode="numeric"
          value={rir}
          placeholder="—"
          onChange={(e) => setRir(e.target.value)}
          onBlur={() => onSave('rir', rir)}
          className="w-full text-center bg-[#2a2a2a] rounded-lg py-2 text-white text-sm font-semibold outline-none focus:ring-1 focus:ring-teal-400 placeholder:text-[#555]"
        />
        <span className="text-gray-500 text-xs mt-1">RIR</span>
      </div>
    </div>
  )
}

export default function ExercisePage() {
  const { exerciseId } = useParams<{ exerciseId: string }>()
  const navigate = useNavigate()
  const { userId } = useCurrentUser()

  const exercise = useLiveQuery(() => db.exercises.get(Number(exerciseId)), [exerciseId])

  const siblings = useLiveQuery(
    () =>
      exercise
        ? db.exercises.where('sessionId').equals(exercise.sessionId).sortBy('orderIndex')
        : [],
    [exercise?.sessionId]
  )

  const setLogs = useLiveQuery(
    () =>
      userId
        ? db.setLogs.where('[exerciseId+userId]').equals([Number(exerciseId), userId]).toArray()
        : [],
    [exerciseId, userId]
  )

  const previousWeekLogs = useLiveQuery(async () => {
    if (!userId || !exercise) return []
    const currentSession = await db.sessions.get(exercise.sessionId)
    if (!currentSession) return []
    const currentWeek = await db.weeks.get(currentSession.weekId)
    if (!currentWeek || currentWeek.weekNumber <= 1) return []
    const allWeeks = await db.weeks.toArray()
    const prevWeek = allWeeks.find((w) => w.weekNumber === currentWeek.weekNumber - 1)
    if (!prevWeek) return []
    const prevSessions = await db.sessions.where('weekId').equals(prevWeek.id).toArray()
    const prevSession = prevSessions.find(
      (s) =>
        s.sessionNumber === currentSession.sessionNumber &&
        sessionProgram(s) === sessionProgram(currentSession)
    )
    if (!prevSession) return []
    const prevExercises = await db.exercises.where('sessionId').equals(prevSession.id).toArray()
    const prevExercise = prevExercises.find((e) => e.orderIndex === exercise.orderIndex)
    if (!prevExercise) return []
    return db.setLogs.where('[exerciseId+userId]').equals([prevExercise.id, userId]).toArray()
  }, [exercise?.id, userId])

  if (!exercise || !siblings || setLogs === undefined) return null

  const myIndex = siblings.findIndex((e) => e.id === exercise.id)
  const total = siblings.length
  const prevEx = siblings[myIndex - 1]
  const nextEx = siblings[myIndex + 1]

  function getLog(setNum: number) {
    return (setLogs ?? []).find((l) => l.setNumber === setNum)
  }

  function getPrevLog(setNum: number) {
    return (previousWeekLogs ?? []).find((l) => l.setNumber === setNum)
  }

  async function handleSave(setNumber: number, field: 'weightKg' | 'reps' | 'rir', value: string) {
    if (!userId) return
    const num = value === '' ? null : Number(value)
    const existing = getLog(setNumber)
    // Start the rest timer at the moment a set becomes complete (all 3 fields filled)
    const before = { weightKg: existing?.weightKg ?? null, reps: existing?.reps ?? null, rir: existing?.rir ?? null }
    const after = { ...before, [field]: num }
    const wasComplete = before.weightKg != null && before.reps != null && before.rir != null
    const nowComplete = after.weightKg != null && after.reps != null && after.rir != null
    if (!wasComplete && nowComplete) startRest(exercise!.restSeconds ?? 90)
    if (existing?.id) {
      await db.setLogs.update(existing.id, { [field]: num })
    } else {
      await db.setLogs.add({
        exerciseId: exercise!.id,
        userId,
        setNumber,
        weightKg: field === 'weightKg' ? num : null,
        reps: field === 'reps' ? num : null,
        rir: field === 'rir' ? num : null,
        loggedAt: new Date().toISOString(),
      })
    }
  }

  const allSetsLogged = Array.from({ length: exercise.targetSets }, (_, i) => i + 1).every((n) => {
    const l = getLog(n)
    return l?.weightKg != null && l?.reps != null && l?.rir != null
  })

  return (
    <div className="min-h-dvh bg-[#121212] flex flex-col pb-32">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-6 pb-4">
        {/* Next exercise (left = forward in RTL) */}
        <button
          onClick={() => nextEx ? navigate(`/exercises/${nextEx.id}`, { replace: true }) : navigate(-1)}
          className="text-teal-400 p-1"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {/* Center: back link + exercise counter */}
        <div className="flex flex-col items-center gap-0.5">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1 text-gray-500 text-xs"
          >
            חזרה לאימון
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <span className="text-teal-400 font-bold text-base">תרגיל {myIndex + 1}/{total}</span>
        </div>

        {/* Prev exercise (right = backward in RTL) */}
        <button
          onClick={() => prevEx ? navigate(`/exercises/${prevEx.id}`, { replace: true }) : navigate(-1)}
          className="text-gray-400 p-1"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      {/* Exercise name */}
      <div className="px-4 pb-4 text-right">
        <h2 className={`text-xl font-bold ${allSetsLogged ? 'text-teal-400' : 'text-white'}`}>
          {exercise.name}
        </h2>
        <p className="text-gray-400 text-sm mt-1">{exercise.muscleGroup}</p>
      </div>

      {/* Exercise image */}
      <div className="mx-4 mb-6 h-44 bg-[#1e1e1e] rounded-2xl overflow-hidden border border-[#2a2a2a] flex items-center justify-center">
        {exercise.imageUrl ? (
          <img src={exercise.imageUrl} alt={exercise.name} className="w-full h-full object-cover" />
        ) : (
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="1.5">
            <circle cx="12" cy="8" r="4" />
            <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
          </svg>
        )}
      </div>

      {/* Set grid */}
      <div className="mx-4 bg-[#1e1e1e] rounded-2xl px-4 border border-[#2a2a2a]">
        <div className="flex items-center gap-2 pb-2 pt-3 border-b border-[#333]">
          <div className="w-8 flex-shrink-0" />
          <div className="flex-1 text-center text-gray-500 text-xs">ק"ג</div>
          <div className="flex-1 text-center text-gray-500 text-xs">חזרות</div>
          <div className="flex-1 text-center text-gray-500 text-xs">RIR</div>
        </div>

        {Array.from({ length: exercise.targetSets }, (_, i) => i + 1).map((setNum) => (
          <SetRow
            key={setNum}
            setNumber={setNum}
            log={getLog(setNum)}
            prevLog={getPrevLog(setNum)}
            targetReps={exercise.targetReps}
            onSave={(field, value) => handleSave(setNum, field, value)}
          />
        ))}
      </div>

      {(previousWeekLogs ?? []).length > 0 && (
        <p className="text-center text-gray-600 text-xs mt-3 px-4">
          הספרה האפורה = משקל שבוע שעבר
        </p>
      )}

      <RestStartButton seconds={exercise.restSeconds ?? 90} />

      {/* Done / next button */}
      {allSetsLogged && (
        <div className="px-4 mt-6">
          <button
            onClick={() => nextEx ? navigate(`/exercises/${nextEx.id}`, { replace: true }) : navigate(-1)}
            className="w-full py-4 bg-teal-400 text-black font-bold rounded-2xl text-base active:scale-95 transition-transform"
          >
            {nextEx ? 'לתרגיל הבא ←' : '✓ סיום אימון'}
          </button>
        </div>
      )}

      <RestTimerBar />
    </div>
  )
}
