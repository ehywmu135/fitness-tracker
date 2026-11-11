// ---------------------------------------------------------------------------
// Nutrition plan — taken from the reference screenshots.
// All macro values are for the food's default `amount`; changing the amount
// scales them linearly.
// ---------------------------------------------------------------------------

export interface FoodOption {
  name: string
  amount: number // default amount in `unit`
  unit: 'גרם' | 'יחידה' | 'מנה' | 'כף' | '' // '' = shown as a plain number (as in the reference app)
  note?: string // what a combined portion contains, shown under the name
  step: number // base step shown in the quantity editor (e.g. 100 גרם, 1 יחידה)
  kcal: number
  protein: number
  carbs: number
  fat: number
}

export interface PlanItem {
  id: string
  food: FoodOption
  alternatives: FoodOption[]
}

export interface Meal {
  id: string
  name: string
  items: PlanItem[]
  // Optional whole-meal alternative (switched with a toggle on the meal card)
  label?: string // short name of the default version
  altLabel?: string // short name of the alternative version
  altItems?: PlanItem[]
}

/** The items of the meal version currently in use. */
export function activeItems(meal: Meal, useAlt: boolean): PlanItem[] {
  return useAlt && meal.altItems ? meal.altItems : meal.items
}

export interface DailyTargets {
  kcal: number
  protein: number
  carbs: number
  fat: number
}

const g = (
  name: string,
  amount: number,
  kcal: number,
  protein: number,
  carbs: number,
  fat: number,
): FoodOption => ({ name, amount, unit: 'גרם', step: 100, kcal, protein, carbs, fat })

/** A whole portion (e.g. a shake, or several foods eaten together). */
const portion = (
  name: string,
  kcal: number,
  protein: number,
  carbs: number,
  fat: number,
  note?: string,
): FoodOption => ({ name, amount: 1, unit: 'מנה', step: 1, kcal, protein, carbs, fat, note })

const u = (
  name: string,
  amount: number,
  kcal: number,
  protein: number,
  carbs: number,
  fat: number,
): FoodOption => ({ name, amount, unit: 'יחידה', step: 1, kcal, protein, carbs, fat })

// ===========================================================================
// יעל — copied exactly from the reference app screenshots
// ===========================================================================
const YAEL_TARGETS: DailyTargets = {
  kcal: 1363,
  protein: 113.3,
  carbs: 127.1,
  fat: 43.4,
}

