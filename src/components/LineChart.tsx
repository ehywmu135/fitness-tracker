import { useState } from 'react'

export interface ChartPoint {
  label: string // x-axis label, e.g. "ש׳3" or "12/11"
  value: number
}

// Small single-series line chart. Tap a point to read its exact value.
export default function LineChart({ points, unit }: { points: ChartPoint[]; unit: string }) {
  const [selected, setSelected] = useState<number | null>(null)
  if (points.length === 0) return null

  const W = 320
  const H = 150
  const padL = 34
  const padR = 14
  const padT = 26
  const padB = 24

  const values = points.map((p) => p.value)
  let min = Math.min(...values)
  let max = Math.max(...values)
  if (min === max) {
    min -= 1
    max += 1
  }
  const span = max - min
  const lo = min - span * 0.15
  const hi = max + span * 0.15

  const x = (i: number) =>
    points.length === 1 ? (padL + W - padR) / 2 : padL + (i / (points.length - 1)) * (W - padL - padR)
  const y = (v: number) => padT + (1 - (v - lo) / (hi - lo)) * (H - padT - padB)

  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(p.value).toFixed(1)}`).join(' ')
  const active = selected ?? points.length - 1
  const fmt = (v: number) => (Number.isInteger(v) ? String(v) : v.toFixed(1))

  // Show at most ~6 x labels so they never collide
  const step = Math.ceil(points.length / 6)

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ direction: 'ltr' }} role="img" aria-label={`גרף התקדמות (${unit})`}>
      {/* recessive grid: top and bottom value only */}
      {[max, min].map((v) => (
        <g key={v}>
          <line x1={padL} x2={W - padR} y1={y(v)} y2={y(v)} stroke="#2a2a2a" strokeWidth="1" />
          <text x={padL - 6} y={y(v) + 3.5} textAnchor="end" fill="#6b7280" fontSize="10">
            {fmt(v)}
          </text>
        </g>
      ))}

      {points.length > 1 && (
        <path d={path} fill="none" stroke="#2dd4bf" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      )}

      {points.map((p, i) => (
        <g key={i}>
          {(i % step === 0 || i === points.length - 1) && (
            <text x={x(i)} y={H - 6} textAnchor="middle" fill="#6b7280" fontSize="10">
              {p.label}
            </text>
          )}
          <circle
            cx={x(i)} cy={y(p.value)} r={i === active ? 5 : 4}
            fill={i === active ? '#2dd4bf' : '#1e1e1e'} stroke={i === active ? '#1e1e1e' : '#2dd4bf'} strokeWidth="2"
          />
          {/* large invisible tap target */}
          <rect
            x={x(i) - 16} y={0} width={32} height={H} fill="transparent"
            onClick={() => setSelected(i)}
          />
        </g>
      ))}

      {/* value label of the selected (default: latest) point */}
      <text
        x={Math.min(Math.max(x(active), padL + 20), W - padR - 20)}
        y={Math.max(y(points[active].value) - 11, 12)}
        textAnchor="middle" fill="#ffffff" fontSize="12" fontWeight="700"
        stroke="#1e1e1e" strokeWidth="4" paintOrder="stroke" direction="rtl"
      >
        {fmt(points[active].value)} {unit}
      </text>
    </svg>
  )
}
