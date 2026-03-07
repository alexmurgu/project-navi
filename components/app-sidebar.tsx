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

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();

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
              <div className="flex size-10 items-center justify-center border-2 border-primary bg-primary/10 text-primary">
                <span className="text-xl font-black">N</span>
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-black tracking-tighter uppercase leading-none">Project</span>
                <span className="text-lg font-black tracking-tighter uppercase leading-none text-primary">Navi</span>
              </div>
            </div>
          </div>
          <SidebarGroupLabel className="text-white/50">Application</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  render={<Link href="/" />} 
                  isActive={pathname === "/"}
                  size="xl"
                >
                  <DollarSign />
                  <span>Dashboard</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  render={<Link href="/admin/users" />} 
                  isActive={pathname === "/admin/users"}
                  size="xl"
                >
                  <Users />
                  <span>Users</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  render={<Link href="/admin/categories" />} 
                  isActive={pathname === "/admin/categories"}
                  size="xl"
                >
                  <Palette />
                  <span>Categories</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <div className="mt-auto p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton 
              size="xl" 
              onClick={handleLogout} 
              className="text-red-400 hover:bg-red-400/10 hover:text-red-400"
            >
              <LogOut />
              <span>Sign Out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </div>
    </Sidebar>
  );
}
