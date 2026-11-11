import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCurrentUser } from '../hooks/useCurrentUser'
import {
  activeItems,
  type DailyTargets,
  formatAmount,
  optionFor,
  scaled,
  todayKey,
  type Meal,
} from '../nutrition/plan'
import { itemKey, saveItemState, setMealVariant, stateFor, useDayLog, usePlan, usesAlt } from '../nutrition/useDayLog'
import { CheckCircle, MACRO_COLORS, fmt, fmt1 } from '../nutrition/ui'

type DayLog = ReturnType<typeof useDayLog>

function mealRows(meal: Meal, log: DayLog) {
  return activeItems(meal, usesAlt(log, meal.id)).map((item) => {
    const key = itemKey(meal.id, item.id)
    const state = stateFor(item, log?.get(key))
    const option = optionFor(item, state.choiceIndex)
    return { item, key, state, option, macros: scaled(option, state.amount) }
  })
}

// ---------------------------------------------------------------------------
// Daily summary card
// ---------------------------------------------------------------------------
function MacroBar({ label, eaten, target, color }: { label: string; eaten: number; target: number; color: string }) {
  const pct = Math.min(100, (eaten / target) * 100)
  return (
    <div>
      <div className="flex items-baseline justify-between mb-1.5">
        <span className="text-white font-semibold text-[15px]">{label}</span>
        <span className="text-gray-400 text-sm tabular-nums whitespace-nowrap">
          {fmt1(target)} / <span className="text-white">{fmt1(eaten)}</span> גר׳
        </span>
      </div>
      <div className="h-2 rounded-full overflow-hidden" style={{ background: `${color}33` }}>
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  )
}

function CalorieRing({ eaten, target }: { eaten: number; target: number }) {
  const r = 62
  const c = 2 * Math.PI * r
  const pct = Math.min(1, eaten / target)
  const remaining = Math.max(0, target - eaten)
  return (
    <div className="relative w-[148px] h-[148px] flex-shrink-0">
      <svg width="148" height="148" viewBox="0 0 148 148" className="-rotate-90">
        <circle cx="74" cy="74" r={r} fill="none" stroke="#2a302f" strokeWidth="12" />
        <circle
          cx="74"
          cy="74"
          r={r}
          fill="none"
          stroke={MACRO_COLORS.kcal}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
          className="transition-all duration-500"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-white text-3xl font-semibold tabular-nums">{fmt(remaining)}</span>
        <span className="text-gray-400 text-xs mt-0.5">קלוריות נותרו</span>
        <span className="text-gray-400 text-xs mt-1 tabular-nums">
          {fmt(target)} / {fmt(eaten)}
        </span>
      </div>
    </div>
  )
}

