import { addDays } from "date-fns"
import { create } from "zustand"

import { getHabits, getHabitLogs, toggleHabitLog, toDateString } from "#lib/habits"
import type { Habit } from "#lib/types/habit"

/** How many days of logs to load (enough for streaks + the 7-day strip). */
const LOG_WINDOW_DAYS = 35

interface HabitsStore {
  habits:      Habit[]
  logsByHabit: Record<string, string[]>   // habit id -> local date strings "yyyy-MM-dd"
  loading:     boolean

  loadHabits:  () => Promise<void>
  addHabit:    (habit: Habit) => void
  patchHabit:  (id: string, patch: Partial<Habit>) => void
  removeHabit: (id: string) => void
  toggleLog:   (habitId: string, date: string) => Promise<void>
}

export const useHabitsStore = create<HabitsStore>((set, get) => ({
  habits:      [],
  logsByHabit: {},
  loading:     true,

  loadHabits: async () => {
    set({ loading: true })
    try {
      const today = new Date()
      const from  = toDateString(addDays(today, -(LOG_WINDOW_DAYS - 1)))
      const to    = toDateString(today)
      const [habits, logs] = await Promise.all([getHabits(), getHabitLogs(from, to)])

      const logsByHabit: Record<string, string[]> = {}
      for (const log of logs) {
        const list = logsByHabit[log.habit_id] ?? []
        list.push(log.date)
        logsByHabit[log.habit_id] = list
      }
      set({ habits, logsByHabit, loading: false })
    } catch (err) {
      console.error("Failed to load habits:", err)
      set({ loading: false })
    }
  },

  addHabit:    (habit)       => set(s => ({ habits: [...s.habits, habit] })),
  patchHabit:  (id, patch)   => set(s => ({ habits: s.habits.map(h => h.id === id ? { ...h, ...patch } : h) })),
  removeHabit: (id)          => set(s => {
    const logsByHabit = { ...s.logsByHabit }
    delete logsByHabit[id]
    return { habits: s.habits.filter(h => h.id !== id), logsByHabit }
  }),

  // Optimistic toggle — flips local state first, then persists; reloads on error.
  toggleLog: async (habitId, date) => {
    const current = get().logsByHabit[habitId] ?? []
    const done    = current.includes(date)
    set(s => ({
      logsByHabit: {
        ...s.logsByHabit,
        [habitId]: done
          ? (s.logsByHabit[habitId] ?? []).filter(d => d !== date)
          : [...(s.logsByHabit[habitId] ?? []), date],
      },
    }))
    try {
      await toggleHabitLog(habitId, date)
    } catch (err) {
      console.error("Failed to toggle habit log:", err)
      get().loadHabits()
    }
  },
}))
