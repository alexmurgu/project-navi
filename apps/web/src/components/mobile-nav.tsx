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
    <nav className="fixed bottom-0 left-0 right-0 z-50 px-6 pb-8 pt-4 pointer-events-none">
      <div className="mx-auto max-w-lg bg-card/80 backdrop-blur-2xl rounded-2xl border border-muted/20 shadow-[0_20px_50px_rgba(0,0,0,0.15)] flex items-center justify-between p-2 pointer-events-auto">
        {navItems.map((item, index) => {
          if (item.to === "fab") {
            return (
              <button
                key="fab"
                onClick={handleFabClick}
                className="relative -top-8 size-14 rounded-xl bg-primary text-white shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all duration-300 pointer-events-auto"
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
                "flex flex-col items-center justify-center flex-1 h-12 rounded-xl transition-all duration-500",
                isActive ? "text-primary bg-primary/5" : "text-muted-foreground opacity-40 hover:opacity-100"
              )}
            >
              {item.icon}
              <span className="text-[10px] font-black uppercase tracking-tighter mt-0.5">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
