import React from "react";
import { Home, ArrowUpCircle, TrendingDown, Settings, Plus } from "lucide-react";
import { Link, useRouterState } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

export function MobileNav() {
  const routerState = useRouterState();
  const pathname = routerState.location.pathname;

  const navItems = [
    { to: "/", icon: <Home className="size-5" />, label: "Home" },
    { to: "/incomes", icon: <ArrowUpCircle className="size-5" />, label: "Income" },
    { to: "fab", icon: null, label: "Add" }, // Placeholder for FAB
    { to: "/expenses", icon: <TrendingDown className="size-5" />, label: "Expenses" },
    { to: "/settings", icon: <Settings className="size-5" />, label: "Settings" },
  ];

  const handleFabClick = () => {
    // Custom event to trigger Quick Add Sheet in Dashboard or active page
    window.dispatchEvent(new CustomEvent('open-quick-add'));
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[60] px-5 pb-6 pt-4 pointer-events-none">
      <div className="relative mx-auto max-w-lg">
        <div className="pointer-events-auto grid grid-cols-5 items-end gap-1 rounded-2xl border border-muted/20 bg-card/80 px-2 pb-2 pt-4 shadow-[0_20px_50px_rgba(0,0,0,0.15)] backdrop-blur-2xl">
          {navItems.map((item) => {
            if (item.to === "fab") {
              return (
                <button
                  key="fab"
                  type="button"
                  onClick={handleFabClick}
                  aria-label="Add transaction"
                  className="relative -mt-8 mx-auto flex size-16 items-center justify-center rounded-full bg-primary text-white shadow-[0_18px_40px_rgba(0,0,0,0.28)] transition-transform duration-300 hover:scale-105 active:scale-95 touch-manipulation"
                >
                  <Plus className="size-8" />
                </button>
              );
            }

            const isActive = pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to as any}
                className={cn(
                  "flex flex-col items-center justify-center h-14 rounded-xl transition-all duration-500 touch-manipulation",
                  isActive ? "text-primary bg-primary/5" : "text-muted-foreground opacity-40 hover:opacity-100"
                )}
              >
                {item.icon}
                <span className="mt-0.5 text-[10px] font-black uppercase tracking-tighter">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
