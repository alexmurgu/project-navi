import {
  createRootRouteWithContext,
  HeadContent,
  Outlet,
  Scripts,
  useNavigate,
  useRouterState,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "../globals.css";
import { useAuthStore } from "../store/useAuthStore";
import { useEffect, useState, type ReactNode } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { ThemeProvider } from "@/components/theme-provider";
import { MobileNav } from "@/components/mobile-nav";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ArrowDownCircle, ArrowUpCircle } from "lucide-react";

function RootDocument({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

interface MyRouterContext {
  queryClient: QueryClient;
}

function RootLayout() {
  const { queryClient } = Route.useRouteContext();
  const { fetchSession, loading, user } = useAuthStore();
  const navigate = useNavigate();
  const routerState = useRouterState();
  const pathname = routerState.location.pathname;
  const [quickAddOpen, setQuickAddOpen] = useState(false);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  useEffect(() => {
    const handleOpenQuickAddChoice = () => setQuickAddOpen(true);
    if (typeof window !== "undefined") {
      window.addEventListener("open-quick-add-choice", handleOpenQuickAddChoice);
      return () => window.removeEventListener("open-quick-add-choice", handleOpenQuickAddChoice);
    }
  }, []);

  const showDevtools = typeof window !== "undefined" && window.location.hostname === "localhost";
  const openQuickAdd = (mode: "expense" | "income") => {
    const targetPath = mode === "expense" ? "/expenses" : "/incomes";
    setQuickAddOpen(false);

    if (pathname !== targetPath) {
      sessionStorage.setItem("pendingQuickAdd", mode);
      navigate({ to: targetPath });
      return;
    }

    window.dispatchEvent(
      new CustomEvent(mode === "expense" ? "open-quick-add-expense" : "open-quick-add-income"),
    );
  };

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
        {loading ? (
          <div className="fixed inset-0 z-200 flex items-center justify-center bg-[radial-gradient(circle_at_top,rgba(45,212,191,0.16),transparent_30%),linear-gradient(180deg,rgba(248,251,251,1)_0%,rgba(241,249,248,1)_100%)]">
            <div className="flex flex-col items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-[#083B3A] shadow-lg">
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
        <Sheet open={quickAddOpen} onOpenChange={setQuickAddOpen}>
          <SheetContent
            side="bottom"
            className="h-auto rounded-t-4xl border-none p-6 pb-8 shadow-2xl"
          >
            <SheetHeader className="px-1 pt-2">
              <SheetTitle className="text-3xl font-black tracking-tighter uppercase italic">
                Add Entry
              </SheetTitle>
            </SheetHeader>
            <div className="mt-8 grid grid-cols-2 gap-4">
              <Button
                type="button"
                variant="outline"
                className="h-24 rounded-2xl border-none bg-foreground text-background shadow-xl hover:bg-foreground/90"
                onClick={() => openQuickAdd("expense")}
              >
                <div className="flex flex-col items-center gap-2">
                  <ArrowDownCircle className="size-6" />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em]">Expense</span>
                </div>
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-24 rounded-2xl border-none bg-emerald-600 text-white shadow-xl hover:bg-emerald-600/90"
                onClick={() => openQuickAdd("income")}
              >
                <div className="flex flex-col items-center gap-2">
                  <ArrowUpCircle className="size-6" />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em]">Income</span>
                </div>
              </Button>
            </div>
          </SheetContent>
        </Sheet>
        {showDevtools ? <TanStackRouterDevtools /> : null}
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  component: () => (
    <RootDocument>
      <RootLayout />
    </RootDocument>
  ),
});
