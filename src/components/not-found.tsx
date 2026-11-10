import { Link } from "@tanstack/react-router";
import { MoveLeft, Search } from "lucide-react";
import { Button } from "./ui/button";
import { IconMark } from "@/components/icon-mark";

export function NotFound() {
  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top,rgba(45,212,191,0.14),transparent_28%),linear-gradient(180deg,rgba(248,251,251,1)_0%,rgba(241,249,248,1)_100%)] px-4 py-10 text-foreground">
      {/* Background elements */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 -top-32 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -right-24 -bottom-32 h-80 w-80 rounded-full bg-cyan-400/10 blur-3xl" />
      </div>

      <div className="relative flex flex-col items-center text-center">
        {/* Icon with animated border */}
        <IconMark icon={Search} size="2xl" className="mb-8 text-primary" />

        {/* 404 Text */}
        <div className="mb-4">
          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/60">
            Error 404
          </span>
          <h1 className="mt-2 text-5xl font-black tracking-tighter uppercase italic text-foreground sm:text-7xl">
            Lost in Space
          </h1>
        </div>

        <p className="max-w-[400px] text-lg font-medium text-muted-foreground/80">
          The page you're looking for doesn't exist or has been moved to another dimension.
        </p>

        {/* Back Button */}
        <div className="mt-12">
          <Link to="/">
            <Button className="group h-14 rounded-2xl bg-foreground px-8 text-base text-background shadow-2xl transition-all hover:scale-105">
              <span className="flex items-center gap-3">
                <MoveLeft className="size-5 transition-transform group-hover:-translate-x-1" />
                Back to Dashboard
              </span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Modern footer detail */}
      <div className="absolute bottom-12 flex items-center gap-4 opacity-20">
        <div className="h-px w-8 bg-foreground" />
        <img src="/icon.svg" alt="Navi" className="h-4 w-4" />
        <div className="h-px w-8 bg-foreground" />
      </div>
    </main>
  );
}
