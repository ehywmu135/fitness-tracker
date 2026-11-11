import { useEffect, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { useCurrentUser } from '../hooks/useCurrentUser'
import { formatAmount, optionFor, scaled, todayKey, type FoodOption } from '../nutrition/plan'
import { itemKey, saveItemState, stateFor, useDayLog, usePlan } from '../nutrition/useDayLog'
import { CheckCircle, MACRO_COLORS, fmt, fmt1 } from '../nutrition/ui'

function Macro({ value, unit, label, color }: { value: string; unit?: string; label: string; color: string }) {
  return (
    <div className="flex-1 flex flex-col items-center">
      <span className="text-[26px] font-medium tabular-nums" style={{ color }}>
        {value}
        {unit && <span className="text-sm mr-0.5">{unit}</span>}
      </span>
      <span className="text-gray-400 text-sm mt-1">{label}</span>
    </div>
  )
}

function OptionCard({ option, selected, onSelect }: { option: FoodOption; selected: boolean; onSelect: () => void }) {
  return (
    <button
      onClick={onSelect}
      className={`w-full text-right rounded-3xl border px-5 py-4 transition-colors ${
        selected ? 'bg-[#173a35] border-teal-500' : 'bg-[#1e1e1e] border-[#2a2a2a]'
      }`}
    >
      <div className="flex items-center gap-3 pb-3 border-b border-[#2f3433]">
        <CheckCircle checked={selected} />
        <span className="flex-1 text-white text-[17px] font-semibold">{option.name}</span>
        <span className="text-gray-400 text-sm tabular-nums">
          <span className="text-white text-lg">{fmt(option.kcal)}</span> קל׳
        </span>
      </div>
      <div className="pt-3 text-gray-300 font-semibold tabular-nums">{formatAmount(option.amount, option.unit)}</div>
      {option.note && <div className="pt-1 text-gray-400 text-sm">{option.note}</div>}
      <div className="pt-1 text-gray-500 text-sm tabular-nums">
        חלבון {fmt1(option.protein)} גר׳ · פחמימות {fmt1(option.carbs)} גר׳ · שומן {fmt1(option.fat)} גר׳
      </div>
    </button>
  )
}

export default function FoodPage() {
  const { mealId, itemId } = useParams()
  const navigate = useNavigate()
  const { userId } = useCurrentUser()
  const date = todayKey()
  const log = useDayLog(userId, date)

  const planInfo = usePlan(userId)
  const meal = planInfo?.plan.meals.find((m) => m.id === mealId)
  const item = [...(meal?.items ?? []), ...(meal?.altItems ?? [])].find((i) => i.id === itemId)
  const key = meal && item ? itemKey(meal.id, item.id) : ''

  // Local (unsaved) choice — becomes permanent on "שמירה"
  const [choiceIndex, setChoiceIndex] = useState(-1)
  const [qty, setQty] = useState('')
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  useEffect(() => {
    if (loaded || log === undefined || !item) return
    const s = stateFor(item, log.get(key))
    const opt = optionFor(item, s.choiceIndex)
    setChoiceIndex(s.choiceIndex)
    setQty(String(Math.round((s.amount / opt.step) * 100) / 100))
    setLoaded(true)
  }, [log, item, key, loaded])

  if (planInfo === undefined) return null
  if (!meal || !item) return <Navigate to="/nutrition" replace />
  if (!loaded || userId === null) return null

  const option = optionFor(item, choiceIndex)
  const qtyNum = Number(qty)
  const amount = Number.isFinite(qtyNum) && qtyNum > 0 ? qtyNum * option.step : 0
  const m = scaled(option, amount)

  const choose = (index: number) => {
    const next = index === choiceIndex ? -1 : index // tap the chosen one again → back to the original
    const opt = optionFor(item, next)
    setChoiceIndex(next)
    setQty(String(Math.round((opt.amount / opt.step) * 100) / 100))
  }

  const save = async () => {
    await saveItemState(userId, date, key, item, { choiceIndex, amount: amount || option.amount })
    navigate(-1)
  }

  const stepLabel = option.unit ? `${option.step} ${option.unit}` : `${option.step}`

  return (
    <div className="pb-56 px-4 pt-5 min-h-dvh">
      {/* Top bar */}
      <div className="relative flex items-center justify-center h-10 mb-5">
        <button onClick={() => navigate(-1)} aria-label="חזרה" className="absolute right-0 p-2 text-teal-400">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 6l6 6-6 6" />
          </svg>
        </button>
        <span className="text-teal-400 text-xl font-bold">{meal.name}</span>
      </div>

      {/* Title */}
      <h1 className="text-white text-[32px] font-semibold leading-tight">{option.name}</h1>
      <p className="text-gray-500 mt-1">{choiceIndex >= 0 ? `חלופה ל${item.food.name}` : 'מהתפריט'}</p>
      {option.note && <p className="text-gray-300 mt-2">{option.note}</p>}

      {/* Quantity */}
      <p className="text-gray-300 font-semibold mt-7 mb-3">כמות ויחידת מידה</p>
      <div className="flex gap-3">
        <input
          type="number"
          inputMode="decimal"
          value={qty}
          onChange={(e) => setQty(e.target.value)}
          className="flex-1 min-w-0 bg-[#1e1e1e] border border-[#2a2a2a] rounded-2xl px-5 py-4 text-white text-2xl outline-none focus:border-teal-500 tabular-nums"
        />
        <div className="flex-1 bg-[#1e1e1e] border border-[#2a2a2a] rounded-2xl px-5 py-4 text-gray-300 text-xl flex items-center">
          {stepLabel}
        </div>
      </div>

      {/* Macros */}
      <div className="flex border-y border-[#2a2a2a] mt-6 py-5">
        <Macro value={fmt(m.kcal)} label="קלוריות" color={MACRO_COLORS.kcal} />
        <Macro value={fmt1(m.protein)} unit="גר׳" label="חלבון" color={MACRO_COLORS.protein} />
        <Macro value={fmt1(m.carbs)} unit="גר׳" label="פחמימות" color={MACRO_COLORS.carbs} />
        <Macro value={fmt1(m.fat)} unit="גר׳" label="שומן" color={MACRO_COLORS.fat} />
      </div>

      {/* Alternatives */}
      {item.alternatives.length > 0 && (
        <>
          <div className="flex items-center justify-between mt-7 mb-4">
            <span className="text-gray-300 font-semibold">חלופות למאכל</span>
            <span className="text-teal-400 font-semibold">{item.alternatives.length} חלופות</span>
          </div>
          <div className="flex flex-col gap-3">
            {choiceIndex >= 0 && (
              <>
                <p className="text-gray-500 text-sm px-1">המאכל המקורי</p>
                <OptionCard option={item.food} selected={false} onSelect={() => choose(choiceIndex)} />
                <p className="text-gray-500 text-sm px-1 mt-2">חלופות</p>
              </>
            )}
            {item.alternatives.map((alt, i) => (
              <OptionCard key={alt.name} option={alt} selected={i === choiceIndex} onSelect={() => choose(i)} />
            ))}
          </div>
        </>
      )}

      {/* Save bar (sits above the bottom nav) */}
      <div
        style={{ bottom: 'calc(68px + env(safe-area-inset-bottom))' }}
        className="fixed inset-x-0 max-w-[430px] mx-auto bg-[#1a1a1a] border-t border-[#2a2a2a] px-4 py-4 flex items-center gap-3"
      >
        <div className="flex-1 min-w-0">
          <div className="text-white font-semibold text-lg truncate">{option.name}</div>
          <div className="text-gray-500 text-sm tabular-nums">
            {formatAmount(amount, option.unit)} · {fmt(m.kcal)} קל׳
          </div>
        </div>
        <button
          onClick={save}
          disabled={amount <= 0}
          className="bg-teal-500 text-white text-lg font-semibold rounded-full px-10 py-3.5 active:scale-95 transition-transform disabled:opacity-40"
        >
          שמירה
        </button>
      </div>
    </div>
  )
}
