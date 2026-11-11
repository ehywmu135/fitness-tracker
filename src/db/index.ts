import Dexie, { type EntityTable } from 'dexie'

export interface User {
  id: number
  name: string
}

export type Program = 'yael' | 'ohad'

export function programForUserName(name: string | undefined): Program {
  return name === 'אוהד' ? 'ohad' : 'yael'
}

export interface Week {
  id: number
  weekNumber: number
}

export interface Session {
  id: number
  weekId: number
  sessionNumber: number
  name: string
  estimatedMinutes: number
  program?: Program // missing = 'yael' (rows created before v8)
  focus?: string // short subtitle shown on the session card
}

export interface Exercise {
  id: number
  sessionId: number
  name: string
  muscleGroup: string
  imageUrl?: string
  orderIndex: number
  targetSets: number
  targetReps: number // top of the rep range
  repMin?: number // bottom of the rep range (Ohad's program)
  restSeconds?: number // rest between sets; missing = 90
}

export interface SetLog {
  id?: number
  exerciseId: number
  userId: number
  setNumber: number
  weightKg: number | null
  reps: number | null
  rir: number | null
  loggedAt: string
}

// One row per (user, day, food slot in the nutrition plan)
export interface FoodLog {
  id?: number
  userId: number
  date: string // YYYY-MM-DD (local)
  itemKey: string // `${mealId}:${itemId}`
  eaten: boolean
  choiceIndex: number // -1 = original food from the plan, 0.. = alternative index
  amount: number // in the food's own unit (grams / units)
}

// Body measurements (one row per user per day)
export interface BodyLog {
  id?: number
  userId: number
  date: string // YYYY-MM-DD (local)
  weightKg: number | null
  waistCm: number | null
}

class FitnessDB extends Dexie {
  users!: EntityTable<User, 'id'>
  weeks!: EntityTable<Week, 'id'>
  sessions!: EntityTable<Session, 'id'>
  exercises!: EntityTable<Exercise, 'id'>
  setLogs!: EntityTable<SetLog, 'id'>
  foodLogs!: EntityTable<FoodLog, 'id'>
  bodyLogs!: EntityTable<BodyLog, 'id'>

  constructor() {
    super('FitnessDB')
    this.version(1).stores({
      users: '++id',
      weeks: '++id',
      sessions: '++id, weekId',
      exercises: '++id, sessionId',
      setLogs: '++id, exerciseId, userId, [exerciseId+userId]',
    })
    this.version(2)
      .stores({
        users: '++id',
        weeks: '++id',
        sessions: '++id, weekId',
        exercises: '++id, sessionId',
        setLogs: '++id, exerciseId, userId, [exerciseId+userId]',
      })
      .upgrade(async (tx) => {
        await tx.table('exercises').clear()
        await tx.table('sessions').clear()
        await tx.table('weeks').clear()
        await tx.table('users').clear()
      })
    this.version(3).stores({
      users: '++id',
      weeks: '++id',
      sessions: '++id, weekId',
      exercises: '++id, sessionId',
      setLogs: '++id, exerciseId, userId, [exerciseId+userId]',
    })
    this.version(4)
      .stores({
        users: '++id',
        weeks: '++id',
        sessions: '++id, weekId',
        exercises: '++id, sessionId',
        setLogs: '++id, exerciseId, userId, [exerciseId+userId]',
      })
      .upgrade(async (tx) => {
        await tx.table('exercises').clear()
        await tx.table('sessions').clear()
        await tx.table('weeks').clear()
        await tx.table('users').clear()
      })
    // v5: real exercise photos for training 2
    this.version(5)
      .stores({
        users: '++id',
        weeks: '++id',
        sessions: '++id, weekId',
        exercises: '++id, sessionId',
        setLogs: '++id, exerciseId, userId, [exerciseId+userId]',
      })
      .upgrade(async (tx) => {
        await tx.table('exercises').clear()
        await tx.table('sessions').clear()
        await tx.table('weeks').clear()
        await tx.table('users').clear()
      })
    // v6: real exercise photos for training 3
    this.version(6)
      .stores({
        users: '++id',
        weeks: '++id',
        sessions: '++id, weekId',
        exercises: '++id, sessionId',
        setLogs: '++id, exerciseId, userId, [exerciseId+userId]',
      })
      .upgrade(async (tx) => {
        await tx.table('exercises').clear()
        await tx.table('sessions').clear()
        await tx.table('weeks').clear()
        await tx.table('users').clear()
      })
    // v7: nutrition daily log (new table only — keeps all existing data)
    this.version(7).stores({
      users: '++id',
      weeks: '++id',
      sessions: '++id, weekId',
      exercises: '++id, sessionId',
      setLogs: '++id, exerciseId, userId, [exerciseId+userId]',
      foodLogs: '++id, [userId+date], [userId+date+itemKey]',
    })
    // v8: separate program for Ohad + body measurements.
    // Nothing is deleted: existing sessions become Yael's, and Ohad's sessions
    // are added to every existing week.
    this.version(8)
      .stores({
        users: '++id',
        weeks: '++id',
        sessions: '++id, weekId',
        exercises: '++id, sessionId',
        setLogs: '++id, exerciseId, userId, [exerciseId+userId]',
        foodLogs: '++id, [userId+date], [userId+date+itemKey]',
        bodyLogs: '++id, userId, [userId+date]',
      })
      .upgrade(async (tx) => {
        const sessions = tx.table('sessions')
        const exercises = tx.table('exercises')
        await sessions.toCollection().modify((s) => {
          if (!s.program) s.program = 'yael'
        })
        const weeks = await tx.table('weeks').toArray()
        for (const w of weeks) {
          await addProgramSessions(sessions, exercises, w.id, 'ohad')
        }
      })
  }
}

