import React, { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import {
  ChevronRight,
  Palette,
  Users,
  ShieldCheck,
  Bell,
  Smartphone,
  PiggyBank,
  CreditCard,
  FileUp,
  LogOut,
} from "lucide-react";
import { IconMark } from "@/components/icon-mark";
import { signOut } from "@/lib/auth-client";
import { haptic } from "@/lib/haptics";

const managementTiles = [
  {
    to: "/settings/categories",
    title: "Categories",
    description: "Manage visual configuration & tags",
    icon: Palette,
    color: "#494fdf",
  },
  {
    to: "/settings/users",
    title: "Members",
    description: "Manage family access & roles",
    icon: Users,
    color: "#00a87e",
  },
  {
    to: "/settings/savings",
    title: "Savings Goals",
    description: "Manage targets & goals",
    icon: PiggyBank,
    color: "#ec7e00",
  },
  {
    to: "/settings/credit-cards",
    title: "Credit Cards",
    description: "Manage debt & limits",
    icon: CreditCard,
    color: "#e23b4a",
  },
  {
    to: "/import",
    title: "Import Data",
    description: "Bring in transactions from CSV",
    icon: FileUp,
    color: "#8d969e",
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
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const checkStandalone =
        window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as any).standalone === true;
      setIsStandalone(checkStandalone);
    }
  }, []);

  return (
    <div className="w-full min-h-dvh flex flex-col bg-white antialiased">
      {/* High-Impact Header */}
      <section className="bg-navi-dark pt-[calc(env(safe-area-inset-top,0px)+64px)] pb-20 px-6 md:px-12 flex flex-col gap-4 relative overflow-hidden text-white">
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
        {/* Management Section */}
        <section className="space-y-8">
          <div className="flex items-center gap-4 px-2">
            <div className="h-1.5 w-8 bg-navi-blue rounded-full" />
            <h3 className="text-[20px] font-display font-medium uppercase tracking-widest text-navi-dark/40">
              Management
            </h3>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {managementTiles.map((tile) => {
              const Icon = tile.icon;
              return (
                <Link
                  key={tile.to}
                  to={tile.to}
                  className="navi-card flex items-center justify-between p-6 border-none overflow-hidden group"
                >
                  <div className="flex items-center gap-4 relative z-10">
                    <IconMark icon={Icon} color={tile.color} size="lg" />
                    <div className="min-w-0">
                      <h2 className="text-[18px] font-display font-medium text-navi-dark tracking-tight">
                        {tile.title}
                      </h2>
                      <p className="text-[11px] font-sans font-medium uppercase tracking-widest text-navi-gray/60 mt-1">
                        {tile.description}
                      </p>
                    </div>
                  </div>
                  <ChevronRight
                    className="relative z-10 size-5 text-navi-gray/40 transition-transform group-hover:translate-x-1"
                    strokeWidth={1.2}
                  />
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
                <div key={item.title} className="navi-card flex items-center justify-between p-6">
                  <div className="flex items-center gap-4">
                    <IconMark icon={Icon} color={item.color} size="lg" />
                    <div>
                      <h4 className="text-[16px] font-display font-medium text-navi-dark tracking-tight">
                        {item.title}
                      </h4>
                      <p className="text-[10px] font-sans font-medium uppercase tracking-widest text-navi-gray/60 mt-0.5">
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

        {/* App Installation Status Section */}
        <section className="space-y-8">
          <div className="flex items-center gap-4 px-2">
            <div className="h-1.5 w-8 bg-navi-blue rounded-full" />
            <h3 className="text-[20px] font-display font-medium uppercase tracking-widest text-navi-dark/40">
              App Installation
            </h3>
          </div>

          <div className="navi-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 border-none">
            <div className="flex items-center gap-4">
              <IconMark icon={Smartphone} color="#00a87e" size="lg" />
              <div>
                <h4 className="text-[18px] font-display font-medium text-navi-dark tracking-tight">
                  {isStandalone ? "Installed Standalone PWA" : "Running in Web Browser"}
                </h4>
                <p className="text-[10px] font-sans font-medium uppercase tracking-widest text-navi-gray/60 mt-1">
                  {isStandalone
                    ? "NAVI is running in fullscreen standalone mode with native system resources."
                    : "Install as a progressive web app to unlock full-bleed safe areas and quick access."}
                </p>
              </div>
            </div>

            {!isStandalone && (
              <button
                type="button"
                onClick={() => window.dispatchEvent(new CustomEvent("trigger-pwa-install-flow"))}
                className="h-12 px-6 rounded-pill bg-[#494fdf] text-white font-display font-medium tracking-widest text-[10px] uppercase hover:bg-[#494fdf]/90 transition-all text-center shrink-0"
              >
                Install App
              </button>
            )}
            {isStandalone && (
              <span className="h-10 px-4 flex items-center rounded-pill bg-navi-teal/10 text-navi-teal font-display font-medium tracking-widest text-[10px] uppercase shrink-0 border border-navi-teal/20">
                Active
              </span>
            )}
          </div>
        </section>

        {/* Account Section */}
        <section className="space-y-8">
          <div className="flex items-center gap-4 px-2">
            <div className="h-1.5 w-8 bg-navi-danger/40 rounded-full" />
            <h3 className="text-[20px] font-display font-medium uppercase tracking-widest text-navi-dark/40">
              Account
            </h3>
          </div>

          <button
            type="button"
            onClick={() => {
              haptic.medium();
              void signOut();
            }}
            className="navi-card flex w-full items-center gap-4 p-6 text-left transition-transform active:scale-[0.99]"
          >
            <IconMark icon={LogOut} color="#e23b4a" size="lg" />
            <div>
              <h4 className="text-[16px] font-display font-medium text-navi-danger tracking-tight">
                Log out
              </h4>
              <p className="text-[10px] font-sans font-medium uppercase tracking-widest text-navi-gray/60 mt-0.5">
                Sign out of NAVI on this device
              </p>
            </div>
          </button>
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
