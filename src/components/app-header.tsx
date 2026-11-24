import { useMatches } from "react-router"
import { Search } from "lucide-react"
import { Button } from "#components/ui/button"
import { SidebarTrigger } from "#components/ui/sidebar"
import { useCommandPaletteStore } from "#store/command-palette"
import { Separator } from "#components/ui/separator"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "#components/ui/breadcrumb"
import { ThemeToggle } from "#components/theme-toggle"
import { CloudSyncButton } from "#components/cloud-sync-button"
import { getAppMode } from "#lib/config"

const titles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/links":    "Save Links",
  "/todo":     "Todo",
  "/calendar": "Calendar",
  "/habits":   "Habits",
  "/projects": "Project Planner",
  "/work-log": "Work Log",
  "/notes":    "Notes",
}

export function AppHeader() {
  const matches = useMatches()
  const last = matches[matches.length - 1]
  const title = titles[last?.pathname ?? ""] ?? "NOVA Planner"
  const setCommandPaletteOpen = useCommandPaletteStore(s => s.setOpen)

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
      <div className="flex items-center gap-2 px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage>{title}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      <div className="ml-auto flex items-center gap-1 px-4">
        <Button
          variant="outline"
          size="sm"
          className="mr-1 h-8 gap-2 text-muted-foreground hover:text-foreground"
          onClick={() => setCommandPaletteOpen(true)}
        >
          <Search className="size-3.5" />
          <span className="hidden md:inline">Search…</span>
          <kbd className="pointer-events-none hidden h-5 items-center gap-0.5 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium sm:flex">
            Ctrl K
          </kbd>
        </Button>
        {getAppMode() === "cloud" && <CloudSyncButton />}
        <ThemeToggle />
      </div>
    </header>
  )
}
