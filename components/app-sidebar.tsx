"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { DollarSign, Users, LogOut, Palette } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

export function AppSidebar() {
  const pathname = usePathname();
  
  const handleLogout = async () => {
    try {
      await authClient.signOut();
    } catch (e) {
      console.error("Sign out failed", e);
    } finally {
      window.location.href = "/login";
    }
  };

  return (
    <Sidebar className="border-r border-white/10 bg-black/20 text-white">
      <SidebarContent>
        <SidebarGroup>
          <div className="px-4 py-6 mb-2">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center border-2 border-primary bg-primary/10 text-primary rounded-lg">
                <span className="text-xl font-black">N</span>
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-black tracking-tighter uppercase leading-none">Project</span>
                <span className="text-lg font-black tracking-tighter uppercase leading-none text-primary">Navi</span>
              </div>
            </div>
          </div>
          
          <SidebarGroupLabel className="px-4 mb-2 text-[10px] font-medium tracking-[0.15em] text-white/40 uppercase">
            Application
          </SidebarGroupLabel>
          
          <SidebarGroupContent>
            <SidebarMenu className="gap-1 px-2">
              <SidebarMenuItem>
                <SidebarMenuButton 
                  render={<Link href="/" />} 
                  isActive={pathname === "/"}
                  size="xl"
                  className={cn(
                    "transition-all duration-200",
                    pathname === "/" 
                      ? "bg-white/10 text-primary shadow-sm" 
                      : "text-white/60 hover:bg-white/5 hover:text-white"
                  )}
                >
                  <DollarSign className="shrink-0" />
                  <span className={cn(pathname === "/" ? "font-semibold" : "font-medium")}>Dashboard</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              <SidebarMenuItem>
                <SidebarMenuButton 
                  render={<Link href="/admin/users" />} 
                  isActive={pathname === "/admin/users"}
                  size="xl"
                  className={cn(
                    "transition-all duration-200",
                    pathname === "/admin/users" 
                      ? "bg-white/10 text-primary shadow-sm" 
                      : "text-white/60 hover:bg-white/5 hover:text-white"
                  )}
                >
                  <Users className="shrink-0" />
                  <span className={cn(pathname === "/admin/users" ? "font-semibold" : "font-medium")}>Users</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              <SidebarMenuItem>
                <SidebarMenuButton 
                  render={<Link href="/admin/categories" />} 
                  isActive={pathname === "/admin/categories"}
                  size="xl"
                  className={cn(
                    "transition-all duration-200",
                    pathname === "/admin/categories" 
                      ? "bg-white/10 text-primary shadow-sm" 
                      : "text-white/60 hover:bg-white/5 hover:text-white"
                  )}
                >
                  <Palette className="shrink-0" />
                  <span className={cn(pathname === "/admin/categories" ? "font-semibold" : "font-medium")}>Categories</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <div className="mt-auto p-4 border-t border-white/5">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton 
              size="xl" 
              onClick={handleLogout} 
              className="text-red-400/70 hover:bg-red-400/10 hover:text-red-400 transition-colors"
            >
              <LogOut className="shrink-0" />
              <span className="font-medium">Sign Out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </div>
    </Sidebar>
  );
}
