import React, { useEffect, useState } from "react";
import { X, Share, Plus, Sparkles, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function PwaInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isDismissed, setIsDismissed] = useState(true); // Default to true during hydration

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Detect Standalone Mode (already installed)
    const checkStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;
    setIsStandalone(checkStandalone);

    // Detect iOS Browser
    const checkIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(checkIOS);

    // Retrieve dismissal state from local storage
    const dismissed = localStorage.getItem("pwa-install-prompt-dismissed") === "true";
    setIsDismissed(dismissed);

    // Listen to Android/Chrome beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // If not previously dismissed, show the prompt banner
      if (!dismissed) {
        setIsDismissed(false);
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // Custom event to trigger installer from settings page
    const handleTriggerInstall = () => {
      setIsDismissed(false);
    };
    window.addEventListener("trigger-pwa-install-flow", handleTriggerInstall);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("trigger-pwa-install-flow", handleTriggerInstall);
    };
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem("pwa-install-prompt-dismissed", "true");
  };

  const handleAndroidInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const choiceResult = await deferredPrompt.userChoice;
    if (choiceResult.outcome === "accepted") {
      setIsDismissed(true);
      localStorage.setItem("pwa-install-prompt-dismissed", "true");
    }
    setDeferredPrompt(null);
  };

  // If already installed standalone, don't render anything
  if (isStandalone) return null;

  // If dismissed or neither iOS nor Android prompt available, don't show automatically
  if (isDismissed && !deferredPrompt && !isIOS) return null;

  // Render modal / banner
  return (
    <div
      className={`fixed bottom-28 md:bottom-8 left-1/2 -translate-x-1/2 z-210 w-[min(92vw,480px)] transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${isDismissed ? "translate-y-48 opacity-0 pointer-events-none" : "translate-y-0 opacity-100"}`}
    >
      <div className="bg-navi-dark text-white rounded-premium border border-white/10 p-6 pb-8 flex flex-col gap-6 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)]">
        {/* Banner Title Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="size-11 rounded-[16px] bg-white/10 border border-white/20 flex items-center justify-center text-navi-teal shrink-0">
              <Smartphone className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <p className="text-[10px] font-display font-medium uppercase tracking-[0.25em] text-white/50">
                  Application Setup
                </p>
                <Sparkles className="size-3 text-navi-teal fill-navi-teal" />
              </div>
              <h3 className="text-xl font-display font-medium tracking-tight mt-0.5">
                Install Project NAVI
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={handleDismiss}
            className="size-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors"
            aria-label="Dismiss"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Dynamic Instructional Content */}
        {isIOS ? (
          <div className="space-y-4">
            <p className="text-xs font-sans text-white/70 leading-relaxed">
              Add NAVI directly to your iPhone/iPad home screen to access high-fidelity dashboard
              charts, quick transfer widgets, and offline balance sync.
            </p>
            <div className="space-y-3 bg-white/5 border border-white/10 rounded-premium p-4 text-xs">
              <div className="flex items-center gap-3">
                <span className="flex size-6 items-center justify-center rounded-full bg-white/10 font-display font-medium text-[10px]">
                  1
                </span>
                <span className="flex items-center gap-1.5 text-white/80">
                  Tap the <Share className="size-4 text-navi-blue inline" strokeWidth={2} /> share
                  icon in Safari
                </span>
              </div>
              <div className="h-px bg-white/5" />
              <div className="flex items-center gap-3">
                <span className="flex size-6 items-center justify-center rounded-full bg-white/10 font-display font-medium text-[10px]">
                  2
                </span>
                <span className="flex items-center gap-1.5 text-white/80">
                  Choose{" "}
                  <span className="font-bold flex items-center gap-1">
                    Add to Home Screen{" "}
                    <Plus className="size-3.5 inline border border-white/20 p-0.5 rounded" />
                  </span>{" "}
                  from the list
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-xs font-sans text-white/70 leading-relaxed">
              Install the finance protocol to your device for smooth animations, custom offline
              capabilities, and family expense tracking.
            </p>
          </div>
        )}

        {/* Buttons / Actions */}
        <div className="flex items-center gap-3 mt-1">
          <Button
            type="button"
            variant="ghost"
            className="flex-1 h-12 rounded-pill border border-white/10 bg-white/5 text-white font-display font-medium tracking-widest text-[10px] uppercase hover:bg-white/10"
            onClick={handleDismiss}
          >
            Later
          </Button>

          {!isIOS && deferredPrompt && (
            <Button
              type="button"
              className="flex-1 h-12 rounded-pill bg-[#00a87e] text-white font-display font-medium tracking-widest text-[10px] uppercase hover:bg-[#00a87e]/90"
              onClick={handleAndroidInstall}
            >
              Install Now
            </Button>
          )}

          {isIOS && (
            <Button
              type="button"
              className="flex-1 h-12 rounded-pill bg-[#494fdf] text-white font-display font-medium tracking-widest text-[10px] uppercase hover:bg-[#494fdf]/90"
              onClick={handleDismiss}
            >
              Got it
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
