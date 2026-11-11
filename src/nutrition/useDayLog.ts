import { useLiveQuery } from 'dexie-react-hooks'
import { db, type FoodLog } from '../db'
import { planFor, type PlanItem } from './plan'

export interface ItemState {
  eaten: boolean
  choiceIndex: number
  amount: number
}

export function itemKey(mealId: string, itemId: string) {
  return `${mealId}:${itemId}`
}

/** All food logs for one user on one day, keyed by itemKey. */
export function useDayLog(userId: number | null, date: string) {
  return useLiveQuery(async () => {
    if (userId === null) return new Map<string, FoodLog>()
    const rows = await db.foodLogs.where('[userId+date]').equals([userId, date]).toArray()
    return new Map(rows.map((r) => [r.itemKey, r]))
  }, [userId, date])
}

export function stateFor(item: PlanItem, log: FoodLog | undefined): ItemState {
  if (!log) return { eaten: false, choiceIndex: -1, amount: item.food.amount }
  return { eaten: log.eaten, choiceIndex: log.choiceIndex, amount: log.amount }
}

/** Creates or updates the log row for one food slot on one day. */
export async function saveItemState(
  userId: number,
  date: string,
  key: string,
  item: PlanItem,
  patch: Partial<ItemState>,
) {
  const existing = await db.foodLogs.where('[userId+date+itemKey]').equals([userId, date, key]).first()
  if (existing?.id != null) {
    await db.foodLogs.update(existing.id, patch)
  } else {
    await db.foodLogs.add({
      userId,
      date,
      itemKey: key,
      eaten: false,
      choiceIndex: -1,
      amount: item.food.amount,
      ...patch,
    })
  }
}

/** The nutrition plan of the given user (undefined while loading). */
export function usePlan(userId: number | null) {
  return useLiveQuery(async () => {
    if (userId === null) return null
    const user = await db.users.get(userId)
    return { userName: user?.name ?? '', plan: planFor(user?.name) }
  }, [userId])
}

/** Whole-meal alternative: stored as a special row per meal per day. */
export function variantKey(mealId: string) {
  return `${mealId}:__variant`
}

export function usesAlt(log: Map<string, FoodLog> | undefined, mealId: string) {
  return log?.get(variantKey(mealId))?.choiceIndex === 0
}

export async function setMealVariant(userId: number, date: string, mealId: string, useAlt: boolean) {
  const key = variantKey(mealId)
  const existing = await db.foodLogs.where('[userId+date+itemKey]').equals([userId, date, key]).first()
  const choiceIndex = useAlt ? 0 : -1
  if (existing?.id != null) await db.foodLogs.update(existing.id, { choiceIndex })
  else await db.foodLogs.add({ userId, date, itemKey: key, eaten: false, choiceIndex, amount: 0 })
}
