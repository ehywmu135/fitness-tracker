import { useLiveQuery } from 'dexie-react-hooks'
import { db, programForUserName, type Program, type Session } from '../db'
import { useCurrentUser } from './useCurrentUser'

// Which training program the current user follows (undefined while loading)
export function useProgram(): Program | undefined {
  const { userId } = useCurrentUser()
  return useLiveQuery(
    async () => (userId ? programForUserName((await db.users.get(userId))?.name) : undefined),
    [userId]
  )
}

export function sessionProgram(s: Session): Program {
  return s.program ?? 'yael'
}
