import { NavLink } from 'react-router-dom'

export default function BottomNav() {
  return (
    <nav
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      className="fixed bottom-0 inset-x-0 max-w-[430px] mx-auto bg-[#1a1a1a] border-t border-[#2a2a2a] flex"
    >
      <NavLink
        to="/workouts"
        className={({ isActive }) =>
          `flex-1 flex flex-col items-center gap-1 py-3 text-xs transition-colors ${
            isActive ? 'text-teal-400' : 'text-gray-500'
          }`
        }
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M6.5 6.5h11M6.5 12h11M6.5 17.5h11" strokeLinecap="round" />
          <rect x="3" y="4" width="18" height="16" rx="2" />
        </svg>
        <span>אימונים</span>
      </NavLink>

      <NavLink
        to="/nutrition"
        className={({ isActive }) =>
          `flex-1 flex flex-col items-center gap-1 py-3 text-xs transition-colors ${
            isActive ? 'text-teal-400' : 'text-gray-500'
          }`
        }
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M12 3C8 3 5 6 5 10c0 5 7 11 7 11s7-6 7-11c0-4-3-7-7-7z" />
          <circle cx="12" cy="10" r="2" />
        </svg>
        <span>תזונה</span>
      </NavLink>
    </nav>
  )
}