const YAEL_MEALS: Meal[] = [
  {
    id: 'breakfast',
    name: 'ארוחת בוקר',
    items: [
      { id: 'yogurt', food: g('יוגורט GO טבעי', 200, 144, 20, 9, 3.4), alternatives: [] },
      { id: 'granola', food: g('גרנולה פיטנס שוקולד', 15, 65, 1.3, 10.5, 2), alternatives: [] },
      { id: 'peanut-butter', food: g('חמאת בוטנים טבעית', 30, 185, 7.5, 4.5, 15), alternatives: [] },
    ],
  },
  {
    id: 'lunch',
    name: 'ארוחת צהריים',
    items: [
      {
        id: 'quinoa',
        food: g('קינואה לאחר בישול', 140, 168, 6.2, 29.8, 2.7),
        alternatives: [
          g('אורז לבן פרסי לאחר בישול', 141, 176, 3.8, 39.6, 0.3),
          g('תפוח אדמה מבושל ללא קליפה', 196, 169, 3.4, 39.2, 0.2),
          g('בטטה אפויה עם קליפה', 188, 169, 3.8, 38.9, 0.3),
          g('קוסקוס', 140, 168, 5.6, 35.5, 0.3),
          g('פסטה לאחר בישול', 108, 167, 5.8, 33.4, 0.9),
          g('פתיתים לאחר בישול', 108, 199, 6.2, 42, 0.6),
          g('אטריות אורז דקות לאחר בישול', 144, 167, 3, 39, 0),
        ],
      },
      {
        id: 'chicken',
        food: g('חזה עוף לאחר בישול', 150, 248, 46.5, 0, 5.4),
        alternatives: [
          g('טופו', 164, 248, 26.2, 8.7, 13.1),
          g('פרגית לאחר בישול', 130, 247, 37.6, 0, 9.6),
          g('פילה אמנון אפוי/מבושל', 193, 247, 50.5, 0, 5.1),
        ],
      },
      { id: 'cherry-tomatoes', food: u('עגבניות שרי', 10, 20, 1, 4, 0.2), alternatives: [] },
    ],
  },
  {
    id: 'dinner',
    name: 'ארוחת ערב',
    label: 'ביצים ופיתה',
    altLabel: 'קינואה ובטטה',
    items: [
      { id: 'scrambled-eggs', food: u('ביצים מקושקשות (גודל L)', 2, 194, 17, 1, 13.2), alternatives: [] },
      { id: 'pita', food: { ...g('פיתה כוסמין קטנה', 60, 150, 5.4, 28.8, 1.2), unit: 'יחידה', amount: 1, step: 1, note: '~60 גרם' }, alternatives: [] },
      { id: 'cottage', food: g('קוטג׳ 3%', 100, 77, 11, 1.5, 3), alternatives: [] },
      { id: 'cucumber', food: g('מלפפון ירוק', 100, 15, 0.7, 3.6, 0.1), alternatives: [] },
      { id: 'tomato', food: g('עגבנייה', 100, 18, 0.9, 3.9, 0.2), alternatives: [] },
      { id: 'bell-pepper', food: g('פלפל אדום', 100, 31, 1, 6, 0.3), alternatives: [] },
    ],
    altItems: [
      { id: 'alt-egg', food: g('ביצה גודל L', 68, 97, 8.5, 0.5, 6.6), alternatives: [] },
      { id: 'alt-quinoa', food: g('קינואה לאחר בישול', 100, 120, 4.4, 21.3, 1.9), alternatives: [] },
      { id: 'alt-bulgarian', food: g('גבינה בולגרית מעודנת 5%', 50, 47, 8, 0.8, 2.5), alternatives: [] },
      { id: 'alt-cucumber', food: g('מלפפון ירוק', 100, 15, 0.7, 3.6, 0.1), alternatives: [] },
      { id: 'alt-tomato', food: g('עגבנייה', 100, 18, 0.9, 3.9, 0.2), alternatives: [] },
      { id: 'alt-sweet-potato', food: g('בטטה מבושלת ללא קליפה', 100, 76, 1.4, 17.7, 0.1), alternatives: [] },
    ],
  },
]

// ===========================================================================
// אוהד — from the Excel sheet (ohads nutrition.jpg).
// The sheet gives weights only, so every value is computed from a per-100g
// table. Foods that also appear in יעל's plan use the exact same per-100g
// values as her plan (derived from the reference app), so both plans agree.
// ===========================================================================
type Per100 = { kcal: number; protein: number; carbs: number; fat: number }

const PER_100G: Record<string, Per100> = {
  yogurtGo: { kcal: 72, protein: 10, carbs: 4.5, fat: 1.7 },
  granola: { kcal: 433, protein: 8.7, carbs: 70, fat: 13.3 },
  peanutButter: { kcal: 617, protein: 25, carbs: 15, fat: 50 },
  chickenBreast: { kcal: 165, protein: 31, carbs: 0, fat: 3.6 },
  quinoa: { kcal: 120, protein: 4.4, carbs: 21.3, fat: 1.9 },
  speltSourdough: { kcal: 250, protein: 9, carbs: 47, fat: 2 }, // standard label value
  whiteCheese5: { kcal: 96, protein: 9, carbs: 3.5, fat: 5 }, // standard label value
  sweetPotatoBoiled: { kcal: 76, protein: 1.4, carbs: 17.7, fat: 0.1 },
  bulgarian5: { kcal: 94, protein: 16, carbs: 1.6, fat: 5 },
  bellPepper: { kcal: 31, protein: 1, carbs: 6, fat: 0.3 }, // red bell pepper
  cottage3: { kcal: 77, protein: 11, carbs: 1.5, fat: 3 }, // standard label value
  cucumber: { kcal: 15, protein: 0.7, carbs: 3.6, fat: 0.1 },
  tomato: { kcal: 18, protein: 0.9, carbs: 3.9, fat: 0.2 },
  // lunch alternatives
  tilapia: { kcal: 128, protein: 26.2, carbs: 0, fat: 2.6 },
  pargit: { kcal: 190, protein: 28.9, carbs: 0, fat: 7.4 },
  tofu: { kcal: 151, protein: 16, carbs: 5.3, fat: 8 },
  potatoBoiled: { kcal: 86, protein: 1.7, carbs: 20, fat: 0.1 },
  sweetPotatoBaked: { kcal: 90, protein: 2, carbs: 20.7, fat: 0.2 },
  persianRice: { kcal: 125, protein: 2.7, carbs: 28.1, fat: 0.2 },
  couscous: { kcal: 120, protein: 4, carbs: 25.4, fat: 0.2 },
  pasta: { kcal: 155, protein: 5.4, carbs: 30.9, fat: 0.8 },
  ptitim: { kcal: 184, protein: 5.7, carbs: 38.9, fat: 0.6 },
  // Homemade bolognese, cooked weight: lean ground beef (5–10% fat) ~half the
  // pot by weight, crushed tomatoes, carrots, onion, 1 tbsp oil.
  bolognese: { kcal: 120, protein: 13, carbs: 5, fat: 5.3 },
}