export const db = new FitnessDB()

// ---------------------------------------------------------------------------
// Real program — exact exercises from the reference screenshots
// ---------------------------------------------------------------------------
interface ExerciseTemplate {
  name: string
  muscleGroup: string
  targetReps: number
  repMin?: number
  restSeconds?: number
  imageUrl: string
}
interface SessionTemplate {
  name: string
  focus?: string
  estimatedMinutes: number
  exercises: ExerciseTemplate[]
}

const SESSION_TEMPLATES: SessionTemplate[] = [
  {
    name: 'אימון 1',
    estimatedMinutes: 80,
    exercises: [
      { name: 'היפ טראסט במכונה',                           muscleGroup: 'רגליים - ישבן',       targetReps: 10, imageUrl: '/exercises/t1-ex1-hip-thrust.jpeg' },
      { name: 'לחיצת רגליים בישיבה במכונה',                  muscleGroup: 'רגליים - ארבע ראשי',  targetReps: 10, imageUrl: '/exercises/t1-ex2-leg-press.jpeg' },
      { name: 'הרחקות ירך במכונה',                           muscleGroup: 'רגליים - מרחיקים',    targetReps: 12, imageUrl: '/exercises/t1-ex3-hip-abduction.jpeg' },
      { name: 'פשיטת ירך בהגבהה כנגד כבל תחתון',             muscleGroup: 'רגליים - ישבן',       targetReps: 12, imageUrl: '/exercises/t1-ex4-cable-hip-extension.jpeg' },
      { name: 'פול דאון באחיזה נייטרלית כנגד משולש',          muscleGroup: 'גב - משיכות',         targetReps: 10, imageUrl: '/exercises/t1-ex5-lat-pulldown.jpeg' },
      { name: 'לחיצת כתף בישיבה כנגד משקולות יד',            muscleGroup: 'כתפיים - אמצעית',     targetReps: 10, imageUrl: '/exercises/t1-ex6-shoulder-press.jpeg' },
      { name: 'לחיצת חזה כנגד מכונה',                        muscleGroup: 'חזה - אמצעי',         targetReps: 10, imageUrl: '/exercises/t1-ex7-chest-press.jpeg' },
      { name: 'כפיפות בטן בישיבה על הברכיים כנגד כבל',        muscleGroup: 'בטן',                 targetReps: 15, imageUrl: '/exercises/shared-cable-crunch.jpg' },
    ],
  },
  {
    name: 'אימון 2',
    estimatedMinutes: 77,
    exercises: [
      { name: 'לחיצת רגליים בשיפוע במכונה',                  muscleGroup: 'רגליים - ארבע ראשי',  targetReps: 10, imageUrl: '/exercises/t2-ex1-leg-press.jpg' },
      { name: 'פשיטת גו בכסא רומי בתוספת משקל גב עגול',      muscleGroup: 'רגליים - ישבן',       targetReps: 12, imageUrl: '/exercises/t2-ex2-back-extension.jpg' },
      { name: 'קירוב ירך במכונה',                             muscleGroup: 'רגליים - מקרבים',     targetReps: 12, imageUrl: '/exercises/t2-ex3-hip-adduction.jpg' },
      { name: 'כפיפת ברך בישיבה במכונה',                      muscleGroup: 'רגליים - המסטרינג',   targetReps: 10, imageUrl: '/exercises/t2-ex4-leg-curl.jpg' },
      { name: 'הרמת עקבים כנגד לחיצת רגליים',                 muscleGroup: 'רגליים - תאומים',     targetReps: 15, imageUrl: '/exercises/t2-ex5-calf-raise.jpg' },
      { name: 'חתירה בישיבה באחיזה צרה כנגד כבל תחתון משולש', muscleGroup: 'גב - חתירות',         targetReps: 10, imageUrl: '/exercises/t2-ex6-cable-row.jpg' },
      { name: 'הרחקות כתף לצדדים בעמידה כנגד משקולות יד',     muscleGroup: 'כתפיים - אמצעית',     targetReps: 15, imageUrl: '/exercises/t2-ex7-lateral-raise.jpg' },
      { name: 'כפיפות בטן בישיבה על הברכיים כנגד כבל',        muscleGroup: 'בטן',                 targetReps: 15, imageUrl: '/exercises/shared-cable-crunch.jpg' },
    ],
  },
  {
    name: 'אימון 3',
    estimatedMinutes: 80,
    exercises: [
      { name: 'היפ טראסט במכונה',                            muscleGroup: 'רגליים - ישבן',       targetReps: 10, imageUrl: '/exercises/t3-ex1-hip-thrust.jpg' },
      { name: 'סקוואט אחורי בסמית מאשין',                    muscleGroup: 'רגליים - ארבע ראשי',  targetReps: 10, imageUrl: '/exercises/t3-ex2-squat-smith.jpg' },
      { name: 'הרחקות ירך במכונה - השענות קדימה',             muscleGroup: 'רגליים - מרחיקים',    targetReps: 12, imageUrl: '/exercises/t3-ex3-hip-abduction.jpg' },
      { name: 'פול דאון באחיזה רחבה כנגד מוט',               muscleGroup: 'גב - משיכות',         targetReps: 10, imageUrl: '/exercises/t3-ex4-lat-pulldown.jpg' },
      { name: 'חתירה לסנטר כנגד כבל',                        muscleGroup: 'כתפיים - ידיות',      targetReps: 12, imageUrl: '/exercises/t3-ex5-cable-upright-row.jpg' },
      { name: 'כפיפות מרפקים בעמידה כנגד חבל תחתון',          muscleGroup: 'ידיים - יד קדמית',    targetReps: 12, imageUrl: '/exercises/t3-ex6-cable-bicep-rope.jpg' },
      { name: 'פשיטות מרפקים בעמידה כנגד מוט בפולי עליון',    muscleGroup: 'ידיים - יד אחורית',   targetReps: 12, imageUrl: '/exercises/t3-ex7-tricep-pushdown.jpg' },
      { name: 'כפיפות בטן בישיבה על הברכיים כנגד כבל',        muscleGroup: 'בטן',                 targetReps: 15, imageUrl: '/exercises/shared-cable-crunch.jpg' },
    ],
  },
]