function SummaryCard({ userName, targets, totals }: { userName: string; targets: DailyTargets; totals: { kcal: number; protein: number; carbs: number; fat: number } }) {
  return (
    <div className="bg-[#1e1e1e] border border-[#2a2a2a] rounded-3xl overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-[#2a2a2a]">
        <div className="w-12 h-12 rounded-full bg-[#173a35] flex items-center justify-center text-teal-400 flex-shrink-0">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 3v7a2 2 0 0 0 2 2h0a2 2 0 0 0 2-2V3M7 12v9M17 3c-1.7 0-3 2-3 5s1.3 4 3 4v9" />
          </svg>
        </div>
        <div>
          <div className="text-white text-[17px] font-semibold">
            תפריט תזונה {userName}
            <span className="text-gray-500 text-sm font-normal"> · תפריט מפורט</span>
          </div>
          <div className="mt-0.5">
            <span className="text-white text-2xl font-semibold tabular-nums">{fmt(targets.kcal)}</span>
            <span className="text-gray-400 text-sm"> קלוריות ליום</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 px-5 py-5">
        <div className="flex-1 flex flex-col gap-4">
          <MacroBar label="חלבון" eaten={totals.protein} target={targets.protein} color={MACRO_COLORS.protein} />
          <MacroBar label="פחמימות" eaten={totals.carbs} target={targets.carbs} color={MACRO_COLORS.carbs} />
          <MacroBar label="שומן" eaten={totals.fat} target={targets.fat} color={MACRO_COLORS.fat} />
        </div>
        <CalorieRing eaten={totals.kcal} target={targets.kcal} />
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Meal card
// ---------------------------------------------------------------------------
function MealCard({ meal, log, userId, date }: { meal: Meal; log: DayLog; userId: number; date: string }) {
  const navigate = useNavigate()
  const [open, setOpen] = useState(true)
  const rows = mealRows(meal, log)
  const eatenCount = rows.filter((r) => r.state.eaten).length
  const allEaten = eatenCount === rows.length
  const eatenKcal = rows.filter((r) => r.state.eaten).reduce((s, r) => s + r.macros.kcal, 0)

  const status = allEaten ? 'נאכל' : eatenCount === 0 ? 'טרם סומן כנאכל' : `${eatenCount} מתוך ${rows.length} סומנו`

  const toggleMeal = () => {
    const next = !allEaten
    rows.forEach((r) => saveItemState(userId, date, r.key, r.item, { eaten: next }))
  }

  return (
    <div className="bg-[#1e1e1e] border border-[#2a2a2a] rounded-3xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4">
        <button onClick={toggleMeal} aria-label="סמן ארוחה כנאכלה" className="active:scale-90 transition-transform">
          <CheckCircle checked={allEaten} size={34} />
        </button>
        <button onClick={() => setOpen((o) => !o)} className="flex-1 flex items-center gap-3 text-right">
          <div className="flex-1">
            <div className="text-white text-[19px] font-semibold">{meal.name}</div>
            <div className={`text-sm mt-0.5 ${allEaten ? 'text-teal-400' : 'text-gray-500'}`}>{status}</div>
          </div>
          <span className="text-gray-400 text-sm tabular-nums">
            <span className="text-white text-lg">{fmt(eatenKcal)}</span> קל׳
          </span>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#9ca3af"
            strokeWidth="2"
            strokeLinecap="round"
            className={`transition-transform ${open ? '' : 'rotate-180'}`}
          >
            <path d="M6 15l6-6 6 6" />
          </svg>
        </button>
      </div>

      {/* Whole-meal alternative switch */}
      {open && meal.altItems && (
        <div className="px-5 pb-4">
          <div className="flex bg-[#151515] border border-[#2a2a2a] rounded-full p-1">
            {[
              { alt: false, label: meal.label ?? 'מהתפריט' },
              { alt: true, label: meal.altLabel ?? 'חלופה' },
            ].map((v) => {
              const active = usesAlt(log, meal.id) === v.alt
              return (
                <button
                  key={v.label}
                  onClick={() => setMealVariant(userId, date, meal.id, v.alt)}
                  className={`flex-1 rounded-full py-2 text-sm font-semibold transition-colors ${
                    active ? 'bg-[#173a35] text-teal-400' : 'text-gray-500'
                  }`}
                >
                  {v.label}
                  {v.alt && <span className="font-normal"> · חלופה</span>}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Foods */}
      {open &&
        rows.map(({ item, key, state, option, macros }) => (
          <div key={key} className="flex items-center gap-3 px-5 py-3.5 border-t border-[#2a2a2a]">
            <button
              onClick={() => saveItemState(userId, date, key, item, { eaten: !state.eaten })}
              aria-label="סמן כנאכל"
              className="active:scale-90 transition-transform"
            >
              <CheckCircle checked={state.eaten} />
            </button>
            <button
              onClick={() => navigate(`/nutrition/${meal.id}/${item.id}`)}
              className="flex-1 flex items-center gap-3 text-right min-w-0"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-[17px] ${state.eaten ? 'text-gray-400' : 'text-white'}`}>{option.name}</span>
                  {state.choiceIndex >= 0 ? (
                    <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-[#3a2e1c] text-[#e8a464]">חלופה</span>
                  ) : (
                    <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-[#173a35] text-teal-500">מהתפריט</span>
                  )}
                </div>
                <div className="text-gray-500 text-sm mt-0.5 tabular-nums">
                  {formatAmount(state.amount, option.unit)}
                  {option.note && ` · ${option.note}`}
                </div>
              </div>
              <span className={`text-sm tabular-nums ${state.eaten ? 'text-teal-400' : 'text-gray-500'}`}>
                <span className="text-lg">{fmt(macros.kcal)}</span> קל׳
              </span>
            </button>
          </div>
        ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function NutritionPage() {
  const { userId } = useCurrentUser()
  const date = todayKey()
  const log = useDayLog(userId, date)
  const planInfo = usePlan(userId)
  const meals = planInfo?.plan.meals ?? []

  const totals = { kcal: 0, protein: 0, carbs: 0, fat: 0 }
  for (const meal of meals) {
    for (const r of mealRows(meal, log)) {
      if (!r.state.eaten) continue
      totals.kcal += r.macros.kcal
      totals.protein += r.macros.protein
      totals.carbs += r.macros.carbs
      totals.fat += r.macros.fat
    }
  }

  const dateLabel = new Date().toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' })

  if (userId === null || log === undefined || !planInfo) return null

  return (
    <div className="pb-28 px-4 pt-6">
      <h1 className="text-teal-400 text-[28px] font-bold">תפריט תזונה</h1>
      <p className="text-gray-400 text-sm mb-5">{dateLabel}</p>

      <SummaryCard userName={planInfo.userName} targets={planInfo.plan.targets} totals={totals} />

      <h2 className="text-gray-400 text-sm font-semibold tracking-wide mt-7 mb-3 px-1">ארוחות</h2>
      <div className="flex flex-col gap-4">
        {meals.map((meal) => (
          <MealCard key={meal.id} meal={meal} log={log} userId={userId} date={date} />
        ))}
      </div>
    </div>
  )
}
