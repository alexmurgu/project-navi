import { House, ArrowDownLeft, ArrowUpRight, Settings, Plus, type LucideIcon } from "lucide-react";
import { Link, useRouterState } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { haptic } from "@/lib/haptics";
import { ICON_STROKE } from "@/components/icon-mark";

type NavItem =
  | { kind: "link"; to: string; icon: LucideIcon; label: string; iconClassName?: string }
  | { kind: "fab" };

// Bare arrows fill less of their box than House/Settings; they get a larger
// size so all four read as the same optical weight.

const NAV_ITEMS: NavItem[] = [
  { kind: "link", to: "/", icon: House, label: "Home" },
  { kind: "link", to: "/incomes", icon: ArrowDownLeft, label: "Income", iconClassName: "size-6" },
  { kind: "fab" },
  { kind: "link", to: "/expenses", icon: ArrowUpRight, label: "Expenses", iconClassName: "size-6" },
  { kind: "link", to: "/settings", icon: Settings, label: "Settings" },
];

function isActivePath(pathname: string, to: string) {
  if (to === "/") return pathname === "/";
  return pathname === to || pathname.startsWith(`${to}/`);
}

export function MobileNav() {
  // `location` switches as soon as a navigation starts, so the active tab
  // updates on tap rather than after the next page has loaded.
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const handleFabClick = () => {
    haptic.medium();
    window.dispatchEvent(new CustomEvent("open-quick-add-choice"));
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-60 px-5 pb-[calc(env(safe-area-inset-bottom,0px)+6px)] pt-2 pointer-events-none">
      <div className="pointer-events-auto mx-auto max-w-lg rounded-full border border-navi-border/30 bg-white/90 p-2 backdrop-blur-xl">
        <div className="grid grid-cols-5 items-center">
          {NAV_ITEMS.map((item) => {
            if (item.kind === "fab") {
              return (
                <button
                  key="fab"
                  type="button"
                  onClick={handleFabClick}
                  aria-label="Add transaction"
                  className="relative mx-auto flex size-14 items-center justify-center rounded-full bg-navi-dark text-white transition-transform duration-200 active:scale-90 touch-manipulation"
                >
                  <Plus className="size-6" strokeWidth={ICON_STROKE} />
                </button>
              );
            }

            const isActive = isActivePath(pathname, item.to);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to as any}
                search={(prev: any) => prev}
                aria-current={isActive ? "page" : undefined}
                onClick={() => {
                  if (!isActive) haptic.light();
                }}
                className={cn(
                  "relative flex h-14 flex-col items-center justify-center gap-1 rounded-full transition-[color,transform] duration-300 active:scale-90 touch-manipulation",
                  isActive ? "text-navi-dark" : "text-navi-gray/70",
                )}
              >
                <Icon className={cn("size-5", item.iconClassName)} strokeWidth={ICON_STROKE} />
                <span className="text-[10px] leading-none font-display font-medium tracking-wide">
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
