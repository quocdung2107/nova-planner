export interface Habit {
  id: string
  name: string
  color: string        // palette key, e.g. "emerald" — see habit color map in components
  position: number
  archived: boolean
  created_at: string   // ISO datetime string
  updated_at: string   // ISO datetime string
}

export interface HabitLog {
  id: string
  habit_id: string
  date: string         // local date "yyyy-MM-dd"
  created_at: string   // ISO datetime string
}

export interface CreateHabitInput {
  name: string
  color?: string
}

export type UpdateHabitInput = Partial<Pick<Habit, "name" | "color" | "position">>
