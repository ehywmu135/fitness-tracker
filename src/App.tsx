import { useEffect } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom'
import BottomNav from './components/BottomNav'
import { db, seedDatabase } from './db'
import { useCurrentUser } from './hooks/useCurrentUser'
import BodyPage from './pages/BodyPage'
import ExerciseRoute from './pages/ExerciseRoute'
import FoodPage from './pages/FoodPage'
import NutritionPage from './pages/NutritionPage'
import SessionPage from './pages/SessionPage'
import UserSelectPage from './pages/UserSelectPage'
import WeekPage from './pages/WeekPage'
import WorkoutsPage from './pages/WorkoutsPage'

function MainLayout() {
  return (
    <div className="min-h-dvh bg-[#121212]">
      <Outlet />
      <BottomNav />
    </div>
  )
}

export default function App() {
  const { userId, setUserId } = useCurrentUser()

  useEffect(() => {
    seedDatabase()
  }, [])

  // If the remembered user no longer exists (e.g. data was cleared), ask again
  const users = useLiveQuery(() => db.users.toArray())
  useEffect(() => {
    if (userId !== null && users && users.length > 0 && !users.some((u) => u.id === userId)) {
      setUserId(null)
    }
  }, [userId, users, setUserId])

  if (userId === null) {
    return <UserSelectPage onSelect={setUserId} />
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/workouts" replace />} />
        <Route element={<MainLayout />}>
          <Route path="/workouts" element={<WorkoutsPage />} />
          <Route path="/workouts/:weekId" element={<WeekPage />} />
          <Route path="/sessions/:sessionId" element={<SessionPage />} />
          <Route path="/body" element={<BodyPage />} />
          <Route path="/nutrition" element={<NutritionPage />} />
          <Route path="/nutrition/:mealId/:itemId" element={<FoodPage />} />
        </Route>
        <Route path="/exercises/:exerciseId" element={<ExerciseRoute />} />
        <Route path="*" element={<Navigate to="/workouts" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
