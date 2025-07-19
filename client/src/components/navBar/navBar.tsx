import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarHeader
} from "@/components/ui/sidebar"
import Link from "next/link";

interface MenuItem {
  title: string;
  url: string;
}

// Menu items. ADD URL WITH LINK
const items: MenuItem[] = [
  {
    title: "Home",
    url: "/",
  },
  {
    title: "Calendar",
    url: "/calendar",
  },
  {
    title: "Planner",
    url: "/calendar/planner",
  },
  {
    title: "Gym",
    url: "/gym",
  },
  {
    title: "To Do",
    url: "/todo",
  },
  {
    title: "Stats",
    url: "/stats",
  },
]

export function NavSidebar() {
  return (
    <Sidebar>
      {/* Replace with app icon */}
      <SidebarHeader>Cute Cat</SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link href={item.url}>
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      {/* Connect to logout function */}
      <SidebarFooter>Login</SidebarFooter>
    </Sidebar>
  )
}