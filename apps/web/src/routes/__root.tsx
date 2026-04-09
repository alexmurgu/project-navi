import { createRootRoute, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'
import { useAuthStore } from '../store/useAuthStore'
import { useEffect, useState } from 'react'
import { AppSidebar } from '@/components/app-sidebar'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { ThemeProvider } from '@/components/theme-provider'
import { MobileNav } from '@/components/mobile-nav'

export const Route = createRootRoute({
  component: () => {
    const { fetchSession, loading, user } = useAuthStore()
    const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);

    useEffect(() => { fetchSession() }, [fetchSession])

    if (loading) { return <div className="p-8 text-foreground font-black uppercase tracking-widest opacity-20 antialiased">Initializing...</div> }

    return (
      <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
        <SidebarProvider>
          {/* Desktop Sidebar - Hidden on mobile/tablets */}
          {user && (
            <div className="hidden lg:block">
              <AppSidebar />
            </div>
          )}
          
          <SidebarInset className="bg-background">
            <main className="pb-32 lg:pb-0">
              <Outlet />
            </main>
            
            {/* Mobile Bottom Nav - Hidden on Desktop */}
            {user && (
              <div className="lg:hidden">
                <MobileNav />
              </div>
            )}
          </SidebarInset>
        </SidebarProvider>
        <TanStackRouterDevtools />
      </ThemeProvider>
    )
  },
})
