import { createRootRoute, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'
import { useAuthStore } from '../store/useAuthStore'
import { useEffect } from 'react'
import { AppSidebar } from '@/components/app-sidebar'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { ThemeProvider } from '@/components/theme-provider'
import { MobileNav } from '@/components/mobile-nav'

function RootLayout() {
  const { fetchSession, loading, user } = useAuthStore()

  useEffect(() => { fetchSession() }, [fetchSession])

  const showDevtools = typeof window !== 'undefined' && window.location.hostname === 'localhost'

  return (
    <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
      {loading ? (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-[radial-gradient(circle_at_top,rgba(45,212,191,0.16),transparent_30%),linear-gradient(180deg,rgba(248,251,251,1)_0%,rgba(241,249,248,1)_100%)]">
          <div className="flex flex-col items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-[1.5rem] bg-[#083B3A] shadow-lg">
              <img src="/icon.svg" alt="Navi" className="h-9 w-9" />
            </div>
            <div className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground opacity-60">
              Loading
            </div>
          </div>
        </div>
      ) : null}
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
      {showDevtools ? <TanStackRouterDevtools /> : null}
    </ThemeProvider>
  )
}

export const Route = createRootRoute({
  component: RootLayout,
})
