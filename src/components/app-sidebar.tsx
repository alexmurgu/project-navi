import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { LogOut, FileUp, Home, Settings, ArrowUpCircle, TrendingDown } from "lucide-react";
import { Link, useRouterState } from "@tanstack/react-router";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { useAuthStore } from "../store/useAuthStore";

export function AppSidebar() {
  const routerState = useRouterState();
  const pathname = routerState.location.pathname;
  const { user } = useAuthStore();
  
  const handleLogout = async () => {
    try { await authClient.signOut(); } catch (e) { console.error(e); } finally { window.location.href = "/login"; }
  };

  return (
    <Sidebar className="border-r border-muted/10 bg-sidebar/30 backdrop-blur-2xl">
      <SidebarContent className="flex flex-col h-full">
        {/* NAVI Branding Section */}
        <div className="px-8 py-16 flex flex-col items-center">
          <div className="size-16 mb-6 transition-all duration-700 hover:scale-110 active:scale-95 group">
            <img src="/icon.svg" alt="NAVI" className="w-full h-full object-contain filter drop-shadow-2xl grayscale group-hover:grayscale-0 transition-all duration-700" />
          </div>
          <span className="font-black tracking-[-0.05em] text-foreground text-3xl italic uppercase leading-none">NAVI</span>
          <div className="mt-4 h-1 w-6 bg-primary/20 rounded-full" />
        </div>

        <SidebarGroup className="px-6 flex-1">
          <SidebarGroupContent>
            <SidebarMenu className="gap-3">
              {[
                { to: "/", icon: <Home className="size-5" />, label: "Home" }, // Terminal -> Home
                { to: "/incomes", icon: <ArrowUpCircle className="size-5" />, label: "Income" },
                { to: "/expenses", icon: <TrendingDown className="size-5" />, label: "Expenses" },
                { to: "/import", icon: <FileUp className="size-5" />, label: "Import" },
              ].map((item) => (
                <SidebarMenuItem key={item.to}>
                  <SidebarMenuButton 
                    render={<Link to={item.to} />}
                    isActive={pathname === item.to}
                    className={cn(
                      "h-12 px-6 rounded-xl transition-all duration-500",
                      pathname === item.to 
                        ? "bg-foreground text-background shadow-xl translate-x-1" 
                        : "text-muted-foreground hover:bg-muted/50 hover:text-foreground hover:translate-x-1"
                    )}
                  >
                    <div className="mr-4 opacity-70">{item.icon}</div>
                    <span className="font-black text-[10px] uppercase tracking-widest">{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <div className="px-6 py-10 mt-auto space-y-4">
           <SidebarMenu className="gap-2">
            <SidebarMenuItem>
              <SidebarMenuButton
                render={<Link to="/settings" />}
                isActive={pathname === "/settings"}
                className={cn(
                  "h-12 px-6 rounded-xl transition-all duration-500",
                  pathname === "/settings"
                    ? "bg-foreground text-background shadow-xl translate-x-1"
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground hover:translate-x-1"
                )}
              >
                <Settings className="size-5 mr-4 opacity-50" />
                <span className="font-black text-[10px] uppercase tracking-widest">Settings</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton 
                onClick={handleLogout} 
                className="h-12 px-6 rounded-xl text-muted-foreground hover:bg-destructive/5 hover:text-destructive transition-all duration-500"
              >
                <LogOut className="size-5 mr-4 opacity-50" />
                <span className="font-black text-[10px] uppercase tracking-widest">Logout</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