// ---------------------------------------------------------------------------
// Ohad's program — 3 full-body sessions, upper-body emphasis, rep ranges
// (double progression: fill the range on all sets, then add weight)
// ---------------------------------------------------------------------------
const OHAD_TEMPLATES: SessionTemplate[] = [
  {
    name: 'אימון A',
    focus: 'סקוואט · חזה עליון · גב',
    estimatedMinutes: 75,
    exercises: [
      { name: 'סקוואט אחורי בסמית מאשין',                   muscleGroup: 'רגליים - ארבע ראשי', repMin: 6,  targetReps: 10, restSeconds: 180, imageUrl: '/exercises/t3-ex2-squat-smith.jpg' },
      { name: 'לחיצת חזה בשיפוע חיובי כנגד משקולות יד',      muscleGroup: 'חזה - עליון',        repMin: 8,  targetReps: 10, restSeconds: 150, imageUrl: '/exercises/o-incline-db-press.jpg' },
      { name: 'פול דאון באחיזה רחבה כנגד מוט',              muscleGroup: 'גב - משיכות',        repMin: 8,  targetReps: 10, restSeconds: 120, imageUrl: '/exercises/t3-ex4-lat-pulldown.jpg' },
      { name: 'כפיפת ברך בישיבה במכונה',                     muscleGroup: 'רגליים - המסטרינג',  repMin: 10, targetReps: 12, restSeconds: 90,  imageUrl: '/exercises/t2-ex4-leg-curl.jpg' },
      { name: 'הרחקות כתף לצדדים בעמידה כנגד משקולות יד',    muscleGroup: 'כתפיים - אמצעית',    repMin: 12, targetReps: 15, restSeconds: 60,  imageUrl: '/exercises/t2-ex7-lateral-raise.jpg' },
      { name: 'פשיטות מרפקים בעמידה כנגד מוט בפולי עליון',   muscleGroup: 'ידיים - יד אחורית',  repMin: 10, targetReps: 12, restSeconds: 75,  imageUrl: '/exercises/t3-ex7-tricep-pushdown.jpg' },
      { name: 'כפיפות בטן בישיבה על הברכיים כנגד כבל',       muscleGroup: 'בטן',                repMin: 12, targetReps: 15, restSeconds: 60,  imageUrl: '/exercises/shared-cable-crunch.jpg' },
    ],
  },
  {
    name: 'אימון B',
    focus: 'דדליפט רומני · גב · כתפיים',
    estimatedMinutes: 75,
    exercises: [
      { name: 'דדליפט רומני כנגד מוט',                        muscleGroup: 'רגליים - המסטרינג וישבן', repMin: 8,  targetReps: 10, restSeconds: 180, imageUrl: '/exercises/o-romanian-deadlift.jpg' },
      { name: 'חתירה בישיבה באחיזה צרה כנגד כבל תחתון משולש', muscleGroup: 'גב - חתירות',             repMin: 8,  targetReps: 10, restSeconds: 120, imageUrl: '/exercises/t2-ex6-cable-row.jpg' },
      { name: 'לחיצת כתף בישיבה כנגד משקולות יד',             muscleGroup: 'כתפיים - קדמית',          repMin: 8,  targetReps: 10, restSeconds: 150, imageUrl: '/exercises/t1-ex6-shoulder-press.jpeg' },
      { name: 'לחיצת רגליים בשיפוע במכונה',                   muscleGroup: 'רגליים - ארבע ראשי',      repMin: 10, targetReps: 12, restSeconds: 150, imageUrl: '/exercises/t2-ex1-leg-press.jpg' },
      { name: 'פרפר במכונה',                                  muscleGroup: 'חזה - אמצעי',             repMin: 12, targetReps: 15, restSeconds: 75,  imageUrl: '/exercises/o-pec-deck.jpg' },
      { name: 'כפיפות מרפקים בעמידה כנגד חבל תחתון',          muscleGroup: 'ידיים - יד קדמית',        repMin: 10, targetReps: 12, restSeconds: 75,  imageUrl: '/exercises/t3-ex6-cable-bicep-rope.jpg' },
      { name: 'פייס פול כנגד חבל בפולי עליון',                muscleGroup: 'כתפיים - אחורית',         repMin: 12, targetReps: 15, restSeconds: 60,  imageUrl: '/exercises/o-face-pull.jpg' },
    ],
  },
  {
    name: 'אימון C',
    focus: 'לחיצת חזה · רגליים · ידיים',
    estimatedMinutes: 80,
    exercises: [
      { name: 'לחיצת חזה בשכיבה כנגד מוט',             muscleGroup: 'חזה - אמצעי',              repMin: 6,  targetReps: 10, restSeconds: 180, imageUrl: '/exercises/o-bench-press.jpg' },
      { name: 'פול דאון באחיזה נייטרלית כנגד משולש',    muscleGroup: 'גב - משיכות',              repMin: 8,  targetReps: 10, restSeconds: 120, imageUrl: '/exercises/t1-ex5-lat-pulldown.jpeg' },
      { name: 'סקוואט בולגרי (רגל אחורית על ספסל)',   muscleGroup: 'רגליים - ארבע ראשי וישבן', repMin: 8,  targetReps: 10, restSeconds: 150, imageUrl: '/exercises/o-bulgarian-split-squat.jpg' },
      { name: 'פשיטת גו בכסא רומי בתוספת משקל',        muscleGroup: 'רגליים - המסטרינג וישבן',  repMin: 10, targetReps: 12, restSeconds: 90,  imageUrl: '/exercises/t2-ex2-back-extension.jpg' },
      { name: 'הרחקת כתף לצד כנגד כבל תחתון',          muscleGroup: 'כתפיים - אמצעית',          repMin: 12, targetReps: 15, restSeconds: 60,  imageUrl: '/exercises/o-cable-lateral-raise.jpg' },
      { name: 'כפיפות מרפקים בשיפוע כנגד משקולות יד',  muscleGroup: 'ידיים - יד קדמית',         repMin: 10, targetReps: 12, restSeconds: 75,  imageUrl: '/exercises/o-incline-db-curl.jpg' },
      { name: 'פשיטת מרפקים מעל הראש כנגד חבל',        muscleGroup: 'ידיים - יד אחורית',        repMin: 10, targetReps: 12, restSeconds: 75,  imageUrl: '/exercises/o-overhead-rope-extension.jpg' },
      { name: 'הרמת עקבים כנגד לחיצת רגליים',          muscleGroup: 'רגליים - תאומים',          repMin: 12, targetReps: 15, restSeconds: 60,  imageUrl: '/exercises/t2-ex5-calf-raise.jpg' },
    ],
  },
]

