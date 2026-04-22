import React from "react";
import { Link } from "@tanstack/react-router";
import { ChevronRight, Palette, Users, ShieldCheck, Bell, Smartphone } from "lucide-react";

const adminTiles = [
  {
    to: "/admin/categories",
    title: "Categories",
    description: "Manage visual configuration & tags",
    icon: Palette,
    color: "#494fdf",
  },
  {
    to: "/admin/users",
    title: "Members",
    description: "Manage family access & roles",
    icon: Users,
    color: "#00a87e",
  },
] as const;

const generalSettings = [
  {
    title: "Notifications",
    description: "Daily summaries & alerts",
    icon: Bell,
    color: "#ec7e00",
  },
  {
    title: "App Preferences",
    description: "Display & locale settings",
    icon: Smartphone,
    color: "#191c1f",
  },
  {
    title: "Security",
    description: "Passkeys & session management",
    icon: ShieldCheck,
    color: "#e23b4a",
  },
];

export function SettingsContent() {
  return (
    <div className="w-full min-h-screen flex flex-col bg-white antialiased">
      {/* High-Impact Header */}
      <section className="bg-navi-dark pt-16 pb-20 px-6 md:px-12 flex flex-col gap-4 relative overflow-hidden text-white">
        <div className="space-y-4 relative z-10">
          <p className="text-[12px] font-display font-medium uppercase tracking-[0.25em] opacity-50">
            System Configuration
          </p>
          <h1 className="text-[64px] md:text-[80px] font-display font-medium leading-[0.9] tracking-[-0.04em]">
            Settings
          </h1>
        </div>
      </section>

      <div className="p-6 md:p-12 max-w-5xl space-y-16">
        {/* Admin Management Section */}
        <section className="space-y-8">
          <div className="flex items-center gap-4 px-2">
            <div className="h-1.5 w-8 bg-navi-blue rounded-full" />
            <h3 className="text-[20px] font-display font-medium uppercase tracking-widest text-navi-dark/40">
              Administration
            </h3>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2">
            {adminTiles.map((tile) => {
              const Icon = tile.icon;
              return (
                <Link
                  key={tile.to}
                  to={tile.to}
                  className="group relative flex items-center justify-between p-6 rounded-[24px] transition-all bg-navi-surface border-none active:scale-[0.99] overflow-hidden"
                >
                  <div className="flex items-center gap-6 relative z-10">
                    <div 
                      className="size-14 rounded-full flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 duration-500"
                      style={{ backgroundColor: "white", color: tile.color }}
                    >
                      <Icon className="size-6" strokeWidth={1} />
                    </div>
                    <div className="min-w-0">
                      <h2 className="text-[18px] font-display font-medium text-navi-dark tracking-tight">
                        {tile.title}
                      </h2>
                      <p className="text-[11px] font-display font-medium uppercase tracking-widest text-navi-gray/60 mt-1">
                        {tile.description}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="relative z-10 size-5 text-navi-gray/40 transition-transform group-hover:translate-x-1" strokeWidth={1} />
                </Link>
              );
            })}
          </div>
        </section>

        {/* General Settings Section */}
        <section className="space-y-8">
          <div className="flex items-center gap-4 px-2">
            <div className="h-1.5 w-8 bg-navi-gray/30 rounded-full" />
            <h3 className="text-[20px] font-display font-medium uppercase tracking-widest text-navi-dark/40">
              General
            </h3>
          </div>

          <div className="grid gap-4">
            {generalSettings.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="flex items-center justify-between p-6 rounded-[24px] bg-navi-surface transition-all active:scale-[0.995]"
                >
                  <div className="flex items-center gap-6">
                    <div 
                      className="size-12 rounded-full flex items-center justify-center bg-white text-navi-dark shadow-sm"
                    >
                      <Icon className="size-5" strokeWidth={1} />
                    </div>
                    <div>
                      <h4 className="text-[16px] font-display font-medium text-navi-dark tracking-tight">
                        {item.title}
                      </h4>
                      <p className="text-[10px] font-display font-medium uppercase tracking-widest text-navi-gray/60 mt-0.5">
                        {item.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex h-8 w-14 items-center rounded-full bg-navi-border/30 p-1 transition-colors">
                    <div className="size-6 rounded-full bg-white shadow-sm transition-transform translate-x-0" />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Footer info */}
        <section className="pt-8 text-center space-y-2">
          <p className="text-[10px] font-display font-medium uppercase tracking-[0.3em] text-navi-gray/40">
            Aftermind Finance (NAVI)
          </p>
          <p className="text-[10px] font-display font-medium text-navi-gray/20">
            Version 1.0.4 • 2026 Build
          </p>
        </section>
      </div>
    </div>
  );
}

