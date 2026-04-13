import React from "react";
import { Link } from "@tanstack/react-router";
import { ChevronRight, Palette, Users } from "lucide-react";

const tiles = [
  {
    to: "/admin/categories",
    title: "Categories",
    icon: Palette,
    accent: "bg-sky-500/10 text-sky-600",
  },
  {
    to: "/admin/users",
    title: "Members",
    icon: Users,
    accent: "bg-emerald-500/10 text-emerald-600",
  },
] as const;

export function SettingsContent() {
  return (
    <div className="mx-auto w-full max-w-7xl flex-1 space-y-8 p-4 pt-6 md:p-8 bg-background text-foreground antialiased">
      <div className="space-y-2">
        <h1 className="text-3xl md:text-5xl font-black tracking-tight uppercase italic">
          Settings
        </h1>
        <p className="text-[10px] md:text-sm font-black tracking-[0.2em] text-muted-foreground opacity-40 uppercase ml-1">
          Manage the structure of the app
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {tiles.map((tile) => {
          const Icon = tile.icon;
          return (
            <Link
              key={tile.to}
              to={tile.to}
              className="group block rounded-3xl border bg-card p-5 md:p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="flex items-center gap-4">
                <div
                  className={`flex size-12 items-center justify-center rounded-2xl ${tile.accent}`}
                >
                  <Icon className="size-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="text-xl font-black tracking-tight">{tile.title}</h2>
                    <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1" />
                  </div>
                  <p className="mt-1 text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground/50">
                    Open
                  </p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
