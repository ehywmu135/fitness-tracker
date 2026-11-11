import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'

interface Props {
  onSelect: (userId: number) => void
}

export default function UserSelectPage({ onSelect }: Props) {
  const users = useLiveQuery(() => db.users.toArray())

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-6 bg-[#121212]">
      <div className="mb-10 text-center">
        <div className="text-teal-400 text-5xl mb-4">💪</div>
        <h1 className="text-2xl font-bold text-white mb-2">ברוכים הבאים</h1>
        <p className="text-gray-400 text-sm">מי מתאמן היום?</p>
      </div>

      <div className="w-full max-w-xs flex flex-col gap-4">
        {users?.map((user) => (
          <button
            key={user.id}
            onClick={() => onSelect(user.id)}
            className="w-full py-4 rounded-2xl bg-[#1e1e1e] border border-[#333] text-white text-lg font-semibold
                       active:scale-95 transition-transform"
          >
            {user.name}
          </button>
        ))}
      </div>
    </div>
  )
}
