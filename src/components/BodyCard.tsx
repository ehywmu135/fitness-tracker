import { useLiveQuery } from 'dexie-react-hooks'
import { useNavigate } from 'react-router-dom'
import { db } from '../db'

function Delta({ first, last, unit }: { first: number; last: number; unit: string }) {
  const d = Math.round((last - first) * 10) / 10
  if (d === 0) return null
  return (
    <span className="text-gray-400 text-xs" dir="ltr">
      {d > 0 ? '+' : '−'}{Math.abs(d)} {unit}
    </span>
  )
}

// Summary of body weight + waist on Ohad's workouts screen; opens the measurements page
export default function BodyCard({ userId }: { userId: number }) {
  const navigate = useNavigate()
  const logs = useLiveQuery(
    () => db.bodyLogs.where('userId').equals(userId).sortBy('date'),
    [userId]
  )
  if (!logs) return null

  const weights = logs.filter((l) => l.weightKg != null).map((l) => l.weightKg!)
  const waists = logs.filter((l) => l.waistCm != null).map((l) => l.waistCm!)

  return (
    <button
      onClick={() => navigate('/body')}
      className="mx-4 mb-5 w-[calc(100%-2rem)] bg-[#1e1e1e] rounded-2xl p-4 border border-[#2a2a2a] text-right active:scale-95 transition-transform"
    >
      <div className="flex items-center justify-between">
        <span className="text-white font-bold text-sm">מעקב גוף</span>
        <span className="text-teal-400 text-xs font-semibold">
          {logs.length === 0 ? 'הוסף מדידה ראשונה ←' : 'עדכון מדידה ←'}
        </span>
      </div>
      <div className="flex gap-3 mt-3">
        {[
          { label: 'משקל', values: weights, unit: 'ק"ג' },
          { label: 'היקף מותן', values: waists, unit: 'ס"מ' },
        ].map((m) => (
          <div key={m.label} className="flex-1 bg-[#161616] rounded-xl px-3 py-2.5">
            <p className="text-gray-500 text-xs">{m.label}</p>
            <p className="text-white text-xl font-bold mt-0.5">
              {m.values.length ? m.values[m.values.length - 1] : '—'}
              <span className="text-gray-500 text-xs font-normal"> {m.unit}</span>
            </p>
            {m.values.length >= 2 && (
              <Delta first={m.values[0]} last={m.values[m.values.length - 1]} unit={m.unit} />
            )}
          </div>
        ))}
      </div>
    </button>
  )
}
