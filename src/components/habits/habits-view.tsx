import { useEffect, useMemo, useState } from "react"
import { addDays, format } from "date-fns"
import { Check, Flame, Pencil, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "#components/ui/alert-dialog"
import { Button, buttonVariants } from "#components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "#components/ui/dialog"
import { Input } from "#components/ui/input"
import { Label } from "#components/ui/label"
import { Skeleton } from "#components/ui/skeleton"
import { cn } from "#lib/utils"
import { createHabit, updateHabit, deleteHabit, currentStreak, weeklyDoneCount, toDateString, todayString } from "#lib/habits"
import type { Habit } from "#lib/types/habit"
import { useHabitsStore } from "#store/habits"
import { HABIT_COLOR_KEYS, habitColor } from "./habit-colors"

export function HabitsView() {
  const habits      = useHabitsStore(s => s.habits)
  const logsByHabit = useHabitsStore(s => s.logsByHabit)
  const loading     = useHabitsStore(s => s.loading)
  const { loadHabits, addHabit, patchHabit, removeHabit, toggleLog } = useHabitsStore.getState()

  const [dialogOpen, setDialogOpen]   = useState(false)
  const [editing, setEditing]         = useState<Habit | null>(null)
  const [name, setName]               = useState("")
  const [color, setColor]             = useState("emerald")
  const [saving, setSaving]           = useState(false)
  const [deleting, setDeleting]       = useState<Habit | null>(null)

  useEffect(() => { loadHabits() }, [loadHabits])

  const today = todayString()
  // Last 7 days, oldest -> today, for the strip.
  const last7 = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(new Date(), i - 6)),
    []
  )

  function openCreate() {
    setEditing(null)
    setName("")
    setColor("emerald")
    setDialogOpen(true)
  }

  function openEdit(habit: Habit) {
    setEditing(habit)
    setName(habit.name)
    setColor(habit.color)
    setDialogOpen(true)
  }

  async function handleSave() {
    const trimmed = name.trim()
    if (!trimmed) return
    setSaving(true)
    try {
      if (editing) {
        await updateHabit(editing.id, { name: trimmed, color })
        patchHabit(editing.id, { name: trimmed, color })
      } else {
        const created = await createHabit({ name: trimmed, color })
        addHabit(created)
      }
      setDialogOpen(false)
    } catch (err) {
      console.error("Failed to save habit:", err)
      toast.error("Failed to save habit")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!deleting) return
    const id = deleting.id
    setDeleting(null)
    removeHabit(id)
    try {
      await deleteHabit(id)
    } catch (err) {
      console.error("Failed to delete habit:", err)
      loadHabits() // revert on failure
    }
  }

  if (loading && habits.length === 0) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-24 w-full rounded-xl" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-semibold">Habits</h2>
        <Button size="sm" className="ml-auto h-8" onClick={openCreate}>
          <Plus className="size-3.5" />
          Add habit
        </Button>
      </div>

      {habits.length === 0 ? (
        <div className="rounded-xl border border-dashed px-6 py-12 text-center">
          <Flame className="mx-auto mb-3 size-8 text-muted-foreground" />
          <p className="font-medium">No habits yet</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
            Small steps, every day. Add your first habit and tap the circles to keep your streak going.
          </p>
          <Button size="sm" className="mt-4" onClick={openCreate}>
            <Plus className="size-3.5" />
            Add habit
          </Button>
        </div>
      ) : (
        habits.map(habit => {
          const dates  = new Set(logsByHabit[habit.id] ?? [])
          const streak = currentStreak(dates, today)
          const week   = weeklyDoneCount(dates, today)
          const colors = habitColor(habit.color)
          return (
            <div key={habit.id} className="rounded-xl border p-4">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
                <div className="flex min-w-0 flex-1 items-center gap-2.5">
                  <span className={cn("size-3 shrink-0 rounded-full", colors.dot)} />
                  <span className="truncate font-medium">{habit.name}</span>
                </div>

                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1" title="Current streak">
                    <Flame className={cn("size-4", streak > 0 && "text-orange-500")} />
                    {streak} day{streak === 1 ? "" : "s"}
                  </span>
                  <span title="Done in the last 7 days">{week}/7 this week</span>
                  <Button variant="ghost" size="icon" className="size-7" onClick={() => openEdit(habit)} aria-label={`Edit ${habit.name}`}>
                    <Pencil className="size-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="size-7 text-muted-foreground hover:text-destructive" onClick={() => setDeleting(habit)} aria-label={`Delete ${habit.name}`}>
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>

              {/* Last 7 days strip */}
              <div className="mt-3 flex items-center gap-2">
                {last7.map(day => {
                  const key     = toDateString(day)
                  const done    = dates.has(key)
                  const isToday = key === today
                  return (
                    <div key={key} className="flex flex-col items-center gap-1">
                      <button
                        type="button"
                        onClick={() => toggleLog(habit.id, key)}
                        aria-label={`${habit.name} on ${format(day, "EEEE, MMM d")}`}
                        className={cn(
                          "flex size-9 items-center justify-center rounded-full border text-xs transition-colors",
                          done
                            ? colors.filled
                            : "border-border text-muted-foreground hover:bg-accent",
                          isToday && !done && "ring-2 ring-primary ring-offset-2 ring-offset-background",
                          isToday && done && "ring-2 ring-primary ring-offset-2 ring-offset-background"
                        )}
                      >
                        {done ? <Check className="size-4" /> : format(day, "d")}
                      </button>
                      <span className={cn("text-[10px]", isToday ? "font-semibold" : "text-muted-foreground")}>
                        {format(day, "EEEEE")}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })
      )}

      {/* Add / Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Habit" : "Add Habit"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="habit-name">Name</Label>
              <Input
                id="habit-name"
                placeholder="e.g. Read 20 minutes"
                value={name}
                onChange={e => setName(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") handleSave() }}
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex items-center gap-2">
                {HABIT_COLOR_KEYS.map(key => (
                  <button
                    key={key}
                    type="button"
                    aria-label={habitColor(key).label}
                    onClick={() => setColor(key)}
                    className={cn(
                      "size-7 rounded-full transition-transform",
                      habitColor(key).swatch,
                      color === key && "ring-2 ring-primary ring-offset-2 ring-offset-background scale-110"
                    )}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving || !name.trim()}>
              {saving ? "Saving..." : editing ? "Save changes" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleting} onOpenChange={open => { if (!open) setDeleting(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete habit?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete “{deleting?.name}” and its entire check-in history. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className={buttonVariants({ variant: "destructive" })} onClick={handleDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
