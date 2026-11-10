"use client";

import React, { useEffect, useRef, useState } from "react";
import { RefreshCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { haptic } from "@/lib/haptics";

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
}

const PULL_THRESHOLD = 70;
const MAX_PULL = 120;
const RESISTANCE = 0.4;

/**
 * Pull-to-refresh for the page content.
 *
 * Listeners are attached to the content wrapper, not `window`, so gestures in
 * portaled sheets and dialogs never trigger a refresh or move the page behind
 * them. Gesture state lives in refs so listeners are attached exactly once.
 */
export function PullToRefresh({ onRefresh, children }: PullToRefreshProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const onRefreshRef = useRef(onRefresh);
  onRefreshRef.current = onRefresh;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let startY = 0;
    let tracking = false;
    let distance = 0;
    let refreshing = false;
    let passedThreshold = false;

    const update = (value: number) => {
      distance = value;
      setPullDistance(value);
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (refreshing || window.scrollY > 0 || e.touches.length !== 1) {
        tracking = false;
        return;
      }
      tracking = true;
      passedThreshold = false;
      startY = e.touches[0].clientY;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!tracking) return;

      const diff = e.touches[0].clientY - startY;
      if (diff <= 0 || window.scrollY > 0) {
        // Scrolling up into the content: hand the gesture back to the browser.
        tracking = false;
        setIsDragging(false);
        update(0);
        return;
      }

      setIsDragging(true);
      const next = Math.min(diff * RESISTANCE, MAX_PULL);
      update(next);

      if (next >= PULL_THRESHOLD && !passedThreshold) {
        passedThreshold = true;
        haptic.light();
      } else if (next < PULL_THRESHOLD) {
        passedThreshold = false;
      }

      if (e.cancelable) e.preventDefault();
    };

    const handleTouchEnd = async () => {
      if (!tracking) return;
      tracking = false;
      setIsDragging(false);

      if (distance < PULL_THRESHOLD) {
        update(0);
        return;
      }

      refreshing = true;
      setIsRefreshing(true);
      try {
        await onRefreshRef.current();
        haptic.success();
      } catch (error) {
        console.error("Refresh failed:", error);
      } finally {
        refreshing = false;
        setIsRefreshing(false);
        update(0);
      }
    };

    el.addEventListener("touchstart", handleTouchStart, { passive: true });
    el.addEventListener("touchmove", handleTouchMove, { passive: false });
    el.addEventListener("touchend", handleTouchEnd, { passive: true });
    el.addEventListener("touchcancel", handleTouchEnd, { passive: true });

    return () => {
      el.removeEventListener("touchstart", handleTouchStart);
      el.removeEventListener("touchmove", handleTouchMove);
      el.removeEventListener("touchend", handleTouchEnd);
      el.removeEventListener("touchcancel", handleTouchEnd);
    };
  }, []);

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Pull indicator */}
      <div
        className={cn(
          "fixed left-1/2 -translate-x-1/2 flex items-center justify-center z-100 transition-opacity duration-200 pointer-events-none",
          pullDistance > 10 || isRefreshing ? "opacity-100" : "opacity-0",
        )}
        style={{
          top: isRefreshing
            ? "calc(env(safe-area-inset-top, 0px) + 16px)"
            : `calc(env(safe-area-inset-top, 0px) + ${Math.max(-40, pullDistance - 40)}px)`,
        }}
      >
        <div className="bg-white rounded-full p-2.5 shadow-[0_4px_20px_rgba(0,0,0,0.1)] border border-navi-border/20">
          <RefreshCcw
            className={cn("size-5 text-navi-blue", isRefreshing && "animate-spin")}
            style={{
              transform: isRefreshing ? undefined : `rotate(${pullDistance * 4}deg)`,
            }}
          />
        </div>
      </div>

      {/* Content wrapper */}
      <div
        className={cn(!isDragging && "transition-transform duration-300")}
        style={{
          // Leave `transform` unset at rest: even translateY(0) would turn this
          // wrapper into the containing block for fixed-position page elements.
          transform: isRefreshing
            ? "translateY(60px)"
            : pullDistance > 0
              ? `translateY(${pullDistance * 0.4}px)`
              : undefined,
        }}
      >
        {children}
      </div>
    </div>
  );
}
