import { useEffect, useState } from "react"
import { useNavigate } from "react-router"
import {
  CalendarDays,
  Flame,
  FolderKanban,
  Home,
  ListTodo,
  NotebookPen,
  Plus,
} from "lucide-react"
import { toast } from "sonner"

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "#components/ui/command"
import { createTodo, searchTodos } from "#lib/todos"
import { searchNotes } from "#lib/notes"
import { getProjects } from "#lib/projects"
import { noteDisplayTitle, type Note } from "#lib/types/note"
import type { Project } from "#lib/types/project"
import type { Todo } from "#lib/types/todo"
import { useCommandPaletteStore } from "#store/command-palette"
import { useTodosStore } from "#store/todos"

const NAV_ITEMS = [
  { label: "Dashboard", to: "/dashboard", icon: Home },
  { label: "Calendar",  to: "/calendar",  icon: CalendarDays },
  { label: "Todo",      to: "/todo",      icon: ListTodo },
  { label: "Habits",    to: "/habits",    icon: Flame },
  { label: "Projects",  to: "/projects",  icon: FolderKanban },
  { label: "Notes",     to: "/notes",     icon: NotebookPen },
]

export function CommandPalette() {
  const open    = useCommandPaletteStore(s => s.open)
  const setOpen = useCommandPaletteStore(s => s.setOpen)
  const toggle  = useCommandPaletteStore(s => s.toggle)
  const navigate = useNavigate()

  const [query, setQuery]       = useState("")
  const [tasks, setTasks]       = useState<Todo[]>([])
  const [notes, setNotes]       = useState<Note[]>([])
  const [projects, setProjects] = useState<Project[]>([])

  // Global Ctrl+K / Cmd+K shortcut
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        toggle()
      }
    }
    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [toggle])

  // Reset the query each time the palette closes
  useEffect(() => {
    if (!open) {
      setQuery("")
      setTasks([])
      setNotes([])
      setProjects([])
    }
  }, [open ])

  // Debounced search across tasks, notes and projects
  useEffect(() => {
    const q = query.trim()
    if (!q) {
      setTasks([])
      setNotes([])
      setProjects([])
      return
    }
    const handle = setTimeout(async () => {
      const [t, n, p] = await Promise.all([
        searchTodos(q).catch(() => [] as Todo[]),
        searchNotes(q).catch(() => [] as Note[]),
        getProjects()
          .then(all => all.filter(pr => pr.name.toLowerCase().includes(q.toLowerCase())))
          .catch(() => [] as Project[]),
      ])
      setTasks(t.slice(0, 6))
      setNotes(n.slice(0, 6))
      setProjects(p.slice(0, 6))
    }, 150)
    return () => clearTimeout(handle)
  }, [query])

  function go(to: string) {
    setOpen(false)
    navigate(to)
  }

  async function handleCreateTask() {
    const title = query.trim()
    if (!title) return
    try {
      const created = await createTodo({ title })
      useTodosStore.getState().addTodo(created)
      toast.success("Task created")
      setOpen(false)
    } catch (err) {
      console.error("Failed to create task from command palette:", err)
      toast.error("Failed to create task")
    }
  }

  const trimmed = query.trim()
  const hasResults = tasks.length > 0 || notes.length > 0 || projects.length > 0

  return (
    <CommandDialog
      open={open}
      onOpenChange={setOpen}
      title="Search"
      description="Search tasks, notes and projects, or create a new task."
      shouldFilter={false}
    >
      <CommandInput
        placeholder="Search or type to create a task..."
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        {trimmed && !hasResults && <CommandEmpty>No results found.</CommandEmpty>}

        {trimmed && (
          <CommandGroup heading="Quick Add">
            <CommandItem value={`create-task ${trimmed}`} onSelect={handleCreateTask}>
              <Plus />
              <span className="truncate">Create task: “{trimmed}”</span>
            </CommandItem>
          </CommandGroup>
        )}

        {tasks.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Tasks">
              {tasks.map(t => (
                <CommandItem key={t.id} value={`task ${t.title}`} onSelect={() => go("/todo")}>
                  <ListTodo />
                  <span className="truncate">{t.title}</span>
                  {t.status === "completed" && (
                    <span className="ml-auto shrink-0 text-xs text-muted-foreground">Done</span>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {notes.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Notes">
              {notes.map(n => (
                <CommandItem key={n.id} value={`note ${noteDisplayTitle(n)}`} onSelect={() => go("/notes")}>
                  <NotebookPen />
                  <span className="truncate">{noteDisplayTitle(n)}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {projects.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Projects">
              {projects.map(p => (
                <CommandItem key={p.id} value={`project ${p.name}`} onSelect={() => go("/projects")}>
                  <FolderKanban />
                  <span className="truncate">{p.name}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {!trimmed && (
          <CommandGroup heading="Go to">
            {NAV_ITEMS.map(item => (
              <CommandItem key={item.to} value={`go ${item.label}`} onSelect={() => go(item.to)}>
                <item.icon />
                <span>{item.label}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  )
}