/** Food measured in grams, macros computed from the per-100g table. */
function grams(name: string, amount: number, key: keyof typeof PER_100G): FoodOption {
  const v = PER_100G[key]
  const r = amount / 100
  const one = (n: number) => Math.round(n * r * 10) / 10
  return g(name, amount, Math.round(v.kcal * r), one(v.protein), one(v.carbs), one(v.fat))
}

/** The yogurt breakfast from the sheet, as one alternative portion. */
function breakfastCombo(): FoodOption {
  const parts = [
    grams('יוגורט GO טבעי', 200, 'yogurtGo'),
    grams('גרנולה פיטנס שוקולד', 50, 'granola'),
    grams('חמאת בוטנים טבעית', 50, 'peanutButter'),
  ]
  const sum = (k: 'kcal' | 'protein' | 'carbs' | 'fat') => Math.round(parts.reduce((t, p) => t + p[k], 0) * 10) / 10
  return portion(
    'יוגורט, גרנולה וחמאת בוטנים',
    Math.round(sum('kcal')),
    sum('protein'),
    sum('carbs'),
    sum('fat'),
    parts.map((p) => `${p.name} ${p.amount} גרם`).join(' · '),
  )
}

// Osem "בייגלה שטוחים" (sesame, refined salt) per 100g: 436 kcal, 11.5g protein,
// 70.5g carbs, 12g fat. Osem serving: 30g ≈ 22 pieces → ~1.36g per piece.
// Default 25 pieces (middle of the 20–30 range) ≈ 34g.
function shtuchim(): FoodOption {
  const pieces = 25
  const gramsTotal = pieces * (30 / 22)
  const r = gramsTotal / 100
  const one = (n: number) => Math.round(n * r * 10) / 10
  return {
    name: 'בייגלה שטוחים',
    amount: pieces,
    unit: 'יחידה',
    step: 1,
    kcal: Math.round(436 * r),
    protein: one(11.5),
    carbs: one(70.5),
    fat: one(12),
    note: `~${Math.round(gramsTotal)} גרם`,
  }
}

