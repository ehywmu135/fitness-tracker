import { useLiveQuery } from 'dexie-react-hooks'
import { useParams } from 'react-router-dom'
import { db } from '../db'
import ExercisePage from './ExercisePage'
import ProExercisePage from './ProExercisePage'

// Picks the exercise screen by the program the exercise belongs to:
// Yael's program keeps the original screen, Ohad's gets the progression screen.
export default function ExerciseRoute() {
  const { exerciseId } = useParams<{ exerciseId: string }>()
  const program = useLiveQuery(async () => {
    const ex = await db.exercises.get(Number(exerciseId))
    if (!ex) return 'yael'
    const session = await db.sessions.get(ex.sessionId)
    return session?.program ?? 'yael'
  }, [exerciseId])

  if (!program) return null
  return program === 'ohad' ? <ProExercisePage /> : <ExercisePage />
}
