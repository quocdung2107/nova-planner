import { addDays, format, parseISO } from "date-fns"

import { getDb } from "#lib/db"
import type { Habit, HabitLog, CreateHabitInput, UpdateHabitInput } from "#lib/types/habit"
import { randomUUID } from "#lib/uuid"

// Habits are local-only in v1: no cloud sync calls are made from this module.

interface HabitRow extends Omit<Habit, "archived"> {
  archived: number
}

function toHabit(row: HabitRow): Habit {
  return { ...row, archived: row.archived === 1 }
}

/** Local date string "yyyy-MM-dd" for a Date (never UTC-shifted). */
export function toDateString(date: Date): string {
  return format(date, "yyyy-MM-dd")
}

export function todayString(): string {
  return toDateString(new Date())
}

// ── Queries ──────────────────────────────────────────────────────────────────

export async function getHabits(): Promise<Habit[]> {
  const db = await getDb()
  const rows = await db.select<HabitRow[]>(
    "SELECT * FROM habits WHERE archived = 0 ORDER BY position ASC, created_at ASC"
  )
  return rows.map(toHabit)
}

export async function getHabitLogs(fromDate: string, toDate: string): Promise<HabitLog[]> {
  const db = await getDb()
  return db.select<HabitLog[]>(
    "SELECT * FROM habit_logs WHERE date >= $1 AND date <= $2 ORDER BY date ASC",
    [fromDate, toDate]
  )
}

// ── Mutations ────────────────────────────────────────────────────────────────

export async function createHabit(input: CreateHabitInput): Promise<Habit> {
  const db  = await getDb()
  const id  = randomUUID()
  const now = new Date().toISOString()

  const rows = await db.select<{ max_position: number | null }[]>(
    "SELECT MAX(position) AS max_position FROM habits"
  )
  const position = (rows[0]?.max_position ?? -1) + 1

  const habit: Habit = {
    id,
    name:       input.name,
    color:      input.color ?? "emerald",
    position,
    archived:   false,
    created_at: now,
    updated_at: now,
  }

  await db.execute(
    `INSERT INTO habits (id, name, color, position, archived, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [habit.id, habit.name, habit.color, habit.position, habit.archived ? 1 : 0, habit.created_at, habit.updated_at]
  )

  return habit
}

export async function updateHabit(id: string, input: UpdateHabitInput): Promise<void> {
  const db         = await getDb()
  const updated_at = new Date().toISOString()
  const fields     = Object.keys(input) as (keyof UpdateHabitInput)[]
  if (!fields.length) return
  const setClauses = fields.map((f, i) => `${f} = $${i + 1}`).join(", ")
  const values     = fields.map((f) => input[f] ?? null)

  await db.execute(
    `UPDATE habits SET ${setClauses}, updated_at = $${fields.length + 1} WHERE id = $${fields.length + 2}`,
    [...values, updated_at, id]
  )
}

export async function deleteHabit(id: string): Promise<void> {
  const db = await getDb()
  // Delete logs explicitly as well — SQLite foreign-key cascades depend on
  // PRAGMA foreign_keys being enabled for the connection.
  await db.execute("DELETE FROM habit_logs WHERE habit_id = $1", [id])
  await db.execute("DELETE FROM habits WHERE id = $1", [id])
}

/**
 * Toggles one day for a habit. Returns the new done state:
 * true if the day is now logged, false if the log was removed.
 */
export async function toggleHabitLog(habitId: string, date: string): Promise<boolean> {
  const db = await getDb()
  const rows = await db.select<{ id: string }[]>(
    "SELECT id FROM habit_logs WHERE habit_id = $1 AND date = $2",
    [habitId, date]
  )
  if (rows.length) {
    await db.execute("DELETE FROM habit_logs WHERE id = $1", [rows[0].id])
    return false
  }
  await db.execute(
    "INSERT INTO habit_logs (id, habit_id, date, created_at) VALUES ($1, $2, $3, $4)",
    [randomUUID(), habitId, date, new Date().toISOString()]
  )
  return true
}

// ── Streak / progress helpers (pure) ─────────────────────────────────────────
// All dates are local "yyyy-MM-dd" strings, which sort lexicographically.

/**
 * Consecutive completed days ending today or yesterday.
 * If neither today nor yesterday is done, the streak is 0.
 */
export function currentStreak(dates: Set<string>, today: string): number {
  let cursor = parseISO(today)
  if (!dates.has(today)) {
    cursor = addDays(cursor, -1)
    if (!dates.has(toDateString(cursor))) return 0
  }
  let streak = 0
  while (dates.has(toDateString(cursor))) {
    streak++
    cursor = addDays(cursor, -1)
  }
  return streak
}

/** Completed days within the last 7 days (today and the 6 days before it). */
export function weeklyDoneCount(dates: Set<string>, today: string): number {
  const end = parseISO(today)
  let count = 0
  for (let i = 0; i < 7; i++) {
    if (dates.has(toDateString(addDays(end, -i)))) count++
  }
  return count
}
