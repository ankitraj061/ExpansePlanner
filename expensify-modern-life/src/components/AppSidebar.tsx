
import { NavLink, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { Home, User, Plus, Settings, TrendingDown, TrendingUp, LogOut, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/useTheme";
import { useNavigate } from "react-router-dom";

const items = [
  { title: "Dashboard", url: "/dashboard", icon: Home },
  { title: "Profile", url: "/profile", icon: User },
  { title: "Add Money", url: "/add-money", icon: Plus },
  { title: "Add Expenses", url: "/add-expenses", icon: Plus },
  { title: "Add Savings", url: "/add-savings", icon: Settings },
  { title: "Money Received", url: "/money-received", icon: TrendingUp },
  { title: "Money Given", url: "/money-given", icon: TrendingDown },
];

export function AppSidebar() {
  const location = useLocation();
  const currentPath = location.pathname;
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const isActive = (path: string) => currentPath === path;

  const handleLogout = () => {
    // Add logout logic here
    localStorage.removeItem("token");
    navigate("/"); // Redirect to home or login page after logout


  };

  return (
    <Sidebar collapsible="icon">
      <SidebarContent className="bg-sidebar">
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/70">
            Navigation
          </SidebarGroupLabel>
          
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 ${
                        isActive(item.url)
                          ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                          : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                      }`}
                    >
                      <item.icon className="w-5 h-5" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/70">
            Settings
          </SidebarGroupLabel>
          
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Button
                    variant="ghost"
                    onClick={toggleTheme}
                    className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  >
                    {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                    <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
                  </Button>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Button
                    variant="ghost"
                    onClick={handleLogout}
                    className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  >
                    <LogOut className="w-5 h-5" />
                    <span>Logout</span>
                  </Button>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