// Function declarations on purpose (hoisted): the v8 upgrade above calls
// addProgramSessions, which works with live tables and upgrade-transaction tables.
function templatesFor(program: Program): SessionTemplate[] {
  return program === 'ohad' ? OHAD_TEMPLATES : SESSION_TEMPLATES
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function addProgramSessions(sessions: any, exercises: any, weekId: number, program: Program) {
  const templates = templatesFor(program)
  for (let s = 0; s < templates.length; s++) {
    const tpl = templates[s]
    const sessionId = await sessions.add({
      weekId,
      sessionNumber: s + 1,
      name: tpl.name,
      estimatedMinutes: tpl.estimatedMinutes,
      program,
      ...(tpl.focus ? { focus: tpl.focus } : {}),
    })
    for (let e = 0; e < tpl.exercises.length; e++) {
      await exercises.add({
        sessionId,
        orderIndex: e,
        targetSets: 3,
        ...tpl.exercises[e],
      })
    }
  }
}

async function seedWeek(weekNumber: number) {
  const weekId = await db.weeks.add({ weekNumber })
  await addProgramSessions(db.sessions, db.exercises, weekId, 'yael')
  await addProgramSessions(db.sessions, db.exercises, weekId, 'ohad')
  return weekId
}

let seeding = false
export async function seedDatabase() {
  if (seeding) return
  seeding = true
  const count = await db.users.count()
  if (count > 0) { seeding = false; return }

  await db.users.bulkAdd([{ name: 'יעל' }, { name: 'אוהד' }])
  for (let w = 1; w <= 4; w++) {
    await seedWeek(w)
  }
  seeding = false
}

export async function createNewWeek() {
  const weeks = await db.weeks.toArray()
  const nextNumber = weeks.length > 0 ? Math.max(...weeks.map((w) => w.weekNumber)) + 1 : 1
  return seedWeek(nextNumber)
}
