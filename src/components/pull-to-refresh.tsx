"use client";

import React, { useEffect, useRef, useReducer } from "react";
import { RefreshCcw } from "lucide-react";
import { cn } from "@/lib/utils";

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
}

export function PullToRefresh({ onRefresh, children }: PullToRefreshProps) {
  const [state, dispatch] = useReducer(
    (
      state: { pullDistance: number; isRefreshing: boolean; isEnabled: boolean },
      action: { type: string; payload?: any },
    ) => {
      switch (action.type) {
        case "SET_ENABLED":
          return { ...state, isEnabled: action.payload };
        case "SET_PULL_DISTANCE":
          return { ...state, pullDistance: action.payload };
        case "START_REFRESH":
          return { ...state, isRefreshing: true, pullDistance: action.payload };
        case "STOP_REFRESH":
          return { ...state, isRefreshing: false, pullDistance: 0 };
        default:
          return state;
      }
    },
    { pullDistance: 0, isRefreshing: false, isEnabled: true },
  );

  const { pullDistance, isRefreshing, isEnabled } = state;

  const startY = useRef(0);
  const isPulling = useRef(false);

  const PULL_THRESHOLD = 70;
  const MAX_PULL = 120;

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      // Only trigger if we are at the top of the page
      if (window.scrollY > 5) {
        dispatch({ type: "SET_ENABLED", payload: false });
        return;
      }
      dispatch({ type: "SET_ENABLED", payload: true });
      startY.current = e.touches[0].pageY;
      isPulling.current = true;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isPulling.current || isRefreshing || !isEnabled) return;

      const currentY = e.touches[0].pageY;
      const diff = currentY - startY.current;

      if (diff > 0) {
        // Apply resistance
        const distance = Math.min(diff * 0.4, MAX_PULL);
        dispatch({ type: "SET_PULL_DISTANCE", payload: distance });

        // Prevent browser's native pull-to-refresh if we are handling it
        if (diff > 10 && e.cancelable) {
          e.preventDefault();
        }
      } else {
        isPulling.current = false;
        dispatch({ type: "SET_PULL_DISTANCE", payload: 0 });
      }
    };

    const handleTouchEnd = async () => {
      if (!isPulling.current || isRefreshing || !isEnabled) return;
      isPulling.current = false;

      if (pullDistance >= PULL_THRESHOLD) {
        dispatch({ type: "START_REFRESH", payload: PULL_THRESHOLD });
        try {
          await onRefresh();
        } catch (error) {
          console.error("Refresh failed:", error);
        } finally {
          dispatch({ type: "STOP_REFRESH" });
        }
      } else {
        dispatch({ type: "SET_PULL_DISTANCE", payload: 0 });
      }
    };

    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: false });
    window.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [pullDistance, isRefreshing, isEnabled, onRefresh]);

  return (
    <div className="relative w-full">
      {/* Pull indicator */}
      <div
        className={cn(
          "fixed left-1/2 -translate-x-1/2 flex items-center justify-center z-100 transition-opacity duration-200 pointer-events-none",
          pullDistance > 10 || isRefreshing ? "opacity-100" : "opacity-0",
        )}
        style={{
          top: isRefreshing ? 20 : Math.max(-40, pullDistance - 40),
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
        className={cn("transition-transform", !isPulling.current && "duration-300")}
        style={{
          transform: isRefreshing ? "translateY(60px)" : `translateY(${pullDistance * 0.4}px)`,
        }}
      >
        {children}
      </div>
    </div>
  );
}
