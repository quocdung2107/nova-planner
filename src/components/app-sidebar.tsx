import { NavLink } from "react-router"
import { Home, Link, ListTodo, CalendarDays, Flame, FolderKanban, ClipboardList, NotebookPen } from "lucide-react"

import logoLight from "#assets/logo-light.svg"
import logoDark from "#assets/logo-dark.svg"
import { NavUser } from "#components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "#components/ui/sidebar"

const items = [
  { title: "Dashboard",        to: "/dashboard", icon: Home          },
  { title: "Todo",             to: "/todo",      icon: ListTodo      },
  { title: "Calendar",         to: "/calendar",  icon: CalendarDays  },
  { title: "Habits",           to: "/habits",    icon: Flame         },
  { title: "Save Links",       to: "/links",     icon: Link          },
  { title: "Project Planner", to: "/projects",  icon: FolderKanban  },
  { title: "Work Log",        to: "/work-log",  icon: ClipboardList },
  { title: "Notes",           to: "/notes",     icon: NotebookPen   },
]

export function AppSidebar() {
  return (
    <Sidebar>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="#">
                <div className="border-border bg-sidebar-accent flex aspect-square size-8 items-center justify-center rounded-lg border">
                  <img src={logoLight} alt="NOVA Planner" className="size-5 dark:hidden" />
                  <img src={logoDark} alt="NOVA Planner" className="hidden size-5 dark:block" />
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-semibold">NOVA Planner</span>
                  <span className="text-xs text-muted-foreground">v0.1.0</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <NavLink to={item.to}>
                    {({ isActive }) => (
                      <SidebarMenuButton isActive={isActive}>
                        <item.icon />
                        <span>{item.title}</span>
                      </SidebarMenuButton>
                    )}
                  </NavLink>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
