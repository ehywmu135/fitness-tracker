import { useEffect, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useNavigate, useParams } from 'react-router-dom'
import LineChart from '../components/LineChart'
import { db, type SetLog } from '../db'
import { useCurrentUser } from '../hooks/useCurrentUser'
import { RestStartButton, RestTimerBar } from '../timer/RestTimerBar'
import { formatTime, startRest } from '../timer/restTimer'

type Field = 'weightKg' | 'reps' | 'rir'

// Estimated one-rep max (Epley) — lets us compare sets with different weight/reps
function e1rm(weight: number, reps: number) {
  return weight * (1 + reps / 30)
}

function fmtKg(n: number) {
  return Number.isInteger(n) ? String(n) : n.toFixed(1)
}

// A number range that always reads low–high (left to right), even inside Hebrew text
function range(low: number, high: number) {
  return `⁦${fmtKg(low)}–${fmtKg(high)}⁩`
}

interface SetRowProps {
  setNumber: number
  log: SetLog | undefined
  prevLog: SetLog | undefined
  repMin: number
  repMax: number
  isRecord: boolean
  onSave: (field: Field, value: string) => void
}

function SetRow({ setNumber, log, prevLog, repMin, repMax, isRecord, onSave }: SetRowProps) {
  const [weight, setWeight] = useState(log?.weightKg != null ? String(log.weightKg) : '')
  const [reps, setReps] = useState(log?.reps != null ? String(log.reps) : '')
  const [rir, setRir] = useState(log?.rir != null ? String(log.rir) : '')

  // When the saved log arrives (undefined → id), fill in saved values — but never
  // wipe a field the user is already typing in
  useEffect(() => {
    if (log?.weightKg != null) setWeight(String(log.weightKg))
    if (log?.reps != null) setReps(String(log.reps))
    if (log?.rir != null) setRir(String(log.rir))
  }, [log?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // For Ohad a set counts as done with weight + reps (RIR is optional)
  const isComplete = log?.weightKg != null && log?.reps != null
  const inputClass =
    'w-full text-center bg-[#2a2a2a] rounded-lg py-2.5 text-white text-base font-semibold outline-none focus:ring-1 focus:ring-teal-400 placeholder:text-[#555]'

  return (
    <div className="py-3 border-b border-[#2a2a2a] last:border-0">
      <div className="flex items-center gap-2">
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
          ${isComplete ? 'bg-teal-400 text-black' : 'border-2 border-teal-400 text-teal-400 bg-transparent'}`}>
          {isComplete ? (
            <svg width="12" height="12" viewBox="0 0 10 10" fill="none">
              <path d="M2 5l2.5 2.5L8 2.5" stroke="black" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : setNumber}
        </div>

        <div className="flex-1">
          <input
            type="number" inputMode="decimal" value={weight}
            placeholder={prevLog?.weightKg != null ? fmtKg(prevLog.weightKg) : '—'}
            onChange={(e) => setWeight(e.target.value)}
            onBlur={() => onSave('weightKg', weight)}
            className={inputClass}
          />
        </div>
        <div className="flex-1">
          <input
            type="number" inputMode="numeric" value={reps}
            placeholder={range(repMin, repMax)}
            onChange={(e) => setReps(e.target.value)}
            onBlur={() => onSave('reps', reps)}
            className={inputClass}
          />
        </div>
        <div className="flex-1">
          <input
            type="number" inputMode="numeric" value={rir}
            placeholder={range(1, 2)}
            onChange={(e) => setRir(e.target.value)}
            onBlur={() => onSave('rir', rir)}
            className={inputClass}
          />
        </div>
      </div>

      {/* Under the inputs: what happened last time + record badge */}
      <div className="flex items-center justify-between mt-1.5 pr-10 min-h-[18px]">
        <span className="text-gray-500 text-xs">
          {prevLog?.weightKg != null && prevLog.reps != null
            ? <>פעם קודמת: <span dir="ltr" className="text-gray-400 font-semibold">{fmtKg(prevLog.weightKg)} × {prevLog.reps}</span></>
            : ''}
        </span>
        {isRecord && (
          <span className="text-[11px] font-bold text-black bg-teal-400 rounded-full px-2 py-0.5">🏆 שיא אישי</span>
        )}
      </div>
    </div>
  )
}

export default function ProExercisePage() {
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

  // Every time this same exercise appears in Ohad's program (one per week), with my logs
  const history = useLiveQuery(async () => {
    if (!userId || !exercise) return undefined
    const [sessions, weeks, allExercises, logs] = await Promise.all([
      db.sessions.toArray(),
      db.weeks.toArray(),
      db.exercises.toArray(),
      db.setLogs.where('userId').equals(userId).toArray(),
    ])
    const sessionById = new Map(sessions.map((s) => [s.id, s]))
    const weekNumberById = new Map(weeks.map((w) => [w.id, w.weekNumber]))
    return allExercises
      .filter((e) => e.name === exercise.name && sessionById.get(e.sessionId)?.program === 'ohad')
      .map((e) => ({
        exerciseId: e.id,
        weekNumber: weekNumberById.get(sessionById.get(e.sessionId)!.weekId) ?? 0,
        logs: logs.filter((l) => l.exerciseId === e.id),
      }))
      .sort((a, b) => a.weekNumber - b.weekNumber)
  }, [exercise?.id, exercise?.name, userId])

  if (!exercise || !siblings || !history) return null

  const repMax = exercise.targetReps
  const repMin = exercise.repMin ?? repMax
  const restSeconds = exercise.restSeconds ?? 90
  const setNumbers = Array.from({ length: exercise.targetSets }, (_, i) => i + 1)

  const done = (l: SetLog) => l.weightKg != null && l.reps != null
  const current = history.find((h) => h.exerciseId === exercise.id)
  const currentWeek = current?.weekNumber ?? 0
  const setLogs = current?.logs ?? []
  const earlier = history.filter((h) => h.weekNumber < currentWeek && h.logs.some(done))
  const last = earlier[earlier.length - 1] // most recent earlier week that has data

  const getLog = (n: number) => setLogs.find((l) => l.setNumber === n)
  const getPrevLog = (n: number) => last?.logs.find((l) => l.setNumber === n)

  // --- personal record: best estimated 1RM before this week
  const bestBefore = Math.max(
    0,
    ...earlier.flatMap((h) => h.logs.filter(done).map((l) => e1rm(l.weightKg!, l.reps!)))
  )
  const isRecord = (l: SetLog | undefined) =>
    !!l && done(l) && bestBefore > 0 && e1rm(l.weightKg!, l.reps!) > bestBefore + 0.01

  // --- today's target (double progression)
  let target: { title: string; detail: string }
  if (!last) {
    target = {
      title: `בחר משקל ל-${range(repMin, repMax)} חזרות`,
      detail: `משקל שמשאיר לך ${range(1, 2)} חזרות ברזרבה בסוף כל סט. מהשבוע הבא האפליקציה תגיד לך מתי להעלות.`,
    }
  } else {
    const lastDone = last.logs.filter(done)
    const topWeight = Math.max(...lastDone.map((l) => l.weightKg!))
    const repsText = [...lastDone].sort((a, b) => a.setNumber - b.setNumber).map((l) => l.reps).join(', ')
    const filledRange =
      lastDone.length >= exercise.targetSets && lastDone.every((l) => l.reps! >= repMax && l.weightKg! >= topWeight)
    if (filledRange) {
      const next = topWeight >= 40 ? `${fmtKg(topWeight + 2.5)} ק"ג` : `${range(topWeight + 1, topWeight + 2)} ק"ג`
      target = {
        title: `העלה משקל ← ${next}`,
        detail: `פעם קודמת מילאת את הטווח (${repsText} חזרות ב-${fmtKg(topWeight)} ק"ג). התחל מחדש מ-${repMin} חזרות ומעלה.`,
      }
    } else {
      target = {
        title: `${fmtKg(topWeight)} ק"ג — הוסף חזרה`,
        detail: `פעם קודמת: ${repsText} חזרות. נסה להוסיף חזרה אחת לפחות בסט אחד. כשתגיע ל-${repMax} בכל הסטים — מעלים משקל.`,
      }
    }
  }

  // --- progress chart: heaviest set of each week
  const chartPoints = history
    .filter((h) => h.logs.some(done))
    .map((h) => ({
      label: `ש׳${h.weekNumber}`,
      value: Math.max(...h.logs.filter(done).map((l) => l.weightKg!)),
    }))

  const myIndex = siblings.findIndex((e) => e.id === exercise.id)
  const prevEx = siblings[myIndex - 1]
  const nextEx = siblings[myIndex + 1]
  const allSetsLogged = setNumbers.every((n) => {
    const l = getLog(n)
    return !!l && done(l)
  })

  async function handleSave(setNumber: number, field: Field, value: string) {
    if (!userId) return
    const num = value === '' ? null : Number(value)
    const exId = exercise!.id
    // One database transaction per save: saves run strictly one after another and
    // read the stored row (not the screen's copy), so two quick saves in a row can
    // never create the same set twice
    const justCompleted = await db.transaction('rw', db.setLogs, async () => {
      const existing = await db.setLogs
        .where('[exerciseId+userId]')
        .equals([exId, userId])
        .filter((l) => l.setNumber === setNumber)
        .first()
      const before = { weightKg: existing?.weightKg ?? null, reps: existing?.reps ?? null }
      const after = { ...before, [field]: num }
      if (existing?.id) {
        await db.setLogs.update(existing.id, { [field]: num })
      } else {
        await db.setLogs.add({
          exerciseId: exId,
          userId,
          setNumber,
          weightKg: field === 'weightKg' ? num : null,
          reps: field === 'reps' ? num : null,
          rir: field === 'rir' ? num : null,
          loggedAt: new Date().toISOString(),
        })
      }
      return !(before.weightKg != null && before.reps != null) && after.weightKg != null && after.reps != null
    })
    // Rest starts by itself the moment a set gets its weight + reps
    if (justCompleted) startRest(restSeconds)
  }

  return (
    <div className="min-h-dvh bg-[#121212] flex flex-col pb-32">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-6 pb-4">
        <button
          onClick={() => nextEx ? navigate(`/exercises/${nextEx.id}`, { replace: true }) : navigate(-1)}
          className="text-teal-400 p-1"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        <div className="flex flex-col items-center gap-0.5">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-gray-500 text-xs">
            חזרה לאימון
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <span className="text-teal-400 font-bold text-base">תרגיל {myIndex + 1}/{siblings.length}</span>
        </div>

        <button
          onClick={() => prevEx ? navigate(`/exercises/${prevEx.id}`, { replace: true }) : navigate(-1)}
          className="text-gray-400 p-1"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      {/* Name + prescription chips */}
      <div className="px-4 pb-3 text-right">
        <h2 className={`text-xl font-bold ${allSetsLogged ? 'text-teal-400' : 'text-white'}`}>{exercise.name}</h2>
        <p className="text-gray-400 text-sm mt-1">{exercise.muscleGroup}</p>
        <div className="flex flex-wrap gap-2 mt-3">
          {[
            `${exercise.targetSets} סטים`,
            `${range(repMin, repMax)} חזרות`,
            `מנוחה ${formatTime(restSeconds)}`,
          ].map((chip) => (
            <span key={chip} className="text-xs font-semibold text-gray-200 bg-[#1e1e1e] border border-[#2a2a2a] rounded-full px-3 py-1">
              {chip}
            </span>
          ))}
        </div>
      </div>

      {/* Image */}
      <div className="mx-4 mb-4 h-44 bg-[#1e1e1e] rounded-2xl overflow-hidden border border-[#2a2a2a] flex items-center justify-center">
        {exercise.imageUrl && (
          <img src={exercise.imageUrl} alt={exercise.name} className="w-full h-full object-cover" />
        )}
      </div>

      {/* Today's target */}
      <div className="mx-4 mb-4 rounded-2xl p-4 text-right bg-teal-400/10 border border-teal-400/40">
        <p className="text-teal-400 text-xs font-semibold">היעד להיום</p>
        <p className="text-white font-bold text-lg mt-0.5">{target.title}</p>
        <p className="text-gray-400 text-xs mt-1 leading-relaxed">{target.detail}</p>
      </div>

      {/* Sets */}
      <div className="mx-4 bg-[#1e1e1e] rounded-2xl px-4 border border-[#2a2a2a]">
        <div className="flex items-center gap-2 pb-2 pt-3 border-b border-[#333]">
          <div className="w-8 flex-shrink-0" />
          <div className="flex-1 text-center text-gray-500 text-xs">ק"ג</div>
          <div className="flex-1 text-center text-gray-500 text-xs">חזרות</div>
          <div className="flex-1 text-center text-gray-500 text-xs">RIR (רזרבה)</div>
        </div>
        {setNumbers.map((n) => (
          <SetRow
            key={`${exercise.id}-${n}`}
            setNumber={n}
            log={getLog(n)}
            prevLog={getPrevLog(n)}
            repMin={repMin}
            repMax={repMax}
            isRecord={isRecord(getLog(n))}
            onSave={(field, value) => handleSave(n, field, value)}
          />
        ))}
      </div>

      <RestStartButton seconds={restSeconds} />

      {allSetsLogged && (
        <div className="px-4 mt-4">
          <button
            onClick={() => nextEx ? navigate(`/exercises/${nextEx.id}`, { replace: true }) : navigate(-1)}
            className="w-full py-4 bg-teal-400 text-black font-bold rounded-2xl text-base active:scale-95 transition-transform"
          >
            {nextEx ? 'לתרגיל הבא ←' : '✓ סיום אימון'}
          </button>
        </div>
      )}

      {/* Progress over the weeks */}
      <div className="mx-4 mt-4 bg-[#1e1e1e] rounded-2xl p-4 border border-[#2a2a2a] text-right">
        <p className="text-white font-bold text-sm">התקדמות — הסט הכבד בכל שבוע</p>
        {chartPoints.length >= 2 ? (
          <div className="mt-2">
            <LineChart points={chartPoints} unit={'ק"ג'} />
          </div>
        ) : (
          <p className="text-gray-500 text-xs mt-1">הגרף יופיע אחרי שתתעד את התרגיל בשני שבועות לפחות.</p>
        )}
      </div>

      <RestTimerBar />
    </div>
  )
}
