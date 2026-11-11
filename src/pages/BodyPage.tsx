import { useEffect, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useNavigate } from 'react-router-dom'
import LineChart from '../components/LineChart'
import { db } from '../db'
import { useCurrentUser } from '../hooks/useCurrentUser'

function todayKey() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function shortDate(key: string) {
  const [, m, d] = key.split('-')
  return `${Number(d)}/${Number(m)}`
}

export default function BodyPage() {
  const navigate = useNavigate()
  const { userId } = useCurrentUser()
  const today = todayKey()

  const logs = useLiveQuery(
    () => (userId ? db.bodyLogs.where('userId').equals(userId).sortBy('date') : []),
    [userId]
  )
  const todayLog = logs?.find((l) => l.date === today)

  const [weight, setWeight] = useState('')
  const [waist, setWaist] = useState('')
  const [saved, setSaved] = useState(false)

  // Fill the inputs once, when today's saved measurement is loaded
  useEffect(() => {
    setWeight(todayLog?.weightKg != null ? String(todayLog.weightKg) : '')
    setWaist(todayLog?.waistCm != null ? String(todayLog.waistCm) : '')
  }, [todayLog?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!logs || !userId) return null

  async function save() {
    const data = {
      weightKg: weight === '' ? null : Number(weight),
      waistCm: waist === '' ? null : Number(waist),
    }
    if (data.weightKg == null && data.waistCm == null) return
    if (todayLog?.id) await db.bodyLogs.update(todayLog.id, data)
    else await db.bodyLogs.add({ userId: userId!, date: today, ...data })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const weightPoints = logs.filter((l) => l.weightKg != null).map((l) => ({ label: shortDate(l.date), value: l.weightKg! }))
  const waistPoints = logs.filter((l) => l.waistCm != null).map((l) => ({ label: shortDate(l.date), value: l.waistCm! }))
  const inputClass =
    'w-full text-center bg-[#2a2a2a] rounded-lg py-3 text-white text-lg font-semibold outline-none focus:ring-1 focus:ring-teal-400 placeholder:text-[#555]'

  return (
    <div className="pb-28">
      <div className="flex items-center justify-between px-4 pt-6 pb-4">
        <button onClick={() => navigate(-1)} className="text-gray-400 p-1">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <h1 className="text-teal-400 text-lg font-bold">מעקב גוף</h1>
        <div className="w-8" />
      </div>

      {/* Today's measurement */}
      <div className="mx-4 bg-[#1e1e1e] rounded-2xl p-4 border border-[#2a2a2a] text-right">
        <p className="text-white font-bold text-sm">המדידה של היום</p>
        <p className="text-gray-500 text-xs mt-1 leading-relaxed">
          פעם בשבוע, באותו יום, בבוקר אחרי שירותים ולפני אוכל. מותן — בגובה הטבור, בלי להכניס בטן.
        </p>
        <div className="flex gap-3 mt-3">
          <label className="flex-1 flex flex-col items-center gap-1">
            <input type="number" inputMode="decimal" value={weight} placeholder="—" onChange={(e) => setWeight(e.target.value)} className={inputClass} />
            <span className="text-gray-500 text-xs">משקל (ק"ג)</span>
          </label>
          <label className="flex-1 flex flex-col items-center gap-1">
            <input type="number" inputMode="decimal" value={waist} placeholder="—" onChange={(e) => setWaist(e.target.value)} className={inputClass} />
            <span className="text-gray-500 text-xs">היקף מותן (ס"מ)</span>
          </label>
        </div>
        <button
          onClick={save}
          className="w-full mt-4 py-3 bg-teal-400 text-black font-bold rounded-2xl text-base active:scale-95 transition-transform"
        >
          {saved ? '✓ נשמר' : 'שמור מדידה'}
        </button>
      </div>

      {/* Charts — one measure per chart */}
      {[
        { title: 'משקל', points: weightPoints, unit: 'ק"ג' },
        { title: 'היקף מותן', points: waistPoints, unit: 'ס"מ' },
      ].map((c) => (
        <div key={c.title} className="mx-4 mt-4 bg-[#1e1e1e] rounded-2xl p-4 border border-[#2a2a2a] text-right">
          <p className="text-white font-bold text-sm">{c.title}</p>
          {c.points.length >= 2 ? (
            <div className="mt-2"><LineChart points={c.points} unit={c.unit} /></div>
          ) : (
            <p className="text-gray-500 text-xs mt-1">הגרף יופיע אחרי שתי מדידות.</p>
          )}
        </div>
      ))}

      {/* History list */}
      {logs.length > 0 && (
        <div className="mx-4 mt-4 bg-[#1e1e1e] rounded-2xl px-4 border border-[#2a2a2a]">
          {[...logs].reverse().map((l) => (
            <div key={l.id} className="flex items-center justify-between py-3 border-b border-[#2a2a2a] last:border-0 text-sm">
              <span className="text-gray-400">{shortDate(l.date)}</span>
              <span className="text-white font-semibold">
                {l.weightKg != null ? `${l.weightKg} ק"ג` : '—'}
                <span className="text-gray-600"> · </span>
                {l.waistCm != null ? `${l.waistCm} ס"מ` : '—'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