const OHAD_MEALS: Meal[] = [
  {
    id: 'breakfast',
    name: 'ארוחת בוקר',
    items: [
      {
        id: 'main',
        // 40g protein / 200 kcal; the remaining 40 kcal split as ~5g carbs + ~2.2g fat
        food: portion('שייק חלבון', 200, 40, 5, 2.2, '40 גרם חלבון'),
        alternatives: [breakfastCombo()],
      },
    ],
  },
  {
    id: 'lunch',
    name: 'ארוחת צהריים',
    items: [
      {
        id: 'chicken',
        food: grams('חזה עוף לאחר בישול', 240, 'chickenBreast'),
        alternatives: [
          grams('פילה אמנון אפוי/מבושל', 310, 'tilapia'),
          grams('פרגית לאחר בישול', 210, 'pargit'),
          grams('בולונז (בשר טחון, עגבניות וגזר)', 330, 'bolognese'),
          grams('טופו', 260, 'tofu'),
        ],
      },
      {
        id: 'quinoa',
        food: grams('קינואה לאחר בישול', 240, 'quinoa'),
        alternatives: [
          grams('תפוח אדמה מבושל', 335, 'potatoBoiled'),
          grams('בטטה אפויה', 320, 'sweetPotatoBaked'),
          grams('אורז לבן פרסי לאחר בישול', 245, 'persianRice'),
          grams('קוסקוס', 240, 'couscous'),
          grams('פסטה לאחר בישול', 180, 'pasta'),
          grams('פתיתים לאחר בישול', 185, 'ptitim'),
        ],
      },
      { id: 'cherry-tomatoes', food: u('עגבניות שרי', 16, 32, 1.6, 6.4, 0.3), alternatives: [] },
      { id: 'shtuchim', food: shtuchim(), alternatives: [] },
    ],
  },
  {
    id: 'snack',
    name: 'ארוחת ביניים',
    items: [
      { id: 'bread', food: grams('לחם מחמצת כוסמין', 95, 'speltSourdough'), alternatives: [] },
      { id: 'white-cheese', food: grams('גבינה לבנה 5%', 32, 'whiteCheese5'), alternatives: [] },
    ],
  },
  {
    id: 'dinner',
    name: 'ארוחת ערב',
    label: 'ביצים ופיתה',
    altLabel: 'קינואה ובטטה',
    items: [
      { id: 'scrambled-eggs', food: u('ביצים מקושקשות (גודל L)', 3, 291, 25.5, 1.5, 19.8), alternatives: [] },
      { id: 'pita', food: { ...g('פיתה כוסמין קטנה', 60, 150, 5.4, 28.8, 1.2), unit: 'יחידה', amount: 1, step: 1, note: '~60 גרם' }, alternatives: [] },
      { id: 'cottage', food: grams('קוטג׳ 3%', 150, 'cottage3'), alternatives: [] },
      { id: 'cucumber', food: grams('מלפפון ירוק', 160, 'cucumber'), alternatives: [] },
      { id: 'tomato', food: grams('עגבנייה', 160, 'tomato'), alternatives: [] },
      { id: 'bell-pepper', food: grams('פלפל אדום', 160, 'bellPepper'), alternatives: [] },
    ],
    altItems: [
      { id: 'alt-egg', food: u('ביצה גודל L', 2, 194, 17, 1, 13.2), alternatives: [] },
      { id: 'alt-quinoa', food: grams('קינואה לאחר בישול', 210, 'quinoa'), alternatives: [] },
      { id: 'alt-sweet-potato', food: grams('בטטה מבושלת ללא קליפה', 160, 'sweetPotatoBoiled'), alternatives: [] },
      { id: 'alt-bulgarian', food: grams('גבינה בולגרית מעודנת 5%', 80, 'bulgarian5'), alternatives: [] },
      { id: 'alt-cucumber', food: grams('מלפפון ירוק', 160, 'cucumber'), alternatives: [] },
      { id: 'alt-tomato', food: grams('עגבנייה', 160, 'tomato'), alternatives: [] },
    ],
  },
]

/** Daily targets = the sum of the plan as written (the plan is the prescription). */
function totalsOf(meals: Meal[]): DailyTargets {
  const t = { kcal: 0, protein: 0, carbs: 0, fat: 0 }
  for (const m of meals)
    for (const i of m.items) {
      t.kcal += i.food.kcal
      t.protein += i.food.protein
      t.carbs += i.food.carbs
      t.fat += i.food.fat
    }
  const one = (n: number) => Math.round(n * 10) / 10
  return { kcal: Math.round(t.kcal), protein: one(t.protein), carbs: one(t.carbs), fat: one(t.fat) }
}

// ===========================================================================
// Plans per user (matched by the user's name)
// ===========================================================================
export interface NutritionPlan {
  targets: DailyTargets
  meals: Meal[]
}

export const PLANS: Record<string, NutritionPlan> = {
  'יעל': { targets: YAEL_TARGETS, meals: YAEL_MEALS },
  'אוהד': { targets: totalsOf(OHAD_MEALS), meals: OHAD_MEALS },
}

export function planFor(userName: string | undefined): NutritionPlan {
  return (userName && PLANS[userName]) || PLANS['יעל']
}

/** Returns the option currently chosen for a plan item. */
export function optionFor(item: PlanItem, choiceIndex: number): FoodOption {
  return choiceIndex >= 0 && item.alternatives[choiceIndex] ? item.alternatives[choiceIndex] : item.food
}

/** Scales an option's macros to a given amount. */
export function scaled(option: FoodOption, amount: number) {
  const r = option.amount > 0 ? amount / option.amount : 0
  return {
    kcal: Math.round(option.kcal * r),
    protein: Math.round(option.protein * r * 10) / 10,
    carbs: Math.round(option.carbs * r * 10) / 10,
    fat: Math.round(option.fat * r * 10) / 10,
  }
}

export function formatAmount(amount: number, unit: FoodOption['unit']) {
  const n = Math.round(amount * 10) / 10
  return unit ? `${n} ${unit}` : `${n}`
}

/** Today's date as YYYY-MM-DD in local time. */
export function todayKey() {
  const d = new Date()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}
