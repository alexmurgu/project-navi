import { useRouter } from "@tanstack/react-router";
import { AlertCircle, ChevronDown, ChevronUp, RefreshCcw } from "lucide-react";
import { useState } from "react";
import { Button } from "./ui/button";
import { IconMark } from "@/components/icon-mark";

interface RouteErrorProps {
  error: Error;
  reset?: () => void;
}

export function RouteError({ error, reset }: RouteErrorProps) {
  const router = useRouter();
  const [showDetails, setShowDetails] = useState(false);

  const handleRetry = () => {
    if (reset) {
      reset();
    }
    router.invalidate();
  };

  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top,rgba(239,68,68,0.08),transparent_28%),linear-gradient(180deg,rgba(248,251,251,1)_0%,rgba(241,249,248,1)_100%)] px-4 py-10 text-foreground">
      {/* Background elements */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 -top-32 h-72 w-72 rounded-full bg-destructive/5 blur-3xl" />
        <div className="absolute -right-24 -bottom-32 h-80 w-80 rounded-full bg-orange-400/5 blur-3xl" />
      </div>

      <div className="relative flex w-full max-w-[500px] flex-col items-center text-center">
        {/* Icon */}
        <IconMark icon={AlertCircle} size="2xl" className="mb-8 text-destructive" />

        {/* Error Text */}
        <div className="mb-4">
          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-destructive/60">
            System Error
          </span>
          <h1 className="mt-2 text-4xl font-black tracking-tighter uppercase italic text-foreground sm:text-5xl">
            Something tripped
          </h1>
        </div>

        <p className="mb-8 text-lg font-medium text-muted-foreground/80">
          An unexpected error occurred while processing your request. Don't worry, we're on it.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col items-center gap-4 sm:flex-row">
          <Button
            onClick={handleRetry}
            className="group h-14 rounded-2xl bg-foreground px-8 text-base text-background shadow-2xl transition-all hover:scale-105"
          >
            <span className="flex items-center gap-3">
              <RefreshCcw className="size-5 transition-transform group-hover:rotate-180 duration-500" />
              Try Again
            </span>
          </Button>

          <Button
            variant="ghost"
            onClick={() => setShowDetails(!showDetails)}
            className="h-14 rounded-2xl px-6 font-black uppercase tracking-widest text-[10px]"
          >
            <span className="flex items-center gap-2">
              {showDetails ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
              {showDetails ? "Hide Details" : "Show Details"}
            </span>
          </Button>
        </div>

        {/* Details Panel */}
        {showDetails && (
          <div className="mt-8 w-full animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="overflow-hidden rounded-2xl border border-destructive/10 bg-white/50 p-4 text-left shadow-inner backdrop-blur-sm">
              <p className="font-mono text-xs font-semibold uppercase tracking-wider text-destructive/70 mb-2">
                Technical Details
              </p>
              <pre className="max-h-[150px] overflow-auto whitespace-pre-wrap font-mono text-[11px] leading-relaxed text-muted-foreground select-all">
                {error.message || "No error message provided"}
                {error.stack && `\n\n${error.stack.split("\n").slice(0, 3).join("\n")}`}
              </pre>
            </div>
          </div>
        )}
      </div>

      {/* Modern footer detail */}
      <div className="absolute bottom-12 flex items-center gap-4 opacity-10">
        <div className="h-px w-8 bg-foreground" />
        <img src="/icon.svg" alt="Navi" className="h-4 w-4" />
        <div className="h-px w-8 bg-foreground" />
      </div>
    </main>
  );
}
