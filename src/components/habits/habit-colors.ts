// Static Tailwind class maps for habit colors. Keys are the values stored in
// habits.color — classes must be written out in full so Tailwind can see them.
export interface HabitColorClasses {
  label: string
  dot: string        // small color dot
  swatch: string     // color-picker swatch button
  filled: string     // filled day circle (done)
}

export const HABIT_COLORS: Record<string, HabitColorClasses> = {
  emerald: { label: "Emerald", dot: "bg-emerald-500", swatch: "bg-emerald-500", filled: "bg-emerald-500 text-white border-emerald-500" },
  sky:     { label: "Sky",     dot: "bg-sky-500",     swatch: "bg-sky-500",     filled: "bg-sky-500 text-white border-sky-500" },
  violet:  { label: "Violet",  dot: "bg-violet-500",  swatch: "bg-violet-500",  filled: "bg-violet-500 text-white border-violet-500" },
  amber:   { label: "Amber",   dot: "bg-amber-500",   swatch: "bg-amber-500",   filled: "bg-amber-500 text-white border-amber-500" },
  rose:    { label: "Rose",    dot: "bg-rose-500",    swatch: "bg-rose-500",    filled: "bg-rose-500 text-white border-rose-500" },
  cyan:    { label: "Cyan",    dot: "bg-cyan-500",    swatch: "bg-cyan-500",    filled: "bg-cyan-500 text-white border-cyan-500" },
}

export const HABIT_COLOR_KEYS = Object.keys(HABIT_COLORS)

export function habitColor(color: string): HabitColorClasses {
  return HABIT_COLORS[color] ?? HABIT_COLORS.emerald
}
