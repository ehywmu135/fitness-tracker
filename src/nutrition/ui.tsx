// Small shared UI pieces for the nutrition screens

export const MACRO_COLORS = {
  kcal: '#2dd4bf',
  protein: '#8b9cf7',
  carbs: '#e8a464',
  fat: '#d9c25a',
}

export function CheckCircle({ checked, size = 30 }: { checked: boolean; size?: number }) {
  return (
    <span
      style={{ width: size, height: size }}
      className={`flex-shrink-0 rounded-full flex items-center justify-center transition-colors ${
        checked ? 'bg-teal-400' : 'border-2 border-[#5a5f5e]'
      }`}
    >
      {checked && (
        <svg width={size * 0.45} height={size * 0.45} viewBox="0 0 10 10" fill="none">
          <path d="M2 5.2l2.2 2.2L8.2 3" stroke="#0b0f0e" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </span>
  )
}

export function fmt(n: number) {
  return Math.round(n).toLocaleString('en-US')
}

export function fmt1(n: number) {
  return String(Math.round(n * 10) / 10)
}
