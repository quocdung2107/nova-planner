import { useEffect, useMemo, useState } from "react"
import {
  addDays,
  addMonths,
  format,
  isSameMonth,
  isToday,
  parseISO,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns"
import { ChevronLeft, ChevronRight, Plus } from "lucide-react"

import { Button } from "#components/ui/button"
import { Skeleton } from "#components/ui/skeleton"
import { cn } from "#lib/utils"
import { createTodo, updateTodo } from "#lib/todos"
import type { Todo } from "#lib/types/todo"
import { useTodosStore } from "#store/todos"
import { TodoDialog, type TodoFormValues } from "#components/todos/todo-dialog"

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
const MAX_CHIPS = 3

const PRIORITY_DOT: Record<string, string> = {
  high:   "bg-red-500",
  medium: "bg-amber-500",
  low:    "bg-blue-500",
}

const STATUS_LABEL: Record<Todo["status"], string> = {
  todo:        "Todo",
  in_progress: "In Progress",
  completed:   "Completed",
}

function dateKey(d: Date): string {
  return format(d, "yyyy-MM-dd")
}

export function CalendarView() {
  const todos   = useTodosStore(s => s.todos)
  const loading = useTodosStore(s => s.loading)
  const { loadTodos, addTodo, patchTodo } = useTodosStore.getState()

  const todayStr = dateKey(new Date())
  const [cursor, setCursor]           = useState(() => startOfMonth(new Date()))
  const [selected, setSelected]       = useState<string>(todayStr)
  const [dialogOpen, setDialogOpen]   = useState(false)
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null)

  useEffect(() => { loadTodos() }, [loadTodos])

  // 42 cells (6 rows) starting on the Monday of the week containing the 1st.
  const days = useMemo(() => {
    const gridStart = startOfWeek(startOfMonth(cursor), { weekStartsOn: 1 })
    return Array.from({ length: 42 }, (_, i) => addDays(gridStart, i))
  }, [cursor])

  const todosByDate = useMemo(() => {
    const map = new Map<string, Todo[]>()
    for (const t of todos) {
      if (!t.due_date) continue
      const list = map.get(t.due_date) ?? []
      list.push(t)
      map.set(t.due_date, list)
    }
    return map
  }, [todos])

  const selectedTodos = useMemo(
    () => [...(todosByDate.get(selected) ?? [])].sort(
      (a, b) => Number(a.status === "completed") - Number(b.status === "completed") || a.position - b.position
    ),
    [todosByDate, selected]
  )

  const overdueTodos = useMemo(
    () => todos
      .filter(t => t.due_date && t.due_date < todayStr && t.status !== "completed")
      .sort((a, b) => (a.due_date! < b.due_date! ? -1 : 1)),
    [todos, todayStr]
  )

  function openCreate() {
    setEditingTodo(null)
    setDialogOpen(true)
  }

  function openEdit(todo: Todo) {
    setEditingTodo(todo)
    setDialogOpen(true)
  }

  async function handleSave(values: TodoFormValues) {
    const priority = values.priority === "none" ? null : values.priority as Todo["priority"]
    const due_date = values.due_date?.trim() || null

    if (editingTodo) {
      const patch = {
        title:       values.title,
        description: values.description?.trim() || null,
        priority,
        due_date,
        status:      values.status,
      }
      await updateTodo(editingTodo.id, patch)
      patchTodo(editingTodo.id, patch)
    } else {
      const created = await createTodo({
        title:       values.title,
        description: values.description?.trim() || null,
        priority,
        due_date,
        status:      values.status ?? "todo",
        position:    todos.filter(t => t.status === (values.status ?? "todo")).length,
      })
      addTodo(created)
    }
  }

  function renderTaskRow(todo: Todo, showDate = false) {
    return (
      <button
        key={todo.id}
        type="button"
        onClick={() => openEdit(todo)}
        className="flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-left transition-colors hover:bg-accent"
      >
        {todo.priority && (
          <span className={cn("size-2 shrink-0 rounded-full", PRIORITY_DOT[todo.priority])} />
        )}
        <span className={cn(
          "min-w-0 flex-1 truncate text-sm",
          todo.status === "completed" && "text-muted-foreground line-through"
        )}>
          {todo.title}
        </span>
        {showDate && todo.due_date && (
          <span className="shrink-0 text-xs font-medium text-red-500">
            {format(parseISO(todo.due_date), "MMM d")}
          </span>
        )}
        <span className="shrink-0 text-xs text-muted-foreground">{STATUS_LABEL[todo.status]}</span>
      </button>
    )
  }

  if (loading && todos.length === 0) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-[420px] w-full rounded-xl" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 xl:flex-row">
      {/* ── Month grid ─────────────────────────────────────────── */}
      <div className="min-w-0 flex-1">
        <div className="mb-4 flex items-center gap-2">
          <h2 className="text-lg font-semibold">{format(cursor, "MMMM yyyy")}</h2>
          <div className="ml-auto flex items-center gap-1">
            <Button variant="outline" size="sm" onClick={() => setCursor(startOfMonth(new Date()))}>
              Today
            </Button>
            <Button variant="outline" size="icon" className="size-8" onClick={() => setCursor(c => subMonths(c, 1))} aria-label="Previous month">
              <ChevronLeft className="size-4" />
            </Button>
            <Button variant="outline" size="icon" className="size-8" onClick={() => setCursor(c => addMonths(c, 1))} aria-label="Next month">
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-px overflow-hidden rounded-xl border bg-border">
          {WEEKDAYS.map(d => (
            <div key={d} className="bg-muted/50 px-2 py-1.5 text-center text-xs font-medium text-muted-foreground">
              {d}
            </div>
          ))}
          {days.map(day => {
            const key      = dateKey(day)
            const dayTodos = todosByDate.get(key) ?? []
            const inMonth  = isSameMonth(day, cursor)
            const isSel    = key === selected
            return (
              <button
                key={key}
                type="button"
                onClick={() => setSelected(key)}
                className={cn(
                  "flex min-h-24 flex-col gap-1 bg-background p-1.5 text-left align-top transition-colors hover:bg-accent/50",
                  !inMonth && "bg-muted/30",
                  isSel && "bg-accent/60 ring-2 ring-primary ring-inset"
                )}
              >
                <span className={cn(
                  "flex size-6 items-center justify-center rounded-full text-xs font-medium",
                  !inMonth && "text-muted-foreground",
                  isToday(day) && "bg-primary text-primary-foreground"
                )}>
                  {format(day, "d")}
                </span>
                <span className="flex w-full flex-col gap-0.5">
                  {dayTodos.slice(0, MAX_CHIPS).map(t => (
                    <span
                      key={t.id}
                      className={cn(
                        "flex items-center gap-1 truncate rounded bg-muted px-1 py-0.5 text-[11px] leading-tight",
                        t.status === "completed" && "text-muted-foreground line-through"
                      )}
                    >
                      {t.priority && <span className={cn("size-1.5 shrink-0 rounded-full", PRIORITY_DOT[t.priority])} />}
                      <span className="truncate">{t.title}</span>
                    </span>
                  ))}
                  {dayTodos.length > MAX_CHIPS && (
                    <span className="px-1 text-[11px] text-muted-foreground">
                      +{dayTodos.length - MAX_CHIPS} more
                    </span>
                  )}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Agenda panel ───────────────────────────────────────── */}
      <div className="w-full shrink-0 space-y-6 xl:w-80">
        <div>
          <div className="mb-3 flex items-center gap-2">
            <h3 className="font-semibold">
              {format(parseISO(selected), "EEEE, MMM d")}
            </h3>
            <Button size="sm" className="ml-auto h-8" onClick={openCreate}>
              <Plus className="size-3.5" />
              Add task
            </Button>
          </div>
          {selectedTodos.length === 0 ? (
            <p className="rounded-lg border border-dashed px-3 py-4 text-sm text-muted-foreground">
              No tasks due this day.
            </p>
          ) : (
            <div className="space-y-2">
              {selectedTodos.map(t => renderTaskRow(t))}
            </div>
          )}
        </div>

        {overdueTodos.length > 0 && (
          <div>
            <h3 className="mb-3 font-semibold text-red-500">
              Overdue · {overdueTodos.length}
            </h3>
            <div className="space-y-2">
              {overdueTodos.map(t => renderTaskRow(t, true))}
            </div>
          </div>
        )}
      </div>

      {/* Create / Edit dialog */}
      <TodoDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        todo={editingTodo ?? undefined}
        defaultDueDate={selected}
        onSave={handleSave}
      />
    </div>
  )
}
