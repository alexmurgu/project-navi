import {
  createRootRouteWithContext,
  HeadContent,
  Outlet,
  Scripts,
  redirect,
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
import { NotFound } from "@/components/not-found";
import { RouteError } from "@/components/route-error";
import { fetchSession } from "@/actions";
import { PullToRefresh } from "@/components/pull-to-refresh";

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
  user?: any;
  session?: any;
}

function RootLayout() {
  const { queryClient } = Route.useRouteContext();
  const { fetchSession, loading, user } = useAuthStore();
  const [uiState, setUiState] = useState<{
    quickAddOpen: boolean;
    pwaUpdateAvailable: boolean;
    refreshingForUpdate: boolean;
    pendingRegistration: ServiceWorkerRegistration | null;
  }>({
    quickAddOpen: false,
    pwaUpdateAvailable: false,
    refreshingForUpdate: false,
    pendingRegistration: null,
  });

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  useEffect(() => {
    const handleOpenQuickAddChoice = () => setUiState((prev) => ({ ...prev, quickAddOpen: true }));
    const handleUpdateAvailable = (event: Event) => {
      const customEvent = event as CustomEvent<{
        registration: ServiceWorkerRegistration;
      }>;
      setUiState((prev) => ({
        ...prev,
        pendingRegistration: customEvent.detail.registration,
        pwaUpdateAvailable: true,
      }));
    };
    const handleControllerChange = () => {
      if (uiState.refreshingForUpdate) {
        window.location.reload();
      }
    };
    if (typeof window === "undefined") return;

    window.addEventListener("open-quick-add-choice", handleOpenQuickAddChoice);
    window.addEventListener("pwa-update-available", handleUpdateAvailable as EventListener);
    window.addEventListener("pwa-controller-changed", handleControllerChange);

    return () => {
      window.removeEventListener("open-quick-add-choice", handleOpenQuickAddChoice);
      window.removeEventListener("pwa-update-available", handleUpdateAvailable as EventListener);
      window.removeEventListener("pwa-controller-changed", handleControllerChange);
    };
  }, [uiState.refreshingForUpdate]);

  const showDevtools = typeof window !== "undefined" && window.location.hostname === "localhost";
  const openQuickAdd = (mode: "expense" | "income" | "transfer") => {
    setUiState((prev) => ({ ...prev, quickAddOpen: false }));
    const eventName =
      mode === "expense"
        ? "open-quick-add-expense"
        : mode === "income"
          ? "open-quick-add-income"
          : "open-quick-add-transfer";
    window.dispatchEvent(new CustomEvent(eventName));
  };

  const updateApp = () => {
    if (!uiState.pendingRegistration?.waiting) return;
    setUiState((prev) => ({ ...prev, refreshingForUpdate: true }));
    uiState.pendingRegistration.waiting.postMessage({ type: "SKIP_WAITING" });
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
        {uiState.pwaUpdateAvailable ? (
          <div className="fixed bottom-6 left-1/2 z-210 w-[min(92vw,520px)] -translate-x-1/2 rounded-2xl border border-muted/10 bg-white/95 p-4 shadow-2xl backdrop-blur">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-muted-foreground/50">
                  Update available
                </p>
                <p className="truncate text-sm font-bold text-foreground">
                  A newer version is ready. Reload to get the latest changes.
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  className="h-10 rounded-xl px-4 font-black uppercase tracking-widest text-[10px]"
                  onClick={() => setUiState((prev) => ({ ...prev, pwaUpdateAvailable: false }))}
                >
                  Later
                </Button>
                <Button
                  type="button"
                  className="h-10 rounded-xl bg-foreground px-4 font-black uppercase tracking-widest text-[10px] text-background"
                  onClick={updateApp}
                >
                  Reload
                </Button>
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
            <PullToRefresh
              onRefresh={async () => {
                // Ensure at least 800ms of visual feedback
                await Promise.all([
                  queryClient.invalidateQueries(),
                  new Promise((resolve) => setTimeout(resolve, 800)),
                ]);
              }}
            >
              <main className="pb-32 lg:pb-0">
                <Outlet />
              </main>
            </PullToRefresh>

            {/* Mobile Bottom Nav - Hidden on Desktop */}
            {user && (
              <div className="lg:hidden">
                <MobileNav />
              </div>
            )}
          </SidebarInset>
        </SidebarProvider>
        <Sheet
          open={uiState.quickAddOpen}
          onOpenChange={(open) => setUiState((prev) => ({ ...prev, quickAddOpen: open }))}
        >
          <SheetContent
            side="bottom"
            className="h-auto rounded-t-[40px] border-none p-8 pb-12 shadow-none bg-white"
          >
            <SheetHeader className="px-1 pt-2 text-center sm:text-left">
              <SheetTitle className="text-[32px] md:text-[48px] font-display font-medium tracking-tight uppercase italic text-navi-dark">
                Add Entry
              </SheetTitle>
            </SheetHeader>
            <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Button
                type="button"
                variant="default"
                className="h-20 sm:h-24 rounded-premium font-display font-medium tracking-widest text-[11px] uppercase bg-navi-dark text-white hover:opacity-90 transition-all"
                onClick={() => openQuickAdd("expense")}
              >
                <div className="flex flex-col items-center gap-2">
                  <ArrowDownCircle className="size-5" />
                  <span>Expense</span>
                </div>
              </Button>
              <Button
                type="button"
                className="h-20 sm:h-24 rounded-premium font-display font-medium tracking-widest text-[11px] uppercase bg-navi-teal text-white hover:opacity-90 transition-all"
                onClick={() => openQuickAdd("income")}
              >
                <div className="flex flex-col items-center gap-2">
                  <ArrowUpCircle className="size-5" />
                  <span>Income</span>
                </div>
              </Button>
              <Button
                type="button"
                className="h-20 sm:h-24 rounded-premium font-display font-medium tracking-widest text-[11px] uppercase bg-navi-dark/5 text-navi-dark hover:bg-navi-dark/10 transition-all"
                onClick={() => openQuickAdd("transfer")}
              >
                <div className="flex flex-col items-center gap-2">
                  <ArrowDownCircle className="size-5 rotate-270" />
                  <span>Transfer</span>
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
  beforeLoad: async ({ location }) => {
    const sessionData = await fetchSession();

    if (!sessionData && location.pathname !== "/login") {
      throw redirect({
        to: "/login",
        search: {
          redirect: location.href,
        },
      });
    }

    return {
      user: sessionData?.user,
      session: sessionData?.session,
    };
  },
  component: () => (
    <RootDocument>
      <RootLayout />
    </RootDocument>
  ),
  notFoundComponent: () => (
    <RootDocument>
      <NotFound />
    </RootDocument>
  ),
  errorComponent: (props) => (
    <RootDocument>
      <RouteError {...props} />
    </RootDocument>
  ),
});
