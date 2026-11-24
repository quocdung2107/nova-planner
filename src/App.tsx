import { lazy, Suspense, type ReactNode } from "react"
import { createHashRouter, RouterProvider, Navigate, redirect } from "react-router"
import { Loader2 } from "lucide-react"
import "./App.css"

import { getTursoConfig, getAppMode } from "#lib/config"
import { getProfile } from "#lib/profile"
import { Layout }         from "#components/layout"
import { Toaster }        from "#components/ui/sonner"

const SetupPage     = lazy(() => import("#pages/setup"))
const DashboardPage = lazy(() => import("#pages/dashboard"))
const LinksPage     = lazy(() => import("#pages/links"))
const TodoPage      = lazy(() => import("#pages/todo"))
const CalendarPage  = lazy(() => import("#pages/calendar"))
const HabitsPage    = lazy(() => import("#pages/habits"))
const ProjectsPage  = lazy(() => import("#pages/projects"))
const WorkLogPage   = lazy(() => import("#pages/work-log"))
const NotesPage     = lazy(() => import("#pages/notes"))

function PageFallback() {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <Loader2 className="size-6 animate-spin text-muted-foreground" />
    </div>
  )
}

function page(element: ReactNode) {
  return <Suspense fallback={<PageFallback />}>{element}</Suspense>
}

async function requireConfig() {
  const mode = getAppMode()
  if (!mode) return redirect("/setup")
  if (mode === "cloud" && !getTursoConfig()) return redirect("/setup")
  try {
    const profile = await getProfile()
    if (!profile) return redirect("/setup")
  } catch {
    return redirect("/setup")
  }
  return null
}

const router = createHashRouter([
  {
    path: "/setup",
    element: page(<SetupPage />),
  },
  {
    path: "/",
    element: <Layout />,
    loader: requireConfig,
    children: [
      { index: true,        element: <Navigate to="/dashboard" replace /> },
      { path: "dashboard",  element: page(<DashboardPage />),  loader: requireConfig },
      { path: "links",      element: page(<LinksPage />),      loader: requireConfig },
      { path: "todo",       element: page(<TodoPage />),       loader: requireConfig },
      { path: "calendar",   element: page(<CalendarPage />),   loader: requireConfig },
      { path: "habits",     element: page(<HabitsPage />),     loader: requireConfig },
      { path: "projects",   element: page(<ProjectsPage />),   loader: requireConfig },
      { path: "work-log",   element: page(<WorkLogPage />),    loader: requireConfig },
      { path: "notes",      element: page(<NotesPage />),      loader: requireConfig },
    ],
  },
])

export default function App() {
  return (
    <>
      <RouterProvider router={router} />
      <Toaster />
    </>
  )
}
