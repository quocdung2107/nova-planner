import { useEffect, useState } from "react"
import {
  DndContext,
  DragEndEvent,
  MouseSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { GripVertical, Plus } from "lucide-react"
import { Button } from "#components/ui/button"
import { Skeleton } from "#components/ui/skeleton"
import { cn } from "#lib/utils"
import { ProjectDialog } from "./project-dialog"
import { useProjectsStore } from "#store/projects"
import type { Project } from "#lib/types/project"

interface ProjectListItemProps {
  project:    Project
  isSelected: boolean
  onSelect:   () => void
}

function ProjectListItem({ project, isSelected, onSelect }: ProjectListItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: project.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group flex items-center gap-1 rounded-lg transition-colors hover:bg-accent",
        isSelected && "bg-accent",
        isDragging && "opacity-30",
      )}
    >
      <button
        className="shrink-0 pl-1.5 cursor-grab touch-none text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
        {...listeners}
        {...attributes}
      >
        <GripVertical className="size-3.5" />
      </button>
      <button onClick={onSelect} className="flex-1 min-w-0 text-left pr-3 py-2">
        <p className="text-sm font-medium truncate">{project.name}</p>
        <p className="text-xs text-muted-foreground">{project.week_count}w · {project.start_date}</p>
      </button>
    </div>
  )
}

export function ProjectList() {
  const projects   = useProjectsStore(s => s.projects)
  const selectedId = useProjectsStore(s => s.selectedId)
  const loading    = useProjectsStore(s => s.loading)
  const { loadProjects, selectProject, reorderProjects } = useProjectsStore.getState()

  const [dialogOpen, setDialogOpen] = useState(false)

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
  )

  useEffect(() => { loadProjects() }, [loadProjects])

  function handleDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return
    const ids       = projects.map(p => p.id)
    const oldIndex  = ids.indexOf(active.id as string)
    const newIndex  = ids.indexOf(over.id as string)
    if (oldIndex === -1 || newIndex === -1) return
    reorderProjects(arrayMove(ids, oldIndex, newIndex))
  }

  return (
    <>
      <div className="flex flex-col shrink-0 border-r w-[200px]">
        <div className="flex items-center justify-between px-4 py-[13px] border-b">
          <span className="text-sm font-semibold">Projects</span>
          <Button variant="ghost" size="icon-sm" onClick={() => setDialogOpen(true)}>
            <Plus className="size-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {loading ? (
            <div className="space-y-1 p-1">
              {[1, 2].map(i => <Skeleton key={i} className="h-10 w-full rounded-lg" />)}
            </div>
          ) : projects.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center pt-4">No projects yet</p>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={projects.map(p => p.id)} strategy={verticalListSortingStrategy}>
                {projects.map(project => (
                  <ProjectListItem
                    key={project.id}
                    project={project}
                    isSelected={selectedId === project.id}
                    onSelect={() => selectProject(project.id)}
                  />
                ))}
              </SortableContext>
            </DndContext>
          )}
        </div>
      </div>

      <ProjectDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </>
  )
}
