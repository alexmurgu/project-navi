import React from "react";
import { Home, ArrowUpCircle, TrendingDown, Settings, Plus } from "lucide-react";
import { Link, useRouterState } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

export function MobileNav() {
  const routerState = useRouterState();
  const pathname = routerState.location.pathname;

  const navItems = [
    { to: "/", icon: <Home className="size-5" strokeWidth={1} />, label: "Home" },
    { to: "/incomes", icon: <ArrowUpCircle className="size-5" strokeWidth={1} />, label: "Income" },
    { to: "fab", icon: null, label: "Add" }, // Placeholder for FAB
    {
      to: "/expenses",
      icon: <TrendingDown className="size-5" strokeWidth={1} />,
      label: "Expenses",
    },
    { to: "/settings", icon: <Settings className="size-5" strokeWidth={1} />, label: "Settings" },
  ];

  const handleFabClick = () => {
    window.dispatchEvent(new CustomEvent("open-quick-add-choice"));
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-60 px-6 pb-8 pt-4 pointer-events-none">
      <div className="relative mx-auto max-w-lg">
        <div className="pointer-events-auto grid grid-cols-5 items-center gap-1 rounded-full border border-navi-border/30 bg-white/95 px-3 py-3 shadow-none backdrop-blur-xl">
          {navItems.map((item) => {
            if (item.to === "fab") {
              return (
                <button
                  key="fab"
                  type="button"
                  onClick={handleFabClick}
                  aria-label="Add transaction"
                  className="mx-auto flex size-14 items-center justify-center rounded-full bg-navi-dark text-white transition-all duration-300 hover:opacity-90 active:scale-95 touch-manipulation"
                >
                  <Plus className="size-6" />
                </button>
              );
            }

            const isActive = pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to as any}
                className={cn(
                  "flex flex-col items-center justify-center h-14 rounded-full transition-all duration-500 touch-manipulation",
                  isActive
                    ? "text-navi-blue bg-navi-blue/5"
                    : "text-navi-gray hover:text-navi-dark",
                )}
              >
                {item.icon}
                <span className="mt-1 text-[9px] font-display font-medium uppercase tracking-widest">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
