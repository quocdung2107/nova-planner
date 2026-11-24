import type { Project } from "#lib/types/project"
import { getCurrentWeek, getProjectTimeProgress } from "#lib/week-utils"

export interface ProjectProgressStat { total: number; done: number }

export interface ProjectCompletion {
  pct:    number
  isDone: boolean
  detail: string
}

export function getProjectCompletion(
  project: Project,
  stat?: ProjectProgressStat,
): ProjectCompletion {
  if (stat && stat.total > 0) {
    const pct    = Math.min(100, Math.round((stat.done / stat.total) * 100))
    const isDone = stat.done >= stat.total
    return { pct, isDone, detail: `${stat.done}/${stat.total} items` }
  }

  const pct         = getProjectTimeProgress(project.start_date, project.week_count)
  const currentWeek = getCurrentWeek(project.start_date, project.week_count)
  const detail      = currentWeek
    ? `Week ${currentWeek}/${project.week_count}`
    : pct >= 100 ? "Ended" : "Not started"
  return { pct, isDone: false, detail }
}
