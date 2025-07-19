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

interface MenuItem {
  title: string;
  url: string;
}

// Menu items. ADD URL WITH LINK
const items: MenuItem[] = [
  {
    title: "Home",
    url: "#",
  },
  {
    title: "Calendar",
    url: "#",
  },
  {
    title: "Planner",
    url: "#",
  },
  {
    title: "Gym",
    url: "#",
  },
  {
    title: "To Do",
    url: "#",
  },
  {
    title: "Stats",
    url: "#",
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
                    {/* use Link component */}
                    <a href={item.url}>
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      {/* Connect to logout function */}
      <SidebarFooter>Logout</SidebarFooter>
    </Sidebar>
  )
}